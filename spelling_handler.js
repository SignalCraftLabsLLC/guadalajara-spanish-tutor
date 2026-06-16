/**
 * SpellingHandler — Spanish spelling evaluator for tutoring exercises
 *
 * Evaluates a typed answer against a correct answer and returns a rich
 * result object with status, feedback (in Spanish), and diagnostic info.
 *
 * Match statuses:
 *   'exact'       — perfect match (case-insensitive)
 *   'accent_only' — correct word, missing/wrong accents or ñ
 *   'close'       — small typo (edit distance ≤ threshold)
 *   'wrong'       — clearly incorrect
 *
 * result.correct  === true  for 'exact' and 'accent_only' (when strict=false)
 * result.close    === true  for 'close'
 *
 * Usage:
 *   const r = SpellingHandler.check(userInput, correctAnswer);
 *   if (r.correct)  → accept the answer
 *   if (r.close)    → show a hint
 *   r.feedback      → display to the student (Spanish string)
 *
 * Supports:
 *   - Slash variants:    "chido/chida" → either is accepted
 *   - Leading articles:  "el gato" → "gato" also accepted (articleOptional)
 *   - Parenthetical:     "(el) libro" → "el libro" or "libro"
 *   - Accent detection:  distinguishes missing ñ from missing accent mark
 *   - Strict mode:       accent errors count as wrong
 *
 * Compatible with browser (global SpellingHandler) and Node (module.exports).
 */

