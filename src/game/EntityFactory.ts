import { ENTITY_DATA } from "./constants/EntityData";
import type { EntityData, Mobile, Vector2 } from "./types";

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
  return {
    id: `${entity.name}${id}`,
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
    xp: 0,
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
