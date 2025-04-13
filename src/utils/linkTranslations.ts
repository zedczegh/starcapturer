
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
    "Community": "社区"
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
    "Space Weather": "太空天气"
  };
  return typeMap[type] || type;
}
