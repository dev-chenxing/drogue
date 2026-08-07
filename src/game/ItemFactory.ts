import { ITEM_DATA } from "./constants/ItemData";

export function getItem(itemId: string): (typeof ITEM_DATA)[number] {
  const item = ITEM_DATA.find((candidate) => candidate.name === itemId);
  if (!item) {
    throw new Error(`Item with id ${itemId} not found`);
  }
  return item;
}
