import type { LengthUnit } from "./types";

export type LengthStatus = "too-short" | "under" | "near" | "over";

export function countJapaneseCharacters(text: string): number {
  return String(text ?? "").replace(/\s/g, "").length;
}

export function countEnglishWords(text: string): number {
  return String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function countByUnit(text: string, unit: LengthUnit): number {
  return unit === "characters"
    ? countJapaneseCharacters(text)
    : countEnglishWords(text);
}

export function getLengthStatus(actual: number, target: number): LengthStatus {
  if (!target || target <= 0) return "near";
  const ratio = actual / target;
  if (ratio < 0.7) return "too-short";
  if (ratio < 0.9) return "under";
  if (ratio <= 1.2) return "near";
  return "over";
}
