import * as Phaser from "phaser";
import { COLORS, UI } from "../game/constants/common";

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
    this.cameras.main.setBackgroundColor(COLORS.BLACK);

    // Keyboard input
    this.input.keyboard!.on("keydown-UP", () => this.moveUp());
    this.input.keyboard!.on("keydown-DOWN", () => this.moveDown());
    this.input.keyboard!.on("keydown-ENTER", () => this.selectOption());
    this.input.keyboard!.on("keydown-SPACE", () => this.selectOption());

    // Display title and options
    this.drawMenu();
  }

  update(_time: number, delta: number) {
    this.blinkTimer += delta;
    this.drawMenu(); // Redraw menu to update blinking cursor
  }

  // Return list of menu options
  private getOptions(): MenuOption[] {
    return [
      { label: "start game", scene: "GameScene" },
      { label: "instructions", scene: "InstructionsScene" },
    ];
  }

  private moveUp() {
    this.selectedOption -= 1;
    if (this.selectedOption < 1) {
      this.selectedOption = this.getOptions().length;
    }
    this.drawMenu();
  }

  private moveDown() {
    this.selectedOption += 1;
    if (this.selectedOption > this.getOptions().length) {
      this.selectedOption = 1;
    }
    this.drawMenu();
  }

  private selectOption() {
    const options = this.getOptions();
    const selected = options[this.selectedOption - 1];
    if (selected) {
      this.scene.start(selected.scene);
    }
  }

  private drawText(
    x: number,
    y: number,
    text: string,
    color: string = COLORS.LIGHT_GRAY,
  ): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        fontFamily: UI.FONT_FAMILY,
        fontSize: UI.FONT_SIZE,
        color: color,
      })
      .setOrigin(0.5);
  }

  private drawMenu() {
    this.children.removeAll();

    const centerX = this.scale.width / 2;
    let y = UI.LINE_HEIGHT * 2; // Start a bit down from the top

    // Separator line
    this.drawText(centerX, y, "################################");
    y += UI.LINE_HEIGHT;

    // Title (ASCII art style)
    this.drawText(centerX, y, "___ ___  __  __     ____");
    y += UI.LINE_HEIGHT;
    this.drawText(centerX, y, "|  \\|__)/  \\/ _`|  ||__ ");
    y += UI.LINE_HEIGHT;
    this.drawText(centerX, y, "|__/|  \\\\__/\\__>\\__/|___");
    y += UI.LINE_HEIGHT * 2;

    // Subtitle
    this.drawText(centerX, y, "old school dungeon crawl");
    y += UI.LINE_HEIGHT * 2;

    // Separator line
    this.drawText(centerX, y, "################################");
    y += UI.LINE_HEIGHT * 2;

    // Menu options
    const blink = Math.floor(this.blinkTimer / 300) % 2 === 0; // Blink every 300ms
    const options = this.getOptions();
    for (let i = 0; i < options.length; i++) {
      const optionIndex = i + 1;
      const isSelected = this.selectedOption === optionIndex;
      const prefix = isSelected && blink ? "> " : "  ";
      this.drawText(
        centerX,
        y,
        prefix + options[i].label,
        isSelected ? COLORS.YELLOW : COLORS.LIGHT_GRAY,
      );
      y += UI.LINE_HEIGHT * 2;
    }
    y += UI.LINE_HEIGHT;

    // Copyright notice
    this.drawText(centerX, y, "copyleft 2019 dale w. morris");
    y += UI.LINE_HEIGHT;

    this.drawText(centerX, y, "dalesworld.ga");
  }
}
