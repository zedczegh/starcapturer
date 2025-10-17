// Star Field Generator - FFmpeg integration for MP4 export
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Play, Pause, Download, RotateCcw, Video, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import StarField3D from './StarField3D';
import UTIF from 'utif';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

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
  const [isRecording, setIsRecording] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'ready' | 'generating'>('upload');
  const [animationProgress, setAnimationProgress] = useState(0); // 0-100%
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  
  const starsFileInputRef = useRef<HTMLInputElement>(null);
  const starlessFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const ffmpegRef = useRef<FFmpeg | null>(null);

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
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setIsAnimating(false);
    setAnimationProgress(100);
    // Don't reset - keep at 100%
  }, []);

  const toggleAnimation = useCallback(() => {
    setIsAnimating(prev => !prev);
    if (!isAnimating && animationProgress >= 100) {
      // If at end, restart from beginning
      setAnimationProgress(0);
    }
  }, [isAnimating, animationProgress]);

  const handleReplay = useCallback(() => {
    setAnimationProgress(0);
    setIsAnimating(true);
  }, []);

  const generateVideo = useCallback(async () => {
    if (!canvasRef.current) {
      toast.error(t('Canvas not ready', '画布未就绪'));
      return;
    }
    
    setIsGeneratingVideo(true);
    setIsRecording(true);
    setIsAnimating(true);
    setCurrentStep('generating');
    recordedChunksRef.current = [];
    
    toast.info(t('Recording animation...', '录制动画中...'));
    
    try {
      const canvas = canvasRef.current;
      const stream = canvas.captureStream(60); // 60 FPS
      
      if (!stream) {
        throw new Error('Failed to capture canvas stream');
      }

      let options: MediaRecorderOptions = { 
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 10000000
      };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8', videoBitsPerSecond: 10000000 };
      }
      
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm', videoBitsPerSecond: 10000000 };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, processing video...');
        const webmBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        console.log('WebM blob size:', (webmBlob.size / 1024 / 1024).toFixed(2), 'MB');
        
        toast.info(t('Converting to MP4...', '转换为MP4中...'));
        
        try {
          // Load FFmpeg on demand
          console.log('Checking FFmpeg...');
          if (!ffmpegRef.current) {
            console.log('Loading FFmpeg for the first time...');
            const ffmpeg = new FFmpeg();
            ffmpeg.on('log', ({ message }) => {
              console.log('FFmpeg:', message);
            });
            
            console.log('Loading FFmpeg core...');
            await ffmpeg.load({
              coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
              wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
            });
            console.log('FFmpeg loaded successfully');
            ffmpegRef.current = ffmpeg;
          }
          
          const ffmpeg = ffmpegRef.current;
          console.log('Writing WebM file to FFmpeg...');
          await ffmpeg.writeFile('input.webm', await fetchFile(webmBlob));
          console.log('WebM file written, starting conversion...');
          
          await ffmpeg.exec([
            '-i', 'input.webm',
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '18',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            'output.mp4'
          ]);
          
          console.log('Conversion complete, reading MP4...');
          const data = await ffmpeg.readFile('output.mp4');
          const mp4Blob = new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });
          console.log('MP4 blob size:', (mp4Blob.size / 1024 / 1024).toFixed(2), 'MB');
          
          setVideoBlob(mp4Blob);
          
          console.log('Cleaning up temporary files...');
          await ffmpeg.deleteFile('input.webm');
          await ffmpeg.deleteFile('output.mp4');
          
          toast.success(t('Video ready! Click Download to save.', '视频已就绪！点击下载保存。'));
        } catch (error) {
          console.error('MP4 conversion error:', error);
          toast.error(t('Conversion failed: ' + (error as Error).message, '转换失败: ' + (error as Error).message));
        }
        
        setIsGeneratingVideo(false);
        setIsRecording(false);
        setIsAnimating(false);
        setCurrentStep('ready');
      };

      mediaRecorder.onerror = () => {
        toast.error(t('Recording error occurred', '录制时发生错误'));
        setIsGeneratingVideo(false);
        setIsRecording(false);
        setIsAnimating(false);
        setCurrentStep('ready');
      };
      
      mediaRecorder.start(100);
      
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, (animationSettings.duration * 1000) + 300);
      
    } catch (error) {
      console.error('Video generation error:', error);
      setIsGeneratingVideo(false);
      setIsRecording(false);
      setIsAnimating(false);
      setCurrentStep('ready');
      toast.error(t('Failed to generate video', '视频生成失败'));
    }
  }, [processedStars, animationSettings.duration, t]);

  const downloadVideo = useCallback(() => {
    if (!videoBlob) return;
    
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement('a');
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    a.download = `starfield-animation-${timestamp}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success(t('MP4 video downloaded!', 'MP4视频已下载！'));
  }, [videoBlob, t]);

  const resetAll = useCallback(() => {
    setStarsOnlyImage(null);
    setStarlessImage(null);
    setStarsOnlyElement(null);
    setStarlessElement(null);
    setDetectedStars([]);
    setProcessedStars([]);
    setDepthMapCanvas(null);
    setIsAnimating(false);
    setIsRecording(false);
    setIsCanvasReady(false);
    setCurrentStep('upload');
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
          <div className="flex gap-3">
            <Button
              onClick={resetAll}
              variant="outline"
              className="flex-1 border-cosmic-700/50 hover:bg-cosmic-800/50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('Reset', '重置')}
            </Button>
            
            {currentStep === 'ready' && !videoBlob && (
              <Button
                onClick={generateVideo}
                disabled={isGeneratingVideo}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
              >
                <Video className="h-4 w-4 mr-2" />
                {isGeneratingVideo 
                  ? t('Generating...', '生成中...') 
                  : t('Generate Video', '生成视频')
                }
              </Button>
            )}
            
            {currentStep === 'ready' && videoBlob && (
              <Button
                onClick={downloadVideo}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {t('Download MP4', '下载MP4')}
              </Button>
            )}
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
            <CardContent className="h-[500px] p-0">
              <div className="space-y-2">
                <StarField3D
                  stars={processedStars}
                  settings={animationSettings}
                  isAnimating={isAnimating}
                  isRecording={isRecording}
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
                        disabled={isRecording}
                        variant="outline"
                        size="sm"
                        className="bg-cosmic-800/50 border-cosmic-700/50 hover:bg-cosmic-700/50"
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
                        disabled={isRecording || (isAnimating && animationProgress < 10)}
                        variant="outline"
                        size="sm"
                        className="bg-cosmic-800/50 border-cosmic-700/50 hover:bg-cosmic-700/50"
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