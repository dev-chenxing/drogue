import { getItem } from "./Item";
import { COLORS } from "./constants/common";
import { ENTITY_DATA } from "./constants/entities";
import type { GameState } from "./GameState";
import { getIndefiniteArticle } from "./MessageLog";
import type { EntityData, ItemStack, Mobile, Vector2 } from "./types";
import { isVisible } from "./vision";

export function getEntity(entityId: string): EntityData {
  const entity = ENTITY_DATA.find((candidate) => candidate.name === entityId);
  if (!entity) {
    throw new Error(`Entity with id ${entityId} not found`);
  }
  return entity;
}

export function createMobile(
  entity: EntityData,
  position: Vector2,
  id: number,
  floor: number,
): Mobile {
  const mobileId = entity.name === "player" ? "player" : `${entity.name}${id}`;

  return {
    id: mobileId,
    name: entity.name,
    tile: entity.tile,
    color: entity.color,
    gold: entity.gold,
    qty: entity.qty,
    position,
    hp: {
      base: entity.hp,
      baseRaw: entity.hp,
      current: entity.hp,
      currentRaw: entity.hp,
      normalized: 1,
    },
    mp: {
      base: entity.mp,
      baseRaw: entity.mp,
      current: entity.mp,
      currentRaw: entity.mp,
      normalized: 1,
    },
    xp: entity.xp,
    st: {
      base: entity.st,
      baseRaw: entity.st,
      current: entity.st,
      currentRaw: entity.st,
      normalized: 1,
    },
    dx: {
      base: entity.dx,
      baseRaw: entity.dx,
      current: entity.dx,
      currentRaw: entity.dx,
      normalized: 1,
    },
    int: {
      base: entity.int,
      baseRaw: entity.int,
      current: entity.int,
      currentRaw: entity.int,
      normalized: 1,
    },
    ev: entity.ev,
    ac: entity.ac,
    floor,
    seen: false,
    weapon: null,
    armor: null,
    items: [],
  };
}

export class EntityManager {
  private gameState: GameState;
  private entities: Mobile[] = [];

  constructor(gameState: GameState) {
    this.gameState = gameState;
  }

  public addEntity(entity: Mobile) {
    this.entities.push(entity);
  }

  public addEntities(entities: Mobile[]) {
    this.entities.push(...entities);
  }

  public killEntity(entity: Mobile) {
    // Drop gold if the entity has any
    if (entity.gold >= 1) {
      const gold = getItem("gold");
      const goldCount = Math.floor(Math.random() * entity.gold) + 1;
      const goldItem: ItemStack = {
        itemData: {
          count: goldCount,
          position: { ...entity.position },
          seen: true,
        },
        object: {
          ...gold,
          id: `gold${goldCount}`,
        },
      };
      this.gameState.itemManager.addItem(goldItem);
    }

    this.gameState.player.xp += entity.xp;
    this.gameState.checkLevelUp();
    const index = this.entities.indexOf(entity);
    if (index >= 0) this.entities.splice(index, 1);
  }

  public getEntities(): Mobile[] {
    return [...this.entities];
  }

  public getEntityAtPosition(position: Vector2): Mobile | null {
    return (
      this.entities.find(
        (entity) => entity.position.x === position.x && entity.position.y === position.y,
      ) || null
    );
  }

  public discoverVisibleEntities() {
    const playerPos = this.gameState.player.position;
    const tiles = this.gameState.tiles;

    for (const entity of this.entities) {
      if (entity.seen) continue;
      if (!isVisible(playerPos, entity.position, tiles)) continue;

      entity.seen = true;
      this.gameState.showMessage(
        `${getIndefiniteArticle(entity.name)} ${entity.name} draws near!`,
        COLORS.PINK,
      );
    }
  }

  public clear() {
    this.entities = [];
  }
}
