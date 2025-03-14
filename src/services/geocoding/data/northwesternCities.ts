
import { CityAlternative } from '../types';

/**
 * Northwestern China cities (Shaanxi, Gansu, Ningxia, Xinjiang)
 */
export const northwesternChineseCities: Record<string, CityAlternative> = {
  "xian": {
    name: "Xi'an, Shaanxi, China",
    chinese: "西安",
    alternatives: ["xi an", "xi'an", "西安市", "陕西西安"],
    coordinates: [34.3416, 108.9398],
    placeDetails: "Capital of Shaanxi Province"
  },
  "lanzhou": {
    name: "Lanzhou, Gansu, China",
    chinese: "兰州",
    alternatives: ["lan zhou", "兰州市", "甘肃兰州"],
    coordinates: [36.0617, 103.8318],
    placeDetails: "Capital of Gansu Province"
  },
  "yinchuan": {
    name: "Yinchuan, Ningxia, China",
    chinese: "银川",
    alternatives: ["yin chuan", "银川市", "宁夏银川"],
    coordinates: [38.4863, 106.2394],
    placeDetails: "Capital of Ningxia Hui Autonomous Region"
  },
  "urumqi": {
    name: "Urumqi, Xinjiang, China",
    chinese: "乌鲁木齐",
    alternatives: ["wu lu mu qi", "乌鲁木齐市", "新疆乌鲁木齐"],
    coordinates: [43.8288, 87.6168],
    placeDetails: "Capital of Xinjiang Uyghur Autonomous Region"
  },
  "xianyang": {
    name: "Xianyang, Shaanxi, China",
    chinese: "咸阳",
    alternatives: ["xian yang", "咸阳市", "陕西咸阳"],
    coordinates: [34.3470, 108.7076],
    placeDetails: "City in Shaanxi Province"
  },
  "baoji": {
    name: "Baoji, Shaanxi, China",
    chinese: "宝鸡",
    alternatives: ["bao ji", "宝鸡市", "陕西宝鸡"],
    coordinates: [34.3609, 107.2373],
    placeDetails: "City in Shaanxi Province"
  },
  "dunhuang": {
    name: "Dunhuang, Gansu, China",
    chinese: "敦煌",
    alternatives: ["dun huang", "敦煌市", "甘肃敦煌"],
    coordinates: [40.1425, 94.6618],
    placeDetails: "Historic city in Gansu Province"
  },
  "kashgar": {
    name: "Kashgar, Xinjiang, China",
    chinese: "喀什",
    alternatives: ["ka shi", "喀什市", "新疆喀什"],
    coordinates: [39.4708, 75.9897],
    placeDetails: "City in Xinjiang Uyghur Autonomous Region"
  }
};
