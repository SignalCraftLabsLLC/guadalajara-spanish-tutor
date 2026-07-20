# Guadalajara Spanish Tutor — Project Reference

## What This Project Is

Stan completed a 4-week Spanish language class in Guadalajara (taught by Aura in the mornings and Lalo in the afternoons). This project builds a structured, queryable Spanish learning resource anchored in the **Tapatio/Guadalajara dialect**. The goal is vocabulary reinforcement and exercise generation — not a textbook, but a machine-readable building block for flashcards, fill-in-the-blank exercises, grammar drills, and topic-based conversation practice.

Stan is starting from elementary vocabulary and grammar. Tapatio-specific content is explicitly flagged and celebrated. See the project instructions (set in Claude settings) for tutoring tone and style.

---

## File Inventory

| File | Purpose |
|------|---------|
| `spanish_dictionary.json` | Primary data file. 1000 entries as of June 2026. Every word from the class plus high-frequency level-appropriate additions, fully enriched. |
| `lessons.json` | Data file for all lessons. **Four conversation scenarios** as of July 19, 2026 (`mercado`, `medico`, `direcciones`, `familia`) plus the **`verbos` drill config entry** (`type: "drill"`) consumed by `verbos.html`. Conversation schema: dialogue array of `{speaker, es, en}` lines; a `player` field naming the speaker whose lines the student plays in Participar mode; optional **choice nodes** `{speaker, prompt, choice: [{es, en, note, response: [lines...]}]}` where branches reconverge to the main dialogue spine. Every `vocab_highlight` word verified to exist in `spanish_dictionary.json`; every `grammar_refs` entry cites a real numbered `grammar_catalog.md` section. `mercado`/`medico`/`direcciones` are usted-register; `familia` is the first tú-register lesson. Each scenario's flashcard `practice` links carry a URL-encoded `?cat=` category so they deep-link into the pre-filtered flashcard deck (Session 31); sentence-maker practice links stay generic. |
| `lecciones.html` | Conversation-lesson viewer, loads `lessons.json` (drill-type entries are filtered out of the picker; old `#verbos` links redirect to `verbos.html`). Hash-routed picker → detail view with friendly mastery chip per lesson (no Leitner/box jargon), computed from the existing `tapatio_dict_v` + `tapatio_leitner` localStorage caches — no new storage key. Detail view has a **📖 Leer / 🎭 Participar mode toggle** (Session 30): Leer shows the full dialogue as chat bubbles with tappable choice points ("↺ Probar la otra opción" to re-choose); Participar reveals lines progressively — at the player's linear turns the student types the line from an English cue, graded via `SpellingHandler` on punctuation-stripped/normalized phrases (exact/accent_only pass, close/wrong retry), with a 🛟 Pista button revealing two words at a time and a "Mostrar línea" escape; at choice nodes the student picks a branch. Ends with a first-try score. **Participar deliberately does NOT write to the Leitner store.** Bubbles use `me`/`them` classes derived from the lesson's `player` field (not hardcoded speaker names). Grammar callouts cite exact catalog section numbers; flashcard practice links now deep-link into a pre-filtered deck via `?cat=` (Session 31), while sentence-maker links stay category-agnostic by design. Text-only, no audio. Talavera design system. |
| `verbos.html` | **Los 100 Verbos** — standalone drill page (broken out of `lecciones.html` in Session 30; drill was originally built inside it in an earlier unlogged July 19 chat). Has its own ⚡ card on `index.html`. The 100 most-used Mexican Spanish verbs in 5 groups of 20 across 6 tenses (presente, pretérito, imperfecto, futuro próximo, gerundio, participio); mastering a group at 80% unlocks the next group and the next tense. Config lives in `lessons.json` (the `type:"drill"` entry). Per-verb per-tense Leitner store in `tapatio_verbos` localStorage key; **presente grades sync back to the shared `tapatio_leitner`** store so flashcards/sentence maker benefit. Cards badge each verb as ✅ Regular / 🔤 Cambio de ortografía / ⚠️ Irregular (computed, hidden once mastered). Special-cases haber (impersonal hay/hubo/había) and gustar (IO-pronoun structure); both are simple-tenses-only. Typed answers graded by `SpellingHandler`. |
| `index.html` | **Tutor home base** (central hub). Three zones: (1) **dictionary control** — auto-checks for a newer `spanish_dictionary.json` on load, refreshes the shared `tapatio_dict_v` cache, shows friendly status + last-updated, plus a manual 🔄 button (`checkDict()`); (2) **progress panel** (`renderProgress()`) — total + mastered words and a 5-level mastery bar (🌱 Nuevas → 📖 Aprendiendo → 💪 Vas bien → 🔥 Casi → ⭐ Dominadas) computed from the shared `tapatio_dict_v` + `tapatio_leitner` cache, **no jargon shown** (the word "Leitner"/"box" never appears in visible UI); (3) **lessons vs tools** card grid driven by an `APPS` array (`kind:'lesson'|'tool'`) — add an app = add one entry. Four lesson cards (Lecciones 💬, Los 100 Verbos ⚡, Tarjetas 🃏, Constructor 🧩) + one tool card (Editor 📖) as of Session 30. Readable Talavera design (Barlow-forward). `netlify.toml` serves `/` → this page. |
| `flashcards_vocabulario.html` | Full-deck interactive flashcard app. **localStorage-backed** — automatically loads dictionary and Leitner progress from browser storage; drag-drop JSON only needed first time or to update. Category selection, Talavera design, deal-in animation, grammar callout, bidirectional flip. **Leitner System integrated** — Leitner mode is the only mode. Supports Clic and Escribir (typed-answer) practice modes. Fixed "← Inicio" home pill visible on every screen (load, selection, play) since Session 30. **Honors a `?cat=<category>` URL param on load** (`applyCatParam()`, applied once): preselects that category and scrolls it into view so lesson practice links open the filtered deck directly; an absent or unknown param falls back to the normal full deck (Session 31). Live at **guadalajara-spanish-flashcards.netlify.app**. |
| `sentence_maker.html` | **Constructor de Oraciones** — dynamic fill-in-the-blank drills. Sentences are generated on demand (never stored) from the dictionary, B2-and-below. Rounds of 10, up to 5 (50 max), no repeats, up to 3 blanks each. Tests verbs, articles, adjectives, and pronouns (subject, possessive, direct object, indirect object, reflexive, gustar, double-object). Two difficulty modes: ⌨ Escribir (typed, graded by SpellingHandler) and 🔘 Opción múltiple. Loads dictionary via localStorage + fetch fallback; **shares the flashcards' `tapatio_leitner` store** (weights weak/due words, writes back grades). Setup screen shows the loaded word count and a **🔄 Actualizar diccionario** button (`updateDict()`), plus a **"Tu nivel" panel** showing the current step of the 9-step difficulty ladder (friendly Spanish, no jargon) with a progress bar toward the next step. Navigation: 🏠 home button (with confirm) next to the ⚙ setup-exit on the play screen; round-summary and final screens link home too (Session 30). English help only on request. Uses sibling scripts `sentence_engine.js` + `spelling_handler.js`. |
| `sentence_engine.js` | **Source of truth** for the sentence generator (Node-testable, browser global `SentenceEngine`). Classifies entries, runs **14 agreement-aware templates**, uses only dictionary conjugations, Leitner-weighted target selection, a light semantic-compatibility layer (coarse noun/adjective/verb classes), and a **9-step structural difficulty ladder** (`STEPS`, `generateBattery({stepIndex,taper})`, `recordStepProgress()`) gating which templates/tenses are offered, independent of the per-word Leitner weighting. Spec documented in `grammar_reference.md` Part B — keep them in sync. |
| `dictionary_editor.html` | CRUD editor for `spanish_dictionary.json`. File-load + drag-and-drop, searchable/filterable table, full edit modal with verb conjugation handling, exports sorted JSON with correct field order. Also serves as the **Leitner control panel** — reset boxes globally, by filtered view, or by category. "← Inicio" link in the header bar (Session 30). Open in browser, load the JSON, edit, export. |
| `grammar_catalog.md` | Read-only reference. 41 sections of class notes from Aura and Lalo covering all grammar topics taught. Tapatio content marked with 🌵. **Primary grammar authority — do not modify.** |
| `grammar_reference.md` | CEFR A1/A2/B1 framework for Mexican Spanish. Gap-filler companion to the catalog — covers topics not explicitly taught in class (subject pronouns, negation, numbers, modal verbs, diminutives, future/conditional tenses, subjunctive, por vs para, si clauses, relative pronouns, indirect speech, and Mexican Spanish appendix). **Part B (added Session 23, extended Session 26)** is the Sentence Generation Spec mirroring `sentence_engine.js`, including **§B.9 — the 9-step difficulty ladder, tapering, and gating logic**. **Fallback only — catalog takes priority. If conflict arises, trust the catalog.** |
| `spelling_handler.js` | Standalone Spanish spelling evaluator. Returns `exact`, `accent_only`, `close`, or `wrong` with Spanish feedback strings. Handles slash variants, article-optional matching, accent/ñ detection, space/hyphen-collapse, Levenshtein fuzzy matching. Compatible with browser (global `SpellingHandler`) and Node. |
| `notes_transcription.md` | Transcription of handwritten class notes from photos. Reference material only — the dictionary is the authoritative data source. |
| `archive/` | 111 photos (IMG_2458.jpeg … IMG_2569.jpeg) of handwritten class notes from the 4-week course. Source material for `notes_transcription.md`. Archived June 2026 — content already captured; images not needed for ongoing work. ~2GB. |
| `SESSION_LOG.md` | Full verbatim chronological session history (Sessions 1-28 and onward). Split out of CLAUDE.md on 2026-06-28 to keep this file lighter to update — nothing summarized or deleted, just relocated. Append new sessions there, not here. |

