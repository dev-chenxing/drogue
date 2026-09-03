import * as Phaser from "phaser";
import { COLORS, UI } from "../game/constants/common";
import { drawText, drawTitle } from "../game/draw";

// Define menu options
type MenuOption = {
  label: string;
  scene: string;
};

export class MenuScene extends Phaser.Scene {
  private selectedOption: number = 1;
  private blinkTimer: number = 0;

  constructor() {
    super({ key: "MenuScene" });
  }

  create() {
    // Reset selected option and blink timer
    this.selectedOption = 1;
    this.blinkTimer = 0;

    this.cameras.main.setBackgroundColor(COLORS.BLACK);

    // Keyboard input
    this.input.keyboard!.on("keydown-UP", () => this.moveSelect(-1));
    this.input.keyboard!.on("keydown-DOWN", () => this.moveSelect(1));
    this.input.keyboard!.on("keydown-X", () => this.confirmSelection());

    // Display title and options
    this.render();
  }

  update(_time: number, delta: number) {
    const prevBlink = Math.floor(this.blinkTimer / 300);
    this.blinkTimer += delta;
    const currentBlink = Math.floor(this.blinkTimer / 300);

    // Only re-render if the blink state has changed, to reduce unnecessary redraws
    if (currentBlink !== prevBlink) {
      this.render();
    }
  }

  // Return list of menu options
  private getOptions(): MenuOption[] {
    return [
      { label: "start game  ", scene: "GameScene" },
      { label: "instructions", scene: "InstructionsScene" },
    ];
  }

  private moveSelect(direction: number) {
    this.selectedOption += direction;
    // Wrap around if out of bounds
    if (this.selectedOption < 1) this.selectedOption = this.getOptions().length;
    if (this.selectedOption > this.getOptions().length) this.selectedOption = 1;
    this.render();
  }

  private confirmSelection() {
    const options = this.getOptions();
    const selected = options[this.selectedOption - 1];
    if (selected) {
      this.scene.start(selected.scene);
    }
  }

  private render() {
    this.children.removeAll();

    const centerX = this.scale.width / 2;
    let { y } = drawTitle(this);

    // Menu options
    const blink = Math.floor(this.blinkTimer / 300) % 2 === 0; // Blink every 300ms
    const options = this.getOptions();
    for (let i = 0; i < options.length; i++) {
      const optionIndex = i + 1;
      const isSelected = this.selectedOption === optionIndex;
      const prefix = isSelected && blink ? ">" : " ";
      drawText(this, centerX, y, prefix + options[i].label, COLORS.WHITE, true);
      y += 2 * UI.CHAR_HEIGHT;
    }
    y += UI.CHAR_HEIGHT * 3;

    // Copyright notice
    drawText(this, centerX, y, "copyleft 2019 dale w. morris", COLORS.LAVENDER, true);
    y += UI.CHAR_HEIGHT;

    drawText(this, centerX, y, "dalesworld.ga", COLORS.PINK, true);
  }
}
