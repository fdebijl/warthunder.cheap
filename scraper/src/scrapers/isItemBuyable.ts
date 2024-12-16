// TODO: Handle pre-order redirecting to normal pack, redirecting to 404
export const isItemBuyable = async (link: string): Promise<boolean> => {
  const response = await fetch(link, { redirect: 'manual' });

  return !(response.status === 302 && response.headers.get('location') === '/404.php');
}
