import * as Phaser from "phaser";
import { COLORS, UI } from "./game/constants/common";
import { GameScene } from "./scenes/GameScene";
import { InstructionsScene } from "./scenes/InstructionsScene";
import { MenuScene } from "./scenes/MenuScene";
import { PreloadScene } from "./scenes/PreloadScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: UI.MAP_WIDTH * UI.CHAR_WIDTH, // 32 * 14 = 448
  height: UI.MAP_HEIGHT * UI.CHAR_HEIGHT, // 20 * 20 = 400
  pixelArt: true,
  backgroundColor: COLORS.DARK_GRAY,
  parent: "game-container",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [PreloadScene, MenuScene, GameScene, InstructionsScene],
};

new Phaser.Game(config);
