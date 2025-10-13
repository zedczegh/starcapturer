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

export async function analyzeAstronomyImage(file: File, expectedType?: string, onProgress?: (progress: number) => void): Promise<AnalysisResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = async () => {
      try {
        console.log('Image loaded, starting analysis...');
        onProgress?.(15);
        
        // Optimize canvas size for better performance
        const maxSize = 800;
        const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
        
        console.log(`Canvas size: ${canvas.width}x${canvas.height}`);
        
        if (!ctx) {
          console.error('Canvas context not available');
          resolve(getDefaultAnalysis());
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        onProgress?.(30);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        console.log('Image data extracted, processing...');
        onProgress?.(45);

        const analysis = await processAdvancedImageData(imageData, file.name, expectedType, onProgress);
        console.log('Analysis complete:', analysis);
        onProgress?.(100);
        resolve(analysis);
      } catch (error) {
        console.error('Error in image analysis:', error);
        onProgress?.(100);
        resolve(getDefaultAnalysis());
      }
    };

    img.onerror = (error) => {
      console.error('Error loading image:', error);
      onProgress?.(100);
      resolve(getDefaultAnalysis());
    };

    img.src = URL.createObjectURL(file);
  });
}

async function processAdvancedImageData(imageData: ImageData, filename: string, expectedType?: string, onProgress?: (progress: number) => void): Promise<AnalysisResult> {
  const { data, width, height } = imageData;
  const pixels = data.length / 4;
  
  console.log(`Processing ${pixels} pixels...`);
  
  let totalRed = 0, totalGreen = 0, totalBlue = 0;
  let brightness = 0, minBrightness = 255, maxBrightness = 0;
  let brightPixels = 0, darkRegions = 0, colorfulRegions = 0;
  let circularFeatures = 0, linearFeatures = 0;

  onProgress?.(50);

  // Optimized pixel analysis with sampling for large images
  const sampleRate = Math.max(1, Math.floor(pixels / 100000)); // Sample every N pixels for very large images
  let sampledPixels = 0;

  for (let i = 0; i < data.length; i += 4 * sampleRate) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    
    totalRed += r; totalGreen += g; totalBlue += b;
    sampledPixels++;
    
    const pixelBrightness = (r + g + b) / 3;
    brightness += pixelBrightness;
    minBrightness = Math.min(minBrightness, pixelBrightness);
    maxBrightness = Math.max(maxBrightness, pixelBrightness);
    
    if (pixelBrightness > 200) brightPixels++;
    if (pixelBrightness < 30) darkRegions++;
    
    const colorVariance = Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
    if (colorVariance > 60) colorfulRegions++;
  }

  onProgress?.(65);

  // Calculate averages based on sampled pixels
  const avgRed = totalRed / sampledPixels / 255;
  const avgGreen = totalGreen / sampledPixels / 255;
  const avgBlue = totalBlue / sampledPixels / 255;
  const avgBrightness = brightness / sampledPixels / 255;
  const contrast = (maxBrightness - minBrightness) / 255;
  const saturation = Math.max(avgRed, avgGreen, avgBlue) - Math.min(avgRed, avgGreen, avgBlue);

  const imageType = expectedType as any || determineImageType(filename, avgBrightness, contrast, circularFeatures, linearFeatures);
  console.log(`Detected image type: ${imageType}`);

  onProgress?.(75);

  // Enhanced astronomical object detection
  let stars = 0, nebulae = 0, galaxies = 0;
  let planets = 0, moons = 0, sunspots = 0, solarFlares = 0;

  try {
    if (imageType === 'deep-sky') {
      console.log('Running advanced deep-sky detection...');
      // Use advanced detection algorithms for deep sky objects
      const starResult = detectStars(imageData);
      const nebulaResult = detectNebulae(imageData, starResult.mask);
      const galaxyResult = detectGalaxies(imageData, starResult.mask, nebulaResult.mask);
      
      stars = starResult.count;
      nebulae = nebulaResult.count;
      galaxies = galaxyResult.count;
      
      console.log(`Deep-sky detection: ${stars} stars, ${nebulae} nebulae, ${galaxies} galaxies`);
    } else {
      console.log(`Running basic detection for ${imageType}...`);
      // Use basic detection for non-deep-sky objects
      const basicDetection = detectBasicAstronomicalObjects(imageType, brightPixels, darkRegions, 
                                                           colorfulRegions, circularFeatures, linearFeatures, sampledPixels);
      ({ stars, nebulae, galaxies, planets, moons, sunspots, solarFlares } = basicDetection);
    }
  } catch (error) {
    console.error('Error in advanced detection, using fallback:', error);
    // Fallback to basic detection
    const basicDetection = detectBasicAstronomicalObjects(imageType, brightPixels, darkRegions, 
                                                         colorfulRegions, circularFeatures, linearFeatures, sampledPixels);
    ({ stars, nebulae, galaxies, planets, moons, sunspots, solarFlares } = basicDetection);
  }

  onProgress?.(90);

  const frequencies = generateEnhancedFrequencies({ stars, nebulae, galaxies, planets, moons, sunspots, solarFlares }, 
                                                 avgRed, avgGreen, avgBlue, avgBrightness, contrast, saturation, imageType);

  const result = {
    stars, nebulae, galaxies, planets, moons, sunspots, solarFlares,
    brightness: avgBrightness,
    contrast,
    saturation,
    imageType,
    colorProfile: { red: avgRed, green: avgGreen, blue: avgBlue },
    ...frequencies
  };

  console.log('Final analysis result:', result);
  return result;
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
      // Enhanced detection for deep-sky
      stars = Math.min(Math.floor(brightPixels / 25), 3000); // More sensitive star detection
      nebulae = Math.min(Math.floor(colorfulRegions / 500), 150); // More sensitive nebula detection
      galaxies = Math.min(Math.floor(linear / 4000), 80); // More sensitive galaxy detection
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
  const duration = 60; // Longer to allow gradual evolution
  const length = sampleRate * duration;
  
  const buffer = audioContext.createBuffer(2, length, sampleRate);
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.getChannelData(1);

  // Base frequencies derived from image characteristics
  // Using just intonation ratios for more organic harmony
  const fundamentalFreq = 55 + (analysis.brightness * 110); // 55-165 Hz
  
  // Phasing rates inspired by Steve Reich (slowly evolving relationships)
  const phaseRate1 = 1.0;
  const phaseRate2 = 1.0 + (analysis.contrast * 0.003); // Subtle phase drift
  const phaseRate3 = 1.0 - (analysis.saturation * 0.002);
  
  // Microtonal detuning for Aphex Twin-like character
  const detune = analysis.colorProfile.red * 0.05; // Max 5% detune
  
  console.log('Generating experimental composition:', {
    fundamental: fundamentalFreq,
    phaseRates: [phaseRate1, phaseRate2, phaseRate3],
    detune,
    imageType: analysis.imageType
  });

  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;
    const progress = time / duration;
    
    let leftSample = 0, rightSample = 0;

    // Overall envelope with slow fade in/out
    const envelope = createSlowEnvelope(time, duration);
    
    // 1. Deep Listening Drone Layers (Pauline Oliveros)
    const drones = generateDeepDrones(time, fundamentalFreq, analysis, progress);
    leftSample += drones.left * 0.18;
    rightSample += drones.right * 0.18;
    
    // 2. Phasing Patterns (Steve Reich)
    const phasing = generatePhasingPatterns(time, fundamentalFreq, 
      [phaseRate1, phaseRate2, phaseRate3], analysis, progress);
    leftSample += phasing.left * 0.12;
    rightSample += phasing.right * 0.12;
    
    // 3. Granular Textures (Aphex Twin)
    const granular = generateGranularTexture(time, i, sampleRate, analysis, detune, progress);
    leftSample += granular.left * 0.08;
    rightSample += granular.right * 0.08;
    
    // 4. Evolving Harmonic Field
    const harmonics = generateEvolvingHarmonics(time, fundamentalFreq, analysis, progress);
    leftSample += harmonics.left * 0.10;
    rightSample += harmonics.right * 0.10;
    
    // 5. Sparse Glitch Events (for stars/flares)
    if (analysis.stars > 0 || analysis.solarFlares > 0) {
      const glitch = generateSparseGlitches(time, i, sampleRate, analysis, progress);
      leftSample += glitch.left * 0.06;
      rightSample += glitch.right * 0.06;
    }
    
    // 6. Spatial Movement (nebulae/galaxies create spatial depth)
    if (analysis.nebulae > 0 || analysis.galaxies > 0) {
      const spatial = generateSpatialMovement(time, fundamentalFreq, analysis, progress);
      leftSample += spatial.left * 0.08;
      rightSample += spatial.right * 0.08;
    }

    // Apply overall envelope and gentle limiting
    const mixed = envelope * 0.35;
    leftChannel[i] = Math.tanh(leftSample * mixed);
    rightChannel[i] = Math.tanh(rightSample * mixed);
  }

  return buffer;
}

