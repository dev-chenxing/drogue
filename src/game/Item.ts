import { ITEM_DATA } from "./constants/items";
import type { ItemTemplate } from "./types";

export function getItem(itemId: string): ItemTemplate {
  const item = ITEM_DATA.find((candidate) => candidate.name === itemId);
  if (!item) {
    throw new Error(`Item with id ${itemId} not found`);
  }
  return item;
}
