/**
 * SentenceEngine — dynamic Spanish sentence generator for fill-in-the-blank drills.
 *
 * Guadalajara Spanish Tutor project. Sentences are NEVER stored: every exercise
 * is assembled on demand from the dictionary, respecting gender/number agreement
 * and using ONLY the verb conjugations that exist in the dictionary
 * (present / preterite / imperfect — no future, conditional, or subjunctive).
 *
 * Scope: B2-and-below grammar. Up to 3 blanks per sentence. Blanks can test
 * verbs, nouns, adjectives, and pronouns (subject, possessive, direct-object,
 * indirect-object, reflexive, double-object).
 *
 * Leitner-aware: target words are chosen with weighting that favors low boxes
 * and due cards, so the battery reinforces what is least familiar.
 *
 * Step-aware (Session 26): a 9-step difficulty ladder mirrors the chronological
 * order the 4-week class actually taught these structures. Each step unlocks
 * either new templates or new tenses for already-unlocked templates. Advancing
 * is one-way (no demotion) and gated on rolling accuracy for that step's own
 * newly-introduced content. Steps blend into each other near the gate (tapering)
 * rather than cutting over abruptly — see taperFraction()/recordStepProgress().
 *
 * Public API:
 *   var model = SentenceEngine.classify(entries);
 *   var battery = SentenceEngine.generateBattery(model, {count:50, mode:'typed'|'choice', rng:fn,
 *                                                          stepIndex:n, taper:0..1});
 *   var grades = SentenceEngine.gradeExercise(exercise, perBlankCorrect);  // -> [{word, knew}]
 *   var result = SentenceEngine.recordStepProgress(progress, exercise, perBlankCorrect, stepIndex);
 *
 * Companion spec lives in grammar_reference.md ("Sentence Construction & Generation Spec").
 * Keep the two in sync. Browser global SentenceEngine; Node module.exports.
 */
