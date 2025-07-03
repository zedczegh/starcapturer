export interface CMOSSensor {
  name: string;
  manufacturer: string;
  pixelSize: number; // in micrometers
  resolution: {
    width: number;
    height: number;
  };
  sensorType: 'Color' | 'Mono';
  category: 'Planetary' | 'Deep Sky' | 'All-round' | 'Guiding';
}

export const cmosSensors: CMOSSensor[] = [
  // Sony Sensors
  {
    name: "IMX290",
    manufacturer: "Sony",
    pixelSize: 2.9,
    resolution: { width: 1920, height: 1080 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "IMX294",
    manufacturer: "Sony", 
    pixelSize: 4.63,
    resolution: { width: 4144, height: 2822 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "IMX178",
    manufacturer: "Sony",
    pixelSize: 2.4,
    resolution: { width: 3096, height: 2080 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "IMX185",
    manufacturer: "Sony",
    pixelSize: 3.75,
    resolution: { width: 1920, height: 1200 },
    sensorType: "Color",
    category: "All-round"
  },
  {
    name: "IMX224",
    manufacturer: "Sony",
    pixelSize: 3.75,
    resolution: { width: 1304, height: 976 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "IMX385",
    manufacturer: "Sony",
    pixelSize: 3.75,
    resolution: { width: 1920, height: 1080 },
    sensorType: "Color",
    category: "All-round"
  },
  {
    name: "IMX462",
    manufacturer: "Sony",
    pixelSize: 2.9,
    resolution: { width: 1920, height: 1080 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "IMX464",
    manufacturer: "Sony",
    pixelSize: 3.76,
    resolution: { width: 2712, height: 1538 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "IMX533",
    manufacturer: "Sony",
    pixelSize: 3.76,
    resolution: { width: 3008, height: 3008 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "IMX571",
    manufacturer: "Sony",
    pixelSize: 3.76,
    resolution: { width: 6144, height: 4096 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "IMX485",
    manufacturer: "Sony",
    pixelSize: 3.45,
    resolution: { width: 2464, height: 2056 },
    sensorType: "Color",
    category: "All-round"
  },
  {
    name: "IMX678",
    manufacturer: "Sony",
    pixelSize: 2.0,
    resolution: { width: 3840, height: 2160 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "IMX455",
    manufacturer: "Sony",
    pixelSize: 3.76,
    resolution: { width: 9576, height: 6388 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "IMX492",
    manufacturer: "Sony",
    pixelSize: 3.45,
    resolution: { width: 7728, height: 5368 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "IMX410",
    manufacturer: "Sony",
    pixelSize: 5.94,
    resolution: { width: 6072, height: 4040 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "IMX174",
    manufacturer: "Sony",
    pixelSize: 5.86,
    resolution: { width: 1936, height: 1216 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  
  // ZWO Cameras
  {
    name: "ASI120MM-S",
    manufacturer: "ZWO",
    pixelSize: 3.75,
    resolution: { width: 1280, height: 960 },
    sensorType: "Mono",
    category: "Planetary"
  },
  {
    name: "ASI120MC-S",
    manufacturer: "ZWO",
    pixelSize: 3.75,
    resolution: { width: 1280, height: 960 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "ASI174MM",
    manufacturer: "ZWO", 
    pixelSize: 5.86,
    resolution: { width: 1936, height: 1216 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "ASI174MC",
    manufacturer: "ZWO",
    pixelSize: 5.86,
    resolution: { width: 1936, height: 1216 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "ASI183MM",
    manufacturer: "ZWO",
    pixelSize: 2.4,
    resolution: { width: 5496, height: 3672 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "ASI183MC",
    manufacturer: "ZWO",
    pixelSize: 2.4,
    resolution: { width: 5496, height: 3672 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "ASI224MC",
    manufacturer: "ZWO",
    pixelSize: 3.75,
    resolution: { width: 1304, height: 976 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "ASI290MM",
    manufacturer: "ZWO",
    pixelSize: 2.9,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Mono",
    category: "Planetary"
  },
  {
    name: "ASI290MC",
    manufacturer: "ZWO",
    pixelSize: 2.9,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "ASI294MM",
    manufacturer: "ZWO",
    pixelSize: 4.63,
    resolution: { width: 4144, height: 2822 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "ASI294MC",
    manufacturer: "ZWO",
    pixelSize: 4.63,
    resolution: { width: 4144, height: 2822 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "ASI533MM",
    manufacturer: "ZWO",
    pixelSize: 3.76,
    resolution: { width: 3008, height: 3008 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "ASI533MC",
    manufacturer: "ZWO",
    pixelSize: 3.76,
    resolution: { width: 3008, height: 3008 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "ASI571MM",
    manufacturer: "ZWO",
    pixelSize: 3.76,
    resolution: { width: 6144, height: 4096 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "ASI571MC",
    manufacturer: "ZWO",
    pixelSize: 3.76,
    resolution: { width: 6144, height: 4096 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "ASI678MC",
    manufacturer: "ZWO",
    pixelSize: 2.0,
    resolution: { width: 3840, height: 2160 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "ASI462MC",
    manufacturer: "ZWO",
    pixelSize: 2.9,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "ASI485MC",
    manufacturer: "ZWO",
    pixelSize: 3.45,
    resolution: { width: 2464, height: 2056 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "ASI385MC",
    manufacturer: "ZWO",
    pixelSize: 3.75,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Color",
    category: "All-round"
  },
  {
    name: "ASI464MC",
    manufacturer: "ZWO",
    pixelSize: 3.76,
    resolution: { width: 2712, height: 1538 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "ASI2600MM",
    manufacturer: "ZWO",
    pixelSize: 3.76,
    resolution: { width: 6248, height: 4176 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "ASI2600MC",
    manufacturer: "ZWO",
    pixelSize: 3.76,
    resolution: { width: 6248, height: 4176 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "ASI6200MM",
    manufacturer: "ZWO",
    pixelSize: 3.76,
    resolution: { width: 9576, height: 6388 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "ASI6200MC",
    manufacturer: "ZWO",
    pixelSize: 3.76,
    resolution: { width: 9576, height: 6388 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "ASI128MC",
    manufacturer: "ZWO",
    pixelSize: 5.97,
    resolution: { width: 1280, height: 1024 },
    sensorType: "Color",
    category: "All-round"
  },

  // QHY Cameras - Extensive Collection
  {
    name: "QHY5III174M",
    manufacturer: "QHY",
    pixelSize: 5.86,
    resolution: { width: 1936, height: 1216 },
    sensorType: "Mono",
    category: "Guiding"
  },
  {
    name: "QHY5III174C",
    manufacturer: "QHY",
    pixelSize: 5.86,
    resolution: { width: 1936, height: 1216 },
    sensorType: "Color",
    category: "Guiding"
  },
  {
    name: "QHY183M",
    manufacturer: "QHY",
    pixelSize: 2.4,
    resolution: { width: 5496, height: 3672 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "QHY183C",
    manufacturer: "QHY",
    pixelSize: 2.4,
    resolution: { width: 5496, height: 3672 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "QHY224C",
    manufacturer: "QHY",
    pixelSize: 3.75,
    resolution: { width: 1304, height: 976 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "QHY290M",
    manufacturer: "QHY",
    pixelSize: 2.9,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Mono",
    category: "Planetary"
  },
  {
    name: "QHY290C",
    manufacturer: "QHY",
    pixelSize: 2.9,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "QHY294M",
    manufacturer: "QHY",
    pixelSize: 4.63,
    resolution: { width: 4144, height: 2822 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "QHY294C",
    manufacturer: "QHY",
    pixelSize: 4.63,
    resolution: { width: 4144, height: 2822 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "QHY533M",
    manufacturer: "QHY",
    pixelSize: 3.76,
    resolution: { width: 3008, height: 3008 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "QHY533C",
    manufacturer: "QHY",
    pixelSize: 3.76,
    resolution: { width: 3008, height: 3008 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "QHY571M",
    manufacturer: "QHY",
    pixelSize: 3.76,
    resolution: { width: 6144, height: 4096 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "QHY571C",
    manufacturer: "QHY",
    pixelSize: 3.76,
    resolution: { width: 6144, height: 4096 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "QHY600M",
    manufacturer: "QHY",
    pixelSize: 3.76,
    resolution: { width: 9576, height: 6388 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "QHY600C",
    manufacturer: "QHY",
    pixelSize: 3.76,
    resolution: { width: 9576, height: 6388 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "QHY600M PH",
    manufacturer: "QHY",
    pixelSize: 3.76,
    resolution: { width: 9576, height: 6388 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "QHY268M",
    manufacturer: "QHY",
    pixelSize: 3.76,
    resolution: { width: 6280, height: 4210 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "QHY268C",
    manufacturer: "QHY",
    pixelSize: 3.76,
    resolution: { width: 6280, height: 4210 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "QHY410C",
    manufacturer: "QHY",
    pixelSize: 5.94,
    resolution: { width: 6072, height: 4040 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "QHY492M",
    manufacturer: "QHY",
    pixelSize: 3.45,
    resolution: { width: 7728, height: 5368 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "QHY492C",
    manufacturer: "QHY",
    pixelSize: 3.45,
    resolution: { width: 7728, height: 5368 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "QHY178M",
    manufacturer: "QHY",
    pixelSize: 2.4,
    resolution: { width: 3096, height: 2080 },
    sensorType: "Mono",
    category: "Planetary"
  },
  {
    name: "QHY178C",
    manufacturer: "QHY",
    pixelSize: 2.4,
    resolution: { width: 3096, height: 2080 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "QHY5L-II-M",
    manufacturer: "QHY",
    pixelSize: 3.75,
    resolution: { width: 1280, height: 960 },
    sensorType: "Mono",
    category: "Guiding"
  },
  {
    name: "QHY5L-II-C",
    manufacturer: "QHY",
    pixelSize: 3.75,
    resolution: { width: 1280, height: 960 },
    sensorType: "Color",
    category: "Guiding"
  },
  {
    name: "QHY163M",
    manufacturer: "QHY",
    pixelSize: 3.8,
    resolution: { width: 4656, height: 3522 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "QHY163C",
    manufacturer: "QHY",
    pixelSize: 3.8,
    resolution: { width: 4656, height: 3522 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "QHY128C",
    manufacturer: "QHY",
    pixelSize: 5.97,
    resolution: { width: 1280, height: 1024 },
    sensorType: "Color",
    category: "All-round"
  },
  {
    name: "QHY367C",
    manufacturer: "QHY",
    pixelSize: 6.0,
    resolution: { width: 7728, height: 5368 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "QHY16200A",
    manufacturer: "QHY",
    pixelSize: 6.0,
    resolution: { width: 4540, height: 3648 },
    sensorType: "Mono",
    category: "Deep Sky"
  },

  // ToupTek Cameras - Expanded Collection
  {
    name: "G3M178M",
    manufacturer: "ToupTek",
    pixelSize: 2.4,
    resolution: { width: 3096, height: 2080 },
    sensorType: "Mono",
    category: "Planetary"
  },
  {
    name: "G3M178C",
    manufacturer: "ToupTek",
    pixelSize: 2.4,
    resolution: { width: 3096, height: 2080 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "G3M290M",
    manufacturer: "ToupTek",
    pixelSize: 2.9,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Mono",
    category: "Planetary"
  },
  {
    name: "G3M290C",
    manufacturer: "ToupTek",
    pixelSize: 2.9,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "G3M294M",
    manufacturer: "ToupTek",
    pixelSize: 4.63,
    resolution: { width: 4144, height: 2822 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "G3M294C",
    manufacturer: "ToupTek",
    pixelSize: 4.63,
    resolution: { width: 4144, height: 2822 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "G3M385C",
    manufacturer: "ToupTek",
    pixelSize: 3.75,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Color",
    category: "All-round"
  },
  {
    name: "G3M462C",
    manufacturer: "ToupTek",
    pixelSize: 2.9,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "G3M224C",
    manufacturer: "ToupTek",
    pixelSize: 3.75,
    resolution: { width: 1304, height: 976 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "G3M174M",
    manufacturer: "ToupTek",
    pixelSize: 5.86,
    resolution: { width: 1936, height: 1216 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "G3M174C",
    manufacturer: "ToupTek",
    pixelSize: 5.86,
    resolution: { width: 1936, height: 1216 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  // Additional ToupTek models
  {
    name: "G3M533M",
    manufacturer: "ToupTek",
    pixelSize: 3.76,
    resolution: { width: 3008, height: 3008 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "G3M533C",
    manufacturer: "ToupTek",
    pixelSize: 3.76,
    resolution: { width: 3008, height: 3008 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "G3M571M",
    manufacturer: "ToupTek",
    pixelSize: 3.76,
    resolution: { width: 6144, height: 4096 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "G3M571C",
    manufacturer: "ToupTek",
    pixelSize: 3.76,
    resolution: { width: 6144, height: 4096 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "G3M485C",
    manufacturer: "ToupTek",
    pixelSize: 3.45,
    resolution: { width: 2464, height: 2056 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "G3M678C",
    manufacturer: "ToupTek",
    pixelSize: 2.0,
    resolution: { width: 3840, height: 2160 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "G3M464C",
    manufacturer: "ToupTek",
    pixelSize: 3.76,
    resolution: { width: 2712, height: 1538 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "G3M2600M",
    manufacturer: "ToupTek",
    pixelSize: 3.76,
    resolution: { width: 6248, height: 4176 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "G3M2600C",
    manufacturer: "ToupTek",
    pixelSize: 3.76,
    resolution: { width: 6248, height: 4176 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "G3M6200M",
    manufacturer: "ToupTek",
    pixelSize: 3.76,
    resolution: { width: 9576, height: 6388 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "G3M6200C",
    manufacturer: "ToupTek",
    pixelSize: 3.76,
    resolution: { width: 9576, height: 6388 },
    sensorType: "Color",
    category: "Deep Sky"
  },

  // SBIG Cameras
  {
    name: "STF-8300M",
    manufacturer: "SBIG",
    pixelSize: 5.4,
    resolution: { width: 3326, height: 2504 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "STF-8300C",
    manufacturer: "SBIG",
    pixelSize: 5.4,
    resolution: { width: 3326, height: 2504 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "STXL-6303E",
    manufacturer: "SBIG",
    pixelSize: 9.0,
    resolution: { width: 3072, height: 2048 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "STX-16803",
    manufacturer: "SBIG",
    pixelSize: 9.0,
    resolution: { width: 4096, height: 4096 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "STF-8050M",
    manufacturer: "SBIG",
    pixelSize: 7.4,
    resolution: { width: 3326, height: 2504 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "STT-8300M",
    manufacturer: "SBIG",
    pixelSize: 5.4,
    resolution: { width: 3326, height: 2504 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "STT-8300C",
    manufacturer: "SBIG",
    pixelSize: 5.4,
    resolution: { width: 3326, height: 2504 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "STXL-11002M",
    manufacturer: "SBIG",
    pixelSize: 9.0,
    resolution: { width: 4008, height: 2672 },
    sensorType: "Mono",
    category: "Deep Sky"
  },

  // Moravian Cameras
  {
    name: "G2-1600",
    manufacturer: "Moravian",
    pixelSize: 7.4,
    resolution: { width: 1536, height: 1024 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "G2-4000",
    manufacturer: "Moravian",
    pixelSize: 7.4,
    resolution: { width: 2048, height: 2048 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "G3-16200",
    manufacturer: "Moravian",
    pixelSize: 6.0,
    resolution: { width: 4540, height: 3648 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "G4-16000",
    manufacturer: "Moravian",
    pixelSize: 3.8,
    resolution: { width: 4904, height: 3280 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "G2-8300",
    manufacturer: "Moravian",
    pixelSize: 5.4,
    resolution: { width: 3326, height: 2504 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "G4-9000",
    manufacturer: "Moravian",
    pixelSize: 3.69,
    resolution: { width: 3584, height: 2574 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "G3-11000",
    manufacturer: "Moravian",
    pixelSize: 9.0,
    resolution: { width: 4008, height: 2672 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "G4-6000",
    manufacturer: "Moravian",
    pixelSize: 4.54,
    resolution: { width: 2758, height: 2208 },
    sensorType: "Mono",
    category: "Deep Sky"
  },

  // Player One Astronomy Cameras - Expanded Collection
  {
    name: "Neptune-C II",
    manufacturer: "Player One",
    pixelSize: 2.9,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "Neptune-M II",
    manufacturer: "Player One",
    pixelSize: 2.9,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Mono",
    category: "Planetary"
  },
  {
    name: "Mars-C II",
    manufacturer: "Player One",
    pixelSize: 3.75,
    resolution: { width: 1304, height: 976 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "Mars-M II",
    manufacturer: "Player One",
    pixelSize: 3.75,
    resolution: { width: 1304, height: 976 },
    sensorType: "Mono",
    category: "Planetary"
  },
  {
    name: "Saturn-C SQR",
    manufacturer: "Player One",
    pixelSize: 3.76,
    resolution: { width: 3008, height: 3008 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "Saturn-M SQR",
    manufacturer: "Player One",
    pixelSize: 3.76,
    resolution: { width: 3008, height: 3008 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Uranus-C",
    manufacturer: "Player One",
    pixelSize: 4.63,
    resolution: { width: 4144, height: 2822 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "Uranus-M",
    manufacturer: "Player One",
    pixelSize: 4.63,
    resolution: { width: 4144, height: 2822 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Apollo-M MAX",
    manufacturer: "Player One",
    pixelSize: 3.76,
    resolution: { width: 9576, height: 6388 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Apollo-C MAX",
    manufacturer: "Player One",
    pixelSize: 3.76,
    resolution: { width: 9576, height: 6388 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "Poseidon-M",
    manufacturer: "Player One",
    pixelSize: 3.76,
    resolution: { width: 6248, height: 4176 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Poseidon-C",
    manufacturer: "Player One",
    pixelSize: 3.76,
    resolution: { width: 6248, height: 4176 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "Ceres-C",
    manufacturer: "Player One",
    pixelSize: 2.4,
    resolution: { width: 5496, height: 3672 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "Ceres-M",
    manufacturer: "Player One",
    pixelSize: 2.4,
    resolution: { width: 5496, height: 3672 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Sedna-M",
    manufacturer: "Player One",
    pixelSize: 2.9,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Mono",
    category: "Planetary"
  },
  {
    name: "Sedna-C",  
    manufacturer: "Player One",
    pixelSize: 2.9,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "Triton-C",
    manufacturer: "Player One",
    pixelSize: 5.86,
    resolution: { width: 1936, height: 1216 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "Triton-M",
    manufacturer: "Player One",
    pixelSize: 5.86,
    resolution: { width: 1936, height: 1216 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Ares-M",
    manufacturer: "Player One",
    pixelSize: 3.45,
    resolution: { width: 2464, height: 2056 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Ares-C",
    manufacturer: "Player One",
    pixelSize: 3.45,
    resolution: { width: 2464, height: 2056 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "Xena-M",
    manufacturer: "Player One",
    pixelSize: 3.76,
    resolution: { width: 6280, height: 4210 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Xena-C",
    manufacturer: "Player One",
    pixelSize: 3.76,
    resolution: { width: 6280, height: 4210 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "Pluto-M",
    manufacturer: "Player One",
    pixelSize: 2.0,
    resolution: { width: 3840, height: 2160 },
    sensorType: "Mono",
    category: "Planetary"
  },
  {
    name: "Pluto-C",
    manufacturer: "Player One",
    pixelSize: 2.0,
    resolution: { width: 3840, height: 2160 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "Jupiter-M SQR",
    manufacturer: "Player One",
    pixelSize: 3.76,
    resolution: { width: 2712, height: 1538 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Jupiter-C SQR",
    manufacturer: "Player One",
    pixelSize: 3.76,
    resolution: { width: 2712, height: 1538 },
    sensorType: "Color",
    category: "Deep Sky"
  },

  // Atik Cameras
  {
    name: "Atik 383L+",
    manufacturer: "Atik",
    pixelSize: 5.4,
    resolution: { width: 3326, height: 2504 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Atik 460EX",
    manufacturer: "Atik",
    pixelSize: 4.54,
    resolution: { width: 2758, height: 2208 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Atik 314L+",
    manufacturer: "Atik",
    pixelSize: 6.45,
    resolution: { width: 1392, height: 1040 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Atik 414EX",
    manufacturer: "Atik",
    pixelSize: 6.45,
    resolution: { width: 1392, height: 1040 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Atik Horizon",
    manufacturer: "Atik",
    pixelSize: 3.76,
    resolution: { width: 3008, height: 3008 },
    sensorType: "Color",
    category: "Deep Sky"
  },

  // FLIR/Point Grey Cameras
  {
    name: "Blackfly S BFS-PGE-50S5C",
    manufacturer: "FLIR",
    pixelSize: 3.45,
    resolution: { width: 2464, height: 2056 },
    sensorType: "Color",
    category: "All-round"
  },
  {
    name: "Chameleon3 CM3-U3-28S4C",
    manufacturer: "FLIR",
    pixelSize: 3.45,
    resolution: { width: 1936, height: 1456 },
    sensorType: "Color",
    category: "All-round"
  },

  // Altair Cameras
  {
    name: "Altair GPCAM3 290M",
    manufacturer: "Altair",
    pixelSize: 2.9,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Mono",
    category: "Planetary"
  },
  {
    name: "Altair GPCAM3 290C",
    manufacturer: "Altair",
    pixelSize: 2.9,
    resolution: { width: 1936, height: 1096 },
    sensorType: "Color",
    category: "Planetary"
  },
  {
    name: "Altair GPCAM3 183M",
    manufacturer: "Altair",
    pixelSize: 2.4,
    resolution: { width: 5496, height: 3672 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Altair GPCAM3 183C",
    manufacturer: "Altair",
    pixelSize: 2.4,
    resolution: { width: 5496, height: 3672 },
    sensorType: "Color",
    category: "Deep Sky"
  },

  // Starlight Xpress Cameras
  {
    name: "SXV-H9",
    manufacturer: "Starlight Xpress",
    pixelSize: 20.0,
    resolution: { width: 512, height: 512 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "SXV-H16",
    manufacturer: "Starlight Xpress",
    pixelSize: 7.4,
    resolution: { width: 2048, height: 2048 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "Lodestar X2",
    manufacturer: "Starlight Xpress",
    pixelSize: 8.6,
    resolution: { width: 752, height: 582 },
    sensorType: "Mono",
    category: "Guiding"
  },

  // Omegon Cameras
  {
    name: "veTEC 533M",
    manufacturer: "Omegon",
    pixelSize: 3.76,
    resolution: { width: 3008, height: 3008 },
    sensorType: "Mono",
    category: "Deep Sky"
  },
  {
    name: "veTEC 533C",
    manufacturer: "Omegon",
    pixelSize: 3.76,
    resolution: { width: 3008, height: 3008 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "veTEC 571M",
    manufacturer: "Omegon",
    pixelSize: 3.76,
    resolution: { width: 6144, height: 4096 },
    sensorType: "Mono",
    category: "Deep Sky"
  },

  // Omnivision Sensors
  {
    name: "OV2710",
    manufacturer: "Omnivision",
    pixelSize: 3.0,
    resolution: { width: 1920, height: 1080 },
    sensorType: "Color",
    category: "Guiding"
  },
  
  // Canon Sensors
  {
    name: "APS-C (22.3x14.9mm)",
    manufacturer: "Canon",
    pixelSize: 4.3,
    resolution: { width: 5184, height: 3456 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "Full Frame (36x24mm)",
    manufacturer: "Canon",
    pixelSize: 5.36,
    resolution: { width: 6720, height: 4480 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  
  // Nikon Sensors  
  {
    name: "DX Format (23.5x15.6mm)",
    manufacturer: "Nikon",
    pixelSize: 4.78,
    resolution: { width: 4928, height: 3264 },
    sensorType: "Color",
    category: "Deep Sky"
  },
  {
    name: "FX Format (35.9x23.9mm)",
    manufacturer: "Nikon",
    pixelSize: 5.94,
    resolution: { width: 6048, height: 4024 },
    sensorType: "Color",
    category: "Deep Sky"
  }
];

export const getSensorsByCategory = (category: string) => {
  if (category === 'All') return cmosSensors;
  return cmosSensors.filter(sensor => sensor.category === category);
};

export const getSensorsByManufacturer = (manufacturer: string) => {
  if (manufacturer === 'All') return cmosSensors;
  return cmosSensors.filter(sensor => sensor.manufacturer === manufacturer);
};
