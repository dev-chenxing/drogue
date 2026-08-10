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
    textObject.setOrigin(0.5);
  }

  return textObject;
}
