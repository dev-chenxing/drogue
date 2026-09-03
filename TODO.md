# DROGUE - TODO

## Bug fixes

- [x] fix: player cannot move through opened doors.
- [x] fix(menuscene): `selectedOption` has no bounds checking. `moveUp` and `moveDown` logic hardcode the number of options, which is bad practice. We should have a `getOptions()` method that returns the current options, and then use that to determine the bounds of `selectedOption`.
- [x] style(preload): use chars instead of fillRect for the progress bar
- [x] feat: item discovery message when an item enters the player's vision
- [x] fix: multiple enemies triggering multiple death messages when the player dies in combat
- [x] fix: remove WASD controls and implement PICO-8 controls (arrows, x = select, c = menu/back)
- [ ] fix: implement movement key holding down, so that the player can hold down a movement key to move continuously, instead of having to press the key repeatedly.
- [ ] fix: wand target mode is not working correctly, player moves while targeting, and the target cursor also moves with the player
- [ ] docs: rewrite in-game manual
- [ ] fix: drop item from inventory leaves the item on the ground, but the original game simply removes it

## Actual features

- [ ] feat: deploy to web (itch.io, github pages, etc.)
- [ ] feat: mobile support (touch controls, mobile-friendly UI)

## Unnecessary refactors

- [ ] refactor(dungeon): instead of `getRandomItem`, add `LeveledItem`/`LeveledEntity` types
- [ ] refactor(types): not sure if `export type GameMode = "menu" | "game" | "inventory" | "map" | "target" | "dead" | "win";` is the best structure. `menu` and `game` are the only two modes that are mutually exclusive, `inventory` and `map` are both some kind of `menu`. I think here `menu` probably should be `mainMenu`. And `inventory` and `map` should not be considered `GameMode` but rather related to `Menu` and/or `UIElement`
- [ ] refactor(types): I don't think `stairsPos` and `orbPos` should be a direct access of `DungeonLevel`, because `DungeonLevel` already has a `tiles` property, and `stairsPos` and `orbPos` are just a specific type of tile. I think it would be better to have a method like `getTile(id: string): Tile | null` or something similar.
- [ ] fix(dungeon): `const stairsPos = this.placeStairsOrOrb()` is so awkward. We should probably have a `placeStairs()` and `placeOrb()` method, and then call them separately. Also, `placeItems()` and `placeEntities()` return `items`/`entities` while `placeStairsOrOrb()` returns a `Vector2`. This is inconsistent and confusing. I think `placeStairs()` and `placeOrb()` should return the `Tile` that was placed, and then we can get the position from that tile.
- [x] refactor(vision): refactor `VisionSystem` to a flat `vision.ts` module instead of a class
- [ ] refactor(gamestate): i think cramping all the menu-related states like `menuSelect`/`showMap` into `GameState` is bad practice. I think we should have a `UI` class that handles the menu states. Also the naming of `menuSelect` is confusing, because it is not clear what it is selecting.
- [x] refactor(gamestate): refactor hardcoded tile characters in `GameState.ts` to a type-based system
- [ ] fix(items): where the item shows up should not be based on a `floors` property in the item data, but rather implement a `LeveledItem` type that has a `level` property, and then filter the items based on the current level. This will allow us to have more control over which items show up on which levels, and also allow us to have more complex item placement logic in the future.
- [ ] refactor(gamestate): hardcoded item id checks in `useItem` should be replaced with an `effects` property in the item data, which will allow us to have more complex item effects in the future. For example, instead of checking for `health potion` or `magic potion`, we can check for `item.effects.restoreHp` or `item.effects.restoreMp`, which will allow us to have more complex item effects in the future.
- [ ] refactor(menuscene): state, input, and rendering logic are all mixed in a `Scene` class. Reusability would be improved if we separated them. Menu options (`const options = ["start game", "instructions"]`) shouldn't be hardcoded in the rendering logic.
