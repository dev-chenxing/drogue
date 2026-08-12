import * as Phaser from "phaser";
import { COLORS, UI } from "../game/constants/common";
import { drawText } from "../game/draw";
import { GameState } from "../game/GameState";

export class HighScoresScene extends Phaser.Scene {
  constructor() {
    super({ key: "HighScoresScene" });
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.BLACK);

    const gameState = new GameState();
    const highScores = gameState.saveManager.getHighScores();
    const titleText = "HIGH SCORES";
    const cx = this.scale.width / 2;
    let y = UI.CHAR_HEIGHT * 4;

    drawText(this, cx, y, titleText, COLORS.YELLOW, true);
    y += UI.CHAR_HEIGHT * 3;

    // Header
    drawText(this, cx - UI.CHAR_WIDTH * 15, y, "RANK", COLORS.YELLOW, true);
    drawText(this, cx - UI.CHAR_WIDTH * 5, y, "NAME", COLORS.YELLOW, true);
    drawText(this, cx + UI.CHAR_WIDTH * 8, y, "SCORE", COLORS.YELLOW, true);
    drawText(this, cx + UI.CHAR_WIDTH * 18, y, "DEPTH", COLORS.YELLOW, true);

    y += UI.CHAR_HEIGHT * 2;

    // Scores
    highScores.forEach((score, index) => {
      const rank = (index + 1).toString();
      const rankColor =
        index === 0
          ? COLORS.YELLOW
          : index === 1
            ? COLORS.LIGHT_GRAY
            : index === 2
              ? COLORS.ORANGE
              : COLORS.WHITE;
      drawText(this, cx - UI.CHAR_WIDTH * 15, y, rank, rankColor, true);
      drawText(this, cx - UI.CHAR_WIDTH * 5, y, score.name, rankColor, true);
      drawText(this, cx + UI.CHAR_WIDTH * 8, y, score.score.toString(), rankColor, true);
      drawText(this, cx + UI.CHAR_WIDTH * 18, y, score.depth.toString(), rankColor, true);
      y += UI.CHAR_HEIGHT * 2;
    });

    drawText(
      this,
      cx,
      this.scale.height - UI.CHAR_HEIGHT * 2,
      "Press ENTER or SPACE to return",
      COLORS.WHITE,
      true,
    );

    this.input.keyboard!.on("keydown-ENTER", () => this.scene.start("MenuScene"));
    this.input.keyboard!.on("keydown-SPACE", () => this.scene.start("MenuScene"));
    this.input.keyboard!.on("keydown-ESC", () => this.scene.start("MenuScene"));
  }
}
