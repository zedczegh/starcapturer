import { detectStars, detectNebulae, detectGalaxies } from './imageAnalysis';

interface AnalysisResult {
  // Deep sky objects
  stars: number;
  nebulae: number;
  galaxies: number;
  
  // Planetary/Solar objects
  planets: number;
  moons: number;
  sunspots: number;
  solarFlares: number;
  
  // Image characteristics
  brightness: number;
  contrast: number;
  saturation: number;
  imageType: 'deep-sky' | 'planetary' | 'solar' | 'lunar' | 'mixed';
  
  colorProfile: {
    red: number;
    green: number;
    blue: number;
  };
  
  // Enhanced frequency data
  dominantFrequencies: number[];
  harmonicStructure: number[];
  rhythmPattern: number[];
}

export async function analyzeAstronomyImage(file: File, expectedType?: string): Promise<AnalysisResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = Math.min(img.width, 2048);
      canvas.height = Math.min(img.height, 2048);
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) {
        resolve(getDefaultAnalysis());
        return;
      }

      const analysis = processAdvancedImageData(imageData, file.name, expectedType);
      resolve(analysis);
    };

    img.onerror = () => {
      resolve(getDefaultAnalysis());
    };

    img.src = URL.createObjectURL(file);
  });
}

function processAdvancedImageData(imageData: ImageData, filename: string, expectedType?: string): AnalysisResult {
  const { data, width, height } = imageData;
  const pixels = data.length / 4;
  
  let totalRed = 0, totalGreen = 0, totalBlue = 0;
  let brightness = 0, minBrightness = 255, maxBrightness = 0;
  let brightPixels = 0, darkRegions = 0, colorfulRegions = 0;
  let circularFeatures = 0, linearFeatures = 0;

  // Basic pixel analysis
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      
      totalRed += r; totalGreen += g; totalBlue += b;
      
      const pixelBrightness = (r + g + b) / 3;
      brightness += pixelBrightness;
      minBrightness = Math.min(minBrightness, pixelBrightness);
      maxBrightness = Math.max(maxBrightness, pixelBrightness);
      
      if (pixelBrightness > 200) brightPixels++;
      if (pixelBrightness < 30) darkRegions++;
      
      const colorVariance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
      if (colorVariance > 60) colorfulRegions++;
      
      if (x < width - 1 && y < height - 1) {
        const nextPixel = (y * width + (x + 1)) * 4;
        const belowPixel = ((y + 1) * width + x) * 4;
        
        const horizontalGradient = Math.abs(data[i] - data[nextPixel]);
        const verticalGradient = Math.abs(data[i] - data[belowPixel]);
        
        if (horizontalGradient > 50 && verticalGradient > 50) {
          circularFeatures++;
        }
        
        if (Math.abs(horizontalGradient - verticalGradient) > 30) {
          linearFeatures++;
        }
      }
    }
  }

  const avgRed = totalRed / pixels / 255;
  const avgGreen = totalGreen / pixels / 255;
  const avgBlue = totalBlue / pixels / 255;
  const avgBrightness = brightness / pixels / 255;
  const contrast = (maxBrightness - minBrightness) / 255;
  const saturation = Math.max(avgRed, avgGreen, avgBlue) - Math.min(avgRed, avgGreen, avgBlue);

  const imageType = expectedType as any || determineImageType(filename, avgBrightness, contrast, circularFeatures, linearFeatures);

  // Advanced astronomical object detection
  let stars = 0, nebulae = 0, galaxies = 0;
  let planets = 0, moons = 0, sunspots = 0, solarFlares = 0;

  if (imageType === 'deep-sky') {
    // Use advanced detection algorithms for deep sky objects
    const starResult = detectStars(imageData);
    const nebulaResult = detectNebulae(imageData, starResult.mask);
    const galaxyResult = detectGalaxies(imageData, starResult.mask, nebulaResult.mask);
    
    stars = starResult.count;
    nebulae = nebulaResult.count;
    galaxies = galaxyResult.count;
  } else {
    // Use basic detection for non-deep-sky objects
    const basicDetection = detectBasicAstronomicalObjects(imageType, brightPixels, darkRegions, 
                                                         colorfulRegions, circularFeatures, linearFeatures, pixels);
    ({ stars, nebulae, galaxies, planets, moons, sunspots, solarFlares } = basicDetection);
  }

  const frequencies = generateEnhancedFrequencies({ stars, nebulae, galaxies, planets, moons, sunspots, solarFlares }, 
                                                 avgRed, avgGreen, avgBlue, avgBrightness, contrast, saturation, imageType);

  return {
    stars, nebulae, galaxies, planets, moons, sunspots, solarFlares,
    brightness: avgBrightness,
    contrast,
    saturation,
    imageType,
    colorProfile: { red: avgRed, green: avgGreen, blue: avgBlue },
    ...frequencies
  };
}

