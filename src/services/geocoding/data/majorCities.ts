
import { CityAlternative } from '../types';

/**
 * Major Chinese cities with alternative spellings
 */
export const majorChineseCities: Record<string, CityAlternative> = {
  "beijing": {
    name: "Beijing, China",
    chinese: "北京",
    alternatives: ["bei jing", "peking", "北京市", "北京市区"],
    coordinates: [39.9042, 116.4074],
    placeDetails: "Capital city of China"
  },
  "shanghai": {
    name: "Shanghai, China",
    chinese: "上海",
    alternatives: ["shang hai", "上海市", "上海市区"],
    coordinates: [31.2304, 121.4737],
    placeDetails: "Major city in China"
  },
  "guangzhou": {
    name: "Guangzhou, China",
    chinese: "广州",
    alternatives: ["guang zhou", "canton", "广州市", "广州市区"],
    coordinates: [23.1291, 113.2644],
    placeDetails: "Capital of Guangdong Province"
  },
  "shenzhen": {
    name: "Shenzhen, China",
    chinese: "深圳",
    alternatives: ["shen zhen", "深圳市", "深圳市区"],
    coordinates: [22.5431, 114.0579],
    placeDetails: "Tech hub in Guangdong Province"
  },
  "chengdu": {
    name: "Chengdu, China",
    chinese: "成都",
    alternatives: ["cheng du", "成都市", "成都市区"],
    coordinates: [30.5728, 104.0668],
    placeDetails: "Capital of Sichuan Province"
  },
  "hangzhou": {
    name: "Hangzhou, China",
    chinese: "杭州",
    alternatives: ["hang zhou", "杭州市", "杭州市区"],
    coordinates: [30.2741, 120.1551],
    placeDetails: "Capital of Zhejiang Province"
  },
  "chongqing": {
    name: "Chongqing, China",
    chinese: "重庆",
    alternatives: ["chong qing", "重庆市", "重庆市区"],
    coordinates: [29.4316, 106.9123],
    placeDetails: "Municipality in Southwest China"
  },
  "xian": {
    name: "Xi'an, China",
    chinese: "西安",
    alternatives: ["xi an", "xi'an", "xian", "西安市", "西安市区"],
    coordinates: [34.3416, 108.9398],
    placeDetails: "Capital of Shaanxi Province"
  },
  "nanjing": {
    name: "Nanjing, China",
    chinese: "南京",
    alternatives: ["nan jing", "南京市", "南京市区"],
    coordinates: [32.0584, 118.7965],
    placeDetails: "Capital of Jiangsu Province"
  },
  "wuhan": {
    name: "Wuhan, China",
    chinese: "武汉",
    alternatives: ["wu han", "武汉市", "武汉市区"],
    coordinates: [30.5928, 114.3055],
    placeDetails: "Capital of Hubei Province"
  },
  "tianjin": {
    name: "Tianjin, China",
    chinese: "天津",
    alternatives: ["tian jin", "天津市", "天津市区"],
    coordinates: [39.3434, 117.3616],
    placeDetails: "Municipality in Northern China"
  }
};
