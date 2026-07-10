import { Item } from 'wtcheap.shared';

import type { MatchIndex } from './index.js';
import { tokenize } from './normalize.js';
import { scoreAgainstName } from './similarity.js';
import { resolveWikiIdentifier } from './resolveWiki.js';

export interface MatchResult {
  ids: string[];
  method: 'video' | 'wiki' | 'fuzzy';
}

// Fuzzy acceptance is deliberately conservative: a missing match is preferable to
// a wrong one. A candidate is accepted only if it is near-exact, or clears the
// bar AND beats the runner-up by a margin (so ambiguous names like "King Tiger"
// or a bare "Mustang" fall through to no-match rather than guessing).
const FUZZY_ACCEPT = 0.78;
const FUZZY_MARGIN = 0.06;
const FUZZY_NEAR_EXACT = 0.93;

/**
 * Tier A — extract datamine ids from store media video filenames.
 *
 * Gaijin names promo videos after the vehicle, wrapped as `wt_<id>_video`,
 * `<id>_kit_3rank_video`, `<id>_sm_video`, `<id>_east_video`, or plain
 * `<id>.webm`. We strip the `wt_`/`_video` wrappers and take the longest datamine
 * id that the filename stem equals or begins with (snake-case bounded). Marketing
 * slugs like `wt_king_tiger_video` match no id and are correctly ignored.
 * A bundle lists one video per vehicle, so this naturally returns 0..N ids.
 */
export function extractVideoIds(item: Item, index: MatchIndex): string[] {
  const media = item.details?.media ?? [];
  const found = new Set<string>();
  for (const entry of media) {
    for (const url of String(entry).split(';')) {
      const file = url.split('/').pop() ?? '';
      let stem = file.split('?')[0].replace(/\.[a-z0-9]+$/i, '').toLowerCase();
      if (!stem) continue;
      stem = stem.replace(/^wt_/, '').replace(/_video$/, '');
      for (const id of index.idsLongestFirst) {
        if (id.length < 4) continue;
        if (stem === id || stem.startsWith(id + '_')) {
          found.add(index.byLowerId.get(id)!);
          break; // longest-first => most specific id wins
        }
      }
    }
  }
  return [...found];
}

/**
 * Tier C — nation-constrained fuzzy match of the store title against candidate
 * vehicle names. Returns the single best id, or null when nothing clears the bar.
 */
export function fuzzyMatch(item: Item, index: MatchIndex): string | null {
  const titleTokens = tokenize(item.title);
  if (titleTokens.length === 0) return null;
  const titleJoined = titleTokens.join('');

  let candidates = index.refs;
  if (item.nation) {
    const inNation = index.refs.filter((r) => r.country === item.nation);
    if (inNation.length > 0) candidates = inNation;
  }

  let bestId: string | null = null;
  let bestScore = 0;
  let secondScore = 0;
  for (const ref of candidates) {
    let refBest = 0;
    for (const name of ref.names) {
      const s = scoreAgainstName(titleTokens, titleJoined, name);
      if (s > refBest) refBest = s;
    }
    if (refBest > bestScore) {
      secondScore = bestScore;
      bestScore = refBest;
      bestId = ref.identifier;
    } else if (refBest > secondScore) {
      secondScore = refBest;
    }
  }

  if (bestId === null) return null;
  const margin = bestScore - secondScore;
  if (bestScore >= FUZZY_NEAR_EXACT || (bestScore >= FUZZY_ACCEPT && margin >= FUZZY_MARGIN)) {
    return bestId;
  }
  return null;
}

// Categories that never correspond to a datamine vehicle — skip matching entirely.
const NON_VEHICLE_CATEGORIES = new Set<Item['category']>(['GoldenEagles', 'PremiumAccount']);

/** Synchronous tiers only (A then C). Tier B is async — see {@link matchItemFull}. */
export function matchItem(item: Item, index: MatchIndex): MatchResult | null {
  const videoIds = extractVideoIds(item, index);
  if (videoIds.length > 0) return { ids: videoIds, method: 'video' };

  const fuzzyId = fuzzyMatch(item, index);
  if (fuzzyId) return { ids: [fuzzyId], method: 'fuzzy' };

  return null;
}

/**
 * Full tiered match for a store item: Tier A (video filenames) → Tier C (fuzzy
 * title) → Tier B (wiki-link redirect). Wiki is tried last because it costs a
 * network round-trip; the first two resolve most items for free. Returns null
 * (no confident match) rather than guessing.
 */
export async function matchItemFull(item: Item, index: MatchIndex): Promise<MatchResult | null> {
  if (NON_VEHICLE_CATEGORIES.has(item.category)) return null;

  const sync = matchItem(item, index);
  if (sync) return sync;

  const wikiId = await resolveWikiIdentifier(item.wikiHref, index);
  if (wikiId) return { ids: [wikiId], method: 'wiki' };

  return null;
}
