import { DUNGEON } from "./constants/common";
import type { Tile, Vector2 } from "./types";

// Bresenham's line-of-sight algorithm to determine if a target is visible from the source
export function hasLineOfSight(source: Vector2, target: Vector2, tiles: Tile[][]): boolean {
  if (distance(source, target) <= 1) return true; // Adjacent tiles are always visible

  let sx = source.x < target.x ? 1 : -1;
  let sy = source.y < target.y ? 1 : -1;
  let dx = Math.abs(target.x - source.x);
  let dy = Math.abs(target.y - source.y);

  let err = dx - dy;
  let firstStep = true;

  while (!(source.x === target.x && source.y === target.y)) {
    if (!firstStep && !tiles[source.x][source.y].walkable) {
      return false; // Obstacle blocks the line of sight
    }
    firstStep = false;

    let e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      source.x += sx;
    }
    if (e2 < dx) {
      err += dx;
      source.y += sy;
    }
  }

  return true; // No obstacles found, line of sight is clear
}

export function distance(a: Vector2, b: Vector2): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

// Mark tiles as seen based on the player's position
export function updateVisibility(playerPos: Vector2, tiles: Tile[][]): void {
  const viewDistance = DUNGEON.VIEW_DISTANCE;
  for (let dx = -viewDistance; dx <= viewDistance; dx++) {
    for (let dy = -viewDistance; dy <= viewDistance; dy++) {
      const x = playerPos.x + dx;
      const y = playerPos.y + dy;
      if (x < 0 || x >= tiles.length || y < 0 || y >= tiles[0].length) continue; // Out of bounds
      if (distance(playerPos, { x, y }) <= viewDistance) {
        if (hasLineOfSight({ ...playerPos }, { x, y }, tiles)) {
          tiles[x][y].seen = true; // Mark tile as seen
        }
      }
    }
  }
}

export function isVisible(playerPos: Vector2, targetPos: Vector2, tiles: Tile[][]): boolean {
  return (
    distance(playerPos, targetPos) <= DUNGEON.VIEW_DISTANCE &&
    hasLineOfSight({ ...playerPos }, { ...targetPos }, tiles)
  );
}
