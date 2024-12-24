export interface SelectorSet {
  ITEM: string;
  ITEM__HREF: string;
  ITEM__POSTER: string;
  ITEM__TITLE: string;
  ITEM__RANK: string;
  ITEM__NATION: string;
  /** Some versions of the shop only show the pack contents (the 'description') on the details page, use PAGE__SHORT_DESCRIPTION in those cases. */
  ITEM__DESCRIPTION?: string;
  ITEM__DEFAULT_PRICE: string;
  ITEM__OLD_PRICE: string;
  ITEM__NEW_PRICE: string;
  PAGE_NEXT: string;
  PAGE__DEFAULT_PRICE: string;
  PAGE__OLD_PRICE: string;
  PAGE__NEW_PRICE: string;
  PAGE__MEDIA: string;
  PAGE__DESCRIPTION: string;
  PAGE__SHORT_DESCRIPTION?: string;
}
