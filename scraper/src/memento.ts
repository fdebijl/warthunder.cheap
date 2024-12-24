import { parseLinkHeader } from './scrapers/getArchiveSnapshots';

const main = async () => {
  const mementoText = await fetch('https://web.archive.org/web/timemap/link/https://store.gaijin.net/catalog.php?category=WarThunderPacks').then((response) => response.text());
  const memento = parseLinkHeader(mementoText);

  console.log(memento);
};

main();
