
import { LocationEntry } from "../locationDatabase";

/**
 * Central Asian locations with accurate Bortle scale values
 */
export const centralAsiaLocations: LocationEntry[] = [
  // Major cities in Xinjiang
  { name: "Urumqi City Center", coordinates: [43.8256, 87.6168], bortleScale: 7.8, radius: 15, type: 'urban' },
  { name: "Urumqi Metropolitan Area", coordinates: [43.8000, 87.6000], bortleScale: 7.3, radius: 25, type: 'urban' },
  { name: "Kashgar City", coordinates: [39.4700, 75.9800], bortleScale: 7.2, radius: 20, type: 'urban' },
  { name: "Turpan City", coordinates: [42.9480, 89.1849], bortleScale: 6.5, radius: 15, type: 'urban' },
  { name: "Hami City", coordinates: [42.8278, 93.5147], bortleScale: 6.3, radius: 15, type: 'urban' },
  { name: "Aksu City", coordinates: [41.1637, 80.2605], bortleScale: 6.7, radius: 15, type: 'urban' },
  { name: "Korla City", coordinates: [41.7268, 86.1730], bortleScale: 6.8, radius: 15, type: 'urban' },
  { name: "Hotan City", coordinates: [37.1075, 79.9307], bortleScale: 6.5, radius: 15, type: 'urban' },
  { name: "Yining City", coordinates: [43.9100, 81.3300], bortleScale: 6.6, radius: 15, type: 'urban' },
  { name: "Tacheng City", coordinates: [46.7500, 83.0000], bortleScale: 6.0, radius: 12, type: 'urban' },
  { name: "Altay City", coordinates: [47.8667, 88.1167], bortleScale: 5.8, radius: 12, type: 'urban' },
  { name: "Bortala Prefecture", coordinates: [44.9031, 82.0729], bortleScale: 5.5, radius: 10, type: 'urban' },
  
  // Xinjiang suburban areas
  { name: "Tianshan District", coordinates: [43.7958, 87.6283], bortleScale: 7.6, radius: 8, type: 'suburban' },
  { name: "Saybagh District", coordinates: [43.8500, 87.5800], bortleScale: 7.5, radius: 8, type: 'suburban' },
  { name: "Midong District", coordinates: [43.9858, 87.6172], bortleScale: 7.0, radius: 10, type: 'suburban' },
  { name: "Dabancheng District", coordinates: [43.3600, 88.3100], bortleScale: 6.0, radius: 12, type: 'suburban' },
  { name: "Kashgar Old City", coordinates: [39.4550, 75.9850], bortleScale: 7.0, radius: 5, type: 'suburban' },
  { name: "Yengisar County", coordinates: [38.9300, 76.1700], bortleScale: 5.5, radius: 10, type: 'suburban' },
  
  // Central Asian cities
  { name: "Almaty", coordinates: [43.2220, 76.8512], bortleScale: 7.5, radius: 25, type: 'urban' },
  { name: "Bishkek", coordinates: [42.8746, 74.5698], bortleScale: 7.2, radius: 20, type: 'urban' },
  { name: "Tashkent", coordinates: [41.2995, 69.2401], bortleScale: 7.6, radius: 25, type: 'urban' },
  { name: "Dushanbe", coordinates: [38.5598, 68.7870], bortleScale: 7.0, radius: 20, type: 'urban' },
  { name: "Ashgabat", coordinates: [37.9601, 58.3261], bortleScale: 7.2, radius: 20, type: 'urban' },
  
  // Tibet cities with correctly updated Bortle values
  { name: "Lhasa City Center", coordinates: [29.6500, 91.1000], bortleScale: 7.2, radius: 15, type: 'urban' },
  { name: "Lhasa Metropolitan Area", coordinates: [29.6700, 91.1300], bortleScale: 6.8, radius: 25, type: 'urban' },
  { name: "Nyingchi City", coordinates: [29.6500, 94.3500], bortleScale: 5.8, radius: 10, type: 'urban' },
  { name: "Shigatse City", coordinates: [29.2667, 88.8833], bortleScale: 6.5, radius: 12, type: 'urban' },
  { name: "Lhoka (Shannan) City", coordinates: [29.2333, 91.7667], bortleScale: 6.3, radius: 10, type: 'urban' },
  { name: "Qamdo City", coordinates: [31.1500, 97.1800], bortleScale: 6.0, radius: 10, type: 'urban' },
  { name: "Nagqu City", coordinates: [31.4800, 92.0500], bortleScale: 5.7, radius: 8, type: 'urban' },
  { name: "Ngari Prefecture", coordinates: [32.5000, 80.1000], bortleScale: 4.5, radius: 20, type: 'urban' },
  
  // Tibet suburban areas
  { name: "Chengguan District", coordinates: [29.6524, 91.1200], bortleScale: 7.0, radius: 10, type: 'suburban' },
  { name: "Doilungdêqên District", coordinates: [29.6708, 90.9647], bortleScale: 6.5, radius: 12, type: 'suburban' },
  { name: "Dagzê District", coordinates: [29.6667, 91.3667], bortleScale: 6.2, radius: 10, type: 'suburban' },
  { name: "Lhünzhub County", coordinates: [29.8333, 91.1833], bortleScale: 5.8, radius: 15, type: 'suburban' },
  { name: "Maizhokunggar County", coordinates: [29.8300, 91.7300], bortleScale: 5.5, radius: 15, type: 'suburban' },
  { name: "Gyantse County", coordinates: [28.9047, 89.6156], bortleScale: 5.4, radius: 10, type: 'suburban' },
  { name: "Samzhubzê District", coordinates: [29.2700, 88.8800], bortleScale: 6.3, radius: 10, type: 'suburban' },
  { name: "Barkor Street Area", coordinates: [29.6537, 91.1327], bortleScale: 7.1, radius: 3, type: 'suburban' },
  { name: "Norbulingka Area", coordinates: [29.6497, 91.0802], bortleScale: 6.8, radius: 5, type: 'suburban' },
  
  // Natural sites in Xinjiang and Central Asia
  { name: "Karakul Lake", coordinates: [38.4344, 73.3999], bortleScale: 1.9, radius: 30, type: 'natural' },
  { name: "Taklamakan Desert Center", coordinates: [38.8600, 83.5000], bortleScale: 1.2, radius: 100, type: 'natural' },
  { name: "Tianshan Mountains", coordinates: [43.0000, 84.0000], bortleScale: 1.7, radius: 60, type: 'natural' },
  { name: "Pamir Mountains", coordinates: [38.0000, 73.0000], bortleScale: 1.3, radius: 80, type: 'natural' },
  { name: "Issyk-Kul Lake", coordinates: [42.4168, 77.6611], bortleScale: 2.8, radius: 30, type: 'natural' },
  
  // Remote Tibetan natural sites with accurate Bortle scale
  { name: "Nam Co Lake", coordinates: [30.7500, 90.5000], bortleScale: 2.0, radius: 30, type: 'natural' },
  { name: "Mount Kailash", coordinates: [31.0700, 81.3100], bortleScale: 1.4, radius: 40, type: 'natural' },
  { name: "Yamdrok Lake", coordinates: [29.4900, 90.6500], bortleScale: 2.5, radius: 20, type: 'natural' },
  { name: "Yarlung Tsangpo Grand Canyon", coordinates: [29.4000, 94.9000], bortleScale: 1.8, radius: 40, type: 'natural' },
  { name: "Namtso Lake", coordinates: [30.7000, 90.5500], bortleScale: 1.9, radius: 35, type: 'natural' },
  
  // Culturally significant locations
  { name: "Id Kah Mosque", coordinates: [39.4700, 76.0000], bortleScale: 7.0, radius: 2, type: 'urban' },
  { name: "Kizil Caves", coordinates: [41.7833, 82.5333], bortleScale: 4.5, radius: 5, type: 'natural' },
  { name: "Jiaohe Ruins", coordinates: [42.9547, 89.1083], bortleScale: 5.0, radius: 3, type: 'natural' },
  { name: "Bezeklik Caves", coordinates: [42.9500, 89.5400], bortleScale: 4.0, radius: 5, type: 'natural' },
  { name: "Gaochang Ruins", coordinates: [42.8600, 89.5358], bortleScale: 4.2, radius: 5, type: 'natural' },
  { name: "Potala Palace", coordinates: [29.6580, 91.1170], bortleScale: 7.0, radius: 2, type: 'urban' },
  { name: "Jokhang Temple", coordinates: [29.6525, 91.1327], bortleScale: 7.0, radius: 2, type: 'urban' },
  { name: "Drepung Monastery", coordinates: [29.6877, 91.0333], bortleScale: 6.2, radius: 5, type: 'natural' },
  { name: "Sera Monastery", coordinates: [29.7136, 91.1225], bortleScale: 6.0, radius: 5, type: 'natural' },
  { name: "Tashilhunpo Monastery", coordinates: [29.2680, 88.8800], bortleScale: 6.3, radius: 3, type: 'urban' }
];
