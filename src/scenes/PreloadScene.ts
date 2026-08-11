import * as Phaser from "phaser";
import { COLORS, UI } from "../game/constants/common";
import { drawCenteredText, drawTitle } from "../game/draw";

export class PreloadScene extends Phaser.Scene {
  private loadingText: Phaser.GameObjects.Text | null = null;
  private barText: Phaser.GameObjects.Text | null = null;
  private readonly progressBarChars = 26;

  constructor() {
    super({ key: "PreloadScene" });
  }

  preload() {
    this.cameras.main.setBackgroundColor(COLORS.BLACK);
    const { y } = drawTitle(this);
    this.loadingText = drawCenteredText(this, y, "Loading...", COLORS.LIGHT_GRAY);

    // Progress bar centered
    const progressBarRow = y + 2;
    this.barText = drawCenteredText(
      this,
      progressBarRow * UI.CHAR_HEIGHT,
      "[" + " ".repeat(this.progressBarChars) + "]",
      COLORS.LIGHT_GRAY,
    );

    // Update the progress bar as assets are loaded
    this.load.on("progress", (value: number) => {
      const filledChars = Math.floor(value * this.progressBarChars);
      const emptyChars = this.progressBarChars - filledChars;
      // Left bracket + filled characters + empty characters + right bracket
      const progressBar = "[" + "=".repeat(filledChars) + " ".repeat(emptyChars) + "]";
      this.barText?.setText(progressBar);
    });

    this.load.on("complete", () => {
      this.loadingText?.setText("  READY!  ");
      this.barText?.setText("[" + "=".repeat(this.progressBarChars) + "]");
      this.barText?.setColor(COLORS.GREEN);
    });

    // Load assets

    // Load pixel font
    this.load.font(UI.FONT_FAMILY, "/fonts/FT88-Gothique.woff2", "woff2");

    // Load audio effects
    // this.load.audio("sfx_start", "assets/audio/sfx_start.wav");
    // this.load.audio("sfx_select", "assets/audio/sfx_select.wav");
    // this.load.audio("sfx_step", "assets/audio/sfx_step.wav");
    // this.load.audio("sfx_hit", "assets/audio/sfx_hit.wav");
    // this.load.audio("sfx_die", "assets/audio/sfx_die.wav");
    // this.load.audio("sfx_win", "assets/audio/sfx_win.wav");
    // this.load.audio("sfx_pickup", "assets/audio/sfx_pickup.wav");
    // this.load.audio("music_title", "assets/audio/music/title.mp3");
  }

  create() {
    // Loading is complete, delay for a moment before starting the MenuScene,
    // to allow the player to see the "READY!" message
    this.time.delayedCall(300, () => {
      this.scene.start("MenuScene");
    });
  }
}
