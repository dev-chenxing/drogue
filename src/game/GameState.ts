import { AISystem } from "./AISystem";
import { meleeAttack, magicAttack } from "./combat";
import { COLORS, DUNGEON, UI } from "./constants/common";
import { DungeonGenerator } from "./Dungeon";
import { createMobile, EntityManager, getEntity } from "./Entity";
import { ItemManager } from "./Item";
import { MenuManager } from "./Menu";
import { MessageLog } from "./MessageLog";
import { SaveManger } from "./Save";
import { modStatisticBase, modStatisticCurrent, modStatisticValue } from "./Stat";
import type { Armor, GameMode, ItemStack, Mobile, Tile, Vector2, Weapon } from "./types";
import { distance, hasLineOfSight, updateVisibility } from "./Vision";

export class GameState {
  public mode: GameMode = "game";
  public gameOver = false;
  public victory = false;

  public tiles: Tile[][] = [];

  public player!: Mobile;
  public depth: number = 1;

  public showMap = false;
  public mapCamera: Vector2 = { x: 0, y: 0 };
  public showCursor = false;
  public cursorPosition: Vector2 = { x: 7, y: 7 };

  public score = 0;

  private turnCount = 0;
  private blinkTimer = 0;

  private aiSystem: AISystem;
  public msgLog: MessageLog;
  public entityManager: EntityManager;
  public itemManager: ItemManager;
  public menuManager: MenuManager;
  public saveManager: SaveManger;

  constructor() {
    this.aiSystem = new AISystem();
    this.msgLog = new MessageLog();
    this.entityManager = new EntityManager(this);
    this.itemManager = new ItemManager(this);
    this.menuManager = new MenuManager(this);
    this.saveManager = new SaveManger();
    this.newGame();
  }

  public newGame() {
    this.depth = 1;
    this.gameOver = false;
    this.victory = false;
    this.mode = "game";
    this.createPlayer();
    this.generateLevel();
    this.menuManager.clear();
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

    // Clear old data, hand new data to managers
    this.entityManager.clear();
    this.entityManager.addEntities(entities);
    this.itemManager.clear();
    this.itemManager.addItems(items);

    this.player.position = playerStart;
    updateVisibility(this.player.position, this.tiles);
    this.itemManager.discoverVisibleItems();
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
    const enemy = this.entityManager.getEntityAtPosition(newPos);
    if (enemy) {
      this.playerAttack(enemy);
      this.endPlayerTurn();
      return;
    }

    // Check if the new position is walkable and unoccupied, if so, move the player
    if (this.isWalkable(newPos)) {
      this.player.position = newPos;
      updateVisibility(this.player.position, this.tiles);
      this.itemManager.discoverVisibleItems();
      this.itemManager.autoPickupItems();
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

  public openDoor(tile: Tile) {
    tile.id = "floor";
    tile.character = ".";
    tile.color = "gray";
    tile.walkable = true;

    updateVisibility(this.player.position, this.tiles);
    this.itemManager.discoverVisibleItems();
  }

  private playerAttack(enemy: Mobile) {
    const result = meleeAttack(this.player, enemy);
    this.showMessage(result.messages, result.hit ? COLORS.RED : COLORS.LIGHT_GRAY);
    if (result.killingBlow) {
      this.entityManager.killEntity(enemy);
    }
  }

  public checkLevelUp() {
    const xpForNextLevel = Math.pow(2, this.player.floor + 3);
    if (this.player.xp >= xpForNextLevel) {
      this.player.floor++;
      this.showMessage(`reached level ${this.player.floor}!`, COLORS.GREEN);

      // Random stat boosts (3 rolls)
      for (let i = 0; i < 3; i++) {
        const roll = Math.random() * 99 + 1;
        if (roll < 34) modStatisticValue(this.player.st, 1);
        else if (roll < 67) modStatisticValue(this.player.dx, 1);
        else modStatisticValue(this.player.int, 1);
      }

      modStatisticBase(this.player.hp, Math.floor(Math.random() * 3) + 1);
      modStatisticBase(this.player.mp, Math.floor(Math.random() * 2) + 1);
    }
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
    this.aiSystem.processAITurn(this);

    // Items can become visible from combat changes during the turn
    this.itemManager.discoverVisibleItems();

    // Check if the player is dead after the AI turn
    if (this.player.hp.current <= 0) {
      this.gameOver = true;
      this.mode = "dead";
      this.score = this.player.xp + this.player.gold * 10 + this.depth * 50;
      this.showMessage("you are dead", COLORS.RED);
      this.showMessage("press SPACE to continue", COLORS.RED);
    }
  }

  private isWalkable(position: Vector2): boolean {
    if (!this.tiles[position.x] || !this.tiles[position.x][position.y]) return false;
    const tile = this.tiles[position.x][position.y];
    if (!tile.walkable) return false;

    // Occupied by an enemy
    if (this.entityManager.getEntityAtPosition(position)) return false;

    return true;
  }

  public useItem(item: ItemStack) {
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
        modStatisticCurrent(this.player.hp, healAmount);
      } else if (item.object.id === "magic potion") {
        const magicAmount = Math.floor(this.player.mp.base * 0.67);
        modStatisticCurrent(this.player.mp, magicAmount);
      }
      // Remove the item from inventory after use
      this.menuManager.removeItemSelected();
      this.showMessage(`drank the ${item.object.name}`, item.object.color);
    }
  }

  public dropItem(item: ItemStack) {
    if (this.player.weapon === item) this.player.weapon = null;
    if (this.player.armor === item) this.player.armor = null;

    // Drop the item at the player's current position
    item.itemData.position = { ...this.player.position };
    item.itemData.seen = true;
    this.itemManager.addItem(item);
    this.menuManager.removeItemSelected();
    this.showMessage(`dropped the ${item.object.name}`);
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

    const centerX = Math.floor(UI.VIEWPORT_WIDTH / 2);
    const centerY = Math.floor(UI.VIEWPORT_HEIGHT / 2);

    this.mode = "target";
    this.cursorPosition = { x: centerX, y: centerY };
    this.showCursor = true;
  }

  public moveTargetCursor(direction: Vector2) {
    const centerX = Math.floor(UI.VIEWPORT_WIDTH / 2);
    const centerY = Math.floor(UI.VIEWPORT_HEIGHT / 2);
    const targetPos = {
      x: this.cursorPosition.x + this.player.position.x - centerX + direction.x,
      y: this.cursorPosition.y + this.player.position.y - centerY + direction.y,
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

    const centerX = Math.floor(UI.VIEWPORT_WIDTH / 2);
    const centerY = Math.floor(UI.VIEWPORT_HEIGHT / 2);

    modStatisticCurrent(this.player.mp, -this.player.weapon.object.zap);

    const targetPos = {
      x: this.cursorPosition.x + this.player.position.x - centerX,
      y: this.cursorPosition.y + this.player.position.y - centerY,
    };

    for (const entity of this.entityManager.getEntities()) {
      if (entity.position.x === targetPos.x && entity.position.y === targetPos.y) {
        const result = magicAttack(this.player, entity);
        this.showMessage(result.messages, result.hit ? COLORS.RED : COLORS.LIGHT_GRAY);
        if (result.killingBlow) {
          this.entityManager.killEntity(entity);
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
  public showMessage(textOrLines: string | string[], color = "white") {
    this.msgLog.showMessage(textOrLines, color);
  }
}
