
/**
 * Simple cache for user tags to prevent flickering during rapid re-renders
 */
const tagCache = new Map<string, any[]>();

export function getCachedTags(userId: string): any[] | undefined {
  return tagCache.get(userId);
}

export function setCachedTags(userId: string, tags: any[]): void {
  tagCache.set(userId, tags);
}

export function clearTagCache(): void {
  tagCache.clear();
}
