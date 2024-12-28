export const isItemBuyable = async (link: string): Promise<boolean> => {
  const response = await fetch(link, { redirect: 'manual' });

  const isRedirecting = response.status === 302;
  const redirectsToId = response.headers.get('location')?.includes('id=');
  const is404 = response.headers.get('location') === '/404.php'

  // If the item redirects to a 404 page, the item is obviously no longer buyable
  if (isRedirecting && is404) {
    return false;
  }

  // If the item redirects to another item, the item itself is no longer buyable. Usually the case for pre-order packs.
  if (isRedirecting && redirectsToId) {
    return false;
  }

  return !(response.status === 302 && response.headers.get('location') === '/404.php');
}
