import { COLORS } from "./constants/common";
import { modStatisticCurrent } from "./Stat";
import type { Mobile } from "./types";

export interface AttackResult {
  hit: boolean;
  damage: number;
  attacker: Mobile; // The mobile making the attack
  target: Mobile; // The mobile being attacked
  killingBlow: boolean; // If true, the target was killed by this attack
  messages: string[];
}

// Effective dexterity (to-hit)
export function eDx(e: Mobile): number {
  return e.dx.current;
}

// Effective evasion
export function eEv(e: Mobile): number {
  if (e.id === "player") {
    if (e.armor) {
      return Math.max(Math.floor(e.dx.current / 3 + e.armor.object.ev), 1);
    }
    return Math.max(Math.floor(e.dx.current / 3), 1);
  } else return e.ev; // Enemies just return raw ev field
}

// Effective damage
export function eDmg(e: Mobile): number {
  if (e.weapon) {
    return Math.floor(e.st.current / 3 + e.weapon.object.damage);
  }
  return Math.floor(e.st.current / 3);
}

// Effective armor class
export function eAc(e: Mobile): number {
  if (e.armor) {
    return e.armor.object.ac + e.ac;
  }
  return e.ac;
}

export function meleeAttack(attacker: Mobile, target: Mobile): AttackResult {
  const toHit = eDx(attacker) - eEv(target);
  const maxDmg = eDmg(attacker);
  const roll = Math.floor(Math.random() * eDx(attacker) + 1);

  let damage = Math.floor(Math.random() * maxDmg) + 1;
  damage -= eAc(target);

  const hit = roll < toHit && damage >= 1;

  if (hit) modStatisticCurrent(target.hp, -damage);

  const killingBlow = hit && target.hp.current <= 0;
  const messages: string[] = [];

  if (hit) {
    if (attacker.id === "player") {
      messages.push(`hit the ${target.name} for ${damage} damage.`);
    } else {
      messages.push(`the ${attacker.name} hits for ${damage} damage.`);
    }
  } else {
    if (attacker.id === "player") {
      messages.push(`missed the ${target.name}.`);
    } else {
      messages.push(`the ${attacker.name} misses.`);
    }
  }

  if (killingBlow) {
    messages.push(`the ${target.name} is slain!`);
  }

  return {
    hit,
    damage,
    attacker,
    target,
    killingBlow,
    messages,
  };
}

// Wand/zap attack (magic damage based on the attacker's intelligence)
export function magicAttack(attacker: Mobile, target: Mobile): AttackResult {
  const damage = Math.floor(Math.random() * (attacker.int.current / 3)) + 1;
  modStatisticCurrent(target.hp, -damage);
  const killingBlow = target.hp.current <= 0;

  const messages = [`zapped the ${target.name} for ${damage} damage`];
  if (killingBlow) {
    messages.push(`the ${target.name} is slain`);
  }

  return {
    hit: true,
    damage,
    attacker,
    target,
    killingBlow,
    messages,
  };
}

// HP color (green, yellow, red) based on the current HP percentage
export function hpColor(e: Mobile): string {
  const ratio = e.hp.normalized;
  if (ratio >= 0.67) return COLORS.GREEN;
  if (ratio >= 0.34) return COLORS.YELLOW;
  return COLORS.RED;
}

// MP color (blue, lavender, pink) based on the current MP percentage
export function mpColor(e: Mobile): string {
  const ratio = e.mp.normalized;
  if (ratio >= 0.67) return COLORS.BLUE;
  if (ratio >= 0.34) return COLORS.LAVENDER;
  return COLORS.PINK;
}
