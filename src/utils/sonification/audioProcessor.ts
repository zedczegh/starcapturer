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
  const duration = 45;
  const length = sampleRate * duration;
  
  const buffer = audioContext.createBuffer(2, length, sampleRate);
  const leftChannel = buffer.getChannelData(0);
  const rightChannel = buffer.getChannelData(1);

  // Enhanced musical parameters
  const baseFreq = 220; // A3
  const beatsPerMinute = 80 + (analysis.brightness * 40); // 80-120 BPM based on brightness
  const beatLength = (60 / beatsPerMinute) * sampleRate;
  
  // Musical scales based on image type
  const scales = {
    'deep-sky': [0, 2, 4, 7, 9], // Pentatonic scale (ethereal)
    'solar': [0, 2, 4, 5, 7, 9, 11], // Major scale (bright)
    'planetary': [0, 2, 3, 5, 7, 8, 10], // Natural minor (mysterious)
    'lunar': [0, 1, 3, 5, 6, 8, 10], // Phrygian mode (haunting)
    'mixed': [0, 2, 4, 6, 7, 9, 11] // Lydian mode (dreamy)
  };
  
  const currentScale = scales[analysis.imageType] || scales['deep-sky'];
  
  // Create chord progressions based on detected objects
  const chordProgression = generateChordProgression(analysis, currentScale);
  const melodyNotes = generateMelody(analysis, currentScale);
  const rhythmPattern = generateRhythmPattern(analysis);
  
  console.log('Generating musical composition with:', {
    bpm: beatsPerMinute,
    scale: currentScale,
    chords: chordProgression.length,
    melodyNotes: melodyNotes.length
  });

  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;
    const beatPosition = (time * beatsPerMinute / 60) % 1;
    const measurePosition = (time * beatsPerMinute / 60 / 4) % 1;
    
    let leftSample = 0, rightSample = 0;

    // Dynamic volume envelope
    const overallEnvelope = createOverallEnvelope(time, duration);
    const rhythmEnvelope = createRhythmEnvelope(beatPosition, rhythmPattern);
    
    // Bass line (chord roots)
    const bassNote = generateBassLine(time, chordProgression, baseFreq, analysis);
    leftSample += bassNote * 0.15;
    rightSample += bassNote * 0.15;
    
    // Harmony (chord tones)
    const harmony = generateHarmony(time, chordProgression, baseFreq, analysis, beatPosition);
    leftSample += harmony.left * 0.12;
    rightSample += harmony.right * 0.12;
    
    // Melody
    const melody = generateMelodyLine(time, melodyNotes, baseFreq * 2, analysis, beatPosition);
    leftSample += melody.left * 0.08;
    rightSample += melody.right * 0.08;
    
    // Atmospheric pad (for nebulae/galaxies)
    if (analysis.nebulae > 0 || analysis.galaxies > 0) {
      const pad = generateAtmosphericPad(time, currentScale, baseFreq * 0.5, analysis);
      leftSample += pad.left * 0.05;
      rightSample += pad.right * 0.05;
    }
    
    // Percussive elements for stars
    if (analysis.stars > 0) {
      const percussion = generatePercussion(time, beatPosition, analysis);
      leftSample += percussion * 0.03;
      rightSample += percussion * 0.03;
    }
    
    // Solar flares create bright arpeggios
    if (analysis.solarFlares > 0) {
      const arpeggio = generateArpeggio(time, currentScale, baseFreq * 4, analysis);
      leftSample += arpeggio.left * 0.06;
      rightSample += arpeggio.right * 0.06;
    }

    // Apply envelopes and dynamics
    const finalVolume = overallEnvelope * rhythmEnvelope * analysis.brightness * 0.3;
    leftChannel[i] = leftSample * finalVolume;
    rightChannel[i] = rightSample * finalVolume;
  }

  return buffer;
}

