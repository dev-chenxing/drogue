import { TILES, DUNGEON, DIRECTIONS } from "./constants/common";
import { ITEM_DATA } from "./constants/items";
import { ENTITY_DATA } from "./constants/entities";
import { createMobile } from "./Entity";
import { getItem } from "./Item";
import type { DungeonLevel, EntityData, ItemStack, Mobile, Tile, Vector2 } from "./types";

interface Room {
  x1: number; // x coordinate of the top-left corner of the room
  y1: number; // y coordinate of the top-left corner of the room
  x2: number; // x coordinate of the bottom-right corner of the room
  y2: number; // y coordinate of the bottom-right corner of the room
  width: number; // width of the room
  height: number; // height of the room
  cx: number; // x coordinate of the center of the room
  cy: number; // y coordinate of the center of the room
}

interface Door {
  position: Vector2; // position of the door
  facing: Vector2; // direction the door is facing (e.g., {x: 0, y: -1} for north)
}

export class DungeonGenerator {
  private size: number;
  private depth: number;
  private tiles!: Tile[][];
  private rooms: Room[] = [];

  constructor(depth: number) {
    this.size = DUNGEON.MAP_SIZE;
    this.depth = depth;
  }

  public generate(): {
    level: DungeonLevel;
    entities: Mobile[];
    items: ItemStack[];
    playerStart: Vector2;
  } {
    this.initializeMap();
    this.generateRooms();
    const stairsPos = this.placeStairsOrOrb();
    const items = this.placeItems();
    const entities = this.placeEntities(items);

    const playerStart = { x: this.rooms[0].cx, y: this.rooms[0].cy };

    return {
      level: {
        width: this.size,
        height: this.size,
        tiles: this.tiles,
        depth: this.depth,
        stairsPos,
        orbPos: this.depth === DUNGEON.MAX_DEPTH ? stairsPos : null,
      },
      entities,
      items,
      playerStart,
    };
  }

  private initializeMap(): void {
    this.tiles = [];
    for (let x = 0; x < this.size; x++) {
      this.tiles[x] = [];
      for (let y = 0; y < this.size; y++) {
        this.tiles[x][y] = { ...TILES.WALL, seen: false }; // Initialize all tiles as walls
      }
    }
  }

  private makeRoom(x: number, y: number, width: number, height: number): Room {
    return {
      x1: x,
      y1: y,
      x2: x + width,
      y2: y + height,
      cx: Math.floor((x + x + width) / 2),
      cy: Math.floor((y + y + height) / 2),
      width,
      height,
    };
  }

  private isInBounds(x: number, y: number): boolean {
    return x > 1 && x < this.size - 1 && y > 1 && y < this.size - 1;
  }

  private digRoom(room: Room): void {
    for (let x = room.x1 + 1; x <= room.x2; x++) {
      for (let y = room.y1 + 1; y <= room.y2; y++) {
        if (this.isInBounds(x, y)) {
          this.tiles[x][y] = { ...TILES.FLOOR, seen: false }; // Dig out the room by setting tiles to FLOOR
        }
      }
    }
  }

  private randomDirection(): Vector2 {
    const index = Math.floor(Math.random() * DIRECTIONS.length);
    return DIRECTIONS[index];
  }

  private addDoor(room: Room): Door | null {
    // Randomly choose a wall to place a door on (north, south, east, west)
    const facing: Vector2 = this.randomDirection();
    let x = 0;
    let y = 0;
    if (facing.x === -1 && facing.y === 0) {
      // West wall
      x = room.x1;
      y = Math.floor(Math.random() * (room.height - 1)) + room.y1 + 1;
    } else if (facing.x === 1 && facing.y === 0) {
      // East wall
      x = room.x2 + 1;
      y = Math.floor(Math.random() * (room.height - 1)) + room.y1 + 1;
    } else if (facing.x === 0 && facing.y === -1) {
      // North wall
      x = Math.floor(Math.random() * (room.width - 1)) + room.x1 + 1;
      y = room.y1;
    } else if (facing.x === 0 && facing.y === 1) {
      // South wall
      x = Math.floor(Math.random() * (room.width - 1)) + room.x1 + 1;
      y = room.y2 + 1;
    }

    if (this.isInBounds(x, y)) {
      return { position: { x, y }, facing };
    }
    return null; // Return null if the door position is out of bounds
  }

  private addRoomFromDoor(door: Door): Room {
    const roomWidth =
      Math.floor(Math.random() * (DUNGEON.ROOM_MAX_SIZE - DUNGEON.ROOM_MIN_SIZE)) +
      DUNGEON.ROOM_MIN_SIZE;
    const roomHeight =
      Math.floor(Math.random() * (DUNGEON.ROOM_MAX_SIZE - DUNGEON.ROOM_MIN_SIZE)) +
      DUNGEON.ROOM_MIN_SIZE;
    let x = door.position.x;
    let y = door.position.y;

    if (door.facing.x === -1 && door.facing.y === 0) {
      // West wall, place room to the left
      x = door.position.x - roomWidth - 1;
      y = door.position.y - Math.floor(roomHeight / 2);
    } else if (door.facing.x === 1 && door.facing.y === 0) {
      // East wall, place room to the right
      x = door.position.x;
      y = door.position.y - Math.floor(roomHeight / 2);
    } else if (door.facing.x === 0 && door.facing.y === -1) {
      // North wall, place room above
      x = door.position.x - Math.floor(roomWidth / 2);
      y = door.position.y - roomHeight - 1;
    } else if (door.facing.x === 0 && door.facing.y === 1) {
      // South wall, place room below
      x = door.position.x - Math.floor(roomWidth / 2);
      y = door.position.y;
    }
    return this.makeRoom(x, y, roomWidth, roomHeight);
  }