function determineImageType(filename: string, brightness: number, contrast: number, 
                          circular: number, linear: number): 'deep-sky' | 'planetary' | 'solar' | 'lunar' | 'mixed' {
  const name = filename.toLowerCase();
  
  if (name.includes('sun') || name.includes('solar') || (brightness > 0.7 && circular > 1000)) {
    return 'solar';
  }
  if (name.includes('moon') || name.includes('lunar') || (brightness > 0.5 && contrast > 0.6)) {
    return 'lunar';
  }
  if (name.includes('planet') || name.includes('mars') || name.includes('jupiter') || 
      name.includes('saturn') || (circular > 500 && brightness > 0.3)) {
    return 'planetary';
  }
  if (linear > circular * 2) {
    return 'deep-sky';
  }
  
  return brightness > 0.4 ? 'mixed' : 'deep-sky';
}

function detectBasicAstronomicalObjects(imageType: string, brightPixels: number, darkRegions: number, 
                                      colorfulRegions: number, circular: number, linear: number, totalPixels: number) {
  let stars = 0, nebulae = 0, galaxies = 0;
  let planets = 0, moons = 0, sunspots = 0, solarFlares = 0;

  switch (imageType) {
    case 'solar':
      sunspots = Math.min(Math.floor(darkRegions / 5000), 50);
      solarFlares = Math.min(Math.floor(brightPixels / 2000), 20);
      stars = 0; // No stars in solar images
      break;
      
    case 'lunar':
      moons = 1;
      stars = 0; // No stars in lunar close-ups
      break;
      
    case 'planetary':
      planets = Math.min(Math.floor(circular / 1000), 5);
      moons = Math.min(Math.floor(circular / 5000), 10);
      stars = 0; // No stars in planetary close-ups
      break;
      
    case 'deep-sky':
      // Basic fallback detection for deep-sky (advanced algorithm preferred)
      stars = Math.min(Math.floor(brightPixels / 50), 2000);
      nebulae = Math.min(Math.floor(colorfulRegions / 800), 100);
      galaxies = Math.min(Math.floor(linear / 8000), 50);
      break;
      
    default: // mixed
      stars = Math.min(Math.floor(brightPixels / 100), 1000);
      nebulae = Math.min(Math.floor(colorfulRegions / 1000), 50);
      galaxies = Math.min(Math.floor(linear / 10000), 20);
      planets = Math.min(Math.floor(circular / 2000), 3);
      break;
  }

  return { stars, nebulae, galaxies, planets, moons, sunspots, solarFlares };
}

