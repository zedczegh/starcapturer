import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Play, Pause, Download, RotateCcw, Video, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import StarField3D from './StarField3D';
import UTIF from 'utif';
// Removed FFmpeg imports - using server-side conversion

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
  // Remove FFmpeg-related state and refs - no longer needed
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [showFormatDialog, setShowFormatDialog] = useState(false);
  const [mp4Progress, setMp4Progress] = useState(0);
  const [mp4Blob, setMp4Blob] = useState<Blob | null>(null);
  const [isEncodingMP4, setIsEncodingMP4] = useState(false);
  
  const starsFileInputRef = useRef<HTMLInputElement>(null);
  const starlessFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animation settings with motion controls
  const [animationSettings, setAnimationSettings] = useState({
    motionType: 'zoom_in' as 'zoom_in' | 'zoom_out' | 'pan_left' | 'pan_right',
    speed: 1.5,
    duration: 10,
    fieldOfView: 75,
    depthMultiplier: 1.0,
    amplification: 150, // 100-300%
    spin: 0, // 0-90 degrees
    spinDirection: 'clockwise' as 'clockwise' | 'counterclockwise'
  });

  const t = (en: string, zh: string) => language === 'en' ? en : zh;
  
  // Removed FFmpeg initialization - using server-side conversion
  
  
  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const decodeTiffToDataUrl = useCallback((arrayBuffer: ArrayBuffer): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const ifds = UTIF.decode(arrayBuffer);
        UTIF.decodeImage(arrayBuffer, ifds[0]);
        const rgba = UTIF.toRGBA8(ifds[0]);
        
        const canvas = document.createElement('canvas');
        canvas.width = ifds[0].width;
        canvas.height = ifds[0].height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        imageData.data.set(rgba);
        ctx.putImageData(imageData, 0, 0);
        
        resolve(canvas.toDataURL('image/png'));
      } catch (error) {
        reject(error);
      }
    });
  }, []);

  const handleStarsOnlyUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file format
    const validExtensions = ['.jpg', '.jpeg', '.png', '.fits', '.fit', '.tiff', '.tif', '.bmp', '.webp'];
    const fileName = file.name.toLowerCase();
    const isValidFormat = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidFormat) {
      toast.error(t('Please upload a valid image file (JPG, PNG, FITS, TIFF, BMP, WEBP)', '请上传有效的图像文件 (JPG, PNG, FITS, TIFF, BMP, WEBP)'));
      if (starsFileInputRef.current) starsFileInputRef.current.value = '';
      return;
    }

    // Validate file size (500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('File size must be less than 500MB', '文件大小必须小于500MB'));
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
          const dataUrl = await decodeTiffToDataUrl(arrayBuffer);
          setStarsOnlyImage(dataUrl);
          
          const img = new Image();
          img.onload = () => {
            setStarsOnlyElement(img);
            toast.success(t('Stars only image uploaded', '星体图像已上传'));
          };
          img.onerror = () => {
            toast.error(t('Failed to load image', '图像加载失败'));
            setStarsOnlyImage(null);
            if (starsFileInputRef.current) starsFileInputRef.current.value = '';
          };
          img.src = dataUrl;
        } catch (error) {
          toast.error(t('Failed to decode TIFF image', '无法解码TIFF图像'));
          if (starsFileInputRef.current) starsFileInputRef.current.value = '';
        }
      };
      arrayBufferReader.readAsArrayBuffer(file);
    } else {
      // Handle standard image formats
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setStarsOnlyImage(result);
        
        const img = new Image();
        img.onload = () => {
          setStarsOnlyElement(img);
          toast.success(t('Stars only image uploaded', '星体图像已上传'));
        };
        img.onerror = () => {
          toast.error(t('Failed to load image', '图像加载失败'));
          setStarsOnlyImage(null);
          if (starsFileInputRef.current) starsFileInputRef.current.value = '';
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  }, [t, decodeTiffToDataUrl]);

  const handleStarlessUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file format
    const validExtensions = ['.jpg', '.jpeg', '.png', '.fits', '.fit', '.tiff', '.tif', '.bmp', '.webp'];
    const fileName = file.name.toLowerCase();
    const isValidFormat = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidFormat) {
      toast.error(t('Please upload a valid image file (JPG, PNG, FITS, TIFF, BMP, WEBP)', '请上传有效的图像文件 (JPG, PNG, FITS, TIFF, BMP, WEBP)'));
      if (starlessFileInputRef.current) starlessFileInputRef.current.value = '';
      return;
    }

    // Validate file size (500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(t('File size must be less than 500MB', '文件大小必须小于500MB'));
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
          const dataUrl = await decodeTiffToDataUrl(arrayBuffer);
          setStarlessImage(dataUrl);
          
          const img = new Image();
          img.onload = () => {
            setStarlessElement(img);
            toast.success(t('Starless image uploaded', '无星图像已上传'));
          };
          img.onerror = () => {
            toast.error(t('Failed to load image', '图像加载失败'));
            setStarlessImage(null);
            if (starlessFileInputRef.current) starlessFileInputRef.current.value = '';
          };
          img.src = dataUrl;
        } catch (error) {
          toast.error(t('Failed to decode TIFF image', '无法解码TIFF图像'));
          if (starlessFileInputRef.current) starlessFileInputRef.current.value = '';
        }
      };
      arrayBufferReader.readAsArrayBuffer(file);
    } else {
      // Handle standard image formats
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setStarlessImage(result);
        
        const img = new Image();
        img.onload = () => {
          setStarlessElement(img);
          toast.success(t('Starless image uploaded', '无星图像已上传'));
        };
        img.onerror = () => {
          toast.error(t('Failed to load image', '图像加载失败'));
          setStarlessImage(null);
          if (starlessFileInputRef.current) starlessFileInputRef.current.value = '';
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  }, [t, decodeTiffToDataUrl]);

  // Generate depth map from starless image
  const generateDepthMap = useCallback((img: HTMLImageElement): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw starless image
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Create depth map based on luminance with enhanced blue bias for nebula
    const depthData = new ImageData(canvas.width, canvas.height);
    for (let i = 0; i < data.length; i += 4) {
      // Enhanced luminance with blue bias for nebula depth perception
      const luminance = 0.2 * data[i] + 0.5 * data[i + 1] + 0.8 * data[i + 2];
      const enhancedLum = Math.pow(luminance / 255, 0.8) * 255; // Gamma correction for depth
      depthData.data[i] = enhancedLum;
      depthData.data[i + 1] = enhancedLum;
      depthData.data[i + 2] = enhancedLum;
      depthData.data[i + 3] = 255;
    }
    
    ctx.putImageData(depthData, 0, 0);
    
    // Apply slight blur for smoother depth transitions
    ctx.filter = 'blur(2px)';
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
    
    return canvas;
  }, []);

  // Extract star positions with diffraction spike detection (Newtonian cross stars)
  const extractStarPositions = useCallback((img: HTMLImageElement): StarPosition[] => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    
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
  }, []);

  const processImages = useCallback(async () => {
    if (!starsOnlyElement || !starlessElement) {
      toast.error(t('Please upload both images first', '请先上传两张图像'));
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');
    
    try {
      // Extract star positions from stars only image
      const stars = extractStarPositions(starsOnlyElement);
      setDetectedStars(stars);
      
      if (stars.length === 0) {
        toast.warning(t('No stars detected in the image', '图像中未检测到星体'));
        setCurrentStep('upload');
        return;
      }
      
      // Generate depth map from starless image
      const depthMap = generateDepthMap(starlessElement);
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
      
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(t('Processing failed. Please try again.', '处理失败。请重试。'));
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
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

  const downloadVideoWebM = useCallback(async () => {
    if (!canvasRef.current) {
      toast.error(t('Please generate the animation first', '请先生成动画'));
      return;
    }
    
    setIsGeneratingVideo(true);
    setIsAnimating(false);
    
    toast.info(t('Preparing to record...', '准备录制...'));
    
    // Wait for any ongoing animation to stop
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Reset and start animation to ensure canvas is rendering
    setAnimationProgress(0);
    setIsAnimating(true);
    
    // Give canvas time to render several frames before recording
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const fps = 60;
      const duration = animationSettings.duration;
      const stream = canvas.captureStream(fps);
      
      // Check if stream has video tracks
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        throw new Error('No video tracks available');
      }
      
      console.log('Video track settings:', videoTracks[0].getSettings());
      
      // Try different codecs based on browser support
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }
      
      console.log('Using mimeType:', mimeType);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 10000000 // 10 Mbps
      });
      
      const chunks: Blob[] = [];
      let hasReceivedData = false;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
          hasReceivedData = true;
          console.log(`Recorded chunk: ${e.data.size} bytes`);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log(`Recording stopped. Total chunks: ${chunks.length}`);
        
        if (!hasReceivedData || chunks.length === 0) {
          toast.error(t('Recording failed - no data captured. Please try again.', '录制失败 - 未捕获数据。请重试。'));
          setIsGeneratingVideo(false);
          setIsAnimating(false);
          return;
        }
        
        const blob = new Blob(chunks, { type: mimeType });
        console.log(`Final video blob size: ${blob.size} bytes`);
        
        if (blob.size === 0) {
          toast.error(t('Recording failed - empty video', '录制失败 - 视频为空'));
          setIsGeneratingVideo(false);
          setIsAnimating(false);
          return;
        }
        
        // Download the video
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `starfield-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setIsGeneratingVideo(false);
        setIsAnimating(false);
        toast.success(t('Video downloaded successfully!', '视频下载成功！'));
      };
      
      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        toast.error(t('Recording error occurred', '录制出错'));
        setIsGeneratingVideo(false);
        setIsAnimating(false);
      };
      
      // Ensure animation is running
      setIsAnimating(true);
      
      // Wait for more frames to ensure recording captures content
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Start recording - request data every 100ms
      console.log('Starting MediaRecorder...');
      mediaRecorder.start(100);
      console.log('MediaRecorder started, state:', mediaRecorder.state);
      
      toast.success(t('Recording started...', '开始录制...'));
      
      // Stop recording after full duration + buffer
      const recordingDuration = (duration * 1000) + 2000; // Extra 2s buffer
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          console.log('Stopping MediaRecorder');
          mediaRecorder.stop();
          stream.getTracks().forEach(track => track.stop());
        }
      }, recordingDuration);
      
    } catch (error) {
      console.error('Download video error:', error);
      toast.error(t('Failed to record video', '视频录制失败'));
      setIsGeneratingVideo(false);
      setIsAnimating(false);
    }
  }, [animationSettings.duration, t]);

  const downloadVideoMP4 = useCallback(async () => {
  const downloadVideoMP4 = useCallback(async () => {
    if (!canvasRef.current) {
      toast.error(t('Please generate the animation first', '请先生成动画'));
      return;
    }

    try {
      setIsEncodingMP4(true);
      setIsGeneratingVideo(true);
      setMp4Progress(0);
      setMp4Blob(null);
      
      console.log('=== Starting MP4 Generation ===');
      toast.info(t('Preparing recording...', '准备录制...'));
      
      const fps = 60;
      const duration = animationSettings.duration;
      
      // Step 1: Setup and ensure animation is ready (0-5%)
      setMp4Progress(0);
      
      // Stop any current animation and reset
      setIsAnimating(false);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reset animation to start
      setAnimationProgress(0);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Start animation before recording
      setIsAnimating(true);
      console.log('Animation started, waiting for frames to render...');
      
      // Wait longer for initial frames to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMp4Progress(5);
      toast.info(t('Recording video...', '录制视频...'));
      
      // Step 2: Record WebM (5-40%)
      console.log('Setting up canvas stream...');
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
            
            // Update progress during recording
            const progressInterval = setInterval(() => {
              if (mediaRecorder.state === 'recording') {
                const elapsed = Date.now() - recordingStartTime;
                const progress = Math.min((elapsed / (duration * 1000)) * 35, 35);
                setMp4Progress(5 + progress);
              } else {
                clearInterval(progressInterval);
              }
            }, 200);
            
            // Stop after duration + buffer
            const stopTimeout = setTimeout(() => {
              clearInterval(progressInterval);
              if (mediaRecorder.state === 'recording') {
                console.log('Stopping MediaRecorder after duration');
                mediaRecorder.stop();
                stream.getTracks().forEach(track => {
                  track.stop();
                  console.log('Track stopped');
                });
              }
            }, (duration * 1000) + 2000); // 2 second buffer
          }
        }, 500); // Wait 500ms before starting recording to ensure frames are rendering
      });
      
      console.log(`✓ WebM recording complete: ${webmBlob.size} bytes`);
      
      if (webmBlob.size < 1000) {
        throw new Error(`WebM recording too small: ${webmBlob.size} bytes - likely no frames captured`);
      }
      
      // Step 2: Send to server for MP4 conversion (40-90%)
      setMp4Progress(40);
      toast.info(t('Converting to MP4 on server...', '在服务器上转换为MP4...'));
      console.log('Sending WebM to server for MP4 conversion...');
      
      const formData = new FormData();
      formData.append('video', webmBlob, 'starfield.webm');
      
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('generate-mp4', {
        body: formData,
      });
      
      if (error) {
        console.error('Server conversion error:', error);
        throw new Error(error.message || 'Failed to convert video on server');
      }
      
      if (!data || !data.url) {
        throw new Error('Server did not return a valid MP4 URL');
      }
      
      console.log('MP4 generated successfully:', data);
      setMp4Progress(90);
      
      // Fetch the MP4 blob for storage
      const mp4Response = await fetch(data.url);
      const mp4Blob = await mp4Response.blob();
      
      setMp4Progress(100);
      setMp4Blob(mp4Blob);
      setIsGeneratingVideo(false);
      setIsAnimating(false);
      setAnimationProgress(0);
      
      console.log('=== MP4 Generation Complete ===');
      toast.success(t('MP4 ready to download!', 'MP4准备下载！'));
      
    } catch (error) {
      console.error('=== MP4 Generation Failed ===');
      console.error('Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error message:', errorMessage);
      
      toast.error(t(
        `Failed to encode MP4: ${errorMessage}`, 
        `MP4编码失败: ${errorMessage}`
      ));
      
      setIsEncodingMP4(false);
      setIsGeneratingVideo(false);
      setIsAnimating(false);
      setMp4Progress(0);
    }
  }, [animationSettings.duration, isAnimating, t]);

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
    
    toast.success(t('MP4 video downloaded!', 'MP4视频已下载！'));
    
    // Reset
    setMp4Blob(null);
    setMp4Progress(0);
    setIsEncodingMP4(false);
  }, [mp4Blob, t]);

  const resetAll = useCallback(() => {
    // Force stop any ongoing video generation immediately
    setIsGeneratingVideo(false);
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
    
    toast.success(t('Reset complete', '重置完成'));
  }, [t]);

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
              
              {currentStep === 'ready' && (
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
              
              {/* MP4 Button with better error handling */}
              {!isEncodingMP4 && !mp4Blob && (
                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      setShowFormatDialog(false);
                      downloadVideoMP4();
                    }}
                    disabled={isGeneratingVideo}
                    className="w-full bg-cosmic-800 hover:bg-cosmic-700 text-white"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    {t('MP4 (Universal Compatibility)', 'MP4（通用兼容性）')}
                  </Button>
                  <p className="text-xs text-cosmic-400 text-center">
                    {t('Requires ~32MB download and may take 30+ seconds', '需要下载约32MB，可能需要30秒以上')}
                  </p>
                  <p className="text-xs text-yellow-400/70 text-center">
                    {t('If MP4 fails, use WebM format above', '如果MP4失败，请使用上面的WebM格式')}
                  </p>
                </div>
              )}
              
              {/* Progress Bar during encoding - hide if dialog closed or reset */}
              {isEncodingMP4 && !mp4Blob && showFormatDialog && (
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between text-sm text-cosmic-300">
                    <span>{t('Encoding MP4...', '编码MP4...')}</span>
                    <span>{Math.round(mp4Progress)}%</span>
                  </div>
                  <div className="w-full h-2 bg-cosmic-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-600 to-emerald-600 transition-all duration-300"
                      style={{ width: `${mp4Progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Download Button after encoding */}
              {mp4Blob && showFormatDialog && (
                <Button
                  onClick={() => {
                    setShowFormatDialog(false);
                    downloadMP4File();
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('Download MP4', '下载MP4')}
                </Button>
              )}
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
            <CardContent className="h-[500px] p-0">
              <div className="space-y-2">
                <StarField3D
                  stars={processedStars}
                  settings={animationSettings}
                  isAnimating={isAnimating}
                  isRecording={isGeneratingVideo}
                  backgroundImage={starlessImage}
                  starsOnlyImage={starsOnlyImage}
                  onCanvasReady={handleCanvasReady}
                  onProgressUpdate={handleProgressUpdate}
                  onAnimationComplete={handleAnimationComplete}
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