var SentenceEngine = (function () {
  'use strict';

  // ── Persons ───────────────────────────────────────────────────────────────
  // conjKey maps to the dictionary's conjugation keys. No vosotros (Mexican).
  var PERSONS = [
    { id: 'yo',    subj: 'yo',       conjKey: 'yo',          num: 'sing', gender: null, refl: 'me', io: 'me', doObj: 'me' },
    { id: 'tu',    subj: 'tú',       conjKey: 'tú',          num: 'sing', gender: null, refl: 'te', io: 'te', doObj: 'te' },
    { id: 'el',    subj: 'él',       conjKey: 'él/ella',     num: 'sing', gender: 'm',  refl: 'se', io: 'le', doObj: 'lo' },
    { id: 'ella',  subj: 'ella',     conjKey: 'él/ella',     num: 'sing', gender: 'f',  refl: 'se', io: 'le', doObj: 'la' },
    { id: 'nos',   subj: 'nosotros', conjKey: 'nosotros',    num: 'plur', gender: 'm',  refl: 'nos', io: 'nos', doObj: 'nos' },
    { id: 'ellos', subj: 'ellos',    conjKey: 'ellos/ellas', num: 'plur', gender: 'm',  refl: 'se', io: 'les', doObj: 'los' }
  ];
  function personById(id) { for (var i = 0; i < PERSONS.length; i++) if (PERSONS[i].id === id) return PERSONS[i]; return null; }
  // Persons whose conjugated forms are person-unique (safe to blank the subject pronoun)
  var UNIQUE_SUBJ_PERSONS = ['yo', 'tu', 'nos', 'ellos'];

  var ALL_SUBJ_PRON  = ['yo', 'tú', 'él', 'ella', 'nosotros', 'ellos'];
  var ALL_POSS_SING  = ['mi', 'tu', 'su', 'nuestro', 'nuestra'];
  var ALL_POSS_PLUR  = ['mis', 'tus', 'sus', 'nuestros', 'nuestras'];
  var ALL_DO         = ['lo', 'la', 'los', 'las', 'me', 'te', 'nos'];
  var ALL_IO         = ['me', 'te', 'le', 'nos', 'les'];
  var ALL_REFL       = ['me', 'te', 'se', 'nos'];
  var ALL_ART_DEF    = ['el', 'la', 'los', 'las'];

  // ── Tense cue phrases (front-of-sentence triggers) ────────────────────────
  var CUES = {
    present:   ['Todos los días', 'Normalmente', 'Cada mañana', 'Siempre', 'Ahora'],
    preterite: ['Ayer', 'Anoche', 'La semana pasada', 'El año pasado', 'Esta mañana'],
    imperfect: ['Cuando era niño', 'Antes', 'De vez en cuando, antes', 'En aquellos años'],
    presenteContinuo: ['En este momento', 'Ahora mismo', 'Justo ahora', 'En este preciso momento'],
    preteritoPerfecto: ['Hoy ya', 'Esta semana', 'Por fin', 'Esta mañana ya']
  };

  // ── Small utilities ───────────────────────────────────────────────────────
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function endsVowel(s) { return /[aeiouáéíóú]$/i.test(s); }
  function pluralize(s) { return endsVowel(s) ? s + 's' : s + 'es'; }
  function cleanWord(w) { return (w || '').replace(/\(.*?\)/g, '').split('/')[0].trim(); }

  function makeRng(rng) { return typeof rng === 'function' ? rng : Math.random; }
  function pick(arr, rng) { return arr[Math.floor(makeRng(rng)() * arr.length)]; }
  function shuffle(arr, rng) {
    var a = arr.slice(), r = makeRng(rng);
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // ── Noun gender/number from part_of_speech ────────────────────────────────
  function nounGN(entry) {
    var p = entry.part_of_speech || '';
    var gender = /\(f/.test(p) ? 'f' : 'm';
    var num = /pl\)/.test(p) ? 'plur' : 'sing';
    return { gender: gender, num: num };
  }

  // ── Adjective agreement forms ─────────────────────────────────────────────
  function adjForms(entry) {
    var w = cleanWord(entry.word);
    var ms, fs;
    if (/o$/.test(w)) { ms = w; fs = w.slice(0, -1) + 'a'; }
    else if (/dor$/.test(w)) { ms = w; fs = w + 'a'; }
    else { ms = w; fs = w; } // invariable by gender (-e, -consonant, etc.)
    return { ms: ms, fs: fs, mp: pluralize(ms), fp: pluralize(fs), genderVaries: ms !== fs };
  }
  function adjFor(entry, gender, num) {
    var f = adjForms(entry);
    if (gender === 'f') return num === 'plur' ? f.fp : f.fs;
    return num === 'plur' ? f.mp : f.ms;
  }

  // ── Possessive resolution ─────────────────────────────────────────────────
  function possFor(personId, gender, num) {
    var plural = num === 'plur';
    switch (personId) {
      case 'yo':  return plural ? 'mis' : 'mi';
      case 'tu':  return plural ? 'tus' : 'tu';
      case 'el': case 'ella': case 'ellos': return plural ? 'sus' : 'su';
      case 'nos': return 'nuestr' + (gender === 'f' ? 'a' : 'o') + (plural ? 's' : '');
      default: return 'su';
    }
  }

  // ── Direct-object / article resolution ────────────────────────────────────
  function doFor(gender, num) {
    if (gender === 'f') return num === 'plur' ? 'las' : 'la';
    return num === 'plur' ? 'los' : 'lo';
  }
  function defArt(gender, num) {
    if (gender === 'f') return num === 'plur' ? 'las' : 'la';
    return num === 'plur' ? 'los' : 'el';
  }
  function indefArt(gender, num) {
    if (gender === 'f') return num === 'plur' ? 'unas' : 'una';
    return num === 'plur' ? 'unos' : 'un';
  }
  // Feminine nouns beginning with a stressed a-/ha- take 'el'/'un' in the SINGULAR
  // (e.g. el agua, un águila) while still agreeing feminine elsewhere. Flagged in the dictionary.
  function elBeforeStressedA(noun) {
    return (noun.grammar_rule || '').indexOf("takes 'el' before stressed a-") >= 0;
  }
  function defArtForNoun(noun, num) {
    var gn = nounGN(noun);
    if (gn.gender === 'f' && num === 'sing' && elBeforeStressedA(noun)) return 'el';
    return defArt(gn.gender, num);
  }
  function indefArtForNoun(noun, num) {
    var gn = nounGN(noun);
    if (gn.gender === 'f' && num === 'sing' && elBeforeStressedA(noun)) return 'un';
    return indefArt(gn.gender, num);
  }

  // ── Reflexive / gustar parsing ────────────────────────────────────────────
  function isReflexive(entry) {
    return /reflexive/.test(entry.part_of_speech || '') ||
      (/se$/.test(entry.word || '') && entry.present_conjugation);
  }
  function splitReflexive(form) {
    // "me acuesto" -> {pron:'me', verb:'acuesto'}
    var m = (form || '').match(/^(me|te|se|nos)\s+(.+)$/);
    return m ? { pron: m[1], verb: m[2] } : null;
  }
  function isGustar(entry) {
    return entry.present_conjugation && entry.present_conjugation.hasOwnProperty('me') &&
      !entry.present_conjugation.hasOwnProperty('yo');
  }
  function splitGustar(str) {
    // "gusta / gustan" -> {sing:'gusta', plur:'gustan'}
    var parts = (str || '').split('/').map(function (s) { return s.trim(); });
    return { sing: parts[0] || str, plur: parts[1] || parts[0] || str };
  }

  // ── Tense object retrieval ────────────────────────────────────────────────
  function tenseObj(entry, tense) {
    if (tense === 'present') return entry.present_conjugation;
    if (tense === 'preterite') return entry.preterite_conjugation;
    if (tense === 'imperfect') return entry.imperfect_conjugation;
    return null;
  }
  function hasFullTense(entry, tense) {
    var o = tenseObj(entry, tense);
    if (!o) return false;
    var keys = ['yo', 'tú', 'él/ella', 'nosotros', 'ellos/ellas'];
    for (var i = 0; i < keys.length; i++) if (!o[keys[i]]) return false;
    return true;
  }

  // ── Classification ────────────────────────────────────────────────────────
  function classify(entries) {
    var model = {
      entries: entries,
      byWord: {},
      verbs: [],        // standard, non-reflexive, non-gustar, full present
      reflexives: [],
      gustars: [],
      nouns: [],        // singular common nouns with clean gender
      adjectives: [],
      adjGender: []      // adjectives whose form varies by gender (good for contrast)
    };
    entries.forEach(function (e) { model.byWord[e.word] = e; });

    entries.forEach(function (e) {
      var pos = e.part_of_speech || '';
      if (e.present_conjugation) {
        if (isGustar(e)) { model.gustars.push(e); return; }
        if (isReflexive(e)) {
          if (hasFullTense(e, 'present')) model.reflexives.push(e);
          return;
        }
        if (hasFullTense(e, 'present')) model.verbs.push(e);
        return;
      }
      // nouns: simple singular m/f nouns (skip pronoun-ish grammar terms)
      if (/^noun \((m|f)\)$/.test(pos) || /^noun phrase \((m|f)\)$/.test(pos)) {
        model.nouns.push(e);
      }
      if (pos === 'adjective') {
        model.adjectives.push(e);
        if (adjForms(e).genderVaries) model.adjGender.push(e);
      }
    });
    return model;
  }

  // ── Leitner weighting ─────────────────────────────────────────────────────
  function leitnerWeight(entry) {
    var box = entry.leitner_box || 1;            // 1..5
    var base = (6 - box);                        // box1->5 ... box5->1
    var due = (entry.leitner_sessions_until_due || 0) <= 0;
    return due ? base * 2 : base;                // due cards doubled
  }
  function weightedPick(arr, rng) {
    if (!arr.length) return null;
    var r = makeRng(rng), total = 0, i;
    for (i = 0; i < arr.length; i++) total += leitnerWeight(arr[i]);
    var t = r() * total, acc = 0;
    for (i = 0; i < arr.length; i++) { acc += leitnerWeight(arr[i]); if (t <= acc) return arr[i]; }
    return arr[arr.length - 1];
  }

  // ── Distractor builders (for multiple-choice mode) ────────────────────────
  function distractVerb(entry, tense, conjKey, rng) {
    var o = tenseObj(entry, tense) || {};
    var forms = [];
    Object.keys(o).forEach(function (k) { if (o[k]) forms.push(o[k]); });
    return forms;
  }
  function uniqueOptions(answer, pool, n, rng) {
    var opts = [answer], seen = {}; seen[answer.toLowerCase()] = 1;
    var sh = shuffle(pool, rng);
    for (var i = 0; i < sh.length && opts.length < n; i++) {
      var v = sh[i];
      if (v && !seen[v.toLowerCase()]) { seen[v.toLowerCase()] = 1; opts.push(v); }
    }
    return shuffle(opts, rng);
  }

  // ── Blank + token helpers ─────────────────────────────────────────────────
  function blank(role, answer, opts) {
    opts = opts || {};
    return {
      role: role,
      answer: answer,
      options: opts.options || null,
      wordKey: opts.wordKey || null,   // dictionary word for Leitner writeback
      gloss: opts.gloss || null,       // English gloss (revealed on request)
      note: opts.note || null          // grammar note (revealed on request)
    };
  }
  function T(v) { return { t: 'text', v: v }; }
  function B(b) { return { t: 'blank', b: b }; }

  function finalize(id, tense, personId, parts, rng) {
    var blanks = [];
    parts.forEach(function (p) { if (p.t === 'blank') blanks.push(p.b); });
    if (!blanks.length || blanks.length > 3) return null;
    // build display + answer strings
    var display = '', filled = '';
    parts.forEach(function (p) {
      if (p.t === 'text') { display += p.v; filled += p.v; }
      else { display += '____'; filled += p.b.answer; }
    });
    return {
      id: id, tense: tense, personId: personId,
      parts: parts, blanks: blanks,
      display: display.trim(), filled: filled.trim(),
      key: id + '|' + filled.trim().toLowerCase()
    };
  }

  // Bias nouns toward readable concrete categories for subjects/objects
  var SUBJECT_CATS = ['Animales', 'Familia y relaciones', 'Alimentación', 'Casa y hogar', 'Ciudad y transporte', 'Descripción personal'];

  // Reflexive verbs that form a complete clause without a direct object
  var ROUTINE_REFLEXIVES = ['levantarse', 'acostarse', 'bañarse', 'ducharse', 'despertarse',
    'vestirse', 'peinarse', 'maquillarse', 'afeitarse', 'dormirse', 'divertirse', 'relajarse', 'sentarse'];

  // Decide SER vs ESTAR from an adjective's grammar_rule tag
  function copulaForAdj(entry, rng) {
    var gr = entry.grammar_rule || '';
    if (/used with ESTAR/.test(gr)) return 'estar';
    if (/used with SER/.test(gr)) return 'ser';
    if (/SER.*ESTAR.*meaning shifts/.test(gr)) return makeRng(rng)() < 0.5 ? 'ser' : 'estar';
    return 'ser';
  }

  // ── Light semantic layer ──────────────────────────────────────────────────
  // Coarse classes keep noun↔adjective↔verb pairings sensible in context.
  function hasCat(e, c) { return (e.categories || []).indexOf(c) >= 0; }
  function nounClass(e) {
    if (hasCat(e, 'Animales')) return 'animal';
    if (hasCat(e, 'Familia y relaciones') || hasCat(e, 'Descripción personal')) return 'person';
    if (hasCat(e, 'Anatomía y cuerpo')) return 'body';
    if (hasCat(e, 'Alimentación')) return 'food';
    if (hasCat(e, 'Ropa y accesorios')) return 'clothing';
    if (hasCat(e, 'Ciudad y transporte') || hasCat(e, 'Casa y hogar') || hasCat(e, 'Orientación y direcciones')) return 'place';
    return 'thing';
  }
  // Adjectives that read fine on inanimate things too (size/aesthetic/quality)
  var NEUTRAL_ADJ = ['grande', 'bonito', 'feo', 'viejo', 'nuevo', 'largo', 'pequeño',
    'caro', 'barato', 'bueno/buen', 'malo/mal', 'corto', 'limpio', 'sucio'];
  // adjDomain: 'animate' (living beings), 'food', 'neutral' (anything), or 'special' (weather/quantity/medical — avoid as a plain descriptor)
  function adjDomain(e) {
    if (NEUTRAL_ADJ.indexOf(e.word) >= 0) return 'neutral';
    if (hasCat(e, 'Tiempo y frecuencia') || hasCat(e, 'Cantidades y comparaciones')) return 'special';
    if (hasCat(e, 'Emociones y estados') || hasCat(e, 'Salud y síntomas') || hasCat(e, 'Familia y relaciones')) return 'animate';
    if (hasCat(e, 'Alimentación') && !hasCat(e, 'Descripción personal')) return 'food';
    if (hasCat(e, 'Medicina y tratamiento') && !hasCat(e, 'Descripción personal')) return 'special';
    if (hasCat(e, 'Descripción personal') || hasCat(e, 'Cultura tapatía')) return 'animate';
    return 'neutral';
  }
  // Adjectives usable as a plain descriptor (excludes weather/quantity/medical specials)
  function describableAdj(e) { return adjDomain(e) !== 'special'; }
  // Which noun classes a given adjective can describe
  function nounClassesForAdj(e) {
    var d = adjDomain(e);
    if (d === 'food') return ['food'];
    if (d === 'animate') return ['person', 'animal'];
    return null; // neutral → any concrete noun
  }
  // Verb → plausible direct-object classes (for the DO-pronoun template)
  var VERB_OBJ_CLASS = {
    comer: ['food'], probar: ['food'], tomar: ['food'], cocinar: ['food'], preparar: ['food'],
    lavar: ['clothing', 'thing'], planchar: ['clothing'], comprar: ['food', 'clothing', 'thing'],
    vender: ['food', 'clothing', 'thing'], ver: ['person', 'animal', 'place', 'thing'],
    querer: ['person', 'animal', 'thing'], buscar: ['person', 'animal', 'thing', 'place'],
    traer: ['food', 'clothing', 'thing'], cuidar: ['person', 'animal'], leer: ['thing']
  };
  function nounPool(model, opts) {
    opts = opts || {};
    var pool = model.nouns;
    if (opts.classes) {
      pool = pool.filter(function (e) { return opts.classes.indexOf(nounClass(e)) >= 0; });
    } else if (opts.cats) {
      var filtered = pool.filter(function (e) {
        return (e.categories || []).some(function (c) { return opts.cats.indexOf(c) >= 0; });
      });
      if (filtered.length > 8) pool = filtered;
    }
    if (opts.gender) pool = pool.filter(function (e) { return nounGN(e).gender === opts.gender; });
    return pool;
  }

  // ════════════════════════════════════════════════════════════════════════
  // TEMPLATES — each entry is {id, fn}. fn(model, rng, mode, ctx) returns a
  // finalized exercise or null. ctx.tenses[id] (when present) is a weighted
  // array of allowed tenses, supplied by generateBattery according to the
  // current difficulty step (see STEPS below). Templates that don't pick a
  // tense internally ignore ctx entirely.
  // ════════════════════════════════════════════════════════════════════════
  var TEMPLATES = [];

  // 1. Verb conjugation (subject given, verb blanked) — 3 tenses
  TEMPLATES.push({ id: 'conjVerb', fn: function (model, rng, mode, ctx) {
    var tenseOptions = (ctx && ctx.tenses && ctx.tenses.conjVerb) || ['present', 'present', 'preterite', 'imperfect'];
    var tense = pick(tenseOptions, rng);
    var elig = model.verbs.filter(function (e) { return hasFullTense(e, tense); });
    var v = weightedPick(elig, rng); if (!v) return null;
    var per = pick(PERSONS, rng);
    var form = tenseObj(v, tense)[per.conjKey];
    var cue = pick(CUES[tense], rng);
    var opts = mode === 'choice' ? uniqueOptions(form, distractVerb(v, tense, per.conjKey, rng), 4, rng) : null;
    var b = blank('verb', form, { options: opts, wordKey: v.word, gloss: v.english, note: v.grammar_notes });
    var parts = [T(cue + ', ' + per.subj + ' '), B(b), T('.')];
    return finalize('conjVerb', tense, per.id, parts, rng);
  }});

  // 2. Subject pronoun blank (verb given) — unique persons only
  TEMPLATES.push({ id: 'subjPron', fn: function (model, rng, mode, ctx) {
    var tenseOptions = (ctx && ctx.tenses && ctx.tenses.subjPron) || ['present', 'preterite'];
    var tense = pick(tenseOptions, rng);
    var elig = model.verbs.filter(function (e) { return hasFullTense(e, tense); });
    var v = weightedPick(elig, rng); if (!v) return null;
    var per = personById(pick(UNIQUE_SUBJ_PERSONS, rng));
    var form = tenseObj(v, tense)[per.conjKey];
    var opts = mode === 'choice' ? uniqueOptions(cap(per.subj), ALL_SUBJ_PRON.map(cap), 4, rng) : null;
    var b = blank('subject-pronoun', cap(per.subj), { options: opts, note: 'Pronombre de sujeto (' + per.conjKey + ').' });
    var parts = [B(b), T(' ' + form + ' todos los días.')];
    return finalize('subjPron', tense, per.id, parts, rng);
  }});

  // 3. Possessive adjective blank
  TEMPLATES.push({ id: 'possessive', fn: function (model, rng, mode, ctx) {
    var noun = weightedPick(nounPool(model, { cats: ['Familia y relaciones', 'Casa y hogar', 'Ropa y accesorios'] }), rng);
    if (!noun) return null;
    var gn = nounGN(noun);
    var per = pick(PERSONS, rng);
    var ans = possFor(per.id, gn.gender, gn.num);
    var pool = gn.num === 'plur' ? ALL_POSS_PLUR : ALL_POSS_SING;
    var opts = mode === 'choice' ? uniqueOptions(ans, pool, 4, rng) : null;
    var b = blank('possessive', ans, { options: opts, wordKey: noun.word, gloss: noun.english,
      note: 'Posesivo átono; concuerda con "' + noun.word + '" (' + gn.gender + ', ' + gn.num + ').' });
    var decir = model.byWord['decir'];
    var dForm = (decir && decir.present_conjugation[per.conjKey]) || 'dice';
    var parts = [T(cap(per.subj) + ' ' + dForm + ' que '), B(b), T(' ' + noun.word + ' es importante.')];
    return finalize('possessive', 'present', per.id, parts, rng);
  }});

  // 4. Definite article blank (gender/number agreement)
  TEMPLATES.push({ id: 'article', fn: function (model, rng, mode, ctx) {
    var noun = weightedPick(nounPool(model, { cats: SUBJECT_CATS }), rng); if (!noun) return null;
    var gn = nounGN(noun);
    var ans = defArtForNoun(noun, gn.num);
    var verb = weightedPick(model.verbs.filter(function (e) { return hasFullTense(e, 'present'); }), rng);
    var vform = verb ? tenseObj(verb, 'present')[gn.num === 'plur' ? 'ellos/ellas' : 'él/ella'] : 'está aquí';
    var opts = mode === 'choice' ? uniqueOptions(ans, ALL_ART_DEF, 4, rng) : null;
    var b = blank('article', ans, { options: opts, wordKey: noun.word, gloss: noun.english,
      note: 'Artículo definido; concuerda con "' + noun.word + '" (' + gn.gender + ', ' + gn.num + ').' });
    var parts = [B({ role: b.role, answer: cap(ans), options: opts ? opts.map(cap) : null, wordKey: noun.word, gloss: noun.english, note: b.note }),
      T(' ' + noun.word + ' ' + vform + '.')];
    return finalize('article', 'present', null, parts, rng);
  }});

  // 5. Adjective agreement blank
  TEMPLATES.push({ id: 'adjAgree', fn: function (model, rng, mode, ctx) {
    var adjPool = (model.adjGender.length ? model.adjGender : model.adjectives).filter(describableAdj);
    var adj = weightedPick(adjPool, rng); if (!adj) return null;
    var classes = nounClassesForAdj(adj);
    var noun = weightedPick(nounPool(model, classes ? { classes: classes } : { cats: SUBJECT_CATS }), rng); if (!noun) return null;
    var gn = nounGN(noun);
    var ans = adjFor(adj, gn.gender, gn.num);
    var f = adjForms(adj);
    var opts = mode === 'choice' ? uniqueOptions(ans, [f.ms, f.fs, f.mp, f.fp], 4, rng) : null;
    var b = blank('adjective', ans, { options: opts, wordKey: adj.word, gloss: adj.english,
      note: 'Concordancia del adjetivo con "' + noun.word + '" (' + gn.gender + ', ' + gn.num + '). Base: ' + f.ms + '.' });
    var lemma = model.byWord[copulaForAdj(adj, rng)];
    var copForm = lemma ? lemma.present_conjugation[gn.num === 'plur' ? 'ellos/ellas' : 'él/ella'] : (gn.num === 'plur' ? 'son' : 'es');
    var parts = [T(cap(defArtForNoun(noun, gn.num)) + ' ' + noun.word + ' ' + copForm + ' muy '), B(b), T('.')];
    return finalize('adjAgree', 'present', null, parts, rng);
  }});

  // 6. SER vs ESTAR — conjugated form blank (copula chosen from the adjective's tag)
  TEMPLATES.push({ id: 'serEstar', fn: function (model, rng, mode, ctx) {
    // subject is a person pronoun → only adjectives that describe living beings
    var serPool = model.adjectives.filter(function (a) { var d = adjDomain(a); return d === 'animate' || d === 'neutral'; });
    var adj = weightedPick(serPool, rng); if (!adj) return null;
    var which = copulaForAdj(adj, rng);
    var entry = model.byWord[which]; if (!entry) return null;
    var per = pick(PERSONS, rng);
    var form = entry.present_conjugation[per.conjKey];
    var aForm = adjFor(adj, per.gender === 'f' ? 'f' : 'm', per.num);
    var distract = []
      .concat(Object.keys(model.byWord['ser'].present_conjugation).map(function (k) { return model.byWord['ser'].present_conjugation[k]; }))
      .concat(Object.keys(model.byWord['estar'].present_conjugation).map(function (k) { return model.byWord['estar'].present_conjugation[k]; }));
    var opts = mode === 'choice' ? uniqueOptions(form, distract, 4, rng) : null;
    var b = blank('ser-estar', form, { options: opts, wordKey: entry.word, gloss: entry.english,
      note: (which === 'estar' ? 'ESTAR — estado/condición temporal ("' + adj.word + '").' : 'SER — rasgo permanente ("' + adj.word + '").') });
    var parts = [T(cap(per.subj) + ' '), B(b), T(' ' + aForm + '.')];
    return finalize('serEstar', 'present', per.id, parts, rng);
  }});

  // 7. Indirect-object pronoun blank
  // Transfer verbs only — they take a physical object handed to a recipient
  var IO_VERBS = ['dar', 'traer', 'comprar', 'mandar', 'pedir', 'enseñar', 'regalar', 'mostrar', 'vender', 'escribir'];
  TEMPLATES.push({ id: 'ioPron', fn: function (model, rng, mode, ctx) {
    var elig = model.verbs.filter(function (e) { return IO_VERBS.indexOf(e.word) >= 0 && hasFullTense(e, 'present'); });
    if (!elig.length) elig = model.verbs.filter(function (e) { return hasFullTense(e, 'present'); });
    var v = weightedPick(elig, rng); if (!v) return null;
    var per = pick(PERSONS, rng);                       // who is doing the action
    var recipient = pick(['le', 'les'], rng);           // 3rd person recipient
    var recName = recipient === 'le' ? 'a María' : 'a mis amigos';
    var form = v.present_conjugation[per.conjKey];
    var noun = weightedPick(nounPool(model, { classes: ['food', 'clothing', 'thing'] }), rng);
    var gn = noun ? nounGN(noun) : { gender: 'm', num: 'sing' };
    var obj = noun ? (indefArtForNoun(noun, gn.num) + ' ' + noun.word) : 'un regalo';
    var opts = mode === 'choice' ? uniqueOptions(recipient, ALL_IO, 4, rng) : null;
    var b = blank('io-pronoun', recipient, { options: opts, wordKey: v.word, gloss: v.english,
      note: 'Pronombre de objeto indirecto (reduplicado con "' + recName + '").' });
    var parts = [T(cap(per.subj) + ' '), B(b), T(' ' + form + ' ' + obj + ' ' + recName + '.')];
    return finalize('ioPron', 'present', per.id, parts, rng);
  }});

  // 8. GUSTAR-type — IO pronoun + verb agreement (2 blanks)
  TEMPLATES.push({ id: 'gustar', fn: function (model, rng, mode, ctx) {
    var g = weightedPick(model.gustars, rng); if (!g) return null;
    var per = pick(PERSONS, rng);
    var ioAns = per.io;
    var expMap = { yo: 'A mí', tu: 'A ti', el: 'A él', ella: 'A ella', nos: 'A nosotros', ellos: 'A ellos' };
    var plural = makeRng(rng)() < 0.5;
    var classes = g.word === 'doler' ? ['body'] : ['food', 'animal'];
    var noun = weightedPick(nounPool(model, { classes: classes }), rng);
    var gn = noun ? nounGN(noun) : { gender: 'm', num: plural ? 'plur' : 'sing' };
    var num = noun ? gn.num : (plural ? 'plur' : 'sing');
    var verbForm = splitGustar(g.present_conjugation[per.io === 'le' ? 'le' : (per.io)] || g.present_conjugation['me'])[num === 'plur' ? 'plur' : 'sing'];
    var obj = noun ? (defArtForNoun(noun, num) + ' ' + noun.word) : (num === 'plur' ? 'los tacos' : 'el café');
    var ioOpts = mode === 'choice' ? uniqueOptions(ioAns, ALL_IO, 4, rng) : null;
    var gust = splitGustar(g.present_conjugation['me']);
    var vOpts = mode === 'choice' ? uniqueOptions(verbForm, [gust.sing, gust.plur], 2, rng) : null;
    var b1 = blank('io-pronoun', ioAns, { options: ioOpts, note: 'Objeto indirecto del verbo tipo gustar.' });
    var b2 = blank('gustar-verb', verbForm, { options: vOpts, wordKey: g.word, gloss: g.english,
      note: 'Concuerda con el sujeto pospuesto "' + obj + '" (' + num + ').' });
    var parts = [T(expMap[per.id] + ' '), B(b1), T(' '), B(b2), T(' ' + obj + '.')];
    return finalize('gustar', 'present', per.id, parts, rng);
  }});

  // 9. Reflexive — reflexive pronoun + verb (2 blanks)
  TEMPLATES.push({ id: 'reflexive', fn: function (model, rng, mode, ctx) {
    var tenseOptions = (ctx && ctx.tenses && ctx.tenses.reflexive) || ['present', 'present', 'preterite'];
    var tense = pick(tenseOptions, rng);
    var elig = model.reflexives.filter(function (e) { return ROUTINE_REFLEXIVES.indexOf(e.word) >= 0 && hasFullTense(e, tense); });
    if (elig.length < 3) elig = model.reflexives.filter(function (e) { return hasFullTense(e, tense); });
    var v = weightedPick(elig, rng); if (!v) return null;
    var per = pick(PERSONS, rng);
    var raw = tenseObj(v, tense)[per.conjKey];
    var sp = splitReflexive(raw); if (!sp) return null;
    var cue = pick(CUES[tense], rng);
    var reflOpts = mode === 'choice' ? uniqueOptions(sp.pron, ALL_REFL, 4, rng) : null;
    var verbOpts = mode === 'choice' ? uniqueOptions(sp.verb, Object.keys(tenseObj(v, tense)).map(function (k) { var s = splitReflexive(tenseObj(v, tense)[k]); return s ? s.verb : tenseObj(v, tense)[k]; }), 4, rng) : null;
    var b1 = blank('reflexive-pronoun', sp.pron, { options: reflOpts, note: 'Pronombre reflexivo (concuerda con ' + per.subj + ').' });
    var b2 = blank('verb', sp.verb, { options: verbOpts, wordKey: v.word, gloss: v.english, note: v.grammar_notes });
    var parts = [T(cue + ', ' + per.subj + ' '), B(b1), T(' '), B(b2), T('.')];
    return finalize('reflexive', tense, per.id, parts, rng);
  }});

  // 10. Near future: ir + a + infinitive (2 blanks: ir-form + infinitive)
  TEMPLATES.push({ id: 'futuroProximo', fn: function (model, rng, mode, ctx) {
    var ir = model.byWord['ir']; if (!ir || !ir.present_conjugation) return null;
    var per = pick(PERSONS, rng);
    var irForm = ir.present_conjugation[per.conjKey];
    var v = weightedPick(model.verbs.filter(function (e) { return hasFullTense(e, 'present'); }), rng); if (!v) return null;
    var irOpts = mode === 'choice' ? uniqueOptions(irForm, Object.keys(ir.present_conjugation).map(function (k) { return ir.present_conjugation[k]; }), 4, rng) : null;
    var infOpts = mode === 'choice' ? uniqueOptions(v.word, shuffle(model.verbs, rng).slice(0, 5).map(function (e) { return e.word; }), 4, rng) : null;
    var b1 = blank('verb', irForm, { options: irOpts, wordKey: 'ir', gloss: ir.english, note: 'IR (presente) — futuro próximo.' });
    var b2 = blank('infinitive', v.word, { options: infOpts, wordKey: v.word, gloss: v.english, note: 'Infinitivo tras "ir a".' });
    var parts = [T('Mañana ' + per.subj + ' '), B(b1), T(' a '), B(b2), T('.')];
    return finalize('futuroProximo', 'present', per.id, parts, rng);
  }});

  // 11. Direct-object pronoun (replace a known noun)
  TEMPLATES.push({ id: 'doPron', fn: function (model, rng, mode, ctx) {
    var v = weightedPick(model.verbs.filter(function (e) { return VERB_OBJ_CLASS[e.word] && hasFullTense(e, 'present'); }), rng);
    if (!v) return null;
    var noun = weightedPick(nounPool(model, { classes: VERB_OBJ_CLASS[v.word] }), rng); if (!noun) return null;
    var gn = nounGN(noun);
    var per = personById(pick(['yo', 'nos', 'ellos'], rng));
    var form = v.present_conjugation[per.conjKey];
    var ans = doFor(gn.gender, gn.num);
    var opts = mode === 'choice' ? uniqueOptions(ans, ALL_DO, 4, rng) : null;
    var b = blank('do-pronoun', ans, { options: opts, wordKey: noun.word, gloss: noun.english,
      note: 'Objeto directo; reemplaza "' + defArtForNoun(noun, gn.num) + ' ' + noun.word + '" (' + gn.gender + ', ' + gn.num + ').' });
    // Use the chosen (in-dictionary) verb for the setup clause too — never a hard-coded form
    var parts = [T(cap(per.subj) + ' ' + form + ' ' + defArtForNoun(noun, gn.num) + ' ' + noun.word + '. ' + cap(per.subj) + ' '), B(b), T(' ' + form + ' siempre.')];
    return finalize('doPron', 'present', per.id, parts, rng);
  }});

  // 12. Presente continuo: ESTAR + gerundio (2 blanks). Non-reflexive verbs only —
  // a reflexive gerund's pronoun must agree with the subject (me/te/se/nos), and the
  // dictionary's stored gerund is a third-person citation form, so reflexives are
  // intentionally out of scope here to avoid generating wrong pronoun agreement.
  TEMPLATES.push({ id: 'presenteContinuo', fn: function (model, rng, mode, ctx) {
    var estar = model.byWord['estar']; if (!estar || !estar.present_conjugation) return null;
    var elig = model.verbs.filter(function (e) { return e.gerund && hasFullTense(e, 'present'); });
    var v = weightedPick(elig, rng); if (!v) return null;
    var per = pick(PERSONS, rng);
    var estarForm = estar.present_conjugation[per.conjKey];
    var ger = cleanWord(v.gerund);
    var estarOpts = mode === 'choice' ? uniqueOptions(estarForm, Object.keys(estar.present_conjugation).map(function (k) { return estar.present_conjugation[k]; }), 4, rng) : null;
    var gerPool = shuffle(model.verbs, rng).slice(0, 6).map(function (e) { return cleanWord(e.gerund || ''); }).filter(Boolean);
    var gerOpts = mode === 'choice' ? uniqueOptions(ger, gerPool, 4, rng) : null;
    var b1 = blank('verb', estarForm, { options: estarOpts, wordKey: 'estar', gloss: estar.english, note: 'ESTAR (presente) — acción en curso.' });
    var b2 = blank('gerund', ger, { options: gerOpts, wordKey: v.word, gloss: v.english, note: 'Gerundio de "' + v.word + '": lo que está pasando ahora.' });
    var cue = pick(CUES.presenteContinuo, rng);
    var parts = [T(cue + ', ' + per.subj + ' '), B(b1), T(' '), B(b2), T('.')];
    return finalize('presenteContinuo', 'present', per.id, parts, rng);
  }});

  // 13. Pretérito perfecto: HABER + participio (2 blanks)
  TEMPLATES.push({ id: 'preteritoPerfecto', fn: function (model, rng, mode, ctx) {
    var haber = model.byWord['haber']; if (!haber || !haber.present_conjugation) return null;
    var elig = model.verbs.filter(function (e) { return e.past_participle && hasFullTense(e, 'present'); });
    var v = weightedPick(elig, rng); if (!v) return null;
    var per = pick(PERSONS, rng);
    var haberForm = haber.present_conjugation[per.conjKey];
    var part = cleanWord(v.past_participle);
    var haberOpts = mode === 'choice' ? uniqueOptions(haberForm, Object.keys(haber.present_conjugation).map(function (k) { return haber.present_conjugation[k]; }), 4, rng) : null;
    var partPool = shuffle(model.verbs, rng).slice(0, 6).map(function (e) { return cleanWord(e.past_participle || ''); }).filter(Boolean);
    var partOpts = mode === 'choice' ? uniqueOptions(part, partPool, 4, rng) : null;
    var b1 = blank('verb', haberForm, { options: haberOpts, wordKey: 'haber', gloss: haber.english, note: 'HABER (presente) — pretérito perfecto.' });
    var b2 = blank('participle', part, { options: partOpts, wordKey: v.word, gloss: v.english, note: 'Participio de "' + v.word + '" (invariable con HABER).' });
    var cue = pick(CUES.preteritoPerfecto, rng);
    var parts = [T(cue + ' ' + per.subj + ' '), B(b1), T(' '), B(b2), T('.')];
    return finalize('preteritoPerfecto', 'present', per.id, parts, rng);
  }});

  // 14. Double-object pronouns: le/les -> se, combined with lo/la/los/las (2 blanks)
  TEMPLATES.push({ id: 'dobleObjeto', fn: function (model, rng, mode, ctx) {
    var elig = model.verbs.filter(function (e) { return IO_VERBS.indexOf(e.word) >= 0 && hasFullTense(e, 'present'); });
    if (!elig.length) return null;
    var v = weightedPick(elig, rng); if (!v) return null;
    var per = personById(pick(['yo', 'tu', 'nos', 'ellos'], rng));   // repeated-subject clause needs an unambiguous person
    var recipient = pick(['le', 'les'], rng);
    var recName = recipient === 'le' ? 'a María' : 'a mis amigos';
    var form = v.present_conjugation[per.conjKey];
    var noun = weightedPick(nounPool(model, { classes: ['food', 'clothing', 'thing'] }), rng); if (!noun) return null;
    var gn = nounGN(noun);
    var doAns = doFor(gn.gender, gn.num);
    var obj = indefArtForNoun(noun, gn.num) + ' ' + noun.word;
    var ioOpts = mode === 'choice' ? uniqueOptions('se', ['se', 'le', 'les', 'lo'], 4, rng) : null;
    var doOpts = mode === 'choice' ? uniqueOptions(doAns, ALL_DO, 4, rng) : null;
    var b1 = blank('io-pronoun', 'se', { options: ioOpts, wordKey: v.word, gloss: v.english,
      note: '"' + recipient + '" se convierte en "se" antes de lo/la/los/las.' });
    var b2 = blank('do-pronoun', doAns, { options: doOpts, wordKey: noun.word, gloss: noun.english,
      note: 'Objeto directo; reemplaza "' + obj + '" (' + gn.gender + ', ' + gn.num + ').' });
    var parts = [T(cap(per.subj) + ' ' + form + ' ' + obj + ' ' + recName + '. ' + cap(per.subj) + ' '), B(b1), T(' '), B(b2), T(' ' + form + '.')];
    return finalize('dobleObjeto', 'present', per.id, parts, rng);
  }});

  // ════════════════════════════════════════════════════════════════════════
  // STEP LADDER — mirrors the real chronological order the 4-week class
  // taught these structures (see notes_transcription.md dates). Discrete
  // steps, one-way (no demotion), each gated on rolling accuracy for its own
  // newly-introduced content. tenseAdds entries carry a relative weight {t,w}
  // matching the original hand-tuned tense ratios for that template.
  // ════════════════════════════════════════════════════════════════════════
  var STEPS = [
    { id: 'cimientos', label: 'Cimientos', sub: 'presente, ser/estar, artículos y posesivos',
      templates: ['possessive', 'article', 'adjAgree', 'serEstar'],
      tenseAdds: { conjVerb: [{ t: 'present', w: 2 }], subjPron: [{ t: 'present', w: 1 }] } },
    { id: 'gustarOI', label: 'Gustar y objeto indirecto', sub: 'lo que te gusta, lo que te falta',
      templates: ['ioPron', 'gustar'], tenseAdds: {} },
    { id: 'reflexivos', label: 'Reflexivos y rutina', sub: 'tu día, paso a paso',
      templates: ['reflexive'], tenseAdds: { reflexive: [{ t: 'present', w: 2 }] } },
    { id: 'presenteContinuo', label: 'Presente continuo', sub: 'lo que está pasando ahora',
      templates: ['presenteContinuo'], tenseAdds: {} },
    { id: 'futuroProximo', label: 'Futuro próximo', sub: 'ir + a + infinitivo',
      templates: ['futuroProximo'], tenseAdds: {} },
    { id: 'preterito', label: 'Pretérito', sub: 'lo que pasó',
      templates: [], tenseAdds: {
        conjVerb: [{ t: 'preterite', w: 1 }], subjPron: [{ t: 'preterite', w: 1 }], reflexive: [{ t: 'preterite', w: 1 }]
      } },
    { id: 'imperfecto', label: 'Imperfecto', sub: 'cómo era antes',
      templates: [], tenseAdds: { conjVerb: [{ t: 'imperfect', w: 1 }] } },
    { id: 'preteritoPerfecto', label: 'Pretérito perfecto', sub: 'lo que has hecho',
      templates: ['preteritoPerfecto'], tenseAdds: {} },
    { id: 'objetoDirecto', label: 'Objeto directo', sub: 'lo, la, los, las... y se lo, se la',
      templates: ['doPron', 'dobleObjeto'], tenseAdds: {} }
  ];
  // conjVerb/subjPron are tense-gated only (never appear in a step's `templates` list);
  // they become available the moment their first tense unlocks, at step 0.
  STEPS[0].templates = STEPS[0].templates.concat(['conjVerb', 'subjPron']);

  var GATE_MIN_SAMPLE = 15;
  var GATE_THRESHOLD = 0.70;
  var TAPER_CAP = 0.35;       // a tapering-in template/tense never out-weighs current-step content
  var WEIGHT_SCALE = 3;       // resolution unit for weighted picks

  function clampStep(i) { return Math.max(0, Math.min(STEPS.length - 1, i || 0)); }

  // Cumulative unlocked templates + tense-weight entries through stepIndex (inclusive)
  function configForStep(stepIndex) {
    stepIndex = clampStep(stepIndex);
    var templates = [], tenses = {};
    for (var i = 0; i <= stepIndex; i++) {
      STEPS[i].templates.forEach(function (t) { if (templates.indexOf(t) < 0) templates.push(t); });
      var adds = STEPS[i].tenseAdds || {};
      Object.keys(adds).forEach(function (tid) {
        tenses[tid] = (tenses[tid] || []).concat(adds[tid]);
      });
    }
    return { templates: templates, tenses: tenses };
  }
  // What the NEXT step adds on top of stepIndex's cumulative config (for tapering)
  function deltaForNextStep(stepIndex) {
    var next = STEPS[clampStep(stepIndex) + 1];
    if (!next) return null;
    return { newTemplates: next.templates.slice(), tenseAdds: next.tenseAdds || {} };
  }
  // Which step first makes a given (templateId, tense) combination reachable.
  // tenseAdds matches are checked first and take priority: conjVerb/subjPron/reflexive
  // live in STEPS[0].templates (so generateBattery treats them as available from step 0
  // onward via ctx.tenses), but a SPECIFIC tense like conjVerb-preterite is only actually
  // reachable once its own tenseAdds entry unlocks (step 5/6) — checking templates first
  // would wrongly attribute every tense of those 3 templates to step 0, which would mean
  // the preterite/imperfect gates could never accumulate qualifying attempts.
  function introducingStepIndex(templateId, tense) {
    for (var i = 0; i < STEPS.length; i++) {
      var adds = STEPS[i].tenseAdds || {};
      if (adds[templateId] && adds[templateId].some(function (e) { return e.t === tense; })) return i;
    }
    for (var j = 0; j < STEPS.length; j++) {
      if (STEPS[j].templates.indexOf(templateId) >= 0) return j;
    }
    return 0;
  }
  // Build a weighted tense-pick array for a tense-gated template, blending in
  // the next step's new tense(s) proportional to taper.
  function tensesForTemplate(templateId, cfg, delta, taper) {
    var entries = cfg.tenses[templateId];
    if (!entries || !entries.length) return null;
    var arr = [];
    entries.forEach(function (e) { for (var i = 0; i < e.w * WEIGHT_SCALE; i++) arr.push(e.t); });
    if (delta && delta.tenseAdds[templateId] && taper > 0) {
      delta.tenseAdds[templateId].forEach(function (e) {
        var w = Math.max(1, Math.round(e.w * WEIGHT_SCALE * taper));
        for (var j = 0; j < w; j++) arr.push(e.t);
      });
    }
    return arr;
  }
  // How strongly the next step's new content should blend in, given rolling
  // progress on the current step (0 = pure current step, caps at TAPER_CAP as
  // the gate threshold approaches — never fully replaces current-step content
  // until the step formally advances).
  function taperFraction(progress) {
    if (!progress || !progress.attempts) return 0;
    var frac = progress.attempts / GATE_MIN_SAMPLE;
    return Math.max(0, Math.min(TAPER_CAP, frac * TAPER_CAP));
  }

  // ════════════════════════════════════════════════════════════════════════
  // BATTERY GENERATION
  // ════════════════════════════════════════════════════════════════════════
  function generateBattery(model, opts) {
    opts = opts || {};
    var count = opts.count || 50;
    var mode = opts.mode || 'typed';   // 'typed' | 'choice'
    var rng = makeRng(opts.rng);
    var stepIndex = (opts.stepIndex === undefined) ? STEPS.length - 1 : clampStep(opts.stepIndex);
    var taper = opts.taper || 0;

    var cfg = configForStep(stepIndex);
    var delta = deltaForNextStep(stepIndex);

    // ctx.tenses — weighted tense arrays for the 3 tense-gated templates
    var ctx = { tenses: {} };
    ['conjVerb', 'subjPron', 'reflexive'].forEach(function (id) {
      var arr = tensesForTemplate(id, cfg, delta, taper);
      if (arr) ctx.tenses[id] = arr;
    });

    // Weighted template pool: unlocked templates at full weight, the next
    // step's wholly-new templates blended in at taper weight.
    var pool = [];
    TEMPLATES.forEach(function (entry) {
      var unlocked = cfg.templates.indexOf(entry.id) >= 0;
      // a tense-gated template is "usable" once it has at least one allowed tense
      var tenseGated = ['conjVerb', 'subjPron', 'reflexive'].indexOf(entry.id) >= 0;
      if (tenseGated) unlocked = !!ctx.tenses[entry.id] && ctx.tenses[entry.id].length > 0;
      if (unlocked) {
        for (var i = 0; i < WEIGHT_SCALE; i++) pool.push(entry);
      } else if (delta && delta.newTemplates.indexOf(entry.id) >= 0 && taper > 0) {
        var w = Math.max(1, Math.round(WEIGHT_SCALE * taper));
        for (var j = 0; j < w; j++) pool.push(entry);
      }
    });
    if (!pool.length) return [];

    var out = [], seen = {}, guard = 0;
    var maxGuard = count * 80;
    while (out.length < count && guard < maxGuard) {
      guard++;
      var tpl = pick(pool, rng);
      var ex;
      try { ex = tpl.fn(model, rng, mode, ctx); } catch (e) { ex = null; }
      if (!ex) continue;
      if (seen[ex.key]) continue;
      // enforce blank count and that no blank answer is empty
      var ok = ex.blanks.length >= 1 && ex.blanks.length <= 3;
      ex.blanks.forEach(function (b) { if (!b.answer) ok = false; });
      if (!ok) continue;
      seen[ex.key] = 1;
      ex.index = out.length;
      ex.round = Math.floor(out.length / 10);
      ex.mode = mode;
      ex.stepIndex = stepIndex;
      ex.introStep = introducingStepIndex(ex.id, ex.tense);
      out.push(ex);
    }
    return out;
  }

  // ── Grading → Leitner words ───────────────────────────────────────────────
  // perBlankCorrect: array<boolean> aligned to exercise.blanks
  // returns [{word, knew}] for blanks that map to a dictionary word
  function gradeExercise(exercise, perBlankCorrect) {
    var agg = {};  // word -> knew (AND across blanks for that word)
    exercise.blanks.forEach(function (b, i) {
      if (!b.wordKey) return;
      var knew = !!perBlankCorrect[i];
      if (agg.hasOwnProperty(b.wordKey)) agg[b.wordKey] = agg[b.wordKey] && knew;
      else agg[b.wordKey] = knew;
    });
    return Object.keys(agg).map(function (w) { return { word: w, knew: agg[w] }; });
  }

  // ── Step progress / gating ────────────────────────────────────────────────
  // progress: {stepIndex, attempts, correct} — caller persists this (e.g. localStorage).
  // Only exercises whose introStep matches the CURRENT step count toward advancement —
  // review content (introStep < stepIndex) and taper-preview content (introStep > stepIndex)
  // are reinforcement/preview, not evidence for advancing past material not yet unlocked.
  // Advancement is one-way: stepIndex only ever increases.
  function recordStepProgress(progress, exercise, perBlankCorrect, stepIndex) {
    stepIndex = clampStep(stepIndex);
    if (!progress || progress.stepIndex !== stepIndex) {
      progress = { stepIndex: stepIndex, attempts: 0, correct: 0 };
    } else {
      progress = { stepIndex: progress.stepIndex, attempts: progress.attempts, correct: progress.correct };
    }
    if (exercise && exercise.introStep === stepIndex) {
      var allOk = perBlankCorrect.every(function (x) { return !!x; });
      progress.attempts++;
      if (allOk) progress.correct++;
    }
    var ready = progress.attempts >= GATE_MIN_SAMPLE && (progress.correct / progress.attempts) >= GATE_THRESHOLD;
    var advanced = false;
    if (ready && stepIndex < STEPS.length - 1) {
      stepIndex = stepIndex + 1;
      progress = { stepIndex: stepIndex, attempts: 0, correct: 0 };
      advanced = true;
    }
    return { progress: progress, stepIndex: stepIndex, advanced: advanced };
  }

  return {
    classify: classify,
    generateBattery: generateBattery,
    gradeExercise: gradeExercise,
    recordStepProgress: recordStepProgress,
    taperFraction: taperFraction,
    configForStep: configForStep,
    introducingStepIndex: introducingStepIndex,
    STEPS: STEPS,
    GATE_MIN_SAMPLE: GATE_MIN_SAMPLE,
    GATE_THRESHOLD: GATE_THRESHOLD,
    // exposed for testing
    PERSONS: PERSONS,
    leitnerWeight: leitnerWeight,
    adjForms: adjForms,
    possFor: possFor,
    nounGN: nounGN,
    splitGustar: splitGustar,
    splitReflexive: splitReflexive,
    hasFullTense: hasFullTense,
    TEMPLATES: TEMPLATES
  };
})();

if (typeof module !== 'undefined' && module.exports) { module.exports = SentenceEngine; }
