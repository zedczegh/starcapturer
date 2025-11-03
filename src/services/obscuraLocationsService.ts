import { SharedAstroSpot } from "@/lib/api/astroSpots";

// Cache for obscura locations
let cachedObscuraLocations: SharedAstroSpot[] | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Atlas Obscura locations with coordinates
 * Data sourced from https://www.atlasobscura.com/places
 */
const atlasObscuraLocations: SharedAstroSpot[] = [
  {
    id: 'castle-baroness-scoppa',
    name: 'Castle of Baroness Scoppa',
    chineseName: '斯科帕女男爵城堡',
    latitude: 38.6009,
    longitude: 16.4028,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 5,
    siqs: 6.5
  },
  {
    id: 'butterflies-maj',
    name: 'Butterflies on Máj',
    chineseName: '马耶的蝴蝶',
    latitude: 50.0822,
    longitude: 14.4199,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 6,
    siqs: 5.2
  },
  {
    id: 'suicide-cemetery',
    name: 'The Suicide Cemetery',
    chineseName: '自杀者墓地',
    latitude: 52.4967,
    longitude: 13.2032,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 6,
    siqs: 5.0
  },
  {
    id: 'church-our-lady',
    name: 'Church of Our Lady',
    chineseName: '圣母教堂',
    latitude: 55.6804,
    longitude: 11.0808,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 5,
    siqs: 6.8
  },
  {
    id: 'fu-lu-shou-complex',
    name: 'Fu Lu Shou Complex',
    chineseName: '福禄寿综合体',
    latitude: 1.3017,
    longitude: 103.8546,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 7,
    siqs: 4.5
  },
  {
    id: 'trojan-horse',
    name: 'Çanakkale Trojan Horse',
    chineseName: '恰纳卡莱特洛伊木马',
    latitude: 40.1519,
    longitude: 26.4051,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 5,
    siqs: 6.0
  },
  {
    id: 'wied-il-ghasri',
    name: 'Wied il-Għasri',
    chineseName: '维埃德伊尔加斯里',
    latitude: 36.0787,
    longitude: 14.2284,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 4,
    siqs: 7.5
  },
  {
    id: 'marjuns-lifting-stone',
    name: "Marjun's Lifting Stone",
    chineseName: '马容举石',
    latitude: 62.3352,
    longitude: -6.7654,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 4,
    siqs: 8.0
  },
  {
    id: 'mingo-gc30',
    name: 'Mingo GC30',
    chineseName: '明戈GC30',
    latitude: 39.2780,
    longitude: -100.9437,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.5
  },
  {
    id: 'pere-cheney-cemetery',
    name: 'Pere Cheney Cemetery',
    chineseName: '佩雷切尼墓地',
    latitude: 44.5434,
    longitude: -84.7221,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 4,
    siqs: 7.8
  },
  {
    id: 'tianzi-hotel',
    name: 'Tianzi Hotel',
    chineseName: '天子大酒店',
    latitude: 30.7642,
    longitude: 114.9431,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 7,
    siqs: 4.2
  },
  {
    id: 'forbidden-city',
    name: 'The Forbidden City',
    chineseName: '故宫',
    latitude: 39.9163,
    longitude: 116.3972,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 8,
    siqs: 3.5
  },
  {
    id: 'jiuzhaigou-valley',
    name: 'Jiuzhaigou Valley',
    chineseName: '九寨沟',
    latitude: 33.2600,
    longitude: 103.9200,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.8
  },
  {
    id: 'park-street-station',
    name: 'Park Street Station Mural',
    chineseName: '公园街站壁画',
    latitude: 42.3564,
    longitude: -71.0625,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 8,
    siqs: 3.0
  },
  {
    id: 'willie-whale',
    name: 'Willie the Whale',
    chineseName: '鲸鱼威利',
    latitude: 40.4850,
    longitude: -86.1390,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 6,
    siqs: 5.5
  },
  {
    id: 'hope-mill',
    name: 'Hope Mill Conservation Area',
    chineseName: '希望磨坊保护区',
    latitude: 44.2841,
    longitude: -78.1740,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 4,
    siqs: 7.2
  },
  {
    id: 'project-chimps',
    name: 'Project Chimps',
    chineseName: '黑猩猩保护项目',
    latitude: 34.9232,
    longitude: -84.2285,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 4,
    siqs: 7.6
  },
  {
    id: 'withy-grove-stores',
    name: 'Withy Grove Stores',
    chineseName: '威西格罗夫商店',
    latitude: 53.4847,
    longitude: -2.2404,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 7,
    siqs: 4.8
  },
  {
    id: 'turtle-cannery-museum',
    name: 'Turtle Cannery Museum',
    chineseName: '海龟罐头博物馆',
    latitude: 24.5619,
    longitude: -81.8008,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 6,
    siqs: 5.8
  },
  {
    id: 'seaboard-railroad-turntable',
    name: 'Seaboard Air Line Railroad Turntable',
    chineseName: '海滨航空铁路转台',
    latitude: 35.7874,
    longitude: -78.6418,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 7,
    siqs: 4.5
  },
  {
    id: 'carhenge',
    name: 'Carhenge',
    chineseName: '汽车巨石阵',
    latitude: 42.6042,
    longitude: -103.7469,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.2
  },
  {
    id: 'the-wave',
    name: 'The Wave',
    chineseName: '波浪岩',
    latitude: 36.9959,
    longitude: -112.0062,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'antelope-canyon',
    name: 'Antelope Canyon',
    chineseName: '羚羊峡谷',
    latitude: 36.8619,
    longitude: -111.3743,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.5
  },
  {
    id: 'door-to-hell',
    name: 'Door to Hell',
    chineseName: '地狱之门',
    latitude: 40.2530,
    longitude: 58.4397,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.7
  },
  {
    id: 'fingals-cave',
    name: "Fingal's Cave",
    chineseName: '芬格尔洞穴',
    latitude: 56.4326,
    longitude: -6.3369,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.0
  },
  {
    id: 'mount-roraima',
    name: 'Mount Roraima',
    chineseName: '罗赖马山',
    latitude: 5.1433,
    longitude: -60.7625,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'salar-de-uyuni',
    name: 'Salar de Uyuni',
    chineseName: '乌尤尼盐沼',
    latitude: -20.3078,
    longitude: -66.8250,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'stone-forest',
    name: 'Stone Forest',
    chineseName: '石林',
    latitude: 24.8142,
    longitude: 103.2717,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 5,
    siqs: 7.0
  },
  {
    id: 'glowworm-caves',
    name: 'Glowworm Caves',
    chineseName: '萤火虫洞',
    latitude: -38.2611,
    longitude: 175.1031,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.6
  },
  {
    id: 'giants-causeway',
    name: "Giant's Causeway",
    chineseName: '巨人堤道',
    latitude: 55.2408,
    longitude: -6.5116,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.7
  },
  {
    id: 'atacama-desert',
    name: 'Atacama Desert',
    chineseName: '阿塔卡马沙漠',
    latitude: -23.5000,
    longitude: -69.2500,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'namib-desert',
    name: 'Namib Desert',
    chineseName: '纳米布沙漠',
    latitude: -24.7500,
    longitude: 15.5000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'aurora-sky-station',
    name: 'Aurora Sky Station',
    chineseName: '极光观测站',
    latitude: 68.4108,
    longitude: 18.8279,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.5
  },
  {
    id: 'mauna-kea',
    name: 'Mauna Kea Observatory',
    chineseName: '莫纳克亚天文台',
    latitude: 19.8207,
    longitude: -155.4681,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'aoraki-mackenzie',
    name: 'Aoraki Mackenzie Dark Sky Reserve',
    chineseName: '奥拉基麦肯齐暗夜保护区',
    latitude: -43.9856,
    longitude: 170.4656,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.6
  },
  {
    id: 'tenerife-teide',
    name: 'Teide Observatory',
    chineseName: '泰德天文台',
    latitude: 28.3009,
    longitude: -16.5098,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.4
  },
  {
    id: 'death-valley',
    name: 'Death Valley',
    chineseName: '死亡谷',
    latitude: 36.5054,
    longitude: -117.0794,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.3
  },
  {
    id: 'cherry-springs',
    name: 'Cherry Springs State Park',
    chineseName: '樱桃泉州立公园',
    latitude: 41.6615,
    longitude: -77.8203,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.2
  },
  {
    id: 'jasper-national-park',
    name: 'Jasper National Park',
    chineseName: '贾斯珀国家公园',
    latitude: 52.8737,
    longitude: -117.9543,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.4
  },
  {
    id: 'kielder-observatory',
    name: 'Kielder Observatory',
    chineseName: '基尔德天文台',
    latitude: 55.2090,
    longitude: -2.5357,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.9
  },
  {
    id: 'lake-tekapo',
    name: 'Lake Tekapo',
    chineseName: '特卡波湖',
    latitude: -43.8831,
    longitude: 170.5127,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.5
  },
  {
    id: 'sutherland',
    name: 'Sutherland Observatory',
    chineseName: '萨瑟兰天文台',
    latitude: -32.3797,
    longitude: 20.8105,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.7
  },
  {
    id: 'pic-du-midi',
    name: 'Pic du Midi Observatory',
    chineseName: '皮克杜米迪天文台',
    latitude: 42.9369,
    longitude: 0.1417,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.1
  },
  {
    id: 'mongolian-steppe',
    name: 'Mongolian Steppe',
    chineseName: '蒙古草原',
    latitude: 46.8625,
    longitude: 103.8467,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'galloway-forest',
    name: 'Galloway Forest Park',
    chineseName: '加洛韦森林公园',
    latitude: 55.0167,
    longitude: -4.4167,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.3
  },
  {
    id: 'uluru',
    name: 'Uluru-Kata Tjuta',
    chineseName: '乌鲁鲁',
    latitude: -25.3444,
    longitude: 131.0369,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.6
  },
  {
    id: 'brecon-beacons',
    name: 'Brecon Beacons',
    chineseName: '布雷肯比肯斯',
    latitude: 51.8836,
    longitude: -3.4307,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.8
  },
  {
    id: 'exmoor-national',
    name: 'Exmoor National Park',
    chineseName: '埃克斯穆尔国家公园',
    latitude: 51.1450,
    longitude: -3.6550,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.7
  },
  {
    id: 'big-bend-national',
    name: 'Big Bend National Park',
    chineseName: '大弯国家公园',
    latitude: 29.2500,
    longitude: -103.2502,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.4
  },
  {
    id: 'grand-canyon',
    name: 'Grand Canyon',
    chineseName: '大峡谷',
    latitude: 36.1069,
    longitude: -112.1129,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.2
  },
  {
    id: 'cappadocia',
    name: 'Cappadocia',
    chineseName: '卡帕多西亚',
    latitude: 38.6431,
    longitude: 34.8286,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.5
  },
  {
    id: 'wadi-rum',
    name: 'Wadi Rum',
    chineseName: '瓦迪拉姆',
    latitude: 29.5759,
    longitude: 35.4184,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.5
  },
  {
    id: 'sahara-desert',
    name: 'Sahara Desert',
    chineseName: '撒哈拉沙漠',
    latitude: 23.4162,
    longitude: 25.6628,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'erg-chebbi',
    name: 'Erg Chebbi Dunes',
    chineseName: '舍比沙丘',
    latitude: 31.0889,
    longitude: -4.0094,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'joshua-tree',
    name: 'Joshua Tree National Park',
    chineseName: '约书亚树国家公园',
    latitude: 33.8734,
    longitude: -115.9010,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.3
  },
  {
    id: 'observatory-peak',
    name: 'Palomar Observatory',
    chineseName: '帕洛马天文台',
    latitude: 33.3563,
    longitude: -116.8650,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 3,
    siqs: 8.8
  },
  {
    id: 'la-palma-observatory',
    name: 'La Palma Observatory',
    chineseName: '拉帕尔马天文台',
    latitude: 28.7608,
    longitude: -17.8920,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.6
  },
  {
    id: 'paranal-observatory',
    name: 'Paranal Observatory',
    chineseName: '帕拉纳尔天文台',
    latitude: -24.6272,
    longitude: -70.4040,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'las-campanas',
    name: 'Las Campanas Observatory',
    chineseName: '拉斯坎帕纳斯天文台',
    latitude: -29.0089,
    longitude: -70.6920,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'gobi-desert',
    name: 'Gobi Desert',
    chineseName: '戈壁沙漠',
    latitude: 43.0000,
    longitude: 105.0000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.7
  },
  {
    id: 'taklamakan-desert',
    name: 'Taklamakan Desert',
    chineseName: '塔克拉玛干沙漠',
    latitude: 38.9000,
    longitude: 82.5000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'kalahari-desert',
    name: 'Kalahari Desert',
    chineseName: '卡拉哈里沙漠',
    latitude: -24.5000,
    longitude: 21.9000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.7
  },
  {
    id: 'iceland-highlands',
    name: 'Iceland Highlands',
    chineseName: '冰岛高地',
    latitude: 64.9631,
    longitude: -19.0208,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.4
  },
  {
    id: 'norwegian-fjords',
    name: 'Norwegian Fjords',
    chineseName: '挪威峡湾',
    latitude: 61.0000,
    longitude: 7.0000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.3
  },
  {
    id: 'lapland-finland',
    name: 'Finnish Lapland',
    chineseName: '芬兰拉普兰',
    latitude: 68.0000,
    longitude: 27.0000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.5
  },
  {
    id: 'svalbard',
    name: 'Svalbard',
    chineseName: '斯瓦尔巴群岛',
    latitude: 78.2232,
    longitude: 15.6267,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'patagonia-chile',
    name: 'Patagonia',
    chineseName: '巴塔哥尼亚',
    latitude: -50.0000,
    longitude: -73.0000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'torres-del-paine',
    name: 'Torres del Paine',
    chineseName: '百内国家公园',
    latitude: -51.0000,
    longitude: -73.0000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.7
  },
  {
    id: 'lake-baikal',
    name: 'Lake Baikal',
    chineseName: '贝加尔湖',
    latitude: 53.5587,
    longitude: 108.1650,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.4
  },
  {
    id: 'kamchatka',
    name: 'Kamchatka Peninsula',
    chineseName: '堪察加半岛',
    latitude: 56.0000,
    longitude: 160.0000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'tibet-plateau',
    name: 'Tibetan Plateau',
    chineseName: '青藏高原',
    latitude: 33.0000,
    longitude: 88.0000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'ali-observatory',
    name: 'Ali Observatory',
    chineseName: '阿里天文台',
    latitude: 32.3167,
    longitude: 80.0250,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'great-basin',
    name: 'Great Basin National Park',
    chineseName: '大盆地国家公园',
    latitude: 38.9833,
    longitude: -114.3000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.5
  },
  {
    id: 'cerro-tololo',
    name: 'Cerro Tololo Observatory',
    chineseName: '托洛洛山天文台',
    latitude: -30.1695,
    longitude: -70.8065,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'gemini-south',
    name: 'Gemini South Observatory',
    chineseName: '双子南座天文台',
    latitude: -30.2407,
    longitude: -70.7366,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'karoo-desert',
    name: 'Karoo Desert',
    chineseName: '卡鲁沙漠',
    latitude: -32.0000,
    longitude: 22.0000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.7
  },
  {
    id: 'outback-australia',
    name: 'Australian Outback',
    chineseName: '澳大利亚内陆',
    latitude: -25.0000,
    longitude: 133.0000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.8
  },
  {
    id: 'siding-spring',
    name: 'Siding Spring Observatory',
    chineseName: '赛丁泉天文台',
    latitude: -31.2733,
    longitude: 149.0611,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 2,
    siqs: 9.4
  },
  {
    id: 'greenland-ice',
    name: 'Greenland Ice Sheet',
    chineseName: '格陵兰冰盖',
    latitude: 72.0000,
    longitude: -40.0000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 9.9
  },
  {
    id: 'antarctica-south-pole',
    name: 'South Pole Station',
    chineseName: '南极站',
    latitude: -90.0000,
    longitude: 0.0000,
    isDarkSkyReserve: false,
    certification: 'Atlas Obscura',
    timestamp: new Date().toISOString(),
    bortleScale: 1,
    siqs: 10.0
  }
];

