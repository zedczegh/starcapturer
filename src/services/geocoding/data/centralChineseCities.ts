
import { CityAlternative } from '../types';

/**
 * Central China cities (Henan, Hubei, Hunan, Anhui, Jiangxi)
 */
export const centralChineseCities: Record<string, CityAlternative> = {
  // Henan
  "zhengzhou": {
    name: "Zhengzhou, Henan, China",
    chinese: "郑州",
    alternatives: ["zheng zhou", "郑州市", "河南郑州"],
    coordinates: [34.7466, 113.6253],
    placeDetails: "Capital of Henan Province"
  },
  "luoyang": {
    name: "Luoyang, Henan, China",
    chinese: "洛阳",
    alternatives: ["luo yang", "洛阳市", "河南洛阳"],
    coordinates: [34.6587, 112.4245],
    placeDetails: "Ancient capital city in Henan"
  },
  "kaifeng": {
    name: "Kaifeng, Henan, China",
    chinese: "开封",
    alternatives: ["kai feng", "开封市", "河南开封"],
    coordinates: [34.7847, 114.3072],
    placeDetails: "Historic city in Henan"
  },
  
  // Hubei
  "wuchang": {
    name: "Wuchang District, Wuhan, China",
    chinese: "武昌区，武汉",
    alternatives: ["wu chang", "武昌", "武昌区", "武汉武昌"],
    coordinates: [30.5434, 114.3159],
    placeDetails: "District in Wuhan"
  },
  "yichang": {
    name: "Yichang, Hubei, China",
    chinese: "宜昌",
    alternatives: ["yi chang", "宜昌市", "湖北宜昌"],
    coordinates: [30.7000, 111.2800],
    placeDetails: "City in western Hubei"
  },
  "xiangyang": {
    name: "Xiangyang, Hubei, China",
    chinese: "襄阳",
    alternatives: ["xiang yang", "襄阳市", "湖北襄阳"],
    coordinates: [32.0090, 112.1255],
    placeDetails: "City in northwestern Hubei"
  },
  
  // Hunan
  "changsha": {
    name: "Changsha, Hunan, China",
    chinese: "长沙",
    alternatives: ["chang sha", "长沙市", "湖南长沙"],
    coordinates: [28.2282, 112.9388],
    placeDetails: "Capital of Hunan Province"
  },
  "zhuzhou": {
    name: "Zhuzhou, Hunan, China",
    chinese: "株洲",
    alternatives: ["zhu zhou", "株洲市", "湖南株洲"],
    coordinates: [27.8273, 113.1515],
    placeDetails: "City in northeastern Hunan"
  },
  "xiangtan": {
    name: "Xiangtan, Hunan, China",
    chinese: "湘潭",
    alternatives: ["xiang tan", "湘潭市", "湖南湘潭"],
    coordinates: [27.8432, 112.9053],
    placeDetails: "City in eastern Hunan"
  },
  
  // Anhui
  "hefei": {
    name: "Hefei, Anhui, China",
    chinese: "合肥",
    alternatives: ["he fei", "合肥市", "安徽合肥"],
    coordinates: [31.8206, 117.2272],
    placeDetails: "Capital of Anhui Province"
  },
  "huangshan": {
    name: "Huangshan, Anhui, China",
    chinese: "黄山",
    alternatives: ["huang shan", "黄山市", "安徽黄山"],
    coordinates: [29.7147, 118.3380],
    placeDetails: "City near Yellow Mountains"
  },
  "wuhu": {
    name: "Wuhu, Anhui, China",
    chinese: "芜湖",
    alternatives: ["wu hu", "芜湖市", "安徽芜湖"],
    coordinates: [31.3339, 118.3726],
    placeDetails: "City in southeastern Anhui"
  }
};