Scripts used to build the dictionary live in the session outputs folder (not in this project folder) and are not needed for ongoing work — the JSON file is the authoritative source.

---

## Dictionary Schema

Every entry in `spanish_dictionary.json` follows this field order exactly. Do not reorder fields when adding entries.

```json
{
  "word": "string — the Spanish word or phrase",
  "english": "string — English translation/gloss",
  "part_of_speech": "string — see POS values below",
  "grammar_notes": "string — human-readable usage notes, irregularities, examples",
  "grammar_rule": "string — machine-readable rule label from the taxonomy below",
  "categories": ["array", "of", "category strings"],
  "gerund": "string — VERBS ONLY (omit field entirely for non-verbs)",
  "past_participle": "string — VERBS ONLY",
  "present_conjugation": { "object — VERBS ONLY, see conjugation keys below" },
  "tapatio": true/false,
  "tapatio_notes": "string — empty string if tapatio is false",
  "leitner_box": 1-5,
  "leitner_sessions_until_due": 0
}
```

**Critical**: `gerund`, `past_participle`, and `present_conjugation` are present **only on verb entries**. They are entirely absent from nouns, adjectives, adverbs, etc. — not null, not empty string, just not there.

### Part-of-Speech Values (common)
`noun (m)`, `noun (f)`, `noun (m pl)`, `noun (f pl)`, `noun (m/f)`, `noun phrase (m)`, `noun phrase (f)`, `verb`, `verb (reflexive)`, `adjective`, `adjective/participle`, `adverb`, `adverb phrase`, `interrogative`, `grammar term`, `interjection`, `conjunction`, `preposition + infinitive`

