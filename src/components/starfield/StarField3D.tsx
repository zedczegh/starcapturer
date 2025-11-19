import React, { useRef, useEffect, useState, useCallback } from 'react';
import { refineStarEdges } from '@/utils/starEdgeRefinement';

interface StarData {
  x: number;
  y: number;
  z: number;
  brightness: number;
  size: number;
  color3d: string;
}

interface StarField3DProps {
  stars: StarData[];
  settings: {
    motionType?: string;
    speed?: number;
    duration?: number;
    fieldOfView?: number;
    amplification?: number;
    spin?: number;
    spinDirection?: string;
    fadeOut?: boolean;
    hyperspeed?: boolean;
  };
  isAnimating: boolean;
  isRecording: boolean;
  backgroundImage?: string | null;
  starsOnlyImage?: string | null;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  onProgressUpdate?: (progress: number) => void;
  onAnimationComplete?: () => void;
  controlledProgress?: number; // For precise external control during video recording
  videoProgressRef?: React.MutableRefObject<number>; // Direct ref for video rendering
  frameRenderTrigger?: number; // Trigger value that changes to force frame render
  externalProgress?: number; // External progress value to detect replay
  depthIntensity?: number; // 0-200 scale for parallax intensity
  // Stereoscopic displacement parameters to respect depth from Traditional Morph
  horizontalDisplace?: number; // Displacement amount from stereoscope processor (typically 25)
  starShiftAmount?: number; // Star shift amount from stereoscope processor (typically 6)
  // Override canvas dimensions (if not provided, uses image dimensions)
  canvasWidth?: number;
  canvasHeight?: number;
  // Star preservation intensity: 0 = no preservation (normal cleaning), 100 = maximum preservation
  preserveStarsIntensity?: number;
}

