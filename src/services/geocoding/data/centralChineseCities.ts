
import { CityAlternative } from '../types';

/**
 * Central China cities (Henan, Hubei, Hunan, Jiangxi)
 */
export const centralChineseCities: Record<string, CityAlternative> = {
  "zhengzhou": {
    name: "Zhengzhou, Henan, China",
    chinese: "郑州",
    alternatives: ["zheng zhou", "郑州市", "河南郑州"],
    coordinates: [34.7472, 113.6249],
    placeDetails: "Capital of Henan Province"
  },
  "wuhan": {
    name: "Wuhan, Hubei, China",
    chinese: "武汉",
    alternatives: ["wu han", "武汉市", "湖北武汉"],
    coordinates: [30.5928, 114.3055],
    placeDetails: "Capital of Hubei Province"
  },
  "changsha": {
    name: "Changsha, Hunan, China",
    chinese: "长沙",
    alternatives: ["chang sha", "长沙市", "湖南长沙"],
    coordinates: [28.2282, 112.9388],
    placeDetails: "Capital of Hunan Province"
  },
  "nanchang": {
    name: "Nanchang, Jiangxi, China",
    chinese: "南昌",
    alternatives: ["nan chang", "南昌市", "江西南昌"],
    coordinates: [28.6830, 115.8580],
    placeDetails: "Capital of Jiangxi Province"
  },
  "luoyang": {
    name: "Luoyang, Henan, China",
    chinese: "洛阳",
    alternatives: ["luo yang", "洛阳市", "河南洛阳"],
    coordinates: [34.6587, 112.4245],
    placeDetails: "Ancient capital in Henan Province"
  },
  "xiangyang": {
    name: "Xiangyang, Hubei, China",
    chinese: "襄阳",
    alternatives: ["xiang yang", "襄阳市", "湖北襄阳"],
    coordinates: [32.0090, 112.1229],
    placeDetails: "City in Hubei Province"
  },
  "yichang": {
    name: "Yichang, Hubei, China",
    chinese: "宜昌",
    alternatives: ["yi chang", "宜昌市", "湖北宜昌"],
    coordinates: [30.6943, 111.2863],
    placeDetails: "City in Hubei Province"
  },
  "zhuzhou": {
    name: "Zhuzhou, Hunan, China",
    chinese: "株洲",
    alternatives: ["zhu zhou", "株洲市", "湖南株洲"],
    coordinates: [27.8273, 113.1519],
    placeDetails: "City in Hunan Province"
  }
};
