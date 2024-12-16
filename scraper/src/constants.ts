import dotenv from 'dotenv';
dotenv.config();

export const TARGET_ROOTS = [
  'https://store.gaijin.net/catalog.php?category=GoldenEagles',
  'https://store.gaijin.net/catalog.php?category=WarThunderPacks',
  'https://store.gaijin.net/catalog.php?category=PremiumAccount'
];

// Some items always have a discount banner, which are not interesting and should be excluded from being marked as discounted
export const PERMA_SALE_ITEM_IDS = [
  3170,
  3748,
  3215
];

export const SELECTORS = {
  ITEM: '.showcase__item',
  ITEM__HREF: '.product-widget__link',
  ITEM__POSTER: '.product-widget__poster img',
  ITEM__TITLE: '.product-widget-description__title',
  ITEM__RANK: '.product-widget-description__comment',
  ITEM__NATION: '.product-widget-description__comment .flag',
  ITEM__DESCRIPTION: '.product-widget-description__short-description ul', // Note: this is a list, merge <li> children to get the full description
  ITEM__DEFAULT_PRICE: '.showcase-item-price__default',
  ITEM__OLD_PRICE: '.showcase-item-price__old',
  ITEM__NEW_PRICE: '.showcase-item-price__new',
  PAGE_NEXT: '.pager__page:has(.pager__arrow_next)',
  PAGE__DEFAULT_PRICE: '.shop-price',
  PAGE__OLD_PRICE: '.shop-price__old',
  PAGE__NEW_PRICE: '.shop-price__new',
  PAGE__MEDIA: '.gallery__page-slider .splide__list > .splide__slide',
  PAGE__DESCRIPTION: '.shop__article'
}

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wtcheap';
export const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY as string;
export const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN as string;
export const MAILGUN_SENDER = process.env.MAILGUN_SENDER || 'noreply@warthunder.cheap';
