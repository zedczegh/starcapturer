
// Helper functions for category and type translations
export function translateCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    "Hardware": "硬件",
    "Software": "软件",
    "Tutorial": "教程",
    "Data": "数据",
    "Map": "地图",
    "Weather": "气象",
    "Forum": "论坛",
    "Observatory": "天文台",
    "Beginner": "新手",
    "Resource": "资源",
    "Game": "游戏",
    "Mobile": "移动应用",
    "Community": "社区",
    // Location advantages translations
    "Low Light Pollution Region": "低光污染地区",
    "Low Air Pollution Region": "低空气污染地区",
    "Lodging available": "可住宿",
    "Stable and Low Wind Gusts": "风力稳定且小",
    "High Annual Clear Nights Rate(>100 Days a year)": "高年晴朗夜晚率(>100天/年)",
    "Far enough away from waters": "远离水域",
    "Good Viewing Conditions": "良好的观测条件",
    "Parking available": "有停车场",
    "Well-paved roads to location": "通往该地点的道路铺设良好",
    "No local interruptions": "无局部干扰",
    "Hard Soil or Concrete floor": "坚硬的土壤或混凝土地面"
  };
  return categoryMap[category] || category;
}

export function translateType(type: string): string {
  const typeMap: Record<string, string> = {
    "Plugin": "插件",
    "Tutorial": "教程",
    "Map": "地图",
    "Weather": "气象",
    "Tool": "工具",
    "Light Pollution": "光污染",
    "Database": "数据库",
    "Forum": "论坛",
    "Rental": "租赁",
    "Freezing Camera": "冷冻相机",
    "Telescope": "望远镜",
    "Simulator": "模拟器",
    "Resource": "资源",
    "DIY": "DIY",
    "Review": "测评",
    "Open Source": "开源项目",
    "Gallery": "欣赏",
    "App": "应用",
    "Software": "软件",
    "Space Weather": "太空天气",
    // Location types translations
    "National/Academic Observatory": "国家/学术天文台",
    "Personal Observatory": "个人天文台",
    "Personal Favorite Observation Point": "个人最喜欢的观测点",
    "Favored Observation Point of local hobby groups": "当地爱好者团体喜爱的观测点",
    "Star Party venue": "星空派对场地",
    "Regular Camping Site": "常规露营地",
    "Astro Lodging": "天文住宿"
  };
  return typeMap[type] || type;
}

// Profile tags translations
export function translateProfileTag(tag: string): string {
  const tagMap: Record<string, string> = {
    "Professional Astronomer": "专业天文学家",
    "Amateur Astronomer": "业余天文学家",
    "Astrophotographer": "天体摄影师",
    "Meteorology Enthusiast": "气象爱好者",
    "Cosmos Lover": "宇宙爱好者",
    "Traveler": "旅行者",
    "Dark Sky Volunteer": "暗夜志愿者",
    "Nebulae Observer": "星云观测员",
    "Astronomy Student": "天文学学生",
    "Planet Watcher": "行星观察者",
    "Telescope Maker": "望远镜制造者",
    "Star Gazer": "观星者"
  };
  return tagMap[tag] || tag;
}