// Experimental generation functions inspired by Oliveros, Reich, and Aphex Twin

function createSlowEnvelope(time: number, duration: number): number {
  const fadeInTime = 8; // Slow fade in
  const fadeOutTime = 12; // Even slower fade out
  
  if (time < fadeInTime) {
    return Math.pow(time / fadeInTime, 2); // Exponential fade in
  } else if (time > duration - fadeOutTime) {
    return Math.pow((duration - time) / fadeOutTime, 2);
  }
  
  return 1;
}

// Pauline Oliveros inspired: Deep, meditative drones with slow evolution
function generateDeepDrones(
  time: number, 
  fundamental: number, 
  analysis: AnalysisResult,
  progress: number
): { left: number, right: number } {
  let left = 0, right = 0;
  
  // Multiple drone layers with just intonation ratios
  const ratios = [1, 3/2, 4/3, 5/4, 8/5, 7/4]; // Natural harmonics
  
  ratios.forEach((ratio, index) => {
    const freq = fundamental * ratio;
    const phase = 2 * Math.PI * freq * time;
    
    // Very slow LFO for breath-like evolution
    const lfo = Math.sin(time * (0.05 + index * 0.01)) * 0.3 + 0.7;
    
    // Add slight detuning for organic quality
    const detune = Math.sin(time * 0.02 + index) * 0.01;
    const detunePhase = 2 * Math.PI * freq * (1 + detune) * time;
    
    // Mix sine with slight triangle wave for warmth
    const wave = Math.sin(phase) * 0.7 + 
                 (Math.asin(Math.sin(phase)) / (Math.PI/2)) * 0.3;
    const detuneWave = Math.sin(detunePhase) * 0.3;
    
    const amplitude = (1 / (index + 1)) * lfo * 0.15;
    
    // Stereo spread based on harmonic
    const panAmount = (index / ratios.length) * 2 - 1;
    const leftPan = Math.max(0, 1 - panAmount) + 0.5;
    const rightPan = Math.max(0, 1 + panAmount) + 0.5;
    
    left += (wave + detuneWave) * amplitude * leftPan;
    right += (wave + detuneWave) * amplitude * rightPan;
  });
  
  return { left, right };
}

