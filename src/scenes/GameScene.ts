import * as Phaser from "phaser";
import { COLORS, UI } from "../game/constants/common";
import { GameState } from "../game/GameState";
import { isVisible } from "../game/Vision";
import { eAc, eDmg, eEv, hpColor, mpColor } from "../game/combat";
import { drawText, hexToColor } from "../game/draw";
import { allArrowDirection, KeyboardRepeater, verticalDirection } from "../game/Keyboard";

type ViewportCell = { text: string; color: string } | null;

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private graphics!: Phaser.GameObjects.Graphics;
  private menuBackgroundLayers: Phaser.GameObjects.Graphics[] = [];

  private frameTextObjects: Phaser.GameObjects.Text[] = [];
  private frameTextCount = 0;
  private messageTextObjects: Phaser.GameObjects.Text[] = []; // Pre-allocated text objects for messages

  // Keys
  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys; // Arrow keys
  private keyC!: Phaser.Input.Keyboard.Key;
  private keyX!: Phaser.Input.Keyboard.Key;

  // Movement is turn-based, so held keys are sampled at a controlled rate
  // rather than once per render frame.
  private readonly keyboardRepeater = new KeyboardRepeater();
  private previousMode: GameState["mode"] | null = null;

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.BLACK);
    this.gameState = new GameState();
    this.graphics = this.add.graphics();
    this.graphics.setDepth(1);

    // Pre-allocate text objects for message area (retained layer)
    for (let i = 0; i < UI.MESSAGE_LOG_HEIGHT; i++) {
      const textObj = drawText(this, 0, 0, "", COLORS.WHITE);
      textObj.setDepth(3);
      textObj.setVisible(false); // Initially hide the text objects
      this.messageTextObjects.push(textObj);
    }

    // Input handling
    this.cursorKeys = this.input.keyboard!.createCursorKeys();
    this.keyC = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.keyX = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
  }

  shutdown() {
    // Destroy all text objects before scene shutdown
    this.frameTextObjects.forEach((textObj) => textObj.destroy());
    this.frameTextObjects = [];
    this.frameTextCount = 0;
    this.messageTextObjects.forEach((textObj) => textObj.destroy());
    this.messageTextObjects = [];
    this.menuBackgroundLayers.forEach((layer) => layer.destroy());
    this.menuBackgroundLayers = [];
  }

  update(_time: number, delta: number) {
    const dt = delta / 1000; // Convert delta to seconds
    this.gameState.update(dt);

    const mode = this.gameState.mode;
    if (mode !== this.previousMode) {
      this.keyboardRepeater.reset();
      this.previousMode = mode;
    }
    if (mode === "game") {
      this.handleGameInput(delta);
    } else if (mode === "inventory") {
      this.handleMenuInput(delta);
    } else if (mode === "map") {
      this.handleMapInput(delta);
    } else if (mode === "target") {
      this.handleTargetInput(delta);
    } else if (mode === "dead" || mode === "win") {
      if (Phaser.Input.Keyboard.JustDown(this.keyX)) {
        this.scene.start("MenuScene");
        return; // Exit early to avoid rendering after scene change
      }
    }
    this.render();
  }

  private handleGameInput(delta: number) {
    // Movement input: act immediately, then repeat while the key is held.
    // Keep the existing cardinal priority when multiple keys are held.
    const direction = allArrowDirection(this.cursorKeys);
    this.keyboardRepeater.update(delta, this.cursorKeys, (moveDirection) =>
      this.gameState.handleMove(moveDirection),
    );

    // Do not process C/X on the same frame as movement.
    if (direction) return;

    // C = Open menu
    if (Phaser.Input.Keyboard.JustDown(this.keyC)) this.gameState.menuManager.openMenu();
    // X = use wand
    if (Phaser.Input.Keyboard.JustDown(this.keyX)) this.gameState.enterTargetingMode();
  }

  private handleMenuInput(delta: number) {
    this.keyboardRepeater.update(
      delta,
      this.cursorKeys,
      (direction) => {
        if (direction.y < 0) this.gameState.menuManager.menuUp();
        else this.gameState.menuManager.menuDown();
      },
      verticalDirection,
    );
    if (Phaser.Input.Keyboard.JustDown(this.keyC)) this.gameState.menuManager.menuBack();
    if (Phaser.Input.Keyboard.JustDown(this.keyX)) this.gameState.menuManager.menuSelectOption();
  }

  private handleMapInput(delta: number) {
    this.keyboardRepeater.update(delta, this.cursorKeys, (direction) =>
      this.gameState.moveMapCamera(direction),
    );
    if (Phaser.Input.Keyboard.JustDown(this.keyC)) this.gameState.menuManager.closeMenu();
  }

  private handleTargetInput(delta: number) {
    this.keyboardRepeater.update(delta, this.cursorKeys, (direction) =>
      this.gameState.moveTargetCursor(direction),
    );
    if (Phaser.Input.Keyboard.JustDown(this.keyX)) this.gameState.fireWand();
    if (Phaser.Input.Keyboard.JustDown(this.keyC)) this.gameState.exitTargetingMode();
  }

  private render() {
    this.beginFrame();
    this.graphics.clear();
    for (const layer of this.menuBackgroundLayers) {
      layer.clear();
    }

    // PICO-8 show_map() clears the screen and draws map only.
    if (this.gameState.showMap) {
      this.renderMap();
      return;
    }

    // PICO-8 draw_game() layer order:
    // draw_bg + draw_items + draw_ents -> draw_curs -> draw_bottom -> draw_sidebar -> draw_menus
    this.renderGameView();
    if (this.gameState.showCursor) this.renderTargetCursor();
    this.renderMessages();
    this.renderSidebar();
    if (this.gameState.mode === "inventory") this.renderMenus();
  }

  private beginFrame() {
    for (let i = 0; i < this.frameTextCount; i++) {
      this.frameTextObjects[i].setVisible(false);
    }
    this.frameTextCount = 0;
  }

  private drawFrameText(
    x: number,
    y: number,
    text: string,
    color: string,
    depth: number = 2,
  ): Phaser.GameObjects.Text {
    if (this.frameTextCount >= this.frameTextObjects.length) {
      const textObj = drawText(this, x, y, text, color);
      textObj.setDepth(depth);
      this.frameTextObjects.push(textObj);
    }

    const textObj = this.frameTextObjects[this.frameTextCount++];
    textObj.setText(text);
    textObj.setColor(color);
    textObj.setDepth(depth);
    textObj.setPosition(x, y);
    textObj.setVisible(true);
    return textObj;
  }

  private renderGameView() {
    const playerPos = this.gameState.player.position;
    const tiles = this.gameState.tiles;

    // Compositing buffer for the viewport
    const viewportCells: Array<Array<ViewportCell>> = Array.from(
      { length: UI.VIEWPORT_WIDTH },
      () => Array.from({ length: UI.VIEWPORT_HEIGHT }, () => null),
    );

    // Build base layer from tiles (viewport centered around player)
    for (let viewX = 0; viewX < UI.VIEWPORT_WIDTH; viewX++) {
      for (let viewY = 0; viewY < UI.VIEWPORT_HEIGHT; viewY++) {
        const tileX = viewX - Math.floor(UI.VIEWPORT_WIDTH / 2) + playerPos.x;
        const tileY = viewY - Math.floor(UI.VIEWPORT_HEIGHT / 2) + playerPos.y;

        if (tileX < 0 || tileY < 0 || !tiles[tileX] || !tiles[tileX][tileY]) continue;

        const tile = tiles[tileX][tileY];

        if (isVisible(playerPos, { x: tileX, y: tileY }, tiles)) {
          // Currently visible tile - full brightness
          viewportCells[viewX][viewY] = { text: tile.character, color: tile.color };
        } else if (tile.seen) {
          // Explored but not currently visible - dark blue color
          viewportCells[viewX][viewY] = { text: tile.character, color: COLORS.DARK_BLUE };
        }
        // else: not seen, do not draw anything (black background)
      }
    }

    // Overlay visible items on top of tiles
    const items = this.gameState.itemManager.getItems();
    for (const item of items) {
      const itemPos = item.itemData.position;
      if (!isVisible(playerPos, itemPos, tiles)) continue; // Skip items not visible to the player

      const viewX = itemPos.x - playerPos.x + Math.floor(UI.VIEWPORT_WIDTH / 2);
      const viewY = itemPos.y - playerPos.y + Math.floor(UI.VIEWPORT_HEIGHT / 2);

      if (viewX >= 0 && viewX < UI.VIEWPORT_WIDTH && viewY >= 0 && viewY < UI.VIEWPORT_HEIGHT) {
        viewportCells[viewX][viewY] = { text: item.object.tile, color: item.object.color };
      }
    }

    // Overlay visible entities on top of items
    for (const entity of this.gameState.entityManager.getEntities()) {
      if (isVisible(playerPos, entity.position, tiles)) {
        const viewX = entity.position.x - playerPos.x + Math.floor(UI.VIEWPORT_WIDTH / 2);
        const viewY = entity.position.y - playerPos.y + Math.floor(UI.VIEWPORT_HEIGHT / 2);
        if (viewX >= 0 && viewX < UI.VIEWPORT_WIDTH && viewY >= 0 && viewY < UI.VIEWPORT_HEIGHT) {
          viewportCells[viewX][viewY] = { text: entity.tile, color: entity.color };
        }
      }
    }

    // Overlay player on top of everything else
    viewportCells[Math.floor(UI.VIEWPORT_WIDTH / 2)][Math.floor(UI.VIEWPORT_HEIGHT / 2)] = {
      text: this.gameState.player.tile,
      color: this.gameState.player.color,
    };

    // Render final composited viewport to the screen
    for (let viewX = 0; viewX < UI.VIEWPORT_WIDTH; viewX++) {
      for (let viewY = 0; viewY < UI.VIEWPORT_HEIGHT; viewY++) {
        const cell = viewportCells[viewX][viewY];
        if (!cell) continue;

        this.drawFrameText(viewX * UI.CHAR_WIDTH, viewY * UI.CHAR_HEIGHT, cell.text, cell.color);
      }
    }
  }

  private renderSidebar() {
    const player = this.gameState.player;
    const startX = UI.VIEWPORT_WIDTH * UI.CHAR_WIDTH; // Start drawing to the right of the game view
    let currentY = 0;

    // 0th row:　Level and Floor
    this.drawFrameText(
      startX,
      currentY,
      `level ${player.floor}  floor ${this.gameState.depth}`,
      COLORS.WHITE,
    );
    currentY += UI.CHAR_HEIGHT;

    // 1st row: XP + Gold
    this.drawFrameText(startX, currentY, `xp ${player.xp}`, COLORS.LAVENDER);
    this.drawFrameText(startX + 9 * UI.CHAR_WIDTH, currentY, `$$ ${player.gold}`, COLORS.YELLOW);
    currentY += UI.CHAR_HEIGHT;

    // 2nd row: HP + MP
    this.drawFrameText(
      startX,
      currentY,
      `hp ${player.hp.current}/${player.hp.base}`,
      hpColor(player),
    );
    this.drawFrameText(
      startX + 9 * UI.CHAR_WIDTH,
      currentY,
      `mp ${player.mp.current}/${player.mp.base}`,
      mpColor(player),
    );
    currentY += UI.CHAR_HEIGHT;

    // 3rd row: ST / DX / IN
    this.drawFrameText(startX, currentY, `st ${player.st.current}`, COLORS.WHITE);
    this.drawFrameText(
      startX + 6 * UI.CHAR_WIDTH,
      currentY,
      `dx ${player.dx.current}`,
      COLORS.WHITE,
    );
    this.drawFrameText(
      startX + 12 * UI.CHAR_WIDTH,
      currentY,
      `in ${player.int.current}`,
      COLORS.WHITE,
    );
    currentY += UI.CHAR_HEIGHT;

    // 4th row: DM / EV / AC
    this.drawFrameText(startX, currentY, `dm ${eDmg(player)}`, COLORS.WHITE);
    this.drawFrameText(startX + 6 * UI.CHAR_WIDTH, currentY, `ev ${eEv(player)}`, COLORS.WHITE);
    this.drawFrameText(startX + 12 * UI.CHAR_WIDTH, currentY, `ac ${eAc(player)}`, COLORS.WHITE);
    currentY += UI.CHAR_HEIGHT;

    // 5th-6th rows: Weapon / Armor
    const weaponName = player.weapon
      ? player.weapon.object.zap > 0
        ? player.weapon.object.name + " [x]"
        : player.weapon.object.name
      : "bare fists";
    this.drawFrameText(startX, currentY, weaponName, COLORS.LIGHT_GRAY);
    currentY += UI.CHAR_HEIGHT;
    const armorName = player.armor ? player.armor.object.name : "clothes";
    this.drawFrameText(startX, currentY, armorName, COLORS.LIGHT_GRAY);
    currentY += UI.CHAR_HEIGHT;

    // started from 8th row: Visible enemy list
    this.renderVisibleEnemies(startX, currentY + UI.CHAR_HEIGHT);
  }

  private renderVisibleEnemies(startX: number, startY: number) {
    const visibleEnemies = this.gameState.entityManager
      .getEntities()
      .filter((e) => isVisible(this.gameState.player.position, e.position, this.gameState.tiles));

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
      this.drawFrameText(x, y, "*", hpColor(enemy));
      this.drawFrameText(x + UI.CHAR_WIDTH, y, enemy.name, enemy.color);
      row++;
    }
  }

  private renderMessages() {
    const startY = UI.VIEWPORT_HEIGHT * UI.CHAR_HEIGHT; // Start drawing below the game view

    // Wipe all message text objects first
    for (const txt of this.messageTextObjects) {
      txt.setText("");
      txt.setVisible(false);
    }

    const messages = this.gameState.msgLog.getMessages();
    let drawIndex = UI.MESSAGE_LOG_HEIGHT - 1; // Start drawing from the bottom of the message log
    for (let i = messages.length - 1; i >= 0 && drawIndex >= 0; i--) {
      const msg = messages[i];
      for (
        let lineIndex = msg.lines.length - 1;
        lineIndex >= 0 && drawIndex >= 0;
        lineIndex--, drawIndex--
      ) {
        const line = msg.lines[lineIndex];
        const txt = this.messageTextObjects[drawIndex];
        txt.setText(line?.text ?? "");
        txt.setColor(line?.color ?? msg.color ?? COLORS.WHITE);
        txt.setPosition(0, startY + drawIndex * UI.CHAR_HEIGHT);
        txt.setVisible(true);
      }
    }
  }

  private renderMenus() {
    const menus = this.gameState.menuManager.getMenus();
    const blink = this.gameState.getBlinkState();

    for (let menuIndex = 0; menuIndex < menus.length; menuIndex++) {
      const menu = menus[menuIndex];
      const isTop = menu === menus[menus.length - 1];
      const menuBackgroundDepth = 4 + menuIndex * 2;
      const menuTextDepth = 5 + menuIndex * 2;

      if (!this.menuBackgroundLayers[menuIndex]) {
        this.menuBackgroundLayers[menuIndex] = this.add.graphics();
      }
      const menuBackground = this.menuBackgroundLayers[menuIndex];
      menuBackground.setDepth(menuBackgroundDepth);
      menuBackground.clear();

      // Fill interior with black background
      menuBackground.fillStyle(hexToColor(COLORS.BLACK));
      menuBackground.fillRect(
        menu.positionX * UI.CHAR_WIDTH,
        menu.positionY * UI.CHAR_HEIGHT,
        (menu.width + 1) * UI.CHAR_WIDTH,
        (menu.height + 1) * UI.CHAR_HEIGHT,
      );

      // Draw vertical | borders (left & right tile columns)
      for (let ty = menu.positionY + 1; ty <= menu.positionY + menu.height - 1; ty++) {
        this.drawFrameText(
          menu.positionX * UI.CHAR_WIDTH,
          ty * UI.CHAR_HEIGHT,
          "|",
          COLORS.WHITE,
          menuTextDepth,
        );
        this.drawFrameText(
          (menu.positionX + menu.width) * UI.CHAR_WIDTH,
          ty * UI.CHAR_HEIGHT,
          "|",
          COLORS.WHITE,
          menuTextDepth,
        );
      }

      // Draw horizontal - borders (top & bottom tile rows)
      for (let tx = menu.positionX; tx <= menu.positionX + menu.width; tx++) {
        this.drawFrameText(
          tx * UI.CHAR_WIDTH,
          menu.positionY * UI.CHAR_HEIGHT,
          "-",
          COLORS.WHITE,
          menuTextDepth,
        );
        this.drawFrameText(
          tx * UI.CHAR_WIDTH,
          (menu.positionY + menu.height) * UI.CHAR_HEIGHT,
          "-",
          COLORS.WHITE,
          menuTextDepth,
        );
      }

      // Draw title line when present (PICO-8 menu title behavior)
      if (menu.title) {
        this.drawFrameText(
          (menu.positionX + 2) * UI.CHAR_WIDTH,
          (menu.positionY + 1) * UI.CHAR_HEIGHT,
          menu.title,
          COLORS.WHITE,
          menuTextDepth,
        );
      }

      // Draw options
      for (let i = 0; i < menu.options.length; i++) {
        // PICO-8 options start one row below the title line.
        const optionY = menu.positionY + 2 + i;
        const textX = (menu.positionX + 3) * UI.CHAR_WIDTH;
        const textY = optionY * UI.CHAR_HEIGHT;
        const isSelected = isTop && i + 1 === this.gameState.menuManager.getMenuSelect();
        const prefix = isSelected && blink ? ">" : " ";
        this.drawFrameText(textX, textY, prefix + menu.options[i], COLORS.WHITE, menuTextDepth);
      }
    }

    for (let i = menus.length; i < this.menuBackgroundLayers.length; i++) {
      this.menuBackgroundLayers[i].clear();
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
          this.drawFrameText(
            viewX * UI.CHAR_WIDTH,
            viewY * UI.CHAR_HEIGHT,
            tiles[tileX][tileY].character,
            COLORS.DARK_BLUE,
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
      this.drawFrameText(
        playerViewX * UI.CHAR_WIDTH,
        playerViewY * UI.CHAR_HEIGHT,
        this.gameState.player.tile,
        COLORS.WHITE,
      );
  }

  private renderTargetCursor() {
    const blink = this.gameState.getBlinkState();
    if (!blink) return; // Only draw cursor when blinking

    const cursorPosX = this.gameState.cursorPosition.x * UI.CHAR_WIDTH;
    const cursorPosY = this.gameState.cursorPosition.y * UI.CHAR_HEIGHT;

    // Draw laser line from player to cursor
    this.drawLine(
      Math.floor(UI.VIEWPORT_WIDTH / 2),
      Math.floor(UI.VIEWPORT_HEIGHT / 2),
      this.gameState.cursorPosition.x,
      this.gameState.cursorPosition.y,
      COLORS.RED,
    );

    // Highlight the target tile
    const weaponColor = this.gameState.player.weapon?.object.color || COLORS.WHITE;
    this.graphics.fillStyle(hexToColor(weaponColor));
    this.graphics.fillRect(cursorPosX, cursorPosY, UI.CHAR_WIDTH, UI.CHAR_HEIGHT - 2);
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
