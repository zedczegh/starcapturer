import React, { useRef, useEffect, useState, useCallback } from 'react';

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
  externalProgress
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number>();
  const animationStartTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const lastProgressUpdateRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0); // Track current progress for resume
  const offsetsRef = useRef({
    layer1: { x: 0, y: 0, scale: 1 }, // Largest/brightest stars (closest)
    layer2: { x: 0, y: 0, scale: 1 }, // Medium stars
    layer3: { x: 0, y: 0, scale: 1 }, // Small stars (farthest)
    background: { x: 0, y: 0, scale: 1 } // Nebula background
  });
  
  const [starLayers, setStarLayers] = useState<{
    bright: ImageBitmap | null;
    medium: ImageBitmap | null;
    dim: ImageBitmap | null;
  }>({ bright: null, medium: null, dim: null });
  
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
      
      // Detect complete star regions (core + glow + spikes together)
      const visited = new Uint8Array(pixelCount);
      const starRegions: {
        pixels: Uint32Array;
        pixelCount: number;
        maxLuminance: number;
        centerX: number;
        centerY: number;
        size: number;
      }[] = [];
      
      const threshold = 30;
      const lowThreshold = threshold * 0.5;
      
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
      
      // Sort stars by size to determine layer distribution
      starRegions.sort((a, b) => b.size - a.size);
      const largeThreshold = starRegions[Math.floor(starRegions.length * 0.33)]?.size || 15;
      const mediumThreshold = starRegions[Math.floor(starRegions.length * 0.67)]?.size || 7;
      
      console.log(`Size thresholds - Large: ${largeThreshold}, Medium: ${mediumThreshold}`);
      
      // Create three separate canvases
      const largeCanvas = document.createElement('canvas');
      const mediumCanvas = document.createElement('canvas');
      const smallCanvas = document.createElement('canvas');
      
      largeCanvas.width = mediumCanvas.width = smallCanvas.width = width;
      largeCanvas.height = mediumCanvas.height = smallCanvas.height = height;
      
      const largeCtx = largeCanvas.getContext('2d', { 
        alpha: false,
        willReadFrequently: false 
      })!;
      const mediumCtx = mediumCanvas.getContext('2d', { 
        alpha: false,
        willReadFrequently: false 
      })!;
      const smallCtx = smallCanvas.getContext('2d', { 
        alpha: false,
        willReadFrequently: false 
      })!;
      
      // Create image data for each layer
      const largeData = largeCtx.createImageData(width, height);
      const mediumData = mediumCtx.createImageData(width, height);
      const smallData = smallCtx.createImageData(width, height);
      
      // Use Uint32Array views for faster pixel copying
      const largeData32 = new Uint32Array(largeData.data.buffer);
      const mediumData32 = new Uint32Array(mediumData.data.buffer);
      const smallData32 = new Uint32Array(smallData.data.buffer);
      
      let largeCount = 0, mediumCount = 0, smallCount = 0;
      
      // Batch size for processing - process stars in batches to reduce overhead
      const BATCH_SIZE = 1024;
      let starsProcessed = 0;
      
      // Assign each complete star to one layer based on its size with batched processing
      for (let batchStart = 0; batchStart < starRegions.length; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, starRegions.length);
        
        for (let starIdx = batchStart; starIdx < batchEnd; starIdx++) {
          const star = starRegions[starIdx];
          let targetData32: Uint32Array;
          
          if (star.size >= largeThreshold) {
            targetData32 = largeData32;
            largeCount++;
          } else if (star.size >= mediumThreshold) {
            targetData32 = mediumData32;
            mediumCount++;
          } else {
            targetData32 = smallData32;
            smallCount++;
          }
          
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
      largeCtx.putImageData(largeData, 0, 0);
      mediumCtx.putImageData(mediumData, 0, 0);
      smallCtx.putImageData(smallData, 0, 0);
      
      // Convert canvases to ImageBitmaps for faster GPU-accelerated rendering
      // Use optimized settings for better performance with large images
      const bitmapOptions: ImageBitmapOptions = {
        premultiplyAlpha: 'premultiply',
        colorSpaceConversion: 'none',
        resizeQuality: 'high'
      };
      
      Promise.all([
        createImageBitmap(largeCanvas, bitmapOptions),
        createImageBitmap(mediumCanvas, bitmapOptions),
        createImageBitmap(smallCanvas, bitmapOptions)
      ]).then(([brightBitmap, mediumBitmap, dimBitmap]) => {
        setStarLayers({
          bright: brightBitmap,
          medium: mediumBitmap,
          dim: dimBitmap
        });
        
        const totalTime = (performance.now() - startTime).toFixed(0);
        console.log(`✓ Star layers ready: ${largeCount} large, ${mediumCount} medium, ${smallCount} small stars (${totalTime}ms total)`);
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
        setBackgroundImg(bitmap);
        // Set dimensions if not already set
        if (imageDimensions.width === 1920 && imageDimensions.height === 1080) {
          setImageDimensions({ width: img.width, height: img.height });
        }
        console.log('✓ Background image loaded for rendering');
      });
    };
    img.src = backgroundImage;
  }, [backgroundImage, imageDimensions]);

  // Animation loop - optimized with cached context and throttled updates
  const animate = useCallback(() => {
    if (!canvasRef.current) return;
    
    // During video generation, we don't need isAnimating check
    const isVideoRendering = videoProgressRef !== undefined;
    if (!isVideoRendering && !isAnimating) return;
    
    const canvas = canvasRef.current;
    
    // Cache canvas context for better performance
    if (!canvasCtxRef.current) {
      canvasCtxRef.current = canvas.getContext('2d', { 
        alpha: false,
        desynchronized: true // Hint to browser for better performance
      })!;
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
      if (onProgressUpdate) {
        onProgressUpdate(100);
      }
      if (onAnimationComplete) {
        onAnimationComplete();
      }
      return; // Stop the animation loop
    }
    
    // Clear canvas with fast fill
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Always use fast rendering for smooth performance, even during recording
    // This matches preview performance and prevents frame drops with 10k+ stars
    ctx.imageSmoothingEnabled = false;
    
    // Calculate zoom/pan with DRAMATIC parallax differences for 3D depth
    const progressRatio = progress / 100;
    
    // Check if we can skip recalculation (performance optimization)
    const stateChanged = !lastRenderState.current || 
      lastRenderState.current.progress !== progress ||
      lastRenderState.current.motionType !== motionType;
    
    // Calculate rotation angle based on progress, spin setting, and direction
    const rotationMultiplier = spinDirection === 'counterclockwise' ? -1 : 1;
    const currentRotation = (spin * progressRatio * Math.PI * rotationMultiplier) / 180; // Convert to radians
    
    // Calculate scale needed to fill frame when rotated (optimized)
    const rotationScale = spin > 0 ? 1 + (Math.abs(Math.sin(currentRotation)) * 0.414) : 1;
    
    // Amplification factor from settings (100-300%)
    const ampFactor = (settings.amplification || 150) / 100;
    
    // Pre-calculate common values (cached per canvas size)
    if (!cachedDimensions.current || 
        cachedDimensions.current.canvasCenterX !== canvas.width * 0.5 ||
        cachedDimensions.current.canvasCenterY !== canvas.height * 0.5) {
      cachedDimensions.current = {
        canvasCenterX: canvas.width * 0.5,
        canvasCenterY: canvas.height * 0.5,
        bgScaledWidth: backgroundImg?.width || 0,
        bgScaledHeight: backgroundImg?.height || 0,
        layer3ScaledWidth: starLayers.dim?.width || 0,
        layer3ScaledHeight: starLayers.dim?.height || 0,
        layer2ScaledWidth: starLayers.medium?.width || 0,
        layer2ScaledHeight: starLayers.medium?.height || 0,
        layer1ScaledWidth: starLayers.bright?.width || 0,
        layer1ScaledHeight: starLayers.bright?.height || 0
      };
    }
    
    const canvasCenterX = cachedDimensions.current.canvasCenterX;
    const canvasCenterY = cachedDimensions.current.canvasCenterY;
    
    // Only recalculate offsets if state changed
    if (stateChanged) {
      if (motionType === 'zoom_in') {
        // Dramatic 3D depth: large stars zoom MUCH faster than small stars
        offsetsRef.current.background.scale = 1.0 + (progressRatio * 0.3 * ampFactor);
        offsetsRef.current.layer3.scale = 1.0 + (progressRatio * 0.5 * ampFactor);
        offsetsRef.current.layer2.scale = 1.0 + (progressRatio * 1.0 * ampFactor);
        offsetsRef.current.layer1.scale = 1.0 + (progressRatio * 2.0 * ampFactor);
      } else if (motionType === 'zoom_out') {
        // Dramatic zoom out with depth
        const bgMax = 1.0 + (0.3 * ampFactor);
        const smallMax = 1.0 + (0.5 * ampFactor);
        const medMax = 1.0 + (1.0 * ampFactor);
        const largeMax = 1.0 + (2.0 * ampFactor);
        
        offsetsRef.current.background.scale = bgMax - (progressRatio * 0.3 * ampFactor);
        offsetsRef.current.layer3.scale = smallMax - (progressRatio * 0.5 * ampFactor);
        offsetsRef.current.layer2.scale = medMax - (progressRatio * 1.0 * ampFactor);
        offsetsRef.current.layer1.scale = largeMax - (progressRatio * 2.0 * ampFactor);
      } else if (motionType === 'pan_left') {
        // Dramatic pan with strong 3D parallax: large stars pan MUCH faster
        const panAmount = progressRatio * speed * 250 * ampFactor;
        offsetsRef.current.background.scale = 1.0 + (0.2 * ampFactor);
        offsetsRef.current.layer3.scale = 1.0 + (0.2 * ampFactor);
        offsetsRef.current.layer2.scale = 1.0 + (0.2 * ampFactor);
        offsetsRef.current.layer1.scale = 1.0 + (0.2 * ampFactor);
        
        offsetsRef.current.background.x = -panAmount * 0.3;
        offsetsRef.current.layer3.x = -panAmount * 0.5;
        offsetsRef.current.layer2.x = -panAmount * 1.0;
        offsetsRef.current.layer1.x = -panAmount * 2.0;
      } else if (motionType === 'pan_right') {
        // Dramatic pan right with strong 3D parallax
        const panAmount = progressRatio * speed * 250 * ampFactor;
        offsetsRef.current.background.scale = 1.0 + (0.2 * ampFactor);
        offsetsRef.current.layer3.scale = 1.0 + (0.2 * ampFactor);
        offsetsRef.current.layer2.scale = 1.0 + (0.2 * ampFactor);
        offsetsRef.current.layer1.scale = 1.0 + (0.2 * ampFactor);
        
        offsetsRef.current.background.x = panAmount * 0.3;
        offsetsRef.current.layer3.x = panAmount * 0.5;
        offsetsRef.current.layer2.x = panAmount * 1.0;
        offsetsRef.current.layer1.x = panAmount * 2.0;
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
    
    // Draw three size-based star layers with 3D parallax (back to front)
    // Single composite operation for all star layers for better performance
    if (starLayers.dim || starLayers.medium || starLayers.bright) {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = 1.0;
      
      // Layer 3: Small stars (farthest, slowest movement)
      if (starLayers.dim) {
        const scale = offsetsRef.current.layer3.scale;
        const scaledWidth = cachedDimensions.current.layer3ScaledWidth * scale;
        const scaledHeight = cachedDimensions.current.layer3ScaledHeight * scale;
        const drawX = (canvas.width - scaledWidth) * 0.5 + offsetsRef.current.layer3.x;
        const drawY = (canvas.height - scaledHeight) * 0.5 + offsetsRef.current.layer3.y;
        ctx.drawImage(starLayers.dim, drawX, drawY, scaledWidth, scaledHeight);
      }
      
      // Layer 2: Medium stars (middle distance, medium speed)
      if (starLayers.medium) {
        const scale = offsetsRef.current.layer2.scale;
        const scaledWidth = cachedDimensions.current.layer2ScaledWidth * scale;
        const scaledHeight = cachedDimensions.current.layer2ScaledHeight * scale;
        const drawX = (canvas.width - scaledWidth) * 0.5 + offsetsRef.current.layer2.x;
        const drawY = (canvas.height - scaledHeight) * 0.5 + offsetsRef.current.layer2.y;
        ctx.drawImage(starLayers.medium, drawX, drawY, scaledWidth, scaledHeight);
      }
      
      // Layer 1: Large stars (closest, fastest movement)
      if (starLayers.bright) {
        const scale = offsetsRef.current.layer1.scale;
        const scaledWidth = cachedDimensions.current.layer1ScaledWidth * scale;
        const scaledHeight = cachedDimensions.current.layer1ScaledHeight * scale;
        const drawX = (canvas.width - scaledWidth) * 0.5 + offsetsRef.current.layer1.x;
        const drawY = (canvas.height - scaledHeight) * 0.5 + offsetsRef.current.layer1.y;
        ctx.drawImage(starLayers.bright, drawX, drawY, scaledWidth, scaledHeight);
      }
    }
    
    // Restore rotation transform
    ctx.restore();
    
    // Continue animation loop (unless in video rendering mode where we control it manually)
    if (!videoProgressRef) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isAnimating, settings, backgroundImg, starLayers, onProgressUpdate, onAnimationComplete, controlledProgress, videoProgressRef]);

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
    if (isAnimating && !videoProgressRef) {
      // Reset start time to trigger recalculation
      animationStartTimeRef.current = 0;
      lastProgressUpdateRef.current = 0;
      
      // If at end, reset progress to 0
      if (currentProgressRef.current >= 99.9) {
        currentProgressRef.current = 0;
        offsetsRef.current = { 
          layer1: { x: 0, y: 0, scale: 1 },
          layer2: { x: 0, y: 0, scale: 1 },
          layer3: { x: 0, y: 0, scale: 1 },
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
      
      // Start animation loop
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Paused - stop animation loop
      if (animationFrameRef.current) {
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
      if (starLayers.bright) starLayers.bright.close();
      if (starLayers.medium) starLayers.medium.close();
      if (starLayers.dim) starLayers.dim.close();
    };
  }, [starLayers.bright, starLayers.medium, starLayers.dim]);
  
  // Cleanup background image when changed or on unmount
  useEffect(() => {
    return () => {
      if (backgroundImg) backgroundImg.close();
    };
  }, [backgroundImg]);

  // Notify parent when canvas and layers are ready
  useEffect(() => {
    if (canvasRef.current && onCanvasReady && (starLayers.bright || starLayers.medium || starLayers.dim || backgroundImg)) {
      // Call after a short delay to ensure canvas is fully rendered
      const timer = setTimeout(() => {
        if (canvasRef.current) {
          onCanvasReady(canvasRef.current);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [onCanvasReady, starLayers, backgroundImg]);

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
