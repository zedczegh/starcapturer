
import { CityAlternative } from '../types';

/**
 * Special districts and smaller cities in China
 */
export const specialChineseDistricts: Record<string, CityAlternative> = {
  "xuhui": {
    name: "Xuhui District, Shanghai, China",
    chinese: "徐汇区，上海",
    alternatives: ["xu hui", "徐汇", "徐汇区", "上海徐汇", "徐匯"],
    coordinates: [31.1889, 121.4361],
    placeDetails: "District in Shanghai"
  },
  "nanming": {
    name: "Nanming District, Guiyang, China",
    chinese: "南明区，贵阳",
    alternatives: ["nan ming", "南明", "南明区", "贵阳南明", "南明贵阳"],
    coordinates: [26.5676, 106.7144],
    placeDetails: "District in Guiyang"
  },
  "duyun": {
    name: "Duyun, Guizhou, China",
    chinese: "都匀",
    alternatives: ["du yun", "都匀市", "都匀市区", "都匀贵州"],
    coordinates: [26.2592, 107.5113],
    placeDetails: "City in Guizhou Province"
  },
  "guiyang": {
    name: "Guiyang, China",
    chinese: "贵阳",
    alternatives: ["gui yang", "贵阳市", "贵阳市区"],
    coordinates: [26.6470, 106.6302],
    placeDetails: "Capital of Guizhou Province"
  },
  "kunming": {
    name: "Kunming, China",
    chinese: "昆明",
    alternatives: ["kun ming", "昆明市", "昆明市区"],
    coordinates: [24.8796, 102.8329],
    placeDetails: "Capital of Yunnan Province"
  },
  "lhasa": {
    name: "Lhasa, Tibet, China",
    chinese: "拉萨",
    alternatives: ["la sa", "拉萨市", "西藏拉萨"],
    coordinates: [29.6500, 91.1000],
    placeDetails: "Capital of Tibet Autonomous Region"
  }
};
