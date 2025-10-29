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
  starShiftAmount = 6
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number>();
  const animationStartTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const lastProgressUpdateRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0); // Track current progress for resume
  const hasRenderedInitialFrame = useRef<boolean>(false); // Track if initial frame was rendered
  const offsetsRef = useRef({
    layer1: { x: 0, y: 0, scale: 1 }, // Largest/brightest stars (closest)
    layer2: { x: 0, y: 0, scale: 1 },
    layer3: { x: 0, y: 0, scale: 1 },
    layer4: { x: 0, y: 0, scale: 1 },
    layer5: { x: 0, y: 0, scale: 1 },
    layer6: { x: 0, y: 0, scale: 1 }, // Smallest stars (farthest)
    background: { x: 0, y: 0, scale: 1 } // Nebula background
  });
  
  const [starLayers, setStarLayers] = useState<{
    layer1: ImageBitmap | null;
    layer2: ImageBitmap | null;
    layer3: ImageBitmap | null;
    layer4: ImageBitmap | null;
    layer5: ImageBitmap | null;
    layer6: ImageBitmap | null;
  }>({ layer1: null, layer2: null, layer3: null, layer4: null, layer5: null, layer6: null });
  
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
      setImageDimensions({ width: img.width, height: img.height });
      
      console.log('Detecting complete stars with cores and spikes...');
      const startTime = performance.now();
      
      // Draw image to canvas
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d', { 
        willReadFrequently: true,
        alpha: false 
      })!;
      tempCtx.drawImage(img, 0, 0);
      
      const sourceData = tempCtx.getImageData(0, 0, img.width, img.height);
      const data = sourceData.data;
      
      // Pre-calculate luminance for all pixels using Uint8Array for faster access
      const width = img.width;
      const height = img.height;
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
      
      // Detect complete star regions with improved edge handling
      const visited = new Uint8Array(pixelCount);
      const starRegions: {
        pixels: Uint32Array;
        pixelCount: number;
        maxLuminance: number;
        centerX: number;
        centerY: number;
        size: number;
      }[] = [];
      
      // Higher threshold to avoid picking up noise and rough edges
      const threshold = 50; // Increased from 30 to avoid dim edge pixels
      const lowThreshold = 25; // Increased from 15 to get cleaner edges
      
      // Reusable queue with pre-allocated capacity to avoid array resizing
      const maxQueueSize = 5000;
      const queueX = new Uint16Array(maxQueueSize);
      const queueY = new Uint16Array(maxQueueSize);
      const pixelBuffer = new Uint32Array(maxQueueSize);
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          if (visited[idx]) continue;
          
          const luminance = luminanceCache[idx];
          
          if (luminance > threshold) {
            // Found a star pixel - grow the complete star region using optimized flood fill
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
                if (!visited[nIdx] && luminanceCache[nIdx] > lowThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx1;
                  queueY[queueEnd] = ny1;
                  queueEnd++;
                }
              }
              // Top
              if (ny1 >= 0) {
                const nIdx = ny1 * width + nx2;
                if (!visited[nIdx] && luminanceCache[nIdx] > lowThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx2;
                  queueY[queueEnd] = ny1;
                  queueEnd++;
                }
              }
              // Top-right
              if (nx3 < width && ny1 >= 0) {
                const nIdx = ny1 * width + nx3;
                if (!visited[nIdx] && luminanceCache[nIdx] > lowThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx3;
                  queueY[queueEnd] = ny1;
                  queueEnd++;
                }
              }
              // Left
              if (nx1 >= 0) {
                const nIdx = ny2 * width + nx1;
                if (!visited[nIdx] && luminanceCache[nIdx] > lowThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx1;
                  queueY[queueEnd] = ny2;
                  queueEnd++;
                }
              }
              // Right
              if (nx3 < width) {
                const nIdx = ny2 * width + nx3;
                if (!visited[nIdx] && luminanceCache[nIdx] > lowThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx3;
                  queueY[queueEnd] = ny2;
                  queueEnd++;
                }
              }
              // Bottom-left
              if (nx1 >= 0 && ny3 < height) {
                const nIdx = ny3 * width + nx1;
                if (!visited[nIdx] && luminanceCache[nIdx] > lowThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx1;
                  queueY[queueEnd] = ny3;
                  queueEnd++;
                }
              }
              // Bottom
              if (ny3 < height) {
                const nIdx = ny3 * width + nx2;
                if (!visited[nIdx] && luminanceCache[nIdx] > lowThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx2;
                  queueY[queueEnd] = ny3;
                  queueEnd++;
                }
              }
              // Bottom-right
              if (nx3 < width && ny3 < height) {
                const nIdx = ny3 * width + nx3;
                if (!visited[nIdx] && luminanceCache[nIdx] > lowThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx3;
                  queueY[queueEnd] = ny3;
                  queueEnd++;
                }
              }
            }
            
            // Only keep significant star regions
            if (pixelCount >= 5 && pixelCount <= maxQueueSize) {
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
      
      // Sort stars by size to determine layer distribution across 6 layers
      starRegions.sort((a, b) => b.size - a.size);
      
      // Distribute stars into 6 layers for smoother parallax depth
      const layer1Threshold = starRegions[Math.floor(starRegions.length * 0.167)]?.size || 25; // Top 16.7% - largest
      const layer2Threshold = starRegions[Math.floor(starRegions.length * 0.333)]?.size || 18;
      const layer3Threshold = starRegions[Math.floor(starRegions.length * 0.500)]?.size || 12;
      const layer4Threshold = starRegions[Math.floor(starRegions.length * 0.667)]?.size || 8;
      const layer5Threshold = starRegions[Math.floor(starRegions.length * 0.833)]?.size || 5; // Bottom 16.7% - smallest
      
      console.log(`6-layer size thresholds: L1=${layer1Threshold}, L2=${layer2Threshold}, L3=${layer3Threshold}, L4=${layer4Threshold}, L5=${layer5Threshold}`);
      
      // Create six separate canvases for depth layers
      const canvases = Array(6).fill(null).map(() => {
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
      const layerCounts = [0, 0, 0, 0, 0, 0];
      
      // Batch size for processing - process stars in batches to reduce overhead
      const BATCH_SIZE = 1024;
      let starsProcessed = 0;
      
      // Assign each complete star to one layer based on its size with batched processing
      for (let batchStart = 0; batchStart < starRegions.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, starRegions.length);
        
        for (let starIdx = batchStart; starIdx < batchEnd; starIdx++) {
          const star = starRegions[starIdx];
          let layerIndex: number;
          
          // Distribute stars into 6 layers based on size
          if (star.size >= layer1Threshold) {
            layerIndex = 0; // Layer 1 - largest/brightest
          } else if (star.size >= layer2Threshold) {
            layerIndex = 1; // Layer 2
          } else if (star.size >= layer3Threshold) {
            layerIndex = 2; // Layer 3
          } else if (star.size >= layer4Threshold) {
            layerIndex = 3; // Layer 4
          } else if (star.size >= layer5Threshold) {
            layerIndex = 4; // Layer 5
          } else {
            layerIndex = 5; // Layer 6 - smallest/dimmest
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
      
      console.log('Applying advanced feathering to create smooth star edges...');
      
      // Apply intelligent feathering to each canvas to smooth edges naturally
      canvases.forEach((canvas, layerIdx) => {
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        
        // Create alpha mask for smoothing
        const alphaMap = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
          alphaMap[i] = data[i * 4 + 3];
        }
        
        // Apply multi-pass smoothing to alpha channel to eliminate rough edges
        for (let pass = 0; pass < 2; pass++) {
          const tempAlpha = new Uint8Array(alphaMap);
          
          for (let y = 2; y < height - 2; y++) {
            for (let x = 2; x < width - 2; x++) {
              const idx = y * width + x;
              const alpha = tempAlpha[idx];
              
              if (alpha === 0) continue; // Skip transparent pixels
              
              // For edge pixels (not fully opaque), apply strong smoothing
              if (alpha < 255) {
                let sum = 0;
                let count = 0;
                const radius = 2;
                
                // Weighted average with larger neighborhood
                for (let dy = -radius; dy <= radius; dy++) {
                  for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                    
                    const nIdx = ny * width + nx;
                    const nAlpha = tempAlpha[nIdx];
                    
                    // Weight by distance
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const weight = Math.exp(-dist * dist / 2);
                    
                    sum += nAlpha * weight;
                    count += weight;
                  }
                }
                
                alphaMap[idx] = Math.round(sum / count);
              }
            }
          }
        }
        
        // Apply smoothed alpha back to image data
        for (let i = 0; i < width * height; i++) {
          data[i * 4 + 3] = alphaMap[i];
        }
        
        ctx.putImageData(imgData, 0, 0);
      });
      
      console.log('Applying intelligent edge refinement to smooth star edges...');
      
      // Apply edge refinement to each layer with appropriate settings
      const refinedCanvases = canvases.map((canvas, i) => {
        // Moderate smoothing since feathering already cleaned edges
        const smoothingRadius = Math.max(2, 4 - Math.floor(i / 2)); // Reduced from 6
        const edgeThreshold = 60 - i * 5; // Slightly reduced from 75
        const coreThreshold = 235 - i * 10; // Preserve very bright cores
        
        return refineStarEdges(canvas, {
          smoothingRadius,
          edgeThreshold,
          preserveCore: true,
          coreThreshold
        });
      });
      
      // Convert refined canvases to ImageBitmaps for faster GPU-accelerated rendering
      const bitmapOptions: ImageBitmapOptions = {
        premultiplyAlpha: 'premultiply',
        colorSpaceConversion: 'none',
        resizeQuality: 'high'
      };
      
      Promise.all(
        refinedCanvases.map(canvas => createImageBitmap(canvas, bitmapOptions))
      ).then((bitmaps) => {
        console.log('🌟 [StarField3D] Setting star layers state with bitmaps');
        setStarLayers({
          layer1: bitmaps[0],
          layer2: bitmaps[1],
          layer3: bitmaps[2],
          layer4: bitmaps[3],
          layer5: bitmaps[4],
          layer6: bitmaps[5]
        });
        
        const totalTime = (performance.now() - startTime).toFixed(0);
        console.log(`✅ [StarField3D] 6 star layers ready with refined edges: ${layerCounts.map((c, i) => `L${i+1}:${c}`).join(', ')} (${totalTime}ms total)`);
      }).catch(error => {
        console.error('❌ [StarField3D] Failed to create star layer bitmaps:', error);
      });
    };
    
    img.src = starsOnlyImage;
  }, [starsOnlyImage]);

  // Load background image as ImageBitmap for faster rendering
  useEffect(() => {
    if (!backgroundImage) return;
    
    const img = new Image();
    img.onload = () => {
      // Convert to ImageBitmap for GPU-accelerated rendering with optimal settings
      const bitmapOptions: ImageBitmapOptions = {
        premultiplyAlpha: 'premultiply',
        colorSpaceConversion: 'none',
        resizeQuality: 'high'
      };
      
      createImageBitmap(img, bitmapOptions).then(bitmap => {
        console.log('🖼️ [StarField3D] Setting background image bitmap');
        setBackgroundImg(bitmap);
        // Set dimensions if not already set
        if (imageDimensions.width === 1920 && imageDimensions.height === 1080) {
          setImageDimensions({ width: img.width, height: img.height });
        }
        console.log('✅ [StarField3D] Background image loaded for rendering');
      }).catch(error => {
        console.error('❌ [StarField3D] Failed to create background bitmap:', error);
      });
    };
    img.src = backgroundImage;
  }, [backgroundImage, imageDimensions]);

  // Animation loop - optimized with cached context and throttled updates
  const animate = useCallback(() => {
    if (!canvasRef.current) {
      console.warn('⚠️ [StarField3D] animate() called but canvas ref is null');
      return;
    }
    
    // Validate we have required assets before rendering
    const hasLayers = starLayers.layer1 && starLayers.layer2 && starLayers.layer3 && 
                      starLayers.layer4 && starLayers.layer5 && starLayers.layer6;
    
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
    const { motionType = 'zoom_in', speed = 1, duration = 10, spin = 0, spinDirection = 'clockwise' } = settings;
    
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
    
    // Calculate scale needed to fill frame when rotated (optimized)
    const rotationScale = spin > 0 ? 1 + (Math.abs(Math.sin(currentRotation)) * 0.414) : 1;
    
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
    // Using exponential scale calibrated to match traditional morph displacement
    const depthValues = {
      layer1: 1.0 * (1.0 - displacementRatio * 0.7),      // Closest - bright stars (shifted forward)
      layer2: 2.0 * (1.0 - displacementRatio * 0.5),      // 2x distance
      layer3: 4.5 * (1.0 - displacementRatio * 0.3),      // ~4.5x distance
      layer4: 10 * (1.0 - displacementRatio * 0.1),       // 10x distance
      layer5: 25 * (1.0 + displacementRatio * 0.2),       // 25x distance - distant stars
      layer6: 60 * (1.0 + displacementRatio * 0.4),       // 60x distance - very distant
      background: 100 * stereoDepthScale                  // Furthest - respects horizontalDisplace
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
      layer1: calculateMultiplier(depthValues.layer1),        // 1.000 (reference)
      layer2: calculateMultiplier(depthValues.layer2),        // 0.500 
      layer3: calculateMultiplier(depthValues.layer3),        // 0.222
      layer4: calculateMultiplier(depthValues.layer4),        // 0.100
      layer5: calculateMultiplier(depthValues.layer5),        // 0.040
      layer6: calculateMultiplier(depthValues.layer6),        // 0.017
      background: calculateMultiplier(depthValues.background) // 0.010
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
    
    // Only recalculate offsets if state changed
    if (stateChanged) {
      if (motionType === 'zoom_in') {
        // Zoom in: Background (starless) zooms directly by amplification factor
        // Stars use parallax multipliers for depth effect
        offsetsRef.current.background.scale = 1.0 + (progressRatio * ampFactor);
        offsetsRef.current.layer6.scale = 1.0 + (progressRatio * ampFactor * 0.4 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (progressRatio * ampFactor * 0.5 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (progressRatio * ampFactor * 0.6 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (progressRatio * ampFactor * 0.7 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (progressRatio * ampFactor * 0.85 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (progressRatio * ampFactor * 1.0 * parallaxMultipliers.layer1);
      } else if (motionType === 'zoom_out') {
        // Zoom out: Background (starless) shrinks from amplified size back to normal
        // Stars use parallax multipliers for depth effect
        const bgMax = 1.0 + ampFactor;
        const layer6Max = 1.0 + (ampFactor * 0.4 * parallaxMultipliers.layer6);
        const layer5Max = 1.0 + (ampFactor * 0.5 * parallaxMultipliers.layer5);
        const layer4Max = 1.0 + (ampFactor * 0.6 * parallaxMultipliers.layer4);
        const layer3Max = 1.0 + (ampFactor * 0.7 * parallaxMultipliers.layer3);
        const layer2Max = 1.0 + (ampFactor * 0.85 * parallaxMultipliers.layer2);
        const layer1Max = 1.0 + (ampFactor * 1.0 * parallaxMultipliers.layer1);
        
        offsetsRef.current.background.scale = bgMax - (progressRatio * ampFactor);
        offsetsRef.current.layer6.scale = layer6Max - (progressRatio * ampFactor * 0.4 * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = layer5Max - (progressRatio * ampFactor * 0.5 * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = layer4Max - (progressRatio * ampFactor * 0.6 * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = layer3Max - (progressRatio * ampFactor * 0.7 * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = layer2Max - (progressRatio * ampFactor * 0.85 * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = layer1Max - (progressRatio * ampFactor * 1.0 * parallaxMultipliers.layer1);
      } else if (motionType === 'pan_left') {
        // Pan with amplification affecting overall scale and pan distance
        const panAmount = progressRatio * speed * 250 * ampFactor;
        offsetsRef.current.background.scale = 1.0 + (0.1 * ampFactor * parallaxMultipliers.background);
        offsetsRef.current.layer6.scale = 1.0 + (0.1 * ampFactor * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (0.1 * ampFactor * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (0.1 * ampFactor * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (0.1 * ampFactor * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (0.1 * ampFactor * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (0.1 * ampFactor * parallaxMultipliers.layer1);
        
        offsetsRef.current.background.x = -panAmount * parallaxMultipliers.background;
        offsetsRef.current.layer6.x = -panAmount * parallaxMultipliers.layer6;
        offsetsRef.current.layer5.x = -panAmount * parallaxMultipliers.layer5;
        offsetsRef.current.layer4.x = -panAmount * parallaxMultipliers.layer4;
        offsetsRef.current.layer3.x = -panAmount * parallaxMultipliers.layer3;
        offsetsRef.current.layer2.x = -panAmount * parallaxMultipliers.layer2;
        offsetsRef.current.layer1.x = -panAmount * parallaxMultipliers.layer1;
      } else if (motionType === 'pan_right') {
        // Pan right with amplification affecting overall scale and pan distance
        const panAmount = progressRatio * speed * 250 * ampFactor;
        offsetsRef.current.background.scale = 1.0 + (0.1 * ampFactor * parallaxMultipliers.background);
        offsetsRef.current.layer6.scale = 1.0 + (0.1 * ampFactor * parallaxMultipliers.layer6);
        offsetsRef.current.layer5.scale = 1.0 + (0.1 * ampFactor * parallaxMultipliers.layer5);
        offsetsRef.current.layer4.scale = 1.0 + (0.1 * ampFactor * parallaxMultipliers.layer4);
        offsetsRef.current.layer3.scale = 1.0 + (0.1 * ampFactor * parallaxMultipliers.layer3);
        offsetsRef.current.layer2.scale = 1.0 + (0.1 * ampFactor * parallaxMultipliers.layer2);
        offsetsRef.current.layer1.scale = 1.0 + (0.1 * ampFactor * parallaxMultipliers.layer1);
        
        offsetsRef.current.background.x = panAmount * parallaxMultipliers.background;
        offsetsRef.current.layer6.x = panAmount * parallaxMultipliers.layer6;
        offsetsRef.current.layer5.x = panAmount * parallaxMultipliers.layer5;
        offsetsRef.current.layer4.x = panAmount * parallaxMultipliers.layer4;
        offsetsRef.current.layer3.x = panAmount * parallaxMultipliers.layer3;
        offsetsRef.current.layer2.x = panAmount * parallaxMultipliers.layer2;
        offsetsRef.current.layer1.x = panAmount * parallaxMultipliers.layer1;
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
      
      const scaledWidth = cachedDimensions.current.bgScaledWidth * bgScale;
      const scaledHeight = cachedDimensions.current.bgScaledHeight * bgScale;
      const drawX = (canvas.width - scaledWidth) * 0.5 + bgX;
      const drawY = (canvas.height - scaledHeight) * 0.5 + bgY;
      
      ctx.globalAlpha = 0.85;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(backgroundImg, drawX, drawY, scaledWidth, scaledHeight);
    }
    
    // Draw six star layers with 3D parallax (back to front) and intelligent blending
    // Layers 6-4 use screen blend, layers 3-1 use screen + lighter blend for glow with background
    const hasAnyLayers = starLayers.layer1 || starLayers.layer2 || starLayers.layer3 || 
                        starLayers.layer4 || starLayers.layer5 || starLayers.layer6;
    
    if (hasAnyLayers) {
      // Layer 6: Smallest/dimmest stars (farthest, slowest movement)
      if (starLayers.layer6) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.9;
        const scale = offsetsRef.current.layer6.scale;
        const scaledWidth = cachedDimensions.current.layer6ScaledWidth * scale;
        const scaledHeight = cachedDimensions.current.layer6ScaledHeight * scale;
        const drawX = (canvas.width - scaledWidth) * 0.5 + offsetsRef.current.layer6.x;
        const drawY = (canvas.height - scaledHeight) * 0.5 + offsetsRef.current.layer6.y;
        ctx.drawImage(starLayers.layer6, drawX, drawY, scaledWidth, scaledHeight);
      }
      
      // Layer 5
      if (starLayers.layer5) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.95;
        const scale = offsetsRef.current.layer5.scale;
        const scaledWidth = cachedDimensions.current.layer5ScaledWidth * scale;
        const scaledHeight = cachedDimensions.current.layer5ScaledHeight * scale;
        const drawX = (canvas.width - scaledWidth) * 0.5 + offsetsRef.current.layer5.x;
        const drawY = (canvas.height - scaledHeight) * 0.5 + offsetsRef.current.layer5.y;
        ctx.drawImage(starLayers.layer5, drawX, drawY, scaledWidth, scaledHeight);
      }
      
      // Layer 4
      if (starLayers.layer4) {
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 1.0;
        const scale = offsetsRef.current.layer4.scale;
        const scaledWidth = cachedDimensions.current.layer4ScaledWidth * scale;
        const scaledHeight = cachedDimensions.current.layer4ScaledHeight * scale;
        const drawX = (canvas.width - scaledWidth) * 0.5 + offsetsRef.current.layer4.x;
        const drawY = (canvas.height - scaledHeight) * 0.5 + offsetsRef.current.layer4.y;
        ctx.drawImage(starLayers.layer4, drawX, drawY, scaledWidth, scaledHeight);
      }
      
      // Layer 3: Start using lighter blend for brighter stars to create glow with background
      if (starLayers.layer3) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1.0;
        const scale = offsetsRef.current.layer3.scale;
        const scaledWidth = cachedDimensions.current.layer3ScaledWidth * scale;
        const scaledHeight = cachedDimensions.current.layer3ScaledHeight * scale;
        const drawX = (canvas.width - scaledWidth) * 0.5 + offsetsRef.current.layer3.x;
        const drawY = (canvas.height - scaledHeight) * 0.5 + offsetsRef.current.layer3.y;
        ctx.drawImage(starLayers.layer3, drawX, drawY, scaledWidth, scaledHeight);
      }
      
      // Layer 2: Brighter stars with enhanced glow
      if (starLayers.layer2) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1.0;
        const scale = offsetsRef.current.layer2.scale;
        const scaledWidth = cachedDimensions.current.layer2ScaledWidth * scale;
        const scaledHeight = cachedDimensions.current.layer2ScaledHeight * scale;
        const drawX = (canvas.width - scaledWidth) * 0.5 + offsetsRef.current.layer2.x;
        const drawY = (canvas.height - scaledHeight) * 0.5 + offsetsRef.current.layer2.y;
        ctx.drawImage(starLayers.layer2, drawX, drawY, scaledWidth, scaledHeight);
      }
      
      // Layer 1: Largest/brightest stars (closest, fastest movement) with maximum glow
      if (starLayers.layer1) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 1.0;
        const scale = offsetsRef.current.layer1.scale;
        const scaledWidth = cachedDimensions.current.layer1ScaledWidth * scale;
        const scaledHeight = cachedDimensions.current.layer1ScaledHeight * scale;
        const drawX = (canvas.width - scaledWidth) * 0.5 + offsetsRef.current.layer1.x;
        const drawY = (canvas.height - scaledHeight) * 0.5 + offsetsRef.current.layer1.y;
        ctx.drawImage(starLayers.layer1, drawX, drawY, scaledWidth, scaledHeight);
      }
    }
    
    // Restore rotation transform
    ctx.restore();
    
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
    };
  }, [starLayers.layer1, starLayers.layer2, starLayers.layer3, starLayers.layer4, starLayers.layer5, starLayers.layer6]);
  
  // Cleanup background image when changed or on unmount
  useEffect(() => {
    return () => {
      if (backgroundImg) backgroundImg.close();
    };
  }, [backgroundImg]);

  // Notify parent when canvas and layers are ready AND render initial frame
  useEffect(() => {
    const hasAllLayers = starLayers.layer1 && starLayers.layer2 && starLayers.layer3 && 
                         starLayers.layer4 && starLayers.layer5 && starLayers.layer6;
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
        style={{ willChange: isAnimating ? 'contents' : 'auto' }}
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
