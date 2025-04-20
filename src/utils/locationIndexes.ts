import { LocationEntry } from '@/data/locationDatabase';
import { quickLocationDatabase } from './quickLocationDatabase';

/**
 * Spatial indexes for efficient location querying
 */
export const spatialIndex = {
  northChina: quickLocationDatabase.filter(loc => 
    (loc.coordinates[0] > 30 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130) && 
    (loc.type === 'urban' || loc.type === 'suburban')
  ),
  southChina: quickLocationDatabase.filter(loc => 
    (loc.coordinates[0] <= 30 && loc.coordinates[0] > 0 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130) && 
    (loc.type === 'urban' || loc.type === 'suburban')
  ),
  centralAsia: quickLocationDatabase.filter(loc => 
    (loc.coordinates[0] > 30 && loc.coordinates[1] > 60 && loc.coordinates[1] < 95)
  ),
  westernChina: quickLocationDatabase.filter(loc => 
    (loc.coordinates[0] > 25 && loc.coordinates[1] > 75 && loc.coordinates[1] < 95) &&
    (loc.type === 'urban' || loc.type === 'suburban')
  ),
  mountainRegions: quickLocationDatabase.filter(loc => 
    loc.type === 'natural' && 
    (loc.name.toLowerCase().includes('mountain') || 
     loc.name.toLowerCase().includes('mountains') ||
     loc.name.toLowerCase().includes('plateau') ||
     loc.name.toLowerCase().includes('range'))
  ),
  naturalSites: quickLocationDatabase.filter(loc => 
    loc.type === 'natural' && 
    !(loc.name.toLowerCase().includes('mountain') || 
      loc.name.toLowerCase().includes('mountains') ||
      loc.name.toLowerCase().includes('plateau') ||
      loc.name.toLowerCase().includes('range'))
  ),
  northAmerica: quickLocationDatabase.filter(loc => loc.coordinates[1] < -50),
  europe: quickLocationDatabase.filter(loc => loc.coordinates[0] > 30 && loc.coordinates[1] > -20 && loc.coordinates[1] < 40),
  australasia: quickLocationDatabase.filter(loc => loc.coordinates[0] < 0 && loc.coordinates[1] > 100),
  darkSites: quickLocationDatabase.filter(loc => loc.type === 'dark-site'),
  tibet: quickLocationDatabase.filter(loc => 
    loc.coordinates[0] > 27 && loc.coordinates[0] < 33 && 
    loc.coordinates[1] > 85 && loc.coordinates[1] < 95
  ),
  xinjiang: quickLocationDatabase.filter(loc => 
    loc.coordinates[0] > 35 && loc.coordinates[0] < 48 && 
    loc.coordinates[1] > 75 && loc.coordinates[1] < 95
  ),
  qinghai: quickLocationDatabase.filter(loc => 
    loc.coordinates[0] > 32 && loc.coordinates[0] < 39 && 
    loc.coordinates[1] > 90 && loc.coordinates[1] < 103
  ),
  gansu: quickLocationDatabase.filter(loc => 
    loc.coordinates[0] > 35 && loc.coordinates[0] < 43 && 
    loc.coordinates[1] > 92 && loc.coordinates[1] < 106
  ),
  innerMongolia: quickLocationDatabase.filter(loc => 
    loc.coordinates[0] > 39 && loc.coordinates[0] < 46 && 
    loc.coordinates[1] > 108 && loc.coordinates[1] < 123
  ),
  northeastChina: quickLocationDatabase.filter(loc => 
    loc.coordinates[0] > 40 && loc.coordinates[0] < 48 && 
    loc.coordinates[1] > 120 && loc.coordinates[1] < 135
  ),
  westernSichuan: quickLocationDatabase.filter(loc => 
    loc.coordinates[0] > 28 && loc.coordinates[0] < 34 && 
    loc.coordinates[1] > 97 && loc.coordinates[1] < 103
  ),
  yunnan: quickLocationDatabase.filter(loc => 
    loc.coordinates[0] > 22 && loc.coordinates[0] < 29 && 
    loc.coordinates[1] > 97 && loc.coordinates[1] < 106
  ),
  guizhou: quickLocationDatabase.filter(loc => 
    loc.coordinates[0] > 24 && loc.coordinates[0] < 29 && 
    loc.coordinates[1] > 104 && loc.coordinates[1] < 110
  ),
  other: quickLocationDatabase.filter(loc => 
    !((loc.coordinates[0] > 30 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130) || 
      (loc.coordinates[0] <= 30 && loc.coordinates[0] > 0 && loc.coordinates[1] > 90 && loc.coordinates[1] < 130) ||
      (loc.coordinates[0] > 30 && loc.coordinates[1] > 60 && loc.coordinates[1] < 95) ||
      (loc.coordinates[1] < -50) ||
      (loc.coordinates[0] > 30 && loc.coordinates[1] > -20 && loc.coordinates[1] < 40) ||
      (loc.coordinates[0] < 0 && loc.coordinates[1] > 100) ||
      (loc.type === 'natural' || loc.type === 'dark-site'))
  )
};
