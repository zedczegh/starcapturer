
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NavBar from "@/components/NavBar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Globe, Star, Moon, CloudRain, Wind, Thermometer, Award, Check, MapPin, Shield } from "lucide-react";

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
      },
      { 
        category: language === 'en' ? "Dark Sky Certification" : "暗夜认证", 
        subcategory: language === 'en' ? "Guidelines" : "指南", 
        name: language === 'en' ? "IDA Dark Sky Places Criteria" : "IDA暗夜地点标准", 
        url: "https://www.darksky.org/our-work/conservation/idsp/become-a-dark-sky-place/" 
      },
      { 
        category: language === 'en' ? "Dark Sky Certification" : "暗夜认证", 
        subcategory: language === 'en' ? "Resources" : "资源", 
        name: language === 'en' ? "Dark Sky Places Annual Reports" : "暗夜地点年度报告", 
        url: "https://www.darksky.org/our-work/conservation/idsp/annual-reports/" 
      },
      { 
        category: language === 'en' ? "Dark Sky Data" : "暗夜数据", 
        subcategory: language === 'en' ? "Resources" : "资源", 
        name: language === 'en' ? "World Atlas of Artificial Night Sky Brightness" : "世界人工夜空亮度图集", 
        url: "https://cires.colorado.edu/artificial-sky" 
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

  // Dark Sky Certification Types
  const idaCertifications = [
    {
      title: language === 'en' ? "Dark Sky Reserve" : "暗夜保护区",
      description: language === 'en' ? 
        "A Dark Sky Reserve is a public or private land possessing an exceptional quality of starry nights and nocturnal environment that is specifically protected for its scientific, natural, educational, cultural, heritage and/or public enjoyment." :
        "暗夜保护区是拥有优质星空和夜间环境的公共或私人土地，专门为科学、自然、教育、文化、遗产和/或公众享受而保护。",
      icon: Globe,
      color: "from-blue-600 to-blue-400",
      textColor: "text-blue-300",
      bgColor: "bg-blue-900/20",
      borderColor: "border-blue-600/30",
      count: 21
    },
    {
      title: language === 'en' ? "Dark Sky Park" : "暗夜公园",
      description: language === 'en' ? 
        "A Dark Sky Park is a land possessing an exceptional quality of starry nights and a nocturnal environment that is specifically protected for its scientific, natural, educational, and cultural heritage, and/or for public enjoyment." :
        "暗夜公园是拥有优质星空和夜间环境的土地，专门为其科学、自然、教育和文化遗产，和/或为公众享受而受到保护。",
      icon: Star,
      color: "from-green-600 to-green-400",
      textColor: "text-green-300",
      bgColor: "bg-green-900/20",
      borderColor: "border-green-600/30",
      count: 114
    },
    {
      title: language === 'en' ? "Dark Sky Sanctuary" : "暗夜圣地",
      description: language === 'en' ? 
        "A Dark Sky Sanctuary is a public or private land that has an exceptional quality of starry nights and a nocturnal environment that is protected for its scientific, natural, or educational value, its cultural heritage and/or public enjoyment." :
        "暗夜圣地是拥有优质星空和夜间环境的公共或私人土地，为其科学、自然或教育价值、文化遗产和/或公众享受而受到保护。",
      icon: Moon,
      color: "from-indigo-600 to-indigo-400",
      textColor: "text-indigo-300",
      bgColor: "bg-indigo-900/20",
      borderColor: "border-indigo-600/30",
      count: 19
    },
    {
      title: language === 'en' ? "Dark Sky Community" : "暗夜社区",
      description: language === 'en' ? 
        "A Dark Sky Community is a town, city, municipality, or other legally organized community that has shown exceptional dedication to the preservation of the night sky through the implementation and enforcement of quality lighting ordinances, dark sky education, and citizen support of dark skies." :
        "暗夜社区是通过实施和执行高质量照明条例、暗夜教育和公民支持暗夜而表现出对夜空保护的特殊奉献精神的城镇、城市、市政当局或其他合法组织的社区。",
      icon: MapPin,
      color: "from-amber-600 to-amber-400",
      textColor: "text-amber-300",
      bgColor: "bg-amber-900/20",
      borderColor: "border-amber-600/30",
      count: 33
    },
    {
      title: language === 'en' ? "Urban Night Sky Place" : "城市夜空地点",
      description: language === 'en' ? 
        "An Urban Night Sky Place is a municipal park, open space, observatory, or other similar property near or surrounded by large urban environs whose planning and design actively promote an authentic nighttime experience in the midst of significant artificial light." :
        "城市夜空地点是市政公园、开放空间、天文台或其他类似的靠近或被大型城市环境包围的场所，其规划和设计积极促进在显著人工光照中的真实夜间体验。",
      icon: Shield,
      color: "from-violet-600 to-violet-400",
      textColor: "text-violet-300",
      bgColor: "bg-violet-900/20",
      borderColor: "border-violet-600/30",
      count: 5
    }
  ];

  // Bortle Scale information for Dark Sky understanding
  const bortleScaleInfo = [
    {
      level: 1,
      name: language === 'en' ? "Excellent dark-sky site" : "极佳暗夜地点",
      mlky: language === 'en' ? "Milky Way casts shadows" : "银河能投下影子",
      color: "bg-blue-950",
      textColor: "text-blue-100"
    },
    {
      level: 2,
      name: language === 'en' ? "Truly dark site" : "真正的暗夜地点",
      mlky: language === 'en' ? "Summer Milky Way highly structured" : "夏季银河结构清晰可见",
      color: "bg-blue-900",
      textColor: "text-blue-200"
    },
    {
      level: 3,
      name: language === 'en' ? "Rural sky" : "乡村天空",
      mlky: language === 'en' ? "Some light pollution evident at horizon" : "地平线处有一些光污染迹象",
      color: "bg-blue-800",
      textColor: "text-blue-200"
    },
    {
      level: 4,
      name: language === 'en' ? "Rural/suburban transition" : "乡村/郊区过渡",
      mlky: language === 'en' ? "Milky Way still impressive but lacks detail" : "银河仍然令人印象深刻但缺乏细节",
      color: "bg-green-800",
      textColor: "text-green-200"
    },
    {
      level: 5,
      name: language === 'en' ? "Suburban sky" : "郊区天空",
      mlky: language === 'en' ? "Milky Way washed out except at zenith" : "除了天顶处，银河已被冲淡",
      color: "bg-green-700",
      textColor: "text-green-100"
    },
    {
      level: 6,
      name: language === 'en' ? "Bright suburban sky" : "明亮的郊区天空",
      mlky: language === 'en' ? "Milky Way only visible at zenith" : "银河仅在天顶处可见",
      color: "bg-yellow-700",
      textColor: "text-yellow-100"
    },
    {
      level: 7,
      name: language === 'en' ? "Suburban/urban transition" : "郊区/城市过渡",
      mlky: language === 'en' ? "Milky Way invisible" : "银河不可见",
      color: "bg-orange-700",
      textColor: "text-orange-100"
    },
    {
      level: 8,
      name: language === 'en' ? "City sky" : "城市天空",
      mlky: language === 'en' ? "Only brightest stars visible" : "仅最亮的星星可见",
      color: "bg-red-700",
      textColor: "text-red-100"
    },
    {
      level: 9,
      name: language === 'en' ? "Inner-city sky" : "城市中心天空",
      mlky: language === 'en' ? "No stars visible" : "看不到星星",
      color: "bg-red-900",
      textColor: "text-red-100"
    }
  ];

  return (
    <>
      <NavBar />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gradient-blue">
            {t("About SIQS", "关于SIQS")}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t(
              "Learn more about the Sky Imaging Quality Score and related resources for astrophotography.",
              "了解更多关于天空成像质量评分以及天文摄影相关资源。"
            )}
          </p>
        </div>
        
        <Tabs defaultValue="siqs" className="mb-12">
          <TabsList className="mb-6 bg-cosmic-800/50 backdrop-blur-sm border border-cosmic-700/30">
            <TabsTrigger value="siqs" className="data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground">
              {t("What is SIQS?", "什么是SIQS？")}
            </TabsTrigger>
            <TabsTrigger value="darksky" className="data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground">
              {t("Dark Sky Knowledge", "暗夜知识")}
            </TabsTrigger>
            <TabsTrigger value="links" className="data-[state=active]:bg-primary/80 data-[state=active]:text-primary-foreground">
              {t("Useful Links", "有用链接")}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="siqs" className="space-y-6 mt-4">
            <Card className="bg-cosmic-800/40 border-cosmic-700/30 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-primary">
                  {t("Sky Imaging Quality Score (SIQS)", "天空成像质量评分 (SIQS)")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  {t(
                    "SIQS (Sky Imaging Quality Score) is an integrated evaluation system designed specifically for astrophotography. It helps you determine the optimal viewing and imaging conditions for a specific location.",
                    "SIQS（天空成像质量评分）是专为天文摄影设计的综合评估系统。它帮助您确定特定位置的最佳观测和成像条件。"
                  )}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  <div className="bg-cosmic-700/30 border border-cosmic-600/30 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center mb-2">
                      <div className="bg-blue-600/20 p-2 rounded-full mr-3">
                        <Star className="h-5 w-5 text-blue-400" />
                      </div>
                      <h3 className="font-medium text-lg">
                        {t("Light Pollution", "光污染")}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t(
                        "Measures artificial light that brightens the night sky, based on Bortle scale and light pollution databases.",
                        "测量使夜空变亮的人工光，基于Bortle等级和光污染数据库。"
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-cosmic-700/30 border border-cosmic-600/30 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center mb-2">
                      <div className="bg-teal-600/20 p-2 rounded-full mr-3">
                        <CloudRain className="h-5 w-5 text-teal-400" />
                      </div>
                      <h3 className="font-medium text-lg">
                        {t("Cloud Coverage", "云层覆盖")}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t(
                        "Evaluates the percentage of sky covered by clouds, greatly affecting visibility and imaging quality.",
                        "评估云层覆盖天空的百分比，极大影响能见度和成像质量。"
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-cosmic-700/30 border border-cosmic-600/30 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center mb-2">
                      <div className="bg-indigo-600/20 p-2 rounded-full mr-3">
                        <Wind className="h-5 w-5 text-indigo-400" />
                      </div>
                      <h3 className="font-medium text-lg">
                        {t("Wind Speed", "风速")}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t(
                        "Strong winds cause telescope vibrations, resulting in blurred images and reduced detail clarity.",
                        "强风会导致望远镜振动，导致图像模糊且细节清晰度降低。"
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-cosmic-700/30 border border-cosmic-600/30 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center mb-2">
                      <div className="bg-purple-600/20 p-2 rounded-full mr-3">
                        <Thermometer className="h-5 w-5 text-purple-400" />
                      </div>
                      <h3 className="font-medium text-lg">
                        {t("Temperature", "温度")}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t(
                        "Rapid temperature changes affect image quality; stable temperatures are ideal for astrophotography.",
                        "温度的快速变化会影响图像质量；稳定的温度是天文摄影的理想条件。"
                      )}
                    </p>
                  </div>

                  <div className="bg-cosmic-700/30 border border-cosmic-600/30 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center mb-2">
                      <div className="bg-amber-600/20 p-2 rounded-full mr-3">
                        <CloudRain className="h-5 w-5 text-amber-400" />
                      </div>
                      <h3 className="font-medium text-lg">
                        {t("Humidity", "湿度")}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t(
                        "High humidity can create haze, reduce contrast, and cause dew on optical equipment.",
                        "高湿度会产生雾霾，降低对比度，并在光学设备上形成露水。"
                      )}
                    </p>
                  </div>
                  
                  <div className="bg-cosmic-700/30 border border-cosmic-600/30 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center mb-2">
                      <div className="bg-green-600/20 p-2 rounded-full mr-3">
                        <Award className="h-5 w-5 text-green-400" />
                      </div>
                      <h3 className="font-medium text-lg">
                        {t("Seeing", "视宁度")}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {t(
                        "Atmospheric turbulence that affects image sharpness; better seeing means sharper astronomical images.",
                        "影响图像清晰度的大气湍流；更好的视宁度意味着更清晰的天文图像。"
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 bg-cosmic-700/30 border border-cosmic-600/30 rounded-lg p-4">
                  <h3 className="font-semibold text-lg mb-3 text-primary">
                    {t("SIQS Scoring System", "SIQS评分系统")}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="bg-green-900/30 border border-green-700/30 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-green-400">8-10</div>
                      <div className="text-sm text-green-300">
                        {t("Excellent", "优秀")}
                      </div>
                    </div>
                    <div className="bg-teal-900/30 border border-teal-700/30 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-teal-400">6-8</div>
                      <div className="text-sm text-teal-300">
                        {t("Good", "良好")}
                      </div>
                    </div>
                    <div className="bg-blue-900/30 border border-blue-700/30 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-blue-400">4-6</div>
                      <div className="text-sm text-blue-300">
                        {t("Average", "一般")}
                      </div>
                    </div>
                    <div className="bg-amber-900/30 border border-amber-700/30 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-amber-400">2-4</div>
                      <div className="text-sm text-amber-300">
                        {t("Poor", "较差")}
                      </div>
                    </div>
                    <div className="bg-red-900/30 border border-red-700/30 rounded-lg p-3 text-center">
                      <div className="text-xl font-bold text-red-400">0-2</div>
                      <div className="text-sm text-red-300">
                        {t("Bad", "很差")}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="darksky" className="space-y-6 mt-4">
            <Card className="bg-cosmic-800/40 border-cosmic-700/30 backdrop-blur-sm shadow-lg mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-primary">
                  {t("Dark Sky Certifications", "暗夜认证")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  {t(
                    "The International Dark-Sky Association (IDA) designates locations worldwide that preserve and protect dark sites through responsible lighting policies and public education.",
                    "国际暗夜协会（IDA）通过负责任的照明政策和公共教育，在全球范围内指定保护暗夜地点的位置。"
                  )}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {idaCertifications.map((cert, index) => (
                    <div 
                      key={index} 
                      className={`bg-gradient-to-br ${cert.bgColor} border ${cert.borderColor} rounded-lg p-4 flex flex-col h-full`}
                    >
                      <div className="flex items-center mb-3">
                        <div className={`bg-gradient-to-r ${cert.color} p-2 rounded-full mr-3`}>
                          <cert.icon className={`h-5 w-5 ${cert.textColor}`} />
                        </div>
                        <h3 className={`font-medium text-lg ${cert.textColor}`}>
                          {cert.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground flex-grow">
                        {cert.description}
                      </p>
                      <div className={`mt-3 pt-3 border-t ${cert.borderColor} flex justify-between items-center`}>
                        <span className={`text-sm ${cert.textColor}`}>
                          {t("Global Count", "全球数量")}:
                        </span>
                        <span className="text-lg font-semibold">
                          {cert.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-cosmic-800/40 border-cosmic-700/30 backdrop-blur-sm shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl text-primary">
                  {t("Bortle Dark-Sky Scale", "波特尔暗夜等级")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  {t(
                    "The Bortle scale is a nine-level numeric scale that measures the night sky's brightness of a particular location. It quantifies the astronomical observability of celestial objects and the interference caused by light pollution.",
                    "波特尔等级是一个九级数字等级，用于衡量特定位置夜空的亮度。它量化了天体的天文可观测性以及光污染造成的干扰。"
                  )}
                </p>
                
                <div className="overflow-x-auto mt-4">
                  <div className="inline-block min-w-full align-middle">
                    <div className="overflow-hidden border border-cosmic-700/30 rounded-lg">
                      <table className="min-w-full divide-y divide-cosmic-700/30">
                        <thead className="bg-cosmic-700/30">
                          <tr>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {t("Class", "等级")}
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {t("Title", "标题")}
                            </th>
                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              {t("Milky Way", "银河")}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cosmic-700/30">
                          {bortleScaleInfo.map((level) => (
                            <tr key={level.level} className={level.color}>
                              <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${level.textColor}`}>
                                {level.level}
                              </td>
                              <td className={`px-4 py-3 whitespace-nowrap text-sm ${level.textColor}`}>
                                {level.name}
                              </td>
                              <td className={`px-4 py-3 text-sm ${level.textColor}`}>
                                {level.mlky}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="links" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 gap-6">
              {Object.keys(resources).map((category) => (
                <Card key={category} className="bg-cosmic-800/40 border-cosmic-700/30 backdrop-blur-sm shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl text-primary">
                      {getTranslatedCategory(category)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {resources[category as keyof typeof resources].map((resource, index) => (
                        <a 
                          key={index}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center p-3 bg-cosmic-700/30 hover:bg-cosmic-700/50 border border-cosmic-600/30 rounded-lg transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {getTranslatedResourceName(resource)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {resource.subcategory}
                            </p>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default AboutSIQS;
