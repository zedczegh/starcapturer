import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SavedAstroSpot {
  id: string;
  spot_id: string;
  name: string;
  latitude: number;
  longitude: number;
  bortlescale?: number;
  siqs?: number;
  verification_status?: string;
  spot_type?: string;
  created_at: string;
  updated_at: string;
}

const ASTRO_COLLECTIONS_CACHE_KEY = 'astro_spot_collections_cache';
const CACHE_MAX_AGE = 5 * 60 * 1000; // 5 minutes

interface AstroCollectionsCache {
  userId: string;
  spots: SavedAstroSpot[];
  timestamp: number;
}

export const useUserAstroSpotCollections = () => {
  const { user } = useAuth();
  const [spots, setSpots] = useState<SavedAstroSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cache management
  const loadCache = useCallback((): SavedAstroSpot[] | null => {
    if (!user) return null;
    
    try {
      const cached = localStorage.getItem(ASTRO_COLLECTIONS_CACHE_KEY);
      if (!cached) return null;
      
      const cacheData: AstroCollectionsCache = JSON.parse(cached);
      const now = Date.now();
      
      if (cacheData.userId !== user.id || (now - cacheData.timestamp) > CACHE_MAX_AGE) {
        localStorage.removeItem(ASTRO_COLLECTIONS_CACHE_KEY);
        return null;
      }
      
      return cacheData.spots;
    } catch (error) {
      console.error('Error loading astro spots cache:', error);
      localStorage.removeItem(ASTRO_COLLECTIONS_CACHE_KEY);
      return null;
    }
  }, [user]);

  const saveCache = useCallback((spots: SavedAstroSpot[]) => {
    if (!user) return;
    
    try {
      const cacheData: AstroCollectionsCache = {
        userId: user.id,
        spots,
        timestamp: Date.now()
      };
      localStorage.setItem(ASTRO_COLLECTIONS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving astro spots cache:', error);
    }
  }, [user]);

  const fetchAstroSpotCollections = useCallback(async () => {
    if (!user) {
      setSpots([]);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('saved_astro_spots')
        .select(`
          *,
          user_astro_spots!inner(spot_type)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      const transformedSpots: SavedAstroSpot[] = (data || []).map(spot => ({
        ...spot,
        spot_type: (spot as any).user_astro_spots?.spot_type || 'nightscape'
      }));
      setSpots(transformedSpots);
      saveCache(transformedSpots);
    } catch (error: any) {
      console.error('Error fetching astro spot collections:', error);
      setError(error.message || 'Failed to load astro spot collections');
      setSpots([]); // Set to empty array instead of keeping it undefined
    } finally {
      setLoading(false);
    }
  }, [user, saveCache]);

  // Initial data loading
  useEffect(() => {
    setAuthChecked(true);
    if (!user) {
      setSpots([]);
      setLoading(false);
      return;
    }

    // Load from cache first
    const cachedSpots = loadCache();
    if (cachedSpots) {
      setSpots(cachedSpots);
      setLoading(false);
    }

    // Then fetch fresh data
    fetchAstroSpotCollections();
  }, [user, loadCache, fetchAstroSpotCollections]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('saved_astro_spots_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'saved_astro_spots',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('Real-time update for saved astro spots:', payload);
          fetchAstroSpotCollections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchAstroSpotCollections]);

  const removeAstroSpotImmediately = useCallback((spotId: string) => {
    setSpots(prev => {
      const updated = prev.filter(spot => spot.spot_id !== spotId);
      saveCache(updated);
      return updated;
    });
  }, [saveCache]);

  const forceReload = useCallback(async () => {
    setLoading(true);
    localStorage.removeItem(ASTRO_COLLECTIONS_CACHE_KEY);
    await fetchAstroSpotCollections();
  }, [fetchAstroSpotCollections]);

  return {
    spots,
    setSpots,
    loading,
    authChecked,
    error,
    removeAstroSpotImmediately,
    forceReload
  };
};