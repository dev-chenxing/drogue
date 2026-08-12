import { AISystem } from "./AISystem";
import { meleeAttack, magicAttack } from "./combat";
import { COLORS, DUNGEON, LOCAL_STORAGE_KEY } from "./constants/common";
import { DungeonGenerator } from "./Dungeon";
import { createMobile, getEntity } from "./Entity";
import { getItem } from "./Item";
import type {
  Armor,
  GameMode,
  ItemType,
  ItemStack,
  MenuState,
  Message,
  Mobile,
  Statistic,
  Tile,
  Vector2,
  Weapon,
} from "./types";
import { distance, hasLineOfSight, updateVisibility } from "./Vision";

export class GameState {
  public mode: GameMode = "game";
  public player!: Mobile;
  public entities: Mobile[] = [];
  public items: ItemStack[] = [];
  public tiles: Tile[][] = [];
  public depth: number = 1;

  public messages: Message[] = [];
  public menus: MenuState[] = [];
  public menuSelect = 1;
  public selectedItemIndex = 0;

  public showMap = false;
  public mapCamera: Vector2 = { x: 0, y: 0 };

  public showCursor = false;
  public cursorPosition: Vector2 = { x: 7, y: 7 };

  public gameOver = false;
  public victory = false;
  public score = 0;

  private aiSystem = new AISystem();
  private turnCount = 0;
  private blinkTimer = 0;

  constructor() {
    this.newGame();
  }

  public newGame() {
    this.depth = 1;
    this.messages = [];
    this.menus = [];
    this.gameOver = false;
    this.victory = false;
    this.mode = "game";
    this.createPlayer();
    this.generateLevel();
    this.showMessage("Welcome to the dungeon.", COLORS.LAVENDER);
    this.showMessage("You seek the infamous Orb of");
    this.showMessage("Elad. Find it in the dungeon's");
    this.showMessage("deepest floor or die trying!");
  }

  private createPlayer() {
    const player = getEntity("player");
    this.player = createMobile(
      player,
      { x: DUNGEON.MAP_SIZE / 2, y: DUNGEON.MAP_SIZE / 2 },
      0,
      this.depth,
    );
    this.player.items = [];
  }

  private generateLevel() {
    const generator = new DungeonGenerator(this.depth);
    const { level, entities, items, playerStart } = generator.generate();
    this.tiles = level.tiles;
    this.entities = entities;
    this.items = items;
    this.player.position = playerStart;
    updateVisibility(this.player.position, this.tiles);
  }

  public update(deltaTime: number) {
    this.blinkTimer += deltaTime;
  }

  public getBlinkState(): boolean {
    return Math.floor(this.blinkTimer * 2) % 2 === 0;
  }

  // Input handling methods
  public handleMove(direction: Vector2) {
    if (this.mode !== "game" || this.gameOver) return;

    const newPos = {
      x: this.player.position.x + direction.x,
      y: this.player.position.y + direction.y,
    };

    // Collide with enemies = attack
    const enemy = this.getEntityAtPosition(newPos);
    if (enemy) {
      this.playerAttack(enemy);
      this.endPlayerTurn();
      return;
    }

    // Check if the new position is walkable, if so, move the player
    if (this.isWalkable(newPos)) {
      this.player.position = newPos;
      updateVisibility(this.player.position, this.tiles);
      this.autoPickupItems();
      // Check for stairs
      if (this.tiles[newPos.x][newPos.y].id === "stairs") {
        this.descendStairs();
      }
      // Check win condition
      if (this.tiles[newPos.x][newPos.y].id === "orb") {
        this.winGame();
      }
      this.endPlayerTurn();
    } else {
      // Bump into a wall or door
      const tile = this.tiles[newPos.x]?.[newPos.y];
      if (tile && tile.id === "door") {
        this.openDoor(tile);
        this.endPlayerTurn();
      }
    }
  }

  private openDoor(tile: Tile) {
    tile.id = "floor";
    tile.character = ".";
    tile.color = "gray";
    tile.walkable = true;
  }

  private playerAttack(enemy: Mobile) {
    const result = meleeAttack(this.player, enemy);
    this.showMessage(result.message, result.hit ? COLORS.RED : COLORS.LIGHT_GRAY);
    if (result.killingBlow) {
      this.killEntity(enemy);
    }
  }