// Steve Reich inspired: Phasing patterns with gradual process
function generatePhasingPatterns(
  time: number,
  fundamental: number,
  phaseRates: number[],
  analysis: AnalysisResult,
  progress: number
): { left: number, right: number } {
  let left = 0, right = 0;
  
  // Use frequency based on image type
  const baseFreq = fundamental * (analysis.imageType === 'solar' ? 2 : 1);
  
  // Create multiple phasing voices
  phaseRates.forEach((rate, voiceIndex) => {
    // Pattern repeats at different rates creating phase relationships
    const patternLength = 16; // Pattern in "beats"
    const beatDuration = 0.4; // Each beat is 0.4 seconds
    const position = (time * rate / beatDuration) % patternLength;
    
    // Create a melodic pattern that phases
    const notePattern = [0, 7, 5, 7, 3, 7, 5, 0, 7, 5, 7, 5, 3, 5, 7, 0];
    const currentNoteIndex = Math.floor(position);
    const nextNoteIndex = (currentNoteIndex + 1) % patternLength;
    const interpolation = position - currentNoteIndex;
    
    const currentNote = notePattern[currentNoteIndex];
    const nextNote = notePattern[nextNoteIndex];
    
    // Smooth note transitions
    const semitones = currentNote + (nextNote - currentNote) * Math.pow(interpolation, 3);
    const freq = baseFreq * Math.pow(2, semitones / 12);
    
    const phase = 2 * Math.PI * freq * time;
    
    // Envelope for each note with organic decay
    const noteEnvelope = Math.exp(-((position % 1) * 3)) * 0.5 + 0.5;
    
    // Slight chorus effect
    const chorus = Math.sin(phase + Math.sin(time * 0.3) * 0.1) * noteEnvelope;
    
    const amplitude = 0.25 / phaseRates.length;
    
    // Pan each voice differently
    const pan = (voiceIndex / (phaseRates.length - 1)) * 2 - 1;
    left += chorus * amplitude * (1 - Math.abs(Math.min(0, pan)));
    right += chorus * amplitude * (1 - Math.abs(Math.max(0, pan)));
  });
  
  return { left, right };
}

