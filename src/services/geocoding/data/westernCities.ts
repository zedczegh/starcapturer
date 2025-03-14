
import { CityAlternative } from '../types';

/**
 * Western China cities (Xinjiang, Tibet, Qinghai, Gansu)
 */
export const westernChineseCities: Record<string, CityAlternative> = {
  // Xinjiang cities
  "urumqi": {
    name: "Urumqi, Xinjiang, China",
    chinese: "乌鲁木齐",
    alternatives: ["wu lu mu qi", "乌鲁木齐市", "新疆乌鲁木齐"],
    coordinates: [43.8256, 87.6168],
    placeDetails: "Capital of Xinjiang Autonomous Region"
  },
  "kashgar": {
    name: "Kashgar, Xinjiang, China",
    chinese: "喀什",
    alternatives: ["ka shi", "喀什市", "新疆喀什"],
    coordinates: [39.4700, 75.9800],
    placeDetails: "Ancient city in western Xinjiang"
  },
  "turpan": {
    name: "Turpan, Xinjiang, China",
    chinese: "吐鲁番",
    alternatives: ["tu lu fan", "吐鲁番市", "新疆吐鲁番"],
    coordinates: [42.9480, 89.1849],
    placeDetails: "City in eastern Xinjiang"
  },
  "hami": {
    name: "Hami, Xinjiang, China",
    chinese: "哈密",
    alternatives: ["ha mi", "哈密市", "新疆哈密"],
    coordinates: [42.8278, 93.5147],
    placeDetails: "City in eastern Xinjiang"
  },
  
  // Tibet cities
  "shigatse": {
    name: "Shigatse, Tibet, China",
    chinese: "日喀则",
    alternatives: ["ri ka ze", "日喀则市", "西藏日喀则"],
    coordinates: [29.2667, 88.8833],
    placeDetails: "Second largest city in Tibet"
  },
  "nyingchi": {
    name: "Nyingchi, Tibet, China",
    chinese: "林芝",
    alternatives: ["lin zhi", "林芝市", "西藏林芝"],
    coordinates: [29.6490, 94.3613],
    placeDetails: "City in southeastern Tibet"
  },
  "chamdo": {
    name: "Chamdo, Tibet, China",
    chinese: "昌都",
    alternatives: ["chang du", "昌都市", "西藏昌都"],
    coordinates: [31.1480, 97.1700],
    placeDetails: "City in eastern Tibet"
  },
  
  // Qinghai cities
  "xining": {
    name: "Xining, Qinghai, China",
    chinese: "西宁",
    alternatives: ["xi ning", "西宁市", "青海西宁"],
    coordinates: [36.6167, 101.7667],
    placeDetails: "Capital of Qinghai Province"
  },
  "golmud": {
    name: "Golmud, Qinghai, China",
    chinese: "格尔木",
    alternatives: ["ge er mu", "格尔木市", "青海格尔木"],
    coordinates: [36.4167, 94.9000],
    placeDetails: "City in central Qinghai"
  },
  "delingha": {
    name: "Delingha, Qinghai, China",
    chinese: "德令哈",
    alternatives: ["de ling ha", "德令哈市", "青海德令哈"],
    coordinates: [37.3700, 97.3600],
    placeDetails: "City in northern Qinghai"
  },
  
  // Gansu cities
  "lanzhou": {
    name: "Lanzhou, Gansu, China",
    chinese: "兰州",
    alternatives: ["lan zhou", "兰州市", "甘肃兰州"],
    coordinates: [36.0617, 103.8348],
    placeDetails: "Capital of Gansu Province"
  },
  "jiayuguan": {
    name: "Jiayuguan, Gansu, China",
    chinese: "嘉峪关",
    alternatives: ["jia yu guan", "嘉峪关市", "甘肃嘉峪关"],
    coordinates: [39.7732, 98.2890],
    placeDetails: "City at western end of Great Wall"
  },
  "dunhuang": {
    name: "Dunhuang, Gansu, China",
    chinese: "敦煌",
    alternatives: ["dun huang", "敦煌市", "甘肃敦煌"],
    coordinates: [40.1430, 94.6620],
    placeDetails: "Historic city with Mogao Caves"
  }
};