  private killEntity(entity: Mobile) {
    // Drop gold if the entity has any
    if (entity.gold >= 1) {
      const gold = getItem("gold");
      const goldItem: ItemStack = {
        itemData: {
          count: Math.floor(Math.random() * entity.gold) + 1,
          position: { ...entity.position },
          seen: true,
        },
        object: {
          ...gold,
          id: `gold${this.items.length}`,
        },
      };
      this.items.push(goldItem);
    }

    this.player.xp += entity.xp;
    this.checkLevelUp();

    const index = this.entities.indexOf(entity);
    if (index >= 0) this.entities.splice(index, 1);
  }

  private checkLevelUp() {
    const xpForNextLevel = Math.pow(2, this.player.floor + 3);
    if (this.player.xp >= xpForNextLevel) {
      this.player.floor++;
      this.showMessage(`reached level ${this.player.floor}!`, COLORS.GREEN);

      // Random stat boosts (3 rolls)
      for (let i = 0; i < 3; i++) {
        const roll = Math.random() * 99 + 1;
        if (roll < 34) this.modStatistic(this.player.st, undefined, undefined, 1);
        else if (roll < 67) this.modStatistic(this.player.dx, undefined, undefined, 1);
        else this.modStatistic(this.player.int, undefined, undefined, 1);
      }

      this.modStatistic(this.player.hp, Math.floor(Math.random() * 3) + 1);
      this.modStatistic(this.player.mp, Math.floor(Math.random() * 2) + 1);
    }
  }

  // Modify a statistic.
  // If `base` is set, the base value will be modified.
  // If `current` is set, the current value will be modified.
  // If `value` is set, both the base and current values will be modified.
  public modStatistic(statistic: Statistic, base?: number, current?: number, value?: number) {
    if (value !== undefined) {
      statistic.baseRaw += value;
      statistic.base = Math.max(0, statistic.baseRaw);
      statistic.currentRaw += value;
      statistic.current = Math.max(0, statistic.currentRaw);
    } else if (current !== undefined) {
      statistic.currentRaw = Math.min(statistic.currentRaw + current, statistic.baseRaw);
      statistic.current = Math.max(0, statistic.currentRaw);
    } else if (base !== undefined) {
      statistic.baseRaw = statistic.baseRaw + base;
      statistic.base = Math.max(0, statistic.baseRaw);
    }
    if (statistic.base > 0) {
      statistic.normalized = statistic.current / statistic.base;
    } else {
      statistic.normalized = 0;
    }
  }

