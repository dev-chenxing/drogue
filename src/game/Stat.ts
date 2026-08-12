import type { Statistic } from "./types";

export function modStatisticBase(
  statistic: Statistic,
  base?: number,
  current?: number,
  value?: number,
) {
  if (value !== undefined) {
    statistic.baseRaw += value;
    statistic.base = Math.max(0, statistic.baseRaw);
    statistic.currentRaw += value;
    statistic.current = Math.max(0, statistic.currentRaw);
  } else if (current !== undefined) {
    statistic.currentRaw = Math.min(statistic.currentRaw + current, statistic.baseRaw);
    statistic.current = Math.max(0, statistic.currentRaw);
  } else if (base !== undefined) {
    statistic.baseRaw = statistic.baseRaw + base;
    statistic.base = Math.max(0, statistic.baseRaw);
  }
  if (statistic.base > 0) {
    statistic.normalized = statistic.current / statistic.base;
  } else {
    statistic.normalized = 0;
  }
}

export function modStatisticCurrent(statistic: Statistic, current: number) {
  statistic.currentRaw = Math.min(statistic.currentRaw + current, statistic.baseRaw);
  statistic.current = Math.max(0, statistic.currentRaw);
}

export function modStatisticValue(statistic: Statistic, value: number) {
  statistic.baseRaw += value;
  statistic.base = Math.max(0, statistic.baseRaw);
  statistic.currentRaw += value;
  statistic.current = Math.max(0, statistic.currentRaw);
}
