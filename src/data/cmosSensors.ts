
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

  // QHY Cameras
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

  // ToupTek Cameras
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
