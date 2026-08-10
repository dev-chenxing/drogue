import * as Phaser from "phaser";
import { COLORS, UI } from "../game/constants/common";
import { drawText } from "../game/drawText";
// import { GameState } from "../game/GameState";

export class HighScoresScene extends Phaser.Scene {
  constructor() {
    super({ key: "HighScoresScene" });
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.BLACK);

    // const gameState = new GameState();
    // const highScores = gameState.getHighScores();
    const titleText = "HIGH SCORES";
    const cx = this.scale.width / 2;
    let y = UI.LINE_HEIGHT * 4;

    drawText(this, cx, y, titleText, COLORS.YELLOW, true);
    y += UI.LINE_HEIGHT * 3;

    // Header
    drawText(this, cx, y, "RANK", COLORS.YELLOW, true);
  }
}
