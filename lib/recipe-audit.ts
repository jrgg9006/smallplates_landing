/**
 * Recipe Audit - Deterministic comparison between the guest's ORIGINAL recipe
 * and the CLEANED (print-ready) version produced by the AI cleaner agent.
 *
 * Why deterministic (no AI): the cleaner's contract is FORMAT-ONLY (it must not
 * add, remove, reword, or summarize content). So any real anomaly shows up as a
 * change in the *sequence of words*. A word-sequence comparison catches 100% of
 * added/removed/changed words with zero false negatives and zero tokens — and,
 * unlike a second AI, it can never rationalize a bad change as "fine".
 *
 * This mirrors the `_word_sequence` integrity idea already used in the Python
 * cleaner for guest notes.
 *
 * Authorized (cosmetic, NOT flagged):
 *   - whitespace / line breaks (the cleaner joins sentences)
 *   - bullets / leading numbers
 *   - first-letter capitalization
 *   - fraction glyphs (1/2 <-> ½)
 *   - removal of generic headers ("Ingredientes:", "Pasos:", etc.)
 *
 * Flagged (content, 🔴): any other added / removed / changed / reordered word,
 * including changed quantities.
 */

export type SectionKey = 'name' | 'ingredients' | 'instructions' | 'note';
export type SectionSeverity = 'identical' | 'cosmetic' | 'content';
export type AuditSeverity = SectionSeverity | 'manual' | 'no-clean';

export interface AuditChange {
  kind: 'added' | 'removed' | 'changed';
  before?: string;
  after?: string;
}

export interface RenderToken {
  text: string;
  mark: 'equal' | 'insert' | 'delete' | 'cosmetic';
}

export interface SectionAudit {
  section: SectionKey;
  severity: SectionSeverity;
  changes: AuditChange[];
  cleanTokens: RenderToken[];
  originalTokens: RenderToken[];
}

export interface RecipeAudit {
  severity: AuditSeverity;
  sections: SectionAudit[];
  /** number of content-level (🔴) changes across all sections */
  contentCount: number;
  reason?: string;
}

export interface AuditInput {
  hasPrintReady: boolean;
  /** true when the original is a photo or pasted block — no structured text to diff */
  isManualOriginal: boolean;
  original: { name: string; ingredients: string; instructions: string; note: string | null };
  clean: { name: string; ingredients: string; instructions: string; note: string | null };
}

// Generic headers the cleaner is authorized to drop. A removed header that
// matches one of these is treated as cosmetic, not content.
const AUTHORIZED_HEADERS = new Set([
  'ingredientes', 'necesitan', 'ingredients', 'we need',
  'preparación', 'preparacion', 'pasos', 'procedimiento', 'instrucciones',
  'instructions', 'preparation', 'steps', 'método', 'metodo',
  'elaboración', 'elaboracion', 'directions',
]);

const FRACTIONS: Record<string, string> = {
  '½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4',
  '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5', '⅙': '1/6',
  '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
  '⅐': '1/7', '⅑': '1/9', '⅒': '1/10',
};

// A word is a run of letters/numbers, allowing internal slashes so "3/4" stays one token.
const WORD_RE = /[\p{L}\p{N}]+(?:\/[\p{L}\p{N}]+)*/gu;

interface Seg {
  text: string;
  isWord: boolean;
  norm: string;
}

function normWord(w: string): string {
  let out = '';
  for (const ch of w) out += FRACTIONS[ch] ?? ch;
  // Reason: lowercase only — accents are part of the word and the cleaner must
  // not change letters, so accent differences are meaningful, not cosmetic.
  return out.toLowerCase();
}

function segment(str: string): Seg[] {
  const segs: Seg[] = [];
  let last = 0;
  for (const m of str.matchAll(WORD_RE)) {
    const i = m.index ?? 0;
    if (i > last) segs.push({ text: str.slice(last, i), isWord: false, norm: '' });
    segs.push({ text: m[0], isWord: true, norm: normWord(m[0]) });
    last = i + m[0].length;
  }
  if (last < str.length) segs.push({ text: str.slice(last), isWord: false, norm: '' });
  return segs;
}

function collapseWs(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

interface WordRef {
  surface: string;
  norm: string;
  segIndex: number;
}

// Longest common subsequence over normalized word forms → list of matched index pairs.
function lcsPairs(a: WordRef[], b: WordRef[]): Array<[number, number]> {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i].norm === b[j].norm
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const pairs: Array<[number, number]> = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i].norm === b[j].norm) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return pairs;
}

function isAuthorizedHeaderRun(words: string[]): boolean {
  const phrase = words.join(' ').toLowerCase();
  return AUTHORIZED_HEADERS.has(phrase);
}

interface Op {
  type: 'equal' | 'delete' | 'insert';
  oIndex?: number;
  cIndex?: number;
}

