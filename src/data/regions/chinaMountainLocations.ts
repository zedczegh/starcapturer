
import { LocationEntry } from "../locationDatabase";

/**
 * Comprehensive database of mountainous regions across China
 * with accurate Bortle scale values based on elevation and remoteness
 */
export const chinaMountainLocations: LocationEntry[] = [
  // Major mountain ranges in Eastern China
  { name: "Huangshan Mountains", coordinates: [30.1300, 118.1650], bortleScale: 3.5, radius: 25, type: 'natural' },
  { name: "Lushan Mountains", coordinates: [29.5550, 115.9830], bortleScale: 3.8, radius: 25, type: 'natural' },
  { name: "Wuyi Mountains", coordinates: [27.7167, 117.6333], bortleScale: 3.2, radius: 30, type: 'natural' },
  { name: "Tianmu Mountains", coordinates: [30.3333, 119.4333], bortleScale: 4.0, radius: 20, type: 'natural' },
  { name: "Yandang Mountains", coordinates: [28.3667, 121.0667], bortleScale: 4.2, radius: 20, type: 'natural' },
  
  // Central China mountain ranges
  { name: "Wudang Mountains", coordinates: [32.4000, 111.0000], bortleScale: 3.7, radius: 25, type: 'natural' },
  { name: "Dabie Mountains", coordinates: [31.1333, 116.1833], bortleScale: 4.0, radius: 30, type: 'natural' },
  { name: "Funiu Mountains", coordinates: [33.7667, 111.5000], bortleScale: 3.8, radius: 25, type: 'natural' },
  { name: "Zhongtiao Mountains", coordinates: [35.2000, 111.3000], bortleScale: 3.6, radius: 20, type: 'natural' },
  { name: "Qinling Mountains", coordinates: [33.9500, 108.8833], bortleScale: 3.0, radius: 40, type: 'natural' },
  { name: "Daba Mountains", coordinates: [32.4000, 108.8833], bortleScale: 3.2, radius: 35, type: 'natural' },
  
  // Southwestern China mountains
  { name: "Emei Mountain", coordinates: [29.5167, 103.3333], bortleScale: 3.5, radius: 15, type: 'natural' },
  { name: "Gongga Mountains", coordinates: [29.6000, 101.8667], bortleScale: 2.0, radius: 40, type: 'natural' },
  { name: "Jade Dragon Snow Mountain", coordinates: [27.1000, 100.2333], bortleScale: 2.5, radius: 20, type: 'natural' },
  { name: "Meili Snow Mountain", coordinates: [28.4333, 98.6833], bortleScale: 1.8, radius: 30, type: 'natural' },
  { name: "Minshan Mountains", coordinates: [32.6667, 103.8333], bortleScale: 2.7, radius: 35, type: 'natural' },
  { name: "Qionglai Mountains", coordinates: [30.8333, 102.9167], bortleScale: 2.8, radius: 35, type: 'natural' },
  { name: "Hengduan Mountains", coordinates: [29.2000, 100.3000], bortleScale: 2.2, radius: 45, type: 'natural' },
  
  // Western China - Xinjiang, Gansu, Qinghai
  { name: "Tianshan Mountains", coordinates: [43.0000, 84.5000], bortleScale: 2.0, radius: 60, type: 'natural' },
  { name: "Kunlun Mountains", coordinates: [36.0000, 84.0000], bortleScale: 1.5, radius: 70, type: 'natural' },
  { name: "Altai Mountains", coordinates: [47.5000, 88.0000], bortleScale: 1.7, radius: 50, type: 'natural' },
  { name: "Pamir Mountains", coordinates: [38.0000, 75.0000], bortleScale: 1.3, radius: 60, type: 'natural' },
  { name: "Qilian Mountains", coordinates: [38.2000, 99.5000], bortleScale: 2.2, radius: 50, type: 'natural' },
  { name: "Altun Mountains", coordinates: [38.5000, 90.5000], bortleScale: 1.4, radius: 55, type: 'natural' },
  
  // Northern China
  { name: "Yanshan Mountains", coordinates: [40.4000, 117.8333], bortleScale: 4.2, radius: 30, type: 'natural' },
  { name: "Taihang Mountains", coordinates: [38.0000, 113.5000], bortleScale: 4.0, radius: 40, type: 'natural' },
  { name: "Yin Mountains", coordinates: [40.7500, 111.0000], bortleScale: 3.0, radius: 45, type: 'natural' },
  { name: "Greater Khingan Range", coordinates: [50.0000, 123.0000], bortleScale: 2.5, radius: 70, type: 'natural' },
  { name: "Lesser Khingan Range", coordinates: [47.5000, 128.5000], bortleScale: 2.8, radius: 60, type: 'natural' },
  { name: "Changbai Mountains", coordinates: [42.0000, 128.0000], bortleScale: 2.7, radius: 50, type: 'natural' },
  
  // Tibetan Plateau
  { name: "Himalayan Range (China)", coordinates: [28.5000, 86.0000], bortleScale: 1.2, radius: 80, type: 'natural' },
  { name: "Gangdise Mountains", coordinates: [31.0000, 84.0000], bortleScale: 1.3, radius: 65, type: 'natural' },
  { name: "Nyenchen Tanglha Mountains", coordinates: [30.5000, 91.0000], bortleScale: 1.4, radius: 60, type: 'natural' },
  { name: "Tanggula Mountains", coordinates: [33.0000, 92.0000], bortleScale: 1.2, radius: 70, type: 'natural' },
  { name: "Bayan Har Mountains", coordinates: [34.0000, 97.0000], bortleScale: 1.5, radius: 65, type: 'natural' },
  { name: "Karakoram Range (China)", coordinates: [35.5000, 77.0000], bortleScale: 1.0, radius: 75, type: 'natural' },
  
  // Specific mountain peaks and observation sites
  { name: "Mount Tai", coordinates: [36.2500, 117.1000], bortleScale: 4.5, radius: 15, type: 'natural' },
  { name: "Mount Hua", coordinates: [34.4833, 110.0833], bortleScale: 3.8, radius: 15, type: 'natural' },
  { name: "Mount Song", coordinates: [34.4833, 113.0167], bortleScale: 4.2, radius: 15, type: 'natural' },
  { name: "Mount Heng (Hunan)", coordinates: [27.2500, 112.6333], bortleScale: 3.9, radius: 15, type: 'natural' },
  { name: "Mount Heng (Shanxi)", coordinates: [39.6733, 113.7167], bortleScale: 3.7, radius: 15, type: 'natural' },
  { name: "Mount Everest Base Camp", coordinates: [28.1500, 86.8500], bortleScale: 1.0, radius: 30, type: 'natural' },
  { name: "Namcha Barwa", coordinates: [29.6333, 95.0500], bortleScale: 1.1, radius: 30, type: 'natural' },
  
  // Remote mountain observatory locations
  { name: "Purple Mountain Observatory", coordinates: [32.0667, 118.8167], bortleScale: 5.0, radius: 10, type: 'natural' },
  { name: "Xinglong Observatory", coordinates: [40.3958, 117.5775], bortleScale: 3.5, radius: 15, type: 'natural' },
  { name: "Delingha Observatory", coordinates: [37.3833, 97.7333], bortleScale: 2.0, radius: 20, type: 'natural' },
  { name: "Gaomeigu Observatory", coordinates: [26.7069, 100.0297], bortleScale: 2.8, radius: 15, type: 'natural' },
  { name: "Nanshan Observatory", coordinates: [43.4750, 87.1780], bortleScale: 2.5, radius: 20, type: 'natural' },
  { name: "Ali Observatory", coordinates: [32.3167, 80.0167], bortleScale: 1.0, radius: 30, type: 'natural' },
  { name: "Ngari Observatory", coordinates: [32.3233, 80.0183], bortleScale: 1.0, radius: 30, type: 'natural' },
  
  // Mountain tourist destinations with Bortle data
  { name: "Zhangjiajie National Forest Park", coordinates: [29.3167, 110.4833], bortleScale: 3.8, radius: 20, type: 'natural' },
  { name: "Jiuzhaigou Valley", coordinates: [33.2600, 103.9167], bortleScale: 3.0, radius: 25, type: 'natural' },
  { name: "Huanglong Scenic Area", coordinates: [32.7500, 103.8333], bortleScale: 2.9, radius: 20, type: 'natural' },
  { name: "Tiger Leaping Gorge", coordinates: [27.1667, 100.0667], bortleScale: 2.7, radius: 15, type: 'natural' },
  { name: "Mount Kailash", coordinates: [31.0667, 81.3167], bortleScale: 1.1, radius: 35, type: 'natural' },
  { name: "Three Parallel Rivers", coordinates: [27.9167, 98.4167], bortleScale: 2.0, radius: 40, type: 'natural' },
  { name: "Potala Palace (Lhasa Mountain)", coordinates: [29.6578, 91.1175], bortleScale: 4.2, radius: 15, type: 'natural' }
];
