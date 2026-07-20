# Guadalajara Spanish Tutor — Session Log

Full verbatim chronological session history, split out of CLAUDE.md on 2026-06-28 to keep that file lighter to update. Nothing here is summarized or compressed — every session entry below is the exact original text. CLAUDE.md remains the current-state reference; this file is the historical record. New sessions get appended here going forward (most recent at the bottom, matching the original convention).

## Session History (Chronological)

### Session 1 (June 9, 2026)
- Read `grammar_catalog.md` and `spanish_dictionary.json` (627 original entries)
- Added `grammar_rule` field to all 627 entries using a ~50-label taxonomy
- Fixed adverb/verb classification bug (substring match issue)
- Fixed tener, venir, decir, oír, construir, detener misclassifications
- Fixed quedarse (reflexive, not gustar-type) and abrir (regular present, irregular participle)
- Added `gerund`, `past_participle`, `present_conjugation` to all 102 verb entries
- Designed and applied 16-category taxonomy; patched 154 uncategorized entries

### Session 2 (June 9, 2026)
- Split "Medicina y anatomía" → "Anatomía y cuerpo" + "Medicina y tratamiento"
- Fixed 6 misfiled entries (pera→Alimentación, ropa→Ropa y accesorios, aprender→Gramática funcional, miedo→Emociones y estados, palillo→Alimentación, oír→Anatomía y cuerpo + Gramática funcional)
- Added 59 liver-transplant vocabulary entries (A1–B1 medical Spanish for Shawnda's transplant context): trasplante, donante, rechazo, INR, bilirrubina, creatinina, diálisis, stent, catéter, UCI, inmunosupresor, hepatólogo, cirujano, and more
- Added chido/chida and gacho/gacha (core Tapatio slang pair)
- Built CLAUDE.md (this file)

### Session 3 (June 9, 2026)
- Added `preterite_conjugation` field to all 107 verb entries — full irregular coverage (ser/ir, dar, oír, hacer, strong u-stems, j-stems, construir), stem-changing -IR 3rd-person changes (dormir→durmió, pedir→pidió), orthographic yo-form changes (-zar→-cé, -car→-qué, -gar→-gué), gustar-type (me/te/le/nos/les keys), reflexive pronoun prefixes
- Added `imperfect_conjugation` field to all 107 verb entries — only 3 true irregulars (ser, ir, ver); everything else regular -aba/-ía pattern; stem-changers do NOT change in imperfect
- Added 26 Tapatio slang entries across four flavors: everyday expressions (güey, órale, ándale, chale, híjole, mande, sale, a poco, no manches, padre), compliments/insults (chingón, naco, gandalla, cuate, chavo), money/work (lana, feria, chamba, chambear, paro), street slang (neta, qué pedo, buena onda, mala onda, fierro, chido al cien)
- **Total entries: 714**

### Session 4 (June 9, 2026)
- Built `flashcards_anatomia.html` — interactive Spanish→English flashcard app for Anatomía y cuerpo (90 cards, 9×10 rounds, Fisher-Yates shuffle, round summaries, missed-word tracking)
- Added `esternón` (sternum/breastbone) to dictionary and Anatomía y cuerpo to reach 90 entries
- Fixed `cabello`/`pelo` English labels to distinguish Mexican vs. general usage on flashcard backs
- **Total entries: 715**

### Session 5 (June 9–10, 2026)
- Added 9 anatomy terms to Anatomía y cuerpo: axila, senos paranasales, fémur, tibia, peroné, húmero, radio, cúbito, sistema circulatorio
- *(No additional session notes were recorded for this session)*

### Session 6 (June 10, 2026)
- Removed `aneurisma` from Anatomía y cuerpo (it's a condition/event, not a body part); kept in Medicina y tratamiento + Salud y síntomas
- Added `ombligo` (navel/belly button, noun m) to dictionary and Anatomía y cuerpo — restores clean 100-entry / 10×10 deck
- Fixed flashcard blank display bug: card data rebuild had used `es`/`en` field names instead of `word`/`english` expected by JS
- Simplified between-round recall drill navigation: merged "Ver →" and "Siguiente →" into a single button
- **Total entries: 725**

### Session 7 (June 10, 2026)
- Built `flashcards_vocabulario.html` — full rebuild of the flashcard app with all 725 dictionary entries embedded
- Added category selection screen: multi-select grid of all 17 categories + "Todas," balanced sampling up to 100 cards, deck size snaps to nearest multiple of 10, default selection is "Todas"
- Talavera visual redesign: cobalt (#1B4F8A), terracotta (#C1440E), marigold (#E8971A), cream (#F5F0E8) palette; Oswald/Playfair Display/Barlow typography via Google Fonts
- Play header pill: [emoji + category name] · Ronda X de Y · Tarjeta X de Y; click to expand category list
- Card-to-card transition: deal-in animation — card flies in from lower-right at 14° rotation, glides flat on landing
- Fixed translation peek bug: back face content loads at animation midpoint (220ms setTimeout)

### Session 8 (June 10, 2026)
- All grammar_notes and tapatio_notes translated to Spanish (3-pass regex + manual fixes); 0 significant English markers remain
- Removed duplicate entries: `pulmón` (kept `pulmones`) and `leucocitos` (kept `glóbulos blancos`) — **723 entries total**
- Moved ❌ Repaso / ✅ ¡Lo sé! grade buttons onto the card back face
- Grammar callout: empty/grey before flip, reveals grammar_notes + tapatio_notes on flip; bidirectional flip supported
- Dictionary re-embedded in HTML with 723-entry JSON after all fixes

### Session 9 (June 10, 2026)
- Deleted `flashcards_anatomia.html` — superseded by `flashcards_vocabulario.html`
- Fixed recall drill blank screen bug: `recall-input-row` div was missing its `id` attribute
- Recall drill button now hidden after one completed pass (or skip)
- Removed POS badge from card front face entirely; fixed POS badge on card back (JS was reading `c.pos` instead of `c.part_of_speech`)
- Translation display split: card back shows only core translation; parenthetical clarification moves to grammar callout as `#callout-english`
- Fixed `reviewAllMissed()` on final screen: was reading from `allMissed` instead of `firstEncounterMissed`
- Pixel-perfect word alignment: grade buttons `position: absolute; bottom: 28px`, font matched at 2.4rem on both faces
- `reviewAllMissed()` now launches recall drill; `recallFromFinal` flag routes completion back to final screen
- Recall answer box always visible — grey/empty before reveal, transitions to blue callout on reveal

### Session 10 (June 11, 2026)
- Built `dictionary_editor.html` — browser-based CRUD editor for `spanish_dictionary.json`
- Features: drag-and-drop or file-input JSON load; searchable/filterable table (by word/translation, POS, category, Tapatío toggle); sortable columns; full edit modal with all fields; verb section auto-shows/hides based on POS; gustar-type toggle switches conjugation key set; Cultura tapatía auto-added when Tapatío checked; add new entries; delete with confirmation; export downloads sorted JSON with strict field order
- ⌘S keyboard shortcut triggers export

### Session 11 (June 11, 2026)
- **Leitner System — dictionary schema**: Added `leitner_box` (1–5) and `leitner_sessions_until_due` fields. State stored in the JSON itself for cross-session persistence. Fields appended at end of field order.
- **dictionary_editor.html — Leitner management**: Leitner stats strip, box filter, Leitner panel modal with bar chart distribution and reset controls, box radio buttons in edit modal, export includes leitner fields
- **flashcards_vocabulario.html — Full Leitner integration**: Load screen for JSON drag-drop; Libre/Leitner mode toggle; session mechanics (decrement sessions_until_due, filter pool); grading promotes/demotes; box intervals `[0,0,1,3,7,15]`; final screen export "⬇ Guardar progreso (JSON)"

### Session 12 (June 14, 2026)
- Built `grammar_reference.md` — CEFR A1/A2/B1 companion to `grammar_catalog.md`
- Covers 20 grammar topics not in the catalog: subject pronouns, noun gender patterns, negation, personal "a", numbers/ordinals, days/months/seasons, colors, sentence structure, modal verbs, change-of-state verbs, conjunctions, relative clause intro, impersonal se, time expressions, diminutives, weather, por vs para, future tense, conditional tense, present subjunctive, si clauses, relative pronouns, indirect speech, superlatives
- Appendix: 6 Mexican Spanish/Tapatio-specific topics including no-vosotros pronoun system, Nahuatl loanwords, diminutives as cultural marker
- **Priority rule**: `grammar_catalog.md` is primary authority; `grammar_reference.md` is fallback only

### Session 13 (June 14, 2026)
- Built `spelling_handler.js` — standalone Spanish spelling evaluator (browser + Node compatible)
- Four result statuses: `exact`, `accent_only`, `close`, `wrong`; `result.correct` true for exact and accent_only
- Handles: slash variants, article-optional matching, parenthetical articles, leading ¿¡/trailing ?! stripped
- Levenshtein fuzzy match with length-scaled threshold (1 for ≤6 chars, 2 for ≤12 chars)
- `strict: true` and `articleOptional: false` options available
- 42 automated tests, all passing

### Session 14 (June 14, 2026)
- Integrated `SpellingHandler` into `flashcards_vocabulario.html` as reinforcement typing
- **Main card spell zone**: input below each card; Enter triggers SpellingHandler feedback + auto-flip; input locks on reveal; auto-focus after deal animation
- **Recall drill**: SpellingHandler feedback appears in answer box on reveal
- `engTarget()` helper strips parenthetical notes and adds "to"-less variants for verb entries
- Feedback color coding: jade green (exact), amber (accent_only/close), muted gray (wrong) — no red, reinforcement only
- SpellingHandler module embedded inline; `spelling_handler.js` remains source of truth

### Session 15 (June 15, 2026)
- Added **Tipo de práctica** mode selector: 🖱 Clic (existing behavior) vs ⌨ Escribir (typed-answer mode)
- **Escribir mode**: click-to-flip disabled; spell zone visible; Enter → SpellingHandler → auto-flip → single result button; Leitner grade applied automatically; card waits for tap or Enter to advance
- Refactored `grade()` into `applyGrade(knew)` + `advanceCard()` + `grade()` wrapper
- Extracted `doFlipToBack()` from `flipCard()` — critical fix preventing immediate advance on programmatic flip
- `setGameMode(mode)` toggles button styles and hint text
- **Selection screen order**: Tipo de práctica buttons appear above ¡Jugar! button

### Session 16 (June 15, 2026)
- Added pinstripe borders to flashcard faces: cobalt on front, semi-transparent white on back
- Fixed mode button hover color: active button now shows `var(--cream)` text on hover (was unreadable cobalt-on-cobalt)
- Removed 5-second auto-advance in Escribir mode: card now waits for tap or Enter key after reveal
- Recall drill Enter-to-advance: pressing Enter after reveal advances to next card
- UX: deselecting all categories automatically snaps back to "Todas"
- Fixed recall drill Enter-to-reveal simultaneously advancing: `setTimeout(0)` defers advance listener past bubble phase
- Fixed recall answer box clipping grammar notes: changed to `min-height: 80px` (no overflow restriction)

### Session 17 (June 15, 2026)
- Added `ojo` (eye, noun m) — Anatomía y cuerpo + Descripción personal
- Grammar notes: TENER + definite article for eye descriptions; uninflected color adjectives in Mexican informal speech (*ojos café*); *¡Ojo!* = ¡Cuidado! interjection
- Added to both `spanish_dictionary.json` and embedded HTML dictionary
- **Total entries: 724**
- Added **space/hyphen-collapse check** to `spelling_handler.js` and embedded HTML version: stripping spaces/hyphens from both strings before comparing returns `accent_only` (correct=true) — spacing conventions don't penalize Leitner
- Updated `columna vertebral` English field to include "spinal column" as valid slash variant

### Session 18 (June 15, 2026)
- Project cleanup and archival
- Moved 111 note photos (IMG_2458.jpeg … IMG_2569.jpeg, ~2GB) to `archive/` subfolder — source material for `notes_transcription.md`, not needed for ongoing work
- Reorganized CLAUDE.md: corrected session history to chronological order, added missing Session 5 stub, fixed stale entry counts (723→724, Tapatio count, Anatomía y cuerpo count), removed stray `---` dividers from session list, updated file inventory to reflect archive

### Session 19 (June 15, 2026)
- Fixed recall drill input auto-focus: `inp.focus()` was called while `#recall-screen` had `display:none` — added explicit `.focus()` after making screen visible in both `startRecall()` and `reviewAllMissed()`
- Scanned and corrected ~150+ broken `=` patterns in `spanish_dictionary.json`: self-referential X = X entries (where both sides were the same Spanish phrase) replaced with meaningful descriptions; ~33 English fragments translated to Spanish
- **Divorced embedded JSON from HTML**: removed 362KB `var DICTIONARY = [...]` block from `flashcards_vocabulario.html` (450KB → ~87KB); restored missing constants (`ROUND_SIZE`, `MAX_DECK`, `CAT_META`, `CAT_COUNTS`, `selectedCats`) that were accidentally included in the removal; removed "play without tracking" option — Leitner mode is now the only mode; load screen now requires `spanish_dictionary.json` to proceed
- File inventory and CLAUDE.md updated to reflect divorce

### Session 20 (June 15, 2026)
- **Created GitHub repo** `sjmisina/guadalajara-spanish-flashcards` (public) — all 9 project files pushed in initial commit `bc035ae`; `.gitignore` excludes `archive/` (~2GB photos), `.DS_Store`, and scratch files
- **localStorage persistence** added to `flashcards_vocabulario.html` (commit `57ce794`):
  - Two-key strategy: `tapatio_dict_v` stores the full dictionary JSON; `tapatio_leitner` stores a lightweight `{word: {box, due}}` delta
  - On startup, `tryLoadFromStorage()` checks for cached dict — if found, skips load screen and goes straight to category selection
  - `saveDictToStorage()` called after every JSON file load; `saveLeitnerToStorage()` called after every Leitner grade and `decrementSessions()`
  - `applyStoredLeitner()` merges stored Leitner progress onto newly loaded dict entries by word key — Leitner history survives dictionary updates
  - "🔄 Actualizar diccionario" subtle button on selection screen to force a fresh JSON load without losing progress
- **Deployed to Netlify**: `https://guadalajara-spanish-flashcards.netlify.app` — GitHub → Netlify CI/CD pipeline; every `git push` to `main` auto-deploys; no build command (pure HTML/JS/JSON static site)

### Session 21 (June 15, 2026)
- Added `netlify.toml` — fixes 404 on root URL by redirecting `/` → `/flashcards_vocabulario.html` (status 200 rewrite); committed `feb3f29`
- Fixed `ombligo` english field: `"navel; belly button"` → `"navel / belly button"` — semicolons are not recognized by SpellingHandler as alt-answer separators; only slashes work
- **Auto-fetch dictionary from server** (`fetchDictFromServer()`) — on init, if localStorage is empty, app now `fetch()`es `spanish_dictionary.json` from the same Netlify origin; falls back to drag-drop screen only if fetch fails (e.g., running locally via `file://`); committed `0dca245`
- Updated `showUpdateDictScreen()` — "🔄 Actualizar diccionario" now re-fetches from server instead of showing drag-drop; drag-drop remains as fallback
- **Net result**: visiting the Netlify URL for the first time loads the app fully automatically — no drag-drop ever required

### Session 22 (June 16–17, 2026)
- Added `Animales` category — 94 new entries (94 added on top of the existing dictionary, reaching 818 total); committed `648f6f5`
- Selection-screen polish: scrollable category box (max ~3.5 rows, scroll-fade affordance), mobile overflow fixes, mode buttons moved above category grid, categories alphabetized with "Todas" pinned first; committed `7b106e3`
- Left-aligned the Clic/Escribir hint text under the button group instead of centering it under the full row; added an available-card-count note under the Rondas selector; committed `e096de2`
- **Bug fix**: available-card-count note was reading `buildPool()`'s result, which intentionally caps at `MAX_DECK` (100) for deck-building — so selecting any category (or combo) over 100 words showed "100" instead of the true count. Added `distinctPoolSize(cats)`, a true uncapped distinct-word counter, and pointed the note at it instead. Verified with a synthetic-data Node harness across several category sizes; committed `8e18575`
- Verified `fisherYates()`/`buildPool()` randomization is genuine (20,000-trial position-frequency check, max deviation 6.6%) and confirmed category/mode/rounds selections persist across rounds within a session but correctly reset on page refresh — no code changes needed for either, just verification
- **Full project review** (punch list, no changes during the pass itself): found CLAUDE.md's stats/category tables stale relative to the dictionary (724→818 entries, 17→18 categories, all per-category counts drifted) — refreshed in this same session; found `ultrasonido` had `tapatio: false` with non-empty `tapatio_notes`, violating the documented convention — judgment call: flipped to `tapatio: true` (+ added `Cultura tapatía` to its categories) rather than deleting the notes, since the note content ("en Guadalajara y en todo México...") fits the Tapatio-flagging definition; found `spelling_handler.js` (standalone) and its embedded copy in `flashcards_vocabulario.html` had drifted on one wrong-answer message string — synced the embedded copy to match the standalone source (5 entries initially flagged as "non-verb with verb fields" — `dar la vuelta`, `haber`, `hay`, `pedir prestado`, `quepo` — turned out to be a false positive from an incomplete POS whitelist in the check script, not a real data issue)
- All commits for this session confirmed pushed to `origin/main` from Stan's own terminal (sandbox session has no GitHub credentials, so pushing is always handed off to Stan)

### Session 23 (June 23, 2026)
- **Built the Constructor de Oraciones (sentence maker)** — a sophisticated, dynamic fill-in-the-blank generator. Sentences are never stored; every exercise is assembled at runtime from `spanish_dictionary.json`.
  - `sentence_engine.js` — Node-testable source of truth (browser global `SentenceEngine`). Classifies entries (82 standard verbs / 20 reflexive / 5 gustar / 507 nouns / 63 adjectives), runs **11 agreement-aware templates**, and uses **only conjugations present in the dictionary** (present/preterite/imperfect — a verb is skipped for a tense unless all five person-forms exist; nothing is invented). No vosotros.
  - Tests verbs, articles, adjectives, and pronouns: subject, possessive, direct object, indirect object, reflexive, plus gustar-type agreement. Up to 3 blanks per sentence.
  - **SER vs ESTAR** copula is chosen from the adjective's `grammar_rule` tag (not random), so e.g. *"Ellos están concentrados"* / *"Él es pelirrojo"* are correct.
  - **Leitner-weighted** target selection: weight `(6 − box)`, doubled if due → ~3× over-representation of box-1/due words (verified). Shares the flashcards' `tapatio_leitner` store and writes grades back (promote/demote, `BOX_INTERVALS=[0,0,1,3,7,15]`). One battery = one decremented session. Pronoun-only blanks never touch Leitner.
  - **Light semantic-compatibility layer**: coarse noun classes (person/animal/food/body/place/clothing/thing) and adjective domains keep pairings sensible (adjectives only land on compatible nouns; person-subjects avoid food/weather adjectives; *comer*→food objects, *doler*→body, gustar→food/animals, transfer verbs only for IO frames). Grammar tested is always correct; some pairings remain intentionally quirky by design.
  - `sentence_maker.html` — Talavera-styled app. Rounds of 10, up to 5 (50 max), **no repeats** (dedup by filled sentence). Difficulty selectable: **⌨ Escribir** (typed, graded by SpellingHandler — accent-tolerant) or **🔘 Opción múltiple** (3–4 options, answer always present, same-type distractors). English help only on request (per project rules). Loads via localStorage + fetch fallback; references sibling `sentence_engine.js` + `spelling_handler.js`.
- **Built `index.html`** — central launcher for the app suite (extensible `APPS` array). Updated `netlify.toml` to serve `/` → `/index.html` (was → flashcards).
- **Documented the spec** in `grammar_reference.md` **Part B — Sentence Construction & Generation Spec** (person table, slot types, agreement rules, SER/ESTAR logic, tense cues, template catalog, Leitner mechanics). Mirrors `sentence_engine.js`.
- **Data fix**: corrected `abrazar` preterite *yo* `abrazé` → `abracé` (-zar→-cé rule) so the generator never teaches the wrong form. (Note: this was the only orthographic conjugation error scanned for — a full audit of -car/-gar/-zar preterites and -cer/-cir/-uir present forms across all 101 other verbs is a recommended future pass.)
- **Verification**: Node harness (50 sentences × both modes = 0 failures: uniqueness, ≤3 blanks, every verb/ser-estar answer is a real dictionary form, MC options always contain the answer); integration test (SpellingHandler accepts 100% of generated answers, accent-tolerant; Leitner writeback promotes correctly); full jsdom play-through of both modes to the final screen with shared store written.

### Session 24 (June 23, 2026)
- **Full verb-conjugation audit** (the punch-list item from Session 23). Built four independent checkers (targeted orthographic rules, a regular-verb regenerator, a curated 18-verb / 155-form irregular table, and imperfect/nosotros regularity), cross-checked by manual eyeball of every stem-changer and irregular. Across ~2,750 conjugated forms the dictionary held up extremely well: only real issues were **`brincal`→`brincar`** (headword typo; all conjugations were already correct for *brincar*) and **`pedir prestado`** (restored "prestado" in the preterite and imperfect, which had dropped it). Tightened **`nacer`**'s label to `Irregular yo form (c→zc): nazco` (was "Regular -ER verb"); confirmed `abrir`'s label was already precise. All remaining audit flags are documented false positives (strong preterites like *trajo/anduve*, correct irregular participles *escrito/abierto*, the *envío* accent verb, and multi-word verb phrases that trip naive stem-splitting).
- **Two engine bugs surfaced by the audit and fixed in `sentence_engine.js`**: (1) `doPron` hard-coded `ver` (not a dictionary entry) for its setup clause, producing *"Ellos veo…"* for non-*yo* subjects — now uses the chosen in-dictionary verb for both clauses; (2) feminine nouns with a stressed initial *a-* now correctly take **el/un** in the singular (*el agua, un águila*) via `defArtForNoun`/`indefArtForNoun` keyed off the dictionary's `grammar_rule`, while agreement stays feminine. Verified across 800 batteries (43 occurrences, 0 wrong articles).
- **Expanded the dictionary 818 → 1000 words** (Stan's goal). Added **78 verbs** — every conjugation machine-generated by a stem-change/orthographic conjugator with explicit overrides for the irregulars (ver, poner, caer, andar, irse, enviar, freír, conseguir, ir-based forms; irregular participles escrito/muerto/visto/puesto/frito), then run through the full audit suite (0 flags). Fills core A1 gaps (ver, poner, leer, escribir, tomar, llegar, necesitar…), stem-changers, irregulars, daily-routine reflexives, and chef/medical themed verbs. Added **104 non-verbs** across five themes Stan chose — Numbers/quantities/adjectives, Travel & city, Food & cooking, Medical & health, Entertainment & culture — with **25 new Tapatío/Jalisco-flagged** items (mariachi, tequila, torta ahogada, jericalla, tejuino, cahuama, molcajete, charrería, aventón, cuadra…). Merge sorted with a Spanish-collation key (á≈a, n<ñ<o) that reproduces the file's existing order, so existing entries didn't churn. New stats: 186 verb entries, 133 Tapatío-flagged, largest category Cultura tapatía (152).
- **`sentence_maker.html`**: added the **🔄 Actualizar diccionario** button + loaded-word-count display on the setup screen (`updateDict()` re-fetches the JSON, overwrites the `tapatio_dict_v` cache, preserves Leitner progress). Returning users must click it (or the flashcards' equivalent — they share the cache) to pull the new 1000-word set.
- **Verification**: final audit clean (0 real flags); engine harness 50 unique sentences × both modes = 0 failures with 1000 words; jsdom play-through passes and writes 1000 words to the shared Leitner store; refresh button verified in jsdom.

### Session 25 (June 23, 2026)
- **Reworked `index.html` from a launcher into the tutor home base** (Stan's request). Three zones:
  - **Dictionary control as the central focus**: on load the hub auto-fetches `spanish_dictionary.json`, compares against the cached copy (length + word-list), and overwrites the shared `tapatio_dict_v` cache when it differs — so simply opening the hub keeps the flashcards and sentence maker current. Friendly status line + last-updated ("actualizado hoy/ayer/fecha"), animated status dot, and a manual **🔄 Actualizar palabras** button (`checkDict(manual)`). Degrades gracefully offline / on `file://`.
  - **Progress panel** (`renderProgress()` / `loadProgress()`): reads `tapatio_dict_v` + the `tapatio_leitner` overlay, shows total words and **⭐ mastered** count + % , and a 5-segment mastery bar with a legend. **Per Stan: no "word-nerdy" terms** — boxes 1–5 are surfaced only as 🌱 Nuevas / 📖 Aprendiendo / 💪 Vas bien / 🔥 Casi / ⭐ Dominadas. Verified (regex over visible-only text) that "Leitner"/"box"/"caja" never appear in the rendered UI.
  - **Lessons vs Tools**: card grid from an `APPS` array tagged `kind:'lesson'|'tool'`. Lessons = Tarjetas de Vocabulario + **Constructor de Oraciones** (name kept per Stan's pick); Tools = Editor del Diccionario. Adding an app stays a one-line array entry.
- **Design**: kept the Talavera palette/identity but leaned on Barlow for readability (larger base size, Playfair only on the hero line), one purposeful emoji per element, fully responsive.
- **Verification**: jsdom run confirms 2 lesson + 1 tool cards, auto-check sets "✅ Todo al día · 1000 palabras · actualizado hoy", progress legend/levels render from a simulated review overlay, mastery-bar segments size correctly, and the manual refresh path works. Pushed to `origin/main` from Stan's terminal.

### Session 26 (June 25, 2026)
- **Built a 9-step structural difficulty ladder for the Constructor de Oraciones** — Stan's request to layer a second difficulty axis on top of the existing per-word Leitner weighting, sequenced to match how Aura and Lalo actually taught the class (`notes_transcription.md` dates), not `grammar_catalog.md`'s topical order, and cross-checked against published L2 Spanish acquisition research.
  - `sentence_engine.js`: new `STEPS` table (cimientos → gustar/IO → reflexivos → presente continuo → futuro próximo → pretérito → imperfecto → pretérito perfecto → objeto directo); `generateBattery({stepIndex, taper})` builds a weighted template pool from cumulative unlocked content; **tapering** blends in a growing preview (up to 35%) of the next step's content as the learner nears the gate (`taperFraction`), so steps feel rounded rather than a hard wall, per Stan's request; `recordStepProgress()` gates one-way advancement at **≥70% accuracy over a minimum 15 attempts**, counting only a step's own newly-introduced content (never review content from earlier steps, never taper-preview content from the next one).
  - Three new templates: **presenteContinuo** (ESTAR + gerundio), **preteritoPerfecto** (HABER + participio), **dobleObjeto** (le/les→se + lo/la/los/las) — confirmed via Stan's pick to build all three at once.
  - `conjVerb`/`subjPron`/`reflexive` are **tense-gated** rather than template-gated — they're available from step 0, but which tense (present/preterite/imperfect) they may draw from is threaded in per-battery via a `ctx.tenses` map keyed to the current step.
  - `sentence_maker.html`: new **"Tu nivel"** panel on the setup screen showing the current step (friendly Spanish, grammar terms shown since Stan was taught them directly — but no Leitner/box jargon), a progress bar toward the next step, and a level-up toast. State lives in its own `tapatio_sentence_step` localStorage key, separate from the shared Leitner store.
  - `grammar_reference.md`: added **§B.9** documenting the ladder, tapering, and gating; updated B.5 (new tense cues) and B.6 (3 new template entries).
- **Bug found and fixed**: `introducingStepIndex()` initially checked template-list membership before tense-add membership, which permanently stalled progress at step 5 (Pretérito) since `conjVerb`/`subjPron`/`reflexive` already appear in step 0's template list for pool-building purposes. Fixed by checking tense-adds first. Verified via a 172-session jsdom simulation reaching all 9 steps with zero errors.
- **Data issue surfaced, not fixed**: `quedarse` is documented and classified everywhere (including this file, Session 1) as reflexive, but its `present_conjugation` field actually uses gustar-type keys (`me/te/le/nos/les`) instead of standard ones. The engine's classifier detects gustar-type verbs by the presence of a `me` key, so `quedarse` is currently misclassified into the gustar bucket. Flagged for Stan's decision — not changed, since dictionary data edits are out of scope for this session.
- Committed `fd5667b`; pushed to `origin/main` from Stan's terminal (sandbox has no GitHub credentials).

### Session 27 (June 25, 2026)
- **Closed out the `quedarse` incident flagged in Session 26.** Two fixes, both verified with `SentenceEngine.classify()` and live battery generation before being committed:
  - **Data fix** (`spanish_dictionary.json`): `quedarse`'s `present_conjugation` used gustar-type keys/values (`me: "queda / quedan"`, etc.) instead of standard reflexive ones. Replaced with the correct `{yo: "me quedo", tú: "te quedas", él/ella: "se queda", nosotros: "nos quedamos", ellos/ellas: "se quedan"}` shape. Confirmed via `classify()`: `model.gustars` 5→4, `model.reflexives` 27→28, `quedarse` now lands in the reflexive bucket. Committed `dcdc899`.
  - **Engine fix** (`sentence_engine.js`): reclassifying `quedarse` alone wasn't enough to make it show up in practice — the `reflexive` template draws from a separate, pre-existing `ROUTINE_REFLEXIVES` whitelist (13 verbs that "form a complete clause without a direct object") before falling back to the full pool, and `quedarse` had never been on it. Confirmed `reflexive` is the *only* template that reads `model.reflexives`, so this whitelist was the actual gate. Asked Stan whether to add it; he said yes ("se queda en casa" reads as a complete clause same as the others). Added `quedarse` to `ROUTINE_REFLEXIVES`. Verified: 104 `quedarse` blanks across 15,000 generated exercises (0 before the fix). Committed `a01b133`.
- Net result: `quedarse` now both classifies correctly and actually appears in Constructor de Oraciones reflexive-template sentences.

### Session 28 (June 25, 2026)
- **Three new gameplay mechanics for the Constructor de Oraciones**, all implemented entirely within `sentence_maker.html` — `sentence_engine.js` was read for context but not modified, so `grammar_reference.md` §B stays in sync with no edits needed.
  - **Tiered hints with a cost**: the help button now escalates through two tiers instead of one full reveal. Tier 1 (💡 Pista) shows only the existing grammar note (or a generic nudge) without the answer. Tier 2 (👁 Ver respuesta) reveals the answer + gloss + note, labeled as "cuenta como repaso, no como dominado." Reaching tier 2 on a card forces that card's Leitner grades to `knew:false` regardless of whether the typed/clicked answer was actually correct — full reveal can't sneak a word into a higher box. New final-screen stats: `pistas` (tier-1 uses) and `reveladas` (tier-2 uses).
  - **Missed-word review pass**: each round now tracks which `wordKey`s had a wrong blank (`roundMissedWords`). The round-summary screen shows a "📝 Repasar N palabras que fallaste" button when any exist; clicking it samples a fresh batch from `generateBattery()` and filters down to exercises that touch a missed word, then plays through a short side-loop (own `reviewStats`, doesn't touch main `stats` or the round's Leitner-due decrement) before returning to wherever the round summary would otherwise have sent the learner (next round or final screen).
  - **Mid-session exit to setup**: a small ⚙ button on the play screen's progress bar calls `confirmBackToSetup()`, which asks for confirmation only if the current card hasn't been checked yet (so an in-progress answer isn't silently discarded) and handles the review-pass case with its own confirmation text. The round-summary screen also got a direct "⚙ Volver a configuración" button with no confirmation needed, since nothing is in-progress there.
  - Architecture note: all three mechanics route through one new indirection, `currentExercise()` (returns `reviewList[reviewIdx]` when `reviewMode` else `battery[cur]`), so the existing round/battery/Leitner/step-ladder flow needed zero changes for the non-review path.
- **Verification**: built a jsdom harness (Node, headless) that loads `spelling_handler.js` + `sentence_engine.js` + the inline app script into a real DOM, ingests the 1000-word dictionary, and drives the UI programmatically. Confirmed: tier-1 hint never contains the answer text and tier-2 always does; a full-reveal card forces Leitner `knew:false` even with a correct answer; missed-word tracking populates and the review button's generated exercises all reference a missed word; the review pass keeps its own stats and correctly hands off back to next-round/final; the setup-exit confirm respects both accept and cancel, and the round-screen's direct exit skips confirmation entirely; a full two-round battery still completes normally start to finish (no regression from the `currentExercise()` indirection).
- Two harness bugs were found and fixed in the test script itself (not the app): jsdom needs `beforeParse()` to install `fetch`/`confirm`/`alert` stubs before the inline script runs (setting them after `new JSDOM()` is too late since `runScripts:'dangerously'` executes scripts during parsing); `const`-declared globals (`SpellingHandler`) don't attach to `window` when run via `window.eval()` the way `var`-declared ones do (`SentenceEngine`), so the harness re-assigns `window.SpellingHandler = SpellingHandler` in the same eval call.
- Not committed/pushed this session — changes are local to `sentence_maker.html` only, awaiting Stan's go-ahead per the standing "confirm before push" convention.

### Session 29 (June 29, 2026)
- **Topical/scenario lessons, pilot built.** Stan asked to give the project a once-over and discuss enabling topical lessons. Locked in four design decisions before building anything: Claude drafts dialogue and Stan edits (not auto-generated and shipped untouched); text-only, no audio; no new progress-tracking storage key — reuse the existing Leitner data for any mastery display; lessons surface as a single "Lecciones" card in `index.html` with an internal scenario picker, not one card per scenario.
- Before starting the build, confirmed and pushed all changes already queued from prior sessions (commit `f856b42`) per Stan's request not to start new feature work with anything outstanding.
- **Built `lessons.json`** — one pilot scenario, `mercado` ("En el mercado": buying avocado, cheese, and strawberries at a market stall, entirely in usted register). Every word in its `vocab_highlight` list (18 words) was cross-checked against `spanish_dictionary.json` — zero fabricated vocabulary. All four `grammar_refs` cite exact, verbatim-sourced material from specific numbered sections of `grammar_catalog.md` (§2 HAY, §18 GUSTAR + similar verbs, §28 Cortesía y Formalidad — usted as the Guadalajara default with vendors/strangers, §30 Contables vs. No Contables + Cuantificadores), not paraphrased from memory.
- **Built `lecciones.html`** — hash-routed picker → detail viewer matching `index.html`'s Talavera design system. Picker shows a friendly mastery chip per lesson (🔥 N/M ya casi dominadas) computed live from the existing `tapatio_dict_v` + `tapatio_leitner` localStorage caches, with zero "Leitner"/"box" jargon and no new storage key. Detail view renders the dialogue as chat bubbles, a vocabulary chip list, grammar callout cards citing exact catalog section numbers, and a practice-links section.
- **Deliberate scope cut**: neither `flashcards_vocabulario.html` nor `sentence_maker.html` supports URL-param category pre-filtering today, so the pilot's practice links go in as plain unfiltered links with manual-selection guidance text (e.g. "elige la categoría Alimentación"), rather than building that filtering feature now. Logged as a Potential Next Step, deferred until after Stan reacts to the lesson *format* itself — keeps the pilot tight to its actual purpose (format validation).
- **Added one `index.html` APPS entry** — a single "Lecciones" lesson card (💬, purple accent, badge "Conversación") inserted before the Tarjetas de Vocabulario card, per the single-card-with-internal-picker decision.
- **Verification**: ran a hand-built Node test harness (stubbed DOM/localStorage/location, real `<script>` contents extracted and eval'd) confirming correct behavior for: empty-cache mastery (returns null, no crash), seeded mastery counts, picker card generation (correct href, title, CTA), full detail rendering (18 dialogue lines, 18 vocab chips, all 4 grammar sections, 4 practice items), HTML-escaping safety against injection, and hash routing including recovery from an invalid hash. A full browser-level Playwright pass was attempted but not completed (install/sandbox timeout); the Node harness was judged a reasonable substitute given it exercises the real extracted script logic rather than a reimplementation.
- **Housekeeping note**: this entire session ran inside the "On-line Presence" Cowork project container instead of this one, even though all file reads/writes correctly targeted this project's folder throughout (Cowork's project container only governs which CLAUDE.md/instructions load into the chat, not which folders are mounted/writable). Practical consequence: the "Accepted" keyword trigger couldn't reach this project's CLAUDE.md/SESSION_LOG from that chat, so Stan asked for this session's documentation and push to be done manually instead — this entry is that manual log. No data was at risk and no rule was broken; future Tutor sessions should still be started from this project's own container per the standing one-chat-per-session workflow convention.
- Committed and pushed `lessons.json`, `lecciones.html`, the `index.html` APPS entry, this CLAUDE.md update, and this log entry to `origin/main` (`SignalCraftLabsLLC/guadalajara-spanish-tutor`) via the Desktop Commander host-shell workaround (this repo's sandboxed bind-mount has a persistent `.git/index.lock` permissions issue under the regular bash tool). Netlify CD picks this up automatically.


### Session 30 (July 19, 2026)
- **Context note**: between Session 29 (June 29) and this session, an earlier chat today (July 19, file mtimes ~10:24–10:59) built **Los 100 Verbos** — the tense/group drill inside `lecciones.html` plus the `type:"drill"` entry in `lessons.json` — and grew the dictionary from 1000 to 1026 entries (verbs needed for the drill). That chat was never "Accepted," so it has no log entry of its own; its end state is documented here and in the updated CLAUDE.md. Nothing from it was lost or changed except as described below.
- Stan opened with four requests after playing with the tool: (1) break the verb activity out of Lecciones into its own selectable activity, (2) expand topical lessons with an interactive element — three ideas requested, (3) propose more topical lesson scenarios, (4) audit the whole project so every activity has back-one-level plus a home button.
- **Ideas presented and chosen** (AskUserQuestion): interactive element — Stan picked BOTH "Toca tu papel" (type your own lines, spelling-graded) and "Conversación con caminos" (branching choices); they merged into one Participar mode. Scenarios — Stan picked Con el médico, Pidiendo direcciones, and Presentando a la familia (deferred En la taquería).
- **Los 100 Verbos broken out** → new standalone `verbos.html` (drill CSS/JS lifted verbatim from lecciones.html; same `tapatio_verbos` store, same presente→`tapatio_leitner` sync, so zero progress lost). New ⚡ APPS card on index.html. `lecciones.html` now filters `type:"drill"` from its picker and `location.replace()`s old `#verbos` deep links to `verbos.html`. Drill config deliberately stays in `lessons.json` (decision logged in CLAUDE.md).
- **lecciones.html rewritten** with a 📖 Leer / 🎭 Participar mode toggle on every conversation lesson:
  - Leer: full dialogue; choice points render as tappable option buttons with a "↺ Probar la otra opción" re-choose link; picked branches show the option's grammar note plus response lines inline.
  - Participar: progressive reveal; at the player's linear turns the student types the Spanish line from an English cue, graded by `SpellingHandler` over punctuation-stripped, whitespace-normalized, lowercased phrases (exact ✅ / accent_only ✏️ pass; close/wrong invite retry); 🛟 Pista reveals the line two words at a time; "Mostrar línea" is the no-score escape; second-try successes get their own 💪 label. Choice nodes become real decisions. Ends with a first-try score summary and replay buttons. Deliberately writes nothing to the Leitner store (decision logged).
  - Bubbles now use `me`/`them` classes derived from the new per-lesson `player` field instead of hardcoded `.Cliente`/`.Vendedora` speaker classes.
- **Three new lessons authored in lessons.json**, each with exactly one branching choice node, a `player` field, verified vocab, and real catalog citations:
  - `medico` 🩺 (usted, both directions): doler singular vs plural is the branch point (§39, §40, §20, §29). Ends with "¡Que se mejore!".
  - `direcciones` 🧭 (usted with strangers): asking the way to Mercado San Juan de Dios; branch = "¿Puedo caminar?" vs "¿Me puede repetir, más despacio?" (§41, §1, §11, §28). Since the catalog has no imperative section, the señora gives directions in the authentic Mexican "usted + presente" pattern (se va todo recto, dobla, cruza) — constraint logged in CLAUDE.md.
  - `familia` 👨‍👩‍👧‍👦 (first tú-register lesson, register_note flags the contrast): Stan himself is the player-speaker, showing a photo — wife of thirty years, two adult kids (36/35), three grandkids (14/13/11, dos nietos y una nieta). Branch = two ways to introduce the grandkids, one a possessives wordplay (§16, §10, §12, §1).
  - `mercado` gained `player: "Cliente"` and works in both modes unchanged.
- **Dictionary +7 core A1 words** the lessons exposed as missing (cabeza, calle, año, médico, cerca, centro, mamá) — schema-exact, notes in Spanish, `tapatio:false`, inserted via the editor's own sort comparator (`localeCompare('es')`). 1026 → 1033. Surprising pre-existing gaps like cabeza and calle in a 1026-word dictionary: worth a future gap-audit of other everyday basics.
- **Navigation audit** (request 4): lecciones was the only compliant page. Fixed: flashcards got a fixed "← Inicio" pill visible on all screens incl. mid-game (its ← Categorías already covered back-one-level); sentence maker got a 🏠 confirm-guarded home button beside the ⚙ on the play screen and a home link on the round-summary screen; dictionary editor got "← Inicio" in its header bar; verbos.html shipped with ← Inicio. Every activity now has both back-one-level and home.
- **Verification** (no browser available in sandbox): all six pages' inline scripts pass `new vm.Script()` syntax checks; both JSON files parse; every vocab_highlight word and all 100 drill verbs confirmed present in the dictionary; every lesson's `player` matches a dialogue speaker; choice nodes structurally valid; `SpellingHandler.check` confirmed to return exact/accent_only/wrong correctly on normalized full phrases; home-link audit confirmed on all pages; zero drill-code leftovers in lecciones.html and redirect confirmed present. Stan asked to click through Participar mode by hand as the remaining test.
- Sandbox git note: the FUSE lock workaround's `mv` must be a same-directory rename — `mv` to `/tmp` fails silently (cross-filesystem mv = copy + blocked unlink).
- Committed `2223a4a` (8 files, +926/−881) and, after Stan's "Accepted", this CLAUDE.md + SESSION_LOG update as a second commit. Push handed to Stan per standing convention (sandbox has no GitHub credentials).
