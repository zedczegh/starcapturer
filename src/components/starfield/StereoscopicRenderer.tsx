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
  stereoParams: {
    horizontalDisplace: number;
    starShiftAmount: number;
    luminanceBlur: number;
    contrastBoost: number;
    stereoSpacing: number;
  };
  externalProgress?: number; // For video recording - forces render at specific progress
}

const StereoscopicRenderer: React.FC<StereoscopicRendererProps> = ({
  starsOnlyImage,
  starlessImage,
  isAnimating,
  onProgressUpdate,
  onCanvasReady,
  animationDuration,
  animationSettings,
  stereoParams,
  externalProgress
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const currentProgressRef = useRef<number>(0);
  
  const [starsImg, setStarsImg] = useState<HTMLImageElement | null>(null);
  const [starlessImg, setStarlessImg] = useState<HTMLImageElement | null>(null);
  const [leftStarLayers, setLeftStarLayers] = useState<{
    layer1: ImageBitmap | null;
    layer2: ImageBitmap | null;
    layer3: ImageBitmap | null;
    layer4: ImageBitmap | null;
    layer5: ImageBitmap | null;
    layer6: ImageBitmap | null;
  }>({ layer1: null, layer2: null, layer3: null, layer4: null, layer5: null, layer6: null });
  const [rightStarLayers, setRightStarLayers] = useState<{
    layer1: ImageBitmap | null;
    layer2: ImageBitmap | null;
    layer3: ImageBitmap | null;
    layer4: ImageBitmap | null;
    layer5: ImageBitmap | null;
    layer6: ImageBitmap | null;
  }>({ layer1: null, layer2: null, layer3: null, layer4: null, layer5: null, layer6: null });
  const [leftBackground, setLeftBackground] = useState<ImageBitmap | null>(null);
  const [rightBackground, setRightBackground] = useState<ImageBitmap | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 1920, height: 1080 });
  const [isGenerating, setIsGenerating] = useState(false);
  const processorRef = useRef<TraditionalMorphProcessor | null>(null);

  // Load images
  useEffect(() => {
    console.log('🎬 [StereoRenderer] Loading images for stereoscopic rendering');
    
    if (!starsOnlyImage || !starlessImage) return;

    const loadImages = async () => {
      const starsImgEl = new Image();
      const starlessImgEl = new Image();

      await Promise.all([
        new Promise<void>((resolve) => {
          starsImgEl.onload = () => resolve();
          starsImgEl.src = starsOnlyImage;
        }),
        new Promise<void>((resolve) => {
          starlessImgEl.onload = () => resolve();
          starlessImgEl.src = starlessImage;
        })
      ]);

      console.log('✅ [StereoRenderer] Images loaded:', {
        starsSize: `${starsImgEl.width}x${starsImgEl.height}`,
        starlessSize: `${starlessImgEl.width}x${starlessImgEl.height}`
      });

      setStarsImg(starsImgEl);
      setStarlessImg(starlessImgEl);
    };

    loadImages();
  }, [starsOnlyImage, starlessImage]);

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

  // Generate stereo views and separate into layers using traditional morph methods
  useEffect(() => {
    if (!starlessImg || !starsImg || !processorRef.current || isGenerating) return;

    const generateStereoViewsWithLayers = async () => {
      setIsGenerating(true);
      console.log('🗺️ [StereoRenderer] Generating LEFT and RIGHT stereo views using traditional morph');

      try {
        const processor = processorRef.current!;
        const width = starsImg.width;
        const height = starsImg.height;
        
        // Convert images to files for processor
        const starlessCanvas = document.createElement('canvas');
        starlessCanvas.width = width;
        starlessCanvas.height = height;
        const starlessCtx = starlessCanvas.getContext('2d')!;
        starlessCtx.drawImage(starlessImg, 0, 0);
        
        const starsCanvas = document.createElement('canvas');
        starsCanvas.width = width;
        starsCanvas.height = height;
        const starsCtx = starsCanvas.getContext('2d')!;
        starsCtx.drawImage(starsImg, 0, 0);
        
        // Convert canvas to blob then to file
        const starlessBlob = await new Promise<Blob>((resolve) => 
          starlessCanvas.toBlob((blob) => resolve(blob!), 'image/png')
        );
        const starsBlob = await new Promise<Blob>((resolve) => 
          starsCanvas.toBlob((blob) => resolve(blob!), 'image/png')
        );
        
        const starlessFile = new File([starlessBlob], 'starless.png', { type: 'image/png' });
        const starsFile = new File([starsBlob], 'stars.png', { type: 'image/png' });
        
        console.log('📊 [StereoRenderer] Creating stereo pair using traditional morph algorithm with default parameters');
        
        // Generate stereo pair using traditional morph - this creates proper left/right composites
        const result = await processor.createTraditionalStereoPair(
          {
            starlessImage: starlessFile,
            starsOnlyImage: starsFile
          },
          {
            horizontalDisplace: stereoParams.horizontalDisplace,
            starShiftAmount: stereoParams.starShiftAmount,
            luminanceBlur: stereoParams.luminanceBlur,
            contrastBoost: stereoParams.contrastBoost
          },
          (step, progress) => {
            console.log(`[StereoRenderer] ${step} - ${progress?.toFixed(0)}%`);
          }
        );
        
        console.log('✅ [StereoRenderer] Traditional morph created left and right composite images');
        console.log('🔧 [StereoRenderer] Using composites directly - extracting backgrounds and stars');
        
        // The traditional morph gives us perfect composites:
        // - leftCanvas: original composite (starless + stars combined)
        // - rightCanvas: properly displaced composite (starless + stars with correct displacement)
        
        // For LEFT view: use original images directly
        const leftBgCanvas = document.createElement('canvas');
        leftBgCanvas.width = width;
        leftBgCanvas.height = height;
        leftBgCanvas.getContext('2d')!.drawImage(starlessImg, 0, 0);
        
        const leftStarsCanvas = document.createElement('canvas');
        leftStarsCanvas.width = width;
        leftStarsCanvas.height = height;
        leftStarsCanvas.getContext('2d')!.drawImage(starsImg, 0, 0);
        
        // For RIGHT view: we have the composite from traditional morph
        // We need to extract the background and stars from this composite
        // The simplest approach: use the same extraction logic that works for left
        
        // Since traditional morph properly displaces the nebula AND moves stars,
        // we can approximate the right view by:
        // 1. Using the left starless as background (since nebula displacement is subtle in the composite)
        // 2. Using the displacement from traditional morph to shift stars
        
        // Actually, let's use the traditional morph outputs more directly:
        // The right composite already has everything displaced correctly
        // We just need to separate it back into layers for parallax
        
        // For background: use left starless (nebula doesn't move much in stereo)
        const rightBgCanvas = document.createElement('canvas');
        rightBgCanvas.width = width;
        rightBgCanvas.height = height;
        rightBgCanvas.getContext('2d')!.drawImage(starlessImg, 0, 0);
        
        // For stars: extract by subtracting starless from the right composite
        const rightStarsCanvas = document.createElement('canvas');
        rightStarsCanvas.width = width;
        rightStarsCanvas.height = height;
        const rightStarsCtx = rightStarsCanvas.getContext('2d')!;
        
        // Get the composite and starless data
        const rightCompositeCanvas = result.rightCanvas;
        const compositeData = rightCompositeCanvas.getContext('2d')!.getImageData(0, 0, width, height);
        const starlessData = starlessImg && (() => {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = width;
          tempCanvas.height = height;
          const tempCtx = tempCanvas.getContext('2d')!;
          tempCtx.drawImage(starlessImg, 0, 0);
          return tempCtx.getImageData(0, 0, width, height);
        })();
        
        const rightStarsData = rightStarsCtx.createImageData(width, height);
        
        // Extract stars by subtracting starless from composite
        if (starlessData) {
          for (let i = 0; i < compositeData.data.length; i += 4) {
            // Subtract background to get stars (screen blend inverse)
            // Since stars were added with screen blend, we need to extract them
            const r = Math.max(0, compositeData.data[i] - starlessData.data[i]);
            const g = Math.max(0, compositeData.data[i + 1] - starlessData.data[i + 1]);
            const b = Math.max(0, compositeData.data[i + 2] - starlessData.data[i + 2]);
            
            rightStarsData.data[i] = r;
            rightStarsData.data[i + 1] = g;
            rightStarsData.data[i + 2] = b;
            rightStarsData.data[i + 3] = 255;
          }
        }
        
        rightStarsCtx.putImageData(rightStarsData, 0, 0);
        
        console.log('✅ [StereoRenderer] Extracted backgrounds and stars from both views');
        console.log('🔄 [StereoRenderer] Separating stars into 6 depth layers for parallax animation');
        
        // Function to separate a stars-only canvas into star layers (matching StarField3D logic)
        const separateIntoLayers = async (starsCanvas: HTMLCanvasElement, viewName: string) => {
          const width = starsCanvas.width;
          const height = starsCanvas.height;
          const ctx = starsCanvas.getContext('2d', { willReadFrequently: true, alpha: false })!;
          const sourceData = ctx.getImageData(0, 0, width, height);
          const data = sourceData.data;
          
          // Pre-calculate luminance
          const pixelCount = width * height;
          const luminanceCache = new Float32Array(pixelCount);
          const data32 = new Uint32Array(data.buffer);
          
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
          
          // Sort and distribute into 6 layers
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
          return Promise.all(
            refinedCanvases.map(c => createImageBitmap(c, { 
              premultiplyAlpha: 'premultiply',
              colorSpaceConversion: 'none',
              resizeQuality: 'high'
            }))
          );
        };
        
        // Separate both left and right stars-only images into layers
        const [leftBitmaps, rightBitmaps] = await Promise.all([
          separateIntoLayers(leftStarsCanvas, 'Left'),
          separateIntoLayers(rightStarsCanvas, 'Right')
        ]);
        
        setLeftStarLayers({
          layer1: leftBitmaps[0],
          layer2: leftBitmaps[1],
          layer3: leftBitmaps[2],
          layer4: leftBitmaps[3],
          layer5: leftBitmaps[4],
          layer6: leftBitmaps[5]
        });
        
        setRightStarLayers({
          layer1: rightBitmaps[0],
          layer2: rightBitmaps[1],
          layer3: rightBitmaps[2],
          layer4: rightBitmaps[3],
          layer5: rightBitmaps[4],
          layer6: rightBitmaps[5]
        });
        
        // Convert backgrounds to ImageBitmaps
        const leftBg = await createImageBitmap(leftBgCanvas);
        const rightBg = await createImageBitmap(rightBgCanvas);
        
        setLeftBackground(leftBg);
        setRightBackground(rightBg);
        setImageDimensions({ width, height });
        
        console.log('✅ [StereoRenderer] Both views separated into 6 star layers + background');
        
      } catch (error) {
        console.error('❌ [StereoRenderer] Failed to generate stereo views:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateStereoViewsWithLayers();
  }, [starlessImg, starsImg, stereoParams]);

  // Render stereo pair to main canvas with motion settings and layer parallax applied
  const renderStereoFrame = useCallback((progress: number) => {
    if (!canvasRef.current || !leftBackground || !rightBackground) return;
    
    const hasLeftLayers = leftStarLayers.layer1 && leftStarLayers.layer2 && leftStarLayers.layer3 && 
                          leftStarLayers.layer4 && leftStarLayers.layer5 && leftStarLayers.layer6;
    const hasRightLayers = rightStarLayers.layer1 && rightStarLayers.layer2 && rightStarLayers.layer3 && 
                           rightStarLayers.layer4 && rightStarLayers.layer5 && rightStarLayers.layer6;
    
    if (!hasLeftLayers || !hasRightLayers) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const width = imageDimensions.width;
    const height = imageDimensions.height;
    const spacing = stereoParams.stereoSpacing;

    // Set canvas size for stereo pair side-by-side
    canvas.width = width * 2 + spacing;
    canvas.height = height;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const { motionType, amplification, spin, spinDirection } = animationSettings;
    
    // Calculate motion parameters based on progress
    const normalizedProgress = progress / 100;
    const amplificationFactor = amplification / 100;
    
    // Calculate parallax multipliers (from StarField3D logic)
    const depthIntensity = 50; // Can be made configurable
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
    
    // Calculate scales and offsets for each layer
    const layerTransforms = {
      background: { scale: 1, panX: 0, panY: 0, rotation: 0 },
      layer6: { scale: 1, panX: 0, panY: 0, rotation: 0 },
      layer5: { scale: 1, panX: 0, panY: 0, rotation: 0 },
      layer4: { scale: 1, panX: 0, panY: 0, rotation: 0 },
      layer3: { scale: 1, panX: 0, panY: 0, rotation: 0 },
      layer2: { scale: 1, panX: 0, panY: 0, rotation: 0 },
      layer1: { scale: 1, panX: 0, panY: 0, rotation: 0 }
    };
    
    // Apply motion based on motion type with parallax
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
    
    // Apply spin rotation (same for all layers)
    if (spin > 0) {
      const spinRadians = (spin * Math.PI) / 180;
      const rotation = spinDirection === 'clockwise' 
        ? normalizedProgress * spinRadians 
        : -normalizedProgress * spinRadians;
      
      Object.values(layerTransforms).forEach(transform => {
        transform.rotation = rotation;
      });
    }

    // Function to draw a view with layers at specified position
    const drawViewWithLayers = (
      background: ImageBitmap,
      layers: typeof leftStarLayers,
      targetX: number
    ) => {
      ctx.save();
      
      // Set clipping region for this view
      ctx.beginPath();
      ctx.rect(targetX, 0, width, height);
      ctx.clip();
      
      // Helper to draw a layer with its transform - maintain aspect ratio
      const drawLayer = (layer: ImageBitmap | null, transform: typeof layerTransforms.background) => {
        if (!layer) return;
        
        ctx.save();
        ctx.translate(targetX + width / 2, height / 2);
        
        if (transform.rotation !== 0) {
          ctx.rotate(transform.rotation);
        }
        
        ctx.scale(transform.scale, transform.scale);
        ctx.translate(transform.panX / transform.scale, transform.panY / transform.scale);
        
        // Draw maintaining original dimensions without skewing
        const drawWidth = layer.width;
        const drawHeight = layer.height;
        ctx.drawImage(layer, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();
      };
      
      // Draw layers from back to front
      drawLayer(background, layerTransforms.background);
      drawLayer(layers.layer6, layerTransforms.layer6);
      drawLayer(layers.layer5, layerTransforms.layer5);
      drawLayer(layers.layer4, layerTransforms.layer4);
      drawLayer(layers.layer3, layerTransforms.layer3);
      drawLayer(layers.layer2, layerTransforms.layer2);
      drawLayer(layers.layer1, layerTransforms.layer1);
      
      ctx.restore();
    };

    // Draw left view with parallax layers
    drawViewWithLayers(leftBackground, leftStarLayers, 0);

    // Draw right view with parallax layers
    drawViewWithLayers(rightBackground, rightStarLayers, width + spacing);

  }, [leftBackground, rightBackground, leftStarLayers, rightStarLayers, imageDimensions, stereoParams.stereoSpacing, animationSettings]);

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

  // Handle animation state changes and render current frame
  useEffect(() => {
    if (isAnimating) {
      if (currentProgressRef.current >= 99.9) {
        startTimeRef.current = 0;
        currentProgressRef.current = 0;
      } else if (currentProgressRef.current > 0) {
        // Resume from current position
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

  // Always render current frame when views or settings change
  useEffect(() => {
    const hasLeftLayers = leftStarLayers.layer1 && leftBackground;
    const hasRightLayers = rightStarLayers.layer1 && rightBackground;
    
    if (hasLeftLayers && hasRightLayers) {
      renderStereoFrame(currentProgressRef.current);
    }
  }, [leftBackground, rightBackground, leftStarLayers, rightStarLayers, animationSettings, renderStereoFrame]);

  // Handle external progress updates (for video recording)
  useEffect(() => {
    const hasLeftLayers = leftStarLayers.layer1 && leftBackground;
    const hasRightLayers = rightStarLayers.layer1 && rightBackground;
    
    if (externalProgress !== undefined && hasLeftLayers && hasRightLayers) {
      console.log(`📹 [StereoRenderer] External progress update: ${externalProgress.toFixed(1)}%`);
      currentProgressRef.current = externalProgress;
      renderStereoFrame(externalProgress);
    }
  }, [externalProgress, leftBackground, rightBackground, leftStarLayers, rightStarLayers, renderStereoFrame]);

  // Notify parent when canvas is ready and render initial frame
  useEffect(() => {
    const hasLeftLayers = leftStarLayers.layer1 && leftBackground;
    const hasRightLayers = rightStarLayers.layer1 && rightBackground;
    
    if (canvasRef.current && hasLeftLayers && hasRightLayers && onCanvasReady) {
      console.log('✅ [StereoRenderer] Canvas ready, rendering initial frame');
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
