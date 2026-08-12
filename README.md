# DROGUE

Rewrite of the original PICO-8 game [DROGUE](https://www.lexaloffle.com/bbs/?tid=36491) by [Dale W. Morris](https://www.lexaloffle.com/bbs/?uid=40137) in TypeScript + Phaser 4.

## Project Structure

```
src/
    game/                   # Game logic
        constants/          # Game constants
            common.ts       # Common constants, colors, and UI layout
            entities.ts     # Entity data
            items.ts        # Item data
        AISystem.ts         # AI system
        combat.ts           # Combat system
        draw.ts             # Drawing utilities
        Dungeon.ts          # Dungeon generation
        Entity.ts           # Entity factory
        GameState.ts        # Main game state
        Item.ts             # Item factory
        types.ts            # Type definitions
        Vision.ts           # Vision system
    scenes/                 # Phaser scenes
        GameScene.ts        # Main game scene
        HighScoresScene.ts  # High scores scene
        InstructionsScene.ts# Instructions scene
        MenuScene.ts        # Main menu scene
        PreloadScene.ts     # Preload scene
    main.ts                 # Entry point
```
