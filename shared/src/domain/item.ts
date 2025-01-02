export interface Item {
  /** Unique ID pulled from the War Thunder store */
  id: number;
  /** Category of the item */
  category: 'GoldenEagles' | 'WarThunderPacks' | 'PremiumAccount' | 'Other';
  /** URL to the item's page on the War Thunder store */
  href: string;
  /** The final href for this item, after the ID-based redirects are followed */
  resolvedHref?: string;
  /** Whether the item is from the live store or an archive (e.g. Archive.org or archive.today) */
  source?: 'live' | 'archive';
  /** Whether the item is currently purchaseable */
  buyable: boolean;
  /** URL to the item's poster image */
  poster?: string | null;
  /** Name of the pack/item */
  title?: string | null;
  /** Rank of the item, if applicable */
  rank?: string | null;
  /** Nation of the item, if applicable */
  nation?: string | null;
  /** Description of the item */
  description?: string;
  /** Current price for a non-discounted item. 0 if a discount is running on this item. */
  defaultPrice?: number;
  /** Current price for a discounted item without the discount applied. 0 if no discount is running on this item. */
  oldPrice?: number;
  /** Current price for a discounted item with the discount applied. 0 if no discount is running on this item. */
  newPrice?: number;
  /** Whether the item is currently discounted */
  isDiscounted?: boolean;
  /** Percentage discount on the item */
  discountPercent?: number | null;
  /** Detailed information from the individual store page for this item */
  details?: {
    /** URLs for the videos, screenshots and images on the item's store page */
    media?: string[],
    /** Extended description from the item's store page */
    description?: string,
  };
  /** Date the item was entered into the DB */
  createdAt?: Date;
  /** Date the item was last updated in the DB */
  updatedAt?: Date;
  /** Date the item was first seen and available */
  firstAvailableAt?: Date;
  /** Date the item was last available */
  lastAvailableAt?: Date;
}
