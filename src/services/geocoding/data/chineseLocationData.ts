
import { ChineseLocation } from '../types';

/**
 * Comprehensive database of Chinese location data with accurate coordinates and metadata
 * This enhances our ability to provide precise location search and Bortle scale estimations
 */
export const chineseLocationDatabase: ChineseLocation[] = [
  // Beijing locations
  { 
    areaCode: "101010900", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110106", 
    district: "丰台", 
    nameEn: "Fengtai", 
    pinyin: "fengtai", 
    longitude: 116.286968, 
    latitude: 39.863642,
    bortleScale: 8
  },
  { 
    areaCode: "101011000", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110107", 
    district: "石景山", 
    nameEn: "Shijingshan", 
    pinyin: "shijingshan", 
    longitude: 116.195445, 
    latitude: 39.914601,
    bortleScale: 8
  },
  { 
    areaCode: "101011400", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110109", 
    district: "门头沟", 
    nameEn: "Mentougou", 
    pinyin: "mentougou", 
    longitude: 116.105381, 
    latitude: 39.937183,
    bortleScale: 7
  },
  { 
    areaCode: "101011200", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110111", 
    district: "房山", 
    nameEn: "Fangshan", 
    pinyin: "fangshan", 
    longitude: 116.139157, 
    latitude: 39.735535,
    bortleScale: 7
  },
  { 
    areaCode: "101010600", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110112", 
    district: "通州", 
    nameEn: "Tongzhou", 
    pinyin: "tongzhou", 
    longitude: 116.658603, 
    latitude: 39.902486,
    bortleScale: 8
  },
  { 
    areaCode: "101010700", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110114", 
    district: "昌平", 
    nameEn: "Changping", 
    pinyin: "changping", 
    longitude: 116.235906, 
    latitude: 40.218085,
    bortleScale: 7
  },
  { 
    areaCode: "101010500", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110116", 
    district: "怀柔", 
    nameEn: "Huairou", 
    pinyin: "huairou", 
    longitude: 116.637122, 
    latitude: 40.324272,
    bortleScale: 6
  },
  { 
    areaCode: "101011500", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110117", 
    district: "平谷", 
    nameEn: "Pinggu", 
    pinyin: "pinggu", 
    longitude: 117.112335, 
    latitude: 40.144783,
    bortleScale: 6
  },
  { 
    areaCode: "101011300", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110118", 
    district: "密云", 
    nameEn: "Miyun", 
    pinyin: "miyun", 
    longitude: 116.843352, 
    latitude: 40.377362,
    bortleScale: 5
  },
  { 
    areaCode: "101010800", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110119", 
    district: "延庆", 
    nameEn: "Yanqing", 
    pinyin: "yanqing", 
    longitude: 115.985006, 
    latitude: 40.465325,
    bortleScale: 5
  },
  { 
    areaCode: "101011600", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110101", 
    district: "东城", 
    nameEn: "Dongcheng", 
    pinyin: "dongcheng", 
    longitude: 116.4227, 
    latitude: 39.9346,
    bortleScale: 9
  },
  { 
    areaCode: "101010300", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110105", 
    district: "朝阳", 
    nameEn: "Chaoyang", 
    pinyin: "chaoyang", 
    longitude: 116.4879, 
    latitude: 39.9516,
    bortleScale: 9
  },
  { 
    areaCode: "101010200", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110108", 
    district: "海淀", 
    nameEn: "Haidian", 
    pinyin: "haidian", 
    longitude: 116.3169, 
    latitude: 39.9995,
    bortleScale: 8
  },
  { 
    areaCode: "101010400", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110113", 
    district: "顺义", 
    nameEn: "Shunyi", 
    pinyin: "shunyi", 
    longitude: 116.6575, 
    latitude: 40.1335,
    bortleScale: 7
  },
  { 
    areaCode: "101011100", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110115", 
    district: "大兴", 
    nameEn: "Daxing", 
    pinyin: "daxing", 
    longitude: 116.3479, 
    latitude: 39.7329,
    bortleScale: 8
  },
  { 
    areaCode: "101010100", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110100", 
    district: "北京", 
    nameEn: "Beijing", 
    pinyin: "beijing", 
    longitude: 116.4033, 
    latitude: 39.9238,
    bortleScale: 9
  },
  { 
    areaCode: "101011700", 
    provinceCode: "110000", 
    province: "北京市", 
    cityCode: "110100", 
    city: "北京市", 
    districtCode: "110102", 
    district: "西城", 
    nameEn: "Xicheng", 
    pinyin: "xicheng", 
    longitude: 116.3723, 
    latitude: 39.9185,
    bortleScale: 9
  },
  
  // Tianjin locations
  { 
    areaCode: "101030800", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120101", 
    district: "和平区", 
    nameEn: "Heping District", 
    pinyin: "hepingqu", 
    longitude: 117.195907, 
    latitude: 39.118327,
    bortleScale: 9
  },
  { 
    areaCode: "101031200", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120102", 
    district: "河东区", 
    nameEn: "Hedong District", 
    pinyin: "hedongqu", 
    longitude: 117.226568, 
    latitude: 39.122125,
    bortleScale: 9
  },
  { 
    areaCode: "101031300", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120103", 
    district: "河西区", 
    nameEn: "Hexi District", 
    pinyin: "hexiqu", 
    longitude: 117.217536, 
    latitude: 39.101897,
    bortleScale: 9
  },
  { 
    areaCode: "101031500", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120104", 
    district: "南开区", 
    nameEn: "Nankai District", 
    pinyin: "nankaiqu", 
    longitude: 117.164143, 
    latitude: 39.120474,
    bortleScale: 9
  },
  { 
    areaCode: "101031600", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120105", 
    district: "河北区", 
    nameEn: "Hebei District", 
    pinyin: "hebeiqu", 
    longitude: 117.201569, 
    latitude: 39.156632,
    bortleScale: 9
  },
  { 
    areaCode: "101031700", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120106", 
    district: "红桥区", 
    nameEn: "Hongqiao District", 
    pinyin: "hongqiaoqu", 
    longitude: 117.163301, 
    latitude: 39.175066,
    bortleScale: 9
  },
  { 
    areaCode: "101030400", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120110", 
    district: "东丽区", 
    nameEn: "Dongli District", 
    pinyin: "dongliqu", 
    longitude: 117.313967, 
    latitude: 39.087764,
    bortleScale: 8
  },
  { 
    areaCode: "101030500", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120111", 
    district: "西青区", 
    nameEn: "Xiqing District", 
    pinyin: "xiqingqu", 
    longitude: 117.012247, 
    latitude: 39.139446,
    bortleScale: 8
  },
  { 
    areaCode: "101031000", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120112", 
    district: "津南区", 
    nameEn: "Jinnan District", 
    pinyin: "jinnanqu", 
    longitude: 117.382549, 
    latitude: 38.989577,
    bortleScale: 8
  },
  { 
    areaCode: "101030600", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120113", 
    district: "北辰区", 
    nameEn: "Beichen District", 
    pinyin: "beichenqu", 
    longitude: 117.13482, 
    latitude: 39.225555,
    bortleScale: 8
  },
  { 
    areaCode: "101030200", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120114", 
    district: "武清区", 
    nameEn: "Wuqing District", 
    pinyin: "wuqingqu", 
    longitude: 117.057959, 
    latitude: 39.376925,
    bortleScale: 7
  },
  { 
    areaCode: "101030300", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120115", 
    district: "宝坻区", 
    nameEn: "Baodi District", 
    pinyin: "baodiqu", 
    longitude: 117.308094, 
    latitude: 39.716965,
    bortleScale: 7
  },
  { 
    areaCode: "101031100", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120116", 
    district: "滨海新区", 
    nameEn: "Binhai New District", 
    pinyin: "binhaixinqu", 
    longitude: 117.654173, 
    latitude: 39.032846,
    bortleScale: 8
  },
  { 
    areaCode: "101030700", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120117", 
    district: "宁河区", 
    nameEn: "Ninghe District", 
    pinyin: "ninghequ", 
    longitude: 117.82828, 
    latitude: 39.328886,
    bortleScale: 6
  },
  { 
    areaCode: "101030100", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120100", 
    district: "天津", 
    nameEn: "Tianjin", 
    pinyin: "tianjin", 
    longitude: 117.208, 
    latitude: 39.091,
    bortleScale: 9
  },
  { 
    areaCode: "101030900", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120118", 
    district: "静海区", 
    nameEn: "Jinghai District", 
    pinyin: "jinghaiqu", 
    longitude: 116.925304, 
    latitude: 38.935671,
    bortleScale: 7
  },
  { 
    areaCode: "101031400", 
    provinceCode: "120000", 
    province: "天津市", 
    cityCode: "120100", 
    city: "天津市", 
    districtCode: "120119", 
    district: "蓟州区", 
    nameEn: "Jizhou District", 
    pinyin: "jizhouqu", 
    longitude: 117.407449, 
    latitude: 40.045342,
    bortleScale: 6
  },
  
  // Hebei province - Shijiazhuang city
  { 
    areaCode: "101090119", 
    provinceCode: "130000", 
    province: "河北省", 
    cityCode: "130100", 
    city: "石家庄市", 
    districtCode: "130102", 
    district: "长安区", 
    nameEn: "Chang'an District", 
    pinyin: "changanqu", 
    longitude: 114.548151, 
    latitude: 38.047501,
    bortleScale: 8
  },
  { 
    areaCode: "101090120", 
    provinceCode: "130000", 
    province: "河北省", 
    cityCode: "130100", 
    city: "石家庄市", 
    districtCode: "130104", 
    district: "桥西区", 
    nameEn: "Qiaoxi District", 
    pinyin: "qiaoxiqu", 
    longitude: 114.462931, 
    latitude: 38.028383,
    bortleScale: 8
  },
  { 
    areaCode: "101090121", 
    provinceCode: "130000", 
    province: "河北省", 
    cityCode: "130100", 
    city: "石家庄市", 
    districtCode: "130105", 
    district: "新华区", 
    nameEn: "Xinhua District", 
    pinyin: "Xinhuaqu", 
    longitude: 114.465974, 
    latitude: 38.067142,
    bortleScale: 8
  },
  { 
    areaCode: "101090101", 
    provinceCode: "130000", 
    province: "河北省", 
    cityCode: "130100", 
    city: "石家庄市", 
    districtCode: "130100", 
    district: "石家庄", 
    nameEn: "Shijiazhuang", 
    pinyin: "shijiazhuang", 
    longitude: 114.5214, 
    latitude: 38.0481,
    bortleScale: 8
  },
  
  // A few more major cities from different provinces
  // Langfang
  { 
    areaCode: "101090601", 
    provinceCode: "130000", 
    province: "河北省", 
    cityCode: "131000", 
    city: "廊坊市", 
    districtCode: "131000", 
    district: "廊坊", 
    nameEn: "Langfang", 
    pinyin: "langfang", 
    longitude: 116.704441, 
    latitude: 39.523927,
    bortleScale: 7
  },
  // Chengde
  { 
    areaCode: "101090402", 
    provinceCode: "130000", 
    province: "河北省", 
    cityCode: "130800", 
    city: "承德市", 
    districtCode: "130800", 
    district: "承德", 
    nameEn: "Chengde", 
    pinyin: "chengde", 
    longitude: 117.939152, 
    latitude: 40.976204,
    bortleScale: 6
  },
  // Zhangjiakou
  { 
    areaCode: "101090301", 
    provinceCode: "130000", 
    province: "河北省", 
    cityCode: "130700", 
    city: "张家口市", 
    districtCode: "130700", 
    district: "张家口", 
    nameEn: "Zhangjiakou", 
    pinyin: "zhangjiakou", 
    longitude: 114.884091, 
    latitude: 40.811901,
    bortleScale: 7
  },
  // Baoding
  { 
    areaCode: "101090201", 
    provinceCode: "130000", 
    province: "河北省", 
    cityCode: "130600", 
    city: "保定市", 
    districtCode: "130600", 
    district: "保定", 
    nameEn: "Baoding", 
    pinyin: "baoding", 
    longitude: 115.482331, 
    latitude: 38.867657,
    bortleScale: 7
  },
  // Tangshan
  { 
    areaCode: "101090501", 
    provinceCode: "130000", 
    province: "河北省", 
    cityCode: "130200", 
    city: "唐山市", 
    districtCode: "130200", 
    district: "唐山", 
    nameEn: "Tangshan", 
    pinyin: "tangshan", 
    longitude: 118.175393, 
    latitude: 39.635113,
    bortleScale: 7
  },
  // Qinhuangdao
  { 
    areaCode: "101091101", 
    provinceCode: "130000", 
    province: "河北省", 
    cityCode: "130300", 
    city: "秦皇岛市", 
    districtCode: "130300", 
    district: "秦皇岛", 
    nameEn: "Qinhuangdao", 
    pinyin: "qinhuangdao", 
    longitude: 119.586579, 
    latitude: 39.942531,
    bortleScale: 7
  },
  // Xiong'an New Area
  { 
    areaCode: "101091201", 
    provinceCode: "130000", 
    province: "河北省", 
    cityCode: "133100", 
    city: "雄安新区", 
    districtCode: "133100", 
    district: "雄安新区", 
    nameEn: "Xiong'an New Area", 
    pinyin: "xionganxinqu", 
    longitude: 115.913086, 
    latitude: 39.05016,
    bortleScale: 6
  }
];

