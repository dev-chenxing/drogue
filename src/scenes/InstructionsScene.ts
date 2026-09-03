import * as Phaser from "phaser";
import { COLORS, UI } from "../game/constants/common";
import { drawText } from "../game/draw";

export class InstructionsScene extends Phaser.Scene {
  private pageIndex: number = 0;
  private pages: string[][] = [];

  private readonly pageColors = [COLORS.GREEN, COLORS.BLUE, COLORS.LAVENDER, COLORS.PINK];

  private cursorKeys!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyC!: Phaser.Input.Keyboard.Key;
  private keyX!: Phaser.Input.Keyboard.Key;

  constructor() {
    super({ key: "InstructionsScene" });
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.BLACK);
    // reset page index
    this.pageIndex = 0;

    this.pages = [
      [
        "1 intro",
        " drogue is a minimalistic rogue-",
        "like in the style of old-school",
        "text-based displays. it uses a",
        "32x20 grid of characters to rep-",
        "resent all of the walls, floors,",
        "monsters, stairs and treasure in",
        "a nine floor dungeon. on the 9th",
        "floor lies the orb of elad, the",
        "ultimate object of your quest.",
        "only by retrieving the orb on",
        "the final floor can you claim",
        "victory.",
        "",
        "2 stats",
        " there are stats in the game",
        "that define the player charact-",
        "er's abilities. level is a rough",
        'measure of all-around "power" of',
        "a character. at each level hp,",
      ],
      [
        "mp, st, dx and in stats are all",
        "raised. level is raised by xp",
        "increase. xp is obtained by the",
        "killing of monsters. hp measures",
        "health, when it reaches 0 you",
        "die and the game is over. mp",
        "is the ability to cast spells",
        "with wands, when it reaches 0",
        "you cannot cast. st helps melee",
        "damage, dx helps accuracy and",
        "dodging, in helps casting. dm is",
        "max melee damange, ev is ability",
        "to dodge, ac is your capacity to",
        "block damage.",
        "",
        "3 items",
        " the items sprinkled throughout",
        "the dungeon are classified as",
        "armor, weapon, potion and wand.",
        "armors boost ac, weapons boost",
      ],
      [
        "dm, potions restore hp or mp,",
        "and wands allow the casting of",
        "spells. only one weapon and one",
        "armor may be equiped at any",
        "given time. gold can be spent",
        "at any stores which appear, and",
        "unspent gold is worth points",
        "when the dungeon run is scored.",
        "dropped items are gone forever,",
        "so be careful.",
        "",
        "4 monsters",
        " each monster's tile is a letter",
        "of the alphabet. each lower",
        "floor contains bigger, meaner",
        "and more evil inhabitants.  the",
        "monster list on the right shows",
        "each ones current hp color:",
        "green for healthy, yellow for",
        "wounded and red for critical.",
      ],
      [
        "",
        "5 exploration",
        " when you start out, any tiles",
        "you haven't yet seen are invis-",
        "ible. once you have seen a tile",
        "it is added to the game map,",
        "which can be accessed on the",
        "main menu.",
        "",
        "6 controls",
        " on the main screen, the arrows",
        "move, [c] opens the menu, and",
        "[x] aims your wand if you have",
        "one. within menus and targeting",
        "screens [c] cancels and [x]",
        "selects.",
        "",
        "happy crawling!",
      ],
    ];

    this.keyC = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    this.keyX = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.cursorKeys = this.input.keyboard!.createCursorKeys();

    this.keyC.on("down", () => this.nextPage());
    this.keyX.on("down", () => this.nextPage());
    this.cursorKeys.up?.on("down", () => this.nextPage());
    this.cursorKeys.down?.on("down", () => this.nextPage());
    this.cursorKeys.left?.on("down", () => this.nextPage());
    this.cursorKeys.right?.on("down", () => this.nextPage());

    this.renderPage();
  }

  shutdown() {
    // empty the pages array to free memory
    this.pages = [];
  }

  private nextPage() {
    this.pageIndex++;
    if (this.pageIndex >= this.pages.length) {
      this.scene.start("MenuScene");
      return;
    }
    this.renderPage();
  }

  private renderPage() {
    this.children.removeAll();
    const startY = 0; // Start rendering from the top

    // Guard against out-of-bounds pageIndex and ensure lines is defined
    if (this.pageIndex < 0 || this.pageIndex >= this.pages.length) return;
    const lines = this.pages[this.pageIndex];
    if (!lines) return;

    const color = this.pageColors[this.pageIndex % this.pageColors.length];

    lines.forEach((line, index) => {
      drawText(this, 0, startY + index * UI.CHAR_HEIGHT, line, color);
    });
  }
}