  private roomsIntersect(room1: Room, room2: Room): boolean {
    return (
      room1.x1 <= room2.x2 && room1.x2 >= room2.x1 && room1.y1 <= room2.y2 && room1.y2 >= room2.y1
    );
  }

  private hitWall(room: Room): boolean {
    return !this.isInBounds(room.x1, room.y1) || !this.isInBounds(room.x2, room.y2);
  }

  private generateRooms(): void {
    this.rooms = [];

    // Start with a room in the center
    this.rooms.push(
      this.makeRoom(
        DUNGEON.INITIAL_ROOM_POSITION.x,
        DUNGEON.INITIAL_ROOM_POSITION.y,
        DUNGEON.INITIAL_ROOM_SIZE,
        DUNGEON.INITIAL_ROOM_SIZE,
      ),
    );
    this.digRoom(this.rooms[0]);

    for (let i = 0; i < DUNGEON.MAX_ROOMS; i++) {
      const roomIndex = Math.floor(Math.random() * this.rooms.length);
      const door = this.addDoor(this.rooms[roomIndex]);
      if (door) {
        const newRoom = this.addRoomFromDoor(door);
        if (!this.hitWall(newRoom) && !this.rooms.some((r) => this.roomsIntersect(r, newRoom))) {
          // If the new room is valid, dig it and add it to the list of rooms
          this.digRoom(newRoom);
          this.rooms.push(newRoom);
          // Place the door tile
          this.tiles[door.position.x][door.position.y] = { ...TILES.DOOR, seen: false };
        }
      }
    }
  }

  private placeStairsOrOrb(): Vector2 {
    const lastRoom = this.rooms[this.rooms.length - 1];
    const stairsPos = { x: lastRoom.cx, y: lastRoom.cy };

    if (this.depth < DUNGEON.MAX_DEPTH) {
      this.tiles[stairsPos.x][stairsPos.y] = { ...TILES.STAIRS, seen: false };
    } else {
      this.tiles[stairsPos.x][stairsPos.y] = { ...TILES.ORB, seen: false };
    }
    return stairsPos;
  }

  private createItemStack(
    itemId: string,
    x: number,
    y: number,
    count: number,
    id: number,
  ): ItemStack {
    const item = getItem(itemId);
    return {
      itemData: {
        count,
        position: { x, y },
        seen: false,
      },
      object: {
        id: `${itemId}${id}`,
        name: item.name,
        tile: item.tile,
        color: item.color,
        type: item.type,
        damage: item.dmg,
        ac: item.ac,
        ev: item.ev,
        zap: item.zap,
        floors: item.floors,
      },
    };
  }

  private placeItems(): ItemStack[] {
    const items: ItemStack[] = [];
    let itemIdCounter = 0; // Counter to ensure unique item IDs

    // Skip the first room (starting room) and place items in subsequent rooms
    for (let i = 1; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      if (Math.random() * 100 < DUNGEON.ITEM_RATE) {
        const ix = Math.floor(Math.random() * (room.width - 1)) + room.x1 + 1;
        const iy = Math.floor(Math.random() * (room.height - 1)) + room.y1 + 1;

        if (Math.random() * 100 < DUNGEON.GOLD_RATE) {
          // Place gold
          const goldAmount = Math.floor(Math.random() * this.depth * 3) + 1; // Gold amount scales with depth
          items.push(this.createItemStack("gold", ix, iy, goldAmount, itemIdCounter++));
        } else {
          // Place a random item from ITEM_DATA
          const itemId = this.getRandomItem();
          items.push(this.createItemStack(itemId, ix, iy, 1, itemIdCounter++));
        }
      }
    }
    return items;
  }

  private getRandomItem(): string {
    const candidates: string[] = [];
    for (const item of ITEM_DATA) {
      const [minFloor, maxFloor] = item.floors;
      if (this.depth >= minFloor && this.depth <= maxFloor) {
        candidates.push(item.name);
      }
    }
    if (candidates.length === 0) {
      throw new Error(`No items available for depth ${this.depth}`);
    }
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  }

  private placeEntities(items: ItemStack[]): Mobile[] {
    const entities: Mobile[] = [];
    let entityIdCounter = 0; // Counter to ensure unique entity IDs

    // Skip the first room (starting room) and place entities in subsequent rooms
    for (let i = 1; i < this.rooms.length; i++) {
      const room = this.rooms[i];
      const entity = this.getRandomEntity();
      for (let i = 0; i < entity.qty; i++) {
        if (Math.random() * 100 < DUNGEON.ENEMY_RATE) {
          let ex: number, ey: number;
          // Reroll position until tile has no items on it
          let attempts = 0;
          do {
            ex = Math.floor(Math.random() * (room.width - 2)) + room.x1 + 2;
            ey = Math.floor(Math.random() * (room.height - 2)) + room.y1 + 2;
            attempts++;
            // Break if we exceed a reasonable number of attempts to avoid infinite loops
          } while (this.hasItemAt(ex, ey, items) && attempts < 10);

          entities.push(createMobile(entity, { x: ex, y: ey }, entityIdCounter++, this.depth));
        }
      }
    }
    return entities;
  }

  private hasItemAt(x: number, y: number, items: ItemStack[]): boolean {
    return items.some((item) => item.itemData.position.x === x && item.itemData.position.y === y);
  }

  private getRandomEntity(): EntityData {
    return ENTITY_DATA[this.depth * 2 + Math.floor(Math.random() * 2)]; // Scale entity selection with depth
  }

  public isWalkable(x: number, y: number): boolean {
    if (!this.isInBounds(x, y)) return false;
    const tile = this.tiles[x][y];
    return tile.walkable;
  }
}
