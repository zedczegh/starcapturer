
/**
 * Generic memoization utility for caching function results
 */

type MemoizeFunction = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string
) => (...args: Parameters<T>) => Promise<ReturnType<T>>;

/**
 * Create a memoized version of an async function
 * @param fn The function to memoize
 * @param keyFn Optional function to generate cache key from arguments
 * @returns Memoized function
 */
export const memoize: MemoizeFunction = (fn, keyFn) => {
  const cache = new Map<string, any>();

  return async (...args): Promise<any> => {
    const key = keyFn 
      ? keyFn(...args) 
      : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = await fn(...args);
    cache.set(key, result);
    return result;
  };
};