/**
 * Helper function to get a location by its district name (Chinese or English)
 */
export function getLocationByDistrict(districtName: string): ChineseLocation | undefined {
  const lowerNameEn = districtName.toLowerCase();
  const nameMatch = chineseLocationDatabase.find(
    loc => 
      loc.district === districtName || 
      loc.nameEn.toLowerCase() === lowerNameEn ||
      loc.pinyin.toLowerCase() === lowerNameEn
  );
  return nameMatch;
}

/**
 * Helper function to get a location by its coordinates (approximate match)
 */
export function getLocationByCoordinates(
  latitude: number, 
  longitude: number, 
  radius: number = 0.05
): ChineseLocation | undefined {
  return chineseLocationDatabase.find(loc => {
    const latDiff = Math.abs(loc.latitude - latitude);
    const lonDiff = Math.abs(loc.longitude - longitude);
    return latDiff < radius && lonDiff < radius;
  });
}

/**
 * Get the Bortle scale for a specific Chinese location
 */
export function getLocationBortleScale(
  districtName: string | null, 
  latitude?: number, 
  longitude?: number
): number | null {
  // First try by district name if provided
  if (districtName) {
    const location = getLocationByDistrict(districtName);
    if (location?.bortleScale) {
      return location.bortleScale;
    }
  }
  
  // Then try by coordinates if provided
  if (latitude !== undefined && longitude !== undefined) {
    const location = getLocationByCoordinates(latitude, longitude);
    if (location?.bortleScale) {
      return location.bortleScale;
    }
  }
  
  return null;
}

export default chineseLocationDatabase;
