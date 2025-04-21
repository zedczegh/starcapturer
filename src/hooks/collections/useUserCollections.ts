
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SharedAstroSpot } from "@/lib/api/astroSpots";
import { transformSavedLocations } from "@/pages/collections/transformLocations";

// Cache key and freshness duration
const COLLECTIONS_CACHE_KEY = "user_collections_cache";
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

interface CollectionsCache {
  userId: string;
  locations: SharedAstroSpot[];
  timestamp: number;
  version: number; // Added version for cache control
}

export function useUserCollections() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);

  // Helper to load cache
  const loadCache = useCallback(() => {
    try {
      const cachedStr = localStorage.getItem(COLLECTIONS_CACHE_KEY);
      if (!cachedStr) return null;
      const cached: CollectionsCache = JSON.parse(cachedStr);
      if (
        cached.userId === user?.id &&
        Date.now() - cached.timestamp < CACHE_MAX_AGE &&
        cached.locations && 
        Array.isArray(cached.locations)
      ) {
        return cached.locations;
      }
      return null;
    } catch (err) {
      console.warn("Failed to load collections cache:", err);
      return null;
    }
  }, [user?.id]);

  // Helper to save cache
  const saveCache = (locations: SharedAstroSpot[]) => {
    try {
      if (!user?.id) return;
      const cache: CollectionsCache = {
        userId: user.id,
        locations,
        timestamp: Date.now(),
        version: 1 // Current cache version
      };
      localStorage.setItem(COLLECTIONS_CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
      console.warn("Failed to save collections cache:", err);
    }
  };

  // Fetch collections from Supabase with retry mechanism
  const fetchCollections = useCallback(async (isRetry = false) => {
    // Avoid rapid subsequent retries
    if (lastFetchTime && Date.now() - lastFetchTime < 2000) {
      console.log("Throttling collection fetch requests");
      return;
    }
    
    if (!user) {
      setLocations([]);
      setLoading(false);
      return;
    }
    
    if (!isRetry) {
      setLoading(true);
      setError(null);
    }
    
    setLastFetchTime(Date.now());
    
    try {
      const { data, error } = await supabase
        .from("saved_locations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data && Array.isArray(data)) {
        const transformed = transformSavedLocations(data);
        setLocations(transformed);
        setError(null);
        saveCache(transformed);
      } else {
        // Handle empty data as valid (empty collections)
        setLocations([]);
        saveCache([]);
      }
    } catch (e: any) {
      console.error("Failed to load collections:", e);
      const errorMessage = "Failed to load your collections";
      
      // Don't show toast on retries to prevent spam
      if (!isRetry) {
        toast.error(errorMessage);
      }
      
      setError(errorMessage);
      
      // Implement retry mechanism
      if (retryCount < 2) { // Limit to 2 retries
        setRetryCount(prev => prev + 1);
        console.log(`Retrying collection fetch (attempt ${retryCount + 1})`);
        setTimeout(() => {
          fetchCollections(true);
        }, 2000); // Wait 2 seconds before retry
      }
    } finally {
      setLoading(false);
    }
  }, [user, retryCount, lastFetchTime, saveCache]);

  // Check auth on mount, load cache, then fetch in background
  useEffect(() => {
    async function checkAuthAndLoad() {
      try {
        setLoading(true);
        setAuthChecked(false);
        
        if (!user) {
          setLocations([]);
          setAuthChecked(true);
          setLoading(false);
          return;
        }
        
        setAuthChecked(true);
        setRetryCount(0); // Reset retry count on new auth state
        
        // First, load cache
        const cached = loadCache();
        if (cached && cached.length) {
          setLocations(cached);
          setLoading(false);
        }

        // Fetch from supabase in the background always
        await fetchCollections();
      } catch (err) {
        console.error("Authentication or cache loading error:", err);
        setError("Authentication error");
        setLoading(false);
        setAuthChecked(true);
      }
    }
    checkAuthAndLoad();
  }, [user, loadCache, fetchCollections]);

  // Listen to realtime changes and update immediately
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "saved_locations",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchCollections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCollections]);

  // Deletion helper (does not retry restore for simplicity)
  const removeLocationImmediately = (locationId: string) => {
    setLocations((prev) => {
      const updated = prev.filter((loc) => loc.id !== locationId);
      // Update cache with the new list
      saveCache(updated);
      return updated;
    });
  };

  // Force reload (for manual refresh in future)
  const forceReload = async () => {
    setRetryCount(0); // Reset retry count
    await fetchCollections();
  };

  // Manual retry method for user-triggered retries
  const retryLoading = () => {
    setRetryCount(0);
    setError(null);
    fetchCollections();
  };

  // Clear all loading states
  const resetState = () => {
    setLoading(false);
    setError(null);
  };

  // Expose cache saving logic for add/delete
  return {
    locations,
    setLocations,
    loading,
    authChecked,
    error,
    removeLocationImmediately,
    forceReload,
    retryLoading,
    resetState,
  };
}
