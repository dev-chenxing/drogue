import { AISystem } from "./AISystem";
import { meleeAttack } from "./comabt";
import { DUNGEON } from "./constants/common";
import { DungeonGenerator } from "./DungeonGenerator";
import { createMobile, getEntity } from "./EntityFactory";
import { getItem } from "./ItemFactory";
import type { GameMode, ItemStack, MenuState, Message, Mobile, Tile, Vector2 } from "./types";
import { updateVisibility } from "./vision";

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
    this.showMessage("welcome to the dungeon", "green");
    this.showMessage("seek the orb of elad", "green");
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
      this.checkForStairs();
      this.checkForVictory();
      this.endPlayerTurn();
    } else {
      // Check if the new position is a door, if so, open it
      const tile = this.tiles[newPos.x][newPos.y];
      if (tile.id === "door") {
        this.tiles[newPos.x][newPos.y].id = "floor";
        this.tiles[newPos.x][newPos.y].character = ".";
        this.tiles[newPos.x][newPos.y].color = "gray";
        this.showMessage("opened a door");
        this.endPlayerTurn();
      }
    }
  }

  private playerAttack(enemy: Mobile) {
    const result = meleeAttack(this.player, enemy);
    this.showMessage(result.message, result.hit ? "red" : "gray");
    if (result.killingBlow) {
      this.killEntity(enemy);
    }
  }

  private killEntity(entity: Mobile) {
    this.player.xp += entity.xp;
    this.showMessage(`defeated ${entity.name}`, "green");

    if (entity.gold > 0) {
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

    const index = this.entities.indexOf(entity);
    if (index >= 0) this.entities.splice(index, 1);
    this.checkLevelUp();
  }

  private showMessage(text: string, color = "white") {
    this.messages.push({ text, color });
  }

  private getEntityAtPosition(position: Vector2): Mobile | undefined {
    return this.entities.find(
      (entity) => entity.position.x === position.x && entity.position.y === position.y,
    );
  }

  private endPlayerTurn() {
    this.aiSystem.computeDistanceMap(this.player.position, this.tiles, this.entities);
  }

  private isWalkable(position: Vector2): boolean {
    const tile = this.tiles[position.x]?.[position.y];
    return Boolean(tile?.walkable);
  }

  private autoPickupItems() {
    // TODO: implement item pickup flow
  }

  private checkForStairs() {
    // TODO: implement floor transition flow
  }

  private checkForVictory() {
    // TODO: implement victory condition flow
  }

  private checkLevelUp() {
    // TODO: implement level-up flow
  }
}
