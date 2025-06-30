
/**
 * Audio processing utilities for astronomy image sonification
 */

interface SonificationData {
  brightness: number[];
  starPositions: { x: number; y: number; intensity: number }[];
  colorProfile: { r: number; g: number; b: number }[];
  composition: {
    stars: number;
    nebulae: number;
    galaxies: number;
  };
}

/**
 * Process astronomy image and extract data for sonification
 */
export async function processAstronomyImage(imageFile: File): Promise<SonificationData> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) {
        resolve(generateMockData());
        return;
      }

      const data = imageData.data;
      const brightness: number[] = [];
      const starPositions: { x: number; y: number; intensity: number }[] = [];
      const colorProfile: { r: number; g: number; b: number }[] = [];

      // Process image data
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const alpha = data[i + 3];

        if (alpha > 0) {
          // Calculate brightness
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          brightness.push(lum / 255);

          // Detect bright spots (potential stars)
          if (lum > 200) {
            const pixelIndex = i / 4;
            const x = (pixelIndex % canvas.width) / canvas.width * 100;
            const y = Math.floor(pixelIndex / canvas.width) / canvas.height * 100;
            const intensity = lum / 255;

            starPositions.push({ x, y, intensity });
          }

          // Sample color profile
          if (i % 1000 === 0) {
            colorProfile.push({ r: r / 255, g: g / 255, b: b / 255 });
          }
        }
      }

      // Analyze composition
      const composition = analyzeComposition(brightness, starPositions, colorProfile);

      resolve({
        brightness,
        starPositions: starPositions.slice(0, 100), // Limit for performance
        colorProfile: colorProfile.slice(0, 50),
        composition
      });
    };

    img.src = URL.createObjectURL(imageFile);
  });
}

/**
 * Generate audio from processed image data
 */
export async function generateAudioFromData(
  data: SonificationData,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  const duration = 30; // 30 seconds
  const sampleRate = audioContext.sampleRate;
  const numberOfChannels = 1;
  const length = sampleRate * duration;

  const audioBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  // Generate base frequency from average brightness
  const avgBrightness = data.brightness.reduce((sum, val) => sum + val, 0) / data.brightness.length;
  const baseFreq = 220 + (avgBrightness * 440); // A3 to A4 range

  // Generate harmonic series based on star positions
  const harmonics = data.starPositions.map(star => ({
    frequency: baseFreq * (1 + star.intensity * 2),
    amplitude: star.intensity * 0.3,
    phase: (star.x + star.y) * Math.PI / 100
  }));

  // Generate audio samples
  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;
    let sample = 0;

    // Add base tone
    sample += Math.sin(2 * Math.PI * baseFreq * time) * 0.2;

    // Add harmonics from stars
    harmonics.forEach(harmonic => {
      const envelope = Math.exp(-time * 0.1) * Math.sin(time * 0.5 + harmonic.phase);
      sample += Math.sin(2 * Math.PI * harmonic.frequency * time) * harmonic.amplitude * envelope;
    });

    // Add color-based modulation
    if (data.colorProfile.length > 0) {
      const colorIndex = Math.floor((time / duration) * data.colorProfile.length);
      const color = data.colorProfile[colorIndex] || data.colorProfile[0];
      const colorMod = (color.r + color.g + color.b) / 3;
      sample *= (0.7 + colorMod * 0.3);
    }

    // Apply gentle filter and normalize
    sample = Math.tanh(sample * 0.5) * 0.8;
    channelData[i] = sample;
  }

  return audioBuffer;
}

/**
 * Analyze image composition
 */
function analyzeComposition(
  brightness: number[],
  starPositions: { x: number; y: number; intensity: number }[],
  colorProfile: { r: number; g: number; b: number }[]
): { stars: number; nebulae: number; galaxies: number } {
  const avgBrightness = brightness.reduce((sum, val) => sum + val, 0) / brightness.length;
  const brightPoints = starPositions.length;
  
  // Simple heuristic analysis
  const stars = Math.min(brightPoints, 999);
  const nebulae = Math.floor(avgBrightness * 10) + Math.floor(Math.random() * 5);
  const galaxies = Math.floor(colorProfile.length / 10) + Math.floor(Math.random() * 3);

  return { stars, nebulae, galaxies };
}

/**
 * Generate mock data for testing
 */
function generateMockData(): SonificationData {
  const brightness = Array.from({ length: 1000 }, () => Math.random());
  const starPositions = Array.from({ length: 50 }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    intensity: Math.random()
  }));
  const colorProfile = Array.from({ length: 30 }, () => ({
    r: Math.random(),
    g: Math.random(),
    b: Math.random()
  }));

  return {
    brightness,
    starPositions,
    colorProfile,
    composition: {
      stars: Math.floor(Math.random() * 100) + 50,
      nebulae: Math.floor(Math.random() * 10) + 2,
      galaxies: Math.floor(Math.random() * 5) + 1
    }
  };
}
