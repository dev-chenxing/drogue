import * as Phaser from "phaser";
import { COLORS, UI } from "./constants/common";

export function drawText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: string = COLORS.WHITE,
  centeredOrigin: boolean = false,
): Phaser.GameObjects.Text {
  const textObject = scene.add.text(x, y, text, {
    fontFamily: UI.FONT_FAMILY,
    fontSize: UI.FONT_SIZE,
    color,
  });

  if (centeredOrigin) {
    textObject.setOrigin(0.5, 0);
  } else {
    textObject.setOrigin(0, 0);
  }

  return textObject;
}

export function drawCenteredText(
  scene: Phaser.Scene,
  y: number,
  text: string,
  color: string = COLORS.WHITE,
): Phaser.GameObjects.Text {
  const x = scene.scale.width / 2;
  return drawText(scene, x, y, text, color, true);
}

export function drawTitle(scene: Phaser.Scene): { y: number } {
  let row = 1;

  // Separator line
  drawText(scene, 0, row * UI.CHAR_HEIGHT, "################################", COLORS.DARK_BLUE);
  row += 1;

  // Title (ASCII art style)
  drawText(
    scene,
    UI.CHAR_WIDTH * 4,
    row * UI.CHAR_HEIGHT,
    "___ ___  __  __     ____",
    COLORS.GREEN,
  );
  row += 1;
  drawText(
    scene,
    UI.CHAR_WIDTH * 4,
    row * UI.CHAR_HEIGHT,
    "|  \\|__)/  \\/ _`|  ||__ ",
    COLORS.GREEN,
  );
  row += 1;
  drawText(
    scene,
    UI.CHAR_WIDTH * 4,
    row * UI.CHAR_HEIGHT,
    "|__/|  \\\\__/\\__>\\__/|___",
    COLORS.GREEN,
  );
  row += 2;

  // Subtitle
  drawText(scene, UI.CHAR_WIDTH * 4, row * UI.CHAR_HEIGHT, "old school dungeon crawl", COLORS.BLUE);
  row += 2;

  // Separator line
  drawText(scene, 0, row * UI.CHAR_HEIGHT, "################################", COLORS.DARK_BLUE);
  row += 2;
  return { y: row * UI.CHAR_HEIGHT };
}

export function hexToColor(hex: string): number {
  return Phaser.Display.Color.HexStringToColor(hex).color;
}
