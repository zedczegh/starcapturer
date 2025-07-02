
export interface CmosSensor {
  id: string;
  brand: string;
  model: string;
  pixelSize: number; // in micrometers
  resolutionX: number; // horizontal pixels
  resolutionY: number; // vertical pixels
  sensorSizeX: number; // in mm
  sensorSizeY: number; // in mm
  readNoise: number; // in electrons
  fullWellCapacity: number; // in electrons
  quantumEfficiency: number; // peak QE percentage
}

export const cmosSensors: CmosSensor[] = [
  // Sony sensors
  {
    id: 'imx571',
    brand: 'Sony',
    model: 'IMX571',
    pixelSize: 3.76,
    resolutionX: 6280,
    resolutionY: 4210,
    sensorSizeX: 23.6,
    sensorSizeY: 15.8,
    readNoise: 1.0,
    fullWellCapacity: 51000,
    quantumEfficiency: 91
  },
  {
    id: 'imx533',
    brand: 'Sony',
    model: 'IMX533',
    pixelSize: 3.76,
    resolutionX: 3008,
    resolutionY: 3008,
    sensorSizeX: 11.3,
    sensorSizeY: 11.3,
    sensorSizeX: 23.6,
    sensorSizeY: 15.8,
    readNoise: 1.2,
    fullWellCapacity: 51000,
    quantumEfficiency: 91
  },
  {
    id: 'imx482',
    brand: 'Sony',
    model: 'IMX482',
    pixelSize: 5.8,
    resolutionX: 2048,
    resolutionY: 1536,
    sensorSizeX: 11.9,
    sensorSizeY: 8.9,
    readNoise: 0.7,
    fullWellCapacity: 100000,
    quantumEfficiency: 84
  },
  {
    id: 'imx455',
    brand: 'Sony',
    model: 'IMX455',
    pixelSize: 3.76,
    resolutionX: 9576,
    resolutionY: 6388,
    sensorSizeX: 36.0,
    sensorSizeY: 24.0,
    readNoise: 1.4,
    fullWellCapacity: 51000,
    quantumEfficiency: 89
  },
  {
    id: 'imx294',
    brand: 'Sony',
    model: 'IMX294',
    pixelSize: 4.63,
    resolutionX: 4144,
    resolutionY: 2822,
    sensorSizeX: 19.2,
    sensorSizeY: 13.1,
    readNoise: 1.27,
    fullWellCapacity: 63000,
    quantumEfficiency: 87
  },
  {
    id: 'imx178',
    brand: 'Sony',
    model: 'IMX178',
    pixelSize: 2.4,
    resolutionX: 3096,
    resolutionY: 2080,
    sensorSizeX: 7.4,
    sensorSizeY: 5.0,
    readNoise: 1.7,
    fullWellCapacity: 15500,
    quantumEfficiency: 78
  },
  // Canon sensors
  {
    id: 'eos_r5',
    brand: 'Canon',
    model: 'EOS R5 (45MP)',
    pixelSize: 4.39,
    resolutionX: 8192,
    resolutionY: 5464,
    sensorSizeX: 36.0,
    sensorSizeY: 24.0,
    readNoise: 2.7,
    fullWellCapacity: 87000,
    quantumEfficiency: 58
  },
  {
    id: 'eos_6d',
    brand: 'Canon',
    model: 'EOS 6D Mark II',
    pixelSize: 6.54,
    resolutionX: 6240,
    resolutionY: 4160,
    sensorSizeX: 35.9,
    sensorSizeY: 24.0,
    readNoise: 4.1,
    fullWellCapacity: 95000,
    quantumEfficiency: 52
  },
  // Nikon sensors
  {
    id: 'nikon_d850',
    brand: 'Nikon',
    model: 'D850',
    pixelSize: 4.35,
    resolutionX: 8256,
    resolutionY: 5504,
    sensorSizeX: 35.9,
    sensorSizeY: 23.9,
    readNoise: 4.4,
    fullWellCapacity: 85000,
    quantumEfficiency: 55
  },
  // ZWO specialized sensors
  {
    id: 'asi6200mc',
    brand: 'ZWO',
    model: 'ASI6200MC (IMX455)',
    pixelSize: 3.76,
    resolutionX: 9576,
    resolutionY: 6388,
    sensorSizeX: 36.0,
    sensorSizeY: 24.0,
    readNoise: 1.4,
    fullWellCapacity: 51000,
    quantumEfficiency: 89
  },
  {
    id: 'asi2600mc',
    brand: 'ZWO',
    model: 'ASI2600MC (IMX571)',
    pixelSize: 3.76,
    resolutionX: 6248,
    resolutionY: 4176,
    sensorSizeX: 23.5,
    sensorSizeY: 15.7,
    readNoise: 1.0,
    fullWellCapacity: 51000,
    quantumEfficiency: 91
  },
  {
    id: 'asi533mc',
    brand: 'ZWO',
    model: 'ASI533MC (IMX533)',
    pixelSize: 3.76,
    resolutionX: 3008,
    resolutionY: 3008,
    sensorSizeX: 11.3,
    sensorSizeY: 11.3,
    readNoise: 1.2,
    fullWellCapacity: 51000,
    quantumEfficiency: 91
  }
];

export const getSensorById = (id: string): CmosSensor | undefined => {
  return cmosSensors.find(sensor => sensor.id === id);
};

export const getSensorsByBrand = (brand: string): CmosSensor[] => {
  return cmosSensors.filter(sensor => sensor.brand === brand);
};

export const getAllBrands = (): string[] => {
  return [...new Set(cmosSensors.map(sensor => sensor.brand))];
};
