import type { GameState } from "./GameState";
import type { ItemType, MenuState } from "./types";

export class MenuManager {
  private gameState: GameState;
  private menus: MenuState[] = [];
  private menuSelect = 1;
  private selectedItemIndex = 0;

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  public getMenus(): MenuState[] {
    return [...this.menus];
  }

  public getMenuSelect(): number {
    return this.menuSelect;
  }

  public clear(): void {
    this.menus = [];
    this.menuSelect = 1;
    this.selectedItemIndex = 0;
  }

  public openMenu() {
    if (this.gameState.mode !== "game") return;
    this.gameState.mode = "inventory";
    this.menuSelect = 1;
    this.menus = [
      {
        positionX: 8,
        positionY: 7,
        width: 15,
        height: 5,
        title: "",
        options: ["inventory", "map"],
        action: 1,
      },
    ];
  }

  public closeMenu() {
    this.menus = [];
    this.gameState.mode = "game";
    this.gameState.showMap = false;
  }

  public menuUp() {
    if (this.menuSelect > 1) this.menuSelect--;
    else {
      const currentMenu = this.menus[this.menus.length - 1];
      if (currentMenu) this.menuSelect = currentMenu.options.length;
    }
  }

  public menuDown() {
    const currentMenu = this.menus[this.menus.length - 1];
    if (currentMenu) {
      if (this.menuSelect < currentMenu.options.length) this.menuSelect++;
      else this.menuSelect = 1;
    }
  }

  public menuSelectOption() {
    const currentMenu = this.menus[this.menus.length - 1];
    if (!currentMenu) return;

    if (currentMenu.action === 1) {
      // Main menu
      if (this.menuSelect === 1) {
        // Inventory
        const inventoryItems = this.gameState.player.items;
        const itemNames = inventoryItems.map((itemStack) => itemStack.object.name);
        if (itemNames.length === 0) return; // No items to display
        this.menus.push({
          positionX: 3,
          positionY: 1,
          width: 25,
          height: 17,
          title: "",
          options: itemNames,
          action: 2,
        });
        this.menuSelect = 1;
      } else if (this.menuSelect === 2) {
        // Map
        this.gameState.showMap = true;
        this.gameState.mapCamera = { ...this.gameState.player.position };
        this.gameState.mode = "map";
      }
    } else if (currentMenu.action === 2) {
      // Inventory item selected
      const inventoryItems = this.gameState.player.items;
      if (inventoryItems.length > 0) {
        this.selectedItemIndex = this.menuSelect - 1;
        this.menuSelect = 1;

        const selectedItem = inventoryItems[this.selectedItemIndex];
        const useWords: Partial<Record<ItemType, string>> = {
          weapon: "wield",
          armor: "wear",
          potion: "drink",
        };
        const useWord = useWords[selectedItem.object.type] ?? "use";

        this.menus.push({
          positionX: 8,
          positionY: 7,
          width: 16,
          height: 5,
          title: "",
          options: [useWord, "drop", "cancel"],
          action: 3,
        });
      }
    } else if (currentMenu.action === 3) {
      // Inventory item action selected
      const inventoryItems = this.gameState.player.items;
      const selectedItem = inventoryItems[this.selectedItemIndex];
      if (!selectedItem) return;

      if (this.menuSelect === 1) {
        // Use/Equip/Drink the item
        this.gameState.useItem(selectedItem);
      } else if (this.menuSelect === 2) {
        // Drop the item
        this.gameState.dropItem(selectedItem);
      }

      // Close the action menu after using or dropping the item
      while (this.menus.length > 1) {
        this.menus.pop();
      }
      this.gameState.mode = "game";
    }
  }

  public menuBack() {
    if (this.menus.length > 1) {
      this.menus.pop();
      this.menuSelect = 1;
    } else {
      this.closeMenu();
    }
  }

  public removeItemSelected() {
    const inventoryItems = this.gameState.player.items;
    inventoryItems.splice(this.selectedItemIndex, 1);
    this.selectedItemIndex = Math.max(0, this.selectedItemIndex - 1);
  }
}
