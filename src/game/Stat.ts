import type { Statistic } from "./types";

function updateNormalized(statistic: Statistic) {
  if (statistic.base > 0) {
    statistic.normalized = statistic.current / statistic.base;
  } else {
    statistic.normalized = 0;
  }
}

export function modStatisticBase(statistic: Statistic, base: number) {
  statistic.baseRaw = statistic.baseRaw + base;
  statistic.base = Math.max(0, statistic.baseRaw);
  updateNormalized(statistic);
}

export function modStatisticCurrent(statistic: Statistic, current: number) {
  statistic.currentRaw = Math.min(statistic.currentRaw + current, statistic.baseRaw);
  statistic.current = Math.max(0, statistic.currentRaw);
  updateNormalized(statistic);
}

export function modStatisticValue(statistic: Statistic, value: number) {
  statistic.baseRaw += value;
  statistic.base = Math.max(0, statistic.baseRaw);
  statistic.currentRaw += value;
  statistic.current = Math.max(0, statistic.currentRaw);
  updateNormalized(statistic);
}
