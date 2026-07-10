// Token-set + character similarity used by the fuzzy matcher (Tier C).
//
// Token-set metrics (Dice, containment) handle the reordering, added
// designations ("K9 …"), and dropped suffixes ("II") that plague store names,
// where raw edit distance would fail. Jaro-Winkler on the joined string is a
// character-level tiebreaker.

import { tokenize } from './normalize.js';

function diceCoefficient(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return (2 * inter) / (a.size + b.size);
}

/** Fraction of the smaller token set that is covered by the other. */
function containment(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / Math.min(a.size, b.size);
}

export function jaroWinkler(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);
  let matches = 0;
  for (let i = 0; i < s1.length; i++) {
    const lo = Math.max(0, i - matchDistance);
    const hi = Math.min(i + matchDistance + 1, s2.length);
    for (let j = lo; j < hi; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) { s1Matches[i] = s2Matches[j] = true; matches++; break; }
    }
  }
  if (matches === 0) return 0;
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }
  }
  transpositions /= 2;
  const jaro = (matches / s1.length + matches / s2.length + (matches - transpositions) / matches) / 3;
  let prefix = 0;
  while (prefix < 4 && s1[prefix] === s2[prefix]) prefix++;
  return jaro + prefix * 0.1 * (1 - jaro);
}

/**
 * Score a store title (pre-tokenized) against a single candidate vehicle name.
 * Blend weighted toward token overlap, with containment rewarding "title is a
 * subset of the candidate" and Jaro-Winkler as a character-level tiebreaker.
 */
export function scoreAgainstName(titleTokens: string[], titleJoined: string, candidateName: string): number {
  const candTokens = tokenize(candidateName);
  const titleSet = new Set(titleTokens);
  const candSet = new Set(candTokens);
  const d = diceCoefficient(titleSet, candSet);
  const c = containment(titleSet, candSet);
  const jw = jaroWinkler(titleJoined, candTokens.join(''));
  return 0.5 * d + 0.3 * c + 0.2 * jw;
}
