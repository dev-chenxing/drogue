import { COLORS } from "./common";

// Item definitions
export const ITEM_DATA = [
  // 0: gold
  {
    name: "gold",
    tile: "$",
    color: COLORS.YELLOW,
    dmg: 0,
    ac: 0,
    ev: 0,
    zap: 0,
    floors: [1, 10] as [number, number],
  },
  // 1: wooden club
  {
    name: "wooden club",
    tile: ")",
    color: COLORS.BROWN,
    dmg: 1,
    ac: 0,
    ev: 0,
    zap: 0,
    floors: [1, 5] as [number, number],
  },
  // 2: bronze knife
  {
    name: "bronze knife",
    tile: ")",
    color: COLORS.ORANGE,
    dmg: 2,
    ac: 0,
    ev: 0,
    zap: 0,
    floors: [2, 6] as [number, number],
  },
  // 3: iron knife
  {
    name: "iron knife",
    tile: ")",
    color: COLORS.LIGHT_GRAY,
    dmg: 3,
    ac: 0,
    ev: 0,
    zap: 0,
    floors: [3, 7] as [number, number],
  },
  // 4: bronze sword
  {
    name: "bronze sword",
    tile: ")",
    color: COLORS.ORANGE,
    dmg: 4,
    ac: 0,
    ev: 0,
    zap: 0,
    floors: [4, 8] as [number, number],
  },
  // 5: iron sword
  {
    name: "iron sword",
    tile: ")",
    color: COLORS.LIGHT_GRAY,
    dmg: 5,
    ac: 0,
    ev: 0,
    zap: 0,
    floors: [5, 9] as [number, number],
  },
  // 6: leather armor
  {
    name: "leather armor",
    tile: "[",
    color: COLORS.BROWN,
    dmg: 0,
    ac: 1,
    ev: -1,
    zap: 0,
    floors: [1, 5] as [number, number],
  },
  // 7: bronze mail
  {
    name: "bronze mail",
    tile: "[",
    color: COLORS.ORANGE,
    dmg: 0,
    ac: 2,
    ev: -2,
    zap: 0,
    floors: [2, 6] as [number, number],
  },
  // 8: iron mail
  {
    name: "iron mail",
    tile: "[",
    color: COLORS.LIGHT_GRAY,
    dmg: 0,
    ac: 3,
    ev: -2,
    zap: 0,
    floors: [3, 7] as [number, number],
  },
  // 9: bronze plate
  {
    name: "bronze plate",
    tile: "[",
    color: COLORS.ORANGE,
    dmg: 0,
    ac: 4,
    ev: -3,
    zap: 0,
    floors: [4, 8] as [number, number],
  },
  // 10: iron plate
  {
    name: "iron plate",
    tile: "[",
    color: COLORS.LIGHT_GRAY,
    dmg: 0,
    ac: 5,
    ev: -3,
    zap: 0,
    floors: [5, 9] as [number, number],
  },
  // 11: health potion
  {
    name: "health potion",
    tile: "!",
    color: COLORS.RED,
    dmg: 0,
    ac: 0,
    ev: 0,
    zap: 0,
    floors: [1, 9] as [number, number],
  },
  // 12: magic potion
  {
    name: "magic potion",
    tile: "!",
    color: COLORS.BLUE,
    dmg: 0,
    ac: 0,
    ev: 0,
    zap: 0,
    floors: [2, 9] as [number, number],
  },
  // 13: fire wand
  {
    name: "fire wand",
    tile: "/",
    color: COLORS.RED,
    dmg: 1,
    ac: 0,
    ev: 0,
    zap: 1,
    floors: [2, 8] as [number, number],
  },
];
