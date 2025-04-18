
export interface SiqsResult {
  score: number;
  isViable: boolean;
  siqsResult?: {
    score: number;
    isViable: boolean;
    factors?: Array<{
      name: string;
      score: number;
      description: string;
    }>;
  };
}