### Present Conjugation Keys

**Standard verbs** use subject pronouns:
```json
{ "yo": "...", "tú": "...", "él/ella": "...", "nosotros": "...", "ellos/ellas": "..." }
```

**Gustar-type verbs** (reverse-subject structure) use indirect object pronouns instead:
```json
{ "me": "gusta / gustan", "te": "gusta / gustan", "le": "gusta / gustan", "nos": "gusta / gustan", "les": "gusta / gustan" }
```
This is intentional and machine-readable — the different key set signals the grammatical difference.

### Gerund Formation Rules (for reference when adding verbs)
- Regular -AR verbs: stem + **-ando** (caminar → caminando)
- Regular -ER/-IR verbs: stem + **-iendo** (comer → comiendo, vivir → viviendo)
- Vowel-stem -ER/-IR: **-yendo** (leer → leyendo, oír → oyendo)
- **-IR stem-changing verbs only** change stem in gerund: o→u (dormir → durmiendo), e→i (pedir → pidiendo). -AR and -ER stem-changers do NOT change in gerund.
- Reflexive gerunds get accent shift: -ando+se → **-ándose**, -iendo+se → **-iéndose**

---

## Category Taxonomy

All 18 categories. Every entry has at least one. Multi-category entries are common — use arrays liberally when a word genuinely belongs to more than one context.

