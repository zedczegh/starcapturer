import React, { useRef, useEffect, useCallback, useState } from 'react';
import { TraditionalMorphProcessor } from '@/lib/traditionalMorphMode';
import { refineStarEdges } from '@/utils/starEdgeRefinement';

interface StereoscopicRendererProps {
  starsOnlyImage: string | null;
  starlessImage: string | null;
  isAnimating: boolean;
  onProgressUpdate?: (progress: number) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  animationDuration: number;
  animationSettings: {
    motionType: 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right';
    speed: number;
    amplification: number;
    spin: number;
    spinDirection: 'clockwise' | 'counterclockwise';
  };
  stereoSpacing: number;
  depthIntensity: number;
  externalProgress?: number;
}

const StereoscopicRenderer: React.FC<StereoscopicRendererProps> = ({
  starsOnlyImage,
  starlessImage,
  isAnimating,
  onProgressUpdate,
  onCanvasReady,
  animationDuration,
  animationSettings,
  stereoSpacing,
  depthIntensity,
  externalProgress
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  
  // States for left view
  const [leftStarLayers, setLeftStarLayers] = useState<{
    layer1: ImageBitmap | null;
    layer2: ImageBitmap | null;
    layer3: ImageBitmap | null;
    layer4: ImageBitmap | null;
    layer5: ImageBitmap | null;
    layer6: ImageBitmap | null;
  }>({ layer1: null, layer2: null, layer3: null, layer4: null, layer5: null, layer6: null });
  const [leftBackground, setLeftBackground] = useState<ImageBitmap | null>(null);
  
  // States for right view
  const [rightStarLayers, setRightStarLayers] = useState<{
    layer1: ImageBitmap | null;
    layer2: ImageBitmap | null;
    layer3: ImageBitmap | null;
    layer4: ImageBitmap | null;
    layer5: ImageBitmap | null;
    layer6: ImageBitmap | null;
  }>({ layer1: null, layer2: null, layer3: null, layer4: null, layer5: null, layer6: null });
  const [rightBackground, setRightBackground] = useState<ImageBitmap | null>(null);
  
  const [imageDimensions, setImageDimensions] = useState({ width: 1920, height: 1080 });
  const [isGenerating, setIsGenerating] = useState(false);
  const processorRef = useRef<TraditionalMorphProcessor | null>(null);

  // Initialize processor
  useEffect(() => {
    if (!processorRef.current) {
      processorRef.current = new TraditionalMorphProcessor();
      console.log('🔧 [StereoRenderer] TraditionalMorphProcessor initialized');
    }
    
    return () => {
      if (processorRef.current) {
        processorRef.current.dispose();
        processorRef.current = null;
      }
    };
  }, []);

  // Generate left and right composites using Traditional Morph, then separate into layers
  useEffect(() => {
    if (!starlessImage || !starsOnlyImage || !processorRef.current || isGenerating) return;

    const generateStereoViews = async () => {
      setIsGenerating(true);
      console.log('🎬 [StereoRenderer] Starting stereoscopic generation using Traditional Morph algorithm');

      try {
        const processor = processorRef.current!;
        
        // Load images
        const starlessImg = new Image();
        const starsImg = new Image();
        
        await Promise.all([
          new Promise<void>((resolve) => {
            starlessImg.onload = () => resolve();
            starlessImg.src = starlessImage;
          }),
          new Promise<void>((resolve) => {
            starsImg.onload = () => resolve();
            starsImg.src = starsOnlyImage;
          })
        ]);
        
        const width = starsImg.width;
        const height = starsImg.height;
        setImageDimensions({ width, height });
        
        console.log(`✅ [StereoRenderer] Images loaded: ${width}x${height}`);
        
        // Convert to files for Traditional Morph processor
        const toFile = async (img: HTMLImageElement, name: string): Promise<File> => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const blob = await new Promise<Blob>((resolve) => 
            canvas.toBlob((b) => resolve(b!), 'image/png')
          );
          return new File([blob], name, { type: 'image/png' });
        };
        
        const starlessFile = await toFile(starlessImg, 'starless.png');
        const starsFile = await toFile(starsImg, 'stars.png');
        
        console.log('📊 [StereoRenderer] Running Traditional Morph with default parameters (H-Displace:25, StarShift:6, Blur:1.5, Contrast:1.2)');
        
        // Use Traditional Morph with FIXED DEFAULT PARAMETERS
        const result = await processor.createTraditionalStereoPair(
          {
            starlessImage: starlessFile,
            starsOnlyImage: starsFile
          },
          {
            horizontalDisplace: 25,    // Fixed default
            starShiftAmount: 6,         // Fixed default
            luminanceBlur: 1.5,         // Fixed default
            contrastBoost: 1.2          // Fixed default
          },
          (step, progress) => {
            console.log(`[StereoRenderer] ${step} - ${progress?.toFixed(0)}%`);
          }
        );
        
        console.log('✅ [StereoRenderer] Traditional Morph completed - got left and right composites');
        console.log('🔄 [StereoRenderer] Separating each composite into background + 6 star layers');
        
        // Now process LEFT composite
        const leftComposite = result.leftCanvas;
        const leftProcessed = await processCompositeIntoLayers(leftComposite, starlessImg, starsImg, 'LEFT');
        
        // Process RIGHT composite
        const rightComposite = result.rightCanvas;
        const rightProcessed = await processCompositeIntoLayers(rightComposite, starlessImg, starsImg, 'RIGHT');
        
        // Set left view layers
        setLeftBackground(leftProcessed.background);
        setLeftStarLayers(leftProcessed.starLayers);
        
        // Set right view layers
        setRightBackground(rightProcessed.background);
        setRightStarLayers(rightProcessed.starLayers);
        
        console.log('✅ [StereoRenderer] Both views fully processed and ready for rendering');
        
      } catch (error) {
        console.error('❌ [StereoRenderer] Failed to generate stereo views:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateStereoViews();
  }, [starlessImage, starsOnlyImage]);

  // Process a composite into background + 6 star layers (same logic as StarField3D)
  const processCompositeIntoLayers = async (
    composite: HTMLCanvasElement,
    starlessImg: HTMLImageElement,
    starsImg: HTMLImageElement,
    viewName: string
  ): Promise<{
    background: ImageBitmap;
    starLayers: {
      layer1: ImageBitmap;
      layer2: ImageBitmap;
      layer3: ImageBitmap;
      layer4: ImageBitmap;
      layer5: ImageBitmap;
      layer6: ImageBitmap;
    };
  }> => {
    const width = composite.width;
    const height = composite.height;
    
    // Background is just the starless (nebula)
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = width;
    bgCanvas.height = height;
    bgCanvas.getContext('2d')!.drawImage(starlessImg, 0, 0);
    const background = await createImageBitmap(bgCanvas);
    
    // Extract stars from composite by subtracting starless
    const starsCanvas = document.createElement('canvas');
    starsCanvas.width = width;
    starsCanvas.height = height;
    const starsCtx = starsCanvas.getContext('2d', { willReadFrequently: true, alpha: false })!;
    
    // Get composite and starless data
    const compositeData = composite.getContext('2d')!.getImageData(0, 0, width, height);
    const starlessData = (() => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.drawImage(starlessImg, 0, 0);
      return tempCtx.getImageData(0, 0, width, height);
    })();
    
    const starsData = starsCtx.createImageData(width, height);
    
    // Extract stars by subtracting background
    for (let i = 0; i < compositeData.data.length; i += 4) {
      const r = Math.max(0, compositeData.data[i] - starlessData.data[i]);
      const g = Math.max(0, compositeData.data[i + 1] - starlessData.data[i + 1]);
      const b = Math.max(0, compositeData.data[i + 2] - starlessData.data[i + 2]);
      
      starsData.data[i] = r;
      starsData.data[i + 1] = g;
      starsData.data[i + 2] = b;
      starsData.data[i + 3] = 255;
    }
    
    starsCtx.putImageData(starsData, 0, 0);
    
    // Now separate stars into 6 layers using the same logic as StarField3D
    const data = starsData.data;
    const pixelCount = width * height;
    const luminanceCache = new Float32Array(pixelCount);
    const data32 = new Uint32Array(data.buffer);
    
    // Pre-calculate luminance
    for (let i = 0; i < pixelCount; i++) {
      const pixel = data32[i];
      const r = pixel & 0xFF;
      const g = (pixel >> 8) & 0xFF;
      const b = (pixel >> 16) & 0xFF;
      luminanceCache[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }
    
    // Detect star regions
    const visited = new Uint8Array(pixelCount);
    const starRegions: {
      pixels: Uint32Array;
      pixelCount: number;
      maxLuminance: number;
      size: number;
    }[] = [];
    
    const threshold = 30;
    const lowThreshold = threshold * 0.5;
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
          let queueStart = 0;
          let queueEnd = 0;
          let pixelCount = 0;
          
          queueX[queueEnd] = x;
          queueY[queueEnd] = y;
          queueEnd++;
          visited[idx] = 1;
          
          let maxLum = luminance;
          let minX = x, maxX = x, minY = y, maxY = y;
          
          while (queueStart < queueEnd && pixelCount < maxQueueSize) {
            const currX = queueX[queueStart];
            const currY = queueY[queueStart];
            queueStart++;
            
            const currIdx = currY * width + currX;
            pixelBuffer[pixelCount++] = currIdx;
            
            const currLum = luminanceCache[currIdx];
            if (currLum > maxLum) maxLum = currLum;
            
            if (currX < minX) minX = currX;
            if (currX > maxX) maxX = currX;
            if (currY < minY) minY = currY;
            if (currY > maxY) maxY = currY;
            
            // Check 8-connected neighbors
            const neighbors = [
              [currX - 1, currY - 1], [currX, currY - 1], [currX + 1, currY - 1],
              [currX - 1, currY], [currX + 1, currY],
              [currX - 1, currY + 1], [currX, currY + 1], [currX + 1, currY + 1]
            ];
            
            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nIdx = ny * width + nx;
                if (!visited[nIdx] && luminanceCache[nIdx] > lowThreshold) {
                  visited[nIdx] = 1;
                  queueX[queueEnd] = nx;
                  queueY[queueEnd] = ny;
                  queueEnd++;
                }
              }
            }
          }
          
          if (pixelCount >= 5 && pixelCount <= maxQueueSize) {
            const size = Math.max(maxX - minX, maxY - minY);
            const pixels = new Uint32Array(pixelCount);
            pixels.set(pixelBuffer.subarray(0, pixelCount));
            
            starRegions.push({ pixels, pixelCount, maxLuminance: maxLum, size });
          }
        }
      }
    }
    
    console.log(`[StereoRenderer/${viewName}] Detected ${starRegions.length} stars`);
    
    // Sort and distribute into 6 layers by size
    starRegions.sort((a, b) => b.size - a.size);
    
    const layer1Threshold = starRegions[Math.floor(starRegions.length * 0.167)]?.size || 25;
    const layer2Threshold = starRegions[Math.floor(starRegions.length * 0.333)]?.size || 18;
    const layer3Threshold = starRegions[Math.floor(starRegions.length * 0.500)]?.size || 12;
    const layer4Threshold = starRegions[Math.floor(starRegions.length * 0.667)]?.size || 8;
    const layer5Threshold = starRegions[Math.floor(starRegions.length * 0.833)]?.size || 5;
    
    // Create 6 canvases for layers
    const canvases = Array(6).fill(null).map(() => {
      const c = document.createElement('canvas');
      c.width = width;
      c.height = height;
      return c;
    });
    
    const contexts = canvases.map(c => c.getContext('2d', { alpha: false })!);
    const imageDatas = contexts.map(ctx => ctx.createImageData(width, height));
    const data32Views = imageDatas.map(imgData => new Uint32Array(imgData.data.buffer));
    
    // Assign stars to layers
    for (const star of starRegions) {
      let layerIndex: number;
      
      if (star.size >= layer1Threshold) layerIndex = 0;
      else if (star.size >= layer2Threshold) layerIndex = 1;
      else if (star.size >= layer3Threshold) layerIndex = 2;
      else if (star.size >= layer4Threshold) layerIndex = 3;
      else if (star.size >= layer5Threshold) layerIndex = 4;
      else layerIndex = 5;
      
      const targetData32 = data32Views[layerIndex];
      for (let i = 0; i < star.pixelCount; i++) {
        const pixelIdx = star.pixels[i];
        targetData32[pixelIdx] = data32[pixelIdx];
      }
    }
    
    // Put data onto canvases
    contexts.forEach((ctx, i) => ctx.putImageData(imageDatas[i], 0, 0));
    
    // Apply edge refinement
    const refinedCanvases = canvases.map((canvas, i) => {
      const smoothingRadius = Math.max(1, 3 - Math.floor(i / 2));
      const edgeThreshold = 45 - i * 5;
      const coreThreshold = 220 - i * 15;
      
      return refineStarEdges(canvas, {
        smoothingRadius,
        edgeThreshold,
        preserveCore: true,
        coreThreshold
      });
    });
    
    // Convert to ImageBitmaps
    const [layer1, layer2, layer3, layer4, layer5, layer6] = await Promise.all(
      refinedCanvases.map(c => createImageBitmap(c, { 
        premultiplyAlpha: 'premultiply',
        colorSpaceConversion: 'none',
        resizeQuality: 'high'
      }))
    );
    
    return {
      background,
      starLayers: { layer1, layer2, layer3, layer4, layer5, layer6 }
    };
  };

  // Render stereo pair with parallax animation
  const renderStereoFrame = useCallback((progress: number) => {
    if (!canvasRef.current || !leftBackground || !rightBackground) return;
    
    const hasLeftLayers = leftStarLayers.layer1 && leftStarLayers.layer6;
    const hasRightLayers = rightStarLayers.layer1 && rightStarLayers.layer6;
    
    if (!hasLeftLayers || !hasRightLayers) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const width = imageDimensions.width;
    const height = imageDimensions.height;

    // Set canvas size for side-by-side stereo pair
    canvas.width = width * 2 + stereoSpacing;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const { motionType, amplification, spin, spinDirection } = animationSettings;
    
    // Calculate motion parameters
    const normalizedProgress = progress / 100;
    const amplificationFactor = amplification / 100;
    
    // Calculate parallax multipliers (same as StarField3D)
    const baseIntensity = 0.15 + (depthIntensity / 100) * 0.85;
    const intensityRange = (depthIntensity / 100) * 0.4;
    
    const parallaxMultipliers = {
      background: baseIntensity - intensityRange,
      layer6: baseIntensity - intensityRange * 0.7,
      layer5: baseIntensity - intensityRange * 0.4,
      layer4: baseIntensity,
      layer3: baseIntensity + intensityRange * 0.4,
      layer2: baseIntensity + intensityRange * 0.7,
      layer1: baseIntensity + intensityRange
    };
    
    // Calculate transforms for each layer
    const layerTransforms = {
      background: { scale: 1, panX: 0, panY: 0, rotation: 0 },
      layer6: { scale: 1, panX: 0, panY: 0, rotation: 0 },
      layer5: { scale: 1, panX: 0, panY: 0, rotation: 0 },
      layer4: { scale: 1, panX: 0, panY: 0, rotation: 0 },
      layer3: { scale: 1, panX: 0, panY: 0, rotation: 0 },
      layer2: { scale: 1, panX: 0, panY: 0, rotation: 0 },
      layer1: { scale: 1, panX: 0, panY: 0, rotation: 0 }
    };
    
    // Apply motion
    if (motionType === 'zoom_in') {
      layerTransforms.background.scale = 1.0 + (normalizedProgress * parallaxMultipliers.background * amplificationFactor);
      layerTransforms.layer6.scale = 1.0 + (normalizedProgress * parallaxMultipliers.layer6 * amplificationFactor);
      layerTransforms.layer5.scale = 1.0 + (normalizedProgress * parallaxMultipliers.layer5 * amplificationFactor);
      layerTransforms.layer4.scale = 1.0 + (normalizedProgress * parallaxMultipliers.layer4 * amplificationFactor);
      layerTransforms.layer3.scale = 1.0 + (normalizedProgress * parallaxMultipliers.layer3 * amplificationFactor);
      layerTransforms.layer2.scale = 1.0 + (normalizedProgress * parallaxMultipliers.layer2 * amplificationFactor);
      layerTransforms.layer1.scale = 1.0 + (normalizedProgress * parallaxMultipliers.layer1 * 2.0 * amplificationFactor);
    } else if (motionType === 'zoom_out') {
      const bgMax = 1.0 + (parallaxMultipliers.background * amplificationFactor);
      const layer6Max = 1.0 + (parallaxMultipliers.layer6 * amplificationFactor);
      const layer5Max = 1.0 + (parallaxMultipliers.layer5 * amplificationFactor);
      const layer4Max = 1.0 + (parallaxMultipliers.layer4 * amplificationFactor);
      const layer3Max = 1.0 + (parallaxMultipliers.layer3 * amplificationFactor);
      const layer2Max = 1.0 + (parallaxMultipliers.layer2 * amplificationFactor);
      const layer1Max = 1.0 + (parallaxMultipliers.layer1 * 2.0 * amplificationFactor);
      
      layerTransforms.background.scale = bgMax - (normalizedProgress * parallaxMultipliers.background * amplificationFactor);
      layerTransforms.layer6.scale = layer6Max - (normalizedProgress * parallaxMultipliers.layer6 * amplificationFactor);
      layerTransforms.layer5.scale = layer5Max - (normalizedProgress * parallaxMultipliers.layer5 * amplificationFactor);
      layerTransforms.layer4.scale = layer4Max - (normalizedProgress * parallaxMultipliers.layer4 * amplificationFactor);
      layerTransforms.layer3.scale = layer3Max - (normalizedProgress * parallaxMultipliers.layer3 * amplificationFactor);
      layerTransforms.layer2.scale = layer2Max - (normalizedProgress * parallaxMultipliers.layer2 * amplificationFactor);
      layerTransforms.layer1.scale = layer1Max - (normalizedProgress * parallaxMultipliers.layer1 * 2.0 * amplificationFactor);
    } else if (motionType === 'pan_left' || motionType === 'pan_right') {
      const direction = motionType === 'pan_left' ? -1 : 1;
      const maxPan = width * amplificationFactor * 0.5;
      
      layerTransforms.background.panX = direction * (normalizedProgress - 0.5) * maxPan * parallaxMultipliers.background * 2;
      layerTransforms.layer6.panX = direction * (normalizedProgress - 0.5) * maxPan * parallaxMultipliers.layer6 * 2;
      layerTransforms.layer5.panX = direction * (normalizedProgress - 0.5) * maxPan * parallaxMultipliers.layer5 * 2;
      layerTransforms.layer4.panX = direction * (normalizedProgress - 0.5) * maxPan * parallaxMultipliers.layer4 * 2;
      layerTransforms.layer3.panX = direction * (normalizedProgress - 0.5) * maxPan * parallaxMultipliers.layer3 * 2;
      layerTransforms.layer2.panX = direction * (normalizedProgress - 0.5) * maxPan * parallaxMultipliers.layer2 * 2;
      layerTransforms.layer1.panX = direction * (normalizedProgress - 0.5) * maxPan * parallaxMultipliers.layer1 * 4;
    }
    
    // Apply spin
    if (spin > 0) {
      const spinRadians = (spin * Math.PI) / 180;
      const rotation = spinDirection === 'clockwise' 
        ? normalizedProgress * spinRadians 
        : -normalizedProgress * spinRadians;
      
      Object.values(layerTransforms).forEach(transform => {
        transform.rotation = rotation;
      });
    }

    // Draw both views
    const drawView = (
      background: ImageBitmap,
      layers: typeof leftStarLayers,
      targetX: number
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(targetX, 0, width, height);
      ctx.clip();
      
      const drawLayer = (layer: ImageBitmap | null, transform: typeof layerTransforms.background) => {
        if (!layer) return;
        
        ctx.save();
        ctx.translate(targetX + width / 2, height / 2);
        
        if (transform.rotation !== 0) {
          ctx.rotate(transform.rotation);
        }
        
        ctx.scale(transform.scale, transform.scale);
        ctx.translate(transform.panX / transform.scale, transform.panY / transform.scale);
        
        ctx.drawImage(layer, -layer.width / 2, -layer.height / 2, layer.width, layer.height);
        ctx.restore();
      };
      
      drawLayer(background, layerTransforms.background);
      drawLayer(layers.layer6, layerTransforms.layer6);
      drawLayer(layers.layer5, layerTransforms.layer5);
      drawLayer(layers.layer4, layerTransforms.layer4);
      drawLayer(layers.layer3, layerTransforms.layer3);
      drawLayer(layers.layer2, layerTransforms.layer2);
      drawLayer(layers.layer1, layerTransforms.layer1);
      
      ctx.restore();
    };

    drawView(leftBackground, leftStarLayers, 0);
    drawView(rightBackground, rightStarLayers, width + stereoSpacing);

  }, [leftBackground, rightBackground, leftStarLayers, rightStarLayers, imageDimensions, stereoSpacing, animationSettings, depthIntensity]);

  // Animation loop
  const animate = useCallback(() => {
    if (!isAnimating) return;

    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now();
    }

    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const progress = Math.min((elapsed / animationDuration) * 100, 100);
    currentProgressRef.current = progress;

    renderStereoFrame(progress);

    if (onProgressUpdate) {
      onProgressUpdate(progress);
    }

    if (progress < 100) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      console.log('🏁 [StereoRenderer] Animation complete');
    }
  }, [isAnimating, animationDuration, renderStereoFrame, onProgressUpdate]);

  // Handle animation state
  useEffect(() => {
    if (isAnimating) {
      if (currentProgressRef.current >= 99.9) {
        startTimeRef.current = 0;
        currentProgressRef.current = 0;
      } else if (currentProgressRef.current > 0) {
        const elapsedMs = (currentProgressRef.current / 100) * animationDuration * 1000;
        startTimeRef.current = Date.now() - elapsedMs;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, animate, animationDuration]);

  // Render current frame when settings change
  useEffect(() => {
    const hasLeftLayers = leftStarLayers.layer1 && leftBackground;
    const hasRightLayers = rightStarLayers.layer1 && rightBackground;
    
    if (hasLeftLayers && hasRightLayers) {
      renderStereoFrame(currentProgressRef.current);
    }
  }, [leftBackground, rightBackground, leftStarLayers, rightStarLayers, animationSettings, renderStereoFrame]);

  // Handle external progress
  useEffect(() => {
    const hasLeftLayers = leftStarLayers.layer1 && leftBackground;
    const hasRightLayers = rightStarLayers.layer1 && rightBackground;
    
    if (externalProgress !== undefined && hasLeftLayers && hasRightLayers) {
      console.log(`📹 [StereoRenderer] External progress: ${externalProgress.toFixed(1)}%`);
      currentProgressRef.current = externalProgress;
      renderStereoFrame(externalProgress);
    }
  }, [externalProgress, leftBackground, rightBackground, leftStarLayers, rightStarLayers, renderStereoFrame]);

  // Notify parent when ready
  useEffect(() => {
    const hasLeftLayers = leftStarLayers.layer1 && leftBackground;
    const hasRightLayers = rightStarLayers.layer1 && rightBackground;
    
    if (canvasRef.current && hasLeftLayers && hasRightLayers && onCanvasReady) {
      console.log('✅ [StereoRenderer] Canvas ready');
      renderStereoFrame(0);
      onCanvasReady(canvasRef.current);
    }
  }, [leftBackground, rightBackground, leftStarLayers, rightStarLayers, onCanvasReady, renderStereoFrame]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full object-contain"
      style={{ maxHeight: '100%' }}
    />
  );
};

export default StereoscopicRenderer;
