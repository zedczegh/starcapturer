
/**
 * Optimized Supabase data fetching with caching
 */

import { supabase } from "@/integrations/supabase/client";
import { getCachedSupabaseData, cacheSupabaseData } from "./cache/supabaseCache";
import { CacheOptions } from "./cache/cacheTypes";
import { PostgrestQueryBuilder } from "@supabase/supabase-js";
import { Database } from "@/integrations/supabase/types";

// Define the valid table names from our Supabase schema to ensure type safety
type TableNames = keyof Database['public']['Tables'];

// Track ongoing requests to prevent duplicates
const pendingRequests: Map<string, Promise<any>> = new Map();

interface FetchOptions extends CacheOptions {
  skipCache?: boolean;
  forceRefresh?: boolean;
}

/**
 * Fetch data from Supabase with optimized caching and deduplication
 */
export async function fetchFromSupabase<T = any>(
  tableName: TableNames,
  queryBuilder: (query: PostgrestQueryBuilder<Database['public']['Tables'][TableNames]>) => any,
  options?: FetchOptions
): Promise<T> {
  const {
    skipCache = false,
    forceRefresh = false,
    ttl,
    persistToStorage,
    namespace
  } = options || {};
  
  // Generate a unique key for this query
  const cacheKey = `${tableName}:${queryBuilder.toString()}`;
  
  // Check if there's already a pending request for this exact query
  if (pendingRequests.has(cacheKey)) {
    console.log(`Reusing pending request for ${tableName}`);
    return pendingRequests.get(cacheKey) as Promise<T>;
  }
  
  // Check cache if not skipping
  if (!skipCache && !forceRefresh) {
    const cachedData = getCachedSupabaseData<T>(tableName as string, cacheKey);
    if (cachedData) {
      console.log(`Using cached data for ${tableName}`);
      return cachedData;
    }
  }
  
  // Create query and execute
  const fetchPromise = new Promise<T>(async (resolve, reject) => {
    try {
      let query = supabase.from(tableName);
      const builtQuery = queryBuilder(query);
      
      const { data, error } = await builtQuery;
      
      if (error) {
        throw error;
      }
      
      // Cache the result unless explicitly disabled
      if (!skipCache) {
        cacheSupabaseData(tableName as string, cacheKey, data, {
          ttl,
          persistToStorage,
          namespace
        });
      }
      
      resolve(data as T);
    } catch (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      reject(error);
    } finally {
      // Clean up pending request
      setTimeout(() => {
        pendingRequests.delete(cacheKey);
      }, 0);
    }
  });
  
  // Store the promise to deduplicate concurrent requests
  pendingRequests.set(cacheKey, fetchPromise);
  
  return fetchPromise;
}

/**
 * Clear cached data for a specific table
 */
export function clearTableCache(tableName: TableNames): void {
  const pendingKeys = Array.from(pendingRequests.keys())
    .filter(key => key.startsWith(`${tableName}:`));
    
  // Clear pending requests
  pendingKeys.forEach(key => {
    pendingRequests.delete(key);
  });
}
