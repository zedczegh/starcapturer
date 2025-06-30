
interface AnalysisResult {
  stars: number;
  nebulae: number;
  galaxies: number;
  brightness: number;
  colorProfile: {
    red: number;
    green: number;
    blue: number;
  };
  dominantFrequencies: number[];
}

export async function analyzeAstronomyImage(file: File): Promise<AnalysisResult> {
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
        resolve(getDefaultAnalysis());
        return;
      }

      const analysis = processImageData(imageData);
      resolve(analysis);
    };

    img.onerror = () => {
      resolve(getDefaultAnalysis());
    };

    img.src = URL.createObjectURL(file);
  });
}

function processImageData(imageData: ImageData): AnalysisResult {
  const { data, width, height } = imageData;
  const pixels = data.length / 4;
  
  let totalRed = 0, totalGreen = 0, totalBlue = 0;
  let brightness = 0;
  let brightPixels = 0;
  let darkRegions = 0;
  let colorfulRegions = 0;

  // Analyze pixels
  for (let i = 0; i < pixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    
    totalRed += r;
    totalGreen += g;
    totalBlue += b;
    
    const pixelBrightness = (r + g + b) / 3;
    brightness += pixelBrightness;
    
    if (pixelBrightness > 200) brightPixels++;
    if (pixelBrightness < 50) darkRegions++;
    if (Math.abs(r - g) > 30 || Math.abs(g - b) > 30 || Math.abs(r - b) > 30) {
      colorfulRegions++;
    }
  }

  // Calculate averages
  const avgRed = totalRed / pixels / 255;
  const avgGreen = totalGreen / pixels / 255;
  const avgBlue = totalBlue / pixels / 255;
  const avgBrightness = brightness / pixels / 255;

  // Estimate celestial objects based on image characteristics
  const stars = Math.min(Math.floor(brightPixels / 100), 999);
  const nebulae = Math.min(Math.floor(colorfulRegions / 1000), 50);
  const galaxies = Math.min(Math.floor(darkRegions / 5000), 20);

  // Generate dominant frequencies based on analysis
  const baseFreq = 220; // A3 note
  const frequencies = [
    baseFreq * (1 + avgRed), // Red channel affects bass
    baseFreq * 2 * (1 + avgGreen), // Green affects mid
    baseFreq * 3 * (1 + avgBlue), // Blue affects treble
    baseFreq * 1.5 * (1 + avgBrightness), // Brightness affects harmony
  ];

  // Add frequencies based on object counts
  if (stars > 10) frequencies.push(baseFreq * 4);
  if (nebulae > 5) frequencies.push(baseFreq * 0.5);
  if (galaxies > 2) frequencies.push(baseFreq * 6);

  return {
    stars,
    nebulae,
    galaxies,
    brightness: avgBrightness,
    colorProfile: {
      red: avgRed,
      green: avgGreen,
      blue: avgBlue
    },
    dominantFrequencies: frequencies.slice(0, 8) // Limit to 8 frequencies
  };
}

function getDefaultAnalysis(): AnalysisResult {
  return {
    stars: Math.floor(Math.random() * 100) + 50,
    nebulae: Math.floor(Math.random() * 10) + 5,
    galaxies: Math.floor(Math.random() * 5) + 2,
    brightness: 0.3 + Math.random() * 0.4,
    colorProfile: {
      red: 0.4 + Math.random() * 0.3,
      green: 0.3 + Math.random() * 0.3,
      blue: 0.5 + Math.random() * 0.3
    },
    dominantFrequencies: [220, 440, 660, 880, 330, 550, 770, 1100]
  };
}

export async function generateAudioFromAnalysis(analysis: AnalysisResult): Promise<AudioBuffer> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = audioContext.sampleRate;
  const duration = 30; // 30 seconds
  const length = sampleRate * duration;
  
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Generate harmonic content based on analysis
  for (let i = 0; i < length; i++) {
    const time = i / sampleRate;
    let sample = 0;

    // Add frequencies with different amplitudes and phases
    analysis.dominantFrequencies.forEach((freq, index) => {
      const amplitude = 0.1 / analysis.dominantFrequencies.length;
      const phase = (index * Math.PI) / 4;
      
      // Add some variation based on celestial objects
      const modulation = 1 + 0.1 * Math.sin(time * 0.5 + index);
      
      // Different wave shapes for different object types
      let wave = 0;
      if (index < 2) {
        // Stars - sine waves
        wave = Math.sin(2 * Math.PI * freq * time + phase) * modulation;
      } else if (index < 4) {
        // Nebulae - softer waves with harmonics
        wave = (Math.sin(2 * Math.PI * freq * time + phase) + 
                0.3 * Math.sin(2 * Math.PI * freq * 2 * time + phase)) * modulation;
      } else {
        // Galaxies - complex harmonics
        wave = (Math.sin(2 * Math.PI * freq * time + phase) + 
                0.2 * Math.sin(2 * Math.PI * freq * 3 * time + phase) +
                0.1 * Math.sin(2 * Math.PI * freq * 5 * time + phase)) * modulation;
      }
      
      sample += wave * amplitude;
    });

    // Apply brightness-based envelope
    const envelope = Math.sin(Math.PI * time / duration) * analysis.brightness;
    channelData[i] = sample * envelope * 0.3; // Keep volume reasonable
  }

  return buffer;
}
