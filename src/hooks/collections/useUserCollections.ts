
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
}

export function useUserCollections() {
  const { user } = useAuth();
  const [locations, setLocations] = useState<SharedAstroSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to load cache
  const loadCache = useCallback(() => {
    try {
      const cachedStr = localStorage.getItem(COLLECTIONS_CACHE_KEY);
      if (!cachedStr) return null;
      const cached: CollectionsCache = JSON.parse(cachedStr);
      if (
        cached.userId === user?.id &&
        Date.now() - cached.timestamp < CACHE_MAX_AGE
      ) {
        return cached.locations;
      }
      return null;
    } catch {
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
      };
      localStorage.setItem(COLLECTIONS_CACHE_KEY, JSON.stringify(cache));
    } catch {}
  };

  // Fetch collections from Supabase
  const fetchCollections = useCallback(async () => {
    if (!user) {
      setLocations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("saved_locations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const transformed = transformSavedLocations(data);
      setLocations(transformed);
      saveCache(transformed);
    } catch (e: any) {
      console.error("Collection fetch error:", e);
      setError("Failed to load your collections");
      setLocations([]); // Set to empty array instead of keeping it undefined
      toast.error("Failed to load your collections");
    } finally {
      setLoading(false);
    }
  }, [user]);

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
        // First, load cache
        const cached = loadCache();
        if (cached && cached.length) setLocations(cached);

        // Fetch from supabase in the background always
        await fetchCollections();
      } catch {
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
    setLocations((prev) => prev.filter((loc) => loc.id !== locationId));
    // Also remove from cache
    const cached = loadCache();
    if (!cached) return;
    const next = cached.filter((loc: any) => loc.id !== locationId);
    saveCache(next);
  };

  // Force reload (for manual refresh in future)
  const forceReload = async () => {
    await fetchCollections();
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
  };
}
