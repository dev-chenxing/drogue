import { meleeAttack } from "./combat";
import { DIRECTIONS, DUNGEON } from "./constants/common";
import type { GameState } from "./GameState";
import type { Mobile, Tile, Vector2 } from "./types";
import { distance } from "./Vision";

interface DistCell {
  distance: number;
}

export class AISystem {
  private distanceMap: DistCell[][] = [];

  public computeDistanceMap(start: Vector2, tiles: Tile[][], entities: Mobile[]): void {
    const size = DUNGEON.MAP_SIZE;

    // Initialize the distance map
    this.distanceMap = [];
    for (let x = 0; x < size; x++) {
      this.distanceMap[x] = [];
      for (let y = 0; y < size; y++) {
        this.distanceMap[x][y] = { distance: Infinity };
      }
    }

    // Set the starting position distance to 0
    this.distanceMap[start.x][start.y].distance = 0;
    let candidates: Vector2[] = [start];
    let step = 0;

    while (candidates.length > 0) {
      step++;
      const newCandidates: Vector2[] = [];

      for (const current of candidates) {
        for (const dir of DIRECTIONS) {
          const neighborX = current.x + dir.x;
          const neighborY = current.y + dir.y;

          if (neighborX >= 0 && neighborX < size && neighborY >= 0 && neighborY < size) {
            if (
              this.distanceMap[neighborX][neighborY].distance === Infinity &&
              this.isWalkable(neighborX, neighborY, tiles, entities)
            ) {
              this.distanceMap[neighborX][neighborY].distance = step;
              newCandidates.push({ x: neighborX, y: neighborY });
            }
          }
        }
      }

      candidates = newCandidates;
    }
  }

  private isWalkable(x: number, y: number, tiles: Tile[][], entities: Mobile[]): boolean {
    if (!tiles[x] || !tiles[x][y]) return false;
    const tile = tiles[x][y];
    if (!tile.walkable) return false;

    // Check if any entity occupies the tile
    for (const entity of entities) {
      if (entity.position.x === x && entity.position.y === y) {
        return false;
      }
    }
    return true;
  }

  public getNextStep(entity: Mobile): { dx: number; dy: number } | null {
    let lowestDistance = Infinity;
    let bestStep = { dx: 0, dy: 0 };

    for (const dir of DIRECTIONS) {
      const neighborX = entity.position.x + dir.x;
      const neighborY = entity.position.y + dir.y;

      if (this.distanceMap[neighborX] && this.distanceMap[neighborX][neighborY]) {
        const neighborDistance = this.distanceMap[neighborX][neighborY].distance;
        if (neighborDistance <= lowestDistance) {
          lowestDistance = neighborDistance;
          bestStep = { dx: dir.x, dy: dir.y };
        }
      }
    }

    return Number.isFinite(lowestDistance) ? bestStep : null;
  }

  public getDistance(x: number, y: number): number {
    if (this.distanceMap[x] && this.distanceMap[x][y]) {
      return this.distanceMap[x][y].distance;
    }
    return Infinity;
  }

  public processAITurn(gameState: GameState): void {
    const { player, tiles } = gameState;
    const entities = gameState.entityManager.getEntities();
    // Compute distance map from player position
    this.computeDistanceMap(player.position, tiles, entities);

    for (const entity of entities) {
      if (player.hp.current <= 0) break; // Stop processing further AI actions once the player is dead
      if (entity.hp.current <= 0) continue; // Skip dead entities

      const distanceToPlayer = distance(player.position, entity.position);

      // Only move entities that are within vision range + 2 tiles
      if (distanceToPlayer > DUNGEON.VIEW_DISTANCE + 2) continue;

      // Find the closest path to the player and move towards them if not adjacent
      const step = this.getNextStep(entity);
      if (!step) continue;

      const newPos = { x: entity.position.x + step.dx, y: entity.position.y + step.dy };

      // Check if the new position is walkable and does not contain the player
      const isWalkable = this.isWalkable(newPos.x, newPos.y, tiles, entities);
      const isPlayerTile = player.position.x === newPos.x && player.position.y === newPos.y;

      if (isWalkable && !isPlayerTile) {
        // Path is clear, move the entity
        entity.position = newPos;
      } else {
        // Path is blocked, trigger bumping
        this.handleEntityBump(entity, newPos, gameState);
        if (player.hp.current <= 0) break;
      }
    }
  }

  private handleEntityBump(entity: Mobile, targetPos: Vector2, gameState: GameState) {
    // Bump into player
    if (
      gameState.player.position.x === targetPos.x &&
      gameState.player.position.y === targetPos.y
    ) {
      const result = meleeAttack(entity, gameState.player);
      gameState.showMessage(result.messages);
      return;
    }

    // Bump into entities
    const targetEntity = gameState.entityManager.getEntityAtPosition(targetPos);
    if (targetEntity) {
      // Attack if the entity is adjacent
      const result = meleeAttack(entity, targetEntity);
      gameState.showMessage(result.messages);
      if (result.killingBlow) {
        gameState.entityManager.killEntity(targetEntity);
      }
      return;
    }

    // Bump into door
    const tile = gameState.tiles[targetPos.x]?.[targetPos.y];
    if (tile && tile.id === "door") {
      gameState.openDoor(tile);
      return;
    }

    // Bump into wall or other non-walkable tile, do nothing
  }
}