| Category | Count | Purpose / Exercise Type |
|----------|-------|------------------------|
| Alimentación | 141 | Food, drinks, ingredients, cooking — market and restaurant scenarios |
| Anatomía y cuerpo | 103 | Body parts, organs, blood, tissues — human body exercises |
| Animales | 100 | Animals — pets, farm animals, wildlife, insects — naming and describing animals |
| Medicina y tratamiento | 122 | Conditions, procedures, medications, medical roles, lab values — clinic/hospital scenarios |
| Salud y síntomas | 86 | Symptoms, how you feel, illness — describing health to a doctor |
| Ropa y accesorios | 42 | Clothing, accessories — shopping and description exercises |
| Casa y hogar | 33 | Home, furniture, rooms — describing your living space |
| Ciudad y transporte | 82 | Streets, vehicles, navigation, places in a city — getting around GDL |
| Orientación y direcciones | 28 | Directional language — giving/following directions |
| Familia y relaciones | 42 | Family members, relationships — talking about people you know |
| Emociones y estados | 73 | Feelings, moods, emotional states — expressing yourself |
| Descripción personal | 65 | Physical appearance, personality traits — describing people |
| Rutinas diarias | 136 | Daily activities and action verbs — present tense practice |
| Tiempo y frecuencia | 41 | Time expressions, seasons, frequency adverbs — scheduling and habits |
| Cantidades y comparaciones | 47 | Numbers, sizes, quantities — shopping and comparison |
| Comunicación y cortesía | 109 | Greetings, politeness, conversation connectors — social interaction |
| Gramática funcional | 61 | Pronouns, articles, prepositions, conjunctions — structural vocabulary |
| Cultura tapatía | 154 | Tapatio-specific slang, food, customs — local flavor overlay |

Counts last verified July 19, 2026 (Session 30) by direct tally of `spanish_dictionary.json`. Entries are multi-category, so the sum of this column exceeds the 1033 total entries.

**Cultura tapatía is an overlay category**, not standalone — a Tapatio entry also belongs to its functional category (e.g., birria → Alimentación + Cultura tapatía). Every entry with `tapatio: true` has Cultura tapatía in its categories array.

---

## Grammar Rule Taxonomy (Selected Key Labels)

The `grammar_rule` field uses human-readable labels designed to be pedagogically useful. Key patterns:

**Nouns**: `Masculine noun`, `Feminine noun`, `Feminine noun (takes 'el' before stressed a-)`, `Noun: invariable form`, `Compound noun phrase`, `Noun phrase with adjective agreement`

**Adjectives**: `Adjective: used with SER (permanent trait)`, `Adjective: used with ESTAR (temporary state)`, `Adjective: SER vs ESTAR — meaning shifts`, `Adjective with -o/-a gender agreement`, `Adjective invariable by gender (ends in -e)`

