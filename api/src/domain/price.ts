export interface Price {
  itemId: number;
  date: Date;
  defaultPrice?: number | null;
  oldPrice?: number | null;
  newPrice?: number | null;
  isDiscounted?: boolean;
  discountPercent?: number | null;
}
