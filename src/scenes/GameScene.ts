import * as Phaser from "phaser";
import { COLORS, UI } from "../game/constants/common";
import { GameState } from "../game/GameState";
import { isVisible } from "../game/Vision";
import { eAc, eDmg, eEv, hpColor, mpColor } from "../game/combat";
import { drawText, hexToColor } from "../game/draw";

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private textObjects: Phaser.GameObjects.Text[] = [];
  private graphics!: Phaser.GameObjects.Graphics;

  // Keys
  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyO!: Phaser.Input.Keyboard.Key;
  private keyX!: Phaser.Input.Keyboard.Key;
  private keyWASD!: { [key: string]: Phaser.Input.Keyboard.Key };

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.BLACK);
    this.gameState = new GameState();
    this.graphics = this.add.graphics();

    // Input handling
    this.cursorKeys = this.input.keyboard!.createCursorKeys();
    this.keyO = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.O);
    this.keyX = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyWASD = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
    }) as { [key: string]: Phaser.Input.Keyboard.Key };

    this.input.keyboard!.on("keydown-ESC", () => {
      this.scene.start("MenuScene");
    });
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000; // Convert delta to seconds
    this.gameState.update(dt);

    const mode = this.gameState.mode;
    if (mode === "game") {
      this.handleGameInput();
    } else if (mode === "inventory") {
      this.handleMenuInput();
    } else if (mode === "map") {
      this.handleMapInput();
    } else if (mode === "target") {
      this.handleTargetInput();
    } else if (mode === "dead" || mode === "win") {
      if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.space)) {
        this.gameState.saveHighScore("PLAYER");
        this.scene.start("MenuScene");
      }
    }
    this.render();
  }

  private handleGameInput() {
    // Movement input
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.left))
      this.gameState.handleMove({ x: -1, y: 0 });
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.right))
      this.gameState.handleMove({ x: 1, y: 0 });
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.up))
      this.gameState.handleMove({ x: 0, y: -1 });
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.down))
      this.gameState.handleMove({ x: 0, y: 1 });

    // WASD movement input
    if (Phaser.Input.Keyboard.JustDown(this.keyWASD.W)) this.gameState.handleMove({ x: 0, y: -1 });
    if (Phaser.Input.Keyboard.JustDown(this.keyWASD.A)) this.gameState.handleMove({ x: -1, y: 0 });
    if (Phaser.Input.Keyboard.JustDown(this.keyWASD.S)) this.gameState.handleMove({ x: 0, y: 1 });
    if (Phaser.Input.Keyboard.JustDown(this.keyWASD.D)) this.gameState.handleMove({ x: 1, y: 0 });

    // O = Open menu
    if (Phaser.Input.Keyboard.JustDown(this.keyO)) this.gameState.openMenu();
    // X = use wand
    if (Phaser.Input.Keyboard.JustDown(this.keyX)) this.gameState.enterTargetingMode();
  }

  private handleMenuInput() {
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.up)) this.gameState.menuUp();
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.down)) this.gameState.menuDown();
    if (Phaser.Input.Keyboard.JustDown(this.keyO)) this.gameState.menuBack();
    if (Phaser.Input.Keyboard.JustDown(this.keyX)) this.gameState.menuSelectOption();
  }

  private handleMapInput() {
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.left))
      this.gameState.moveMapCamera({ x: -1, y: 0 });
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.right))
      this.gameState.moveMapCamera({ x: 1, y: 0 });
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.up))
      this.gameState.moveMapCamera({ x: 0, y: -1 });
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.down))
      this.gameState.moveMapCamera({ x: 0, y: 1 });
    if (Phaser.Input.Keyboard.JustDown(this.keyO)) this.gameState.closeMenu();
  }

  private handleTargetInput() {
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.left))
      this.gameState.moveTargetCursor({ x: -1, y: 0 });
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.right))
      this.gameState.moveTargetCursor({ x: 1, y: 0 });
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.up))
      this.gameState.moveTargetCursor({ x: 0, y: -1 });
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.down))
      this.gameState.moveTargetCursor({ x: 0, y: 1 });
    if (Phaser.Input.Keyboard.JustDown(this.keyO)) this.gameState.exitTargetingMode();
  }

  private render() {
    // Clear all previous text objects
    this.textObjects.forEach((t) => t.destroy());
    this.textObjects = [];
    this.graphics.clear();

    if (this.gameState.showMap) {
      this.renderMap();
    } else {
      this.renderGameView();
      this.renderSidebar();
      this.renderMessages();

      if (this.gameState.mode === "inventory") this.renderMenus();
      if (this.gameState.showCursor) this.renderTargetCursor();
      if (this.gameState.gameOver) this.renderGameOver();
    }
  }

  private renderGameView() {
    const playerPos = this.gameState.player.position;
    const tiles = this.gameState.tiles;

    // Draw tiles (viewport centered around player)
    for (let viewX = 0; viewX < UI.VIEWPORT_WIDTH; viewX++) {
      for (let viewY = 0; viewY < UI.VIEWPORT_HEIGHT; viewY++) {
        const tileX = viewX - Math.floor(UI.VIEWPORT_WIDTH / 2) + playerPos.x;
        const tileY = viewY - Math.floor(UI.VIEWPORT_HEIGHT / 2) + playerPos.y;

        if (tileX < 0 || tileY < 0 || !tiles[tileX] || !tiles[tileX][tileY]) continue;

        const tile = tiles[tileX][tileY];
        const screenX = viewX * UI.CHAR_WIDTH;
        const screenY = viewY * UI.CHAR_HEIGHT;

        if (isVisible(playerPos, { x: tileX, y: tileY }, tiles)) {
          // Currently visible tile - full brightness
          this.textObjects.push(drawText(this, screenX, screenY, tile.character, tile.color));
        } else if (tile.seen) {
          // Explored but not currently visible - dark blue color
          this.textObjects.push(drawText(this, screenX, screenY, tile.character, COLORS.DARK_BLUE));
        }
        // else: not seen, do not draw anything (black background)
      }
    }

    // Draw entities (enemies)
    for (const entity of this.gameState.entities) {
      if (isVisible(playerPos, entity.position, tiles)) {
        const viewX = entity.position.x - playerPos.x + Math.floor(UI.VIEWPORT_WIDTH / 2);
        const viewY = entity.position.y - playerPos.y + Math.floor(UI.VIEWPORT_HEIGHT / 2);
        if (viewX >= 0 && viewX < UI.VIEWPORT_WIDTH && viewY >= 0 && viewY < UI.VIEWPORT_HEIGHT) {
          this.textObjects.push(
            drawText(
              this,
              viewX * UI.CHAR_WIDTH,
              viewY * UI.CHAR_HEIGHT,
              entity.tile,
              entity.color,
            ),
          );
        }
      }
    }

    // Draw player
    this.textObjects.push(
      drawText(
        this,
        Math.floor(UI.VIEWPORT_WIDTH / 2) * UI.CHAR_WIDTH,
        Math.floor(UI.VIEWPORT_HEIGHT / 2) * UI.CHAR_HEIGHT,
        this.gameState.player.tile,
        this.gameState.player.color,
      ),
    );
  }

  private renderSidebar() {
    const player = this.gameState.player;
    const startX = UI.VIEWPORT_WIDTH * UI.CHAR_WIDTH; // Start drawing to the right of the game view
    let currentY = 0;

    // 0th row:　Level and Floor
    this.textObjects.push(
      drawText(
        this,
        startX,
        currentY,
        `level ${player.floor}  floor ${this.gameState.depth}`,
        COLORS.WHITE,
      ),
    );
    currentY += UI.CHAR_HEIGHT;

    // 1st row: XP + Gold
    this.textObjects.push(drawText(this, startX, currentY, `xp ${player.xp}`, COLORS.LAVENDER));
    this.textObjects.push(
      drawText(this, startX + 9 * UI.CHAR_WIDTH, currentY, `$$ ${player.gold}`, COLORS.YELLOW),
    );
    currentY += UI.CHAR_HEIGHT;

    // 2nd row: HP + MP
    this.textObjects.push(
      drawText(
        this,
        startX,
        currentY,
        `hp ${player.hp.current}/${player.hp.base}`,
        hpColor(player),
      ),
    );
    this.textObjects.push(
      drawText(
        this,
        startX + 9 * UI.CHAR_WIDTH,
        currentY,
        `mp ${player.mp.current}/${player.mp.base}`,
        mpColor(player),
      ),
    );
    currentY += UI.CHAR_HEIGHT;

    // 3rd row: ST / DX / IN
    this.textObjects.push(
      drawText(this, startX, currentY, `st ${player.st.current}`, COLORS.WHITE),
    );
    this.textObjects.push(
      drawText(this, startX + 6 * UI.CHAR_WIDTH, currentY, `dx ${player.dx.current}`, COLORS.WHITE),
    );
    this.textObjects.push(
      drawText(
        this,
        startX + 12 * UI.CHAR_WIDTH,
        currentY,
        `in ${player.int.current}`,
        COLORS.WHITE,
      ),
    );
    currentY += UI.CHAR_HEIGHT;

    // 4th row: DM / EV / AC
    this.textObjects.push(drawText(this, startX, currentY, `dm ${eDmg(player)}`, COLORS.WHITE));
    this.textObjects.push(
      drawText(this, startX + 6 * UI.CHAR_WIDTH, currentY, `ev ${eEv(player)}`, COLORS.WHITE),
    );
    this.textObjects.push(
      drawText(this, startX + 12 * UI.CHAR_WIDTH, currentY, `ac ${eAc(player)}`, COLORS.WHITE),
    );
    currentY += UI.CHAR_HEIGHT;

    // 5th-6th rows: Weapon / Armor
    const weaponName = player.weapon
      ? player.weapon.object.zap > 0
        ? player.weapon.object.name + " [x]"
        : player.weapon.object.name
      : "bare fists";
    this.textObjects.push(drawText(this, startX, currentY, weaponName, COLORS.DARK_GRAY));
    currentY += UI.CHAR_HEIGHT;
    const armorName = player.armor ? player.armor.object.name : "clothes";
    this.textObjects.push(drawText(this, startX, currentY, armorName, COLORS.DARK_GRAY));
    currentY += UI.CHAR_HEIGHT;

    // started from 8th row: Visible enemy list
    this.renderVisibleEnemies(startX, currentY + UI.CHAR_HEIGHT);
  }

  private renderVisibleEnemies(startX: number, startY: number) {
    const visibleEnemies = this.gameState.entities.filter((e) =>
      isVisible(this.gameState.player.position, e.position, this.gameState.tiles),
    );

    let column = 0;
    let row = 0;
    const perColumn = 6; // Number of enemies per column

    for (let i = 0; i < visibleEnemies.length && i < 12; i++) {
      const enemy = visibleEnemies[i];
      if (i >= perColumn && column === 0) {
        column = 1;
        row = 0;
      }

      const x = startX + column * 9 * UI.CHAR_WIDTH;
      const y = startY + row * UI.CHAR_HEIGHT;
      this.textObjects.push(drawText(this, x, y, "*", hpColor(enemy)));
      this.textObjects.push(drawText(this, x + UI.CHAR_WIDTH, y, enemy.name, enemy.color));
      row++;
    }
  }

  private renderMessages() {
    const messages = this.gameState.messages;
    const startY = UI.VIEWPORT_HEIGHT * UI.CHAR_HEIGHT; // Start drawing below the game view

    for (let i = 0; i < messages.length; i++) {
      this.textObjects.push(
        drawText(this, 0, startY + i * UI.CHAR_HEIGHT, messages[i].text, messages[i].color),
      );
    }
  }

  private renderMenus() {
    const menus = this.gameState.menus;
    const blink = this.gameState.getBlinkState();

    for (const menu of menus) {
      const isTop = menu === menus[menus.length - 1];
      const posX = menu.positionX * UI.CHAR_WIDTH;
      const posY = menu.positionY * UI.CHAR_HEIGHT;
      const width = menu.width * UI.CHAR_WIDTH;
      const height = menu.height * UI.CHAR_HEIGHT;

      // Draw menu background (black rectangle)
      this.graphics.fillStyle(hexToColor(COLORS.BLACK));
      this.graphics.fillRect(posX, posY, width + UI.CHAR_WIDTH, height + UI.CHAR_HEIGHT);

      // Draw menu border
      this.graphics.lineStyle(1, hexToColor(COLORS.WHITE));
      this.graphics.strokeRect(posX, posY, width + UI.CHAR_WIDTH, height + UI.CHAR_HEIGHT);

      // Draw options
      for (let i = 0; i < menu.options.length; i++) {
        const optionY = posY + (i + 1) * UI.CHAR_HEIGHT;
        const isSelected = isTop && i + 1 === this.gameState.menuSelect;
        const prefix = isSelected && blink ? ">" : " ";
        this.textObjects.push(
          drawText(
            this,
            posX + UI.CHAR_WIDTH,
            optionY,
            prefix + menu.options[i],
            isSelected ? COLORS.YELLOW : COLORS.WHITE,
          ),
        );
      }
    }
  }

  private renderMap() {
    const camera = this.gameState.mapCamera;
    const tiles = this.gameState.tiles;

    for (let viewX = 0; viewX < UI.MAP_WIDTH; viewX++) {
      for (let viewY = 0; viewY < UI.MAP_HEIGHT; viewY++) {
        const tileX = viewX - UI.MAP_WIDTH / 2 + camera.x;
        const tileY = viewY - UI.MAP_HEIGHT / 2 + camera.y;

        if (tiles[tileX] && tiles[tileX][tileY] && tiles[tileX][tileY].seen)
          this.textObjects.push(
            drawText(
              this,
              viewX * UI.CHAR_WIDTH,
              viewY * UI.CHAR_HEIGHT,
              tiles[tileX][tileY].character,
              COLORS.DARK_BLUE,
            ),
          );
      }
    }

    // Player position marker
    const playerViewX = this.gameState.player.position.x - camera.x + UI.MAP_WIDTH / 2;
    const playerViewY = this.gameState.player.position.y - camera.y + UI.MAP_HEIGHT / 2;
    if (
      playerViewX >= 0 &&
      playerViewX < UI.MAP_WIDTH &&
      playerViewY >= 0 &&
      playerViewY < UI.MAP_HEIGHT
    )
      this.textObjects.push(
        drawText(
          this,
          playerViewX * UI.CHAR_WIDTH,
          playerViewY * UI.CHAR_HEIGHT,
          this.gameState.player.tile,
          COLORS.WHITE,
        ),
      );
  }

  private renderTargetCursor() {
    const blink = this.gameState.getBlinkState();
    if (!blink) return; // Only draw cursor when blinking

    const cursorPosX = this.gameState.cursorPosition.x * UI.CHAR_WIDTH;
    const cursorPosY = this.gameState.cursorPosition.y * UI.CHAR_HEIGHT;

    // Draw laser line from player to cursor
    this.drawLine(
      UI.VIEWPORT_WIDTH / 2,
      UI.VIEWPORT_HEIGHT / 2,
      this.gameState.cursorPosition.x,
      this.gameState.cursorPosition.y,
      COLORS.RED,
    );

    // Highlight the target tile
    const weaponColor = this.gameState.player.weapon?.object.color || COLORS.WHITE;
    this.graphics.fillStyle(hexToColor(weaponColor));
    this.graphics.fillRect(cursorPosX, cursorPosY, UI.CHAR_WIDTH, UI.CHAR_HEIGHT - 2);
  }

  private renderGameOver() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    // Dark overlay
    this.graphics.fillStyle(hexToColor(COLORS.BLACK), 0.7);
    this.graphics.fillRect(0, 0, this.scale.width, this.scale.height);

    const title = this.gameState.victory ? "VICTORY!" : "YOU ARE DEAD";
    const color = this.gameState.victory ? COLORS.GREEN : COLORS.RED;

    this.textObjects.push(drawText(this, cx, cy - UI.CHAR_HEIGHT * 2, title, color, true));

    this.textObjects.push(
      drawText(
        this,
        cx,
        cy,
        `Score: ${this.gameState.score} Floor: ${this.gameState.depth}`,
        COLORS.WHITE,
        true,
      ),
    );

    this.textObjects.push(
      drawText(
        this,
        cx,
        cy + UI.CHAR_HEIGHT * 2,
        "Press SPACE to continue",
        COLORS.LIGHT_GRAY,
        true,
      ),
    );
  }

  private drawLine(x1: number, y1: number, x2: number, y2: number, color: string) {
    // Bresenham's line drawing algorithm
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = x1 < x2 ? 1 : -1;
    let sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    const lineColor = hexToColor(color);
    this.graphics.fillStyle(lineColor);

    while (true) {
      this.graphics.fillRect(
        x1 * UI.CHAR_WIDTH,
        y1 * UI.CHAR_HEIGHT,
        UI.CHAR_WIDTH - 1,
        UI.CHAR_HEIGHT - 2,
      );

      if (x1 === x2 && y1 === y2) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x1 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y1 += sy;
      }
    }
  }
}