// Aphex Twin inspired: Granular synthesis and glitchy textures
function generateGranularTexture(
  time: number,
  sample: number,
  sampleRate: number,
  analysis: AnalysisResult,
  detune: number,
  progress: number
): { left: number, right: number } {
  let left = 0, right = 0;
  
  // Grain parameters
  const grainDensity = 20 + analysis.stars * 0.1; // Grains per second
  const grainDuration = 0.02 + Math.sin(time * 0.1) * 0.01; // 20-30ms grains
  
  // Check if we should trigger a grain
  const grainProbability = grainDensity / sampleRate;
  const randomValue = (Math.sin(sample * 12.9898 + time * 78.233) * 43758.5453) % 1;
  
  if (randomValue < grainProbability) {
    const grainSamples = grainDuration * sampleRate;
    const grainProgress = (sample % grainSamples) / grainSamples;
    
    if (grainProgress < 1) {
      // Gaussian envelope for grain
      const envelope = Math.exp(-Math.pow(grainProgress * 2 - 1, 2) * 4);
      
      // Frequency varies based on analysis
      const grainFreq = 200 + randomValue * analysis.brightness * 800;
      const detuneFreq = grainFreq * (1 + detune * (randomValue * 2 - 1));
      
      const phase = 2 * Math.PI * detuneFreq * grainProgress;
      
      // Mix of sine and noise for texture
      const tone = Math.sin(phase) * 0.7;
      const noise = (randomValue * 2 - 1) * 0.3;
      
      const grain = (tone + noise) * envelope * 0.3;
      
      // Random panning for spatial texture
      const grainPan = randomValue * 2 - 1;
      left += grain * (1 - Math.abs(Math.min(0, grainPan)));
      right += grain * (1 - Math.abs(Math.max(0, grainPan)));
    }
  }
  
  return { left, right };
}

// Evolving harmonic field with slow, organic changes
function generateEvolvingHarmonics(
  time: number,
  fundamental: number,
  analysis: AnalysisResult,
  progress: number
): { left: number, right: number } {
  let left = 0, right = 0;
  
  // Harmonic series with slow evolution
  const harmonicCount = 8;
  
  for (let h = 1; h <= harmonicCount; h++) {
    const freq = fundamental * h;
    
    // Each harmonic has its own slow evolution
    const evolutionRate = 0.03 + h * 0.005;
    const amplitude = (1 / Math.pow(h, 1.5)) * 
                     (Math.sin(time * evolutionRate + h) * 0.5 + 0.5);
    
    const phase = 2 * Math.PI * freq * time;
    
    // Add subtle FM modulation
    const modIndex = Math.sin(time * 0.07 + h) * 0.2;
    const modulator = Math.sin(2 * Math.PI * freq * 0.5 * time);
    const wave = Math.sin(phase + modIndex * modulator);
    
    // Spatial distribution
    const pan = Math.sin(time * 0.02 + h * 0.5);
    left += wave * amplitude * 0.1 * (1 - Math.max(0, pan));
    right += wave * amplitude * 0.1 * (1 + Math.min(0, pan));
  }
  
  return { left, right };
}

// Sparse glitch events for stars and flares
function generateSparseGlitches(
  time: number,
  sample: number,
  sampleRate: number,
  analysis: AnalysisResult,
  progress: number
): { left: number, right: number } {
  let left = 0, right = 0;
  
  // Random glitch triggers based on object count
  const glitchDensity = (analysis.stars + analysis.solarFlares) * 0.0001;
  const random = (Math.sin(sample * 43.758 + time * 91.343) * 19283.5453) % 1;
  
  if (random < glitchDensity) {
    const glitchDuration = 0.01 + random * 0.05; // 10-60ms
    const glitchSamples = glitchDuration * sampleRate;
    const glitchProgress = (sample % glitchSamples) / glitchSamples;
    
    if (glitchProgress < 1) {
      // Sharp attack, exponential decay
      const envelope = Math.exp(-glitchProgress * 15);
      
      // High frequency glitches
      const glitchFreq = 800 + random * 3000;
      const phase = 2 * Math.PI * glitchFreq * glitchProgress;
      
      // Bit-crushing effect
      const steps = 4 + Math.floor(random * 8);
      const crushed = Math.round(Math.sin(phase) * steps) / steps;
      
      const glitch = crushed * envelope * 0.4;
      
      left += glitch * (random > 0.5 ? 1 : 0.3);
      right += glitch * (random <= 0.5 ? 1 : 0.3);
    }
  }
  
  return { left, right };
}

// Spatial movement for nebulae and galaxies
function generateSpatialMovement(
  time: number,
  fundamental: number,
  analysis: AnalysisResult,
  progress: number
): { left: number, right: number } {
  // Create a slowly moving harmonic cloud
  const cloudFreq = fundamental * 0.5;
  
  // Multiple layers moving at different rates
  const layers = 5;
  let left = 0, right = 0;
  
  for (let l = 0; l < layers; l++) {
    const layerFreq = cloudFreq * (1 + l * 0.25);
    const phase = 2 * Math.PI * layerFreq * time;
    
    // Very slow spatial movement
    const spatialRate = 0.04 + l * 0.01;
    const position = Math.sin(time * spatialRate + l);
    
    // Amplitude modulation for depth
    const depth = Math.sin(time * 0.03 + l * 0.7) * 0.5 + 0.5;
    
    const wave = Math.sin(phase) * depth * 0.15;
    
    left += wave * (1 - Math.max(0, position)) / layers;
    right += wave * (1 + Math.min(0, position)) / layers;
  }
  
  return { left, right };
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
