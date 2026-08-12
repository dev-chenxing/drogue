import { COLORS } from "./constants/common";
import { ITEM_DATA } from "./constants/items";
import type { GameState } from "./GameState";
import type { ItemStack, ItemTemplate } from "./types";

export function getItem(itemId: string): ItemTemplate {
  const item = ITEM_DATA.find((candidate) => candidate.name === itemId);
  if (!item) {
    throw new Error(`Item with id ${itemId} not found`);
  }
  return item;
}

export class ItemManager {
  private gameState: GameState;
  private items: ItemStack[] = [];

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  public getItems(): ItemStack[] {
    return [...this.items];
  }

  public addItem(stack: ItemStack): void {
    this.items.push(stack);
  }

  public addItems(stacks: ItemStack[]): void {
    this.items.push(...stacks);
  }

  public removeItemAt(stackIndex: number): void {
    if (stackIndex < 0 || stackIndex >= this.items.length) {
      throw new Error(`Invalid stack index: ${stackIndex}`);
    }
    this.items.splice(stackIndex, 1);
  }

  // Auto pickup items at the player's position
  public autoPickupItems() {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const itemStack = this.items[i];
      if (
        itemStack.itemData.position.x === this.gameState.player.position.x &&
        itemStack.itemData.position.y === this.gameState.player.position.y
      ) {
        if (itemStack.object.id === "gold") {
          // Gold is automatically added to the player's gold count
          this.gameState.player.gold += itemStack.itemData.count;
          this.gameState.showMessage(`gained ${itemStack.itemData.count} gold`, COLORS.YELLOW);
          this.items.splice(i, 1);
        } else {
          // Inventory item pickup
          const playerItems = this.gameState.player.items;
          if (playerItems.length < 14) {
            const vowel = this.isVowel(itemStack.object.name[0]);
            this.gameState.showMessage(
              `got ${vowel ? "an" : "a"} ${itemStack.object.name}`,
              COLORS.GREEN,
            );
            this.items.splice(i, 1);
            // Add the item to the player's inventory
            this.gameState.player.items.push(itemStack);
          }
        }
      }
    }
  }

  private isVowel(char: string): boolean {
    return ["a", "e", "i", "o", "u"].includes(char.toLowerCase());
  }

  public clear() {
    this.items = [];
  }
}
