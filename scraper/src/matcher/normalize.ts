// String normalization for fuzzy vehicle-name matching.
//
// War Thunder localized names carry Cyrillic homoglyphs (e.g. a Cyrillic 'С' in
// "F/A-18С"), zero-width spaces, block-drawing prefix glyphs (▄), and diacritics.
// Store titles add sale boilerplate ("Pack", "Pre-order - "). We fold all of that
// away so token-set comparison sees the underlying designation.

const HOMOGLYPH: Record<string, string> = {
  'а': 'a', 'в': 'b', 'е': 'e', 'к': 'k', 'м': 'm', 'н': 'h', 'о': 'o',
  'р': 'p', 'с': 'c', 'т': 't', 'х': 'x', 'у': 'y', 'і': 'i',
};

// Words that carry no vehicle-identity signal and only add noise.
const BOILERPLATE = new Set(['pack', 'bundle', 'set', 'preorder', 'pre', 'order', 'edition', 'gift', 'the']);

// Zero-width space, non-breaking space, and block/arrow glyphs used as name prefixes.
const STRIP_CHARS = /[\u200B\u00A0\u2584\u25BA\u25C4]/g;

export function normalize(input: string | null | undefined): string {
  if (!input) return '';
  let s = input.toLowerCase().replace(STRIP_CHARS, '');
  s = [...s].map((ch) => HOMOGLYPH[ch] ?? ch).join('');
  s = s.normalize('NFD').replace(/[\u0300-\u036F]/g, '');   // strip combining diacritics
  s = s.replace(/\bpre[\s-]*order\b/g, ' ');                // drop "pre-order" phrase
  s = s.replace(/[^a-z0-9]+/g, ' ').trim();                 // punctuation -> single spaces
  return s;
}

export function tokenize(input: string | null | undefined): string[] {
  return normalize(input).split(' ').filter((t) => t.length > 0 && !BOILERPLATE.has(t));
}
