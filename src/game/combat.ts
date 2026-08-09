import { COLORS } from "./constants/common";
import type { Mobile } from "./types";

export interface AttackResult {
  hit: boolean;
  damage: number;
  attacker: Mobile; // The mobile making the attack
  target: Mobile; // The mobile being attacked
  killingBlow: boolean; // If true, the target was killed by this attack
  message: string;
}

// Effective dexterity (to-hit)
export function eDx(e: Mobile): number {
  return e.dx.current;
}

// Effective evasion
export function eEv(e: Mobile): number {
  if (e.armor) {
    return Math.max(Math.floor(e.dx.current / 3 + e.armor.object.ev), 1);
  }
  return Math.max(Math.floor(e.dx.current / 3), 1);
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
  const roll = Math.floor(Math.random() * eDx(attacker)) + 1;

  let damage = Math.floor(Math.random() * maxDmg) + 1;
  damage -= eAc(target);

  const hit = roll < toHit && damage >= 1;

  if (hit) {
    target.hp.currentRaw -= damage;
    target.hp.current = Math.max(target.hp.currentRaw, 0);
  }

  const killingBlow = target.hp.current <= 0;

  let message = "";
  if (hit) {
    if (attacker.id === "player") {
      message = `hit the ${target.name} for ${damage} damage.`;
    } else {
      message = `the ${attacker.name} hits for ${damage} damage.`;
    }
  } else {
    if (attacker.id === "player") {
      message = `missed the ${target.name}.`;
    } else {
      message = `the ${attacker.name} misses.`;
    }
  }

  if (killingBlow) {
    message += ` - the ${target.name} is slain!`;
  }

  return {
    hit,
    damage,
    attacker,
    target,
    killingBlow,
    message,
  };
}

// Wand/zap attack (magic damage based on the attacker's intelligence)
export function magicAttack(attacker: Mobile, target: Mobile): AttackResult {
  const damage = Math.floor(Math.random() * (attacker.int.current / 3)) + 1;
  target.hp.currentRaw -= damage;
  target.hp.current = Math.max(target.hp.currentRaw, 0);
  const killingBlow = target.hp.current <= 0;

  const message =
    `zapped the ${target.name} for ${damage} damage` +
    (killingBlow ? ` - the ${target.name} is slain!` : "");

  return {
    hit: true,
    damage,
    attacker,
    target,
    killingBlow,
    message,
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