/**
 * Get all Atlas Obscura locations sorted by SIQS score
 */
export async function getAllObscuraLocations(): Promise<SharedAstroSpot[]> {
  // Check cache
  if (cachedObscuraLocations && (Date.now() - lastCacheUpdate < CACHE_TTL)) {
    return cachedObscuraLocations;
  }

  // Sort by SIQS score (highest first)
  const sortedLocations = [...atlasObscuraLocations].sort((a, b) => {
    const siqsA = typeof a.siqs === 'number' ? a.siqs : (a.siqs?.score || 0);
    const siqsB = typeof b.siqs === 'number' ? b.siqs : (b.siqs?.score || 0);
    return siqsB - siqsA;
  });

  // Update cache
  cachedObscuraLocations = sortedLocations;
  lastCacheUpdate = Date.now();

  // Save to localStorage
  try {
    localStorage.setItem('cachedObscuraLocations', JSON.stringify(sortedLocations));
  } catch (error) {
    console.error("Error caching obscura locations:", error);
  }

  console.log(`Loaded ${sortedLocations.length} Atlas Obscura locations`);
  return sortedLocations;
}

/**
 * Preload obscura locations from cache or fetch fresh
 */
export async function preloadObscuraLocations(): Promise<SharedAstroSpot[]> {
  // Try localStorage first
  const storedLocations = localStorage.getItem('cachedObscuraLocations');
  if (storedLocations) {
    try {
      const parsed = JSON.parse(storedLocations);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedObscuraLocations = parsed;
        console.log(`Using ${parsed.length} cached obscura locations`);
        return parsed;
      }
    } catch (error) {
      console.error("Error parsing cached obscura locations:", error);
    }
  }

  return getAllObscuraLocations();
}

/**
 * Force refresh obscura locations
 */
export async function forceObscuraLocationsRefresh(): Promise<SharedAstroSpot[]> {
  cachedObscuraLocations = null;
  lastCacheUpdate = 0;
  
  try {
    localStorage.removeItem('cachedObscuraLocations');
  } catch (error) {
    console.error("Error clearing cached obscura locations:", error);
  }
  
  return getAllObscuraLocations();
}
