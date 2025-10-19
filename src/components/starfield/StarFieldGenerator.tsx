import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Play, Pause, Download, RotateCcw, Video, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import StarField3D from './StarField3D';
import UTIF from 'utif';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { CanvasPool } from '@/lib/performance/CanvasPool';
import { MemoryManager } from '@/lib/performance/MemoryManager';
import { ChunkedProcessor } from '@/lib/performance/ChunkedProcessor';

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
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const [videoProgress, setVideoProgress] = useState({ stage: '', percent: 0 });
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
  const [mp4Progress, setMp4Progress] = useState(0);
  const [mp4Blob, setMp4Blob] = useState<Blob | null>(null);
  const [isEncodingMP4, setIsEncodingMP4] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const starsFileInputRef = useRef<HTMLInputElement>(null);
  const starlessFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStopCallbackRef = useRef<(() => void) | null>(null);

  // Animation settings with motion controls
  const [animationSettings, setAnimationSettings] = useState({
    motionType: 'zoom_in' as 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right',
    speed: 1.5,
    duration: 10,
    fieldOfView: 75,
    depthMultiplier: 1.0,
    amplification: 150, // 100-300%
    spin: 0, // 0-90 degrees
    spinDirection: 'clockwise' as 'clockwise' | 'counterclockwise',
    enableDownscale: false // User-controlled downscaling
  });

  const t = (en: string, zh: string) => language === 'en' ? en : zh;
  
  // Initialize FFmpeg instance (but don't load it yet - load on demand)
  useEffect(() => {
    if (!ffmpegRef.current) {
      const ffmpeg = new FFmpeg();
      
      // Add logging callbacks
      ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]:', message);
      });
      
      ffmpeg.on('progress', ({ progress, time }) => {
        console.log('[FFmpeg Progress]:', `${Math.round(progress * 100)}%`, time);
        setMp4Progress(50 + (progress * 40)); // FFmpeg progress from 50% to 90%
      });
      
      ffmpegRef.current = ffmpeg;
      console.log('FFmpeg instance created (not loaded yet)');
    }
  }, []);
  
  
  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const decodeTiffToDataUrl = useCallback(async (arrayBuffer: ArrayBuffer, enableDownscale: boolean): Promise<string> => {
    const canvasPool = CanvasPool.getInstance();
    
    try {
      const ifds = UTIF.decode(arrayBuffer);
      UTIF.decodeImage(arrayBuffer, ifds[0]);
      const rgba = UTIF.toRGBA8(ifds[0]);
      
      const width = ifds[0].width;
      const height = ifds[0].height;
      
      let targetWidth = width;
      let targetHeight = height;
      
      // Only downscale if user has enabled it
      if (enableDownscale) {
        // Calculate optimal scale for large images
        const isHighResolution = width * height > 4096 * 4096; // 16MP threshold
        
        if (isHighResolution) {
          const scale = Math.sqrt(4096 * 4096 / (width * height));
          targetWidth = Math.floor(width * scale);
          targetHeight = Math.floor(height * scale);
          console.log(`📐 User downscaling: ${width}x${height} → ${targetWidth}x${targetHeight} (${(scale * 100).toFixed(0)}%)`);
        } else {
          console.log(`✓ Image size ${width}x${height} within limits, no downscaling needed`);
        }
      }
      
      // Use canvas pool
      const canvas = canvasPool.acquire(targetWidth, targetHeight);
      const ctx = canvas.getContext('2d')!;
      
      try {
        if (targetWidth !== width || targetHeight !== height) {
          // Create temp canvas with original size for downscaling
          const tempCanvas = canvasPool.acquire(width, height);
          const tempCtx = tempCanvas.getContext('2d')!;
          
          const imageData = tempCtx.createImageData(width, height);
          imageData.data.set(rgba);
          tempCtx.putImageData(imageData, 0, 0);
          
          // Downscale with high quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);
          
          canvasPool.release(tempCanvas);
        } else {
          const imageData = ctx.createImageData(targetWidth, targetHeight);
          imageData.data.set(rgba);
          ctx.putImageData(imageData, 0, 0);
        }
        
        const dataUrl = canvas.toDataURL('image/png');
        return dataUrl;
      } finally {
        canvasPool.release(canvas);
      }
    } catch (error) {
      console.error('TIFF decode error:', error);
      throw new Error('Failed to decode TIFF file. The file may be too large or corrupted.');
    }
  }, []);


  const handleStarsOnlyUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file format
    const validExtensions = ['.jpg', '.jpeg', '.png', '.fits', '.fit', '.tiff', '.tif', '.bmp', '.webp'];
    const fileName = file.name.toLowerCase();
    const isValidFormat = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidFormat) {
      if (starsFileInputRef.current) starsFileInputRef.current.value = '';
      return;
    }

    // Validate file size (500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      if (starsFileInputRef.current) starsFileInputRef.current.value = '';
      return;
    }

    const isTiff = fileName.endsWith('.tiff') || fileName.endsWith('.tif');
    
    if (isTiff) {
      // Handle TIFF files with UTIF decoder
      const arrayBufferReader = new FileReader();
      arrayBufferReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const dataUrl = await decodeTiffToDataUrl(arrayBuffer, animationSettings.enableDownscale);
          setStarsOnlyImage(dataUrl);
          
          const img = new Image();
          img.onload = () => {
            setStarsOnlyElement(img);
          };
          img.onerror = () => {
            setStarsOnlyImage(null);
            if (starsFileInputRef.current) starsFileInputRef.current.value = '';
          };
          img.src = dataUrl;
        } catch (error) {
          if (starsFileInputRef.current) starsFileInputRef.current.value = '';
        }
      };
      arrayBufferReader.readAsArrayBuffer(file);
    } else {
      // Handle standard image formats
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        
        if (animationSettings.enableDownscale) {
          // Apply downscaling if enabled
          const img = new Image();
          img.onload = async () => {
            const isHighResolution = img.width * img.height > 4096 * 4096; // 16MP
            
            if (isHighResolution) {
              const canvasPool = CanvasPool.getInstance();
              const scale = Math.sqrt(4096 * 4096 / (img.width * img.height));
              const targetWidth = Math.floor(img.width * scale);
              const targetHeight = Math.floor(img.height * scale);
              
              console.log(`📐 User downscaling: ${img.width}x${img.height} → ${targetWidth}x${targetHeight}`);
              
              const canvas = canvasPool.acquire(targetWidth, targetHeight);
              const ctx = canvas.getContext('2d')!;
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              
              const optimizedDataUrl = canvas.toDataURL('image/png', 0.95);
              canvasPool.release(canvas);
              
              setStarsOnlyImage(optimizedDataUrl);
              const optimizedImg = new Image();
              optimizedImg.onload = () => setStarsOnlyElement(optimizedImg);
              optimizedImg.src = optimizedDataUrl;
            } else {
              console.log(`✓ Image size ${img.width}x${img.height} within limits, no downscaling needed`);
              setStarsOnlyImage(result);
              setStarsOnlyElement(img);
            }
          };
          img.onerror = () => {
            setStarsOnlyImage(null);
            if (starsFileInputRef.current) starsFileInputRef.current.value = '';
          };
          img.src = result;
        } else {
          // No downscaling, use original
          setStarsOnlyImage(result);
          const img = new Image();
          img.onload = () => setStarsOnlyElement(img);
          img.onerror = () => {
            setStarsOnlyImage(null);
            if (starsFileInputRef.current) starsFileInputRef.current.value = '';
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file);
    }
  }, [decodeTiffToDataUrl, animationSettings.enableDownscale]);

  const handleStarlessUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file format
    const validExtensions = ['.jpg', '.jpeg', '.png', '.fits', '.fit', '.tiff', '.tif', '.bmp', '.webp'];
    const fileName = file.name.toLowerCase();
    const isValidFormat = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidFormat) {
      if (starlessFileInputRef.current) starlessFileInputRef.current.value = '';
      return;
    }

    // Validate file size (500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      if (starlessFileInputRef.current) starlessFileInputRef.current.value = '';
      return;
    }

    const isTiff = fileName.endsWith('.tiff') || fileName.endsWith('.tif');
    
    if (isTiff) {
      // Handle TIFF files with UTIF decoder
      const arrayBufferReader = new FileReader();
      arrayBufferReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const dataUrl = await decodeTiffToDataUrl(arrayBuffer, animationSettings.enableDownscale);
          setStarlessImage(dataUrl);
          
          const img = new Image();
          img.onload = () => {
            setStarlessElement(img);
          };
          img.onerror = () => {
            setStarlessImage(null);
            if (starlessFileInputRef.current) starlessFileInputRef.current.value = '';
          };
          img.src = dataUrl;
        } catch (error) {
          if (starlessFileInputRef.current) starlessFileInputRef.current.value = '';
        }
      };
      arrayBufferReader.readAsArrayBuffer(file);
    } else {
      // Handle standard image formats
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        
        if (animationSettings.enableDownscale) {
          // Apply downscaling if enabled
          const img = new Image();
          img.onload = async () => {
            const isHighResolution = img.width * img.height > 4096 * 4096; // 16MP
            
            if (isHighResolution) {
              const canvasPool = CanvasPool.getInstance();
              const scale = Math.sqrt(4096 * 4096 / (img.width * img.height));
              const targetWidth = Math.floor(img.width * scale);
              const targetHeight = Math.floor(img.height * scale);
              
              console.log(`📐 User downscaling: ${img.width}x${img.height} → ${targetWidth}x${targetHeight}`);
              
              const canvas = canvasPool.acquire(targetWidth, targetHeight);
              const ctx = canvas.getContext('2d')!;
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
              
              const optimizedDataUrl = canvas.toDataURL('image/png', 0.95);
              canvasPool.release(canvas);
              
              setStarlessImage(optimizedDataUrl);
              const optimizedImg = new Image();
              optimizedImg.onload = () => setStarlessElement(optimizedImg);
              optimizedImg.src = optimizedDataUrl;
            } else {
              console.log(`✓ Image size ${img.width}x${img.height} within limits, no downscaling needed`);
              setStarlessImage(result);
              setStarlessElement(img);
            }
          };
          img.onerror = () => {
            setStarlessImage(null);
            if (starlessFileInputRef.current) starlessFileInputRef.current.value = '';
          };
          img.src = result;
        } else {
          // No downscaling, use original
          setStarlessImage(result);
          const img = new Image();
          img.onload = () => setStarlessElement(img);
          img.onerror = () => {
            setStarlessImage(null);
            if (starlessFileInputRef.current) starlessFileInputRef.current.value = '';
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file);
    }
  }, [decodeTiffToDataUrl, animationSettings.enableDownscale]);

  // Generate depth map from starless image - optimized with chunked processing
  const generateDepthMap = useCallback(async (img: HTMLImageElement): Promise<HTMLCanvasElement> => {
    const canvasPool = CanvasPool.getInstance();
    
    const { result } = await MemoryManager.monitorOperation(async () => {
      const canvas = canvasPool.acquire(img.width, img.height);
      const ctx = canvas.getContext('2d')!;
      
      try {
        // Draw starless image
        ctx.drawImage(img, 0, 0);
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
    const canvas = canvasPool.acquire(img.width, img.height);
    const ctx = canvas.getContext('2d')!;
    
    try {
      ctx.drawImage(img, 0, 0);
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
    if (!starsOnlyElement || !starlessElement) {
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');
    
    try {
      // Extract star positions from stars only image
      const stars = extractStarPositions(starsOnlyElement);
      setDetectedStars(stars);
      
      if (stars.length === 0) {
        setCurrentStep('upload');
        return;
      }
      
      // Generate depth map from starless image (now async with chunked processing)
      const depthMap = await generateDepthMap(starlessElement);
      setDepthMapCanvas(depthMap);
      
      // Assign depth to stars based on depth map
      const depthCtx = depthMap.getContext('2d')!;
      const depthData = depthCtx.getImageData(0, 0, depthMap.width, depthMap.height);
      
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
          z: (depth - 0.5) * 200, // Spread depth from -100 to 100
          brightness: star.brightness,
          size: star.size,
          color3d: `rgb(${star.color.r}, ${star.color.g}, ${star.color.b})`,
          originalX: star.x,
          originalY: star.y
        };
      });
      
      setProcessedStars(processedStarsData);
      setCurrentStep('ready');
      
      // Log memory stats
      const memStats = MemoryManager.getMemoryStats();
      console.log('Memory after processing:', memStats);
      
    } catch (error) {
      console.error('Processing error:', error);
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
      
      // Trigger cleanup
      MemoryManager.forceGarbageCollection();
    }
  }, [starsOnlyElement, starlessElement, extractStarPositions, generateDepthMap, t]);

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    console.log('Canvas ready callback triggered', canvas);
    if (canvas && canvas.getContext('2d')) {
      canvasRef.current = canvas;
      setIsCanvasReady(true);
      console.log('Canvas successfully set and ready');
    } else {
      console.error('Canvas is not properly initialized');
    }
  }, []);

  const handleProgressUpdate = useCallback((progress: number) => {
    setAnimationProgress(progress);
    if (progress >= 100) {
      setIsAnimating(false);
    }
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
    setAnimationProgress(100);
    // Don't reset - keep at 100%
  }, []);

  const toggleAnimation = useCallback(() => {
    setIsAnimating(prev => !prev);
  }, []);

  const handleReplay = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      setAnimationProgress(0);
      setIsAnimating(true);
    }, 100);
  }, []);

  const initiateDownload = useCallback(() => {
    setShowFormatDialog(true);
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
    setIsRecording(false); // Not using real-time recording anymore
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
      console.log('=== Starting Frame-by-Frame WebM Generation ===');
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
      
      // Cap resolution at 1920x1080
      let recordWidth = sourceWidth;
      let recordHeight = sourceHeight;
      const maxWidth = 1920;
      const maxHeight = 1080;
      
      if (recordWidth > maxWidth || recordHeight > maxHeight) {
        const scale = Math.min(maxWidth / recordWidth, maxHeight / recordHeight);
        recordWidth = Math.round(recordWidth * scale);
        recordHeight = Math.round(recordHeight * scale);
        console.log(`Scaled to ${recordWidth}x${recordHeight}`);
      }
      
      const fps = 30;
      const duration = animationSettings.duration;
      const totalFrames = Math.ceil(duration * fps);
      
      console.log(`Will render ${totalFrames} frames at ${fps}fps`);
      
      // Create offscreen canvas for rendering
      const canvasPool = CanvasPool.getInstance();
      const renderCanvas = canvasPool.acquire(recordWidth, recordHeight);
      const renderCtx = renderCanvas.getContext('2d', {
        alpha: false,
        willReadFrequently: false
      })!;
      
      renderCtx.imageSmoothingEnabled = false; // Fast rendering
      
      // STAGE 1: Pre-render all frames with precise timing control
      setVideoProgress({ stage: 'Rendering frames...', percent: 0 });
      console.log('Stage 1: Pre-rendering frames with precise timing...');
      
      const frames: ImageData[] = [];
      
      // Stop any existing animation
      setIsAnimating(false);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Manually control animation progress for precise timing
      const startTime = performance.now();
      
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
        // Calculate exact animation progress for this frame
        const frameProgress = frameIndex / (totalFrames - 1); // 0 to 1
        
        // Set animation to exact position for this frame
        setAnimationProgress(frameProgress);
        
        // Wait for React to update and canvas to render
        await new Promise(resolve => {
          requestAnimationFrame(() => {
            // Double RAF to ensure rendering is complete
            requestAnimationFrame(() => resolve(undefined));
          });
        });
        
        // Capture frame from source canvas
        renderCtx.fillStyle = '#000000';
        renderCtx.fillRect(0, 0, recordWidth, recordHeight);
        renderCtx.drawImage(sourceCanvas, 0, 0, recordWidth, recordHeight);
        
        // Store frame data
        const frameData = renderCtx.getImageData(0, 0, recordWidth, recordHeight);
        frames.push(frameData);
        
        // Update progress
        const renderProgress = (frameIndex / totalFrames) * 50; // First 50% for rendering
        setVideoProgress({ 
          stage: `Rendering frames... ${frameIndex + 1}/${totalFrames}`, 
          percent: renderProgress 
        });
        
        if (frameIndex % 30 === 0) {
          const elapsed = performance.now() - startTime;
          console.log(`Rendered ${frameIndex + 1}/${totalFrames} frames at ${elapsed.toFixed(0)}ms`);
        }
      }
      
      console.log(`✓ All ${frames.length} frames rendered with precise timing`);
      
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
          const encodeProgress = 50 + ((currentFrame / frames.length) * 50); // Second 50%
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

  const downloadVideoMP4 = useCallback(async () => {
    if (currentStep !== 'ready') {
      return;
    }
    
    return MemoryManager.monitorOperation(async () => {
      try {
        setIsEncodingMP4(true);
        setIsGeneratingVideo(true);
        setMp4Progress(0);
        setMp4Blob(null);
        
        console.log('=== Starting MP4 Generation ===');
        // toast.info(t('Preparing recording...', '准备录制...'));
      
      const fps = 60;
      const duration = animationSettings.duration;
      
      // Step 1: Setup and ensure animation is ready (0-5%)
      setMp4Progress(0);
      
      // Stop any current animation and reset
      setIsAnimating(false);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Reset animation to start
      setAnimationProgress(0);
      
      // Enable animation with controlled progress (no natural timing)
      setIsAnimating(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setMp4Progress(5);
      // toast.info(t('Recording video...', '录制视频...'));
      
      // Step 2: Record WebM (5-40%)
      let canvas = canvasRef.current;
      
      if (!canvas) {
        const canvasElements = document.querySelectorAll('canvas');
        for (const canvasEl of canvasElements) {
          if (canvasEl instanceof HTMLCanvasElement && canvasEl.width > 0 && canvasEl.height > 0) {
            canvas = canvasEl;
            canvasRef.current = canvas;
            break;
          }
        }
      }
      
      if (!canvas) {
        throw new Error('Canvas not available');
      }
      
      console.log('Canvas found:', canvas.width, 'x', canvas.height);
      
      const stream = canvas.captureStream(fps);
      
      const videoTracks = stream.getVideoTracks();
      console.log('Video tracks:', videoTracks.length);
      
      if (videoTracks.length === 0) {
        throw new Error('No video tracks available from canvas');
      }
      
      // Check track settings
      const trackSettings = videoTracks[0].getSettings();
      console.log('Track settings:', trackSettings);
      
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        console.log('VP9 not supported, trying VP8');
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          console.log('VP8 not supported, using default webm');
          mimeType = 'video/webm';
        }
      }
      console.log('Using MIME type:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 10000000
      });
      
      const chunks: Blob[] = [];
      let recordingStartTime = 0;
      let chunkCount = 0;
      
      // Calculate frame timing
      const totalFrames = Math.floor(duration * fps);
      const frameInterval = 1000 / fps; // ms per frame
      
      const webmBlob = await new Promise<Blob>((resolve, reject) => {
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            chunks.push(e.data);
            chunkCount++;
            console.log(`Chunk ${chunkCount}: ${e.data.size} bytes`);
          }
        };
        
        mediaRecorder.onstart = () => {
          recordingStartTime = Date.now();
          console.log('✓ Recording started at', new Date(recordingStartTime).toISOString());
        };
        
        mediaRecorder.onstop = () => {
          const recordingDuration = Date.now() - recordingStartTime;
          console.log(`Recording stopped after ${recordingDuration}ms`);
          console.log(`Total chunks: ${chunks.length}, Total size: ${chunks.reduce((sum, c) => sum + c.size, 0)} bytes`);
          
          if (chunks.length === 0) {
            reject(new Error('No data recorded - recording failed to capture frames'));
            return;
          }
          
          const blob = new Blob(chunks, { type: mimeType });
          console.log(`✓ WebM blob created: ${blob.size} bytes`);
          
          if (blob.size === 0) {
            reject(new Error('WebM blob is empty - no frames captured'));
            return;
          }
          
          setMp4Progress(40);
          resolve(blob);
        };
        
        mediaRecorder.onerror = (e) => {
          console.error('MediaRecorder error:', e);
          reject(new Error('MediaRecorder error during recording'));
        };
        
        // Ensure animation is definitely running
        if (!isAnimating) {
          console.log('Animation not running, starting it now');
          setIsAnimating(true);
        }
        
        // Start recording after ensuring everything is ready
        setTimeout(() => {
          if (mediaRecorder.state === 'inactive') {
            console.log('Starting MediaRecorder with 100ms timeslice...');
            mediaRecorder.start(100); // Request data every 100ms
            console.log('MediaRecorder state:', mediaRecorder.state);
          }
        }, 100);
        
        // Start recording
        mediaRecorder.start(100); // Capture chunks every 100ms
        console.log('MediaRecorder started, rendering frames...');
        
        // Frame-by-frame rendering with precise timing control
        let currentFrame = 0;
        const renderFrames = async () => {
          while (currentFrame < totalFrames && mediaRecorder.state === 'recording') {
            // Calculate exact progress for this frame
            const frameProgress = (currentFrame / (totalFrames - 1)) * 100;
            
            // Update animation to this exact frame
            setAnimationProgress(frameProgress);
            
            // Wait for frame to render (2 animation frames to ensure rendering completes)
            await new Promise(resolve => {
              requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                  resolve(undefined);
                });
              });
            });
            
            // Update recording progress UI
            const recordProgress = 5 + (frameProgress / 100) * 35;
            setMp4Progress(recordProgress);
            
            currentFrame++;
            
            // Small delay to let canvas stream capture the frame
            await new Promise(resolve => setTimeout(resolve, Math.max(1, frameInterval - 16)));
          }
          
          // All frames rendered, stop recording
          console.log(`✓ Rendered ${currentFrame} frames, stopping recording`);
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
          }
        };
        
        // Start frame rendering after a brief delay
        setTimeout(() => {
          renderFrames().catch(error => {
            console.error('Frame rendering error:', error);
            if (mediaRecorder.state === 'recording') {
              mediaRecorder.stop();
              stream.getTracks().forEach(track => track.stop());
            }
          });
        }, 300);
      });
      
      console.log(`✓ WebM recording complete: ${webmBlob.size} bytes`);
      
      if (webmBlob.size < 1000) {
        throw new Error(`WebM recording too small: ${webmBlob.size} bytes - likely no frames captured`);
      }
      
      // Step 2: Load FFmpeg if needed (40-50%)
      setMp4Progress(40);
      console.log('=== FFmpeg Loading Phase ===');
      console.log('FFmpeg loaded:', ffmpegLoaded);
      console.log('FFmpeg ref exists:', !!ffmpegRef.current);
      
      if (!ffmpegRef.current) {
        throw new Error('FFmpeg instance not initialized');
      }
      
      if (!ffmpegLoaded) {
        console.log('=== Loading FFmpeg (~32MB download) ===');
        
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        
        try {
          // Step 1: Fetch core JS
          console.log('[1/3] Fetching core JS...');
          const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
          console.log('✓ Core JS ready');
          setMp4Progress(43);
          
          // Step 2: Fetch WASM
          console.log('[2/3] Fetching WASM file (~32MB)...');
          const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
          console.log('✓ WASM ready');
          setMp4Progress(46);
          
          // Step 3: Initialize FFmpeg with proper timeout
          console.log('[3/3] Initializing FFmpeg (this can take 20-30s)...');
          console.log('Note: If this hangs, your browser may not support the encoder');
          
          let initResolved = false;
          
          const initPromise = new Promise(async (resolve, reject) => {
            try {
              await ffmpegRef.current!.load({
                coreURL,
                wasmURL,
              });
              if (!initResolved) {
                initResolved = true;
                resolve(true);
              }
            } catch (e) {
              if (!initResolved) {
                initResolved = true;
                reject(e);
              }
            }
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
              if (!initResolved) {
                initResolved = true;
                console.error('✗ FFmpeg initialization timeout after 30s');
                reject(new Error('FFmpeg took too long to initialize. Your browser may not support MP4 encoding. Please use WebM format instead.'));
              }
            }, 30000);
          });
          
          await Promise.race([initPromise, timeoutPromise]);
          
          if (initResolved) {
            console.log('✓ FFmpeg initialized successfully!');
            setFfmpegLoaded(true);
            setMp4Progress(50);
          }
        } catch (error) {
          console.error('=== FFmpeg Loading Failed ===');
          console.error('Error:', error);
          
          const errorMsg = error instanceof Error ? error.message : String(error);
          
          throw new Error(`FFmpeg initialization failed: ${errorMsg}`);
        }
      } else {
        setMp4Progress(50);
        console.log('✓ FFmpeg already loaded');
      }
      
      // Step 3: Convert WebM to MP4 (50-100%)
      console.log('=== MP4 Conversion Phase ===');
      const ffmpeg = ffmpegRef.current;
      
      try {
        // Write WebM to FFmpeg virtual filesystem
        console.log('Writing WebM to FFmpeg filesystem...');
        const webmData = await fetchFile(webmBlob);
        console.log(`WebM data size: ${webmData.byteLength} bytes`);
        await ffmpeg.writeFile('input.webm', webmData);
        console.log('✓ WebM written to FFmpeg filesystem');
        
        setMp4Progress(60);
        
        // Convert with settings optimized for compatibility
        console.log('Executing FFmpeg conversion (this may take a moment)...');
        await ffmpeg.exec([
          '-i', 'input.webm',
          '-c:v', 'libx264',      // H.264 codec for maximum compatibility
          '-preset', 'fast',       // Faster encoding
          '-crf', '23',            // Good quality
          '-pix_fmt', 'yuv420p',   // Required for compatibility
          '-movflags', '+faststart', // Web streaming optimization
          '-r', fps.toString(),    // Match source framerate
          'output.mp4'
        ]);
        console.log('✓ FFmpeg conversion completed successfully');
        
        setMp4Progress(90);
        
        // Read the converted MP4 file
        console.log('Reading MP4 output...');
        const mp4Data = await ffmpeg.readFile('output.mp4') as Uint8Array;
        const mp4ArrayBuffer = new Uint8Array(mp4Data).buffer;
        const mp4Blob = new Blob([mp4ArrayBuffer], { type: 'video/mp4' });
        
        console.log(`✓ MP4 created: ${mp4Blob.size} bytes (${(mp4Blob.size / 1024 / 1024).toFixed(2)} MB)`);
        
        if (mp4Blob.size < 1000) {
          throw new Error(`MP4 file too small: ${mp4Blob.size} bytes`);
        }
        
        // Clean up FFmpeg filesystem
        console.log('Cleaning up...');
        try {
          await ffmpeg.deleteFile('input.webm');
          await ffmpeg.deleteFile('output.mp4');
          console.log('✓ Cleanup complete');
        } catch (cleanupError) {
          console.warn('Cleanup warning (non-critical):', cleanupError);
        }
        
        setMp4Progress(100);
        setMp4Blob(mp4Blob);
        setIsGeneratingVideo(false);
        setIsAnimating(false);
        setAnimationProgress(0);
        
        console.log('=== MP4 Generation Complete ===');
        
      } catch (conversionError) {
        console.error('✗ Conversion failed:', conversionError);
        throw conversionError;
      }
      
      } catch (error) {
        console.error('=== MP4 Generation Failed ===');
        console.error('Error:', error);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error message:', errorMessage);
        
        setIsEncodingMP4(false);
        setIsGeneratingVideo(false);
        setIsAnimating(false);
        setMp4Progress(0);
        
        MemoryManager.forceGarbageCollection();
        throw error;
      }
    }, 'MP4 Recording').catch(() => {
      setIsEncodingMP4(false);
      setIsGeneratingVideo(false);
      setIsAnimating(false);
    });
  }, [animationSettings.duration, ffmpegLoaded, isAnimating, currentStep, t]);

  const downloadMP4File = useCallback(() => {
    if (!mp4Blob) return;
    
    const url = URL.createObjectURL(mp4Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starfield-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Reset
    setMp4Blob(null);
    setMp4Progress(0);
    setIsEncodingMP4(false);
  }, [mp4Blob, t]);

  const resetAll = useCallback(() => {
    // Stop any recording first
    if (isRecording) {
      stopRecording();
    }
    
    // Force stop any ongoing video generation immediately
    setIsGeneratingVideo(false);
    setIsRecording(false);
    setIsEncodingMP4(false);
    setMp4Progress(0);
    setMp4Blob(null);
    setShowFormatDialog(false);
    
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
  }, [isRecording, stopRecording, t]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full">
          <Video className="h-6 w-6 text-blue-400" />
          <span className="text-xl font-semibold text-white">
            {t('3D Star Field Generator', '3D星场生成器')}
          </span>
        </div>
        <p className="text-cosmic-300 text-lg max-w-3xl mx-auto">
          {t(
            'Upload stars only and starless images to create stunning fly-through animations with preserved star positions',
            '上传星体图像和无星图像，创建保留星体位置的令人惊叹的飞越动画'
          )}
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="flex justify-center">
        <div className="flex items-center gap-4 bg-cosmic-900/50 border border-cosmic-700/50 rounded-lg p-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${currentStep === 'upload' ? 'bg-blue-500/20 text-blue-300' : (currentStep === 'processing' || currentStep === 'ready' || currentStep === 'generating') ? 'bg-green-500/20 text-green-300' : 'bg-cosmic-800/50 text-cosmic-400'}`}>
            <Upload className="h-4 w-4" />
            <span className="text-sm">1. Upload Images</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${currentStep === 'processing' ? 'bg-blue-500/20 text-blue-300' : currentStep === 'ready' || currentStep === 'generating' ? 'bg-green-500/20 text-green-300' : 'bg-cosmic-800/50 text-cosmic-400'}`}>
            <ImageIcon className="h-4 w-4" />
            <span className="text-sm">2. Process & Map</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${currentStep === 'generating' ? 'bg-blue-500/20 text-blue-300' : 'bg-cosmic-800/50 text-cosmic-400'}`}>
            <Video className="h-4 w-4" />
            <span className="text-sm">3. Generate</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Image Upload */}
          <Card className="bg-cosmic-900/50 border-cosmic-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {t('Upload Images', '上传图像')}
              </CardTitle>
              <CardDescription className="text-cosmic-400">
                {t('Upload stars only and starless images separately', '分别上传星体图像和无星图像')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stars-upload" className="text-cosmic-200">
                  {t('Stars Only Image', '星体图像')}
                </Label>
                <Input
                  ref={starsFileInputRef}
                  id="stars-upload"
                  type="file"
                  accept="image/*,.fits,.fit,.tiff,.tif"
                  onChange={handleStarsOnlyUpload}
                  className="bg-cosmic-800/50 border-cosmic-700/50 text-white file:bg-cosmic-700 file:text-white file:border-0"
                />
                {starsOnlyImage && (
                  <div className="relative">
                    <img
                      src={starsOnlyImage}
                      alt="Stars only"
                      className="w-full h-24 object-cover rounded-lg border border-cosmic-700/50"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="starless-upload" className="text-cosmic-200">
                  {t('Starless Image (Nebula)', '无星图像（星云）')}
                </Label>
                <Input
                  ref={starlessFileInputRef}
                  id="starless-upload"
                  type="file"
                  accept="image/*,.fits,.fit,.tiff,.tif"
                  onChange={handleStarlessUpload}
                  className="bg-cosmic-800/50 border-cosmic-700/50 text-white file:bg-cosmic-700 file:text-white file:border-0"
                />
                {starlessImage && (
                  <div className="relative">
                    <img
                      src={starlessImage}
                      alt="Starless"
                      className="w-full h-24 object-cover rounded-lg border border-cosmic-700/50"
                    />
                  </div>
                )}
              </div>
              
              {starsOnlyElement && starlessElement && (
                <Button
                  onClick={processImages}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isProcessing ? t('Processing...', '处理中...') : t('Process & Generate Depth Map', '处理并生成深度图')}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Detection Info */}
          {detectedStars.length > 0 && (
            <Card className="bg-cosmic-900/50 border-cosmic-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {t('Processing Results', '处理结果')}
                </CardTitle>
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
            <Card className="bg-cosmic-900/50 border-cosmic-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  {t('Motion Settings', '动作设置')}
                </CardTitle>
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
                    min={100}
                    max={300}
                    step={10}
                    className="w-full"
                  />
                  <p className="text-xs text-cosmic-400">
                    {t('Higher amplification = faster motion through space', '更高的放大倍数 = 更快的空间移动速度')}
                  </p>
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
                    <Label className="text-cosmic-200">{t('Duration (seconds)', '持续时间（秒）')}</Label>
                    <span className="text-cosmic-300 text-sm">{animationSettings.duration}s</span>
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

                <div className="space-y-4 pt-4 border-t border-cosmic-700/30">
                  <div className="flex items-center justify-between gap-4 p-4 bg-cosmic-800/30 rounded-lg border border-cosmic-700/30 hover:border-cosmic-600/50 transition-colors">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="enableDownscale" className="text-cosmic-100 text-base font-medium cursor-pointer">
                        {t('Auto Resolution Scaling', '自动分辨率缩放')}
                      </Label>
                      <p className="text-xs text-cosmic-400 leading-relaxed">
                        {t('Optimize large images (>16MP) by automatically downscaling to 4K resolution for smoother performance', '自动将大型图像（>1600万像素）优化至4K分辨率，以获得更流畅的性能')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="enableDownscale"
                        checked={animationSettings.enableDownscale}
                        onCheckedChange={(checked) => setAnimationSettings(prev => ({
                          ...prev, 
                          enableDownscale: checked 
                        }))}
                      />
                      <span className={`text-sm font-medium ${animationSettings.enableDownscale ? 'text-blue-400' : 'text-cosmic-500'}`}>
                        {animationSettings.enableDownscale ? t('Enabled', '已启用') : t('Disabled', '已禁用')}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={toggleAnimation}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
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
              <Button
                onClick={resetAll}
                variant="outline"
                className="flex-1 border-cosmic-700/50 hover:bg-cosmic-800/50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('Reset', '重置')}
              </Button>
              
              {currentStep === 'ready' && !isRecording && (
                <Button
                  onClick={initiateDownload}
                  disabled={isGeneratingVideo || processedStars.length === 0}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
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
            
            {/* MP4 Encoding Progress Bar - Only show when ready */}
            {currentStep === 'ready' && isEncodingMP4 && mp4Progress > 0 && (
              <Card className="bg-cosmic-900/50 border-cosmic-700/50">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-cosmic-200 font-medium">
                      {mp4Progress < 40 
                        ? t('Recording video...', '录制视频...')
                        : mp4Progress < 50
                        ? t('Loading encoder...', '加载编码器...')
                        : t('Converting to MP4...', '转换为MP4...')
                      }
                    </span>
                    <span className="text-cosmic-300 font-semibold">
                      {Math.round(mp4Progress)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-cosmic-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 transition-all duration-300 animate-pulse"
                      style={{ width: `${mp4Progress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Format Selection Dialog */}
        <Dialog open={showFormatDialog} onOpenChange={setShowFormatDialog}>
          <DialogContent className="bg-cosmic-900 border-cosmic-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {t('Choose Video Format', '选择视频格式')}
              </DialogTitle>
              <DialogDescription className="text-cosmic-300">
                {t('Select the format for your downloaded video', '选择下载视频的格式')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Button
                onClick={() => {
                  setShowFormatDialog(false);
                  downloadVideoWebM();
                }}
                disabled={isGeneratingVideo}
                className="w-full bg-cosmic-800 hover:bg-cosmic-700 text-white"
              >
                <Video className="h-4 w-4 mr-2" />
                {t('WebM (Fast, Browser Native)', 'WebM（快速，浏览器原生）')}
              </Button>
              
            </div>
          </DialogContent>
        </Dialog>

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
                                ? t('Rendering all frames smoothly without recording overhead...', '流畅渲染所有帧，无录制开销...')
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
                  controlledProgress={animationProgress}
                />
                
                {/* Progress Bar and Controls */}
                {processedStars.length > 0 && (
                  <div className="space-y-2 px-4 pb-3">
                    {/* Play/Pause and Replay Buttons */}
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        onClick={toggleAnimation}
                        disabled={isGeneratingVideo}
                        variant="outline"
                        size="sm"
                        className="bg-cosmic-800/50 border-cosmic-700/50 hover:bg-cosmic-700/50 disabled:opacity-50"
                      >
                        {isAnimating ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            {t('Pause', '暂停')}
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            {t('Play', '播放')}
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={handleReplay}
                        disabled={isGeneratingVideo || (isAnimating && animationProgress < 10)}
                        variant="outline"
                        size="sm"
                        className="bg-cosmic-800/50 border-cosmic-700/50 hover:bg-cosmic-700/50 disabled:opacity-50"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        {t('Replay', '重播')}
                      </Button>
                    </div>
                    
                    {/* Progress bar with moving slider dot - YouTube style */}
                    <div className="relative w-full h-1 bg-cosmic-800/50 rounded-full overflow-visible">
                      {/* Played portion (white) */}
                      <div 
                        className="absolute left-0 top-0 h-full bg-white/80 transition-all duration-100 rounded-full"
                        style={{ width: `${animationProgress}%` }}
                      />
                      {/* Moving dot at current position */}
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-all duration-100"
                        style={{ left: `calc(${animationProgress}% - 0.375rem)` }}
                      />
                    </div>
                    
                    {/* Time display only */}
                    <div className="flex items-center justify-between text-xs text-cosmic-300">
                      <span>{formatTime((animationProgress / 100) * animationSettings.duration)}</span>
                      <span>{formatTime(animationSettings.duration)}</span>
                    </div>
                  </div>
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