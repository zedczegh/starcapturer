import { LocationEntry } from '@/data/locationDatabase';

/**
 * Optimized subset of locations for quick lookups
 */
export const quickLocationDatabase: LocationEntry[] = [
  // Major Chinese cities with accurate data
  { name: "Guangzhou", coordinates: [23.1291, 113.2644], bortleScale: 7.8, type: 'urban', radius: 30 },
  { name: "Shenzhen", coordinates: [22.5431, 114.0579], bortleScale: 7.8, type: 'urban', radius: 30 },
  { name: "Hong Kong", coordinates: [22.3193, 114.1694], bortleScale: 8.5, type: 'urban', radius: 30 },
  { name: "Shanghai", coordinates: [31.2304, 121.4737], bortleScale: 8.5, type: 'urban', radius: 50 },
  { name: "Beijing", coordinates: [39.9042, 116.4074], bortleScale: 8.5, type: 'urban', radius: 50 },
  { name: "Chengdu", coordinates: [30.5723, 104.0665], bortleScale: 7.5, type: 'urban', radius: 30 },
  { name: "Wuhan", coordinates: [30.5928, 114.3055], bortleScale: 7.5, type: 'urban', radius: 30 },
  { name: "Xi'an", coordinates: [34.3416, 108.9398], bortleScale: 7.3, type: 'urban', radius: 25 },
  { name: "Nanjing", coordinates: [32.0603, 118.7969], bortleScale: 7.5, type: 'urban', radius: 30 },
  { name: "Hangzhou", coordinates: [30.2741, 120.1552], bortleScale: 7.5, type: 'urban', radius: 30 },
  { name: "Tianjin", coordinates: [39.3434, 117.3616], bortleScale: 7.5, type: 'urban', radius: 30 },
  
  // Updated data for Xinjiang cities
  { name: "Urumqi City Center", coordinates: [43.8256, 87.6168], bortleScale: 7.8, radius: 15, type: 'urban' },
  { name: "Kashgar City", coordinates: [39.4700, 75.9800], bortleScale: 7.2, radius: 20, type: 'urban' },
  { name: "Turpan City", coordinates: [42.9480, 89.1849], bortleScale: 6.5, radius: 15, type: 'urban' },
  { name: "Hami City", coordinates: [42.8278, 93.5147], bortleScale: 6.3, radius: 15, type: 'urban' },
  { name: "Aksu City", coordinates: [41.7276, 82.9835], bortleScale: 6.8, radius: 15, type: 'urban' },
  { name: "Yining City", coordinates: [43.9978, 81.3304], bortleScale: 6.5, radius: 15, type: 'urban' },
  { name: "Korla City", coordinates: [41.7257, 86.1742], bortleScale: 6.7, radius: 15, type: 'urban' },
  
  // Updated data for Tibet and western regions
  { name: "Lhasa City", coordinates: [29.6500, 91.1000], bortleScale: 6.8, radius: 20, type: 'urban' },
  { name: "Shigatse City", coordinates: [29.2667, 88.8833], bortleScale: 6.2, radius: 15, type: 'urban' },
  { name: "Chamdo City", coordinates: [31.1480, 97.1700], bortleScale: 5.8, radius: 12, type: 'urban' },
  { name: "Nyingchi City", coordinates: [29.6490, 94.3613], bortleScale: 5.5, radius: 12, type: 'urban' },
  { name: "Lhoka City", coordinates: [29.2367, 91.7612], bortleScale: 5.8, radius: 12, type: 'urban' },
  { name: "Nagqu City", coordinates: [31.4680, 92.0510], bortleScale: 5.5, radius: 10, type: 'urban' },
  
  // Updated data for Qinghai
  { name: "Xining City", coordinates: [36.6167, 101.7667], bortleScale: 7.0, radius: 22, type: 'urban' },
  { name: "Golmud City", coordinates: [36.4167, 94.9000], bortleScale: 6.2, radius: 15, type: 'urban' },
  { name: "Delingha City", coordinates: [37.3700, 100.6300], bortleScale: 5.8, radius: 10, type: 'urban' },
  { name: "Yushu City", coordinates: [33.0091, 97.0088], bortleScale: 5.5, radius: 10, type: 'urban' },
  
  // Updated data for Gansu
  { name: "Lanzhou City", coordinates: [36.0617, 103.8348], bortleScale: 7.2, radius: 20, type: 'urban' },
  { name: "Jiayuguan City", coordinates: [39.7732, 98.2890], bortleScale: 6.5, radius: 15, type: 'urban' },
  { name: "Dunhuang City", coordinates: [39.9990, 94.6694], bortleScale: 6.0, radius: 12, type: 'urban' },
  { name: "Hezuo City", coordinates: [34.5953, 102.9066], bortleScale: 6.3, radius: 12, type: 'urban' },
  
  // Updated data for Inner Mongolia
  { name: "Hohhot City", coordinates: [40.8414, 111.7500], bortleScale: 7.3, radius: 25, type: 'urban' },
  { name: "Baotou City", coordinates: [40.6562, 109.8345], bortleScale: 7.4, radius: 25, type: 'urban' },
  { name: "Ordos City", coordinates: [39.6080, 109.7813], bortleScale: 6.8, radius: 20, type: 'urban' },
  { name: "Chifeng City", coordinates: [42.2682, 118.9582], bortleScale: 6.9, radius: 20, type: 'urban' },
  { name: "Tongliao City", coordinates: [43.6172, 122.2633], bortleScale: 6.7, radius: 18, type: 'urban' },
  { name: "Hulunbuir City", coordinates: [49.2122, 119.7656], bortleScale: 6.5, radius: 18, type: 'urban' },
  
  // Updated data for Northeastern China
  { name: "Harbin City", coordinates: [45.8038, 126.5350], bortleScale: 7.6, radius: 30, type: 'urban' },
  { name: "Changchun City", coordinates: [43.8800, 125.3228], bortleScale: 7.5, radius: 28, type: 'urban' },
  { name: "Shenyang City", coordinates: [41.8057, 123.4315], bortleScale: 7.7, radius: 30, type: 'urban' },
  { name: "Qiqihar City", coordinates: [47.3523, 123.9181], bortleScale: 6.5, radius: 18, type: 'urban' },
  { name: "Jilin City", coordinates: [43.8384, 126.5836], bortleScale: 6.8, radius: 20, type: 'urban' },
  { name: "Dandong City", coordinates: [39.9989, 124.3340], bortleScale: 7.0, radius: 20, type: 'urban' },
  { name: "Mudanjiang City", coordinates: [44.5861, 129.6008], bortleScale: 6.5, radius: 18, type: 'urban' },
  
  // Western Sichuan
  { name: "Kangding City", coordinates: [30.0576, 101.9644], bortleScale: 6.0, radius: 15, type: 'urban' },
  { name: "Aba City", coordinates: [31.9977, 102.2262], bortleScale: 5.8, radius: 12, type: 'urban' },
  { name: "Garze City", coordinates: [31.6225, 100.0028], bortleScale: 5.5, radius: 12, type: 'urban' },
  
  // Yunnan remote areas
  { name: "Shangri-La City", coordinates: [27.8360, 99.7072], bortleScale: 5.5, radius: 15, type: 'urban' },
  { name: "Dali City", coordinates: [25.6001, 100.2681], bortleScale: 6.8, radius: 18, type: 'urban' },
  { name: "Lijiang City", coordinates: [26.8553, 100.2271], bortleScale: 6.5, radius: 18, type: 'urban' },
  { name: "Tengchong City", coordinates: [25.0207, 98.4956], bortleScale: 5.8, radius: 12, type: 'urban' },
  
  // Guizhou remote areas
  { name: "Kaili City", coordinates: [26.5682, 107.9803], bortleScale: 6.3, radius: 15, type: 'urban' },
  { name: "Duyun City", coordinates: [26.2593, 107.5127], bortleScale: 6.0, radius: 12, type: 'urban' },
  { name: "Xingyi City", coordinates: [25.0920, 104.8948], bortleScale: 6.2, radius: 15, type: 'urban' },
  
  // Notable suburban areas in China (subset of the more comprehensive database)
  { name: "Songjiang District", coordinates: [31.0303, 121.2277], bortleScale: 7.1, radius: 15, type: 'suburban' },
  { name: "Jiading District", coordinates: [31.3838, 121.2642], bortleScale: 7.2, radius: 15, type: 'suburban' },
  { name: "Panyu District", coordinates: [22.9375, 113.3839], bortleScale: 7.0, radius: 15, type: 'suburban' },
  { name: "Huadu District", coordinates: [23.4037, 113.2208], bortleScale: 6.9, radius: 15, type: 'suburban' },
  { name: "Changping District", coordinates: [40.2208, 116.2312], bortleScale: 6.8, radius: 15, type: 'suburban' },
  { name: "Longquanyi District", coordinates: [30.5526, 104.2486], bortleScale: 6.4, radius: 15, type: 'suburban' },
  { name: "Xiaoshan District", coordinates: [30.1664, 120.2584], bortleScale: 6.7, radius: 15, type: 'suburban' },
  { name: "Jiangning District", coordinates: [31.9523, 118.8399], bortleScale: 6.6, radius: 15, type: 'suburban' },
  { name: "Chang'an District", coordinates: [33.9449, 108.9071], bortleScale: 6.2, radius: 15, type: 'suburban' },
  
  // New suburban entries for western regions
  { name: "Tianshan District", coordinates: [43.7958, 87.6283], bortleScale: 7.6, radius: 8, type: 'suburban' },
  { name: "Saybagh District", coordinates: [43.8500, 87.5800], bortleScale: 7.5, radius: 8, type: 'suburban' },
  { name: "Midong District", coordinates: [43.9858, 87.6172], bortleScale: 7.0, radius: 10, type: 'suburban' },
  { name: "Dabancheng District", coordinates: [43.3600, 88.3100], bortleScale: 6.0, radius: 12, type: 'suburban' },
  { name: "Doilungdêqên District", coordinates: [29.6708, 90.9647], bortleScale: 6.3, radius: 10, type: 'suburban' },
  { name: "Dagzê District", coordinates: [29.6667, 91.3667], bortleScale: 5.9, radius: 8, type: 'suburban' },
  { name: "Chengbei District", coordinates: [36.6502, 101.7660], bortleScale: 6.8, radius: 10, type: 'suburban' },
  { name: "Huangzhong District", coordinates: [36.4998, 101.5706], bortleScale: 6.2, radius: 12, type: 'suburban' },
  { name: "Saihan District", coordinates: [40.8068, 111.5019], bortleScale: 7.0, radius: 10, type: 'suburban' },
  { name: "Daowai District", coordinates: [45.7825, 126.6568], bortleScale: 7.4, radius: 10, type: 'suburban' },
  
  // Key mountain regions in China for quick access
  { name: "Huangshan Mountains", coordinates: [30.1300, 118.1650], bortleScale: 3.5, radius: 25, type: 'natural' },
  { name: "Tianshan Mountains", coordinates: [43.0000, 84.5000], bortleScale: 2.0, radius: 60, type: 'natural' },
  { name: "Qinling Mountains", coordinates: [33.9500, 108.8833], bortleScale: 3.0, radius: 40, type: 'natural' },
  { name: "Tibetan Plateau", coordinates: [31.6927, 88.7083], bortleScale: 2.0, radius: 60, type: 'natural' },
  { name: "Hengduan Mountains", coordinates: [29.2000, 100.3000], bortleScale: 2.2, radius: 45, type: 'natural' },
  { name: "Himalayan Range (China)", coordinates: [28.5000, 86.0000], bortleScale: 1.2, radius: 80, type: 'natural' },
  { name: "Greater Khingan Range", coordinates: [50.0000, 123.0000], bortleScale: 2.5, radius: 70, type: 'natural' },
  { name: "Mount Tai", coordinates: [36.2500, 117.1000], bortleScale: 4.5, radius: 15, type: 'natural' },
  { name: "Zhangjiajie National Forest Park", coordinates: [29.3167, 110.4833], bortleScale: 3.8, radius: 20, type: 'natural' },
  { name: "Jiuzhaigou Valley", coordinates: [33.2600, 103.9167], bortleScale: 3.0, radius: 25, type: 'natural' },
  
  // Smaller Chinese cities and towns
  { name: "Suzhou", coordinates: [31.2983, 120.5832], bortleScale: 7.3, type: 'urban', radius: 25 },
  { name: "Dongguan", coordinates: [23.0207, 113.7518], bortleScale: 7.5, type: 'urban', radius: 25 },
  { name: "Foshan", coordinates: [23.0229, 113.1322], bortleScale: 7.5, type: 'urban', radius: 25 },
  { name: "Zhengzhou", coordinates: [34.7533, 113.6653], bortleScale: 7.3, type: 'urban', radius: 25 },
  { name: "Xuhui District", coordinates: [31.1889, 121.4361], bortleScale: 8.2, type: 'urban', radius: 20 },
  { name: "Nanming District", coordinates: [26.5676, 106.7144], bortleScale: 6.5, type: 'urban', radius: 15 },
  { name: "Guilin", coordinates: [25.2736, 110.2902], bortleScale: 6.5, type: 'urban', radius: 15 },
  { name: "Yangshuo", coordinates: [24.7781, 110.4960], bortleScale: 5.5, type: 'rural', radius: 15 },
  { name: "Kunming", coordinates: [25.0389, 102.7183], bortleScale: 7.2, type: 'urban', radius: 25 },
  { name: "Huangshan", coordinates: [29.7147, 118.3380], bortleScale: 5.5, type: 'rural', radius: 15 },
  
  // Major global cities
  { name: "New York City", coordinates: [40.7128, -74.0060], bortleScale: 8.5, type: 'urban', radius: 40 },
  { name: "Los Angeles", coordinates: [34.0522, -118.2437], bortleScale: 8.5, type: 'urban', radius: 40 },
  { name: "London", coordinates: [51.5074, -0.1278], bortleScale: 8.5, type: 'urban', radius: 40 },
  { name: "Tokyo", coordinates: [35.6762, 139.6503], bortleScale: 9.0, type: 'urban', radius: 50 },
  { name: "Paris", coordinates: [48.8566, 2.3522], bortleScale: 9.0, type: 'urban', radius: 40 },
  
  // North American cities
  { name: "Green Bay", coordinates: [44.5133, -88.0133], bortleScale: 6.8, type: 'urban', radius: 15 },
  
  // Dark sky sites
  { name: "Atacama Desert", coordinates: [-23.4500, -69.2500], bortleScale: 1, type: 'dark-site', radius: 60 },
  { name: "Mauna Kea", coordinates: [19.8207, -155.4681], bortleScale: 1, type: 'dark-site', radius: 50 },
  { name: "Grand Canyon", coordinates: [36.0544, -112.1401], bortleScale: 3, type: 'natural', radius: 30 },
  { name: "Yellowstone", coordinates: [44.4280, -110.5885], bortleScale: 3, type: 'natural', radius: 30 },
  { name: "Banff National Park", coordinates: [51.4968, -115.9281], bortleScale: 2, type: 'natural', radius: 30 },
  { name: "Australian Outback", coordinates: [-25.3450, 131.0369], bortleScale: 1, type: 'natural', radius: 100 },
  { name: "Taklamakan Desert Center", coordinates: [38.8600, 83.5000], bortleScale: 1.2, type: 'natural', radius: 100 },
  { name: "Qinghai Lake", coordinates: [36.8977, 100.1802], bortleScale: 2, type: 'natural', radius: 40 },
];