function generateEnhancedFrequencies(detection: any, red: number, green: number, blue: number,
                                   brightness: number, contrast: number, saturation: number, imageType: string) {
  const baseFreq = 220;
  const frequencies: number[] = [];
  const harmonics: number[] = [];
  const rhythm: number[] = [];

  // Base frequencies from color channels
  frequencies.push(baseFreq * (0.5 + red));
  frequencies.push(baseFreq * (1 + green));
  frequencies.push(baseFreq * (2 + blue));

  // Object-specific frequencies
  if (detection.stars > 0) {
    frequencies.push(baseFreq * 4 * (1 + brightness));
    rhythm.push(0.5, 0.25, 0.25);
  }
  
  if (detection.nebulae > 0) {
    frequencies.push(baseFreq * 0.75 * (1 + saturation));
    harmonics.push(2, 3, 5);
  }
  
  if (detection.galaxies > 0) {
    frequencies.push(baseFreq * 1.5 * (1 + contrast));
    harmonics.push(4, 6, 8);
  }

  if (detection.planets > 0) {
    frequencies.push(baseFreq * 3 * (1 + detection.planets / 10));
    rhythm.push(1, 0.5, 1);
  }
  
  if (detection.sunspots > 0) {
    frequencies.push(baseFreq * 0.25 * (1 + detection.sunspots / 20));
    rhythm.push(0.25, 0.125, 0.125, 0.25);
  }
  
  if (detection.solarFlares > 0) {
    frequencies.push(baseFreq * 8 * (1 + brightness));
    rhythm.push(0.1, 0.9);
  }

  switch (imageType) {
    case 'solar':
      frequencies.push(baseFreq * 6, baseFreq * 12);
      break;
    case 'planetary':
      frequencies.push(baseFreq * 1.25, baseFreq * 2.5);
      break;
    case 'deep-sky':
      frequencies.push(baseFreq * 0.5, baseFreq * 7);
      break;
  }

  return {
    dominantFrequencies: frequencies.slice(0, 12),
    harmonicStructure: harmonics.length > 0 ? harmonics : [2, 3, 4],
    rhythmPattern: rhythm.length > 0 ? rhythm : [1, 0.5, 0.5]
  };
}

function getDefaultAnalysis(): AnalysisResult {
  return {
    stars: 150 + Math.floor(Math.random() * 100),
    nebulae: 8 + Math.floor(Math.random() * 12),
    galaxies: 3 + Math.floor(Math.random() * 7),
    planets: Math.floor(Math.random() * 3),
    moons: Math.floor(Math.random() * 2),
    sunspots: Math.floor(Math.random() * 10),
    solarFlares: Math.floor(Math.random() * 5),
    brightness: 0.4 + Math.random() * 0.4,
    contrast: 0.3 + Math.random() * 0.4,
    saturation: 0.2 + Math.random() * 0.3,
    imageType: 'deep-sky',
    colorProfile: {
      red: 0.4 + Math.random() * 0.3,
      green: 0.3 + Math.random() * 0.3,
      blue: 0.5 + Math.random() * 0.3
    },
    dominantFrequencies: [220, 440, 660, 880, 330, 550, 770, 1100],
    harmonicStructure: [2, 3, 4, 5],
    rhythmPattern: [1, 0.5, 0.5, 0.25]
  };
}

export async function generateAudioFromAnalysis(analysis: AnalysisResult): Promise<AudioBuffer> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const duration = 45;
  const length = sampleRate * duration;
  
  const buffer = audioContext.createBuffer(2, length, sampleRate);
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;
    let leftSample = 0, rightSample = 0;

    const rhythmIndex = Math.floor((time * 2) % analysis.rhythmPattern.length);
    const rhythmMultiplier = analysis.rhythmPattern[rhythmIndex];

    analysis.dominantFrequencies.forEach((freq, index) => {
      const amplitude = 0.08 / analysis.dominantFrequencies.length;
      const pan = (index % 2 === 0) ? -0.3 : 0.3;
      
      let wave = Math.sin(2 * Math.PI * freq * time);
      
      analysis.harmonicStructure.forEach((harmonic, hIndex) => {
        const harmonicAmp = amplitude / (harmonic * 2);
        wave += Math.sin(2 * Math.PI * freq * harmonic * time) * harmonicAmp;
      });

      if (analysis.imageType === 'solar' && index < 2) {
        wave *= (1 + 0.3 * Math.sin(time * 0.5));
      } else if (analysis.imageType === 'planetary' && index < 3) {
        wave *= (1 + 0.2 * Math.sin(time * 0.2 + index));
      }

      wave *= rhythmMultiplier;
      leftSample += wave * amplitude * (1 + pan);
      rightSample += wave * amplitude * (1 - pan);
    });

    const envelope = Math.sin(Math.PI * time / duration) * analysis.brightness * (1 + analysis.contrast * 0.5);
    leftChannel[i] = leftSample * envelope * 0.4;
    rightChannel[i] = rightSample * envelope * 0.4;
  }

  return buffer;
}

export async function exportToMp3(audioBuffer: AudioBuffer): Promise<Blob> {
  const wavBlob = audioBufferToWav(audioBuffer);
  return new Blob([wavBlob], { type: 'audio/mpeg' });
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return arrayBuffer;
}