  private autoPickupItems() {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const itemStack = this.items[i];
      if (
        itemStack.itemData.position.x === this.player.position.x &&
        itemStack.itemData.position.y === this.player.position.y
      ) {
        if (itemStack.object.id === "gold") {
          // Gold is automatically added to the player's gold count
          this.player.gold += itemStack.itemData.count;
          this.showMessage(`gained ${itemStack.itemData.count} gold`, COLORS.YELLOW);
          this.items.splice(i, 1);
        } else {
          // Inventory item pickup
          const playerItems = this.player.items;
          if (playerItems.length < 14) {
            const vowel = this.isVowel(itemStack.object.name[0]);
            this.showMessage(`got ${vowel ? "an" : "a"} ${itemStack.object.name}`, COLORS.GREEN);
            this.items.splice(i, 1);
            // Add the item to the player's inventory
            this.player.items.push(itemStack);
          }
        }
      }
    }
  }

  private isVowel(char: string): boolean {
    return ["a", "e", "i", "o", "u"].includes(char.toLowerCase());
  }

  private descendStairs() {
    this.depth++;
    this.generateLevel();
    this.showMessage(`descended to floor ${this.depth}`, COLORS.GREEN);
  }

  private winGame() {
    this.victory = true;
    this.mode = "win";
    this.gameOver = true;
    this.score = this.player.xp + this.player.gold * 10 + this.player.floor * 100;
    this.showMessage("power surges through you as you", COLORS.GREEN);
    this.showMessage("grasp the infamous orb of elad", COLORS.GREEN);
    this.showMessage("victory is yours!", COLORS.GREEN);
  }

  private endPlayerTurn() {
    if (this.gameOver) return;
    this.turnCount++;

    // AI turns
    this.processAITurn();

    // Check if the player is dead after the AI turn
    if (this.player.hp.current <= 0) {
      this.gameOver = true;
      this.mode = "dead";
      this.score = this.player.xp + this.player.gold * 10 + this.depth * 50;
      this.showMessage("you are dead", COLORS.RED);
      this.showMessage("press SPACE to continue", COLORS.RED);
    }
  }

  private processAITurn() {
    // Compute distance map from player position
    this.aiSystem.computeDistanceMap(this.player.position, this.tiles, this.entities);

    for (const entity of this.entities) {
      if (entity.hp.current <= 0) continue; // Skip dead entities

      const distanceToPlayer = distance(this.player.position, entity.position);

      // Only move entities that are within vision range + 2 tiles
      if (distanceToPlayer > DUNGEON.VIEW_DISTANCE + 2) continue;

      // Find the closest path to the player and move towards them if not adjacent
      const step = this.aiSystem.getNextStep(entity);
      const newPos = { x: entity.position.x + step.dx, y: entity.position.y + step.dy };

      // Check if the new position is walkable and not occupied by another entity
      const isWalkable = this.isWalkable(newPos);
      const isOccupied = this.getEntityAtPosition(newPos) !== undefined;

      if (isWalkable && !isOccupied) {
        // Path is clear, move the entity
        entity.position = newPos;
      } else {
        // Path is blocked, trigger bumping
        this.handleEntityBump(entity, newPos);
      }
    }
  }

  private handleEntityBump(entity: Mobile, targetPos: Vector2) {
    // Bump into entities
    const targetEntity = this.getEntityAtPosition(targetPos);
    if (targetEntity) {
      // Attack if the entity is adjacent
      const result = meleeAttack(entity, targetEntity);
      const color = result.hit ? COLORS.RED : COLORS.LIGHT_GRAY;
      this.showMessage(result.message, color);
      if (result.killingBlow) {
        this.killEntity(targetEntity);
      }
      return;
    }

    // Bump into door
    const tile = this.tiles[targetPos.x]?.[targetPos.y];
    if (tile && tile.id === "door") {
      this.openDoor(tile);
      return;
    }

    // Bump into wall or other non-walkable tile, do nothing
  }

  private getEntityAtPosition(position: Vector2): Mobile | undefined {
    return this.entities.find(
      (entity) => entity.position.x === position.x && entity.position.y === position.y,
    );
  }

  private isWalkable(position: Vector2): boolean {
    if (!this.tiles[position.x] || !this.tiles[position.x][position.y]) return false;
    const tile = this.tiles[position.x][position.y];
    return tile.walkable;
  }

  public openMenu() {
    if (this.mode !== "game") return;
    this.mode = "inventory";
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
    this.mode = "game";
    this.showMap = false;
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
        const inventoryItems = this.player.items;
        const itemNames = inventoryItems.map((itemStack) => itemStack.object.name);
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
        this.showMap = true;
        this.mapCamera = { ...this.player.position };
        this.mode = "map";
      }
    } else if (currentMenu.action === 2) {
      // Inventory item selected
      const inventoryItems = this.player.items;
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
      const inventoryItems = this.player.items;
      const selectedItem = inventoryItems[this.selectedItemIndex];
      if (!selectedItem) return;

      if (this.menuSelect === 1) {
        // Use/Equip/Drink the item
        this.useItem(selectedItem);
      } else if (this.menuSelect === 2) {
        // Drop the item
        this.dropItem(selectedItem);
      }

      // Close the action menu after using or dropping the item
      while (this.menus.length > 1) {
        this.menus.pop();
      }
      this.mode = "game";
    }
  }

  private removeItemSelected() {
    const inventoryItems = this.player.items;
    inventoryItems.splice(this.selectedItemIndex, 1);
    this.selectedItemIndex = Math.max(0, this.selectedItemIndex - 1);
  }

  private useItem(item: ItemStack) {
    if (item.object.type === "weapon") {
      // Wield the item
      this.player.weapon = item as ItemStack<Weapon>;
      this.showMessage(`wielded the ${item.object.name}`);
    } else if (item.object.type === "armor") {
      // Wear the item
      this.player.armor = item as ItemStack<Armor>;
      this.showMessage(`put on the ${item.object.name}`);
    } else if (item.object.type === "potion") {
      // Drink the item
      if (item.object.id === "health potion") {
        const healAmount = Math.floor(this.player.hp.base * 0.67);
        this.modStatistic(this.player.hp, undefined, healAmount);
      } else if (item.object.id === "magic potion") {
        const magicAmount = Math.floor(this.player.mp.base * 0.67);
        this.modStatistic(this.player.mp, undefined, magicAmount);
      }
      // Remove the item from inventory after use
      this.removeItemSelected();
      this.showMessage(`drank the ${item.object.name}`, item.object.color);
    }
  }

  private dropItem(item: ItemStack) {
    if (this.player.weapon === item) this.player.weapon = null;
    if (this.player.armor === item) this.player.armor = null;

    // Drop the item at the player's current position
    item.itemData.position = { ...this.player.position };
    item.itemData.seen = true;
    this.items.push(item);
    this.removeItemSelected();
    this.showMessage(`dropped the ${item.object.name}`);
  }

  public menuBack() {
    if (this.menus.length > 1) {
      this.menus.pop();
      this.menuSelect = 1;
    } else {
      this.closeMenu();
    }
  }

  public moveMapCamera(direction: Vector2) {
    if (this.mode !== "map") return;
    this.mapCamera.x += direction.x;
    this.mapCamera.y += direction.y;
    // Clamp the camera position to the map bounds
    this.mapCamera.x = Math.max(0, Math.min(DUNGEON.MAP_SIZE - 1, this.mapCamera.x));
    this.mapCamera.y = Math.max(0, Math.min(DUNGEON.MAP_SIZE - 1, this.mapCamera.y));
  }

  // Wand / targeting mode
  public enterTargetingMode() {
    if (!this.player.weapon || this.player.weapon.object.zap <= 0) return;
    if (this.player.mp.current < this.player.weapon.object.zap) return;

    this.mode = "target";
    this.cursorPosition = { x: 7, y: 7 };
    this.showCursor = true;
  }

  public moveTargetCursor(direction: Vector2) {
    const targetPos = {
      x: this.cursorPosition.x + this.player.position.x - 7 + direction.x,
      y: this.cursorPosition.y + this.player.position.y - 7 + direction.y,
    };

    if (
      hasLineOfSight(this.player.position, targetPos, this.tiles) &&
      distance(this.player.position, targetPos) <= DUNGEON.VIEW_DISTANCE
    ) {
      this.cursorPosition.x += direction.x;
      this.cursorPosition.y += direction.y;
    }
  }

  public fireWand() {
    if (!this.player.weapon || this.player.mp.current < this.player.weapon.object.zap) {
      this.exitTargetingMode();
      return;
    }

    this.modStatistic(this.player.mp, undefined, -this.player.weapon.object.zap);

    const targetPos = {
      x: this.cursorPosition.x + this.player.position.x - 7,
      y: this.cursorPosition.y + this.player.position.y - 7,
    };

    for (const entity of this.entities) {
      if (entity.position.x === targetPos.x && entity.position.y === targetPos.y) {
        const result = magicAttack(this.player, entity);
        this.showMessage(result.message, result.hit ? COLORS.RED : COLORS.LIGHT_GRAY);
        if (result.killingBlow) {
          this.killEntity(entity);
        }
        break;
      }
    }
    this.exitTargetingMode();
    this.endPlayerTurn();
  }

  public exitTargetingMode() {
    this.mode = "game";
    this.showCursor = false;
  }

  // Messaging system
  private showMessage(text: string, color = "white") {
    this.messages.push({ text, color });
    if (this.messages.length > 5) {
      this.messages.shift();
    }
  }

  // High scores
  public getHighScores(): { name: string; score: number; depth: number }[] {
    try {
      const storedScores = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedScores) {
        return JSON.parse(storedScores);
      }
    } catch (error) {
      console.error("Error retrieving high scores:", error);
    }

    return [
      { name: "DALE", score: 1000, depth: 9 },
      { name: "GUEST", score: 500, depth: 5 },
      { name: "NOOB", score: 100, depth: 2 },
    ];
  }

  public saveHighScore(name: string) {
    const highScores = this.getHighScores();
    highScores.push({ name, score: this.score, depth: this.depth });
    highScores.sort((a, b) => b.score - a.score);
    const top5 = highScores.slice(0, 5);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(top5));
    } catch (error) {
      console.error("Error saving high scores:", error);
    }
  }
}
