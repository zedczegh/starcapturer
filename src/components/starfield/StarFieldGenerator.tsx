import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Upload, Video, Download, Sparkles, Eye, Settings2, Image as ImageIcon, Play, Pause, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { UploadProgress } from '@/components/ui/upload-progress';
import StarField3D from './StarField3D';
import { CanvasPool } from '@/lib/performance/CanvasPool';
import { MemoryManager } from '@/lib/performance/MemoryManager';
import { ChunkedProcessor } from '@/lib/performance/ChunkedProcessor';
import { loadImageFromFile, validateImageFile } from '@/utils/imageProcessingUtils';
import { captureFrames, encodeFramesToWebM, downloadBlob, calculateRecordingDimensions } from '@/utils/videoEncodingUtils';
import VideoPlayerControls from '@/components/video/VideoPlayerControls';

interface ProcessedStarData {
  x: number;
  y: number;
  z: number;
  brightness: number;
  size: number;
  color3d: string;
  originalX: number;
  originalY: number;
}

interface StarPosition {
  x: number;
  y: number;
  brightness: number;
  size: number;
  color: { r: number; g: number; b: number };
}

const StarFieldGenerator: React.FC = () => {
  const { language } = useLanguage();
  
  // Two separate images
  const [starsOnlyImage, setStarsOnlyImage] = useState<string | null>(null);
  const [starlessImage, setStarlessImage] = useState<string | null>(null);
  const [starsOnlyElement, setStarsOnlyElement] = useState<HTMLImageElement | null>(null);
  const [starlessElement, setStarlessElement] = useState<HTMLImageElement | null>(null);
  
  const [detectedStars, setDetectedStars] = useState<StarPosition[]>([]);
  const [processedStars, setProcessedStars] = useState<ProcessedStarData[]>([]);
  const [depthMapCanvas, setDepthMapCanvas] = useState<HTMLCanvasElement | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'ready' | 'generating'>('upload');
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const videoProgressRef = useRef<number>(0); // Direct ref for frame-by-frame control
  const [frameRenderTrigger, setFrameRenderTrigger] = useState(0); // Trigger to force frame render
  const [videoProgress, setVideoProgress] = useState({ stage: '', percent: 0 });
  const [isRecording, setIsRecording] = useState(false);
  
  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState({
    stars: { show: false, progress: 0, fileName: '' },
    starless: { show: false, progress: 0, fileName: '' }
  });
  
  // 3D depth intensity control (0-500 scale)
  const [depthIntensity, setDepthIntensity] = useState<number>(400);
  const [preserveStarsIntensity, setPreserveStarsIntensity] = useState<number>(100);
  
  const starsFileInputRef = useRef<HTMLInputElement>(null);
  const starlessFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStopCallbackRef = useRef<(() => void) | null>(null);

  // Animation settings with motion controls
  const [animationSettings, setAnimationSettings] = useState({
    motionType: 'zoom_in' as 'zoom_in' | 'zoom_out' | 
                'pan_left' | 'pan_right' | 'pan_up' | 'pan_down' | 
                'zoom_in_pan_left' | 'zoom_in_pan_right' | 'zoom_in_pan_up' | 'zoom_in_pan_down' |
                'zoom_out_pan_left' | 'zoom_out_pan_right' | 'zoom_out_pan_up' | 'zoom_out_pan_down' |
                'pan_diagonal_up_left' | 'pan_diagonal_up_right' | 'pan_diagonal_down_left' | 'pan_diagonal_down_right' |
                'zoom_in_pan_diagonal_up_left' | 'zoom_in_pan_diagonal_up_right' | 'zoom_in_pan_diagonal_down_left' | 'zoom_in_pan_diagonal_down_right' |
                'zoom_out_pan_diagonal_up_left' | 'zoom_out_pan_diagonal_up_right' | 'zoom_out_pan_diagonal_down_left' | 'zoom_out_pan_diagonal_down_right',
    speed: 0.8,
    duration: 10,
    fieldOfView: 75,
    depthMultiplier: 1.0,
    amplification: 150, // 100-300%
    spin: 0, // 0-90 degrees
    spinDirection: 'clockwise' as 'clockwise' | 'counterclockwise',
    fadeOut: false, // Nebula fade-out effect disabled by default
    hyperspeed: false, // Hyperspeed motion blur effect disabled by default
    spaceshipEffect: false // Acceleration/deceleration effect disabled by default
  });

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  // Unified image upload handler using new utilities
  const handleImageUpload = useCallback(async (
    event: React.ChangeEvent<HTMLInputElement>,
    setImage: (url: string) => void,
    setElement: (el: HTMLImageElement) => void,
    fileInputRef: React.RefObject<HTMLInputElement>,
    uploadType: 'stars' | 'starless'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      console.error(validation.error);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      // Show upload progress
      setUploadProgress(prev => ({
        ...prev,
        [uploadType]: { show: true, progress: 0, fileName: file.name }
      }));

      // Simulate progress (since loadImageFromFile is quick)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [uploadType]: { 
            ...prev[uploadType], 
            progress: Math.min(prev[uploadType].progress + 20, 90) 
          }
        }));
      }, 100);

      const { dataUrl, element } = await loadImageFromFile(file, {
        enableDownscale: false,
        maxResolution: 4096 * 4096
      });
      
      clearInterval(progressInterval);
      
      // Complete progress
      setUploadProgress(prev => ({
        ...prev,
        [uploadType]: { ...prev[uploadType], progress: 100 }
      }));

      setImage(dataUrl);
      setElement(element);

      // Hide progress after a short delay
      setTimeout(() => {
        setUploadProgress(prev => ({
          ...prev,
          [uploadType]: { show: false, progress: 0, fileName: '' }
        }));
      }, 1000);
    } catch (error) {
      console.error('Image load error:', error);
      setUploadProgress(prev => ({
        ...prev,
        [uploadType]: { show: false, progress: 0, fileName: '' }
      }));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  const handleStarsOnlyUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    return handleImageUpload(event, setStarsOnlyImage, setStarsOnlyElement, starsFileInputRef, 'stars');
  }, [handleImageUpload]);

  const handleStarlessUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    return handleImageUpload(event, setStarlessImage, setStarlessElement, starlessFileInputRef, 'starless');
  }, [handleImageUpload]);

  // Generate depth map from starless image - optimized with chunked processing
  const generateDepthMap = useCallback(async (img: HTMLImageElement): Promise<HTMLCanvasElement> => {
    const canvasPool = CanvasPool.getInstance();
    
    const { result } = await MemoryManager.monitorOperation(async () => {
      // Limit processing resolution for very large images to improve performance
      const maxDimension = 3072;
      const scale =
        Math.max(img.width, img.height) > maxDimension
          ? maxDimension / Math.max(img.width, img.height)
          : 1;
      const targetWidth = Math.round(img.width * scale);
      const targetHeight = Math.round(img.height * scale);

      const canvas = canvasPool.acquire(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d')!;
      
      try {
        // Draw starless image (scaled if necessary)
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Process depth map in chunks for large images
        const processedData = await ChunkedProcessor.processImageInChunks(
          imageData,
          (chunkData) => {
            const data = chunkData.data;
            const result = new ImageData(chunkData.width, chunkData.height);
            
            // Create depth map based on luminance with enhanced blue bias for nebula
            for (let i = 0; i < data.length; i += 4) {
              // Enhanced luminance with blue bias for nebula depth perception
              const luminance = 0.2 * data[i] + 0.5 * data[i + 1] + 0.8 * data[i + 2];
              const enhancedLum = Math.pow(luminance / 255, 0.8) * 255; // Gamma correction for depth
              result.data[i] = enhancedLum;
              result.data[i + 1] = enhancedLum;
              result.data[i + 2] = enhancedLum;
              result.data[i + 3] = 255;
            }
            
            return result;
          },
          undefined,
          (progress) => {
            console.log(`Depth map generation: ${Math.round(progress * 100)}%`);
          }
        );
        
        // Combine chunks back
        let yOffset = 0;
        for (const chunk of processedData) {
          ctx.putImageData(chunk, 0, yOffset);
          yOffset += chunk.height;
        }
        
        // Apply slight blur for smoother depth transitions
        ctx.filter = 'blur(2px)';
        const blurCanvas = canvasPool.acquire(canvas.width, canvas.height);
        const blurCtx = blurCanvas.getContext('2d')!;
        blurCtx.drawImage(canvas, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';
        ctx.drawImage(blurCanvas, 0, 0);
        canvasPool.release(blurCanvas);
        
        return canvas;
      } catch (error) {
        canvasPool.release(canvas);
        throw error;
      }
    }, 'Depth Map Generation');
    return result;
  }, []);

  // Extract star positions with diffraction spike detection (Newtonian cross stars) - optimized
  const extractStarPositions = useCallback((img: HTMLImageElement): StarPosition[] => {
    const canvasPool = CanvasPool.getInstance();
    
    // Limit star extraction resolution for very large images
    const maxDimension = 3072;
    const scale =
      Math.max(img.width, img.height) > maxDimension
        ? maxDimension / Math.max(img.width, img.height)
        : 1;
    const targetWidth = Math.round(img.width * scale);
    const targetHeight = Math.round(img.height * scale);

    const canvas = canvasPool.acquire(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d')!;
    
    try {
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
    
    const stars: StarPosition[] = [];
    const threshold = 100; // Lower threshold to capture diffraction spikes
    const minStarSize = 3; // Minimum pixels for a valid star
    const maxStarSize = 500; // Higher to capture full spike patterns
    const minDistance = 3; // Minimum distance between star centers
    
    // Create a visited map
    const visited = new Uint8Array(canvas.width * canvas.height);
    
    // Scan for bright regions
    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        const idx = y * canvas.width + x;
        if (visited[idx]) continue;
        
        const pixelIdx = idx * 4;
        const luminance = 0.299 * data[pixelIdx] + 0.587 * data[pixelIdx + 1] + 0.114 * data[pixelIdx + 2];
        
        if (luminance > threshold) {
          // Found a bright pixel - grow the star region including spikes
          const starPixels: {x: number, y: number, lum: number}[] = [];
          const queue: {x: number, y: number}[] = [{x, y}];
          visited[idx] = 1;
          
          let minX = x, maxX = x, minY = y, maxY = y;
          let totalLum = 0, maxLum = 0;
          let totalX = 0, totalY = 0;
          
          while (queue.length > 0 && starPixels.length < maxStarSize) {
            const curr = queue.shift()!;
            const currIdx = curr.y * canvas.width + curr.x;
            const currPixelIdx = currIdx * 4;
            const currLum = 0.299 * data[currPixelIdx] + 0.587 * data[currPixelIdx + 1] + 0.114 * data[currPixelIdx + 2];
            
            starPixels.push({x: curr.x, y: curr.y, lum: currLum});
            totalLum += currLum;
            if (currLum > maxLum) maxLum = currLum;
            
            // Weighted centroid calculation
            const weight = currLum * currLum; // Square for emphasis
            totalX += curr.x * weight;
            totalY += curr.y * weight;
            
            minX = Math.min(minX, curr.x);
            maxX = Math.max(maxX, curr.x);
            minY = Math.min(minY, curr.y);
            maxY = Math.max(maxY, curr.y);
            
            // Check 8-connected neighbors for spike detection
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                
                const nx = curr.x + dx;
                const ny = curr.y + dy;
                
                if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                  const nIdx = ny * canvas.width + nx;
                  if (!visited[nIdx]) {
                    const nPixelIdx = nIdx * 4;
                    const nLum = 0.299 * data[nPixelIdx] + 0.587 * data[nPixelIdx + 1] + 0.114 * data[nPixelIdx + 2];
                    
                    // Lower adaptive threshold to capture faint spikes
                    if (nLum > threshold * 0.3) {
                      visited[nIdx] = 1;
                      queue.push({x: nx, y: ny});
                    }
                  }
                }
              }
            }
          }
          
          // Validate star region - allow elongated regions for spikes
          if (starPixels.length >= minStarSize && starPixels.length <= maxStarSize) {
            const totalWeight = starPixels.reduce((sum, p) => sum + p.lum * p.lum, 0);
            const centroidX = Math.round(totalX / totalWeight);
            const centroidY = Math.round(totalY / totalWeight);
            
            // Check minimum distance from existing stars
            const tooClose = stars.some(s => {
              const dx = s.x - centroidX;
              const dy = s.y - centroidY;
              return Math.sqrt(dx * dx + dy * dy) < minDistance;
            });
            
            if (!tooClose) {
              const centerIdx = (centroidY * canvas.width + centroidX) * 4;
              
              // Calculate actual star size including spikes
              const starWidth = maxX - minX + 1;
              const starHeight = maxY - minY + 1;
              const actualSize = Math.max(starWidth, starHeight);
              
              stars.push({
                x: centroidX,
                y: centroidY,
                brightness: maxLum / 255,
                size: actualSize, // Use max dimension for proper size-based layering
                color: {
                  r: data[centerIdx],
                  g: data[centerIdx + 1],
                  b: data[centerIdx + 2]
                }
              });
            }
          }
        }
      }
    }
    
    console.log(`Detected ${stars.length} stars with diffraction spikes`);
    return stars;
    } finally {
      canvasPool.release(canvas);
    }
  }, []);

  const processImages = useCallback(async () => {
    console.log('🔧 [Generator] Starting image processing');
    
    if (!starsOnlyElement || !starlessElement) {
      console.warn('⚠️ [Generator] Missing image elements', {
        hasStarsOnly: !!starsOnlyElement,
        hasStarless: !!starlessElement
      });
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');
    
    try {
      console.log('⭐ [Generator] Extracting star positions...');
      // Extract star positions from stars only image
      const stars = extractStarPositions(starsOnlyElement);
      setDetectedStars(stars);
      console.log(`✅ [Generator] Extracted ${stars.length} stars`);
      
      if (stars.length === 0) {
        console.warn('⚠️ [Generator] No stars detected');
        setCurrentStep('upload');
        return;
      }
      
      console.log('🗺️ [Generator] Generating depth map...');
      // Generate depth map from starless image (now async with chunked processing)
      const depthMap = await generateDepthMap(starlessElement);
      setDepthMapCanvas(depthMap);
      console.log('✅ [Generator] Depth map generated');
      
      // Assign depth to stars based on depth map
      const depthCtx = depthMap.getContext('2d')!;
      const depthData = depthCtx.getImageData(0, 0, depthMap.width, depthMap.height);
      
      // Calculate intensity multiplier (0-100 -> 0.2-2.0)
      const intensityMultiplier = 0.2 + (depthIntensity / 100) * 1.8;
      
      const processedStarsData: ProcessedStarData[] = stars.map(star => {
        // Get depth from depth map at star position
        const depthIdx = (Math.floor(star.y) * depthMap.width + Math.floor(star.x)) * 4;
        const depth = depthData.data[depthIdx] / 255; // 0-1 range
        
        // Convert to 3D coordinates
        const centerX = depthMap.width / 2;
        const centerY = depthMap.height / 2;
        
        // Scale to fit in view frustum with proper aspect ratio
        const scale = 0.08;
        
        return {
          x: (star.x - centerX) * scale,
          y: -(star.y - centerY) * scale, // Invert Y for correct orientation
          z: (depth - 0.5) * 200 * intensityMultiplier, // Apply intensity to depth range
          brightness: star.brightness,
          size: star.size,
          color3d: `rgb(${star.color.r}, ${star.color.g}, ${star.color.b})`,
          originalX: star.x,
          originalY: star.y
        };
      });
      
      setProcessedStars(processedStarsData);
      console.log(`✅ [Generator] Processed ${processedStarsData.length} stars with 3D coordinates`);
      
      // Wait before loading preview to separate the steps
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setCurrentStep('ready');
      
      // Log memory stats
      const memStats = MemoryManager.getMemoryStats();
      console.log('📊 [Generator] Memory after processing:', memStats);
      
    } catch (error) {
      console.error('❌ [Generator] Processing error:', error);
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
      console.log('🏁 [Generator] Image processing complete');
      
      // Trigger cleanup
      MemoryManager.forceGarbageCollection();
    }
  }, [starsOnlyElement, starlessElement, extractStarPositions, generateDepthMap, depthIntensity, t]);

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    console.log('📢 [Generator] Canvas ready callback triggered', {
      hasCanvas: !!canvas,
      canvasSize: canvas ? `${canvas.width}x${canvas.height}` : 'N/A',
      hasContext: canvas ? !!canvas.getContext('2d') : false
    });
    
    if (canvas && canvas.getContext('2d')) {
      canvasRef.current = canvas;
      setIsCanvasReady(true);
      console.log('✅ [Generator] Canvas successfully set and ready');
    } else {
      console.error('❌ [Generator] Canvas is not properly initialized');
    }
  }, []);

  const handleProgressUpdate = useCallback((progress: number) => {
    setAnimationProgress(progress);
    if (progress >= 100) {
      console.log('🎬 [Generator] Animation reached 100%');
      setIsAnimating(false);
    }
  }, []);

  const handleAnimationComplete = useCallback(() => {
    console.log('🏁 [Generator] Animation complete callback');
    setIsAnimating(false);
    setAnimationProgress(100);
    // Don't reset - keep at 100%
  }, []);

  const toggleAnimation = useCallback(() => {
    console.log('🎮 [Generator] Toggle animation:', {
      currentlyAnimating: isAnimating,
      currentProgress: animationProgress
    });
    
    if (isAnimating) {
      // Just pause - don't change anything else
      console.log('⏸️ [Generator] Pausing animation');
      setIsAnimating(false);
    } else {
      // Play/Resume
      if (animationProgress >= 99.9) {
        // Only restart if at the very end
        console.log('🔄 [Generator] Restarting from beginning');
        setAnimationProgress(0);
      } else {
        console.log('▶️ [Generator] Resuming animation from', animationProgress.toFixed(1) + '%');
      }
      // Otherwise just resume from current position
      setIsAnimating(true);
    }
  }, [isAnimating, animationProgress]);

  const handleReplay = useCallback(() => {
    console.log('🔄 [Generator] Replay triggered');
    // Reset to beginning
    setAnimationProgress(0);
    setIsAnimating(false);
    // Small delay then start
    setTimeout(() => {
      console.log('▶️ [Generator] Starting replay animation');
      setIsAnimating(true);
    }, 50);
  }, []);

  const stopRecording = useCallback(() => {
    if (recordingStopCallbackRef.current) {
      recordingStopCallbackRef.current();
    }
  }, []);

  const downloadVideoWebM = useCallback(async () => {
    if (currentStep !== 'ready') {
      return;
    }
    
    setIsGeneratingVideo(true);
    setIsRecording(false);
    setIsAnimating(false);
    
    // Auto-scroll to preview area
    setTimeout(() => {
      const previewContainer = document.querySelector('[data-preview-container]');
      if (previewContainer) {
        previewContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    
    // Wait for any ongoing animation to stop
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      console.log('=== Starting Precise Frame-by-Frame WebM Generation ===');
      setVideoProgress({ stage: 'Initializing...', percent: 0 });
      
      let sourceCanvas = canvasRef.current;
      
      // If canvas ref is null, try to find the canvas element directly
      if (!sourceCanvas) {
        const canvasElements = document.querySelectorAll('canvas');
        for (const canvasEl of canvasElements) {
          if (canvasEl instanceof HTMLCanvasElement && canvasEl.width > 0 && canvasEl.height > 0) {
            sourceCanvas = canvasEl;
            canvasRef.current = sourceCanvas;
            break;
          }
        }
      }
      
      if (!sourceCanvas) {
        throw new Error('Canvas not available');
      }
      
      const sourceWidth = sourceCanvas.width;
      const sourceHeight = sourceCanvas.height;
      
      console.log('Source canvas:', sourceWidth, 'x', sourceHeight);
      
      // CRITICAL: Cap resolution at 1920x1080 for performance
      // Large canvases (>10MP) cause severe frame drops during rendering
      let recordWidth = sourceWidth;
      let recordHeight = sourceHeight;
      const maxWidth = 1920;
      const maxHeight = 1080;
      
      // Calculate megapixels
      const megapixels = (sourceWidth * sourceHeight) / 1000000;
      console.log(`Source canvas: ${megapixels.toFixed(1)}MP`);
      
      if (recordWidth > maxWidth || recordHeight > maxHeight) {
        const scale = Math.min(maxWidth / recordWidth, maxHeight / recordHeight);
        recordWidth = Math.round(recordWidth * scale);
        recordHeight = Math.round(recordHeight * scale);
        const scaledMP = (recordWidth * recordHeight) / 1000000;
        console.log(`Scaled down from ${megapixels.toFixed(1)}MP to ${scaledMP.toFixed(1)}MP (${recordWidth}x${recordHeight})`);
      }
      
      const fps = 30;
      const duration = animationSettings.duration;
      const totalFrames = Math.ceil(duration * fps);
      
      console.log(`Will render ${totalFrames} frames at ${fps}fps with precise frame control`);
      
      // Create offscreen canvas for rendering at reasonable resolution
      const canvasPool = CanvasPool.getInstance();
      const renderCanvas = canvasPool.acquire(recordWidth, recordHeight);
      const renderCtx = renderCanvas.getContext('2d', {
        alpha: false,
        willReadFrequently: false
      })!;
      
      renderCtx.imageSmoothingEnabled = true;
      renderCtx.imageSmoothingQuality = 'high';
      
      // STAGE 1: Pre-render all frames with PRECISE progress control and proper sync
      setVideoProgress({ stage: 'Rendering frames...', percent: 0 });
      console.log('Stage 1: Pre-rendering frames with precise control...');
      console.log(`Note: Each frame render may take 100-500ms depending on complexity`);
      
      const frames: ImageData[] = [];
      
      // Enable controlled rendering mode - stop normal animation
      setIsAnimating(false);
      
      // Add small delay to ensure animation has fully stopped
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Render each frame precisely by controlling animation progress via ref
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        // Calculate exact progress for this frame (0-100)
        const frameProgress = (frameIndex / (totalFrames - 1)) * 100;
        
        // Set progress directly in ref (bypasses React batching)
        videoProgressRef.current = frameProgress;
        
        // Trigger a re-render to update the canvas
        setFrameRenderTrigger(prev => prev + 1);
        
        // IMPROVED: Wait longer for complex rendering with multiple layers
        // Triple RAF + timeout ensures all layers are fully rendered
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => requestAnimationFrame(resolve));
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // Additional wait for very large canvases (give GPU time to finish)
        if (sourceWidth * sourceHeight > 10000000) { // >10MP
          await new Promise(resolve => setTimeout(resolve, 50));
        } else if (sourceWidth * sourceHeight > 5000000) { // >5MP
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        
        // Capture frame from source canvas with high quality scaling
        renderCtx.fillStyle = '#000000';
        renderCtx.fillRect(0, 0, recordWidth, recordHeight);
        
        // Use high-quality scaling for the final render
        renderCtx.imageSmoothingEnabled = true;
        renderCtx.imageSmoothingQuality = 'high';
        renderCtx.drawImage(sourceCanvas, 0, 0, recordWidth, recordHeight);
        
        // Store frame data
        const frameData = renderCtx.getImageData(0, 0, recordWidth, recordHeight);
        frames.push(frameData);
        
        // Update progress
        const renderProgress = (frameIndex / totalFrames) * 50;
        setVideoProgress({ 
          stage: `Rendering frames... ${frameIndex + 1}/${totalFrames}`, 
          percent: renderProgress 
        });
        
        // More frequent logging for large renders
        if ((frameIndex + 1) % 15 === 0 || frameIndex === 0) {
          const timePerFrame = frameIndex > 0 ? 
            ((Date.now() - (window as any)._renderStartTime) / (frameIndex + 1)).toFixed(0) : 
            'N/A';
          console.log(`Rendered ${frameIndex + 1}/${totalFrames} frames (${frameProgress.toFixed(1)}% animation, ~${timePerFrame}ms/frame)`);
        }
        
        // Track render start time
        if (frameIndex === 0) {
          (window as any)._renderStartTime = Date.now();
        }
      }
      
      // Stop animation and log performance stats
      setIsAnimating(false);
      const totalRenderTime = Date.now() - (window as any)._renderStartTime;
      const avgTimePerFrame = totalRenderTime / frames.length;
      console.log(`✓ All ${frames.length} frames rendered with precise timing`);
      console.log(`  Total render time: ${(totalRenderTime / 1000).toFixed(1)}s`);
      console.log(`  Average per frame: ${avgTimePerFrame.toFixed(0)}ms`);
      console.log(`  Render speed: ${(frames.length / (totalRenderTime / 1000)).toFixed(1)} fps`);
      
      // STAGE 2: Encode frames to WebM video
      setVideoProgress({ stage: 'Encoding video...', percent: 50 });
      console.log('Stage 2: Encoding to WebM...');
      
      // Create a temporary canvas for MediaRecorder
      const encodingCanvas = canvasPool.acquire(recordWidth, recordHeight);
      const encodingCtx = encodingCanvas.getContext('2d')!;
      
      // Set up MediaRecorder
      const stream = encodingCanvas.captureStream(fps);
      
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
      
      const bitrate = 25000000; // 25 Mbps
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bitrate
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Play back pre-rendered frames at correct timing
      const frameInterval = 1000 / fps;
      let currentFrame = 0;
      
      const playbackPromise = new Promise<void>((resolve) => {
        const playFrame = () => {
          if (currentFrame >= frames.length) {
            mediaRecorder.stop();
            resolve();
            return;
          }
          
          // Draw frame
          encodingCtx.putImageData(frames[currentFrame], 0, 0);
          currentFrame++;
          
          // Update encoding progress
          const encodeProgress = 50 + ((currentFrame / frames.length) * 50);
          setVideoProgress({ 
            stage: `Encoding... ${currentFrame}/${frames.length}`, 
            percent: encodeProgress 
          });
          
          setTimeout(playFrame, frameInterval);
        };
        
        playFrame();
      });
      
      await playbackPromise;
      
      // Wait for final chunks
      await new Promise<void>((resolve) => {
        mediaRecorder.onstop = () => resolve();
      });
      
      stream.getTracks().forEach(track => track.stop());
      
      console.log(`✓ Encoding complete, ${chunks.length} chunks`);
      
      // Create and download video
      const blob = new Blob(chunks, { type: mimeType });
      const sizeMB = (blob.size / 1024 / 1024).toFixed(2);
      console.log(`✓ Final video: ${sizeMB} MB`);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `starfield-${recordWidth}x${recordHeight}-${duration}s-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Cleanup
      canvasPool.release(renderCanvas);
      canvasPool.release(encodingCanvas);
      
      setVideoProgress({ stage: 'Complete!', percent: 100 });
      setTimeout(() => {
        setIsGeneratingVideo(false);
        setVideoProgress({ stage: '', percent: 0 });
      }, 2000);
      
      MemoryManager.forceGarbageCollection();
      
    } catch (error) {
      console.error('Video generation failed:', error);
      setIsGeneratingVideo(false);
      setVideoProgress({ stage: '', percent: 0 });
    }
  }, [animationSettings.duration, currentStep]);

  const initiateDownload = useCallback(() => {
    // Directly download WebM
    downloadVideoWebM();
  }, [downloadVideoWebM]);

  const resetAll = useCallback(() => {
    // Stop any recording first
    if (isRecording) {
      stopRecording();
    }
    
    // Force stop any ongoing video generation immediately
    setIsGeneratingVideo(false);
    setIsRecording(false);
    
    // Stop animation immediately
    setIsAnimating(false);
    setAnimationProgress(0);
    
    // Reset all images and processing data
    setStarsOnlyImage(null);
    setStarlessImage(null);
    setStarsOnlyElement(null);
    setStarlessElement(null);
    setDetectedStars([]);
    setProcessedStars([]);
    setDepthMapCanvas(null);
    setIsCanvasReady(false);
    setIsProcessing(false);
    setCurrentStep('upload');
    
    // Clear file inputs
    if (starsFileInputRef.current) {
      starsFileInputRef.current.value = '';
    }
    if (starlessFileInputRef.current) {
      starlessFileInputRef.current.value = '';
    }
  }, [isRecording, stopRecording]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full">
          <Video className="h-6 w-6 text-cyan-400" />
          <span className="text-xl font-semibold text-white">
            {t('3D Star Field Generator', '3D星场生成器')}
          </span>
        </div>
        <p className="text-cosmic-300 text-lg max-w-3xl mx-auto">
          {t(
            'Upload stars only and starless images to create stunning fly-through animations with preserved star positions',
            '上传星点图和去星图，创建保留星体位置的令人惊叹的飞越动画'
          )}
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="flex justify-center">
        <div className="flex items-center gap-4 bg-cosmic-900/50 border border-cosmic-700/50 rounded-lg p-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${currentStep === 'upload' ? 'bg-cyan-500/20 text-cyan-300' : (currentStep === 'processing' || currentStep === 'ready' || currentStep === 'generating') ? 'bg-green-500/20 text-green-300' : 'bg-cosmic-800/50 text-cosmic-400'}`}>
            <Upload className="h-4 w-4" />
            <span className="text-sm">{t('1. Upload Images', '1. 上传图像')}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${currentStep === 'processing' ? 'bg-cyan-500/20 text-cyan-300' : currentStep === 'ready' || currentStep === 'generating' ? 'bg-green-500/20 text-green-300' : 'bg-cosmic-800/50 text-cosmic-400'}`}>
            <ImageIcon className="h-4 w-4" />
            <span className="text-sm">{t('2. Process & Map', '2. 处理与映射')}</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${currentStep === 'generating' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cosmic-800/50 text-cosmic-400'}`}>
            <Video className="h-4 w-4" />
            <span className="text-sm">{t('3. Generate', '3. 生成')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Image Upload */}
            <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                    <Upload className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">
                      {t('Upload Images', '上传图像')}
                    </CardTitle>
                    <CardDescription className="text-cosmic-400">
                      {t('Upload stars only and starless images separately', '分别上传星点图和去星图')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-cosmic-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {t('Stars Only Image', '星点图')}
                </Label>
                <input
                  ref={starsFileInputRef}
                  type="file"
                  accept="image/*,.fits,.fit,.tiff,.tif"
                  onChange={handleStarsOnlyUpload}
                  className="hidden"
                />
                
                {uploadProgress.stars.show && (
                  <UploadProgress 
                    show={true}
                    progress={uploadProgress.stars.progress}
                    fileName={uploadProgress.stars.fileName}
                  />
                )}
                
                {!starsOnlyElement ? (
                  <Button
                    onClick={() => starsFileInputRef.current?.click()}
                    className="group w-full h-24 bg-cosmic-800/50 hover:bg-orange-500/10 border-2 border-dashed border-cosmic-600 hover:border-orange-500/50 transition-all"
                    variant="outline"
                    disabled={uploadProgress.stars.show || isProcessing}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-cosmic-400 group-hover:text-orange-400 transition-colors" />
                      <span className="text-sm text-cosmic-300 group-hover:hidden">
                        {t('Click to upload', '点击上传')}
                      </span>
                      <span className="text-sm text-orange-400 hidden group-hover:block">
                        {t('Stars Only', '星点图')}
                      </span>
                    </div>
                  </Button>
                ) : (
                  <div className="relative group cursor-pointer" onClick={() => starsFileInputRef.current?.click()}>
                    <img
                      src={starsOnlyImage!}
                      alt="Stars Preview"
                      className="w-full h-40 object-cover rounded-lg border-2 border-orange-500/50 hover:border-orange-500 transition-all"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Upload className="w-8 h-8 text-orange-400" />
                    </div>
                    <span className="text-xs text-cosmic-400 mt-1 block text-center">
                      {starsOnlyElement.width} × {starsOnlyElement.height}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-cosmic-200 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {t('Starless Image (Background)', '无星图像（背景）')}
                </Label>
                <input
                  ref={starlessFileInputRef}
                  type="file"
                  accept="image/*,.fits,.fit,.tiff,.tif"
                  onChange={handleStarlessUpload}
                  className="hidden"
                />
                
                {uploadProgress.starless.show && (
                  <UploadProgress 
                    show={true}
                    progress={uploadProgress.starless.progress}
                    fileName={uploadProgress.starless.fileName}
                  />
                )}
                
                {!starlessElement ? (
                  <Button
                    onClick={() => starlessFileInputRef.current?.click()}
                    className="group w-full h-24 bg-cosmic-800/50 hover:bg-purple-500/10 border-2 border-dashed border-cosmic-600 hover:border-purple-500/50 transition-all"
                    variant="outline"
                    disabled={uploadProgress.starless.show || isProcessing}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-cosmic-400 group-hover:text-purple-400 transition-colors" />
                      <span className="text-sm text-cosmic-300 group-hover:hidden">
                        {t('Click to upload', '点击上传')}
                      </span>
                      <span className="text-sm text-purple-400 hidden group-hover:block">
                        {t('Starless', '无星图像')}
                      </span>
                    </div>
                  </Button>
                ) : (
                  <div className="relative group cursor-pointer" onClick={() => starlessFileInputRef.current?.click()}>
                    <img
                      src={starlessImage!}
                      alt="Starless Preview"
                      className="w-full h-40 object-cover rounded-lg border-2 border-purple-500/50 hover:border-purple-500 transition-all"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Upload className="w-8 h-8 text-purple-400" />
                    </div>
                    <span className="text-xs text-cosmic-400 mt-1 block text-center">
                      {starlessElement.width} × {starlessElement.height}
                    </span>
                  </div>
                )}
              </div>
              
              {starsOnlyElement && starlessElement && (
                <>
                  <Button
                    onClick={processImages}
                    disabled={isProcessing}
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/20"
                  >
                    {isProcessing ? t('Processing...', '处理中...') : t('Process & Generate', '处理并生成')}
                  </Button>
                  
                  {isProcessing && (
                    <div className="space-y-2 mt-4">
                      <div className="w-full h-2 bg-cosmic-800/60 rounded-full overflow-hidden border border-cosmic-700/30">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300 animate-pulse"
                          style={{ width: '100%' }}
                        />
                      </div>
                      <p className="text-xs text-cosmic-300 text-center">
                        {t('Processing images and generating 3D data...', '正在处理图像并生成3D数据...')}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

            {/* Detection Info */}
            {detectedStars.length > 0 && (
              <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                      <ImageIcon className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white">
                        {t('Processing Results', '处理结果')}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-cosmic-800/30 rounded-lg border border-cosmic-700/30">
                  <div className="text-white text-sm font-medium">{t('Detected Stars', '检测到的星体')}</div>
                  <div className="text-cosmic-300 text-sm">{detectedStars.length}</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-cosmic-800/30 rounded-lg border border-cosmic-700/30">
                  <div className="text-white text-sm font-medium">{t('Depth Map', '深度图')}</div>
                  <div className="text-green-400 text-sm">{depthMapCanvas ? '✓ Generated' : 'Pending'}</div>
                </div>
              </CardContent>
            </Card>
          )}

            {/* Motion Controls */}
            {currentStep === 'ready' && (
              <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                        <Play className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">
                          {t('Motion Settings', '动作设置')}
                        </CardTitle>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAnimationSettings({
                          motionType: 'zoom_in',
                          speed: 0.8,
                          duration: 10,
                          fieldOfView: 75,
                          depthMultiplier: 1.0,
                          amplification: 150,
                          spin: 0,
                          spinDirection: 'clockwise',
                          fadeOut: false,
                          hyperspeed: false,
                          spaceshipEffect: false
                        });
                        setDepthIntensity(400);
                        setPreserveStarsIntensity(100);
                      }}
                      className="h-8 gap-2 text-xs bg-cosmic-800/50 hover:bg-cosmic-700/50 border-cosmic-600"
                    >
                      <RotateCcw className="w-3 h-3" />
                      {t('Reset', '重置')}
                    </Button>
                  </div>
                </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-cosmic-200">{t('Motion Type', '动作类型')}</Label>
                  <Select
                    value={animationSettings.motionType}
                    onValueChange={(value) => setAnimationSettings(prev => ({...prev, motionType: value as any}))}
                  >
                    <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-cosmic-800 border-cosmic-700">
                      <SelectItem value="zoom_in" className="text-white hover:bg-cosmic-700">
                        {t('Zoom In (Fly Forward)', '放大（向前飞行）')}
                      </SelectItem>
                      <SelectItem value="zoom_out" className="text-white hover:bg-cosmic-700">
                        {t('Zoom Out (Fly Backward)', '缩小（向后飞行）')}
                      </SelectItem>
                      <SelectItem value="pan_left" className="text-white hover:bg-cosmic-700">
                        {t('Pan Left', '向左平移')}
                      </SelectItem>
                      <SelectItem value="pan_right" className="text-white hover:bg-cosmic-700">
                        {t('Pan Right', '向右平移')}
                      </SelectItem>
                      <SelectItem value="zoom_in_pan_left" className="text-white hover:bg-cosmic-700">
                        {t('Zoom In + Pan Left', '放大 + 左移')}
                      </SelectItem>
                      <SelectItem value="zoom_in_pan_right" className="text-white hover:bg-cosmic-700">
                        {t('Zoom In + Pan Right', '放大 + 右移')}
                      </SelectItem>
                      <SelectItem value="zoom_out_pan_left" className="text-white hover:bg-cosmic-700">
                        {t('Zoom Out + Pan Left', '缩小 + 左移')}
                      </SelectItem>
                      <SelectItem value="zoom_out_pan_right" className="text-white hover:bg-cosmic-700">
                        {t('Zoom Out + Pan Right', '缩小 + 右移')}
                      </SelectItem>
                      <SelectItem value="pan_up" className="text-white hover:bg-cosmic-700">
                        {t('Pan Up', '向上平移')}
                      </SelectItem>
                      <SelectItem value="pan_down" className="text-white hover:bg-cosmic-700">
                        {t('Pan Down', '向下平移')}
                      </SelectItem>
                      <SelectItem value="zoom_in_pan_up" className="text-white hover:bg-cosmic-700">
                        {t('Zoom In + Pan Up', '放大 + 上移')}
                      </SelectItem>
                      <SelectItem value="zoom_in_pan_down" className="text-white hover:bg-cosmic-700">
                        {t('Zoom In + Pan Down', '放大 + 下移')}
                      </SelectItem>
                      <SelectItem value="zoom_out_pan_up" className="text-white hover:bg-cosmic-700">
                        {t('Zoom Out + Pan Up', '缩小 + 上移')}
                      </SelectItem>
                      <SelectItem value="zoom_out_pan_down" className="text-white hover:bg-cosmic-700">
                        {t('Zoom Out + Pan Down', '缩小 + 下移')}
                      </SelectItem>
                      <SelectItem value="pan_diagonal_up_left" className="text-white hover:bg-cosmic-700">
                        {t('Pan Diagonal Up-Left', '对角线左上')}
                      </SelectItem>
                      <SelectItem value="pan_diagonal_up_right" className="text-white hover:bg-cosmic-700">
                        {t('Pan Diagonal Up-Right', '对角线右上')}
                      </SelectItem>
                      <SelectItem value="pan_diagonal_down_left" className="text-white hover:bg-cosmic-700">
                        {t('Pan Diagonal Down-Left', '对角线左下')}
                      </SelectItem>
                      <SelectItem value="pan_diagonal_down_right" className="text-white hover:bg-cosmic-700">
                        {t('Pan Diagonal Down-Right', '对角线右下')}
                      </SelectItem>
                      <SelectItem value="zoom_in_pan_diagonal_up_left" className="text-white hover:bg-cosmic-700">
                        {t('Zoom In + Diagonal Up-Left', '放大 + 对角线左上')}
                      </SelectItem>
                      <SelectItem value="zoom_in_pan_diagonal_up_right" className="text-white hover:bg-cosmic-700">
                        {t('Zoom In + Diagonal Up-Right', '放大 + 对角线右上')}
                      </SelectItem>
                      <SelectItem value="zoom_in_pan_diagonal_down_left" className="text-white hover:bg-cosmic-700">
                        {t('Zoom In + Diagonal Down-Left', '放大 + 对角线左下')}
                      </SelectItem>
                      <SelectItem value="zoom_in_pan_diagonal_down_right" className="text-white hover:bg-cosmic-700">
                        {t('Zoom In + Diagonal Down-Right', '放大 + 对角线右下')}
                      </SelectItem>
                      <SelectItem value="zoom_out_pan_diagonal_up_left" className="text-white hover:bg-cosmic-700">
                        {t('Zoom Out + Diagonal Up-Left', '缩小 + 对角线左上')}
                      </SelectItem>
                      <SelectItem value="zoom_out_pan_diagonal_up_right" className="text-white hover:bg-cosmic-700">
                        {t('Zoom Out + Diagonal Up-Right', '缩小 + 对角线右上')}
                      </SelectItem>
                      <SelectItem value="zoom_out_pan_diagonal_down_left" className="text-white hover:bg-cosmic-700">
                        {t('Zoom Out + Diagonal Down-Left', '缩小 + 对角线左下')}
                      </SelectItem>
                      <SelectItem value="zoom_out_pan_diagonal_down_right" className="text-white hover:bg-cosmic-700">
                        {t('Zoom Out + Diagonal Down-Right', '缩小 + 对角线右下')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-cosmic-200">{t('Motion Amplification', '动作放大')}</Label>
                    <span className="text-cosmic-300 text-sm font-semibold">{animationSettings.amplification}%</span>
                  </div>
                  <Slider
                    value={[animationSettings.amplification]}
                    onValueChange={(value) => setAnimationSettings(prev => ({
                      ...prev, 
                    amplification: value[0],
                    speed: (value[0] / 100) * (60 / prev.duration) // Calculate speed based on amplification and duration
                  }))}
                  min={20}
                  max={300}
                    step={10}
                    className="w-full"
                  />
                  <p className="text-xs text-cosmic-400">
                    {t('Higher amplification = faster motion through space', '更高的放大倍数 = 更快的空间移动速度')}
                  </p>
                  
                  {/* Fade-out toggle */}
                  <div className="flex items-center justify-between p-3 bg-cosmic-800/30 rounded-lg border border-cosmic-700/30 mt-3">
                    <div className="flex-1">
                      <Label className="text-cosmic-200 text-sm font-medium">
                        {t('Nebula Fade-Out Effect', '星云淡出效果')}
                      </Label>
                      <p className="text-xs text-cosmic-400 mt-1">
                        {t('Gradually fade nebula during video generation (recommended for immersive effect)', '在视频生成过程中逐渐淡出星云（推荐用于沉浸式效果）')}
                      </p>
                    </div>
                    <Switch
                      checked={animationSettings.fadeOut}
                      onCheckedChange={(checked) => setAnimationSettings(prev => ({ ...prev, fadeOut: checked }))}
                      className="ml-4"
                    />
                  </div>

                  {/* Hyperspeed toggle */}
                  <div className="flex items-center justify-between p-3 bg-cosmic-800/30 rounded-lg border border-cosmic-700/30 mt-3">
                    <div className="flex-1">
                      <Label className="text-cosmic-200 text-sm font-medium">
                        {t('Hyperspeed Effect', '超光速效果')}
                      </Label>
                      <p className="text-xs text-cosmic-400 mt-1">
                        {t('Add motion blur during animation for Star Wars-like hyperspeed effect', '在动画过程中添加运动模糊以实现星战般的超光速效果')}
                      </p>
                    </div>
                    <Switch
                      checked={animationSettings.hyperspeed}
                      onCheckedChange={(checked) => setAnimationSettings(prev => ({ ...prev, hyperspeed: checked }))}
                      className="ml-4"
                    />
                  </div>

                  {/* Spaceship Effect toggle */}
                  <div className="flex items-center justify-between p-3 bg-cosmic-800/30 rounded-lg border border-cosmic-700/30 mt-3">
                    <div className="flex-1">
                      <Label className="text-cosmic-200 text-sm font-medium">
                        {t('Spaceship Effect', '飞船效果')}
                      </Label>
                      <p className="text-xs text-cosmic-400 mt-1">
                        {t('Accelerate at start and decelerate at end like a spaceship', '像飞船一样在开始时加速，在结束时减速')}
                      </p>
                    </div>
                    <Switch
                      checked={animationSettings.spaceshipEffect}
                      onCheckedChange={(checked) => setAnimationSettings(prev => ({ ...prev, spaceshipEffect: checked }))}
                      className="ml-4"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-cosmic-200">{t('Spin Angle', '旋转角度')}</Label>
                    <span className="text-cosmic-300 text-sm font-semibold">{animationSettings.spin}°</span>
                  </div>
                  <Slider
                    value={[animationSettings.spin]}
                    onValueChange={(value) => setAnimationSettings(prev => ({
                      ...prev, 
                      spin: value[0]
                    }))}
                    min={0}
                    max={90}
                    step={5}
                    className="w-full"
                  />
                  <div className="space-y-2">
                    <Label className="text-cosmic-200 text-xs">{t('Spin Direction', '旋转方向')}</Label>
                    <RadioGroup
                      value={animationSettings.spinDirection}
                      onValueChange={(value: 'clockwise' | 'counterclockwise') => 
                        setAnimationSettings(prev => ({ ...prev, spinDirection: value }))
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="clockwise" id="clockwise" />
                        <Label htmlFor="clockwise" className="text-cosmic-300 text-sm cursor-pointer">
                          {t('Clockwise', '顺时针')}
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="counterclockwise" id="counterclockwise" />
                        <Label htmlFor="counterclockwise" className="text-cosmic-300 text-sm cursor-pointer">
                          {t('Counter-clockwise', '逆时针')}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <p className="text-xs text-cosmic-400">
                    {t('Rotation angle during animation (0° = no rotation)', '动画期间的旋转角度（0° = 无旋转）')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-cosmic-200">{t('3D Intensity', '3D强度')}</Label>
                    <span className="text-amber-400 font-mono text-sm font-semibold">{depthIntensity}%</span>
                  </div>
                  <Slider
                    value={[depthIntensity]}
                    onValueChange={(value) => setDepthIntensity(value[0])}
                    min={0}
                    max={500}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-cosmic-400">
                    {t('Controls the depth range of the 3D parallax effect (higher = more dramatic)', '控制3D视差效果的深度范围（越高越戏剧化）')}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-cosmic-200">{t('Duration (seconds)', '持续时间（秒）')}</Label>
                    <span className="text-amber-400 font-mono text-sm font-semibold">{animationSettings.duration}s</span>
                  </div>
                  <Slider
                    value={[animationSettings.duration]}
                    onValueChange={(value) => setAnimationSettings(prev => ({
                      ...prev, 
                      duration: value[0],
                      speed: (prev.amplification / 100) * (60 / value[0]) // Recalculate speed when duration changes
                    }))}
                    min={5}
                    max={60}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-cosmic-200">
                      {t('Star Preservation Intensity', '星体保留强度')}
                    </Label>
                    <span className="text-cosmic-300 text-sm font-semibold">{preserveStarsIntensity}%</span>
                  </div>
                  <Slider
                    value={[preserveStarsIntensity]}
                    onValueChange={(value) => setPreserveStarsIntensity(value[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-cosmic-400">
                    {t('0% = clean cores only, 100% = preserve all star halos and details', '0% = 仅清洁星核, 100% = 保留所有星晕和细节')}
                  </p>
                </div>

                <Button
                  onClick={toggleAnimation}
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/20"
                >
                  {isAnimating ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      {t('Pause Preview', '暂停预览')}
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {t('Preview Animation', '预览动画')}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex gap-3">
              {currentStep !== 'upload' && (
                <Button
                  onClick={resetAll}
                  variant="outline"
                  className="flex-1 border-cosmic-700/50 hover:bg-cosmic-800/50"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('Back to Step 1', '返回步骤1')}
                </Button>
              )}
              
              {currentStep === 'ready' && !isRecording && (
                <Button
                  onClick={initiateDownload}
                  disabled={isGeneratingVideo || processedStars.length === 0}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGeneratingVideo 
                    ? t('Recording...', '录制中...') 
                    : t('Download Video', '下载视频')
                  }
                </Button>
              )}
              
              {isRecording && (
                <Button
                  onClick={stopRecording}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  {t('Stop Recording', '停止录制')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - 3D Preview */}
        <div className="lg:col-span-2">
          <Card className="bg-cosmic-900/50 border-cosmic-700/50 h-[600px]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Video className="h-5 w-5" />
                {t('3D Star Field Preview', '3D星场预览')}
              </CardTitle>
              <CardDescription className="text-cosmic-400">
                {processedStars.length > 0 
                  ? t(`Showing ${processedStars.length} stars with depth mapping`, `显示${processedStars.length}颗带深度映射的星体`)
                  : t('Upload both images and process to see the 3D preview', '上传并处理两张图像以查看3D预览')
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] p-0" data-preview-container>
              <div className="space-y-2">
                {/* Video Generation Progress Overlay */}
                {isGeneratingVideo && videoProgress.stage && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-cosmic-950/95 via-cosmic-900/95 to-cosmic-950/95 backdrop-blur-md rounded-lg animate-fade-in">
                    <div className="max-w-lg w-full mx-6 animate-scale-in">
                      <div className="relative p-8 bg-gradient-to-br from-cosmic-900/90 to-cosmic-950/90 border-2 border-cosmic-700/40 rounded-2xl shadow-2xl backdrop-blur-sm">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 rounded-2xl blur-xl"></div>
                        
                        <div className="relative space-y-6">
                          {/* Header with icon */}
                          <div className="text-center space-y-3">
                            <div className="flex items-center justify-center gap-3">
                              <div className="relative">
                                <Video className="h-7 w-7 text-blue-400 animate-pulse" />
                                <div className="absolute inset-0 animate-ping">
                                  <Video className="h-7 w-7 text-blue-400 opacity-20" />
                                </div>
                              </div>
                              <h3 className="text-white font-bold text-2xl tracking-tight">
                                {t('Generating Video', '生成视频中')}
                              </h3>
                            </div>
                            <p className="text-cosmic-200 text-base font-medium">{videoProgress.stage}</p>
                          </div>
                          
                          {/* Progress section */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-base">
                              <span className="text-cosmic-300 font-medium">{t('Progress', '进度')}</span>
                              <span className="text-white font-bold text-lg tabular-nums">{Math.round(videoProgress.percent)}%</span>
                            </div>
                            
                            {/* Enhanced progress bar */}
                            <div className="relative">
                              <div className="w-full h-4 bg-cosmic-800/60 rounded-full overflow-hidden border border-cosmic-700/30 shadow-inner">
                                <div 
                                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 relative transition-all duration-500 ease-out shadow-lg"
                                  style={{ width: `${videoProgress.percent}%` }}
                                >
                                  {/* Shine effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                                </div>
                              </div>
                              {/* Glow under progress bar */}
                              <div 
                                className="absolute -bottom-2 left-0 h-3 bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-emerald-500/40 blur-lg transition-all duration-500"
                                style={{ width: `${videoProgress.percent}%` }}
                              ></div>
                            </div>
                          </div>
                          
                          {/* Status message */}
                          <div className="pt-2">
                            <p className="text-sm text-cosmic-300 text-center leading-relaxed px-4">
                              {videoProgress.percent < 50 
                                ? t('Rendering video frames...', '正在渲染视频帧...')
                                : t('Encoding frames to video format...', '将帧编码为视频格式...')
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <StarField3D
                  stars={processedStars}
                  settings={animationSettings}
                  isAnimating={isAnimating}
                  isRecording={false}
                  backgroundImage={starlessImage}
                  starsOnlyImage={starsOnlyImage}
                  onCanvasReady={handleCanvasReady}
                  onProgressUpdate={handleProgressUpdate}
                  onAnimationComplete={handleAnimationComplete}
                  controlledProgress={isGeneratingVideo ? videoProgressRef.current : undefined}
                  videoProgressRef={isGeneratingVideo ? videoProgressRef : undefined}
                  frameRenderTrigger={frameRenderTrigger}
                  externalProgress={animationProgress}
                  depthIntensity={depthIntensity}
                  preserveStarsIntensity={preserveStarsIntensity}
                />
                
                {/* Progress Bar and Controls */}
                {processedStars.length > 0 && (
                  <VideoPlayerControls
                    isPlaying={isAnimating}
                    progress={animationProgress}
                    duration={animationSettings.duration}
                    onPlayPause={toggleAnimation}
                    onReplay={handleReplay}
                    disabled={isGeneratingVideo}
                    className="px-4 pb-3"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StarFieldGenerator;