**Verbs**:
- `Regular -AR verb`, `Regular -ER verb`, `Regular -IR verb`
- `Regular -AR verb (reflexive)`, `Regular -ER verb (reflexive)`
- `Stem-changing verb: e→ie`, `Stem-changing verb: o→ue`, `Stem-changing verb: e→i`, `Stem-changing verb: u→ue` (jugar only)
- `Irregular yo form` (e.g., salir → salgo)
- `Mixed irregular: yo-irregular (tengo) + stem-change e→ie` (tener, venir pattern)
- `Mixed irregular: yo-irregular (digo) + stem-change e→i + strong preterite` (decir)
- `Gustar-type verb (reverse-subject structure)`
- `Fully irregular verb` (ser, ir, etc.)
- `Irregular -UIR verb (inserts -y- except nosotros/vosotros)` (construir, producir)

**Special**: `Frequency adverb (habitual present tense)`, `Interrogative word (always written with accent mark)`, `Acronym / invariable`, `Loanword (invariable spelling)`

---

## Tapatio Flagging Convention

- `"tapatio": true` — the word is specific to or strongly associated with Guadalajara/Mexican usage, regional slang, or Tapatio culture
- `"tapatio": false` — standard Spanish
- When `tapatio` is true, `tapatio_notes` contains a human-readable explanation of the regional relevance (never empty)
- 133 entries are currently Tapatio-flagged (all notes in Spanish), verified June 23, 2026

**Example Tapatio notes format**: "🌵 Jerga tapatía esencial — la escucharás constantemente en Guadalajara."

---

## Workflow Convention

- **One chat per working session.** Start a new chat each day, do all the work for that session in it (vocabulary editing, flashcard fixes, grammar questions, tutoring — whatever the session needs), then let it end. Session notes go into `SESSION_LOG.md` via "Accepted"; current-state facts that changed get updated in place in CLAUDE.md itself.
- **Tutoring gets its own persistent chat.** Spanish conversation practice lives in a dedicated tutoring chat, kept separate from engineering/editing work. That chat has continuity worth preserving; working session chats do not.
- **CLAUDE.md + SESSION_LOG.md together are the institutional memory.** Chat history is ephemeral. CLAUDE.md holds current-state reference (schema, conventions, stats, open items); SESSION_LOG.md holds the full chronological build history. Split 2026-06-28 to keep CLAUDE.md fast to update — see SESSION_LOG.md's own header for why.

---

## Key Decisions & Conventions (Do Not Re-Litigate)

**Why adverbs are checked before verbs in classification logic**: `"verb" in pos` catches "adverb" as a substring. Any script classifying parts of speech must check `pos in ("adverb", "adverb phrase", ...)` **before** checking for verbs.

**tener/venir are "mixed irregular"**, not plain stem-changers: their grammar_notes list full conjugations without using the keyword "e→ie", so they need explicit overrides. Rule: `"Mixed irregular: yo-irregular (tengo) + stem-change e→ie"`.

**quedarse is reflexive, not gustar-type**: quedarse means "to stay" — a regular reflexive. The verb quedar can be gustar-type ("me queda bien"), but quedarse in this dictionary means to stay/remain. Do not reclassify.

**Medicina y anatomía was deliberately split**: It was originally one category. Session 1 created it. Session 2 split it into Anatomía y cuerpo (body parts) and Medicina y tratamiento (conditions/procedures). Do not recombine.

**Conjugation field keys are significant**: Standard verbs use yo/tú/él-ella/nosotros/ellos-ellas. Gustar-type verbs use me/te/le/nos/les. The different key set is intentional — it signals grammatical structure, not just a formatting choice.

**Vosotros is omitted**: This is Mexican Spanish. Vosotros conjugations are not used in Guadalajara and are not included anywhere in the dictionary.

**All grammar_notes and tapatio_notes are in Spanish**: Translated in Session 8. Do not add new notes in English.

