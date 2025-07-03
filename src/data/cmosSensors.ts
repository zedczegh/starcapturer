
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
