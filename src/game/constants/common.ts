import type { Tile } from "../types";

// PICO-8 16-color palette
export const COLORS = {
  BLACK: "#000000",
  DARK_BLUE: "#1D2B53",
  DARK_PURPLE: "#7E2553",
  DARK_GREEN: "#008751",
  BROWN: "#AB5236",
  DARK_GRAY: "#5F574F",
  LIGHT_GRAY: "#C2C3C7",
  WHITE: "#FFF1E8",
  RED: "#FF004D",
  ORANGE: "#FFA300",
  YELLOW: "#FFEC27",
  GREEN: "#00E436",
  BLUE: "#29ADFF",
  LAVENDER: "#83769C",
  PINK: "#FF77A8",
  LIGHT_PEACH: "#FFCCAA",
};

export const TILES: { [key: string]: Tile } = {
  FLOOR: {
    id: "floor",
    character: ".",
    color: COLORS.LIGHT_GRAY,
    walkable: true,
  },
  WALL: {
    id: "wall",
    character: "#",
    color: COLORS.DARK_GRAY,
    walkable: false,
  },
  DOOR: {
    id: "door",
    character: "+",
    color: COLORS.BROWN,
    walkable: false,
  },
  STAIRS: {
    id: "stairs",
    character: ">",
    color: COLORS.LIGHT_GRAY,
    walkable: true,
  },
  ORB: {
    id: "orb",
    character: "0",
    color: COLORS.LIGHT_GRAY,
    walkable: true,
  },
};

// Dungeon generation constants
export const DUNGEON = {
  MAX_DEPTH: 9, // Maximum depth of the dungeon
  MAP_SIZE: 64, // Size of the dungeon map (64x64)
  ROOM_MIN_SIZE: 4, // Minimum size of a room
  ROOM_MAX_SIZE: 8, // Maximum size of a room
  INITIAL_ROOM_SIZE: 6, // Size of the initial room
  INITIAL_ROOM_POSITION: { x: 29, y: 29 }, // Position of the initial room
  MAX_ROOMS: 32, // Maximum number of rooms in the dungeon
  ITEM_RATE: 67, // Percentage chance of an item appearing in a room
  ENEMY_RATE: 42, // Percentage chance of an enemy appearing in a room
  GOLD_RATE: 42, // Percentage chance of gold appearing in a room
  VIEW_DISTANCE: 7, // Maximum distance the player can see in the dungeon
};

export const DIRECTIONS = [
  { x: -1, y: 0 }, // west
  { x: 1, y: 0 }, // east
  { x: 0, y: -1 }, // north
  { x: 0, y: 1 }, // south
];
