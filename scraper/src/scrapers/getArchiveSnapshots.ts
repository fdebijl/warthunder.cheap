import { Memento } from 'wtcheap.shared';

/**
 * Parse a application/link-format response into a JS object
 * @param {string} header Input application/link-format header
 * @return {Memento} Link header formatted into a Memento object with rel as keys.
 */
export const parseLinkHeader = (header: string): Memento => {
  if (header.length === 0) {
    throw new Error('input must not be of zero length');
  }

  header = header.trim();

  // Split parts by comma and parse each part into a named link
  return header.split(/(?!\B"[^"]*),(?![^"]*"\B)/).reduce((links: Partial<Memento>, part) => {
    // A part can be any one of the following:
    // Original: <http://store.gaijin.net:80/catalog.php?category=WarThunderPacks>; rel="original",
    // Self: <https://web.archive.org/web/timemap/link/https://store.gaijin.net/catalog.php?category=WarThunderPacks>; rel="self"; type="application/link-format"; from="Wed, 23 Dec 2015 03:04:54 GMT",
    // Timegate <https://web.archive.org/web/https://store.gaijin.net/catalog.php?category=WarThunderPacks>; rel="timegate",
    // First memento: <https://web.archive.org/web/20151223030454/http://store.gaijin.net:80/catalog.php?category=WarThunderPacks>; rel="first memento"; datetime="Wed, 23 Dec 2015 03:04:54 GMT",
    // Memento (has many): <https://web.archive.org/web/20160222112255/http://store.gaijin.net:80/catalog.php?category=WarThunderPacks>; rel="memento"; datetime="Mon, 22 Feb 2016 11:22:55 GMT",
    const section = part.split(/(?!\B"[^"]*);(?![^"]*"\B)/);

    // Ignore parts that don't have a URL and a rel
    if (section.length < 2) {
      return links;
    }

    const url = section[0].replace(/<(.*)>/, '$1').trim();
    const name = section[1].replace(/rel="(.*)"/, '$1').replace('rel=', '').trim() as keyof Memento;

    if (name === 'memento') {
      const datetime = new Date(section[2].replace(/datetime="(.*)"/, '$1').trim());

      links[name] = links[name] || [];
      links[name].push({ url, datetime });
    } else {
      links[name] = url;
    }

    return links;
  }, {}) as Memento;
};

export const getArchiveSnapshots = async (url: string): Promise<Memento> => {
  const mementoString = await fetch(`https://web.archive.org/web/timemap/link/${url}`).then((response) => response.text());

  return parseLinkHeader(mementoString);
};
