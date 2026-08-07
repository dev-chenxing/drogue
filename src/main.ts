import "phaser";
import { COLORS } from "./game/constants/common";
// import { GameScene } from "./scenes/GameScene";
// import { HighScoresScene } from "./scenes/HighScoresScene";
// import { InstructionsScene } from "./scenes/InstructionsScene";
// import { MenuScene } from "./scenes/MenuScene";
// import { PreloadScene } from "./scenes/PreloadScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 512,
  height: 384,
  pixelArt: true,
  backgroundColor: COLORS.BLACK,
  parent: "game-container",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // scene: [PreloadScene, MenuScene, GameScene, InstructionsScene, HighScoresScene],
};

new Phaser.Game(config);
