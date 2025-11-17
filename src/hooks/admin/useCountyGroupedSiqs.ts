import { useState, useEffect } from 'react';
import { AggregatedLocation } from './useSiqsAdminData';
import { getEnhancedLocationDetails } from '@/services/geocoding/enhancedReverseGeocoding';

export interface CountyLocation extends AggregatedLocation {
  county?: string;
}

export interface CountyGroup {
  county: string;
  locations: CountyLocation[];
  avgSiqs: number;
  totalCalculations: number;
  minSiqs: number;
  maxSiqs: number;
  latitude: number;  // Representative lat/lng for the county
  longitude: number;
  source: 'calculator' | 'photopoint' | 'community' | 'search';
}

export const useCountyGroupedSiqs = (locations: AggregatedLocation[]) => {
  const [countyGroups, setCountyGroups] = useState<CountyGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const groupByCounty = async () => {
      if (locations.length === 0) {
        setCountyGroups([]);
        return;
      }

      setLoading(true);
      
      try {
        // Geocode all locations to get county information
        const locationsWithCounty = await Promise.all(
          locations.map(async (location) => {
            try {
              const details = await getEnhancedLocationDetails(
                location.latitude,
                location.longitude
              );
              
              // Use county, city, or state as grouping key
              const county = details.countyName || details.cityName || details.stateName || 'Unknown Region';
              
              return {
                ...location,
                county
              } as CountyLocation;
            } catch (error) {
              console.warn('Failed to geocode location:', error);
              return {
                ...location,
                county: 'Unknown Region'
              } as CountyLocation;
            }
          })
        );

        // Group by county
        const groupedMap = new Map<string, CountyLocation[]>();
        
        locationsWithCounty.forEach(location => {
          const key = location.county || 'Unknown Region';
          if (!groupedMap.has(key)) {
            groupedMap.set(key, []);
          }
          groupedMap.get(key)!.push(location);
        });

        // Calculate aggregated stats for each county
        const groups: CountyGroup[] = Array.from(groupedMap.entries()).map(([county, locs]) => {
          const totalCalcs = locs.reduce((sum, loc) => sum + loc.calculation_count, 0);
          const avgSiqs = locs.reduce((sum, loc) => sum + (loc.avg_siqs * loc.calculation_count), 0) / totalCalcs;
          const minSiqs = Math.min(...locs.map(loc => loc.min_siqs || loc.avg_siqs));
          const maxSiqs = Math.max(...locs.map(loc => loc.max_siqs || loc.avg_siqs));
          
          // Use the location with most calculations as representative
          const representative = locs.reduce((prev, curr) => 
            curr.calculation_count > prev.calculation_count ? curr : prev
          );

          return {
            county,
            locations: locs.sort((a, b) => b.avg_siqs - a.avg_siqs),
            avgSiqs,
            totalCalculations: totalCalcs,
            minSiqs,
            maxSiqs,
            latitude: representative.latitude,
            longitude: representative.longitude,
            source: representative.source
          };
        });

        // Sort by average SIQS score
        groups.sort((a, b) => b.avgSiqs - a.avgSiqs);
        
        setCountyGroups(groups);
      } catch (error) {
        console.error('Error grouping by county:', error);
        setCountyGroups([]);
      } finally {
        setLoading(false);
      }
    };

    groupByCounty();
  }, [locations]);

  return { countyGroups, loading };
};
