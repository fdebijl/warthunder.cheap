import { Item } from 'wtcheap.shared';

export const discountAlertNeeded = (currentItem: Item, previousItem: Item): boolean => {
  return !!currentItem.isDiscounted && !previousItem.isDiscounted;
}

export const availableAlertNeeded = (currentItem: Item, previousItem: Item): boolean => {
  return !!currentItem.buyable && !previousItem.buyable;
}