function analyzeSection(
  section: SectionKey,
  original: string,
  clean: string,
): SectionAudit {
  const oSegs = segment(original);
  const cSegs = segment(clean);

  const oWords: WordRef[] = [];
  oSegs.forEach((s, idx) => {
    if (s.isWord) oWords.push({ surface: s.text, norm: s.norm, segIndex: idx });
  });
  const cWords: WordRef[] = [];
  cSegs.forEach((s, idx) => {
    if (s.isWord) cWords.push({ surface: s.text, norm: s.norm, segIndex: idx });
  });

  const pairs = lcsPairs(oWords, cWords);

  // Build a flat op list and per-word marks.
  const ops: Op[] = [];
  let oi = 0;
  let ci = 0;
  for (const [pi, pj] of pairs) {
    while (oi < pi) ops.push({ type: 'delete', oIndex: oi++ });
    while (ci < pj) ops.push({ type: 'insert', cIndex: ci++ });
    ops.push({ type: 'equal', oIndex: oi, cIndex: ci });
    oi++;
    ci++;
  }
  while (oi < oWords.length) ops.push({ type: 'delete', oIndex: oi++ });
  while (ci < cWords.length) ops.push({ type: 'insert', cIndex: ci++ });

  // Mark each clean / original word index: insert | delete | cosmetic | equal.
  const cleanMark = new Array<RenderToken['mark']>(cWords.length).fill('equal');
  const origMark = new Array<RenderToken['mark']>(oWords.length).fill('equal');
  for (const op of ops) {
    if (op.type === 'insert' && op.cIndex !== undefined) {
      cleanMark[op.cIndex] = 'insert';
    } else if (op.type === 'delete' && op.oIndex !== undefined) {
      origMark[op.oIndex] = 'delete';
    } else if (op.type === 'equal' && op.oIndex !== undefined && op.cIndex !== undefined) {
      // Same word by meaning, but different surface (case / fraction glyph) = cosmetic.
      if (oWords[op.oIndex].surface !== cWords[op.cIndex].surface) {
        origMark[op.oIndex] = 'cosmetic';
        cleanMark[op.cIndex] = 'cosmetic';
      }
    }
  }

  // Group consecutive insert/delete ops into runs, classify, build change list.
  const changes: AuditChange[] = [];
  let hasContent = false;
  let cosmeticHeaderRemoval = false;
  let k = 0;
  while (k < ops.length) {
    if (ops[k].type === 'delete' || ops[k].type === 'insert') {
      const removed: string[] = [];
      const added: string[] = [];
      while (k < ops.length && (ops[k].type === 'delete' || ops[k].type === 'insert')) {
        const op = ops[k];
        if (op.type === 'delete' && op.oIndex !== undefined) removed.push(oWords[op.oIndex].surface);
        if (op.type === 'insert' && op.cIndex !== undefined) added.push(cWords[op.cIndex].surface);
        k++;
      }

      // A pure header removal is authorized → cosmetic, not content.
      if (added.length === 0 && removed.length > 0 && isAuthorizedHeaderRun(removed)) {
        cosmeticHeaderRemoval = true;
        // Re-mark those original words as cosmetic instead of delete.
        ops.forEach((op) => {
          if (op.type === 'delete' && op.oIndex !== undefined
            && removed.includes(oWords[op.oIndex].surface)) {
            origMark[op.oIndex] = 'cosmetic';
          }
        });
        continue;
      }

      hasContent = true;
      if (removed.length && added.length) {
        changes.push({ kind: 'changed', before: removed.join(' '), after: added.join(' ') });
      } else if (removed.length) {
        changes.push({ kind: 'removed', before: removed.join(' ') });
      } else if (added.length) {
        changes.push({ kind: 'added', after: added.join(' ') });
      }
    } else {
      k++;
    }
  }

  let severity: SectionSeverity = 'identical';
  if (hasContent) {
    severity = 'content';
  } else {
    const surfaceDiff = cleanMark.includes('cosmetic') || origMark.includes('cosmetic');
    const wsDiff = collapseWs(original) !== collapseWs(clean);
    if (surfaceDiff || cosmeticHeaderRemoval || wsDiff) severity = 'cosmetic';
  }

  return {
    section,
    severity,
    changes,
    cleanTokens: buildTokens(cSegs, cWords, cleanMark),
    originalTokens: buildTokens(oSegs, oWords, origMark),
  };
}

function buildTokens(segs: Seg[], words: WordRef[], marks: RenderToken['mark'][]): RenderToken[] {
  // Map seg index -> word position so we can attach the computed mark.
  const segToMark = new Map<number, RenderToken['mark']>();
  words.forEach((w, i) => segToMark.set(w.segIndex, marks[i]));
  return segs.map((s, idx) => ({
    text: s.text,
    mark: s.isWord ? (segToMark.get(idx) ?? 'equal') : 'equal',
  }));
}

const worst = (a: SectionSeverity, b: SectionSeverity): SectionSeverity => {
  const rank: Record<SectionSeverity, number> = { identical: 0, cosmetic: 1, content: 2 };
  return rank[a] >= rank[b] ? a : b;
};

export function auditRecipe(input: AuditInput): RecipeAudit {
  if (!input.hasPrintReady) {
    return { severity: 'no-clean', sections: [], contentCount: 0, reason: 'Sin versión limpia todavía' };
  }
  if (input.isManualOriginal) {
    return {
      severity: 'manual',
      sections: [],
      contentCount: 0,
      reason: 'Original es imagen o texto pegado — verifica a mano',
    };
  }

  const sections: SectionAudit[] = [
    analyzeSection('name', input.original.name, input.clean.name),
    analyzeSection('ingredients', input.original.ingredients, input.clean.ingredients),
    analyzeSection('instructions', input.original.instructions, input.clean.instructions),
  ];
  if (input.original.note !== null || input.clean.note !== null) {
    sections.push(analyzeSection('note', input.original.note ?? '', input.clean.note ?? ''));
  }

  let overall: SectionSeverity = 'identical';
  let contentCount = 0;
  for (const s of sections) {
    overall = worst(overall, s.severity);
    contentCount += s.changes.length;
  }

  return { severity: overall, sections, contentCount };
}
