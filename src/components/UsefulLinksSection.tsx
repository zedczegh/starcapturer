
import React, { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Globe, BookOpen, Camera, Computer, Database } from "lucide-react";

interface Link {
  id: string;
  category: string;
  subcategory: string;
  name: string;
  name_zh: string;
  url: string;
  description?: string;
  description_zh?: string;
}

const UsefulLinksSection = () => {
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Define all the links data
  const linksData: Link[] = useMemo(() => [
    // NINA
    {
      id: "nina-1",
      category: "software",
      subcategory: "tutorial",
      name: "NINA Tutorials",
      name_zh: "NINA精细测量回差并设置电调参数",
      url: "https://istarshooter.com/article/detail/73"
    },
    // PixInsight software
    {
      id: "pixinsight-1",
      category: "software",
      subcategory: "software",
      name: "PixInsight",
      name_zh: "PixInsight",
      url: "https://www.pixinsight.com/"
    },
    // PixInsight plugins
    {
      id: "pixinsight-2",
      category: "software",
      subcategory: "plugin",
      name: "PixInsight Workflows-chaoticnebula",
      name_zh: "PixInsight Workflows-chaoticnebula",
      url: "https://chaoticnebula.com/pixinsight-lrgb-workflow/"
    },
    {
      id: "pixinsight-3",
      category: "software",
      subcategory: "plugin",
      name: "Cosmic Photons – Astrophotography",
      name_zh: "Cosmic Photons – Astrophotography",
      url: "https://cosmicphotons.com/"
    },
    {
      id: "pixinsight-4",
      category: "software",
      subcategory: "plugin",
      name: "Astronomy Software - The Backyard Astronomy Space",
      name_zh: "Astronomy Software - The Backyard Astronomy Space",
      url: "https://www.backyardastro.org/forum/17-astronomy-software/"
    },
    {
      id: "pixinsight-5",
      category: "software",
      subcategory: "plugin",
      name: "AstroProcessing: NSG, PMM apps",
      name_zh: "AstroProcessing: NSG, PMM apps",
      url: "https://www.astroprocessing.com/"
    },
    {
      id: "pixinsight-6",
      category: "software",
      subcategory: "plugin",
      name: "PixInsight-Scripts / Toolbox",
      name_zh: "PixInsight-Scripts / Toolbox",
      url: "https://gitlab.com/pixinsight-scripts/toolbox"
    },
    {
      id: "pixinsight-7",
      category: "software",
      subcategory: "plugin",
      name: "New Foraxx script for PixInsight",
      name_zh: "New Foraxx script for PixInsight",
      url: "https://www.astroworldcreations.com/news/new-foraxx-script-for-pixinsight"
    },
    {
      id: "pixinsight-8",
      category: "software",
      subcategory: "plugin",
      name: "pixinsight scripts — Seti Astro",
      name_zh: "pixinsight scripts — Seti Astro",
      url: "https://www.setiastro.com/pjsr-scripts"
    },
    {
      id: "pixinsight-9",
      category: "software",
      subcategory: "plugin",
      name: "PixInsight Toolbox",
      name_zh: "PixInsight Toolbox",
      url: "https://www.ideviceapps.de/pixinsight-toolbox.html"
    },
    {
      id: "pixinsight-10",
      category: "software",
      subcategory: "plugin",
      name: "GHS Stretch",
      name_zh: "GHS拉伸",
      url: "https://github.com/mikec1485/GHS"
    },
    {
      id: "pixinsight-11",
      category: "software",
      subcategory: "plugin",
      name: "RC Astro Suite",
      name_zh: "RC三件套",
      url: "https://www.rc-astro.com/"
    },
    {
      id: "pixinsight-12",
      category: "software",
      subcategory: "plugin",
      name: "Herbert Walter PixInsight Scripts",
      name_zh: "Herbert Walter PixInsight Scripts",
      url: "https://www.skypixels.at/pixinsight_scripts.html"
    },
    // PixInsight tutorials
    {
      id: "pixinsight-13",
      category: "software",
      subcategory: "tutorial",
      name: "Adam Block Studios",
      name_zh: "Adam Block Studios",
      url: "https://www.adamblockstudios.com/"
    },
    {
      id: "pixinsight-14",
      category: "software",
      subcategory: "tutorial",
      name: "Fernando Yang's Website",
      name_zh: "肥尔腩多的主站",
      url: "https://fernandoyang.pt/"
    },
    {
      id: "pixinsight-15",
      category: "software",
      subcategory: "tutorial",
      name: "PixInsight Deep Space King Tutorials",
      name_zh: "深空之王PixInsight教程",
      url: "https://space.bilibili.com/244743682/lists/467029?type=season"
    },
    // Maps
    {
      id: "map-1",
      category: "maps",
      subcategory: "satellite",
      name: "Satellite Map",
      name_zh: "satellitemap卫星地图",
      url: "https://satellitemap.space/?constellation=starlink"
    },
    {
      id: "map-2",
      category: "maps",
      subcategory: "skymap",
      name: "China-VO SkyView",
      name_zh: "China-VO SkyView",
      url: "https://nadc.china-vo.org/skyview/"
    },
    {
      id: "map-3",
      category: "maps",
      subcategory: "skymap",
      name: "Stellarium Web Online Planetarium",
      name_zh: "虚拟天文馆在线地图",
      url: "https://stellarium-web.org/"
    },
    {
      id: "map-4",
      category: "maps",
      subcategory: "skymap",
      name: "Online Star Maps",
      name_zh: "Online Star Maps",
      url: "https://theskylive.com/planetarium?obj=2024pt5#ra|15.79058679773252|dec|73.00498667294666|fov|80"
    },
    // Weather
    {
      id: "weather-1",
      category: "weather",
      subcategory: "weather",
      name: "Windy",
      name_zh: "windy",
      url: "https://www.windy.com"
    },
    {
      id: "weather-2",
      category: "weather",
      subcategory: "weather",
      name: "China Meteorological Administration Typhoon Network",
      name_zh: "中央气象台台风网",
      url: "http://typhoon.nmc.cn/web.html"
    },
    // Data and Tools
    {
      id: "data-1",
      category: "data",
      subcategory: "tool",
      name: "Calculate SNR",
      name_zh: "计算SNR信噪比",
      url: "https://deepskydetail.shinyapps.io/Calculate_SNR/"
    },
    {
      id: "data-2",
      category: "data",
      subcategory: "tool",
      name: "Astronomy Tools",
      name_zh: "天文工具网",
      url: "https://astronomy.tools/"
    },
    {
      id: "data-3",
      category: "data",
      subcategory: "lightpollution",
      name: "Dark Sky Map",
      name_zh: "darkskymap-光污染地图",
      url: "https://www.darkskymap.com/map"
    },
    {
      id: "data-4",
      category: "data",
      subcategory: "lightpollution",
      name: "Light Pollution Map",
      name_zh: "光污染地图",
      url: "https://www.lightpollutionmap.info/"
    },
    {
      id: "data-5",
      category: "data",
      subcategory: "photography",
      name: "Open datasets – Erellaz",
      name_zh: "拍摄数据",
      url: "https://erellaz.com/moana/open-datasets/"
    },
    {
      id: "data-6",
      category: "data",
      subcategory: "weather",
      name: "Historical Weather Query",
      name_zh: "历史天气查询",
      url: "https://lishi.tianqi.com/"
    },
    {
      id: "data-7",
      category: "data",
      subcategory: "weather",
      name: "OpenWeatherMap",
      name_zh: "OpenWeatherMap",
      url: "https://openweathermap.org/api"
    },
    {
      id: "data-8",
      category: "data",
      subcategory: "database",
      name: "Major Domestic and Foreign Astronomical Data Centers",
      name_zh: "国内外主要天文数据中心",
      url: "https://astro.bnu.edu.cn/Computational_Astronomy/html/7ziyuan/1canshu/canshu.htm"
    },
    {
      id: "data-9",
      category: "data",
      subcategory: "database",
      name: "National Astronomical Data Center",
      name_zh: "国家天文科学数据中心",
      url: "https://nadc.china-vo.org/data/"
    },
    // Forums
    {
      id: "forum-1",
      category: "forum",
      subcategory: "forum",
      name: "Mufu Network",
      name_zh: "牧夫网",
      url: "https://bbs.imufu.cn/"
    },
    {
      id: "forum-2",
      category: "forum",
      subcategory: "forum",
      name: "PixInsight Official Community",
      name_zh: "PixInsight官方社区",
      url: "https://pixinsight.com/forum/index.php"
    },
    // Observatory
    {
      id: "observatory-1",
      category: "observatory",
      subcategory: "rental",
      name: "Telescope Live Observatory Rental",
      name_zh: "Telescope Live天文台租赁",
      url: "https://app.telescope.live/login"
    },
    // Beginner
    {
      id: "beginner-1",
      category: "beginner",
      subcategory: "tutorial",
      name: "QHYCCD Astrophotography Station",
      name_zh: "QHYCCD天文摄影小站",
      url: "https://www.bilibili.com/opus/679310616214634529?spm_id_from=333.999.0.0"
    },
    {
      id: "beginner-2",
      category: "beginner",
      subcategory: "tutorial",
      name: "Bringing Billions of Kilometers Closer! What Can Ordinary People Photograph with an Astronomical Telescope?",
      name_zh: "拉近几十亿公里！普通人用天文望远镜能拍到什么？",
      url: "https://www.bilibili.com/video/BV1y84y147YW/?spm_id_from=333.1387.favlist.content.click"
    },
    // Hardware
    {
      id: "hardware-1",
      category: "hardware",
      subcategory: "camera",
      name: "QHYCCD",
      name_zh: "QHYCCD",
      url: "https://www.qhyccd.cn/"
    },
    {
      id: "hardware-2",
      category: "hardware",
      subcategory: "camera",
      name: "ToupTek Astronomy",
      name_zh: "图谱天文",
      url: "https://www.touptek-astro.com.cn/"
    },
    {
      id: "hardware-3",
      category: "hardware",
      subcategory: "camera",
      name: "ZWO",
      name_zh: "fkzwo",
      url: "https://www.zwoastro.cn/"
    },
    {
      id: "hardware-4",
      category: "hardware",
      subcategory: "telescope",
      name: "SharpStar Optics",
      name_zh: "锐星光学",
      url: "https://www.sharpstar-optics.com/"
    },
    {
      id: "hardware-5",
      category: "hardware",
      subcategory: "telescope",
      name: "Yuzhong Optics",
      name_zh: "裕众光学",
      url: "http://www.sky-rover.cn/projectlist.asp?LarCode=%D4%CB%B6%AF-%B4%F3%D0%CD%CB%AB%CD%B2%CD%FB%D4%B6%BE%B5&Midcode=%B4%F3%D0%CD%CB%AB%CD%B2%CD%FB%D4%B6%BE%B5"
    },
    {
      id: "hardware-6",
      category: "hardware",
      subcategory: "telescope",
      name: "Sky-Watcher",
      name_zh: "Sky-Watcher",
      url: "https://www.skywatcher.com/"
    },
    // Games
    {
      id: "game-1",
      category: "game",
      subcategory: "simulator",
      name: "SPACEX International Space Station Docking Simulator",
      name_zh: "SPACEX 国际空间站对接模拟器",
      url: "https://iss-sim.spacex.com/"
    },
    // Resources
    {
      id: "resource-1",
      category: "resource",
      subcategory: "map",
      name: "Stellarium",
      name_zh: "虚拟天文馆",
      url: "https://stellarium.org/"
    },
    {
      id: "resource-2",
      category: "resource",
      subcategory: "resource",
      name: "Siril Post-processing Software",
      name_zh: "siril后期软件",
      url: "https://siril.org/"
    },
    {
      id: "resource-3",
      category: "resource",
      subcategory: "resource",
      name: "Siril Tutorials",
      name_zh: "siril教程",
      url: "https://siril.org/tutorials/"
    },
    {
      id: "resource-4",
      category: "resource",
      subcategory: "diy",
      name: "Portable Display with Power Bank Function",
      name_zh: "带充电宝功能的便携显示器",
      url: "https://github.com/peng-zhihui/PocketLCD"
    },
    {
      id: "resource-5",
      category: "resource",
      subcategory: "review",
      name: "Filter Comparison",
      name_zh: "滤镜比较",
      url: "https://www.researchgate.net/profile/James-Thompson-32"
    },
    {
      id: "resource-6",
      category: "resource",
      subcategory: "tutorial",
      name: "PC Mobile Hotspot",
      name_zh: "PC移动热点",
      url: "https://blog.csdn.net/qq_36349997/article/details/140780453"
    },
    {
      id: "resource-7",
      category: "resource",
      subcategory: "opensource",
      name: "QHYCCD-QUARCS",
      name_zh: "QHYCCD-QUARCS",
      url: "https://github.com/QHYCCD-QUARCS"
    },
    {
      id: "resource-8",
      category: "resource",
      subcategory: "gallery",
      name: "ESA/Hubble Images",
      name_zh: "ESA/Hubble图片",
      url: "https://esahubble.org/images/"
    },
    {
      id: "resource-9",
      category: "resource",
      subcategory: "gallery",
      name: "Jet Propulsion Laboratory",
      name_zh: "喷气推进实验室",
      url: "https://www.spitzer.caltech.edu/images"
    },
    {
      id: "resource-10",
      category: "resource",
      subcategory: "gallery",
      name: "High Resolution Imaging Science Experiment",
      name_zh: "高分辨率成像科学实验",
      url: "https://www.uahirise.org/"
    },
    {
      id: "resource-11",
      category: "resource",
      subcategory: "gallery",
      name: "In-The-Sky.org",
      name_zh: "In-The-Sky.org",
      url: "https://in-the-sky.org/"
    },
    {
      id: "resource-12",
      category: "resource",
      subcategory: "resource",
      name: "Nighttime Imaging 'N' Astronomy",
      name_zh: "Nighttime Imaging 'N' Astronomy",
      url: "https://nighttime-imaging.eu/"
    },
    {
      id: "resource-13",
      category: "resource",
      subcategory: "resource",
      name: "TheSky Astronomy Software",
      name_zh: "TheSky Astronomy Software",
      url: "https://www.bisque.com/product-category/software/"
    },
    {
      id: "resource-14",
      category: "resource",
      subcategory: "resource",
      name: "Astroberry Server",
      name_zh: "Astroberry Server",
      url: "https://www.astroberry.io/"
    }
  ], []);
  
  // Filter links based on search term and active tab
  const filteredLinks = useMemo(() => {
    return linksData.filter(link => {
      const searchMatch = searchTerm.trim() === "" || 
        (language === 'en' ? link.name.toLowerCase() : link.name_zh.toLowerCase())
          .includes(searchTerm.toLowerCase()) ||
        link.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.subcategory.toLowerCase().includes(searchTerm.toLowerCase());
      
      const tabMatch = activeTab === "all" || link.category === activeTab;
      
      return searchMatch && tabMatch;
    });
  }, [linksData, searchTerm, activeTab, language]);
  
  // Get categories for tabs
  const categories = useMemo(() => {
    const cats = ["all", ...new Set(linksData.map(link => link.category))];
    return cats.map(cat => ({
      value: cat,
      label: t(
        cat.charAt(0).toUpperCase() + cat.slice(1), 
        translateCategory(cat)
      )
    }));
  }, [linksData, t]);
  
  // Helper function to translate category names to Chinese
  function translateCategory(category: string): string {
    switch (category) {
      case "all": return "全部";
      case "software": return "软件";
      case "maps": return "地图";
      case "weather": return "气象";
      case "data": return "数据";
      case "forum": return "论坛";
      case "observatory": return "天文台";
      case "beginner": return "新手";
      case "hardware": return "硬件";
      case "game": return "游戏";
      case "resource": return "资源";
      default: return category;
    }
  }
  
  // Helper function to get icon for each category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "software": return <Computer className="h-4 w-4" />;
      case "maps": return <Globe className="h-4 w-4" />;
      case "weather": return <div className="h-4 w-4">🌦️</div>;
      case "data": return <Database className="h-4 w-4" />;
      case "forum": return <div className="h-4 w-4">💬</div>;
      case "observatory": return <div className="h-4 w-4">🔭</div>;
      case "beginner": return <BookOpen className="h-4 w-4" />;
      case "hardware": return <Camera className="h-4 w-4" />;
      case "game": return <div className="h-4 w-4">🎮</div>;
      case "resource": return <div className="h-4 w-4">📚</div>;
      default: return <div className="h-4 w-4">🔗</div>;
    }
  };
  
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{t("Useful Links", "实用链接")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("Search links...", "搜索链接...")}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Category tabs */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full overflow-x-auto flex flex-nowrap justify-start h-auto py-1">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.value}
                  value={category.value}
                  className="px-3 py-1.5 text-xs whitespace-nowrap flex-shrink-0"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 p-2 rounded-md hover:bg-cosmic-800/20 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5 bg-cosmic-800/30 w-6 h-6 rounded-full flex items-center justify-center">
                      {getCategoryIcon(link.category)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium flex items-center gap-1">
                        {language === 'en' ? link.name : link.name_zh}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t(link.subcategory, translateSubcategory(link.subcategory))}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              
              {filteredLinks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {t("No links found", "未找到链接")}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to translate subcategory names to Chinese
function translateSubcategory(subcategory: string): string {
  switch (subcategory) {
    case "software": return "软件";
    case "plugin": return "插件";
    case "tutorial": return "教程";
    case "satellite": return "卫星";
    case "skymap": return "星图";
    case "weather": return "气象";
    case "tool": return "工具";
    case "lightpollution": return "光污染";
    case "photography": return "摄影";
    case "database": return "数据库";
    case "forum": return "论坛";
    case "rental": return "租赁";
    case "camera": return "相机";
    case "telescope": return "望远镜";
    case "simulator": return "模拟器";
    case "map": return "地图";
    case "resource": return "资源";
    case "diy": return "DIY";
    case "review": return "测评";
    case "opensource": return "开源项目";
    case "gallery": return "图库";
    default: return subcategory;
  }
}

export default UsefulLinksSection;
