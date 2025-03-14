
import { LocationEntry } from "../locationDatabase";

/**
 * Chinese suburban areas with accurate Bortle scale values
 * Focusing on areas outside major urban centers but still populated
 */
export const chinaSuburbanLocations: LocationEntry[] = [
  // Beijing suburbs
  { name: "Changping District", coordinates: [40.2208, 116.2312], bortleScale: 6.8, radius: 15, type: 'suburban' },
  { name: "Shunyi District", coordinates: [40.1259, 116.6479], bortleScale: 6.7, radius: 15, type: 'suburban' },
  { name: "Huairou District", coordinates: [40.3219, 116.6281], bortleScale: 5.9, radius: 15, type: 'suburban' },
  { name: "Miyun District", coordinates: [40.3763, 116.8435], bortleScale: 5.6, radius: 15, type: 'suburban' },
  { name: "Yanqing District", coordinates: [40.4566, 115.9747], bortleScale: 5.3, radius: 15, type: 'suburban' },
  
  // Shanghai suburbs
  { name: "Jiading District", coordinates: [31.3838, 121.2642], bortleScale: 7.2, radius: 15, type: 'suburban' },
  { name: "Qingpu District", coordinates: [31.1507, 121.1246], bortleScale: 7.0, radius: 15, type: 'suburban' },
  { name: "Songjiang District", coordinates: [31.0303, 121.2277], bortleScale: 7.1, radius: 15, type: 'suburban' },
  { name: "Jinshan District", coordinates: [30.7472, 121.3416], bortleScale: 6.5, radius: 15, type: 'suburban' },
  { name: "Fengxian District", coordinates: [30.9159, 121.4681], bortleScale: 6.8, radius: 15, type: 'suburban' },
  { name: "Chongming Island", coordinates: [31.6229, 121.4804], bortleScale: 5.7, radius: 20, type: 'suburban' },
  
  // Guangzhou & Pearl River Delta suburbs
  { name: "Huadu District", coordinates: [23.4037, 113.2208], bortleScale: 6.9, radius: 15, type: 'suburban' },
  { name: "Panyu District", coordinates: [22.9375, 113.3839], bortleScale: 7.0, radius: 15, type: 'suburban' },
  { name: "Nansha District", coordinates: [22.7972, 113.5249], bortleScale: 6.7, radius: 15, type: 'suburban' },
  { name: "Zengcheng District", coordinates: [23.2964, 113.8107], bortleScale: 6.5, radius: 15, type: 'suburban' },
  { name: "Conghua District", coordinates: [23.5479, 113.5500], bortleScale: 6.0, radius: 15, type: 'suburban' },
  { name: "Zhongshan", coordinates: [22.5321, 113.3591], bortleScale: 6.8, radius: 15, type: 'suburban' },
  { name: "Zhuhai", coordinates: [22.2710, 113.5767], bortleScale: 6.7, radius: 15, type: 'suburban' },
  
  // Chengdu suburbs
  { name: "Longquanyi District", coordinates: [30.5526, 104.2486], bortleScale: 6.4, radius: 15, type: 'suburban' },
  { name: "Xindu District", coordinates: [30.8231, 104.1586], bortleScale: 6.2, radius: 15, type: 'suburban' },
  { name: "Wenjiang District", coordinates: [30.6835, 103.8557], bortleScale: 6.3, radius: 15, type: 'suburban' },
  { name: "Pixian County", coordinates: [30.8034, 103.7613], bortleScale: 5.9, radius: 15, type: 'suburban' },
  { name: "Dujiangyan", coordinates: [30.9984, 103.6208], bortleScale: 5.6, radius: 15, type: 'suburban' },
  
  // Hangzhou suburbs
  { name: "Xiaoshan District", coordinates: [30.1664, 120.2584], bortleScale: 6.7, radius: 15, type: 'suburban' },
  { name: "Yuhang District", coordinates: [30.4173, 120.3013], bortleScale: 6.5, radius: 15, type: 'suburban' },
  { name: "Fuyang District", coordinates: [30.0533, 119.9506], bortleScale: 6.1, radius: 15, type: 'suburban' },
  { name: "Lin'an District", coordinates: [30.2336, 119.7223], bortleScale: 5.8, radius: 15, type: 'suburban' },
  
  // Xi'an suburbs
  { name: "Lintong District", coordinates: [34.3723, 109.2141], bortleScale: 6.0, radius: 15, type: 'suburban' },
  { name: "Huyi District", coordinates: [34.1083, 108.6106], bortleScale: 5.8, radius: 15, type: 'suburban' },
  { name: "Chang'an District", coordinates: [33.9449, 108.9071], bortleScale: 6.2, radius: 15, type: 'suburban' },
  
  // Nanjing suburbs
  { name: "Jiangning District", coordinates: [31.9523, 118.8399], bortleScale: 6.6, radius: 15, type: 'suburban' },
  { name: "Pukou District", coordinates: [32.0599, 118.6227], bortleScale: 6.3, radius: 15, type: 'suburban' },
  { name: "Lishui District", coordinates: [31.6561, 118.9913], bortleScale: 5.9, radius: 15, type: 'suburban' },
  { name: "Gaochun District", coordinates: [31.3271, 118.8921], bortleScale: 5.5, radius: 15, type: 'suburban' },
  
  // Yangtze River Delta smaller cities
  { name: "Kunshan", coordinates: [31.3851, 120.9737], bortleScale: 6.8, radius: 15, type: 'suburban' },
  { name: "Jiaxing", coordinates: [30.7522, 120.7500], bortleScale: 6.5, radius: 15, type: 'suburban' },
  { name: "Changshu", coordinates: [31.6510, 120.7481], bortleScale: 6.4, radius: 15, type: 'suburban' },
  { name: "Yixing", coordinates: [31.3398, 119.8240], bortleScale: 6.2, radius: 15, type: 'suburban' },
  { name: "Zhangjiagang", coordinates: [31.8708, 120.5339], bortleScale: 6.3, radius: 15, type: 'suburban' },
  
  // Central China suburban areas
  { name: "Xianning", coordinates: [29.8414, 114.3223], bortleScale: 5.9, radius: 15, type: 'suburban' },
  { name: "Ezhou", coordinates: [30.3925, 114.8951], bortleScale: 6.0, radius: 15, type: 'suburban' },
  { name: "Xiantao", coordinates: [30.3708, 113.4398], bortleScale: 5.7, radius: 15, type: 'suburban' },
  { name: "Tianmen", coordinates: [30.6531, 113.1617], bortleScale: 5.5, radius: 15, type: 'suburban' },
  
  // Southwestern China suburban areas
  { name: "Anshun", coordinates: [26.2456, 105.9477], bortleScale: 5.6, radius: 15, type: 'suburban' },
  { name: "Zunyi", coordinates: [27.7256, 106.9138], bortleScale: 6.0, radius: 15, type: 'suburban' },
  { name: "Bijie", coordinates: [27.3017, 105.2863], bortleScale: 5.5, radius: 15, type: 'suburban' },
  { name: "Qiannan", coordinates: [26.2582, 107.9855], bortleScale: 5.3, radius: 15, type: 'suburban' },
  
  // Northwestern China suburban areas
  { name: "Xianyang", coordinates: [34.3658, 108.7037], bortleScale: 6.3, radius: 15, type: 'suburban' },
  { name: "Baoji", coordinates: [34.3627, 107.2372], bortleScale: 6.1, radius: 15, type: 'suburban' },
  { name: "Weinan", coordinates: [34.5040, 109.5025], bortleScale: 5.9, radius: 15, type: 'suburban' },
  { name: "Tongchuan", coordinates: [35.0806, 109.0897], bortleScale: 5.7, radius: 15, type: 'suburban' },
];
