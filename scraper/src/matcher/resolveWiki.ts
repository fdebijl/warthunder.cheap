import type { MatchIndex } from './index.js';

/**
 * Tier B — resolve a store page's War Thunder wiki link to a datamine identifier.
 *
 * The store links to e.g. `https://wiki.warthunder.com/A-10A`, which redirects to
 * `https://wiki.warthunder.com/unit/a_10a_early` — and the `unit/<slug>` is exactly
 * the datamine identifier. We follow redirects, extract the slug, and accept it
 * only if it is a known identifier (so a stray/renamed link can't produce a bogus
 * match). Returns the original-cased identifier, or null.
 */
export async function resolveWikiIdentifier(
  wikiHref: string | null | undefined,
  index: MatchIndex,
): Promise<string | null> {
  if (!wikiHref) return null;

  let finalUrl: string;
  try {
    const response = await fetch(wikiHref, { redirect: 'follow' });
    finalUrl = response.url || wikiHref;
  } catch {
    // Network/DNS failure — treat as no match rather than throwing.
    return null;
  }

  const match = finalUrl.match(/\/unit\/([^/?#]+)/i);
  if (!match) return null;

  const slug = decodeURIComponent(match[1]).toLowerCase();
  return index.byLowerId.get(slug) ?? null;
}