const SpellingHandler = (() => {

  // ── Normalization ─────────────────────────────────────────────────────────

  /** Lowercase mapping for Spanish diacritics → ASCII equivalents */
  const DIACRITIC_MAP = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'ü': 'u', 'ñ': 'n'
  };

  /**
   * Strip Spanish diacritics and ñ → lowercase ASCII equivalents.
   * @param {string} s
   * @returns {string}
   */
  function stripDiacritics(s) {
    return s.replace(/[áéíóúüñÁÉÍÓÚÜÑ]/g, c => DIACRITIC_MAP[c.toLowerCase()] || c);
  }

  /**
   * Full normalization: lowercase, strip diacritics, collapse whitespace,
   * strip leading/trailing inverted punctuation (¿ ¡).
   * @param {string} s
   * @returns {string}
   */
  function normalize(s) {
    return stripDiacritics(
      s.toLowerCase()
       .trim()
       .replace(/^[¿¡]+/, '')   // strip leading ¿ ¡
       .replace(/[?!.]+$/, '')  // strip trailing punctuation
       .replace(/\s+/g, ' ')
    );
  }


  // ── Levenshtein distance ──────────────────────────────────────────────────

  /**
   * Classic dynamic-programming Levenshtein distance.
   * Operates on normalized (ASCII) strings so accents don't inflate distance.
   * @param {string} a
   * @param {string} b
   * @returns {number}
   */
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    // Two-row rolling array for memory efficiency
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    let curr = new Array(b.length + 1);

    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1,          // deletion
          curr[j - 1] + 1,      // insertion
          prev[j - 1] + cost    // substitution
        );
      }
      [prev, curr] = [curr, prev];
    }
    return prev[b.length];
  }


  /**
   * Light clean: strip leading ¿¡ and trailing ?!. without touching diacritics.
   * Used for the exact-match comparison so "¿mañana?" is treated as "mañana".
   * @param {string} s
   * @returns {string}
   */
  function lightClean(s) {
    return s.trim()
      .replace(/^[¿¡]+/, '')
      .replace(/[?!.]+$/, '')
      .toLowerCase();
  }


  // ── Variant expansion ─────────────────────────────────────────────────────

  /** Matches a leading definite or indefinite article + space */
  const ARTICLE_RE = /^(el|la|los|las|un|una|unos|unas)\s+/i;

  /**
   * Expand a correct-answer string into all equivalent acceptable forms.
   *
   * Examples:
   *   "chido/chida"       → ["chido", "chida"]
   *   "el gato"           → ["el gato", "gato"]
   *   "(el) libro"        → ["el libro", "libro"]
   *   "el médico/la médica" → ["el médico","médico","la médica","médica"]
   *
   * @param {string} answer
   * @param {boolean} articleOptional  — if true, strip leading article variant added
   * @returns {string[]}               — deduplicated list
   */
  function expandVariants(answer, articleOptional = true) {
    const seen = new Set();
    const add = s => { const t = s.trim(); if (t) seen.add(t); };

    // Split on "/" first — each slice is its own acceptable form
    const slashes = answer.split('/').map(s => s.trim()).filter(Boolean);

    for (const raw of slashes) {
      // Handle parenthetical article: "(el) libro" → "el libro" and "libro"
      const deParenMatch = raw.match(/^\(([^)]+)\)\s*(.+)$/);
      if (deParenMatch) {
        const withArticle = `${deParenMatch[1]} ${deParenMatch[2]}`;
        add(withArticle);
        add(deParenMatch[2]);
        if (articleOptional) {
          // also strip if there's an article inside the parens
          add(deParenMatch[2].replace(ARTICLE_RE, ''));
        }
        continue;
      }

      add(raw);

      // Article-optional: "el gato" → also accept "gato"
      if (articleOptional) {
        const stripped = raw.replace(ARTICLE_RE, '');
        if (stripped !== raw) add(stripped);
      }
    }

    return [...seen];
  }


  // ── Close-match threshold ─────────────────────────────────────────────────

  /**
   * Max edit distance (on normalized strings) to count as 'close'.
   * Scales with word length to avoid flagging short-word typos too liberally.
   * @param {string} normWord  — normalized target word/phrase
   * @returns {number}
   */
  function closeThreshold(normWord) {
    const len = normWord.length;
    if (len <= 3)  return 1;  // "ojo" — 1 typo tolerated
    if (len <= 6)  return 1;  // "gato" / "padre" — 1 typo
    if (len <= 12) return 2;  // "mañana" / "trabajar" — 2 typos
    return 2;                 // cap at 2 — avoid over-forgiving long phrases
  }


  // ── Feedback generators ───────────────────────────────────────────────────

  const EXACT_MSGS = [
    '¡Perfecto! ✓',
    '¡Exacto! ✓',
    '¡Muy bien! ✓',
    '¡Correcto! ✓',
    '¡Órale, así es! ✓',       // 🌵 Tapatio
    '¡Chido, lo tienes! ✓',    // 🌵 Tapatio
  ];

  const WRONG_MSGS = [
    '¡Inténtalo de nuevo!',
    'No del todo, ¡sigue intentando!',
    'Mmm, no exactamente.',
    '¡Échale ganas, casi lo tienes!',  // 🌵 Tapatio
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /**
   * Build specific accent-error feedback by inspecting what's missing.
   * @param {string} rawInput
   * @param {string} correctVariant
   * @returns {string}
   */
  function accentFeedback(rawInput, correctVariant) {
    const lcIn  = rawInput.toLowerCase();
    const lcCor = correctVariant.toLowerCase();
    const missingEne    = /ñ/.test(lcCor)    && !/ñ/.test(lcIn);
    const missingAccent = /[áéíóúü]/.test(lcCor) && !/[áéíóúü]/.test(lcIn);

    if (missingEne && missingAccent)
      return `¡Casi! Revisa la ñ y los acentos → "${correctVariant}"`;
    if (missingEne)
      return `¡Casi! Falta la ñ → "${correctVariant}"`;
    if (missingAccent)
      return `¡Casi! Falta el acento → "${correctVariant}"`;
    // ü or other orthographic difference
    return `¡Casi! Revisa la ortografía → "${correctVariant}"`;
  }

  /**
   * Build close-match feedback.
   * @param {string} correctVariant
   * @returns {string}
   */
  function closeFeedback(correctVariant) {
    return `¡Casi! ¿Quisiste escribir "${correctVariant}"?`;
  }


  // ── Main evaluation function ──────────────────────────────────────────────

  /**
   * Check a typed answer against the correct answer.
   *
   * @param {string} userInput       — raw text from the input field
   * @param {string} correctAnswer   — from dictionary (may include slashes / articles)
   * @param {object} [opts]
   * @param {boolean} [opts.strict=false]          — accent errors count as wrong
   * @param {boolean} [opts.articleOptional=true]  — allow omitting leading article
   *
   * @returns {{
   *   status:         'exact'|'accent_only'|'close'|'wrong',
   *   correct:        boolean,
   *   close:          boolean,
   *   matchedVariant: string|null,
   *   editDistance:   number,
   *   feedback:       string
   * }}
   */
  function check(userInput, correctAnswer, opts = {}) {
    const {
      strict          = false,
      articleOptional = true,
    } = opts;

    const raw = (userInput || '').trim();

    // Empty input
    if (!raw) {
      return makeResult('wrong', null, Infinity, '¡Escribe tu respuesta!');
    }

    const normInput = normalize(raw);
    const variants  = expandVariants(correctAnswer, articleOptional);

    let bestDist    = Infinity;
    let bestVariant = variants[0] || correctAnswer;

    for (const v of variants) {
      const lcRaw = lightClean(raw);
      const lcV   = lightClean(v);

      // ── 1. Exact match (case-insensitive, leading ¿¡ and trailing ?!. stripped) ──
      if (lcRaw === lcV) {
        return makeResult('exact', v, 0, pick(EXACT_MSGS));
      }

      // ── 2. Accent-only error (normalized forms match) ────────────────────
      const normV = normalize(v);
      if (normInput === normV) {
        if (strict) {
          return makeResult('wrong', v, 0, accentFeedback(raw, v));
        }
        return makeResult('accent_only', v, 0, accentFeedback(raw, v));
      }

      // ── 3. Space/hyphen-collapse ──────────────────────────────────────────
      // "eardrums" ↔ "ear drums", "blood-type" ↔ "blood type" etc.
      // These are the same word with different spacing/hyphenation conventions.
      // Treat as correct (accent_only → correct:true) so Leitner isn't penalized.
      const ci = normInput.replace(/[\s-]+/g, '');
      const cv = normV.replace(/[\s-]+/g, '');
      if (ci === cv) {
        return makeResult('accent_only', v, 0,
          `¡Casi! Revisa los espacios → "${v}"`);
      }

      // ── 4. Track closest edit distance for fuzzy match ───────────────────
      const dist = levenshtein(normInput, normV);
      if (dist < bestDist) {
        bestDist    = dist;
        bestVariant = v;
      }
    }

    // ── 5. Close match? ────────────────────────────────────────────────────
    const thresh = closeThreshold(normalize(bestVariant));
    if (bestDist <= thresh) {
      return makeResult('close', bestVariant, bestDist, closeFeedback(bestVariant));
    }

    // ── 6. Wrong ───────────────────────────────────────────────────────────
    return makeResult('wrong', null, bestDist, pick(WRONG_MSGS));
  }


  // ── Result factory ────────────────────────────────────────────────────────

  function makeResult(status, matchedVariant, editDistance, feedback) {
    return {
      status,
      correct:        status === 'exact' || status === 'accent_only',
      close:          status === 'close',
      matchedVariant,
      editDistance,
      feedback,
    };
  }


  // ── Public API ────────────────────────────────────────────────────────────

  return {
    /**
     * Evaluate a typed answer. See JSDoc above for full signature.
     */
    check,

    // Expose internals for testing and future exercise builders
    normalize,
    stripDiacritics,
    levenshtein,
    expandVariants,
    closeThreshold,
  };

})();


// ── CommonJS export (Node / test environments) ────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpellingHandler;
}
