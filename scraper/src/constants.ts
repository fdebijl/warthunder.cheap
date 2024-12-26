import dotenv from 'dotenv';
import { SelectorSet } from './domain';
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

// Reference page: https://web.archive.org/web/20220630070859/https://store.gaijin.net/catalog.php?category=WarThunderPacks
export const SHOP_2022_SELECTORS = {
  ITEM: '.showcase__item',
  ITEM__HREF: '.product-widget__link',
  ITEM__POSTER: '.product-widget__poster img',
  ITEM__TITLE: '.product-widget-description__title',
  ITEM__RANK: '.product-widget-description__comment',
  ITEM__NATION: '.product-widget-description__comment .flag',
  ITEM__DESCRIPTION: '.product-widget-description__short-description ul',
  ITEM__DEFAULT_PRICE: '.showcase-item-price__default',
  ITEM__OLD_PRICE: '.showcase-item-price__old',
  ITEM__NEW_PRICE: '.showcase-item-price__new',
  PAGE_NEXT: '.pager__page:has(.pager__arrow_next)',
  PAGE__DEFAULT_PRICE: '.shop-price',
  PAGE__OLD_PRICE: '.shop-price__old',
  PAGE__NEW_PRICE: '.shop-price__new',
  PAGE__MEDIA: '.gallery__page-slider .splide__list > .splide__slide',
  PAGE__DESCRIPTION: '.shop__article',
  PAGE__SHORT_DESCRIPTION: '.shop-buy__details ul'
} satisfies SelectorSet;

// Reference page: https://web.archive.org/web/20210929014545/https://store.gaijin.net/catalog.php?category=WarThunderPacks
export const SHOP_2021_SELECTORS = {
  ITEM: '.showcase__item',
  ITEM__HREF: ' .showcase-item__link',
  ITEM__POSTER: '.showcase-item__preview img',
  ITEM__TITLE: '.showcase-item-description__title',
  ITEM__RANK: '.showcase-item-description__comment',
  ITEM__NATION: '.showcase-item-description__comment .flag',
  ITEM__DESCRIPTION: '.showcase-item-details__short-description ul',
  ITEM__DEFAULT_PRICE: '.showcase-item-price__default',
  ITEM__OLD_PRICE: '.showcase-item-price__old',
  ITEM__NEW_PRICE: '.showcase-item-price__new',
  PAGE_NEXT: '.pager__page:has(.pager__arrow_next)',
  PAGE__DEFAULT_PRICE: '.shop-price',
  PAGE__OLD_PRICE: '.shop-price__old',
  PAGE__NEW_PRICE: '.shop-price__new',
  PAGE__MEDIA: '.gallery__page-slider .splide__list > .splide__slide',
  PAGE__DESCRIPTION: '.shop__article',
  PAGE__SHORT_DESCRIPTION: '.shop-buy__details ul'
} satisfies SelectorSet;

// Reference page: https://web.archive.org/web/20160508114700/https://store.gaijin.net/catalog.php?category=WarThunderPacks
export const SHOP_2016_SELECTORS: SelectorSet = {
  ITEM: '.shop__item',
  ITEM__HREF: '.shop__item', // This is a hash href that opens a modal populated by an AJAX request. The href looks like #item_4845, the URL it opens is https://store.gaijin.net/story.php?id=4845short=1
  ITEM__POSTER: '.shop__img',
  ITEM__TITLE: '.shop__anonce',
  ITEM__RANK: '.tag_rank',
  ITEM__NATION: '.tag_country',
  ITEM__DEFAULT_PRICE: '.shop__item .shop__price',
  ITEM__OLD_PRICE: '.shop__price--old',
  ITEM__NEW_PRICE: '.shop__price--new',
  PAGE_NEXT: 'a.pagination__button--forward',
  PAGE__DEFAULT_PRICE: '.plank__price',
  PAGE__OLD_PRICE: '.plank__price--old',
  PAGE__NEW_PRICE: '.plank__price--new',
  PAGE__MEDIA: '.screens-list img',
  PAGE__DESCRIPTION: '.inner__description-block .item-col-left',
  PAGE__SHORT_DESCRIPTION: '.inner__description li'
} satisfies SelectorSet;

export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wtcheap';
export const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY as string;
export const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN as string;
export const MAILGUN_SENDER = process.env.MAILGUN_SENDER || 'noreply@warthunder.cheap';
