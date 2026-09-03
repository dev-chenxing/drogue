import * as Phaser from "phaser";
import type { Vector2 } from "./types";

type CursorKeys = Phaser.Types.Input.Keyboard.CursorKeys;
type DirectionSelector = (keys: CursorKeys) => Vector2 | undefined;

export const allArrowDirection: DirectionSelector = (keys) => {
  if (keys.left.isDown) return { x: -1, y: 0 };
  if (keys.right.isDown) return { x: 1, y: 0 };
  if (keys.up.isDown) return { x: 0, y: -1 };
  if (keys.down.isDown) return { x: 0, y: 1 };
  return undefined;
};

export const verticalDirection: DirectionSelector = (keys) => {
  if (keys.up.isDown) return { x: 0, y: -1 };
  if (keys.down.isDown) return { x: 0, y: 1 };
  return undefined;
};

export class KeyboardRepeater {
  private timer = 0;
  private readonly initialDelay: number;
  private readonly repeatInterval: number;

  constructor(initialDelay = 400, repeatInterval = 200) {
    this.initialDelay = initialDelay;
    this.repeatInterval = repeatInterval;
  }

  public update(
    delta: number,
    keys: CursorKeys,
    action: (direction: Vector2) => void,
    selectDirection: DirectionSelector = allArrowDirection,
  ) {
    const direction = selectDirection(keys);
    if (!direction) {
      this.timer = 0;
      return;
    }

    const justPressed = [keys.left, keys.right, keys.up, keys.down].some((key) =>
      Phaser.Input.Keyboard.JustDown(key),
    );

    if (justPressed) {
      action(direction);
      this.timer = this.initialDelay;
      return;
    }

    this.timer -= delta;
    if (this.timer <= 0) {
      action(direction);
      this.timer += this.repeatInterval;
    }
  }

  public reset() {
    this.timer = 0;
  }
}
