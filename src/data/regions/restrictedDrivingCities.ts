
/**
 * Chinese cities with driving restrictions
 * Data sourced from 限行城市列表.xlsx
 */

export interface DrivingRestriction {
  city: string;
  province: string;
  hasRestrictions: boolean;
  restrictionType?: string;
  restrictionDetails?: string;
  coordinates: [number, number];
}

export const restrictedDrivingCities: DrivingRestriction[] = [
  {
    city: "Beijing",
    province: "Beijing",
    hasRestrictions: true,
    restrictionType: "license plate",
    restrictionDetails: "Last digit rotation, Mon-Fri excluding holidays",
    coordinates: [39.9042, 116.4074]
  },
  {
    city: "Shanghai",
    province: "Shanghai",
    hasRestrictions: true,
    restrictionType: "license plate",
    restrictionDetails: "Non-local plates restricted on elevated roads",
    coordinates: [31.2304, 121.4737]
  },
  {
    city: "Guangzhou",
    province: "Guangdong",
    hasRestrictions: true,
    restrictionType: "license plate",
    restrictionDetails: "Last digit rotation, weekdays 7-9am, 5-7pm",
    coordinates: [23.1291, 113.2644]
  },
  {
    city: "Tianjin",
    province: "Tianjin",
    hasRestrictions: true,
    restrictionType: "license plate",
    restrictionDetails: "Last digit rotation, Mon-Fri excluding holidays",
    coordinates: [39.3434, 117.3616]
  },
  {
    city: "Xi'an",
    province: "Shaanxi",
    hasRestrictions: true,
    restrictionType: "license plate",
    restrictionDetails: "Last digit rotation, Mon-Fri 7am-8pm",
    coordinates: [34.3416, 108.9398]
  },
  {
    city: "Chengdu",
    province: "Sichuan",
    hasRestrictions: true,
    restrictionType: "license plate",
    restrictionDetails: "Last digit rotation, Mon-Fri 7:30am-8pm",
    coordinates: [30.5723, 104.0665]
  },
  {
    city: "Zhengzhou",
    province: "Henan",
    hasRestrictions: true,
    restrictionType: "license plate",
    restrictionDetails: "Last digit rotation, weekdays peak hours",
    coordinates: [34.7466, 113.6253]
  },
  {
    city: "Hangzhou",
    province: "Zhejiang",
    hasRestrictions: true,
    restrictionType: "license plate",
    restrictionDetails: "Last digit rotation, weekdays 7-9am, 4:30-6:30pm",
    coordinates: [30.2741, 120.1551]
  },
  {
    city: "Lanzhou",
    province: "Gansu",
    hasRestrictions: true,
    restrictionType: "license plate",
    restrictionDetails: "Last digit rotation, weekdays 7am-8pm",
    coordinates: [36.0617, 103.8318]
  },
  {
    city: "Guiyang",
    province: "Guizhou",
    hasRestrictions: true,
    restrictionType: "license plate",
    restrictionDetails: "Last digit rotation, weekdays 7-9am, 5-7pm",
    coordinates: [26.6470, 106.6302]
  },
  {
    city: "Kunming", 
    province: "Yunnan",
    hasRestrictions: true,
    restrictionType: "license plate",
    restrictionDetails: "Last digit rotation, weekdays 7-9am, 5-7pm",
    coordinates: [25.0470, 102.7101]
  },
  {
    city: "Nanchang",
    province: "Jiangxi",
    hasRestrictions: true,
    restrictionType: "license plate",
    restrictionDetails: "Last digit rotation, weekdays peak hours",
    coordinates: [28.6820, 115.8579]
  }
];
