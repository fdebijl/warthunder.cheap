import { VehicleRef } from 'wtcheap.shared';

export * from './matchItem.js';
export * from './resolveWiki.js';

/**
 * Pre-computed lookup structures over the datamine vehicle reference set, built
 * once per scrape run and passed to the matcher.
 */
export interface MatchIndex {
  refs: VehicleRef[];
  /** Lowercased identifier -> original-cased identifier. */
  byLowerId: Map<string, string>;
  /** Lowercased identifiers, longest first (so prefix matches prefer the most specific). */
  idsLongestFirst: string[];
}

export function buildMatchIndex(refs: VehicleRef[]): MatchIndex {
  const byLowerId = new Map<string, string>();
  for (const r of refs) byLowerId.set(r.identifier.toLowerCase(), r.identifier);
  const idsLongestFirst = [...byLowerId.keys()].sort((a, b) => b.length - a.length);
  return { refs, byLowerId, idsLongestFirst };
}