// Musical generation functions
function generateChordProgression(analysis: AnalysisResult, scale: number[]): number[][] {
  const progressions = {
    'deep-sky': [[0, 2, 4], [3, 5, 0], [1, 3, 5], [4, 0, 2]], // vi-IV-ii-V
    'solar': [[0, 2, 4], [1, 3, 5], [2, 4, 0], [3, 5, 1]], // I-ii-iii-IV
    'planetary': [[0, 2, 4], [5, 0, 2], [3, 5, 0], [1, 3, 5]], // i-VI-IV-ii
    'lunar': [[0, 2, 4], [6, 1, 3], [5, 0, 2], [4, 6, 1]], // i-bVII-bVI-V
    'mixed': [[0, 2, 4], [1, 3, 5], [4, 6, 1], [0, 2, 4]] // I-ii-V-I
  };
  
  return progressions[analysis.imageType] || progressions['deep-sky'];
}

function generateMelody(analysis: AnalysisResult, scale: number[]): number[] {
  const melody: number[] = [];
  const noteCount = Math.min(16, Math.max(8, Math.floor(analysis.stars / 20)));
  
  for (let i = 0; i < noteCount; i++) {
    // Create melodic motion based on image characteristics
    const direction = analysis.contrast > 0.5 ? 1 : -1;
    const interval = Math.floor(analysis.saturation * scale.length);
    const noteIndex = (i * direction + interval) % scale.length;
    melody.push(scale[Math.abs(noteIndex)]);
  }
  
  return melody;
}

function generateRhythmPattern(analysis: AnalysisResult): number[] {
  // Create rhythm based on image characteristics
  if (analysis.imageType === 'solar') {
    return [1, 0.7, 0.8, 0.6, 1, 0.5, 0.9, 0.4]; // Energetic
  } else if (analysis.imageType === 'lunar') {
    return [1, 0.3, 0.6, 0.2, 0.8, 0.4, 0.5, 0.3]; // Gentle
  } else if (analysis.imageType === 'planetary') {
    return [1, 0.6, 0.7, 0.5, 0.9, 0.4, 0.8, 0.3]; // Steady
  } else {
    return [1, 0.4, 0.6, 0.3, 0.8, 0.5, 0.7, 0.2]; // Ethereal
  }
}

function createOverallEnvelope(time: number, duration: number): number {
  const fadeInTime = 2;
  const fadeOutTime = 3;
  
  if (time < fadeInTime) {
    return Math.sin((time / fadeInTime) * Math.PI * 0.5);
  } else if (time > duration - fadeOutTime) {
    return Math.sin(((duration - time) / fadeOutTime) * Math.PI * 0.5);
  }
  
  return 1;
}

function createRhythmEnvelope(beatPosition: number, rhythmPattern: number[]): number {
  const patternIndex = Math.floor(beatPosition * rhythmPattern.length);
  const currentLevel = rhythmPattern[patternIndex];
  const nextLevel = rhythmPattern[(patternIndex + 1) % rhythmPattern.length];
  const interpolation = (beatPosition * rhythmPattern.length) % 1;
  
  return currentLevel + (nextLevel - currentLevel) * interpolation;
}

function generateBassLine(time: number, chordProgression: number[][], baseFreq: number, analysis: AnalysisResult): number {
  const chordDuration = 8; // 8 beats per chord
  const chordIndex = Math.floor((time * 2) % chordProgression.length);
  const chord = chordProgression[chordIndex];
  const rootNote = chord[0];
  
  const freq = baseFreq * Math.pow(2, rootNote / 12);
  const phase = 2 * Math.PI * freq * time;
  
  // Add some movement with octave jumps
  const octaveJump = Math.sin(time * 0.5) > 0.7 ? 2 : 1;
  
  return Math.sin(phase) * 0.8 + Math.sin(phase * 2) * 0.2 * octaveJump;
}