const StarField3D: React.FC<StarField3DProps> = ({ 
  stars, 
  settings, 
  isAnimating,
  isRecording,
  backgroundImage,
  starsOnlyImage,
  onCanvasReady,
  onProgressUpdate,
  onAnimationComplete,
  controlledProgress,
  videoProgressRef,
  frameRenderTrigger,
  externalProgress,
  depthIntensity = 100,
  horizontalDisplace = 25,
  starShiftAmount = 6,
  canvasWidth,
  canvasHeight,
  preserveStarsIntensity = 0
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number>();
  const animationStartTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const lastProgressUpdateRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0); // Track current progress for resume
  const hasRenderedInitialFrame = useRef<boolean>(false); // Track if initial frame was rendered
  const [blurAmount, setBlurAmount] = useState(0); // Motion blur for hyperspeed effect
  const offsetsRef = useRef({
    layer1: { x: 0, y: 0, scale: 1 },   // Largest/brightest stars (closest)
    layer2: { x: 0, y: 0, scale: 1 },
    layer3: { x: 0, y: 0, scale: 1 },
    layer4: { x: 0, y: 0, scale: 1 },
    layer5: { x: 0, y: 0, scale: 1 },
    layer6: { x: 0, y: 0, scale: 1 },
    layer7: { x: 0, y: 0, scale: 1 },
    layer8: { x: 0, y: 0, scale: 1 },
    layer9: { x: 0, y: 0, scale: 1 },
    layer10: { x: 0, y: 0, scale: 1 },
    layer11: { x: 0, y: 0, scale: 1 },
    layer12: { x: 0, y: 0, scale: 1 },  // Smallest stars (farthest)
    background: { x: 0, y: 0, scale: 1 } // Nebula background
  });
  
  const [starLayers, setStarLayers] = useState<{
    layer1: ImageBitmap | null;
    layer2: ImageBitmap | null;
    layer3: ImageBitmap | null;
    layer4: ImageBitmap | null;
    layer5: ImageBitmap | null;
    layer6: ImageBitmap | null;
    layer7: ImageBitmap | null;
    layer8: ImageBitmap | null;
    layer9: ImageBitmap | null;
    layer10: ImageBitmap | null;
    layer11: ImageBitmap | null;
    layer12: ImageBitmap | null;
  }>({ 
    layer1: null, layer2: null, layer3: null, layer4: null, layer5: null, layer6: null,
    layer7: null, layer8: null, layer9: null, layer10: null, layer11: null, layer12: null
  });
  
  const [backgroundImg, setBackgroundImg] = useState<ImageBitmap | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 1920, height: 1080 });
  
  // Cache for rendered frames to avoid redundant calculations
  const lastRenderState = useRef<{
    progress: number;
    motionType: string;
    scale1: number;
    scale2: number;
    scale3: number;
    scaleBg: number;
  } | null>(null);
  
  // Cache calculated dimensions to avoid recalculation every frame
  const cachedDimensions = useRef<{
    canvasCenterX: number;
    canvasCenterY: number;
    bgScaledWidth: number;
    bgScaledHeight: number;
    layer12ScaledWidth: number;
    layer12ScaledHeight: number;
    layer11ScaledWidth: number;
    layer11ScaledHeight: number;
    layer10ScaledWidth: number;
    layer10ScaledHeight: number;
    layer9ScaledWidth: number;
    layer9ScaledHeight: number;
    layer8ScaledWidth: number;
    layer8ScaledHeight: number;
    layer7ScaledWidth: number;
    layer7ScaledHeight: number;
    layer6ScaledWidth: number;
    layer6ScaledHeight: number;
    layer5ScaledWidth: number;
    layer5ScaledHeight: number;
    layer4ScaledWidth: number;
    layer4ScaledHeight: number;
    layer3ScaledWidth: number;
    layer3ScaledHeight: number;
    layer2ScaledWidth: number;
    layer2ScaledHeight: number;
    layer1ScaledWidth: number;
    layer1ScaledHeight: number;
  } | null>(null);

  // Create star layers by detecting complete stars first, then assigning whole stars to layers
  useEffect(() => {
    if (!starsOnlyImage) return;

    const img = new Image();
    img.onload = () => {
      // Use provided dimensions or fall back to image dimensions
      const targetWidth = canvasWidth || img.width;
      const targetHeight = canvasHeight || img.height;
      setImageDimensions({ width: targetWidth, height: targetHeight });
      
      console.log('Detecting complete stars with cores and spikes...');
      const startTime = performance.now();
      
      // Draw image at target canvas dimensions
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetWidth;
      tempCanvas.height = targetHeight;
      const tempCtx = tempCanvas.getContext('2d', { 
        willReadFrequently: true,
        alpha: false 
      })!;
      // Scale image to target dimensions with high quality
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';
      tempCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      const sourceData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
      const data = sourceData.data;
      
      const width = targetWidth;
      const height = targetHeight;
      
      // === CONDITIONAL STAR CLEANING ===
      // Use LINEAR intensity for predictable slider behavior
      // 0-50: Gradually increase cleaned star brightness
      // 50-100: Keep cleaned stars, gradually blend in original image
      
      const intensityPercent = preserveStarsIntensity;
      const shouldClean = intensityPercent <= 50;
      
      if (shouldClean) {
        // 0-50%: Clean stars and gradually increase their brightness
        const cleanedStarBrightness = intensityPercent / 50; // 0% = 0.0, 50% = 1.0
        console.log(`Extracting clean star cores (brightness: ${(cleanedStarBrightness * 100).toFixed(1)}%)...`);
        
        // Find all bright star centers
        interface StarCore {
          x: number;
          y: number;
          maxBrightness: number;
          radius: number;
          color: { r: number; g: number; b: number };
        }
        
        const starCores: StarCore[] = [];
        const visitedCores = new Uint8Array(width * height);
        
        // First pass: Find bright star centers
        for (let y = 5; y < height - 5; y++) {
          for (let x = 5; x < width - 5; x++) {
            const idx = (y * width + x) * 4;
            if (visitedCores[y * width + x]) continue;
            
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // Detect bright pixels as star cores
            const brightnessThreshold = 120;
            if (lum > brightnessThreshold) {
              // Find local maximum (brightest point in neighborhood)
              let maxLum = lum;
              let maxX = x;
              let maxY = y;
              
              for (let dy = -3; dy <= 3; dy++) {
                for (let dx = -3; dx <= 3; dx++) {
                  const nIdx = ((y + dy) * width + (x + dx)) * 4;
                  const nLum = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2];
                  if (nLum > maxLum) {
                    maxLum = nLum;
                    maxX = x + dx;
                    maxY = y + dy;
                  }
                }
              }
              
              // If this is the local maximum, it's a star center
              if (maxX === x && maxY === y) {
                // Measure star radius by checking brightness falloff
                let radius = 1;
                for (let r = 1; r < 20; r++) {
                  const testIdx = (y * width + (x + r)) * 4;
                  const testLum = 0.299 * data[testIdx] + 0.587 * data[testIdx + 1] + 0.114 * data[testIdx + 2];
                  if (testLum < maxLum * 0.3) break; // Found edge where brightness drops
                  radius = r;
                }
                
                starCores.push({
                  x,
                  y,
                  maxBrightness: maxLum,
                  radius: radius * 1.5,
                  color: { r, g, b }
                });
                
                // Mark area as visited
                for (let dy = -radius; dy <= radius; dy++) {
                  for (let dx = -radius; dx <= radius; dx++) {
                    const vx = x + dx;
                    const vy = y + dy;
                    if (vx >= 0 && vx < width && vy >= 0 && vy < height) {
                      visitedCores[vy * width + vx] = 1;
                    }
                  }
                }
              }
            }
          }
        }
        
        console.log(`Found ${starCores.length} clean star cores`);
        
        // Second pass: Clear image and redraw only clean cores with smooth gradients
        for (let i = 0; i < data.length; i++) {
          data[i] = 0; // Clear everything
        }
        
        // Redraw each star with perfect smooth circular gradient
        for (const star of starCores) {
          const startX = Math.max(0, Math.floor(star.x - star.radius * 2));
          const endX = Math.min(width - 1, Math.ceil(star.x + star.radius * 2));
          const startY = Math.max(0, Math.floor(star.y - star.radius * 2));
          const endY = Math.min(height - 1, Math.ceil(star.y + star.radius * 2));
          
          for (let y = startY; y <= endY; y++) {
            for (let x = startX; x <= endX; x++) {
              const dx = x - star.x;
              const dy = y - star.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              
              // Smooth Gaussian falloff from center
              const normalizedDist = dist / star.radius;
              if (normalizedDist > 1.5) continue; // Don't draw beyond falloff
              
              // Gaussian intensity falloff
              const falloffRate = 2.5;
              const baseIntensity = Math.exp(-normalizedDist * normalizedDist * falloffRate);
              
              // Scale intensity by cleaned star brightness (0-50% range)
              const intensity = baseIntensity * cleanedStarBrightness;
              
              const idx = (y * width + x) * 4;
              
              // Blend with existing pixel (in case stars overlap)
              const newR = star.color.r * intensity;
              const newG = star.color.g * intensity;
              const newB = star.color.b * intensity;
              
              data[idx] = Math.max(data[idx], newR);
              data[idx + 1] = Math.max(data[idx + 1], newG);
              data[idx + 2] = Math.max(data[idx + 2], newB);
              data[idx + 3] = 255;
            }
          }
        }
        
        tempCtx.putImageData(sourceData, 0, 0);
        console.log(`Clean star cores extracted (found ${starCores.length} cores, brightness: ${(cleanedStarBrightness * 100).toFixed(0)}%)`);
      } else {
        // 50-100%: Blend cleaned stars with original image
        // First draw cleaned stars at full brightness, then blend original
        const originalBlendFactor = (intensityPercent - 50) / 50; // 50% = 0.0, 100% = 1.0
        console.log(`🌟 Blending cleaned stars with original (original blend: ${(originalBlendFactor * 100).toFixed(0)}%)`);
        
        // Create a copy to blend
        const originalData = tempCtx.getImageData(0, 0, width, height);
        const originalPixels = originalData.data;
        
        // Blend: (1 - factor) * cleaned + factor * original
        for (let i = 0; i < data.length; i += 4) {
          data[i] = data[i] * (1 - originalBlendFactor) + originalPixels[i] * originalBlendFactor;
          data[i + 1] = data[i + 1] * (1 - originalBlendFactor) + originalPixels[i + 1] * originalBlendFactor;
          data[i + 2] = data[i + 2] * (1 - originalBlendFactor) + originalPixels[i + 2] * originalBlendFactor;
        }
        
        tempCtx.putImageData(sourceData, 0, 0);
      }
      // === END CONDITIONAL STAR CLEANING ===
      
      // === STAR DETECTION AND LAYER ASSIGNMENT (ALWAYS RUNS) ===
      console.log('🔍 Detecting stars with halos and spikes for layer assignment...');
      
      // Pre-calculate luminance for all pixels using Uint8Array for faster access
      const pixelCount = width * height;
      const luminanceCache = new Float32Array(pixelCount);
      
      // Use Uint32Array view for faster pixel processing (RGBA as single 32-bit value)
      const data32 = new Uint32Array(data.buffer);
      
      for (let i = 0; i < pixelCount; i++) {
        const pixel = data32[i];
        const r = pixel & 0xFF;
        const g = (pixel >> 8) & 0xFF;
        const b = (pixel >> 16) & 0xFF;
        luminanceCache[i] = 0.299 * r + 0.587 * g + 0.114 * b;
      }
      
      // Detect star cores first, then extract with proper gradient preservation
      const visited = new Uint8Array(pixelCount);
      const starRegions: {
        pixels: Uint32Array;
        pixelCount: number;
        maxLuminance: number;
        centerX: number;
        centerY: number;
        size: number;
      }[] = [];
      
      // Apply linear thresholds based on preservation intensity
      const preservationFactor = intensityPercent / 100; // 0 to 1
      const coreThreshold = 100 - (92 * preservationFactor); // 100 -> 8
      const expansionThreshold = 30 - (28 * preservationFactor); // 30 -> 2
      
      // Reusable queue with pre-allocated capacity - larger when preserving stars
      const maxQueueSize = 8000 + Math.floor(42000 * preservationFactor); // 8000 -> 50000
      const queueX = new Uint16Array(maxQueueSize);
      const queueY = new Uint16Array(maxQueueSize);
      const pixelBuffer = new Uint32Array(maxQueueSize);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (visited[idx]) continue;
          
          const luminance = luminanceCache[idx];
          
          if (luminance > coreThreshold) {
            // Found a bright star core - expand to capture full gradient halo
            let queueStart = 0;
            let queueEnd = 0;
            let pixelCount = 0;
            
            queueX[queueEnd] = x;
            queueY[queueEnd] = y;
            queueEnd++;
            visited[idx] = 1;
            
            let maxLum = luminance;
            let totalX = 0, totalY = 0, totalWeight = 0;
            let minX = x, maxX = x, minY = y, maxY = y;
            
            while (queueStart < queueEnd && pixelCount < maxQueueSize) {
              const currX = queueX[queueStart];
              const currY = queueY[queueStart];
              queueStart++;
              
              const currIdx = currY * width + currX;
              pixelBuffer[pixelCount++] = currIdx;
              
              const currLum = luminanceCache[currIdx];
              
              if (currLum > maxLum) maxLum = currLum;
              
              // Weighted centroid
              const weight = currLum * currLum;
              totalX += currX * weight;
              totalY += currY * weight;
              totalWeight += weight;
              
              if (currX < minX) minX = currX;
              if (currX > maxX) maxX = currX;
              if (currY < minY) minY = currY;
              if (currY > maxY) maxY = currY;
              
              // Check 8-connected neighbors (unrolled for performance)
              const nx1 = currX - 1, nx2 = currX, nx3 = currX + 1;
              const ny1 = currY - 1, ny2 = currY, ny3 = currY + 1;
              
              // Top-left
              if (nx1 >= 0 && ny1 >= 0) {
                const nIdx = ny1 * width + nx1;
                if (!visited[nIdx] && luminanceCache[nIdx] > expansionThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx1;
                  queueY[queueEnd] = ny1;
                  queueEnd++;
                }
              }
              // Top
              if (ny1 >= 0) {
                const nIdx = ny1 * width + nx2;
                if (!visited[nIdx] && luminanceCache[nIdx] > expansionThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx2;
                  queueY[queueEnd] = ny1;
                  queueEnd++;
                }
              }
              // Top-right
              if (nx3 < width && ny1 >= 0) {
                const nIdx = ny1 * width + nx3;
                if (!visited[nIdx] && luminanceCache[nIdx] > expansionThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx3;
                  queueY[queueEnd] = ny1;
                  queueEnd++;
                }
              }
              // Left
              if (nx1 >= 0) {
                const nIdx = ny2 * width + nx1;
                if (!visited[nIdx] && luminanceCache[nIdx] > expansionThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx1;
                  queueY[queueEnd] = ny2;
                  queueEnd++;
                }
              }
              // Right
              if (nx3 < width) {
                const nIdx = ny2 * width + nx3;
                if (!visited[nIdx] && luminanceCache[nIdx] > expansionThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx3;
                  queueY[queueEnd] = ny2;
                  queueEnd++;
                }
              }
              // Bottom-left
              if (nx1 >= 0 && ny3 < height) {
                const nIdx = ny3 * width + nx1;
                if (!visited[nIdx] && luminanceCache[nIdx] > expansionThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx1;
                  queueY[queueEnd] = ny3;
                  queueEnd++;
                }
              }
              // Bottom
              if (ny3 < height) {
                const nIdx = ny3 * width + nx2;
                if (!visited[nIdx] && luminanceCache[nIdx] > expansionThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx2;
                  queueY[queueEnd] = ny3;
                  queueEnd++;
                }
              }
              // Bottom-right
              if (nx3 < width && ny3 < height) {
                const nIdx = ny3 * width + nx3;
                if (!visited[nIdx] && luminanceCache[nIdx] > expansionThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx3;
                  queueY[queueEnd] = ny3;
                  queueEnd++;
                }
              }
            }
            
            // Only keep significant star regions
            if (pixelCount >= 3 && pixelCount <= maxQueueSize) {
              const centerX = totalX / totalWeight;
              const centerY = totalY / totalWeight;
              const size = Math.max(maxX - minX, maxY - minY);
              
              // Copy pixels to permanent storage
              const pixels = new Uint32Array(pixelCount);
              pixels.set(pixelBuffer.subarray(0, pixelCount));
              
              starRegions.push({
                pixels,
                pixelCount,
                maxLuminance: maxLum,
                centerX,
                centerY,
                size
              });
            }
          }
        }
      }
      
      console.log(`Detected ${starRegions.length} complete stars in ${(performance.now() - startTime).toFixed(0)}ms`);
      
      // === AUTO-SHRINK ALGORITHM: Reduce oversized stars to prevent artifacts ===
      // Scale max size and shrink ratio based on preservation intensity (linear)
      const MAX_STAR_SIZE = 40 + Math.floor(160 * preservationFactor); // 40 -> 200
      const TARGET_SIZE_RATIO = 0.6 + (0.35 * preservationFactor); // 0.6 -> 0.95
      let shrunkCount = 0;
      
      for (let i = 0; i < starRegions.length; i++) {
        const star = starRegions[i];
        
        if (star.size > MAX_STAR_SIZE) {
          shrunkCount++;
          
          // Calculate shrink factor
          const shrinkFactor = (MAX_STAR_SIZE * TARGET_SIZE_RATIO) / star.size;
          
          // Create a new shrunk star by resampling pixels
          const newPixels: number[] = [];
          const pixelSet = new Set<number>();
          
          for (let j = 0; j < star.pixelCount; j++) {
            const pixelIdx = star.pixels[j];
            const px = pixelIdx % width;
            const py = Math.floor(pixelIdx / width);
            
            // Calculate position relative to star center
            const dx = px - star.centerX;
            const dy = py - star.centerY;
            
            // Scale the position
            const newDx = dx * shrinkFactor;
            const newDy = dy * shrinkFactor;
            
            // Calculate new pixel position
            const newPx = Math.round(star.centerX + newDx);
            const newPy = Math.round(star.centerY + newDy);
            
            // Check bounds
            if (newPx >= 0 && newPx < width && newPy >= 0 && newPy < height) {
              const newIdx = newPy * width + newPx;
              if (!pixelSet.has(newIdx)) {
                pixelSet.add(newIdx);
                newPixels.push(newIdx);
              }
            }
          }
          
          // Update star with shrunk data
          star.pixels = new Uint32Array(newPixels);
          star.pixelCount = newPixels.length;
          star.size = star.size * shrinkFactor;
        }
      }
      
      if (shrunkCount > 0) {
        console.log(`🔹 Auto-shrunk ${shrunkCount} oversized stars to prevent artifacts`);
      }
      // === END AUTO-SHRINK ===
      
      // Sort stars by size to determine layer distribution across 12 layers
      starRegions.sort((a, b) => b.size - a.size);
      
      // Distribute stars into 12 layers for enhanced parallax depth
      const layer1Threshold = starRegions[Math.floor(starRegions.length * 0.083)]?.size || 30;  // Top 8.3%
      const layer2Threshold = starRegions[Math.floor(starRegions.length * 0.167)]?.size || 25;
      const layer3Threshold = starRegions[Math.floor(starRegions.length * 0.250)]?.size || 20;
      const layer4Threshold = starRegions[Math.floor(starRegions.length * 0.333)]?.size || 16;
      const layer5Threshold = starRegions[Math.floor(starRegions.length * 0.417)]?.size || 13;
      const layer6Threshold = starRegions[Math.floor(starRegions.length * 0.500)]?.size || 11;
      const layer7Threshold = starRegions[Math.floor(starRegions.length * 0.583)]?.size || 9;
      const layer8Threshold = starRegions[Math.floor(starRegions.length * 0.667)]?.size || 7;
      const layer9Threshold = starRegions[Math.floor(starRegions.length * 0.750)]?.size || 6;
      const layer10Threshold = starRegions[Math.floor(starRegions.length * 0.833)]?.size || 5;
      const layer11Threshold = starRegions[Math.floor(starRegions.length * 0.917)]?.size || 4;
      // layer12 = remaining smallest stars
      
      console.log(`12-layer size thresholds: L1=${layer1Threshold}, L2=${layer2Threshold}, L3=${layer3Threshold}, L4=${layer4Threshold}, L5=${layer5Threshold}, L6=${layer6Threshold}, L7=${layer7Threshold}, L8=${layer8Threshold}, L9=${layer9Threshold}, L10=${layer10Threshold}, L11=${layer11Threshold}`);
      
      // Create twelve separate canvases for depth layers
      const canvases = Array(12).fill(null).map(() => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        return canvas;
      });
      
      const contexts = canvases.map(canvas => 
        canvas.getContext('2d', { alpha: false, willReadFrequently: false })!
      );
      
      // Create image data for each layer
      const imageDatas = contexts.map(ctx => ctx.createImageData(width, height));
      
      // Use Uint32Array views for faster pixel copying
      const data32Views = imageDatas.map(imgData => new Uint32Array(imgData.data.buffer));
      const layerCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      
      // Batch size for processing - process stars in batches to reduce overhead
      const BATCH_SIZE = 1024;
      let starsProcessed = 0;
      
      // Assign each complete star to one layer based on its size with batched processing
      for (let batchStart = 0; batchStart < starRegions.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, starRegions.length);
        
        for (let starIdx = batchStart; starIdx < batchEnd; starIdx++) {
          const star = starRegions[starIdx];
          let layerIndex: number;
          
          // Distribute stars into 12 layers based on size
          if (star.size >= layer1Threshold) {
            layerIndex = 0;
          } else if (star.size >= layer2Threshold) {
            layerIndex = 1;
          } else if (star.size >= layer3Threshold) {
            layerIndex = 2;
          } else if (star.size >= layer4Threshold) {
            layerIndex = 3;
          } else if (star.size >= layer5Threshold) {
            layerIndex = 4;
          } else if (star.size >= layer6Threshold) {
            layerIndex = 5;
          } else if (star.size >= layer7Threshold) {
            layerIndex = 6;
          } else if (star.size >= layer8Threshold) {
            layerIndex = 7;
          } else if (star.size >= layer9Threshold) {
            layerIndex = 8;
          } else if (star.size >= layer10Threshold) {
            layerIndex = 9;
          } else if (star.size >= layer11Threshold) {
            layerIndex = 10;
          } else {
            layerIndex = 11; // Layer 12 - smallest/dimmest
          }
          
          const targetData32 = data32Views[layerIndex];
          layerCounts[layerIndex]++;
          
          // Copy all pixels of this complete star to the target layer (32-bit at a time)
          for (let i = 0; i < star.pixelCount; i++) {
            const pixelIdx = star.pixels[i];
            targetData32[pixelIdx] = data32[pixelIdx];
          }
        }
        
        starsProcessed += (batchEnd - batchStart);
        
        // Progress update for large images
        if (starRegions.length > 5000 && starsProcessed % 2048 === 0) {
          console.log(`Processing stars: ${starsProcessed}/${starRegions.length} (${((starsProcessed / starRegions.length) * 100).toFixed(0)}%)`);
        }
      }
      
      // Put the separated data onto the canvases
      contexts.forEach((ctx, i) => ctx.putImageData(imageDatas[i], 0, 0));
      
      console.log('Star layers separated - preprocessing already smoothed edges');
      
      // Skip edge refinement - preprocessing already handled smoothing
      // Convert canvases directly to ImageBitmaps for faster GPU-accelerated rendering
      const bitmapOptions: ImageBitmapOptions = {
        premultiplyAlpha: 'premultiply',
        colorSpaceConversion: 'none',
        resizeQuality: 'high'
      };
      
      // Process bitmaps with better memory management
      const createBitmapsSequentially = async () => {
        const bitmaps: ImageBitmap[] = [];
        for (let i = 0; i < canvases.length; i++) {
          try {
            const bitmap = await createImageBitmap(canvases[i], bitmapOptions);
            bitmaps.push(bitmap);
            // Clear canvas reference after bitmap creation to free memory
            canvases[i].width = 1;
            canvases[i].height = 1;
          } catch (error) {
            console.error(`Failed to create bitmap for layer ${i + 1}:`, error);
            throw error;
          }
        }
        return bitmaps;
      };
      
      createBitmapsSequentially().then((bitmaps) => {
        console.log('🌟 [StarField3D] Setting star layers state with bitmaps');
        setStarLayers({
          layer1: bitmaps[0],
          layer2: bitmaps[1],
          layer3: bitmaps[2],
          layer4: bitmaps[3],
          layer5: bitmaps[4],
          layer6: bitmaps[5],
          layer7: bitmaps[6],
          layer8: bitmaps[7],
          layer9: bitmaps[8],
          layer10: bitmaps[9],
          layer11: bitmaps[10],
          layer12: bitmaps[11]
        });
        
        const totalTime = (performance.now() - startTime).toFixed(0);
        console.log(`✅ [StarField3D] 12 star layers ready with refined edges: ${layerCounts.map((c, i) => `L${i+1}:${c}`).join(', ')} (${totalTime}ms total)`);
      }).catch(error => {
        console.error('❌ [StarField3D] Failed to create star layer bitmaps:', error);
      });
    };
    
    img.src = starsOnlyImage;
  }, [starsOnlyImage, preserveStarsIntensity, canvasWidth, canvasHeight]);

  // Load background image as ImageBitmap for faster rendering
  useEffect(() => {
    if (!backgroundImage) return;
    
    const img = new Image();
    img.onload = () => {
      // Scale background to match target canvas dimensions (same as stars)
      const targetWidth = canvasWidth || img.width;
      const targetHeight = canvasHeight || img.height;
      
      // Create a canvas to scale the background
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetWidth;
      tempCanvas.height = targetHeight;
      const tempCtx = tempCanvas.getContext('2d', { 
        willReadFrequently: true,
        alpha: false 
      })!;
      
      // Scale image to target dimensions with high quality
      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';
      tempCtx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // Convert scaled canvas to ImageBitmap for GPU-accelerated rendering with memory management
      const bitmapOptions: ImageBitmapOptions = {
        premultiplyAlpha: 'premultiply',
        colorSpaceConversion: 'none',
        resizeQuality: 'high'
      };
      
      createImageBitmap(tempCanvas, bitmapOptions).then(bitmap => {
        console.log(`🖼️ [StarField3D] Setting background image bitmap scaled to ${targetWidth}x${targetHeight}`);
        setBackgroundImg(bitmap);
        // Set dimensions if not already set
        if (imageDimensions.width === 1920 && imageDimensions.height === 1080) {
          setImageDimensions({ width: targetWidth, height: targetHeight });
        }
        // Clear temp canvas to free memory
        tempCanvas.width = 1;
        tempCanvas.height = 1;
        console.log('✅ [StarField3D] Background image loaded and scaled for rendering');
      }).catch(error => {
        console.error('❌ [StarField3D] Failed to create background bitmap:', error);
        // Still try to free memory on error
        tempCanvas.width = 1;
        tempCanvas.height = 1;
      });
    };
    img.src = backgroundImage;
  }, [backgroundImage, imageDimensions, canvasWidth, canvasHeight]);

  // Animation loop - optimized with cached context and throttled updates
  const animate = useCallback(() => {
    if (!canvasRef.current) {
      console.warn('⚠️ [StarField3D] animate() called but canvas ref is null');
      return;
    }
    
    // Validate we have required assets before rendering
    const hasLayers = starLayers.layer1 && starLayers.layer2 && starLayers.layer3 && 
                      starLayers.layer4 && starLayers.layer5 && starLayers.layer6 &&
                      starLayers.layer7 && starLayers.layer8 && starLayers.layer9 &&
                      starLayers.layer10 && starLayers.layer11 && starLayers.layer12;
    
    if (!hasLayers) {
      console.warn('⚠️ [StarField3D] animate() called but star layers not ready');
      return;
    }
    
    if (!backgroundImg) {
      console.warn('⚠️ [StarField3D] animate() called but background image not ready');
      return;
    }
    
    // During video generation, we don't need isAnimating check
    const isVideoRendering = videoProgressRef !== undefined;
    if (!isVideoRendering && !isAnimating) return;
    
    const canvas = canvasRef.current;
    
    // Cache canvas context for better performance
    if (!canvasCtxRef.current) {
      console.log('🎨 [StarField3D] Creating cached canvas context');
      canvasCtxRef.current = canvas.getContext('2d', { 
        alpha: false,
        desynchronized: true // Hint to browser for better performance
      })!;
      
      if (!canvasCtxRef.current) {
        console.error('❌ [StarField3D] Failed to get 2D context in animate()');
        return;
      }
    }
    
    const ctx = canvasCtxRef.current;
    const { motionType = 'zoom_in', speed = 1, duration = 10, spin = 0, spinDirection = 'clockwise', fadeOut = true, hyperspeed = false } = settings;
    
    // Use controlled progress if provided (for video recording), otherwise calculate from time
    let progress: number;
    
    if (videoProgressRef !== undefined) {
      // Video rendering mode - read directly from ref (bypasses React batching)
      progress = videoProgressRef.current;
    } else if (controlledProgress !== undefined) {
      // External control mode - use precise progress value
      progress = controlledProgress;
    } else {
      // Normal animation mode - calculate from elapsed time
      if (animationStartTimeRef.current === 0) {
        const now = Date.now();
        animationStartTimeRef.current = now;
        // If resuming, adjust start time to account for current progress
        if (currentProgressRef.current > 0) {
          const elapsedMs = (currentProgressRef.current / 100) * duration * 1000;
          animationStartTimeRef.current = now - elapsedMs;
        }
        pausedTimeRef.current = 0;
      }
      
      const now = Date.now();
      const elapsed = (now - animationStartTimeRef.current) / 1000;
      progress = Math.min((elapsed / duration) * 100, 100);
      currentProgressRef.current = progress; // Store for potential pause
    }
    
    // Throttle progress updates to every 32ms (~30fps) to reduce overhead and improve performance
    const now = Date.now();
    if (onProgressUpdate && now - lastProgressUpdateRef.current > 32) {
      onProgressUpdate(progress);
      lastProgressUpdateRef.current = now;
    }
    
    // Stop animation when duration is reached
    if (progress >= 100) {
      console.log('🎬 [StarField3D] Animation complete at 100%');
      if (onProgressUpdate) {
        onProgressUpdate(100);
      }
      if (onAnimationComplete) {
        onAnimationComplete();
      }
      return; // Stop the animation loop
    }
    
    // Log first frame render
    if (!hasRenderedInitialFrame.current) {
      console.log('🖼️ [StarField3D] Rendering initial frame at progress:', progress.toFixed(2) + '%');
      hasRenderedInitialFrame.current = true;
    }
    
    // Clear canvas with fast fill
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Always use fast rendering for smooth performance, even during recording
    // This matches preview performance and prevents frame drops with 10k+ stars
    ctx.imageSmoothingEnabled = false;
    
    // Calculate zoom/pan with ENHANCED parallax that respects stereoscopic displacement
    const progressRatio = progress / 100;
    
    // Check if we can skip recalculation (performance optimization)
    const stateChanged = !lastRenderState.current || 
      lastRenderState.current.progress !== progress ||
      lastRenderState.current.motionType !== motionType;
    
    // Calculate rotation angle based on progress, spin setting, and direction
    const rotationMultiplier = spinDirection === 'counterclockwise' ? -1 : 1;
    const currentRotation = (spin * progressRatio * Math.PI * rotationMultiplier) / 180; // Convert to radians
    
    // IMPROVED: Calculate parallax multipliers based on stereoscopic displacement
    // This ensures the 3D motion respects the depth calculated by the stereoscope processor
    // Background moves according to horizontalDisplace, stars move opposite by starShiftAmount
    const displacementRatio = horizontalDisplace > 0 ? starShiftAmount / horizontalDisplace : 0.24;
    const baseParallaxScale = depthIntensity / 100;
    
    // Calculate scale needed to fill frame when rotated - prevents black edges during spin
    // Formula ensures rotated rectangle always covers the original viewport
    let rotationScale = 1;
    if (spin > 0) {
      const aspectRatio = canvas.width / canvas.height;
      const absRotation = Math.abs(currentRotation);
      const absSin = Math.abs(Math.sin(absRotation));
      const absCos = Math.abs(Math.cos(absRotation));
      
      // Calculate the scale needed to ensure full coverage at this rotation angle
      // This accounts for both width and height of the rectangular canvas
      const scaleX = absCos + (absSin / aspectRatio);
      const scaleY = absSin + (absCos * aspectRatio);
      rotationScale = Math.max(scaleX, scaleY / aspectRatio);
      
      // Add small safety margin to prevent edge artifacts
      rotationScale *= 1.02;
    }
    
    // Amplification factor from settings (50-300%, default 150%)
    // This controls the overall scale change magnitude for all layers
    const ampFactor = (settings.amplification || 150) / 100;
    
    // Calculate parallax intensity multipliers based on depthIntensity (0-200)
    // Using scientific perspective projection: speed ∝ 1/distance
    // Depth values represent distance from viewer (higher = farther away)
    const intensityFactor = depthIntensity / 50; // 0-4 range (100% = 2.0, 200% = 4.0)
    
    // IMPROVED: Define realistic depth values calibrated to stereoscopic displacement
    // The displacement ratio from Traditional Morph defines the relative depth:
    // - Background displacement: horizontalDisplace (typically 25px)
    // - Star displacement: starShiftAmount (typically 6px) in opposite direction
    // This creates a depth ratio that we use to calibrate our layers
    
    // Calculate depth scaling based on actual stereoscopic displacement
    const stereoDepthScale = 1.0 / (displacementRatio + 0.01); // Avoid division by zero
    
    // Define realistic depth values for each layer based on stereoscopic calibration
    // Using exponential scale calibrated to match traditional morph displacement with 12 layers
    const depthValues = {
      layer1: 1.0 * (1.0 - displacementRatio * 0.7),      // Closest - brightest stars
      layer2: 1.8 * (1.0 - displacementRatio * 0.6),
      layer3: 3.0 * (1.0 - displacementRatio * 0.5),
      layer4: 5.0 * (1.0 - displacementRatio * 0.4),
      layer5: 8.0 * (1.0 - displacementRatio * 0.3),
      layer6: 13.0 * (1.0 - displacementRatio * 0.2),
      layer7: 20.0 * (1.0 - displacementRatio * 0.1),
      layer8: 30.0 * (1.0 + displacementRatio * 0.0),
      layer9: 45.0 * (1.0 + displacementRatio * 0.1),
      layer10: 60.0 * (1.0 + displacementRatio * 0.2),
      layer11: 80.0 * (1.0 + displacementRatio * 0.3),
      layer12: 100.0 * (1.0 + displacementRatio * 0.4),    // Farthest - dimmest stars
      background: 120 * stereoDepthScale                    // Background - furthest
    };
    
    // Calculate velocity multipliers using perspective projection: v = 1/depth
    // All speeds are relative to layer1 (closest layer = speed 1.0)
    const calculateMultiplier = (depth: number) => {
      const baseMultiplier = 1.0 / depth; // Inverse relationship with distance
      
      if (intensityFactor < 1) {
        // Below 50% intensity: compress depth differences
        return 0.5 + (baseMultiplier - 0.5) * intensityFactor;
      } else {
        // Above 50% intensity: expand depth differences
        return baseMultiplier * intensityFactor;
      }
    };
    
    const parallaxMultipliers = {
      layer1: calculateMultiplier(depthValues.layer1),
      layer2: calculateMultiplier(depthValues.layer2),
      layer3: calculateMultiplier(depthValues.layer3),
      layer4: calculateMultiplier(depthValues.layer4),
      layer5: calculateMultiplier(depthValues.layer5),
      layer6: calculateMultiplier(depthValues.layer6),
      layer7: calculateMultiplier(depthValues.layer7),
      layer8: calculateMultiplier(depthValues.layer8),
      layer9: calculateMultiplier(depthValues.layer9),
      layer10: calculateMultiplier(depthValues.layer10),
      layer11: calculateMultiplier(depthValues.layer11),
      layer12: calculateMultiplier(depthValues.layer12),
      background: calculateMultiplier(depthValues.background)
    };
    
    // Pre-calculate common values (cached per canvas size)
    if (!cachedDimensions.current || 
        cachedDimensions.current.canvasCenterX !== canvas.width * 0.5 ||
        cachedDimensions.current.canvasCenterY !== canvas.height * 0.5) {
      cachedDimensions.current = {
        canvasCenterX: canvas.width * 0.5,
        canvasCenterY: canvas.height * 0.5,
        bgScaledWidth: backgroundImg?.width || 0,
        bgScaledHeight: backgroundImg?.height || 0,
        layer12ScaledWidth: starLayers.layer12?.width || 0,
        layer12ScaledHeight: starLayers.layer12?.height || 0,
        layer11ScaledWidth: starLayers.layer11?.width || 0,
        layer11ScaledHeight: starLayers.layer11?.height || 0,
        layer10ScaledWidth: starLayers.layer10?.width || 0,
        layer10ScaledHeight: starLayers.layer10?.height || 0,
        layer9ScaledWidth: starLayers.layer9?.width || 0,
        layer9ScaledHeight: starLayers.layer9?.height || 0,
        layer8ScaledWidth: starLayers.layer8?.width || 0,
        layer8ScaledHeight: starLayers.layer8?.height || 0,
        layer7ScaledWidth: starLayers.layer7?.width || 0,
        layer7ScaledHeight: starLayers.layer7?.height || 0,
        layer6ScaledWidth: starLayers.layer6?.width || 0,
        layer6ScaledHeight: starLayers.layer6?.height || 0,
        layer5ScaledWidth: starLayers.layer5?.width || 0,
        layer5ScaledHeight: starLayers.layer5?.height || 0,
        layer4ScaledWidth: starLayers.layer4?.width || 0,
        layer4ScaledHeight: starLayers.layer4?.height || 0,
        layer3ScaledWidth: starLayers.layer3?.width || 0,
        layer3ScaledHeight: starLayers.layer3?.height || 0,
        layer2ScaledWidth: starLayers.layer2?.width || 0,
        layer2ScaledHeight: starLayers.layer2?.height || 0,
        layer1ScaledWidth: starLayers.layer1?.width || 0,
        layer1ScaledHeight: starLayers.layer1?.height || 0
      };
    }
    
    const canvasCenterX = cachedDimensions.current.canvasCenterX;
    const canvasCenterY = cachedDimensions.current.canvasCenterY;
    
    // Apply easing to progress for smoother motion
    // Ease-in-out cubic for smooth acceleration and deceleration
    const easedProgress = progressRatio < 0.5
      ? 4 * progressRatio * progressRatio * progressRatio
      : 1 - Math.pow(-2 * progressRatio + 2, 3) / 2;
    
    // Only recalculate offsets if state changed
    if (stateChanged) {
      if (motionType === 'zoom_in') {
        // Zoom in: Background (starless) zooms directly by amplification factor
        // Stars use parallax multipliers for depth effect with eased progression
        offsetsRef.current.background.scale = 1.0 + (easedProgress * ampFactor);
        offsetsRef.current.layer12.scale = 1.0 + (easedProgress * ampFactor * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = 1.0 + (easedProgress * ampFactor * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = 1.0 + (easedProgress * ampFactor * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = 1.0 + (easedProgress * ampFactor * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = 1.0 + (easedProgress * ampFactor * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = 1.0 + (easedProgress * ampFactor * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = 1.0 + (easedProgress * ampFactor * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (easedProgress * ampFactor * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (easedProgress * ampFactor * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (easedProgress * ampFactor * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (easedProgress * ampFactor * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (easedProgress * ampFactor * 1.0 * parallaxMultipliers.layer1);
      } else if (motionType === 'zoom_out') {
        // Zoom out: Background (starless) shrinks from amplified size back to normal
        // Stars use parallax multipliers for depth effect with eased progression
        const bgMax = 1.0 + ampFactor;
        const layer12Max = 1.0 + (ampFactor * 0.15 * parallaxMultipliers.layer12);
        const layer11Max = 1.0 + (ampFactor * 0.2 * parallaxMultipliers.layer11);
        const layer10Max = 1.0 + (ampFactor * 0.25 * parallaxMultipliers.layer10);
        const layer9Max = 1.0 + (ampFactor * 0.3 * parallaxMultipliers.layer9);
        const layer8Max = 1.0 + (ampFactor * 0.35 * parallaxMultipliers.layer8);
        const layer7Max = 1.0 + (ampFactor * 0.4 * parallaxMultipliers.layer7);
        const layer6Max = 1.0 + (ampFactor * 0.5 * parallaxMultipliers.layer6);
        const layer5Max = 1.0 + (ampFactor * 0.6 * parallaxMultipliers.layer5);
        const layer4Max = 1.0 + (ampFactor * 0.7 * parallaxMultipliers.layer4);
        const layer3Max = 1.0 + (ampFactor * 0.8 * parallaxMultipliers.layer3);
        const layer2Max = 1.0 + (ampFactor * 0.9 * parallaxMultipliers.layer2);
        const layer1Max = 1.0 + (ampFactor * 1.0 * parallaxMultipliers.layer1);
        
        offsetsRef.current.background.scale = bgMax - (easedProgress * ampFactor);
        offsetsRef.current.layer12.scale = layer12Max - (easedProgress * ampFactor * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = layer11Max - (easedProgress * ampFactor * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = layer10Max - (easedProgress * ampFactor * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = layer9Max - (easedProgress * ampFactor * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = layer8Max - (easedProgress * ampFactor * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = layer7Max - (easedProgress * ampFactor * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = layer6Max - (easedProgress * ampFactor * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = layer5Max - (easedProgress * ampFactor * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = layer4Max - (easedProgress * ampFactor * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = layer3Max - (easedProgress * ampFactor * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = layer2Max - (easedProgress * ampFactor * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = layer1Max - (easedProgress * ampFactor * 1.0 * parallaxMultipliers.layer1);
      } else if (motionType === 'pan_left') {
        // Pan left: Apply constant zoom effect throughout, pan stars left and background right at half speed
        const panAmount = easedProgress * speed * 250;
        
        // Constant zoom effect (remains amplified throughout the animation) - reduced to 50%
        offsetsRef.current.background.scale = 1.0 + (ampFactor * 0.5);
        offsetsRef.current.layer12.scale = 1.0 + (ampFactor * 0.5 * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = 1.0 + (ampFactor * 0.5 * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = 1.0 + (ampFactor * 0.5 * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = 1.0 + (ampFactor * 0.5 * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = 1.0 + (ampFactor * 0.5 * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = 1.0 + (ampFactor * 0.5 * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = 1.0 + (ampFactor * 0.5 * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (ampFactor * 0.5 * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (ampFactor * 0.5 * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (ampFactor * 0.5 * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (ampFactor * 0.5 * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (ampFactor * 0.5 * 1.0 * parallaxMultipliers.layer1);
        
        // Stars and background both pan left (negative x), background moves faster
        offsetsRef.current.background.x = -panAmount * 1.5;
        offsetsRef.current.layer12.x = -panAmount * parallaxMultipliers.layer12;
        offsetsRef.current.layer11.x = -panAmount * parallaxMultipliers.layer11;
        offsetsRef.current.layer10.x = -panAmount * parallaxMultipliers.layer10;
        offsetsRef.current.layer9.x = -panAmount * parallaxMultipliers.layer9;
        offsetsRef.current.layer8.x = -panAmount * parallaxMultipliers.layer8;
        offsetsRef.current.layer7.x = -panAmount * parallaxMultipliers.layer7;
        offsetsRef.current.layer6.x = -panAmount * parallaxMultipliers.layer6;
        offsetsRef.current.layer5.x = -panAmount * parallaxMultipliers.layer5;
        offsetsRef.current.layer4.x = -panAmount * parallaxMultipliers.layer4;
        offsetsRef.current.layer3.x = -panAmount * parallaxMultipliers.layer3;
        offsetsRef.current.layer2.x = -panAmount * parallaxMultipliers.layer2;
        offsetsRef.current.layer1.x = -panAmount * parallaxMultipliers.layer1;
      } else if (motionType === 'pan_right') {
        // Pan right: Apply constant zoom effect throughout, pan stars right and background left at half speed
        const panAmount = easedProgress * speed * 250;
        
        // Constant zoom effect (remains amplified throughout the animation) - reduced to 50%
        offsetsRef.current.background.scale = 1.0 + (ampFactor * 0.5);
        offsetsRef.current.layer12.scale = 1.0 + (ampFactor * 0.5 * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = 1.0 + (ampFactor * 0.5 * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = 1.0 + (ampFactor * 0.5 * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = 1.0 + (ampFactor * 0.5 * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = 1.0 + (ampFactor * 0.5 * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = 1.0 + (ampFactor * 0.5 * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = 1.0 + (ampFactor * 0.5 * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (ampFactor * 0.5 * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (ampFactor * 0.5 * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (ampFactor * 0.5 * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (ampFactor * 0.5 * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (ampFactor * 0.5 * 1.0 * parallaxMultipliers.layer1);
        
        // Stars and background both pan right (positive x), background moves faster
        offsetsRef.current.background.x = panAmount * 1.5;
        offsetsRef.current.layer12.x = panAmount * parallaxMultipliers.layer12;
        offsetsRef.current.layer11.x = panAmount * parallaxMultipliers.layer11;
        offsetsRef.current.layer10.x = panAmount * parallaxMultipliers.layer10;
        offsetsRef.current.layer9.x = panAmount * parallaxMultipliers.layer9;
        offsetsRef.current.layer8.x = panAmount * parallaxMultipliers.layer8;
        offsetsRef.current.layer7.x = panAmount * parallaxMultipliers.layer7;
        offsetsRef.current.layer6.x = panAmount * parallaxMultipliers.layer6;
        offsetsRef.current.layer5.x = panAmount * parallaxMultipliers.layer5;
        offsetsRef.current.layer4.x = panAmount * parallaxMultipliers.layer4;
        offsetsRef.current.layer3.x = panAmount * parallaxMultipliers.layer3;
        offsetsRef.current.layer2.x = panAmount * parallaxMultipliers.layer2;
        offsetsRef.current.layer1.x = panAmount * parallaxMultipliers.layer1;
      } else if (motionType === 'zoom_in_pan_left') {
        // Combined zoom in + pan left: Zoom progresses with eased curve while panning left
        const panAmount = easedProgress * speed * 250;
        
        // Progressive zoom from start to end with eased progression
        const bgMax = 1.0 + ampFactor;
        offsetsRef.current.background.scale = 1.0 + (easedProgress * ampFactor);
        offsetsRef.current.layer12.scale = 1.0 + (easedProgress * ampFactor * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = 1.0 + (easedProgress * ampFactor * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = 1.0 + (easedProgress * ampFactor * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = 1.0 + (easedProgress * ampFactor * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = 1.0 + (easedProgress * ampFactor * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = 1.0 + (easedProgress * ampFactor * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = 1.0 + (easedProgress * ampFactor * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (easedProgress * ampFactor * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (easedProgress * ampFactor * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (easedProgress * ampFactor * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (easedProgress * ampFactor * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (easedProgress * ampFactor * 1.0 * parallaxMultipliers.layer1);
        
        // Pan left with parallax
        offsetsRef.current.background.x = -panAmount * 1.5;
        offsetsRef.current.layer12.x = -panAmount * parallaxMultipliers.layer12;
        offsetsRef.current.layer11.x = -panAmount * parallaxMultipliers.layer11;
        offsetsRef.current.layer10.x = -panAmount * parallaxMultipliers.layer10;
        offsetsRef.current.layer9.x = -panAmount * parallaxMultipliers.layer9;
        offsetsRef.current.layer8.x = -panAmount * parallaxMultipliers.layer8;
        offsetsRef.current.layer7.x = -panAmount * parallaxMultipliers.layer7;
        offsetsRef.current.layer6.x = -panAmount * parallaxMultipliers.layer6;
        offsetsRef.current.layer5.x = -panAmount * parallaxMultipliers.layer5;
        offsetsRef.current.layer4.x = -panAmount * parallaxMultipliers.layer4;
        offsetsRef.current.layer3.x = -panAmount * parallaxMultipliers.layer3;
        offsetsRef.current.layer2.x = -panAmount * parallaxMultipliers.layer2;
        offsetsRef.current.layer1.x = -panAmount * parallaxMultipliers.layer1;
      } else if (motionType === 'zoom_in_pan_right') {
        // Combined zoom in + pan right: Zoom progresses with eased curve while panning right
        const panAmount = easedProgress * speed * 250;
        
        // Progressive zoom from start to end with eased progression
        const bgMax = 1.0 + ampFactor;
        offsetsRef.current.background.scale = 1.0 + (easedProgress * ampFactor);
        offsetsRef.current.layer12.scale = 1.0 + (easedProgress * ampFactor * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = 1.0 + (easedProgress * ampFactor * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = 1.0 + (easedProgress * ampFactor * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = 1.0 + (easedProgress * ampFactor * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = 1.0 + (easedProgress * ampFactor * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = 1.0 + (easedProgress * ampFactor * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = 1.0 + (easedProgress * ampFactor * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (easedProgress * ampFactor * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (easedProgress * ampFactor * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (easedProgress * ampFactor * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (easedProgress * ampFactor * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (easedProgress * ampFactor * 1.0 * parallaxMultipliers.layer1);
        
        // Pan right with parallax
        offsetsRef.current.background.x = panAmount * 1.5;
        offsetsRef.current.layer12.x = panAmount * parallaxMultipliers.layer12;
        offsetsRef.current.layer11.x = panAmount * parallaxMultipliers.layer11;
        offsetsRef.current.layer10.x = panAmount * parallaxMultipliers.layer10;
        offsetsRef.current.layer9.x = panAmount * parallaxMultipliers.layer9;
        offsetsRef.current.layer8.x = panAmount * parallaxMultipliers.layer8;
        offsetsRef.current.layer7.x = panAmount * parallaxMultipliers.layer7;
        offsetsRef.current.layer6.x = panAmount * parallaxMultipliers.layer6;
        offsetsRef.current.layer5.x = panAmount * parallaxMultipliers.layer5;
        offsetsRef.current.layer4.x = panAmount * parallaxMultipliers.layer4;
        offsetsRef.current.layer3.x = panAmount * parallaxMultipliers.layer3;
        offsetsRef.current.layer2.x = panAmount * parallaxMultipliers.layer2;
        offsetsRef.current.layer1.x = panAmount * parallaxMultipliers.layer1;
      } else if (motionType === 'zoom_out_pan_left') {
        // Combined zoom out + pan left: Zoom decreases from max to 1.0 while panning left
        const panAmount = easedProgress * speed * 250;
        
        // Progressive zoom out from max to 1.0 with eased progression
        offsetsRef.current.background.scale = (1.0 + ampFactor) - (easedProgress * ampFactor);
        offsetsRef.current.layer12.scale = (1.0 + ampFactor * 0.15 * parallaxMultipliers.layer12) - (easedProgress * ampFactor * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = (1.0 + ampFactor * 0.2 * parallaxMultipliers.layer11) - (easedProgress * ampFactor * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = (1.0 + ampFactor * 0.25 * parallaxMultipliers.layer10) - (easedProgress * ampFactor * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = (1.0 + ampFactor * 0.3 * parallaxMultipliers.layer9) - (easedProgress * ampFactor * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = (1.0 + ampFactor * 0.35 * parallaxMultipliers.layer8) - (easedProgress * ampFactor * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = (1.0 + ampFactor * 0.4 * parallaxMultipliers.layer7) - (easedProgress * ampFactor * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = (1.0 + ampFactor * 0.5 * parallaxMultipliers.layer6) - (easedProgress * ampFactor * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = (1.0 + ampFactor * 0.6 * parallaxMultipliers.layer5) - (easedProgress * ampFactor * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = (1.0 + ampFactor * 0.7 * parallaxMultipliers.layer4) - (easedProgress * ampFactor * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = (1.0 + ampFactor * 0.8 * parallaxMultipliers.layer3) - (easedProgress * ampFactor * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = (1.0 + ampFactor * 0.9 * parallaxMultipliers.layer2) - (easedProgress * ampFactor * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = (1.0 + ampFactor * 1.0 * parallaxMultipliers.layer1) - (easedProgress * ampFactor * 1.0 * parallaxMultipliers.layer1);
        
        // Pan left with parallax
        offsetsRef.current.background.x = -panAmount * 1.5;
        offsetsRef.current.layer12.x = -panAmount * parallaxMultipliers.layer12;
        offsetsRef.current.layer11.x = -panAmount * parallaxMultipliers.layer11;
        offsetsRef.current.layer10.x = -panAmount * parallaxMultipliers.layer10;
        offsetsRef.current.layer9.x = -panAmount * parallaxMultipliers.layer9;
        offsetsRef.current.layer8.x = -panAmount * parallaxMultipliers.layer8;
        offsetsRef.current.layer7.x = -panAmount * parallaxMultipliers.layer7;
        offsetsRef.current.layer6.x = -panAmount * parallaxMultipliers.layer6;
        offsetsRef.current.layer5.x = -panAmount * parallaxMultipliers.layer5;
        offsetsRef.current.layer4.x = -panAmount * parallaxMultipliers.layer4;
        offsetsRef.current.layer3.x = -panAmount * parallaxMultipliers.layer3;
        offsetsRef.current.layer2.x = -panAmount * parallaxMultipliers.layer2;
        offsetsRef.current.layer1.x = -panAmount * parallaxMultipliers.layer1;
      } else if (motionType === 'zoom_out_pan_right') {
        // Combined zoom out + pan right: Zoom decreases from max to 1.0 while panning right
        const panAmount = easedProgress * speed * 250;
        
        // Progressive zoom out from max to 1.0 with eased progression
        offsetsRef.current.background.scale = (1.0 + ampFactor) - (easedProgress * ampFactor);
        offsetsRef.current.layer12.scale = (1.0 + ampFactor * 0.15 * parallaxMultipliers.layer12) - (easedProgress * ampFactor * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = (1.0 + ampFactor * 0.2 * parallaxMultipliers.layer11) - (easedProgress * ampFactor * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = (1.0 + ampFactor * 0.25 * parallaxMultipliers.layer10) - (easedProgress * ampFactor * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = (1.0 + ampFactor * 0.3 * parallaxMultipliers.layer9) - (easedProgress * ampFactor * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = (1.0 + ampFactor * 0.35 * parallaxMultipliers.layer8) - (easedProgress * ampFactor * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = (1.0 + ampFactor * 0.4 * parallaxMultipliers.layer7) - (easedProgress * ampFactor * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = (1.0 + ampFactor * 0.5 * parallaxMultipliers.layer6) - (easedProgress * ampFactor * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = (1.0 + ampFactor * 0.6 * parallaxMultipliers.layer5) - (easedProgress * ampFactor * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = (1.0 + ampFactor * 0.7 * parallaxMultipliers.layer4) - (easedProgress * ampFactor * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = (1.0 + ampFactor * 0.8 * parallaxMultipliers.layer3) - (easedProgress * ampFactor * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = (1.0 + ampFactor * 0.9 * parallaxMultipliers.layer2) - (easedProgress * ampFactor * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = (1.0 + ampFactor * 1.0 * parallaxMultipliers.layer1) - (easedProgress * ampFactor * 1.0 * parallaxMultipliers.layer1);
        
        // Pan right with parallax
        offsetsRef.current.background.x = panAmount * 1.5;
        offsetsRef.current.layer12.x = panAmount * parallaxMultipliers.layer12;
        offsetsRef.current.layer11.x = panAmount * parallaxMultipliers.layer11;
        offsetsRef.current.layer10.x = panAmount * parallaxMultipliers.layer10;
        offsetsRef.current.layer9.x = panAmount * parallaxMultipliers.layer9;
        offsetsRef.current.layer8.x = panAmount * parallaxMultipliers.layer8;
        offsetsRef.current.layer7.x = panAmount * parallaxMultipliers.layer7;
        offsetsRef.current.layer6.x = panAmount * parallaxMultipliers.layer6;
        offsetsRef.current.layer5.x = panAmount * parallaxMultipliers.layer5;
        offsetsRef.current.layer4.x = panAmount * parallaxMultipliers.layer4;
        offsetsRef.current.layer3.x = panAmount * parallaxMultipliers.layer3;
        offsetsRef.current.layer2.x = panAmount * parallaxMultipliers.layer2;
        offsetsRef.current.layer1.x = panAmount * parallaxMultipliers.layer1;
      } else if (motionType === 'pan_up') {
        // Pan up: Apply constant zoom effect throughout, pan stars up and background at 1.5x speed
        const panAmount = easedProgress * speed * 250;
        
        // Constant zoom effect (remains amplified throughout the animation) - reduced to 50%
        offsetsRef.current.background.scale = 1.0 + (ampFactor * 0.5);
        offsetsRef.current.layer12.scale = 1.0 + (ampFactor * 0.5 * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = 1.0 + (ampFactor * 0.5 * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = 1.0 + (ampFactor * 0.5 * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = 1.0 + (ampFactor * 0.5 * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = 1.0 + (ampFactor * 0.5 * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = 1.0 + (ampFactor * 0.5 * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = 1.0 + (ampFactor * 0.5 * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (ampFactor * 0.5 * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (ampFactor * 0.5 * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (ampFactor * 0.5 * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (ampFactor * 0.5 * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (ampFactor * 0.5 * 1.0 * parallaxMultipliers.layer1);
        
        // Stars and background both pan up (negative y), background moves faster
        offsetsRef.current.background.y = -panAmount * 1.5;
        offsetsRef.current.layer12.y = -panAmount * parallaxMultipliers.layer12;
        offsetsRef.current.layer11.y = -panAmount * parallaxMultipliers.layer11;
        offsetsRef.current.layer10.y = -panAmount * parallaxMultipliers.layer10;
        offsetsRef.current.layer9.y = -panAmount * parallaxMultipliers.layer9;
        offsetsRef.current.layer8.y = -panAmount * parallaxMultipliers.layer8;
        offsetsRef.current.layer7.y = -panAmount * parallaxMultipliers.layer7;
        offsetsRef.current.layer6.y = -panAmount * parallaxMultipliers.layer6;
        offsetsRef.current.layer5.y = -panAmount * parallaxMultipliers.layer5;
        offsetsRef.current.layer4.y = -panAmount * parallaxMultipliers.layer4;
        offsetsRef.current.layer3.y = -panAmount * parallaxMultipliers.layer3;
        offsetsRef.current.layer2.y = -panAmount * parallaxMultipliers.layer2;
        offsetsRef.current.layer1.y = -panAmount * parallaxMultipliers.layer1;
      } else if (motionType === 'pan_down') {
        // Pan down: Apply constant zoom effect throughout, pan stars down and background at 1.5x speed
        const panAmount = easedProgress * speed * 250;
        
        // Constant zoom effect (remains amplified throughout the animation) - reduced to 50%
        offsetsRef.current.background.scale = 1.0 + (ampFactor * 0.5);
        offsetsRef.current.layer12.scale = 1.0 + (ampFactor * 0.5 * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = 1.0 + (ampFactor * 0.5 * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = 1.0 + (ampFactor * 0.5 * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = 1.0 + (ampFactor * 0.5 * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = 1.0 + (ampFactor * 0.5 * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = 1.0 + (ampFactor * 0.5 * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = 1.0 + (ampFactor * 0.5 * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (ampFactor * 0.5 * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (ampFactor * 0.5 * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (ampFactor * 0.5 * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (ampFactor * 0.5 * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (ampFactor * 0.5 * 1.0 * parallaxMultipliers.layer1);
        
        // Stars and background both pan down (positive y), background moves faster
        offsetsRef.current.background.y = panAmount * 1.5;
        offsetsRef.current.layer12.y = panAmount * parallaxMultipliers.layer12;
        offsetsRef.current.layer11.y = panAmount * parallaxMultipliers.layer11;
        offsetsRef.current.layer10.y = panAmount * parallaxMultipliers.layer10;
        offsetsRef.current.layer9.y = panAmount * parallaxMultipliers.layer9;
        offsetsRef.current.layer8.y = panAmount * parallaxMultipliers.layer8;
        offsetsRef.current.layer7.y = panAmount * parallaxMultipliers.layer7;
        offsetsRef.current.layer6.y = panAmount * parallaxMultipliers.layer6;
        offsetsRef.current.layer5.y = panAmount * parallaxMultipliers.layer5;
        offsetsRef.current.layer4.y = panAmount * parallaxMultipliers.layer4;
        offsetsRef.current.layer3.y = panAmount * parallaxMultipliers.layer3;
        offsetsRef.current.layer2.y = panAmount * parallaxMultipliers.layer2;
        offsetsRef.current.layer1.y = panAmount * parallaxMultipliers.layer1;
      } else if (motionType === 'zoom_in_pan_up') {
        // Combined zoom in + pan up
        const panAmount = easedProgress * speed * 250;
        
        // Progressive zoom with eased progression
        offsetsRef.current.background.scale = 1.0 + (easedProgress * ampFactor);
        offsetsRef.current.layer12.scale = 1.0 + (easedProgress * ampFactor * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = 1.0 + (easedProgress * ampFactor * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = 1.0 + (easedProgress * ampFactor * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = 1.0 + (easedProgress * ampFactor * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = 1.0 + (easedProgress * ampFactor * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = 1.0 + (easedProgress * ampFactor * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = 1.0 + (easedProgress * ampFactor * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (easedProgress * ampFactor * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (easedProgress * ampFactor * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (easedProgress * ampFactor * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (easedProgress * ampFactor * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (easedProgress * ampFactor * 1.0 * parallaxMultipliers.layer1);
        
        // Pan up with parallax
        offsetsRef.current.background.y = -panAmount * 1.5;
        offsetsRef.current.layer12.y = -panAmount * parallaxMultipliers.layer12;
        offsetsRef.current.layer11.y = -panAmount * parallaxMultipliers.layer11;
        offsetsRef.current.layer10.y = -panAmount * parallaxMultipliers.layer10;
        offsetsRef.current.layer9.y = -panAmount * parallaxMultipliers.layer9;
        offsetsRef.current.layer8.y = -panAmount * parallaxMultipliers.layer8;
        offsetsRef.current.layer7.y = -panAmount * parallaxMultipliers.layer7;
        offsetsRef.current.layer6.y = -panAmount * parallaxMultipliers.layer6;
        offsetsRef.current.layer5.y = -panAmount * parallaxMultipliers.layer5;
        offsetsRef.current.layer4.y = -panAmount * parallaxMultipliers.layer4;
        offsetsRef.current.layer3.y = -panAmount * parallaxMultipliers.layer3;
        offsetsRef.current.layer2.y = -panAmount * parallaxMultipliers.layer2;
        offsetsRef.current.layer1.y = -panAmount * parallaxMultipliers.layer1;
      } else if (motionType === 'zoom_in_pan_down') {
        // Combined zoom in + pan down
        const panAmount = easedProgress * speed * 250;
        
        // Progressive zoom with eased progression
        offsetsRef.current.background.scale = 1.0 + (easedProgress * ampFactor);
        offsetsRef.current.layer12.scale = 1.0 + (easedProgress * ampFactor * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = 1.0 + (easedProgress * ampFactor * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = 1.0 + (easedProgress * ampFactor * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = 1.0 + (easedProgress * ampFactor * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = 1.0 + (easedProgress * ampFactor * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = 1.0 + (easedProgress * ampFactor * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = 1.0 + (easedProgress * ampFactor * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (easedProgress * ampFactor * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (easedProgress * ampFactor * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (easedProgress * ampFactor * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (easedProgress * ampFactor * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (easedProgress * ampFactor * 1.0 * parallaxMultipliers.layer1);
        
        // Pan down with parallax
        offsetsRef.current.background.y = panAmount * 1.5;
        offsetsRef.current.layer12.y = panAmount * parallaxMultipliers.layer12;
        offsetsRef.current.layer11.y = panAmount * parallaxMultipliers.layer11;
        offsetsRef.current.layer10.y = panAmount * parallaxMultipliers.layer10;
        offsetsRef.current.layer9.y = panAmount * parallaxMultipliers.layer9;
        offsetsRef.current.layer8.y = panAmount * parallaxMultipliers.layer8;
        offsetsRef.current.layer7.y = panAmount * parallaxMultipliers.layer7;
        offsetsRef.current.layer6.y = panAmount * parallaxMultipliers.layer6;
        offsetsRef.current.layer5.y = panAmount * parallaxMultipliers.layer5;
        offsetsRef.current.layer4.y = panAmount * parallaxMultipliers.layer4;
        offsetsRef.current.layer3.y = panAmount * parallaxMultipliers.layer3;
        offsetsRef.current.layer2.y = panAmount * parallaxMultipliers.layer2;
        offsetsRef.current.layer1.y = panAmount * parallaxMultipliers.layer1;
      } else if (motionType === 'zoom_out_pan_up') {
        // Combined zoom out + pan up
        const panAmount = easedProgress * speed * 250;
        
        // Progressive zoom out from max to 1.0 with eased progression
        offsetsRef.current.background.scale = (1.0 + ampFactor) - (easedProgress * ampFactor);
        offsetsRef.current.layer12.scale = (1.0 + ampFactor * 0.15 * parallaxMultipliers.layer12) - (easedProgress * ampFactor * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = (1.0 + ampFactor * 0.2 * parallaxMultipliers.layer11) - (easedProgress * ampFactor * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = (1.0 + ampFactor * 0.25 * parallaxMultipliers.layer10) - (easedProgress * ampFactor * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = (1.0 + ampFactor * 0.3 * parallaxMultipliers.layer9) - (easedProgress * ampFactor * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = (1.0 + ampFactor * 0.35 * parallaxMultipliers.layer8) - (easedProgress * ampFactor * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = (1.0 + ampFactor * 0.4 * parallaxMultipliers.layer7) - (easedProgress * ampFactor * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = (1.0 + ampFactor * 0.5 * parallaxMultipliers.layer6) - (easedProgress * ampFactor * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = (1.0 + ampFactor * 0.6 * parallaxMultipliers.layer5) - (easedProgress * ampFactor * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = (1.0 + ampFactor * 0.7 * parallaxMultipliers.layer4) - (easedProgress * ampFactor * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = (1.0 + ampFactor * 0.8 * parallaxMultipliers.layer3) - (easedProgress * ampFactor * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = (1.0 + ampFactor * 0.9 * parallaxMultipliers.layer2) - (easedProgress * ampFactor * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = (1.0 + ampFactor * 1.0 * parallaxMultipliers.layer1) - (easedProgress * ampFactor * 1.0 * parallaxMultipliers.layer1);
        
        // Pan up with parallax
        offsetsRef.current.background.y = -panAmount * 1.5;
        offsetsRef.current.layer12.y = -panAmount * parallaxMultipliers.layer12;
        offsetsRef.current.layer11.y = -panAmount * parallaxMultipliers.layer11;
        offsetsRef.current.layer10.y = -panAmount * parallaxMultipliers.layer10;
        offsetsRef.current.layer9.y = -panAmount * parallaxMultipliers.layer9;
        offsetsRef.current.layer8.y = -panAmount * parallaxMultipliers.layer8;
        offsetsRef.current.layer7.y = -panAmount * parallaxMultipliers.layer7;
        offsetsRef.current.layer6.y = -panAmount * parallaxMultipliers.layer6;
        offsetsRef.current.layer5.y = -panAmount * parallaxMultipliers.layer5;
        offsetsRef.current.layer4.y = -panAmount * parallaxMultipliers.layer4;
        offsetsRef.current.layer3.y = -panAmount * parallaxMultipliers.layer3;
        offsetsRef.current.layer2.y = -panAmount * parallaxMultipliers.layer2;
        offsetsRef.current.layer1.y = -panAmount * parallaxMultipliers.layer1;
      } else if (motionType === 'zoom_out_pan_down') {
        // Combined zoom out + pan down
        const panAmount = easedProgress * speed * 250;
        
        // Progressive zoom out from max to 1.0 with eased progression
        offsetsRef.current.background.scale = (1.0 + ampFactor) - (easedProgress * ampFactor);
        offsetsRef.current.layer12.scale = (1.0 + ampFactor * 0.15 * parallaxMultipliers.layer12) - (easedProgress * ampFactor * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = (1.0 + ampFactor * 0.2 * parallaxMultipliers.layer11) - (easedProgress * ampFactor * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = (1.0 + ampFactor * 0.25 * parallaxMultipliers.layer10) - (easedProgress * ampFactor * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = (1.0 + ampFactor * 0.3 * parallaxMultipliers.layer9) - (easedProgress * ampFactor * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = (1.0 + ampFactor * 0.35 * parallaxMultipliers.layer8) - (easedProgress * ampFactor * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = (1.0 + ampFactor * 0.4 * parallaxMultipliers.layer7) - (easedProgress * ampFactor * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = (1.0 + ampFactor * 0.5 * parallaxMultipliers.layer6) - (easedProgress * ampFactor * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = (1.0 + ampFactor * 0.6 * parallaxMultipliers.layer5) - (easedProgress * ampFactor * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = (1.0 + ampFactor * 0.7 * parallaxMultipliers.layer4) - (easedProgress * ampFactor * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = (1.0 + ampFactor * 0.8 * parallaxMultipliers.layer3) - (easedProgress * ampFactor * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = (1.0 + ampFactor * 0.9 * parallaxMultipliers.layer2) - (easedProgress * ampFactor * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = (1.0 + ampFactor * 1.0 * parallaxMultipliers.layer1) - (easedProgress * ampFactor * 1.0 * parallaxMultipliers.layer1);
        
        // Pan down with parallax
        offsetsRef.current.background.y = panAmount * 1.5;
        offsetsRef.current.layer12.y = panAmount * parallaxMultipliers.layer12;
        offsetsRef.current.layer11.y = panAmount * parallaxMultipliers.layer11;
        offsetsRef.current.layer10.y = panAmount * parallaxMultipliers.layer10;
        offsetsRef.current.layer9.y = panAmount * parallaxMultipliers.layer9;
        offsetsRef.current.layer8.y = panAmount * parallaxMultipliers.layer8;
        offsetsRef.current.layer7.y = panAmount * parallaxMultipliers.layer7;
        offsetsRef.current.layer6.y = panAmount * parallaxMultipliers.layer6;
        offsetsRef.current.layer5.y = panAmount * parallaxMultipliers.layer5;
        offsetsRef.current.layer4.y = panAmount * parallaxMultipliers.layer4;
        offsetsRef.current.layer3.y = panAmount * parallaxMultipliers.layer3;
        offsetsRef.current.layer2.y = panAmount * parallaxMultipliers.layer2;
        offsetsRef.current.layer1.y = panAmount * parallaxMultipliers.layer1;
      } else if (motionType === 'pan_diagonal_up_left') {
        // Pan diagonal up-left with constant zoom
        const panAmount = easedProgress * speed * 250;
        const diagonalFactor = 0.707; // sqrt(2)/2 for 45-degree diagonal
        
        // Constant zoom effect - reduced to 50%
        offsetsRef.current.background.scale = 1.0 + (ampFactor * 0.5);
        offsetsRef.current.layer12.scale = 1.0 + (ampFactor * 0.5 * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = 1.0 + (ampFactor * 0.5 * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = 1.0 + (ampFactor * 0.5 * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = 1.0 + (ampFactor * 0.5 * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = 1.0 + (ampFactor * 0.5 * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = 1.0 + (ampFactor * 0.5 * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = 1.0 + (ampFactor * 0.5 * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (ampFactor * 0.5 * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (ampFactor * 0.5 * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (ampFactor * 0.5 * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (ampFactor * 0.5 * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (ampFactor * 0.5 * 1.0 * parallaxMultipliers.layer1);
        
        // Pan diagonal up-left with parallax
        offsetsRef.current.background.x = -panAmount * 1.5 * diagonalFactor;
        offsetsRef.current.background.y = -panAmount * 1.5 * diagonalFactor;
        offsetsRef.current.layer12.x = -panAmount * parallaxMultipliers.layer12 * diagonalFactor;
        offsetsRef.current.layer12.y = -panAmount * parallaxMultipliers.layer12 * diagonalFactor;
        offsetsRef.current.layer11.x = -panAmount * parallaxMultipliers.layer11 * diagonalFactor;
        offsetsRef.current.layer11.y = -panAmount * parallaxMultipliers.layer11 * diagonalFactor;
        offsetsRef.current.layer10.x = -panAmount * parallaxMultipliers.layer10 * diagonalFactor;
        offsetsRef.current.layer10.y = -panAmount * parallaxMultipliers.layer10 * diagonalFactor;
        offsetsRef.current.layer9.x = -panAmount * parallaxMultipliers.layer9 * diagonalFactor;
        offsetsRef.current.layer9.y = -panAmount * parallaxMultipliers.layer9 * diagonalFactor;
        offsetsRef.current.layer8.x = -panAmount * parallaxMultipliers.layer8 * diagonalFactor;
        offsetsRef.current.layer8.y = -panAmount * parallaxMultipliers.layer8 * diagonalFactor;
        offsetsRef.current.layer7.x = -panAmount * parallaxMultipliers.layer7 * diagonalFactor;
        offsetsRef.current.layer7.y = -panAmount * parallaxMultipliers.layer7 * diagonalFactor;
        offsetsRef.current.layer6.x = -panAmount * parallaxMultipliers.layer6 * diagonalFactor;
        offsetsRef.current.layer6.y = -panAmount * parallaxMultipliers.layer6 * diagonalFactor;
        offsetsRef.current.layer5.x = -panAmount * parallaxMultipliers.layer5 * diagonalFactor;
        offsetsRef.current.layer5.y = -panAmount * parallaxMultipliers.layer5 * diagonalFactor;
        offsetsRef.current.layer4.x = -panAmount * parallaxMultipliers.layer4 * diagonalFactor;
        offsetsRef.current.layer4.y = -panAmount * parallaxMultipliers.layer4 * diagonalFactor;
        offsetsRef.current.layer3.x = -panAmount * parallaxMultipliers.layer3 * diagonalFactor;
        offsetsRef.current.layer3.y = -panAmount * parallaxMultipliers.layer3 * diagonalFactor;
        offsetsRef.current.layer2.x = -panAmount * parallaxMultipliers.layer2 * diagonalFactor;
        offsetsRef.current.layer2.y = -panAmount * parallaxMultipliers.layer2 * diagonalFactor;
        offsetsRef.current.layer1.x = -panAmount * parallaxMultipliers.layer1 * diagonalFactor;
        offsetsRef.current.layer1.y = -panAmount * parallaxMultipliers.layer1 * diagonalFactor;
      } else if (motionType === 'pan_diagonal_up_right') {
        // Pan diagonal up-right with constant zoom
        const panAmount = easedProgress * speed * 250;
        const diagonalFactor = 0.707;
        
        // Constant zoom effect
        offsetsRef.current.background.scale = 1.0 + (ampFactor * 0.5);
        offsetsRef.current.layer12.scale = 1.0 + (ampFactor * 0.5 * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = 1.0 + (ampFactor * 0.5 * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = 1.0 + (ampFactor * 0.5 * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = 1.0 + (ampFactor * 0.5 * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = 1.0 + (ampFactor * 0.5 * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = 1.0 + (ampFactor * 0.5 * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = 1.0 + (ampFactor * 0.5 * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (ampFactor * 0.5 * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (ampFactor * 0.5 * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (ampFactor * 0.5 * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (ampFactor * 0.5 * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (ampFactor * 0.5 * 1.0 * parallaxMultipliers.layer1);
        
        // Pan diagonal up-right with parallax
        offsetsRef.current.background.x = panAmount * 1.5 * diagonalFactor;
        offsetsRef.current.background.y = -panAmount * 1.5 * diagonalFactor;
        offsetsRef.current.layer12.x = panAmount * parallaxMultipliers.layer12 * diagonalFactor;
        offsetsRef.current.layer12.y = -panAmount * parallaxMultipliers.layer12 * diagonalFactor;
        offsetsRef.current.layer11.x = panAmount * parallaxMultipliers.layer11 * diagonalFactor;
        offsetsRef.current.layer11.y = -panAmount * parallaxMultipliers.layer11 * diagonalFactor;
        offsetsRef.current.layer10.x = panAmount * parallaxMultipliers.layer10 * diagonalFactor;
        offsetsRef.current.layer10.y = -panAmount * parallaxMultipliers.layer10 * diagonalFactor;
        offsetsRef.current.layer9.x = panAmount * parallaxMultipliers.layer9 * diagonalFactor;
        offsetsRef.current.layer9.y = -panAmount * parallaxMultipliers.layer9 * diagonalFactor;
        offsetsRef.current.layer8.x = panAmount * parallaxMultipliers.layer8 * diagonalFactor;
        offsetsRef.current.layer8.y = -panAmount * parallaxMultipliers.layer8 * diagonalFactor;
        offsetsRef.current.layer7.x = panAmount * parallaxMultipliers.layer7 * diagonalFactor;
        offsetsRef.current.layer7.y = -panAmount * parallaxMultipliers.layer7 * diagonalFactor;
        offsetsRef.current.layer6.x = panAmount * parallaxMultipliers.layer6 * diagonalFactor;
        offsetsRef.current.layer6.y = -panAmount * parallaxMultipliers.layer6 * diagonalFactor;
        offsetsRef.current.layer5.x = panAmount * parallaxMultipliers.layer5 * diagonalFactor;
        offsetsRef.current.layer5.y = -panAmount * parallaxMultipliers.layer5 * diagonalFactor;
        offsetsRef.current.layer4.x = panAmount * parallaxMultipliers.layer4 * diagonalFactor;
        offsetsRef.current.layer4.y = -panAmount * parallaxMultipliers.layer4 * diagonalFactor;
        offsetsRef.current.layer3.x = panAmount * parallaxMultipliers.layer3 * diagonalFactor;
        offsetsRef.current.layer3.y = -panAmount * parallaxMultipliers.layer3 * diagonalFactor;
        offsetsRef.current.layer2.x = panAmount * parallaxMultipliers.layer2 * diagonalFactor;
        offsetsRef.current.layer2.y = -panAmount * parallaxMultipliers.layer2 * diagonalFactor;
        offsetsRef.current.layer1.x = panAmount * parallaxMultipliers.layer1 * diagonalFactor;
        offsetsRef.current.layer1.y = -panAmount * parallaxMultipliers.layer1 * diagonalFactor;
      } else if (motionType === 'pan_diagonal_down_left') {
        // Pan diagonal down-left with constant zoom
        const panAmount = easedProgress * speed * 250;
        const diagonalFactor = 0.707;
        
        // Constant zoom effect
        offsetsRef.current.background.scale = 1.0 + (ampFactor * 0.5);
        offsetsRef.current.layer12.scale = 1.0 + (ampFactor * 0.5 * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = 1.0 + (ampFactor * 0.5 * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = 1.0 + (ampFactor * 0.5 * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = 1.0 + (ampFactor * 0.5 * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = 1.0 + (ampFactor * 0.5 * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = 1.0 + (ampFactor * 0.5 * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = 1.0 + (ampFactor * 0.5 * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (ampFactor * 0.5 * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (ampFactor * 0.5 * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (ampFactor * 0.5 * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (ampFactor * 0.5 * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (ampFactor * 0.5 * 1.0 * parallaxMultipliers.layer1);
        
        // Pan diagonal down-left with parallax
        offsetsRef.current.background.x = -panAmount * 1.5 * diagonalFactor;
        offsetsRef.current.background.y = panAmount * 1.5 * diagonalFactor;
        offsetsRef.current.layer12.x = -panAmount * parallaxMultipliers.layer12 * diagonalFactor;
        offsetsRef.current.layer12.y = panAmount * parallaxMultipliers.layer12 * diagonalFactor;
        offsetsRef.current.layer11.x = -panAmount * parallaxMultipliers.layer11 * diagonalFactor;
        offsetsRef.current.layer11.y = panAmount * parallaxMultipliers.layer11 * diagonalFactor;
        offsetsRef.current.layer10.x = -panAmount * parallaxMultipliers.layer10 * diagonalFactor;
        offsetsRef.current.layer10.y = panAmount * parallaxMultipliers.layer10 * diagonalFactor;
        offsetsRef.current.layer9.x = -panAmount * parallaxMultipliers.layer9 * diagonalFactor;
        offsetsRef.current.layer9.y = panAmount * parallaxMultipliers.layer9 * diagonalFactor;
        offsetsRef.current.layer8.x = -panAmount * parallaxMultipliers.layer8 * diagonalFactor;
        offsetsRef.current.layer8.y = panAmount * parallaxMultipliers.layer8 * diagonalFactor;
        offsetsRef.current.layer7.x = -panAmount * parallaxMultipliers.layer7 * diagonalFactor;
        offsetsRef.current.layer7.y = panAmount * parallaxMultipliers.layer7 * diagonalFactor;
        offsetsRef.current.layer6.x = -panAmount * parallaxMultipliers.layer6 * diagonalFactor;
        offsetsRef.current.layer6.y = panAmount * parallaxMultipliers.layer6 * diagonalFactor;
        offsetsRef.current.layer5.x = -panAmount * parallaxMultipliers.layer5 * diagonalFactor;
        offsetsRef.current.layer5.y = panAmount * parallaxMultipliers.layer5 * diagonalFactor;
        offsetsRef.current.layer4.x = -panAmount * parallaxMultipliers.layer4 * diagonalFactor;
        offsetsRef.current.layer4.y = panAmount * parallaxMultipliers.layer4 * diagonalFactor;
        offsetsRef.current.layer3.x = -panAmount * parallaxMultipliers.layer3 * diagonalFactor;
        offsetsRef.current.layer3.y = panAmount * parallaxMultipliers.layer3 * diagonalFactor;
        offsetsRef.current.layer2.x = -panAmount * parallaxMultipliers.layer2 * diagonalFactor;
        offsetsRef.current.layer2.y = panAmount * parallaxMultipliers.layer2 * diagonalFactor;
        offsetsRef.current.layer1.x = -panAmount * parallaxMultipliers.layer1 * diagonalFactor;
        offsetsRef.current.layer1.y = panAmount * parallaxMultipliers.layer1 * diagonalFactor;
      } else if (motionType === 'pan_diagonal_down_right') {
        // Pan diagonal down-right with constant zoom
        const panAmount = easedProgress * speed * 250;
        const diagonalFactor = 0.707;
        
        // Constant zoom effect
        offsetsRef.current.background.scale = 1.0 + (ampFactor * 0.5);
        offsetsRef.current.layer12.scale = 1.0 + (ampFactor * 0.5 * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = 1.0 + (ampFactor * 0.5 * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = 1.0 + (ampFactor * 0.5 * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = 1.0 + (ampFactor * 0.5 * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = 1.0 + (ampFactor * 0.5 * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = 1.0 + (ampFactor * 0.5 * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = 1.0 + (ampFactor * 0.5 * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (ampFactor * 0.5 * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (ampFactor * 0.5 * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (ampFactor * 0.5 * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (ampFactor * 0.5 * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (ampFactor * 0.5 * 1.0 * parallaxMultipliers.layer1);
        
        // Pan diagonal down-right with parallax
        offsetsRef.current.background.x = panAmount * 1.5 * diagonalFactor;
        offsetsRef.current.background.y = panAmount * 1.5 * diagonalFactor;
        offsetsRef.current.layer12.x = panAmount * parallaxMultipliers.layer12 * diagonalFactor;
        offsetsRef.current.layer12.y = panAmount * parallaxMultipliers.layer12 * diagonalFactor;
        offsetsRef.current.layer11.x = panAmount * parallaxMultipliers.layer11 * diagonalFactor;
        offsetsRef.current.layer11.y = panAmount * parallaxMultipliers.layer11 * diagonalFactor;
        offsetsRef.current.layer10.x = panAmount * parallaxMultipliers.layer10 * diagonalFactor;
        offsetsRef.current.layer10.y = panAmount * parallaxMultipliers.layer10 * diagonalFactor;
        offsetsRef.current.layer9.x = panAmount * parallaxMultipliers.layer9 * diagonalFactor;
        offsetsRef.current.layer9.y = panAmount * parallaxMultipliers.layer9 * diagonalFactor;
        offsetsRef.current.layer8.x = panAmount * parallaxMultipliers.layer8 * diagonalFactor;
        offsetsRef.current.layer8.y = panAmount * parallaxMultipliers.layer8 * diagonalFactor;
        offsetsRef.current.layer7.x = panAmount * parallaxMultipliers.layer7 * diagonalFactor;
        offsetsRef.current.layer7.y = panAmount * parallaxMultipliers.layer7 * diagonalFactor;
        offsetsRef.current.layer6.x = panAmount * parallaxMultipliers.layer6 * diagonalFactor;
        offsetsRef.current.layer6.y = panAmount * parallaxMultipliers.layer6 * diagonalFactor;
        offsetsRef.current.layer5.x = panAmount * parallaxMultipliers.layer5 * diagonalFactor;
        offsetsRef.current.layer5.y = panAmount * parallaxMultipliers.layer5 * diagonalFactor;
        offsetsRef.current.layer4.x = panAmount * parallaxMultipliers.layer4 * diagonalFactor;
        offsetsRef.current.layer4.y = panAmount * parallaxMultipliers.layer4 * diagonalFactor;
        offsetsRef.current.layer3.x = panAmount * parallaxMultipliers.layer3 * diagonalFactor;
        offsetsRef.current.layer3.y = panAmount * parallaxMultipliers.layer3 * diagonalFactor;
        offsetsRef.current.layer2.x = panAmount * parallaxMultipliers.layer2 * diagonalFactor;
        offsetsRef.current.layer2.y = panAmount * parallaxMultipliers.layer2 * diagonalFactor;
        offsetsRef.current.layer1.x = panAmount * parallaxMultipliers.layer1 * diagonalFactor;
        offsetsRef.current.layer1.y = panAmount * parallaxMultipliers.layer1 * diagonalFactor;
      } else if (motionType.startsWith('zoom_in_pan_diagonal_')) {
        // Combined zoom in + diagonal pan
        const panAmount = easedProgress * speed * 250;
        const diagonalFactor = 0.707;
        
        // Progressive zoom with eased progression
        offsetsRef.current.background.scale = 1.0 + (easedProgress * ampFactor);
        offsetsRef.current.layer12.scale = 1.0 + (easedProgress * ampFactor * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = 1.0 + (easedProgress * ampFactor * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = 1.0 + (easedProgress * ampFactor * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = 1.0 + (easedProgress * ampFactor * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = 1.0 + (easedProgress * ampFactor * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = 1.0 + (easedProgress * ampFactor * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = 1.0 + (easedProgress * ampFactor * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (easedProgress * ampFactor * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (easedProgress * ampFactor * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (easedProgress * ampFactor * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (easedProgress * ampFactor * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (easedProgress * ampFactor * 1.0 * parallaxMultipliers.layer1);
        
        // Determine direction
        const xDir = motionType.includes('left') ? -1 : 1;
        const yDir = motionType.includes('up') ? -1 : 1;
        
        // Pan diagonal with parallax
        offsetsRef.current.background.x = xDir * panAmount * 1.5 * diagonalFactor;
        offsetsRef.current.background.y = yDir * panAmount * 1.5 * diagonalFactor;
        offsetsRef.current.layer12.x = xDir * panAmount * parallaxMultipliers.layer12 * diagonalFactor;
        offsetsRef.current.layer12.y = yDir * panAmount * parallaxMultipliers.layer12 * diagonalFactor;
        offsetsRef.current.layer11.x = xDir * panAmount * parallaxMultipliers.layer11 * diagonalFactor;
        offsetsRef.current.layer11.y = yDir * panAmount * parallaxMultipliers.layer11 * diagonalFactor;
        offsetsRef.current.layer10.x = xDir * panAmount * parallaxMultipliers.layer10 * diagonalFactor;
        offsetsRef.current.layer10.y = yDir * panAmount * parallaxMultipliers.layer10 * diagonalFactor;
        offsetsRef.current.layer9.x = xDir * panAmount * parallaxMultipliers.layer9 * diagonalFactor;
        offsetsRef.current.layer9.y = yDir * panAmount * parallaxMultipliers.layer9 * diagonalFactor;
        offsetsRef.current.layer8.x = xDir * panAmount * parallaxMultipliers.layer8 * diagonalFactor;
        offsetsRef.current.layer8.y = yDir * panAmount * parallaxMultipliers.layer8 * diagonalFactor;
        offsetsRef.current.layer7.x = xDir * panAmount * parallaxMultipliers.layer7 * diagonalFactor;
        offsetsRef.current.layer7.y = yDir * panAmount * parallaxMultipliers.layer7 * diagonalFactor;
        offsetsRef.current.layer6.x = xDir * panAmount * parallaxMultipliers.layer6 * diagonalFactor;
        offsetsRef.current.layer6.y = yDir * panAmount * parallaxMultipliers.layer6 * diagonalFactor;
        offsetsRef.current.layer5.x = xDir * panAmount * parallaxMultipliers.layer5 * diagonalFactor;
        offsetsRef.current.layer5.y = yDir * panAmount * parallaxMultipliers.layer5 * diagonalFactor;
        offsetsRef.current.layer4.x = xDir * panAmount * parallaxMultipliers.layer4 * diagonalFactor;
        offsetsRef.current.layer4.y = yDir * panAmount * parallaxMultipliers.layer4 * diagonalFactor;
        offsetsRef.current.layer3.x = xDir * panAmount * parallaxMultipliers.layer3 * diagonalFactor;
        offsetsRef.current.layer3.y = yDir * panAmount * parallaxMultipliers.layer3 * diagonalFactor;
        offsetsRef.current.layer2.x = xDir * panAmount * parallaxMultipliers.layer2 * diagonalFactor;
        offsetsRef.current.layer2.y = yDir * panAmount * parallaxMultipliers.layer2 * diagonalFactor;
        offsetsRef.current.layer1.x = xDir * panAmount * parallaxMultipliers.layer1 * diagonalFactor;
        offsetsRef.current.layer1.y = yDir * panAmount * parallaxMultipliers.layer1 * diagonalFactor;
      } else if (motionType.startsWith('zoom_out_pan_diagonal_')) {
        // Combined zoom out + diagonal pan
        const panAmount = easedProgress * speed * 250;
        const diagonalFactor = 0.707;
        
        // Progressive zoom out from max to 1.0 with eased progression
        offsetsRef.current.background.scale = (1.0 + ampFactor) - (easedProgress * ampFactor);
        offsetsRef.current.layer12.scale = (1.0 + ampFactor * 0.15 * parallaxMultipliers.layer12) - (easedProgress * ampFactor * 0.15 * parallaxMultipliers.layer12);
        offsetsRef.current.layer11.scale = (1.0 + ampFactor * 0.2 * parallaxMultipliers.layer11) - (easedProgress * ampFactor * 0.2 * parallaxMultipliers.layer11);
        offsetsRef.current.layer10.scale = (1.0 + ampFactor * 0.25 * parallaxMultipliers.layer10) - (easedProgress * ampFactor * 0.25 * parallaxMultipliers.layer10);
        offsetsRef.current.layer9.scale = (1.0 + ampFactor * 0.3 * parallaxMultipliers.layer9) - (easedProgress * ampFactor * 0.3 * parallaxMultipliers.layer9);
        offsetsRef.current.layer8.scale = (1.0 + ampFactor * 0.35 * parallaxMultipliers.layer8) - (easedProgress * ampFactor * 0.35 * parallaxMultipliers.layer8);
        offsetsRef.current.layer7.scale = (1.0 + ampFactor * 0.4 * parallaxMultipliers.layer7) - (easedProgress * ampFactor * 0.4 * parallaxMultipliers.layer7);
        offsetsRef.current.layer6.scale = (1.0 + ampFactor * 0.5 * parallaxMultipliers.layer6) - (easedProgress * ampFactor * 0.5 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = (1.0 + ampFactor * 0.6 * parallaxMultipliers.layer5) - (easedProgress * ampFactor * 0.6 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = (1.0 + ampFactor * 0.7 * parallaxMultipliers.layer4) - (easedProgress * ampFactor * 0.7 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = (1.0 + ampFactor * 0.8 * parallaxMultipliers.layer3) - (easedProgress * ampFactor * 0.8 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = (1.0 + ampFactor * 0.9 * parallaxMultipliers.layer2) - (easedProgress * ampFactor * 0.9 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = (1.0 + ampFactor * 1.0 * parallaxMultipliers.layer1) - (easedProgress * ampFactor * 1.0 * parallaxMultipliers.layer1);
        
        // Determine direction
        const xDir = motionType.includes('left') ? -1 : 1;
        const yDir = motionType.includes('up') ? -1 : 1;
        
        // Pan diagonal with parallax
        offsetsRef.current.background.x = xDir * panAmount * 1.5 * diagonalFactor;
        offsetsRef.current.background.y = yDir * panAmount * 1.5 * diagonalFactor;
        offsetsRef.current.layer12.x = xDir * panAmount * parallaxMultipliers.layer12 * diagonalFactor;
        offsetsRef.current.layer12.y = yDir * panAmount * parallaxMultipliers.layer12 * diagonalFactor;
        offsetsRef.current.layer11.x = xDir * panAmount * parallaxMultipliers.layer11 * diagonalFactor;
        offsetsRef.current.layer11.y = yDir * panAmount * parallaxMultipliers.layer11 * diagonalFactor;
        offsetsRef.current.layer10.x = xDir * panAmount * parallaxMultipliers.layer10 * diagonalFactor;
        offsetsRef.current.layer10.y = yDir * panAmount * parallaxMultipliers.layer10 * diagonalFactor;
        offsetsRef.current.layer9.x = xDir * panAmount * parallaxMultipliers.layer9 * diagonalFactor;
        offsetsRef.current.layer9.y = yDir * panAmount * parallaxMultipliers.layer9 * diagonalFactor;
        offsetsRef.current.layer8.x = xDir * panAmount * parallaxMultipliers.layer8 * diagonalFactor;
        offsetsRef.current.layer8.y = yDir * panAmount * parallaxMultipliers.layer8 * diagonalFactor;
        offsetsRef.current.layer7.x = xDir * panAmount * parallaxMultipliers.layer7 * diagonalFactor;
        offsetsRef.current.layer7.y = yDir * panAmount * parallaxMultipliers.layer7 * diagonalFactor;
        offsetsRef.current.layer6.x = xDir * panAmount * parallaxMultipliers.layer6 * diagonalFactor;
        offsetsRef.current.layer6.y = yDir * panAmount * parallaxMultipliers.layer6 * diagonalFactor;
        offsetsRef.current.layer5.x = xDir * panAmount * parallaxMultipliers.layer5 * diagonalFactor;
        offsetsRef.current.layer5.y = yDir * panAmount * parallaxMultipliers.layer5 * diagonalFactor;
        offsetsRef.current.layer4.x = xDir * panAmount * parallaxMultipliers.layer4 * diagonalFactor;
        offsetsRef.current.layer4.y = yDir * panAmount * parallaxMultipliers.layer4 * diagonalFactor;
        offsetsRef.current.layer3.x = xDir * panAmount * parallaxMultipliers.layer3 * diagonalFactor;
        offsetsRef.current.layer3.y = yDir * panAmount * parallaxMultipliers.layer3 * diagonalFactor;
        offsetsRef.current.layer2.x = xDir * panAmount * parallaxMultipliers.layer2 * diagonalFactor;
        offsetsRef.current.layer2.y = yDir * panAmount * parallaxMultipliers.layer2 * diagonalFactor;
        offsetsRef.current.layer1.x = xDir * panAmount * parallaxMultipliers.layer1 * diagonalFactor;
        offsetsRef.current.layer1.y = yDir * panAmount * parallaxMultipliers.layer1 * diagonalFactor;
      }
      
      // Cache the state
      lastRenderState.current = {
        progress,
        motionType,
        scale1: offsetsRef.current.layer1.scale,
        scale2: offsetsRef.current.layer2.scale,
        scale3: offsetsRef.current.layer3.scale,
        scaleBg: offsetsRef.current.background.scale
      };
    }
    
    // Save context and apply rotation at center
    ctx.save();
    ctx.translate(canvasCenterX, canvasCenterY);
    ctx.rotate(currentRotation);
    ctx.scale(rotationScale, rotationScale);
    ctx.translate(-canvasCenterX, -canvasCenterY);
    
    // Draw background layer (nebula) first - use cached dimensions when possible
    if (backgroundImg) {
      const bgScale = offsetsRef.current.background.scale;
      const bgX = offsetsRef.current.background.x;
      const bgY = offsetsRef.current.background.y;
      
      // Calculate dynamic fade-out timing based on video duration and amplification
      // Goal: Fade ends ~1 second before video end, leaving just stars for the final second
      let bgAlpha = 0.85; // Default background alpha
      let finalBgScale = bgScale; // Final scale with potential acceleration
      
      // Only apply fade-out if enabled in settings
      if (fadeOut) {
        // Helper function to calculate eased progress (matches main easing function)
        const calculateEasedProgress = (ratio: number) => {
          return ratio < 0.5
            ? 4 * ratio * ratio * ratio
            : 1 - Math.pow(-2 * ratio + 2, 3) / 2;
        };
        
        // Calculate the progress at which fade should END (1 second before video ends)
        const fadeEndProgressRatio = Math.max(0, (duration - 1) / duration);
        const fadeEndEasedProgress = calculateEasedProgress(fadeEndProgressRatio);
        const fadeEndScale = 1.0 + (fadeEndEasedProgress * ampFactor);
        
        // Start fade when background reaches 2.0x scale or 70% through the zoom range (whichever comes first)
        const maxScale = 1.0 + ampFactor; // Maximum scale at 100% progress
        const fadeStartScale = Math.min(2.0, 1.0 + ((maxScale - 1.0) * 0.7));
        
        if (bgScale >= fadeStartScale && fadeEndScale > fadeStartScale) {
          // Calculate fade-out: 1.0 at fadeStartScale, 0.0 at fadeEndScale
          const fadeProgress = Math.min((bgScale - fadeStartScale) / (fadeEndScale - fadeStartScale), 1.0);
          bgAlpha = 0.85 * (1.0 - fadeProgress); // Fade from 0.85 to 0
          
          // Accelerate scale during fade-out to make flying-through effect more obvious
          // Scale increases by an additional 30% during the fade phase
          const scaleBoost = 1.0 + (fadeProgress * 0.3);
          finalBgScale = bgScale * scaleBoost;
        }
      }
      
      const scaledWidth = cachedDimensions.current.bgScaledWidth * finalBgScale;
      const scaledHeight = cachedDimensions.current.bgScaledHeight * finalBgScale;
      const drawX = (canvas.width - scaledWidth) * 0.5 + bgX;
      const drawY = (canvas.height - scaledHeight) * 0.5 + bgY;
      
      ctx.globalAlpha = bgAlpha;
      ctx.globalCompositeOperation = 'source-over';
      
      // Apply hyperspeed whirlpool distortion to background
      if (hyperspeed && blurAmount > 0) {
        // Calculate fade in/out based on animation progress (35% fade in, 50% full, 15% fade out)
        const fadeInEnd = 0.35;
        const fadeOutStart = 0.85;
        let fadeFactor = 1.0;
        
        if (progressRatio < fadeInEnd) {
          // Gradual fade in during first 35% with ease-in curve for smooth nebula breakup
          const linearFade = progressRatio / fadeInEnd;
          fadeFactor = Math.pow(linearFade, 1.5); // Ease-in curve for smoother start
        } else if (progressRatio > fadeOutStart) {
          // Fade out during last 15%
          fadeFactor = (1.0 - progressRatio) / (1.0 - fadeOutStart);
        }
        
        // Only apply whirlpool effect if fadeFactor is significant
        // This ensures nebula remains perfectly original at start and end
        if (fadeFactor > 0.01) {
          // Pulsing intensity - oscillates using sine wave with dramatic range
          const pulseFrequency = 0.002; // Speed of the pulse
          const pulsePhase = Date.now() * pulseFrequency;
          const pulseModulation = 0.5 + Math.sin(pulsePhase) * 0.5; // Oscillates between 0.0 and 1.0 - more dramatic
          
          const baseTwistIntensity = blurAmount / 3; // 0 to 2
          const twistIntensity = baseTwistIntensity * pulseModulation * fadeFactor;
          
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
          
          // Draw image to temporary canvas for pixel manipulation
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
          if (tempCtx) {
            tempCtx.drawImage(backgroundImg, drawX, drawY, scaledWidth, scaledHeight);
            
            // Apply whirlpool distortion by redrawing in a spiral pattern with smooth interpolation
            ctx.save();
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            const segments = 64; // Higher resolution for smoother edges
            const rings = 48; // Higher resolution for smoother edges
            
            for (let ring = 0; ring < rings; ring++) {
              const radiusRatio = ring / rings;
              const radius = radiusRatio * maxRadius;
              
              for (let seg = 0; seg < segments; seg++) {
                const angle = (seg / segments) * Math.PI * 2;
                
                // Calculate twist amount based on distance from center (more twist toward edges)
                const distortionAngle = twistIntensity * radiusRatio * radiusRatio * 0.8; // Quadratic falloff
                
                // Source coordinates (untwisted)
                const srcAngle = angle;
                const srcX = centerX + Math.cos(srcAngle) * radius;
                const srcY = centerY + Math.sin(srcAngle) * radius;
                
                // Destination coordinates (twisted)
                const dstAngle = angle + distortionAngle;
                const dstX = centerX + Math.cos(dstAngle) * radius;
                const dstY = centerY + Math.sin(dstAngle) * radius;
                
                // Draw with optimal overlap for ultra-smooth blending while preserving brightness
                const segmentSize = Math.max(3, maxRadius / rings * 2.0);
                const segmentAlpha = 0.12; // Optimized for smooth blending with higher segment count
                
                ctx.save();
                ctx.globalAlpha = segmentAlpha;
                ctx.translate(dstX, dstY);
                ctx.rotate(dstAngle - srcAngle);
                ctx.drawImage(
                  tempCanvas,
                  srcX - segmentSize/2, srcY - segmentSize/2, segmentSize, segmentSize,
                  -segmentSize/2, -segmentSize/2, segmentSize, segmentSize
                );
                ctx.restore();
              }
            }
            ctx.restore();
          }
        } else {
          // At start/end of animation, draw nebula completely original
          ctx.drawImage(backgroundImg, drawX, drawY, scaledWidth, scaledHeight);
        }
      } else {
        ctx.drawImage(backgroundImg, drawX, drawY, scaledWidth, scaledHeight);
      }
    }
    
    // Draw twelve star layers with 3D parallax (back to front) and intelligent blending
    // Layers 12-7 use screen blend, layers 6-1 use screen + lighter blend for enhanced glow
    const hasAnyLayers = starLayers.layer1 || starLayers.layer2 || starLayers.layer3 || 
                        starLayers.layer4 || starLayers.layer5 || starLayers.layer6 ||
                        starLayers.layer7 || starLayers.layer8 || starLayers.layer9 ||
                        starLayers.layer10 || starLayers.layer11 || starLayers.layer12;
    
    if (hasAnyLayers) {
      // Helper function to draw star layers with chromatic aberration for hyperspeed
      const drawLayerWithEffects = (
        layer: ImageBitmap | null, 
        offset: {x: number, y: number, scale: number},
        cachedScaledWidth: number,
        cachedScaledHeight: number,
        opacity: number,
        compositeOp: GlobalCompositeOperation
      ) => {
        if (!layer) return;
        
        const scale = offset.scale;
        const scaledWidth = cachedScaledWidth * scale;
        const scaledHeight = cachedScaledHeight * scale;
        const drawX = (canvas.width - scaledWidth) * 0.5 + offset.x;
        const drawY = (canvas.height - scaledHeight) * 0.5 + offset.y;
        
        if (hyperspeed && blurAmount > 0) {
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const layerCenterX = drawX + scaledWidth / 2;
          const layerCenterY = drawY + scaledHeight / 2;
          const dx = layerCenterX - centerX;
          const dy = layerCenterY - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
          const normalizedDist = distance / maxDist;
          
          // Star trailing: draw multiple stretched copies radiating from center
          // Pulsing intensity - oscillates using sine wave (same as whirlpool)
          const pulseFrequency = 0.002;
          const pulsePhase = Date.now() * pulseFrequency;
          const pulseModulation = 0.5 + Math.sin(pulsePhase) * 0.5; // Oscillates between 0.0 and 1.0 - more dramatic
          
          // Calculate fade in/out based on animation progress (same as whirlpool)
          const fadeInEnd = 0.35;
          const fadeOutStart = 0.85;
          let fadeFactor = 1.0;
          
          if (progressRatio < fadeInEnd) {
            const linearFade = progressRatio / fadeInEnd;
            fadeFactor = Math.pow(linearFade, 1.5); // Ease-in curve for smoother start
          } else if (progressRatio > fadeOutStart) {
            fadeFactor = (1.0 - progressRatio) / (1.0 - fadeOutStart);
          }
          
          // Only apply star trailing effects if fadeFactor is significant
          // This ensures stars remain perfectly original at start and end
          if (fadeFactor > 0.01) {
            const baseTrailIntensity = blurAmount / 6; // 0 to 1
            const trailIntensity = baseTrailIntensity * pulseModulation * fadeFactor;
            
            const angle = Math.atan2(dy, dx);
            const trailSteps = 6;
            const trailLength = trailIntensity * 80 * normalizedDist;
            
            for (let i = 0; i < trailSteps; i++) {
              const t = i / trailSteps;
              const trailX = drawX - Math.cos(angle) * trailLength * t;
              const trailY = drawY - Math.sin(angle) * trailLength * t;
              const trailAlpha = opacity * trailIntensity * 0.4 * (1 - t * 0.8);
              
              ctx.save();
              ctx.globalCompositeOperation = compositeOp;
              ctx.globalAlpha = trailAlpha;
              ctx.filter = 'none';
              ctx.drawImage(layer, trailX, trailY, scaledWidth, scaledHeight);
              ctx.restore();
            }
            
            // Chromatic aberration: shift red and blue channels
            const aberrationAmount = (blurAmount / 6) * 5 * normalizedDist;
            
            // Red shift (away from center - Doppler red shift)
            ctx.save();
            ctx.globalCompositeOperation = compositeOp;
            ctx.globalAlpha = opacity * 0.35;
            ctx.filter = 'sepia(100%) saturate(300%) hue-rotate(-10deg)';
            const redX = drawX + Math.cos(angle) * aberrationAmount;
            const redY = drawY + Math.sin(angle) * aberrationAmount;
            ctx.drawImage(layer, redX, redY, scaledWidth, scaledHeight);
            ctx.restore();
            
            // Blue shift (toward center - Doppler blue shift)
            ctx.save();
            ctx.globalCompositeOperation = compositeOp;
            ctx.globalAlpha = opacity * 0.35;
            ctx.filter = 'sepia(100%) saturate(300%) hue-rotate(180deg)';
            const blueX = drawX - Math.cos(angle) * aberrationAmount;
            const blueY = drawY - Math.sin(angle) * aberrationAmount;
            ctx.drawImage(layer, blueX, blueY, scaledWidth, scaledHeight);
            ctx.restore();
            
            // Main layer (normal position, brighter)
            ctx.globalCompositeOperation = compositeOp;
            ctx.globalAlpha = opacity * 0.8;
            ctx.filter = 'none';
            ctx.drawImage(layer, drawX, drawY, scaledWidth, scaledHeight);
          } else {
            // At start/end of animation, draw stars completely original
            ctx.globalCompositeOperation = compositeOp;
            ctx.globalAlpha = opacity;
            ctx.filter = 'none';
            ctx.drawImage(layer, drawX, drawY, scaledWidth, scaledHeight);
          }
        } else {
          // Normal rendering without effects
          ctx.globalCompositeOperation = compositeOp;
          ctx.globalAlpha = opacity;
          ctx.filter = 'none';
          ctx.drawImage(layer, drawX, drawY, scaledWidth, scaledHeight);
        }
      };
      
      // Layer 12: Smallest/dimmest stars (farthest, slowest movement)
      drawLayerWithEffects(starLayers.layer12, offsetsRef.current.layer12, 
        cachedDimensions.current.layer12ScaledWidth, cachedDimensions.current.layer12ScaledHeight, 
        0.85, 'screen');
      
      // Layer 11
      drawLayerWithEffects(starLayers.layer11, offsetsRef.current.layer11,
        cachedDimensions.current.layer11ScaledWidth, cachedDimensions.current.layer11ScaledHeight,
        0.87, 'screen');
      
      // Layer 10
      drawLayerWithEffects(starLayers.layer10, offsetsRef.current.layer10,
        cachedDimensions.current.layer10ScaledWidth, cachedDimensions.current.layer10ScaledHeight,
        0.89, 'screen');
      
      // Layer 9
      drawLayerWithEffects(starLayers.layer9, offsetsRef.current.layer9,
        cachedDimensions.current.layer9ScaledWidth, cachedDimensions.current.layer9ScaledHeight,
        0.91, 'screen');
      
      // Layer 8
      drawLayerWithEffects(starLayers.layer8, offsetsRef.current.layer8,
        cachedDimensions.current.layer8ScaledWidth, cachedDimensions.current.layer8ScaledHeight,
        0.93, 'screen');
      
      // Layer 7
      drawLayerWithEffects(starLayers.layer7, offsetsRef.current.layer7,
        cachedDimensions.current.layer7ScaledWidth, cachedDimensions.current.layer7ScaledHeight,
        0.95, 'screen');
      
      // Layer 6
      drawLayerWithEffects(starLayers.layer6, offsetsRef.current.layer6,
        cachedDimensions.current.layer6ScaledWidth, cachedDimensions.current.layer6ScaledHeight,
        0.97, 'screen');
      
      // Layer 5
      drawLayerWithEffects(starLayers.layer5, offsetsRef.current.layer5,
        cachedDimensions.current.layer5ScaledWidth, cachedDimensions.current.layer5ScaledHeight,
        0.95, 'screen');
      
      // Layer 4
      drawLayerWithEffects(starLayers.layer4, offsetsRef.current.layer4,
        cachedDimensions.current.layer4ScaledWidth, cachedDimensions.current.layer4ScaledHeight,
        1.0, 'screen');
      
      // Layer 3: Start using lighter blend for brighter stars
      drawLayerWithEffects(starLayers.layer3, offsetsRef.current.layer3,
        cachedDimensions.current.layer3ScaledWidth, cachedDimensions.current.layer3ScaledHeight,
        1.0, 'lighter');
      
      // Layer 2: Brighter stars with enhanced glow
      drawLayerWithEffects(starLayers.layer2, offsetsRef.current.layer2,
        cachedDimensions.current.layer2ScaledWidth, cachedDimensions.current.layer2ScaledHeight,
        1.0, 'lighter');
      
      // Layer 1: Largest/brightest stars (closest, fastest movement)
      drawLayerWithEffects(starLayers.layer1, offsetsRef.current.layer1,
        cachedDimensions.current.layer1ScaledWidth, cachedDimensions.current.layer1ScaledHeight,
        1.0, 'lighter');
    }
    
    // Restore rotation transform
    ctx.restore();
    
    // Apply hyperspeed vignette effect
    if (hyperspeed && blurAmount > 0) {
      const vignetteIntensity = blurAmount / 6; // 0 to 1 based on blur curve
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
      
      // Create radial gradient for vignette
      const gradient = ctx.createRadialGradient(
        centerX, centerY, maxRadius * 0.3,
        centerX, centerY, maxRadius
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(0.7, `rgba(0, 0, 0, ${vignetteIntensity * 0.3})`);
      gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteIntensity * 0.7})`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Update hyperspeed blur effect during animation
    if (hyperspeed) {
      const normalizedProgress = progress / 100;
      const blurCurve = Math.sin(normalizedProgress * Math.PI);
      const maxBlur = 6;
      const currentBlur = blurCurve * maxBlur;
      setBlurAmount(currentBlur);
    }
    
    
    // Continue animation loop (unless in video rendering mode where we control it manually)
    if (!videoProgressRef) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isAnimating, settings, backgroundImg, starLayers, onProgressUpdate, onAnimationComplete, controlledProgress, videoProgressRef, depthIntensity]);

  // Trigger frame rendering when frameRenderTrigger changes (for video generation)
  // Reset progress when external progress is set to 0 (replay triggered)
  useEffect(() => {
    if (externalProgress === 0 && currentProgressRef.current > 0) {
      currentProgressRef.current = 0;
      animationStartTimeRef.current = 0;
      pausedTimeRef.current = 0;
      offsetsRef.current = { 
        layer1: { x: 0, y: 0, scale: 1 },
        layer2: { x: 0, y: 0, scale: 1 },
        layer3: { x: 0, y: 0, scale: 1 },
        layer4: { x: 0, y: 0, scale: 1 },
        layer5: { x: 0, y: 0, scale: 1 },
        layer6: { x: 0, y: 0, scale: 1 },
        layer7: { x: 0, y: 0, scale: 1 },
        layer8: { x: 0, y: 0, scale: 1 },
        layer9: { x: 0, y: 0, scale: 1 },
        layer10: { x: 0, y: 0, scale: 1 },
        layer11: { x: 0, y: 0, scale: 1 },
        layer12: { x: 0, y: 0, scale: 1 },
        background: { x: 0, y: 0, scale: 1 }
      };
      lastRenderState.current = null;
    }
  }, [externalProgress]);

  useEffect(() => {
    if (frameRenderTrigger !== undefined && frameRenderTrigger > 0 && videoProgressRef && canvasRef.current) {
      // In video rendering mode, manually trigger animate for each frame
      animate();
    }
  }, [frameRenderTrigger, videoProgressRef, animate]);

  useEffect(() => {
    console.log('🎮 [StarField3D] Animation state changed:', {
      isAnimating,
      hasVideoProgressRef: !!videoProgressRef,
      currentProgress: currentProgressRef.current
    });
    
    if (isAnimating && !videoProgressRef) {
      // Reset start time to trigger recalculation
      animationStartTimeRef.current = 0;
      lastProgressUpdateRef.current = 0;
      
      // If at end, reset progress to 0
      if (currentProgressRef.current >= 99.9) {
        console.log('🔄 [StarField3D] Resetting animation to beginning');
        currentProgressRef.current = 0;
        hasRenderedInitialFrame.current = false;
        offsetsRef.current = { 
          layer1: { x: 0, y: 0, scale: 1 },
          layer2: { x: 0, y: 0, scale: 1 },
          layer3: { x: 0, y: 0, scale: 1 },
          layer4: { x: 0, y: 0, scale: 1 },
          layer5: { x: 0, y: 0, scale: 1 },
          layer6: { x: 0, y: 0, scale: 1 },
          layer7: { x: 0, y: 0, scale: 1 },
          layer8: { x: 0, y: 0, scale: 1 },
          layer9: { x: 0, y: 0, scale: 1 },
          layer10: { x: 0, y: 0, scale: 1 },
          layer11: { x: 0, y: 0, scale: 1 },
          layer12: { x: 0, y: 0, scale: 1 },
          background: { x: 0, y: 0, scale: 1 }
        };
        lastRenderState.current = null;
        cachedDimensions.current = null;
        
        if (onProgressUpdate) {
          onProgressUpdate(0);
        }
      }
      
      // Clear cached context
      canvasCtxRef.current = null;
      
      console.log('▶️ [StarField3D] Starting animation loop');
      // Start animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Paused - stop animation loop
      if (animationFrameRef.current) {
        console.log('⏸️ [StarField3D] Pausing animation loop');
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [isAnimating, animate, onProgressUpdate, videoProgressRef]);
  
  // Update blur amount when hyperspeed setting changes
  useEffect(() => {
    if (settings.hyperspeed) {
      // Calculate blur based on current progress
      const progress = currentProgressRef.current;
      const normalizedProgress = progress / 100;
      const blurCurve = Math.sin(normalizedProgress * Math.PI);
      const maxBlur = 6;
      const currentBlur = blurCurve * maxBlur;
      setBlurAmount(currentBlur);
    } else {
      setBlurAmount(0);
    }
  }, [settings.hyperspeed]);
  
  // Cleanup ImageBitmaps when new layers are created or on unmount
  useEffect(() => {
    // Cleanup old bitmaps before new ones are set
    return () => {
      if (starLayers.layer1) starLayers.layer1.close();
      if (starLayers.layer2) starLayers.layer2.close();
      if (starLayers.layer3) starLayers.layer3.close();
      if (starLayers.layer4) starLayers.layer4.close();
      if (starLayers.layer5) starLayers.layer5.close();
      if (starLayers.layer6) starLayers.layer6.close();
      if (starLayers.layer7) starLayers.layer7.close();
      if (starLayers.layer8) starLayers.layer8.close();
      if (starLayers.layer9) starLayers.layer9.close();
      if (starLayers.layer10) starLayers.layer10.close();
      if (starLayers.layer11) starLayers.layer11.close();
      if (starLayers.layer12) starLayers.layer12.close();
    };
  }, [starLayers.layer1, starLayers.layer2, starLayers.layer3, starLayers.layer4, starLayers.layer5, starLayers.layer6,
      starLayers.layer7, starLayers.layer8, starLayers.layer9, starLayers.layer10, starLayers.layer11, starLayers.layer12]);
  
  // Cleanup background image when changed or on unmount
  useEffect(() => {
    return () => {
      if (backgroundImg) backgroundImg.close();
    };
  }, [backgroundImg]);

  // Notify parent when canvas and layers are ready AND render initial frame
  useEffect(() => {
    const hasAllLayers = starLayers.layer1 && starLayers.layer2 && starLayers.layer3 && 
                         starLayers.layer4 && starLayers.layer5 && starLayers.layer6 &&
                         starLayers.layer7 && starLayers.layer8 && starLayers.layer9 &&
                         starLayers.layer10 && starLayers.layer11 && starLayers.layer12;
    const hasBackground = backgroundImg !== null;
    const hasCanvas = canvasRef.current !== null;
    
    console.log('🔍 [StarField3D] Ready check:', {
      hasAllLayers,
      hasBackground,
      hasCanvas,
      hasRenderedInitial: hasRenderedInitialFrame.current
    });
    
    if (hasCanvas && hasAllLayers && hasBackground) {
      console.log('✅ [StarField3D] All assets ready - notifying parent and rendering initial frame');
      
      // Notify parent
      if (onCanvasReady && canvasRef.current) {
        onCanvasReady(canvasRef.current);
      }
      
      // Render initial frame if not rendered yet and not animating
      if (!hasRenderedInitialFrame.current && !isAnimating) {
        console.log('🎬 [StarField3D] Rendering initial static frame');
        // Reset progress to 0 for initial frame
        currentProgressRef.current = 0;
        // Render the first frame
        setTimeout(() => {
          animate();
        }, 100);
      }
    }
  }, [starLayers, backgroundImg, isAnimating, onCanvasReady, animate]);

  if (stars.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cosmic-950 rounded-b-lg">
        <p className="text-cosmic-400">
          Upload both images and process to generate 3D star field
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black rounded-b-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        width={imageDimensions.width}
        height={imageDimensions.height}
        className="w-full h-full object-contain bg-black"
        style={{ 
          willChange: isAnimating ? 'contents' : 'auto',
          filter: blurAmount > 0 ? `blur(${blurAmount * 0.5}px)` : 'none',
          transition: 'filter 0.05s linear'
        }}
      />
      
      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-sm">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-300 text-sm font-medium">Recording</span>
        </div>
      )}
    </div>
  );
};

export default StarField3D;
