import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NavBar from "@/components/NavBar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Globe, Star, Moon, CloudRain, Wind, Thermometer, Award, Check } from "lucide-react";

const AboutSIQS = () => {
  const { t, language } = useLanguage();
  
  // Organize resources by category for better presentation
  const resources = {
    darkSky: [
      { 
        category: language === 'en' ? "International Dark-Sky Association" : "国际暗夜协会", 
        subcategory: language === 'en' ? "Official" : "官方", 
        name: language === 'en' ? "IDA Official Website" : "IDA官方网站", 
        url: "https://www.darksky.org/" 
      },
      { 
        category: language === 'en' ? "International Dark-Sky Association" : "国际暗夜协会", 
        subcategory: language === 'en' ? "Resources" : "资源", 
        name: language === 'en' ? "Find an International Dark Sky Place" : "查找国际暗夜地点", 
        url: "https://www.darksky.org/our-work/conservation/idsp/finder/" 
      },
      { 
        category: language === 'en' ? "International Dark-Sky Association" : "国际暗夜协会", 
        subcategory: language === 'en' ? "Education" : "教育", 
        name: language === 'en' ? "Light Pollution Effects on Wildlife and Ecosystems" : "光污染对野生动物和生态系统的影响", 
        url: "https://www.darksky.org/light-pollution/wildlife/" 
      },
      { 
        category: language === 'en' ? "International Dark-Sky Association" : "国际暗夜协会", 
        subcategory: language === 'en' ? "Education" : "教育", 
        name: language === 'en' ? "Lighting Basics" : "照明基础知识", 
        url: "https://www.darksky.org/our-work/lighting/lighting-basics/" 
      },
      { 
        category: language === 'en' ? "International Dark-Sky Association" : "国际暗夜协会", 
        subcategory: language === 'en' ? "Resources" : "资源", 
        name: language === 'en' ? "IDA Dark Sky Places Program" : "IDA暗夜地点计划", 
        url: "https://www.darksky.org/our-work/conservation/idsp/" 
      },
      { 
        category: language === 'en' ? "Conservation" : "保护", 
        subcategory: language === 'en' ? "Resources" : "资源", 
        name: language === 'en' ? "Dark Sky Reserve Guidelines" : "暗夜保护区指南", 
        url: "https://www.darksky.org/our-work/conservation/idsp/reserves/" 
      },
      { 
        category: language === 'en' ? "Conservation" : "保护", 
        subcategory: language === 'en' ? "Resources" : "资源", 
        name: language === 'en' ? "Dark Sky Park Guidelines" : "暗夜公园指南", 
        url: "https://www.darksky.org/our-work/conservation/idsp/parks/" 
      },
      { 
        category: language === 'en' ? "Conservation" : "保护", 
        subcategory: language === 'en' ? "Resources" : "资源", 
        name: language === 'en' ? "Dark Sky Sanctuary Guidelines" : "暗夜保护区指南", 
        url: "https://www.darksky.org/our-work/conservation/idsp/sanctuaries/" 
      }
    ],
    software: [
      { 
        category: "NINA", 
        subcategory: language === 'en' ? "Tutorials" : "教程", 
        name: language === 'en' ? "NINA Precise Backlash Measurement and Electronic Adjustment" : "NINA精细测量回差并设置电调参数", 
        url: "https://istarshooter.com/article/detail/73" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Software" : "软件", 
        name: "PixInsight", 
        url: "https://www.pixinsight.com/" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Plugins" : "插件", 
        name: "PixInsight Workflows-chaoticnebula", 
        url: "https://chaoticnebula.com/pixinsight-lrgb-workflow/" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Plugins" : "插件", 
        name: "Cosmic Photons – Astrophotography", 
        url: "https://cosmicphotons.com/" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Plugins" : "插件", 
        name: language === 'en' ? "Astronomy Software - The Backyard Astronomy Space" : "天文软件 - 后院天文空间", 
        url: "https://www.backyardastro.org/forum/17-astronomy-software/" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Plugins" : "插件", 
        name: language === 'en' ? "AstroProcessing: NSG, PMM apps" : "天文处理: NSG, PMM 应用", 
        url: "https://www.astroprocessing.com/" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Plugins" : "插件", 
        name: "PixInsight-Scripts / Toolbox", 
        url: "https://gitlab.com/pixinsight-scripts/toolbox" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Plugins" : "插件", 
        name: language === 'en' ? "New Foraxx script for PixInsight" : "PixInsight的新Foraxx脚本", 
        url: "https://www.astroworldcreations.com/news/new-foraxx-script-for-pixinsight" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Plugins" : "插件", 
        name: "pixinsight scripts — Seti Astro", 
        url: "https://www.setiastro.com/pjsr-scripts" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Plugins" : "插件", 
        name: "PixInsight Toolbox", 
        url: "https://www.ideviceapps.de/pixinsight-toolbox.html" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Plugins" : "插件", 
        name: language === 'en' ? "GHS Stretching" : "GHS拉伸", 
        url: "https://github.com/mikec1485/GHS" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Plugins" : "插件", 
        name: language === 'en' ? "RC Three-piece Set" : "RC三件套", 
        url: "https://www.rc-astro.com/" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Plugins" : "插件", 
        name: "Herbert Walter PixInsight Scripts", 
        url: "https://www.skypixels.at/pixinsight_scripts.html" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Tutorials" : "教程", 
        name: "Adam Block Studios", 
        url: "https://www.adamblockstudios.com/" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Tutorials" : "教程", 
        name: language === 'en' ? "Fernando Yang's Main Site" : "肥尔腩多的主站", 
        url: "https://fernandoyang.pt/" 
      },
      { 
        category: "PixInsight", 
        subcategory: language === 'en' ? "Tutorials" : "教程", 
        name: language === 'en' ? "Deep Space King PixInsight Tutorials" : "深空之王PixInsight教程", 
        url: "https://space.bilibili.com/244743682/lists/467029?type=season" 
      }
    ],
    maps: [
      { 
        category: language === 'en' ? "Maps" : "地图", 
        subcategory: language === 'en' ? "Satellite" : "卫星", 
        name: language === 'en' ? "Satellite Map" : "satellitemap卫星地图", 
        url: "https://satellitemap.space/?constellation=starlink" 
      },
      { 
        category: language === 'en' ? "Maps" : "地图", 
        subcategory: language === 'en' ? "Star Charts" : "星图", 
        name: "China-VO SkyView", 
        url: "https://nadc.china-vo.org/skyview/" 
      },
      { 
        category: language === 'en' ? "Maps" : "地图", 
        subcategory: language === 'en' ? "Star Charts" : "星图", 
        name: language === 'en' ? "Virtual Observatory Online Map" : "虚拟天文馆在线地图", 
        url: "https://stellarium-web.org/" 
      },
      { 
        category: language === 'en' ? "Maps" : "地图", 
        subcategory: language === 'en' ? "Star Charts" : "星图", 
        name: "Online Star Maps", 
        url: "https://theskylive.com/planetarium?obj=2024pt5#ra|15.79058679773252|dec|73.00498667294666|fov|80" 
      }
    ],
    weather: [
      { 
        category: language === 'en' ? "Weather" : "气象", 
        subcategory: language === 'en' ? "Weather" : "气象", 
        name: "Windy", 
        url: "https://www.windy.com" 
      },
      { 
        category: language === 'en' ? "Weather" : "气象", 
        subcategory: language === 'en' ? "Weather" : "气象", 
        name: language === 'en' ? "China Meteorological Administration Typhoon Network" : "中央气象台台风网", 
        url: "http://typhoon.nmc.cn/web.html" 
      }
    ],
    data: [
      { 
        category: language === 'en' ? "Data" : "数据", 
        subcategory: language === 'en' ? "Tools" : "工具", 
        name: language === 'en' ? "Calculate SNR (Signal-to-Noise Ratio)" : "计算SNR信噪比", 
        url: "https://deepskydetail.shinyapps.io/Calculate_SNR/" 
      },
      { 
        category: language === 'en' ? "Data" : "数据", 
        subcategory: language === 'en' ? "Tools" : "工具", 
        name: language === 'en' ? "Astronomy Tools Website" : "天文工具网", 
        url: "https://astronomy.tools/" 
      },
      { 
        category: language === 'en' ? "Data" : "数据", 
        subcategory: language === 'en' ? "Light Pollution" : "光污染", 
        name: language === 'en' ? "Dark Sky Map - Light Pollution Map" : "darkskymap-光污染地图", 
        url: "https://www.darkskymap.com/map" 
      },
      { 
        category: language === 'en' ? "Data" : "数据", 
        subcategory: language === 'en' ? "Light Pollution" : "光污染", 
        name: language === 'en' ? "Light Pollution Map" : "光污染地图", 
        url: "https://www.lightpollutionmap.info/" 
      },
      { 
        category: language === 'en' ? "Data" : "数据", 
        subcategory: language === 'en' ? "Imaging Data" : "拍摄数据", 
        name: language === 'en' ? "Open Datasets – Erellaz" : "开放数据集 – Erellaz", 
        url: "https://erellaz.com/moana/open-datasets/" 
      },
      { 
        category: language === 'en' ? "Data" : "数据", 
        subcategory: language === 'en' ? "Weather" : "气象", 
        name: language === 'en' ? "Historical Weather Query" : "历史天气查询", 
        url: "https://lishi.tianqi.com/" 
      },
      { 
        category: language === 'en' ? "Data" : "数据", 
        subcategory: language === 'en' ? "Weather" : "气象", 
        name: "OpenWeatherMap", 
        url: "https://openweathermap.org/api" 
      },
      { 
        category: language === 'en' ? "Data" : "数据", 
        subcategory: language === 'en' ? "Database" : "数据库", 
        name: language === 'en' ? "Major Astronomical Data Centers Domestic and International" : "国内外主要天文数据中心", 
        url: "https://astro.bnu.edu.cn/Computational_Astronomy/html/7ziyuan/1canshu/canshu.htm" 
      },
      { 
        category: language === 'en' ? "Data" : "数据", 
        subcategory: language === 'en' ? "Database" : "数据库", 
        name: language === 'en' ? "National Astronomical Science Data Center" : "国家天文科学数据中心", 
        url: "https://nadc.china-vo.org/data/" 
      }
    ],
    forums: [
      { 
        category: language === 'en' ? "Astronomy Forums" : "天文论坛", 
        subcategory: language === 'en' ? "Forums" : "论坛", 
        name: language === 'en' ? "Mufu Network" : "牧夫网", 
        url: "https://bbs.imufu.cn/" 
      },
      { 
        category: language === 'en' ? "Astronomy Forums" : "天文论坛", 
        subcategory: language === 'en' ? "Forums" : "论坛", 
        name: language === 'en' ? "PixInsight Official Community" : "PixInsight官方社区", 
        url: "https://pixinsight.com/forum/index.php" 
      }
    ],
    observatories: [
      { 
        category: language === 'en' ? "Observatories" : "天文台", 
        subcategory: language === 'en' ? "Rental" : "租赁", 
        name: language === 'en' ? "Telescope Live Observatory Rental" : "Telescope Live天文台租赁", 
        url: "https://app.telescope.live/login" 
      }
    ],
    beginners: [
      { 
        category: language === 'en' ? "Beginners" : "新手", 
        subcategory: language === 'en' ? "Tutorials" : "教程", 
        name: language === 'en' ? "QHYCCD Astrophotography Station" : "QHYCCD天文摄影小站", 
        url: "https://www.bilibili.com/opus/679310616214634529?spm_id_from=333.999.0.0" 
      },
      { 
        category: language === 'en' ? "Beginners" : "新手", 
        subcategory: language === 'en' ? "Tutorials" : "教程", 
        name: language === 'en' ? "Bringing Billions of Kilometers Closer! What Can Ordinary People Photograph with a Telescope?" : "拉近几十亿公里！普通人用天文望远镜能拍到什么？", 
        url: "https://www.bilibili.com/video/BV1y84y147YW/?spm_id_from=333.1387.favlist.content.click" 
      }
    ],
    hardware: [
      { 
        category: language === 'en' ? "Hardware" : "硬件", 
        subcategory: language === 'en' ? "Cooled Cameras" : "冷冻相机", 
        name: "QHYCCD", 
        url: "https://www.qhyccd.cn/" 
      },
      { 
        category: language === 'en' ? "Hardware" : "硬件", 
        subcategory: language === 'en' ? "Cooled Cameras" : "冷冻相机", 
        name: language === 'en' ? "ToupTek Astronomy" : "图谱天文", 
        url: "https://www.touptek-astro.com.cn/" 
      },
      { 
        category: language === 'en' ? "Hardware" : "硬件", 
        subcategory: language === 'en' ? "Cooled Cameras" : "冷冻相机", 
        name: language === 'en' ? "ZWO" : "ZWO", 
        url: "https://www.zwoastro.cn/" 
      },
      { 
        category: language === 'en' ? "Hardware" : "硬件", 
        subcategory: language === 'en' ? "Telescopes" : "望远镜", 
        name: language === 'en' ? "SharpStar Optics" : "锐星光学", 
        url: "https://www.sharpstar-optics.com/" 
      },
      { 
        category: language === 'en' ? "Hardware" : "硬件", 
        subcategory: language === 'en' ? "Telescopes" : "望远镜", 
        name: language === 'en' ? "Sky-Rover Optics" : "裕众光学", 
        url: "http://www.sky-rover.cn/projectlist.asp?LarCode=%D4%CB%B6%AF-%B4%F3%D0%CD%CB%AB%CD%B2%CD%FB%D4%B6%BE%B5&Midcode=%B4%F3%D0%CD%CB%AB%CD%B2%CD%FB%D4%B6%BE%B5" 
      },
      { 
        category: language === 'en' ? "Hardware" : "硬件", 
        subcategory: language === 'en' ? "Telescopes" : "望远镜", 
        name: "Sky-Watcher", 
        url: "https://www.skywatcher.com/" 
      }
    ],
    games: [
      { 
        category: language === 'en' ? "Games" : "游戏", 
        subcategory: language === 'en' ? "Simulators" : "模拟器", 
        name: language === 'en' ? "SPACEX International Space Station Docking Simulator" : "SPACEX 国际空间站对接模拟器", 
        url: "https://iss-sim.spacex.com/" 
      }
    ],
    resources: [
      { 
        category: language === 'en' ? "Resources" : "资源", 
        subcategory: language === 'en' ? "Maps" : "地图", 
        name: language === 'en' ? "Stellarium" : "虚拟天文馆", 
        url: "https://stellarium.org/" 
      },
      { 
        category: language === 'en' ? "Resources" : "资源", 
        subcategory: language === 'en' ? "Resources" : "资源", 
        name: language === 'en' ? "Siril Post-processing Software" : "siril后期软件", 
        url: "https://siril.org/" 
      },
      { 
        category: language === 'en' ? "Resources" : "资源", 
        subcategory: language === 'en' ? "Resources" : "资源", 
        name: language === 'en' ? "Siril Tutorials" : "siril教程", 
        url: "https://siril.org/tutorials/" 
      },
      { 
        category: language === 'en' ? "Resources" : "资源", 
        subcategory: "DIY", 
        name: language === 'en' ? "Portable Display with Power Bank Functionality" : "带充电宝功能的便携显示器", 
        url: "https://github.com/peng-zhihui/PocketLCD" 
      },
      { 
        category: language === 'en' ? "Resources" : "资源", 
        subcategory: language === 'en' ? "Reviews" : "测评", 
        name: language === 'en' ? "Filter Comparison" : "滤镜比较", 
        url: "https://www.researchgate.net/profile/James-Thompson-32" 
      },
      { 
        category: language === 'en' ? "Resources" : "资源", 
        subcategory: language === 'en' ? "Tutorials" : "教程", 
        name: language === 'en' ? "PC Mobile Hotspot" : "PC移动热点", 
        url: "https://blog.csdn.net/qq_36349997/article/details/140780453" 
      },
      { 
        category: language === 'en' ? "Resources" : "资源", 
        subcategory: language === 'en' ? "Open Source Projects" : "开源项目", 
        name: "QHYCCD-QUARCS", 
        url: "https://github.com/QHYCCD-QUARCS" 
      },
      { 
        category: language === 'en' ? "Resources" : "资源", 
        subcategory: language === 'en' ? "Gallery" : "欣赏", 
        name: language === 'en' ? "ESA/Hubble Images" : "ESA/Hubble图片", 
        url: "https://esahubble.org/images/" 
      },
      { 
        category: language === 'en' ? "Resources" : "资源", 
        subcategory: language === 'en' ? "Gallery" : "欣赏", 
        name: language === 'en' ? "Jet Propulsion Laboratory" : "喷气推进实验室", 
        url: "https://www.spitzer.caltech.edu/images" 
      },
      { 
        category: language === 'en' ? "Resources" : "资源", 
        subcategory: language === 'en' ? "Gallery" : "欣赏", 
        name: language === 'en' ? "High Resolution Imaging Science Experiment" : "高分辨率成像科学实验", 
        url: "https://www.uahirise.org/" 
      },
      { 
        category: language === 'en' ? "Resources" : "资源", 
        subcategory: language === 'en' ? "Gallery" : "欣赏", 
        name: "In-The-Sky.org", 
        url: "https://in-the-sky.org/" 
      },
      { 
        category: language === 'en' ? "Resources" : "资源", 
        subcategory: language === 'en' ? "Resources" : "资源", 
        name: "Nighttime Imaging 'N' Astronomy", 
        url: "https://nighttime-imaging.eu/" 
      },
      { 
        category: language === 'en' ? "Resources" : "资源", 
        subcategory: language === 'en' ? "Resources" : "资源", 
        name: "TheSky Astronomy Software", 
        url: "https://www.bisque.com/product-category/software/" 
      },
      { 
        category: language === 'en' ? "Resources" : "资源", 
        subcategory: language === 'en' ? "Resources" : "资源", 
        name: "Astroberry Server", 
        url: "https://www.astroberry.io/" 
      }
    ]
  };
  
  // Function to get translated category name
  const getTranslatedCategory = (category: string): string => {
    switch (category) {
      case 'darkSky': return language === 'en' ? "Dark Sky Information" : "暗夜信息";
      case 'software': return language === 'en' ? "Software & Tools" : "软件和工具";
      case 'maps': return language === 'en' ? "Maps & Charts" : "地图和星图";
      case 'weather': return language === 'en' ? "Weather Resources" : "气象资源";
      case 'data': return language === 'en' ? "Data Resources" : "数据资源";
      case 'forums': return language === 'en' ? "Forums & Communities" : "论坛和社区";
      case 'observatories': return language === 'en' ? "Observatories" : "天文台";
      case 'beginners': return language === 'en' ? "Beginner Guides" : "新手指南";
      case 'hardware': return language === 'en' ? "Hardware" : "硬件";
      case 'games': return language === 'en' ? "Simulations & Games" : "模拟和游戏";
      case 'resources': return language === 'en' ? "Other Resources" : "其他资源";
      default: return category;
    }
  };
  
  // Function to get translated name if available
  const getTranslatedResourceName = (resource: any): string => {
    return resource.name;
  };

  // IDA certification information
  const idaCertifications = [
    {
      title: language === 'en' ? "Dark Sky Reserve" : "暗夜保护区",
      description: language === 'en' ? 
        "A Dark Sky Reserve is a public or private land possessing an exceptional quality of starry nights and nocturnal environment that is specifically protected for its scientific, natural, educational, cultural, heritage and/or public enjoyment." :
        "暗夜保护区是拥有优质星空和夜间环境的公共或私人土地，专门为科学、自然、教育、文化、遗产和/或公众享受而保护。",
      icon: Globe,
      color: "from-blue-800 to-blue-600",
      textColor: "text-blue-400"
    },
    {
      title: language === 'en' ? "Dark Sky Park" : "暗夜公园",
      description: language === 'en' ? 
        "A Dark Sky Park is a land possessing an exceptional quality of starry nights and a nocturnal environment that is specifically protected for its scientific, natural, educational, and cultural heritage, and/or for public enjoyment." :
        "暗夜公园是拥有优质星空和夜间环境的土地，专门为其科学、自然、教育和文化遗产，和/或为公众享受而受到保护。",
      icon: Star,
      color: "from-green-800 to-green-600",
      textColor: "text-green-400"
    },
    {
      title: language === 'en' ? "Dark Sky Sanctuary" : "暗夜圣地",
      description: language === 'en' ? 
        "A Dark Sky Sanctuary is a public or private land that has an exceptional quality of starry nights and a nocturnal environment that is protected for its scientific, natural, or educational value, its cultural heritage and/or public enjoyment." :
        "暗夜圣地是拥有优质星空和夜间环境的公共或私人土地，为其科学、自然或教育价值、文化遗产和/或公众享受而受到保护。",
      icon: Moon,
      color: "from-purple-800 to-purple-600",
      textColor: "text-purple-400"
    },
    {
      title: language === 'en' ? "Dark Sky Community" : "暗夜社区",
      description: language === 'en' ? 
        "A Dark Sky Community is a town, city, municipality, or other legally organized community that has shown exceptional dedication to the preservation of the night sky through the implementation and enforcement of quality lighting ordinances, dark sky education, and citizen support of dark skies." :
        "暗夜社区是通过实施和执行高质量照明条例、暗夜教育和公民支持暗夜而表现出对夜空保护的特殊奉献精神的城镇、城市、市政当局或其他合法组织的社区。",
      icon: Check,
      color: "from-amber-800 to-amber-600",
      textColor: "text-amber-400"
    }
  ];
  
  return (
    <div className="min-h-screen bg-cosmic-950 pb-16">
      <NavBar />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">
          {t("About Sky Image Quality Score (SIQS)", "关于天空图像质量评分 (SIQS)")}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-cosmic-800/60 border-cosmic-700 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-900/5 pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-gradient-blue">{t("What is SIQS?", "什么是SIQS？")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <p>
                  {t(
                    "The Sky Image Quality Score (SIQS) is a comprehensive rating system designed specifically for astrophotographers to evaluate the quality of potential imaging locations based on multiple environmental factors.",
                    "天空图像质量评分（SIQS）是一个专为天文摄影师设计的综合评分系统，用于基于多种环境因素评估潜在成像位置的质量。"
                  )}
                </p>
                <p>
                  {t(
                    "SIQS provides a standardized way to assess and compare different locations for astrophotography, helping you find the perfect spot for your next imaging session.",
                    "SIQS提供了一种标准化的方法来评估和比较不同的天文摄影位置，帮助您为下一次成像会话找到完美的拍摄地点。"
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-cosmic-800/60 border-cosmic-700 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-900/5 pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-gradient-blue">{t("Key Factors Analyzed", "关键分析因素")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-600/20 to-blue-400/10 flex items-center justify-center border border-blue-500/20">
                      <CloudRain className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-300">{t("Cloud Cover", "云层覆盖")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "The percentage of sky covered by clouds, directly impacting visibility of celestial objects.",
                          "被云层覆盖的天空百分比，直接影响天体的可见度。"
                        )}
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-600/20 to-purple-400/10 flex items-center justify-center border border-purple-500/20">
                      <Moon className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-purple-300">{t("Light Pollution (Bortle Scale)", "光污染（波特尔量表）")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "A numerical scale that quantifies the night sky's brightness due to artificial light.",
                          "一种量化由人工光源导致的夜空亮度的数值尺度。"
                        )}
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600/20 to-cyan-400/10 flex items-center justify-center border border-cyan-500/20">
                      <Star className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-cyan-300">{t("Seeing Conditions", "视宁度")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "The steadiness of the atmosphere, measured in arcseconds, affecting image sharpness.",
                          "大气稳定性，以角秒为单位测量，影响图像清晰度。"
                        )}
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-teal-600/20 to-teal-400/10 flex items-center justify-center border border-teal-500/20">
                      <Wind className="h-6 w-6 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-teal-300">{t("Wind Speed", "风速")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "Higher wind speeds can cause telescope vibration and degrade image quality.",
                          "较高的风速会导致望远镜振动并降低图像质量。"
                        )}
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-green-600/20 to-green-400/10 flex items-center justify-center border border-green-500/20">
                      <Thermometer className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-300">{t("Humidity", "湿度")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "Higher humidity increases dew risk on optical surfaces and can reduce transparency.",
                          "较高的湿度会增加光学表面结露的风险并可能降低透明度。"
                        )}
                      </p>
                    </div>
                  </li>
                  
                  <li className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-600/20 to-amber-400/10 flex items-center justify-center border border-amber-500/20">
                      <Moon className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-amber-300">{t("Moon Phase", "月相")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "The phase of the moon affects sky brightness and contrast for deep sky imaging.",
                          "月相影响深空成像的天空亮度和对比度。"
                        )}
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card className="bg-cosmic-800/60 border-cosmic-700 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-900/5 pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-gradient-blue">{t("How SIQS Works", "SIQS的工作原理")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <p>
                  {t(
                    "SIQS analyzes multiple environmental factors and combines them using our proprietary algorithm to generate a single score from 0-10 that represents the overall quality of a location for astrophotography.",
                    "SIQS分析多种环境因素，并使用我们专有的算法将它们组合在一起，生成一个从0-10的单一分数，代表天文摄影位置的整体质量。"
                  )}
                </p>
                <p>
                  {t(
                    "Each factor is weighted based on its relative importance to image quality, with cloud cover and light pollution having the most significant impact on the final score.",
                    "每个因素根据其对图像质量的相对重要性进行加权，其中云层覆盖和光污染对最终得分有最显著的影响。"
                  )}
                </p>
                <p>
                  {t(
                    "A location is considered viable for imaging if it meets our minimum threshold criteria, with higher scores indicating better conditions.",
                    "如果一个地点满足我们的最低阈值标准，则被认为适合成像，更高的分数表示更好的条件。"
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-cosmic-800/60 border-cosmic-700 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-900/5 pointer-events-none" />
              <CardHeader>
                <CardTitle className="text-gradient-blue">{t("Score Interpretation", "分数解释")}</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-green-400">{t("Exceptional (8.0-10.0)", "卓越 (8.0-10.0)")}</span>
                    </div>
                    <div className="w-full h-2.5 bg-cosmic-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-600 to-green-400" style={{ width: "100%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t("Perfect conditions for all types of astrophotography", "适合所有类型天文摄影的完美条件")}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-teal-400">{t("Excellent (6.0-7.9)", "优秀 (6.0-7.9)")}</span>
                    </div>
                    <div className="w-full h-2.5 bg-cosmic-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal-600 to-teal-400" style={{ width: "75%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t("Very good conditions for most imaging targets", "对大多数成像目标而言非常好的条件")}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-yellow-400">{t("Good (4.0-5.9)", "良好 (4.0-5.9)")}</span>
                    </div>
                    <div className="w-full h-2.5 bg-cosmic-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400" style={{ width: "50%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t("Acceptable conditions for brighter objects", "适合较亮天体的可接受条件")}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-orange-400">{t("Fair (2.0-3.9)", "一般 (2.0-3.9)")}</span>
                    </div>
                    <div className="w-full h-2.5 bg-cosmic-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400" style={{ width: "30%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t("Limited imaging potential, consider planetary targets", "成像潜力有限，可考虑行星目标")}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-red-400">{t("Poor (0.0-1.9)", "较差 (0.0-1.9)")}</span>
                    </div>
                    <div className="w-full h-2.5 bg-cosmic-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-600 to-red-400" style={{ width: "15%" }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t("Not recommended for imaging", "不推荐用于成像")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Dark Sky Certifications Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">
            {t("Dark Sky Certifications", "暗夜认证")}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {idaCertifications.map((cert, index) => (
              <Card key={index} className="bg-cosmic-800/60 border-cosmic-700 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${cert.color} opacity-5 pointer-events-none`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 bg-cosmic-700/50 ${cert.textColor}`}>
                      <cert.icon className="h-5 w-5" />
                    </div>
                    <CardTitle className={`text-lg ${cert.textColor}`}>
                      {cert.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{cert.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Card className="mt-6 bg-cosmic-800/60 border-cosmic-700 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-blue-400/5 pointer-events-none" />
            <CardHeader>
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-blue-400" />
                <CardTitle className="text-lg text-blue-400">
                  {t("About the International Dark-Sky Association (IDA)", "关于国际暗夜协会 (IDA)")}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <p>
                {t(
                  "The International Dark-Sky Association (IDA) is the recognized authority on light pollution and is the leading organization combating light pollution worldwide.",
                  "国际暗夜协会（IDA）是公认的光污染权威机构，是全球领先的对抗光污染的组织。"
                )}
              </p>
              <p>
                {t(
                  "Founded in 1988, IDA works to protect the night skies for present and future generations through their Dark Sky Places conservation program, which encourages communities, parks, and protected areas around the world to preserve and protect dark sites through responsible lighting policies and public education.",
                  "IDA成立于1988年，通过其暗夜地点保护计划致力于为当代和后代保护夜空，鼓励世界各地的社区、公园和保护区通过负责任的照明政策和公众教育来保存和保护暗夜地点。"
                )}
              </p>
              <p>
                {t(
                  "SIQS incorporates IDA certification status into its calculation to help astrophotographers find the best possible locations for imaging.",
                  "SIQS将IDA认证状态纳入其计算中，以帮助天文摄影师找到最佳的成像位置。"
                )}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Useful Links Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-primary bg-clip-text text-transparent">
            {t("Useful Astrophotography Resources", "天文摄影资源")}
          </h2>
          
          <Tabs defaultValue="darkSky" className="w-full">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 mb-6 bg-cosmic-800/30">
              <TabsTrigger value="darkSky" className="data-[state=active]:bg-primary/20">{t("Dark Sky Info", "暗夜信息")}</TabsTrigger>
              <TabsTrigger value="software" className="data-[state=active]:bg-primary/20">{t("Software", "软件")}</TabsTrigger>
              <TabsTrigger value="hardware" className="data-[state=active]:bg-primary/20">{t("Hardware", "硬件")}</TabsTrigger>
              <TabsTrigger value="data" className="data-[state=active]:bg-primary/20">{t("Data Resources", "数据资源")}</TabsTrigger>
              <TabsTrigger value="maps" className="data-[state=active]:bg-primary/20">{t("Maps", "地图")}</TabsTrigger>
              <TabsTrigger value="weather" className="data-[state=active]:bg-primary/20">{t("Weather", "天气")}</TabsTrigger>
              <TabsTrigger value="resources" className="data-[state=active]:bg-primary/20">{t("Other Resources", "其他资源")}</TabsTrigger>
            </TabsList>
            
            {Object.entries(resources).map(([category, items]) => (
              <TabsContent key={category} value={category} className="mt-0">
                <Card className="bg-cosmic-800/60 border-cosmic-700">
                  <CardHeader>
                    <CardTitle className="text-gradient-blue">{getTranslatedCategory(category)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((resource, index) => (
                        <a 
                          key={index} 
                          href={resource.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-3 bg-cosmic-700/30 rounded-lg hover:bg-cosmic-700/40 transition-colors group flex flex-col border border-cosmic-700/50 hover:border-primary/30"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-primary">{resource.subcategory}</span>
                            <ExternalLink size={14} className="text-cosmic-400 group-hover:text-primary transition-colors" />
                          </div>
                          <h3 className="font-medium group-hover:text-primary transition-colors">
                            {getTranslatedResourceName(resource)}
                          </h3>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AboutSIQS;
