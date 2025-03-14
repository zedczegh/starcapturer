
// Common types for the matching utilities
export interface PinyinVariation {
  standard: string;
  variants: string[];
}

export type PinyinVariationsMap = Record<string, string[]>;

export interface MatchScore {
  score: number;
  reason?: string;
}
