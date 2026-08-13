export interface Vector2 {
  x: number;
  y: number;
}

export interface Tile {
  id: string;
  character: string;
  color: string;
  backgroundColor?: string;
  walkable: boolean;
  seen?: boolean; // Indicates if the tile has been seen/explored by the player
}

export interface Statistic {
  base: number; // Base value of the statistic
  baseRaw: number; // Base value of the statistic, as stored in memory
  current: number; // Current value of the statistic
  currentRaw: number; // Current value of the statistic, as stored in memory. When a certain statistic would reach negative value, its `current` value will be 0 while `currentRaw` will be the actual negative value.
  normalized: number; // Normalized value of the statistic, typically between 0 and 1
}

export interface Stats {
  hp: Statistic;
  mp: Statistic;
  xp: number;
  st: Statistic; // strength
  dx: Statistic; // dexterity
  int: Statistic; // intelligence
  ev: number; // evasion
  ac: number; // armor class
}

export interface EntityData {
  name: string;
  tile: string;
  color: string;
  gold: number;
  qty: number; // the number of entities to spawn in the dungeon level
  hp: number;
  mp: number;
  xp: number;
  st: number; // strength
  dx: number; // dexterity
  int: number; // intelligence
  ev: number; // evasion
  ac: number; // armor class
}

export interface Entity extends Stats {
  name: string;
  tile: string;
  color: string;
  gold: number;
  qty: number; // the number of entities to spawn in the dungeon level
}

export interface Mobile extends Entity {
  id: string;
  position: Vector2;
  floor: number; // The floor the entity is currently on
  seen: boolean;
  weapon: ItemStack<Weapon> | null;
  armor: ItemStack<Armor> | null;
  items: ItemStack<Item>[]; // The items the entity is carrying
}

export interface ItemStack<T extends Item = Item> {
  itemData: ItemData;
  object: T;
}

export interface ItemData {
  count: number; // Number of items in the stack
  position: Vector2;
  seen: boolean;
}

export type ItemType = "gold" | "weapon" | "armor" | "potion";

// The static shape of an item definition in ITEM_DATA
export interface ItemTemplate {
  name: string;
  tile: string;
  color: string;
  type: ItemType;
  dmg: number;
  ac: number;
  ev: number;
  zap: number;
  floors: [number, number];
}

export interface Item {
  id: string;
  name: string;
  tile: string;
  color: string;
  type: ItemType;
  floors: [number, number]; // The floors on which the item stack can be found
  damage?: number; // Damage dealt (weapons)
  zap?: number; // mp cost (weapons)
  ac?: number; // Armor class provided (armor)
  ev?: number; // Evasion provided (armor)
}

export interface Weapon extends Item {
  type: "weapon";
  damage: number; // Damage dealt by the weapon
  zap: number; // mp cost
}

export interface Armor extends Item {
  type: "armor";
  ac: number; // Armor class provided by the armor
  ev: number; // Evasion provided by the armor
}

export interface Message {
  lines: string[];
  color: string;
}

export interface UIElement {
  positionX: number;
  positionY: number;
  width: number;
  height: number;
}

export interface MenuState extends UIElement {
  title: string;
  options: string[];
  action: number;
}

export type GameMode = "menu" | "game" | "inventory" | "map" | "target" | "dead" | "win";

export interface DungeonLevel {
  width: number;
  height: number;
  tiles: Tile[][];
  depth: number; // The depth of the dungeon level, starting from 1 for the first level
  stairsPos: Vector2; // The position of the stairs leading to the next level
  orbPos: Vector2 | null; // The position of the orb, if present on this level
}
