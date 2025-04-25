
export function getScoreColor(score: number): string {
  if (score <= 0) return 'bg-cosmic-700/50 text-muted-foreground border-cosmic-600/30';
  if (score >= 8) return 'bg-green-500/20 text-green-400 border-green-500/40';
  if (score >= 6.5) return 'bg-lime-500/20 text-lime-400 border-lime-500/40';
  if (score >= 5) return 'bg-olive-500/20 text-olive-500 border-olive-500/40';
  if (score >= 3.5) return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
  return 'bg-red-500/20 text-red-300 border-red-500/40';
}

export function getLoadingStyle() {
  return "bg-cosmic-700/50 text-muted-foreground border-cosmic-600/30";
}
