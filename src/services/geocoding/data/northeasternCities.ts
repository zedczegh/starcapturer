
import { CityAlternative } from '../types';

/**
 * Northeastern China cities (Heilongjiang, Jilin, Liaoning)
 */
export const northeasternChineseCities: Record<string, CityAlternative> = {
  "harbin": {
    name: "Harbin, Heilongjiang, China",
    chinese: "哈尔滨",
    alternatives: ["ha er bin", "哈尔滨市", "黑龙江哈尔滨"],
    coordinates: [45.8038, 126.5350],
    placeDetails: "Capital of Heilongjiang Province"
  },
  "changchun": {
    name: "Changchun, Jilin, China",
    chinese: "长春",
    alternatives: ["chang chun", "长春市", "吉林长春"],
    coordinates: [43.8800, 125.3228],
    placeDetails: "Capital of Jilin Province"
  },
  "shenyang": {
    name: "Shenyang, Liaoning, China",
    chinese: "沈阳",
    alternatives: ["shen yang", "沈阳市", "辽宁沈阳"],
    coordinates: [41.8057, 123.4315],
    placeDetails: "Capital of Liaoning Province"
  },
  "jilin": {
    name: "Jilin City, Jilin, China",
    chinese: "吉林市",
    alternatives: ["ji lin", "吉林市", "吉林省吉林市"],
    coordinates: [43.8384, 126.5836],
    placeDetails: "Major city in Jilin Province"
  },
  "dalian": {
    name: "Dalian, Liaoning, China",
    chinese: "大连",
    alternatives: ["da lian", "大连市", "辽宁大连"],
    coordinates: [38.9140, 121.6147],
    placeDetails: "Port city in Liaoning Province"
  },
  "qiqihar": {
    name: "Qiqihar, Heilongjiang, China",
    chinese: "齐齐哈尔",
    alternatives: ["qi qi ha er", "齐齐哈尔市", "黑龙江齐齐哈尔"],
    coordinates: [47.3523, 123.9181],
    placeDetails: "Major city in Heilongjiang Province"
  },
  "mudanjiang": {
    name: "Mudanjiang, Heilongjiang, China",
    chinese: "牡丹江",
    alternatives: ["mu dan jiang", "牡丹江市", "黑龙江牡丹江"],
    coordinates: [44.5861, 129.6008],
    placeDetails: "City in southeastern Heilongjiang"
  },
  "dandong": {
    name: "Dandong, Liaoning, China",
    chinese: "丹东",
    alternatives: ["dan dong", "丹东市", "辽宁丹东"],
    coordinates: [40.1292, 124.3910],
    placeDetails: "Border city in Liaoning Province"
  }
};