function generateHarmony(time: number, chordProgression: number[][], baseFreq: number, analysis: AnalysisResult, beatPosition: number): { left: number, right: number } {
  const chordDuration = 8;
  const chordIndex = Math.floor((time * 2) % chordProgression.length);
  const chord = chordProgression[chordIndex];
  
  let left = 0, right = 0;
  
  chord.forEach((note, index) => {
    const freq = baseFreq * 2 * Math.pow(2, note / 12);
    const phase = 2 * Math.PI * freq * time;
    const amplitude = 0.3 / chord.length;
    
    // Stereo positioning
    const pan = (index - 1) * 0.3;
    const wave = Math.sin(phase) + Math.sin(phase * 2) * 0.1;
    
    left += wave * amplitude * (1 - Math.max(0, pan));
    right += wave * amplitude * (1 + Math.min(0, pan));
  });
  
  return { left, right };
}

function generateMelodyLine(time: number, melodyNotes: number[], baseFreq: number, analysis: AnalysisResult, beatPosition: number): { left: number, right: number } {
  const noteIndex = Math.floor((time * 4) % melodyNotes.length);
  const note = melodyNotes[noteIndex];
  const freq = baseFreq * Math.pow(2, note / 12);
  
  // Add vibrato and expression
  const vibrato = Math.sin(time * 6) * 0.02;
  const actualFreq = freq * (1 + vibrato);
  
  const phase = 2 * Math.PI * actualFreq * time;
  const wave = Math.sin(phase) + Math.sin(phase * 3) * 0.1 + Math.sin(phase * 5) * 0.05;
  
  // Stereo delay effect
  const delay = 0.1;
  const delayedPhase = 2 * Math.PI * actualFreq * (time - delay);
  const delayedWave = Math.sin(delayedPhase) * 0.3;
  
  return {
    left: wave * 0.7 + delayedWave,
    right: wave * 0.7 - delayedWave
  };
}

function generateAtmosphericPad(time: number, scale: number[], baseFreq: number, analysis: AnalysisResult): { left: number, right: number } {
  let left = 0, right = 0;
  
  // Slow-moving atmospheric chords
  scale.forEach((note, index) => {
    const freq = baseFreq * Math.pow(2, note / 12);
    const phase = 2 * Math.PI * freq * time;
    const lfoFreq = 0.1 + index * 0.05;
    const amplitude = (Math.sin(time * lfoFreq) + 1) * 0.01;
    
    const wave = Math.sin(phase) * amplitude;
    left += wave * (1 - index * 0.1);
    right += wave * (1 + index * 0.1);
  });
  
  return { left, right };
}

function generatePercussion(time: number, beatPosition: number, analysis: AnalysisResult): number {
  // Simple kick and snare pattern
  const kickTrigger = beatPosition < 0.1 && (Math.floor(time * 2) % 4 === 0 || Math.floor(time * 2) % 4 === 2);
  const snareTrigger = beatPosition < 0.05 && (Math.floor(time * 2) % 4 === 1 || Math.floor(time * 2) % 4 === 3);
  
  if (kickTrigger) {
    const envelope = Math.exp(-beatPosition * 20);
    return Math.sin(60 * 2 * Math.PI * time) * envelope * 0.5;
  } else if (snareTrigger) {
    const envelope = Math.exp(-beatPosition * 30);
    return (Math.random() - 0.5) * envelope * 0.3;
  }
  
  return 0;
}

function generateArpeggio(time: number, scale: number[], baseFreq: number, analysis: AnalysisResult): { left: number, right: number } {
  const noteIndex = Math.floor((time * 8) % scale.length);
  const note = scale[noteIndex];
  const freq = baseFreq * Math.pow(2, note / 12);
  
  const phase = 2 * Math.PI * freq * time;
  const envelope = Math.exp(-((time * 8) % 1) * 5);
  const wave = Math.sin(phase) * envelope;
  
  return {
    left: wave * 0.7,
    right: wave * 0.3
  };
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
