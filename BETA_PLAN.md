# Guadalajara Spanish Tutor — Beta Release Plan

_Drafted 2026-07-19. Nothing here is built yet. This is for your approval first._

## Where the project actually stands

The machine runs. You have a working hub, four conversation scenarios (mercado, médico, direcciones, familia), the Los 100 Verbos drill with its unlock ladder, Leer and Participar modes in the lessons, shared progress across every app, and a home link on all five pages. The dictionary is at 1033 entries and 212 verbs, and all 100 drill verbs carry full conjugations.

So beta is not about missing features. It is three things: connect the lessons to the practice, give a new person a way in, and actually deploy what you have.

## Definition of "beta done"

A friend or classmate can open the live URL on a phone, understand what to do without you standing next to them, move from a lesson straight into targeted practice, and have their progress stick. Everything they touch is deployed, not sitting on your Mac.

---

## Phase 0: Ship what exists and make the docs true — COMPLETE (verified 2026-07-19)

Done in the parallel Session 29 and 30 commits, not by me. Verified end to end:

- Committed in scoped chunks: `2223a4a` (break out Los 100 Verbos, interactive lessons, three new scenarios, nav audit) and `e9f503c` (Session 30 docs refresh, marked Accepted).
- Pushed: local `main` is level with `origin/main`, nothing outstanding.
- Live: `verbos.html` returns 200 on the deployed site, and the deployed `lessons.json` carries all five lessons (mercado, medico, direcciones, familia, verbos).
- Docs current: `CLAUDE.md` already reads 1033 entries, 212 verbs, four scenarios, and documents `verbos.html`; `SESSION_LOG.md` has Session 29 and 30 entries.

Correction to my earlier note: I said the docs were stale (one pilot scenario, 1000 words, 186 verbs). That was wrong. They were already current when I looked. The only cleanup left from this phase is deciding whether `BETA_PLAN.md` itself belongs in the repo.

---

## Phase 1: Connect lessons to practice — COMPLETE (commit ee9cbda, 2026-07-19)

Done: `flashcards_vocabulario.html` reads a `?cat=` parameter and preselects the category on load; all ten flashcard practice links now carry it. Sentence maker left generic on purpose (thin category would starve the generator). Original notes below.

This is the seam you were feeling. Today every practice link opens the full unfiltered deck with a text note like "elige la categoría Alimentación." Neither `flashcards_vocabulario.html` nor `sentence_maker.html` reads a URL parameter, so they cannot open pre filtered.

Steps:

1. Agree on a parameter scheme. Proposed: `flashcards_vocabulario.html?cat=Alimentación` and `sentence_maker.html?cat=Alimentación`, using the exact category names already in the taxonomy.
2. Teach both apps to read that parameter on load and preselect the category, falling back to the current full deck behavior when no parameter is present. No change to how they work otherwise.
3. Update the `practice` hrefs in `lessons.json` so each link carries its category, and trim the "elige la categoría" instruction text down to a short confirmation.
4. Optional nicety: a "practica todo el vocabulario de esta lección" link that loads only this lesson's words.

Result: a lesson becomes one continuous path from reading, to your line, to the exact deck that drills what you just saw.

Decision you own: do we also let the verb drill deep link into a specific group or tense, or keep that one as is for beta.

---

## Phase 2: The bilingual front door — COMPLETE (2026-07-19, built as the recommended panel)

Done: a Spanish first welcome panel on the hub with a mastery level explainer, a three step suggested path, and an English on request toggle. Dismissal is stored in `tapatio_onboarded`, and a small "¿Cómo empiezo?" link reopens it for returning users. Original notes below.

A new person lands on five cards with no starting point and no explanation of the box and star mastery system. This is the welcome that fixes that.

Design, following your project rules (Spanish first, English only on request):

1. A short welcome on the hub, above the cards, in Spanish, with a small "English" toggle that reveals the translation inline rather than replacing it.
2. A plain explanation of the mastery levels (Nuevas, Aprendiendo, Vas bien, Casi, Dominadas) so the progress bar means something on day one.
3. A suggested path, not a wall of choices. Something like: start with Los 100 Verbos in presente and the Tarjetas, then try a conversation scenario, then come back for the next verb group.
4. A "ya lo vi, no lo muestres otra vez" dismissal stored in localStorage so it greets newcomers and steps aside for you.

Open question for you: should the walkthrough be a calm panel on the hub, or a short guided overlay that points at each card in turn. The panel is faster to build and easier to maintain. The overlay is flashier. My lean is the panel for beta.

---

## Phase 3: A real QA lap (small, do before calling it beta)

Nothing looked broken in the code, but a beta earns a deliberate check on a real phone.

Checklist:

- Mobile Safari on your iPhone and iPad: hub, one scenario in both Leer and Participar, the verb drill, flashcards, sentence maker.
- Cold first load with an empty cache, to confirm the "open a lesson to load the dictionary" flow feels smooth for someone brand new.
- Typed grading in Participar mode across all four scenarios, watching that accents are handled with the gentle "casi" treatment you built.
- Deep links from Phase 1 open the right filtered deck, and a bare link with no parameter still works.

---

## Phase 4: Post beta, not blockers

Nice to have, explicitly out of scope for the beta line:

- Restaurant and camión/transporte scenarios to round out the starter set.
- Future and conditional tense fields on verbs, which would unlock more of the sentence maker and a seventh column in the verb drill.
- Negation and comparative templates in the sentence maker.

---

## Suggested order

Phase 0, then Phase 1, then Phase 2, then a Phase 3 lap, then deploy the finished beta. If you would rather see something live today, we can ship Phase 0 by itself as an early beta and layer 1 and 2 on top.

## What I need from you to start

1. Confirm the parameter scheme in Phase 1 (or propose your own).
2. Panel or overlay for the walkthrough in Phase 2.
3. Whether Phase 0 ships on its own or we hold for the full set.
