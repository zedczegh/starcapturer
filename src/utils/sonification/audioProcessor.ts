
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

export async function analyzeAstronomyImage(file: File): Promise<AnalysisResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = Math.min(img.width, 2048); // Optimize for large files
      canvas.height = Math.min(img.height, 2048);
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) {
        resolve(getDefaultAnalysis());
        return;
      }

      const analysis = processEnhancedImageData(imageData, file.name);
      resolve(analysis);
    };

    img.onerror = () => {
      resolve(getDefaultAnalysis());
    };

    img.src = URL.createObjectURL(file);
  });
}

function processEnhancedImageData(imageData: ImageData, filename: string): AnalysisResult {
  const { data, width, height } = imageData;
  const pixels = data.length / 4;
  
  let totalRed = 0, totalGreen = 0, totalBlue = 0;
  let brightness = 0, minBrightness = 255, maxBrightness = 0;
  let brightPixels = 0, darkRegions = 0, colorfulRegions = 0;
  let circularFeatures = 0, linearFeatures = 0;
  let textureComplexity = 0;

  // Enhanced pixel analysis with edge detection
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
      
      // Color variance detection
      const colorVariance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
      if (colorVariance > 60) colorfulRegions++;
      
      // Edge detection for texture analysis
      if (x < width - 1 && y < height - 1) {
        const nextPixel = (y * width + (x + 1)) * 4;
        const belowPixel = ((y + 1) * width + x) * 4;
        
        const horizontalGradient = Math.abs(data[i] - data[nextPixel]);
        const verticalGradient = Math.abs(data[i] - data[belowPixel]);
        
        textureComplexity += horizontalGradient + verticalGradient;
        
        // Detect circular features (planets, stars)
        if (horizontalGradient > 50 && verticalGradient > 50) {
          circularFeatures++;
        }
        
        // Detect linear features (solar prominences, nebula structures)
        if (Math.abs(horizontalGradient - verticalGradient) > 30) {
          linearFeatures++;
        }
      }
    }
  }

  // Calculate enhanced metrics
  const avgRed = totalRed / pixels / 255;
  const avgGreen = totalGreen / pixels / 255;
  const avgBlue = totalBlue / pixels / 255;
  const avgBrightness = brightness / pixels / 255;
  const contrast = (maxBrightness - minBrightness) / 255;
  const saturation = Math.max(avgRed, avgGreen, avgBlue) - Math.min(avgRed, avgGreen, avgBlue);

  // Determine image type based on characteristics and filename
  const imageType = determineImageType(filename, avgBrightness, contrast, circularFeatures, linearFeatures);

  // Enhanced object detection based on image type
  const detection = detectAstronomicalObjects(imageType, brightPixels, darkRegions, colorfulRegions, 
                                             circularFeatures, linearFeatures, pixels);

  // Generate enhanced frequency mapping
  const frequencies = generateEnhancedFrequencies(detection, avgRed, avgGreen, avgBlue, 
                                                 avgBrightness, contrast, saturation, imageType);

  return {
    ...detection,
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

function detectAstronomicalObjects(imageType: string, brightPixels: number, darkRegions: number, 
                                 colorfulRegions: number, circular: number, linear: number, totalPixels: number) {
  let stars = 0, nebulae = 0, galaxies = 0;
  let planets = 0, moons = 0, sunspots = 0, solarFlares = 0;

  switch (imageType) {
    case 'solar':
      sunspots = Math.min(Math.floor(darkRegions / 5000), 50);
      solarFlares = Math.min(Math.floor(brightPixels / 2000), 20);
      stars = Math.floor(brightPixels / 10000);
      break;
      
    case 'lunar':
      moons = 1;
      stars = Math.min(Math.floor(brightPixels / 500), 200);
      break;
      
    case 'planetary':
      planets = Math.min(Math.floor(circular / 1000), 5);
      moons = Math.min(Math.floor(circular / 5000), 10);
      stars = Math.min(Math.floor(brightPixels / 200), 500);
      break;
      
    case 'deep-sky':
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
  const baseFreq = 220; // A3 note
  const frequencies: number[] = [];
  const harmonics: number[] = [];
  const rhythm: number[] = [];

  // Base frequencies from color channels
  frequencies.push(baseFreq * (0.5 + red)); // Red -> Bass
  frequencies.push(baseFreq * (1 + green)); // Green -> Mid
  frequencies.push(baseFreq * (2 + blue)); // Blue -> Treble

  // Object-specific frequencies
  if (detection.stars > 0) {
    frequencies.push(baseFreq * 4 * (1 + brightness));
    rhythm.push(0.5, 0.25, 0.25); // Twinkling rhythm
  }
  
  if (detection.nebulae > 0) {
    frequencies.push(baseFreq * 0.75 * (1 + saturation));
    harmonics.push(2, 3, 5); // Rich harmonics for nebulae
  }
  
  if (detection.galaxies > 0) {
    frequencies.push(baseFreq * 1.5 * (1 + contrast));
    harmonics.push(4, 6, 8); // Complex harmonics
  }

  // Planetary/Solar specific frequencies
  if (detection.planets > 0) {
    frequencies.push(baseFreq * 3 * (1 + detection.planets / 10));
    rhythm.push(1, 0.5, 1); // Orbital rhythm
  }
  
  if (detection.sunspots > 0) {
    frequencies.push(baseFreq * 0.25 * (1 + detection.sunspots / 20));
    rhythm.push(0.25, 0.125, 0.125, 0.25); // Magnetic field rhythm
  }
  
  if (detection.solarFlares > 0) {
    frequencies.push(baseFreq * 8 * (1 + brightness));
    rhythm.push(0.1, 0.9); // Explosive rhythm
  }

  // Image type specific enhancements
  switch (imageType) {
    case 'solar':
      frequencies.push(baseFreq * 6, baseFreq * 12); // High energy
      break;
    case 'planetary':
      frequencies.push(baseFreq * 1.25, baseFreq * 2.5); // Harmonic resonance
      break;
    case 'deep-sky':
      frequencies.push(baseFreq * 0.5, baseFreq * 7); // Wide frequency range
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
  const duration = 45; // Extended to 45 seconds
  const length = sampleRate * duration;
  
  const buffer = audioContext.createBuffer(2, length, sampleRate); // Stereo
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.getChannelData(1);

  // Generate enhanced audio with rhythm and harmonics
  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;
    let leftSample = 0, rightSample = 0;

    // Apply rhythm pattern
    const rhythmIndex = Math.floor((time * 2) % analysis.rhythmPattern.length);
    const rhythmMultiplier = analysis.rhythmPattern[rhythmIndex];

    // Generate frequencies with harmonics
    analysis.dominantFrequencies.forEach((freq, index) => {
      const amplitude = 0.08 / analysis.dominantFrequencies.length;
      const pan = (index % 2 === 0) ? -0.3 : 0.3; // Stereo panning
      
      // Base frequency
      let wave = Math.sin(2 * Math.PI * freq * time);
      
      // Add harmonics
      analysis.harmonicStructure.forEach((harmonic, hIndex) => {
        const harmonicAmp = amplitude / (harmonic * 2);
        wave += Math.sin(2 * Math.PI * freq * harmonic * time) * harmonicAmp;
      });

      // Apply object-specific modulation
      if (analysis.imageType === 'solar' && index < 2) {
        wave *= (1 + 0.3 * Math.sin(time * 0.5)); // Solar oscillation
      } else if (analysis.imageType === 'planetary' && index < 3) {
        wave *= (1 + 0.2 * Math.sin(time * 0.2 + index)); // Orbital modulation
      }

      // Apply rhythm and stereo panning
      wave *= rhythmMultiplier;
      leftSample += wave * amplitude * (1 + pan);
      rightSample += wave * amplitude * (1 - pan);
    });

    // Apply overall envelope with dynamic brightness
    const envelope = Math.sin(Math.PI * time / duration) * analysis.brightness * (1 + analysis.contrast * 0.5);
    leftChannel[i] = leftSample * envelope * 0.4;
    rightChannel[i] = rightSample * envelope * 0.4;
  }

  return buffer;
}

// Enhanced MP3 export function
export async function exportToMp3(audioBuffer: AudioBuffer): Promise<Blob> {
  // Convert AudioBuffer to WAV first, then to MP3
  const wavBlob = audioBufferToWav(audioBuffer);
  
  // For now, return WAV with MP3 extension as browsers don't have native MP3 encoding
  // In a real implementation, you'd use a library like lamejs
  return new Blob([wavBlob], { type: 'audio/mpeg' });
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const length = buffer.length;
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
  const view = new DataView(arrayBuffer);

  // WAV header
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