**Los 100 Verbos config stays in lessons.json**: the drill renders in its own page (`verbos.html`) but its data (groups, tenses, special cases) remains the `type:"drill"` entry in `lessons.json` — one data file for all lessons. `lecciones.html` filters drill entries out of its picker and redirects `#verbos` to `verbos.html`. Do not duplicate the config into `verbos.html`.

**Participar mode does not write to the Leitner store** (Session 30): typing whole dialogue lines is a different skill than recalling single words; grading full phrases into per-word boxes would pollute the flashcard data. The drill (`verbos.html`) and sentence maker remain the only Leitner writers besides the flashcards. Lesson dialogues may use an occasional word not in the dictionary (e.g. "niños", "foto", "hasta"), but `vocab_highlight` lists must only contain real dictionary words — the mastery chips depend on it.

**Dialogues avoid untaught grammar**: `grammar_catalog.md` has no imperative section, so lesson dialogues use the authentic Mexican "usted + presente" pattern for instructions ("se va todo recto, dobla a la derecha") instead of formal commands (siga, doble). Keep this constraint when drafting new scenarios until commands are taught/added to the catalog.

---

## Verb Conjugation Field Order

All conjugation-related fields appear only on verb entries, in this order:

```
gerund → past_participle → present_conjugation → preterite_conjugation → imperfect_conjugation
```

Standard verbs use yo/tú/él-ella/nosotros/ellos-ellas keys.
Gustar-type verbs use me/te/le/nos/les keys across ALL conjugation fields.
Reflexive verbs prefix me/te/se/nos/se to the conjugated form.

---

## Current Dictionary Stats (July 2026)

| Metric | Value |
|--------|-------|
| Total entries | 1033 |
| Verb entries (with all conjugation fields) | 212 |
| Tapatio-flagged entries | 135 |
| Categories | 18 |
| Conjugation fields per verb | 5 (gerund, past participle, present, preterite, imperfect) |
| Largest category | Cultura tapatía (154) |
| Anatomía y cuerpo | 103 entries |
| Removed duplicates | pulmón (kept pulmones), leucocitos (kept glóbulos blancos) |

Refreshed July 19, 2026 (Session 30). Growth since the Session 24 count of 1000: ~26 entries added by the unlogged July 19 chat that built Los 100 Verbos (verbs needed for the drill), plus 7 core A1 words added in Session 30 for the new lessons (cabeza, calle, año, médico, cerca, centro, mamá — all standard Spanish, `tapatio: false`).

---

## Session History (Chronological)

Moved to `SESSION_LOG.md` in this same folder (2026-06-28) — full verbatim log of Sessions 1-28, nothing summarized or deleted, just relocated to keep this file lighter to update. Append new sessions there, not here.

---

## Potential Next Steps

- Add future tense conjugation field to all verb entries (would let the sentence maker add a future template) — now higher value with 186 verbs
- Add conditional tense conjugation field to all verb entries
- **Lesson format approved and expanded (Session 30)**: four conversation scenarios live (mercado, medico, direcciones, familia) with Leer/Participar modes and branching choice points. **Category deep-linking done for flashcards (Session 31)** via `?cat=`. Deliberately NOT wired for the sentence maker: it has no category UI, and forcing a single thin category (e.g. Comunicación y cortesía, mostly greetings/connectors) would starve the generator — a category-aware sentence maker is its own future task, better done by biasing toward the lesson's whole vocab set than one category. Natural next scenarios: en la taquería 🌵 (Stan deferred it this round), en el camión, de compras (ropa). More lessons could get choice nodes — each currently has exactly one.
- **Beta walkthrough / first-run onboarding (Phase 2, not yet built)**: hub has no starting point or explanation of the mastery levels for a brand-new user. Planned as a Spanish-first welcome panel with English on request and a suggested path. See `BETA_PLAN.md` (currently untracked).
- Add more sentence-maker templates (negation, comparatives) and an optional category filter
- Optionally strengthen the semantic layer (some grammatically-correct pairings remain intentionally quirky, e.g. *"El tequila es muy largo"*)
- Add subjunctive mood field to verbs (advanced)
