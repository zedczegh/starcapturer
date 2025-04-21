
// Collection of astronomy facts/tips: EN/中文 pairs
export const ASTRONOMY_STORIES: Array<[string, string]> = [
  [
    "Did you know? Voyager 1 has traveled over 15 billion miles away from Earth.",
    "你知道吗？旅行者1号已经离地球超过150亿英里。"
  ],
  [
    "There are more stars in the universe than grains of sand on all Earth's beaches.",
    "宇宙中的星星数量比地球上所有沙滩的沙粒还多。"
  ],
  [
    "A day on Venus is longer than a year on Venus!",
    "金星上的一天比一年还要长！"
  ],
  [
    "Jupiter's Great Red Spot is actually a giant storm bigger than Earth.",
    "木星的大红斑其实是一场比地球还大的风暴。"
  ],
  [
    "The Milky Way galaxy is on a collision course with the Andromeda galaxy.",
    "银河系正与仙女座星系走向碰撞。"
  ],
  [
    "Neutron stars are so dense that a sugar-cube sized amount weighs as much as Mount Everest.",
    "中子星如此致密，一块方糖大小的中子星其质量等于珠穆朗玛峰。"
  ],
  [
    "The Sun contains 99.8% of the mass of our solar system.",
    "太阳的质量占据了太阳系99.8%。"
  ],
  [
    "Saturn's rings are made mostly of ice particles and dust.",
    "土星环主要由冰粒和尘埃组成。"
  ],
  [
    "There are over 200 moons in our solar system.",
    "太阳系中有超过200颗卫星。"
  ],
  [
    "If two pieces of metal touch in space, they bond permanently due to cold welding.",
    "空间中的两块金属只要接触就会永久粘连，这叫做冷焊现象。"
  ],
  [
    "The Hubble Space Telescope has captured images of galaxies billions of light-years away.",
    "哈勃太空望远镜拍摄到数十亿光年外的星系。"
  ],
  [
    "A spoonful of a neutron star weighs about 1 billion tons.",
    "一勺中子星的质量有10亿吨左右。"
  ],
  [
    "Mars has the tallest volcano in the solar system—Olympus Mons.",
    "火星拥有太阳系最高的火山——奥林帕斯山。"
  ],
  [
    "The hottest planet in the solar system is Venus.",
    "太阳系中最热的行星是金星。"
  ],
  [
    "Sunsets on Mars are blue, not red.",
    "火星上的日落是蓝色的，而不是红色。"
  ],
  [
    "The International Space Station travels at about 17,500 mph.",
    "国际空间站以大约每小时17500英里的速度环绕地球。"
  ],
  [
    "One million Earths could fit inside the Sun.",
    "太阳中可以容纳100万个地球。"
  ],
  [
    "The footprints left on the Moon could remain for millions of years.",
    "留在月球上的脚印可以持续上百万年。"
  ],
  [
    "Comets are sometimes called dirty snowballs.",
    "彗星有时被称为'脏雪球'。"
  ],
  [
    "The center of our galaxy smells like raspberries and rum (based on chemicals detected).",
    "银河系中心闻起来像覆盆子和朗姆酒（基于探测到的化学物质）。"
  ],
  [
    "There's a planet where it rains glass sideways—HD 189733b.",
    "有一颗行星会下横向玻璃雨——HD 189733b。"
  ],
  [
    "A year on Mercury is just 88 Earth days.",
    "水星上的一年仅为地球上的88天。"
  ],
  [
    "Pluto is smaller than Earth's Moon.",
    "冥王星比地球的月球还小。"
  ],
  [
    "The observable universe is about 93 billion light-years across.",
    "可观测宇宙的直径约为930亿光年。"
  ],
  [
    "Triton, Neptune's moon, orbits backward compared to most moons.",
    "海王星的卫星海卫一轨道方向与大多数卫星相反。"
  ],
  [
    "A spoonful of the Sun would weigh 2 kilos on Earth.",
    "一勺太阳物质在地球上大约重2公斤。"
  ]
];

// Function to get a random astronomy tip
export const getRandomAstronomyTip = (): [string, string] => {
  const randomIndex = Math.floor(Math.random() * ASTRONOMY_STORIES.length);
  return ASTRONOMY_STORIES[randomIndex];
};
