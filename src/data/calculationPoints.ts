
/**
 * Pre-calculated points for better sky visibility that can be used
 * when no other locations are found.
 */

// Define the structure for calculation points
interface CalculationPoint {
  id: string;
  name: string;
  chineseName: string;
  county: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  bortleScale: number;
  description?: string;
}

// Sample calculation points - focused on lower light pollution areas
const calculationPoints: CalculationPoint[] = [
  {
    id: "calc-point-1",
    name: "Mountain Observation Point",
    chineseName: "山区观测点",
    county: "Alpine",
    state: "Colorado",
    country: "USA",
    latitude: 39.1911,
    longitude: -106.8175,
    bortleScale: 2,
    description: "High altitude observation point with minimal light pollution"
  },
  {
    id: "calc-point-2",
    name: "Desert Viewpoint",
    chineseName: "沙漠观景点",
    county: "Mojave",
    state: "California",
    country: "USA",
    latitude: 35.0117,
    longitude: -115.4729,
    bortleScale: 1,
    description: "Clear desert skies with excellent visibility"
  },
  {
    id: "calc-point-3",
    name: "Forest Clearing",
    chineseName: "森林空地",
    county: "Kittitas",
    state: "Washington",
    country: "USA",
    latitude: 47.1732,
    longitude: -120.9543,
    bortleScale: 3,
    description: "Secluded forest clearing away from city lights"
  },
  {
    id: "calc-point-4",
    name: "Prairie Observation Site",
    chineseName: "草原观测站",
    county: "Cherry",
    state: "Nebraska",
    country: "USA",
    latitude: 42.5603,
    longitude: -101.0782,
    bortleScale: 2,
    description: "Open prairie with wide horizons and dark skies"
  },
  {
    id: "calc-point-5",
    name: "Remote Lake Viewpoint",
    chineseName: "偏远湖泊观景点",
    county: "Boundary",
    state: "Idaho",
    country: "USA",
    latitude: 48.7675,
    longitude: -116.2346,
    bortleScale: 2,
    description: "Lakeside viewing area with minimal artificial light"
  }
];

/**
 * Get pre-calculated points that are good for astrophotography
 * @returns Array of calculation points
 */
export const getCalculationPoints = async (): Promise<CalculationPoint[]> => {
  // Simulate async data loading - in a real app, this might come from an API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(calculationPoints);
    }, 100); // Short delay to simulate API call but not cause performance issues
  });
};

