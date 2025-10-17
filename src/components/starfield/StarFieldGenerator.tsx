import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Upload, Play, Pause, Download, RotateCcw, Video, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import StarField3D from './StarField3D';
import UTIF from 'utif';

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
  const { t } = useLanguage();
  
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
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'ready' | 'generating'>('upload');
  
  const starsFileInputRef = useRef<HTMLInputElement>(null);
  const starlessFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Animation settings with motion controls
  const [animationSettings, setAnimationSettings] = useState({
    motionType: 'zoom_in', // zoom_in, zoom_out, pan_left, pan_right
    speed: 1.0,
    duration: 15,
    fieldOfView: 75,
    depthMultiplier: 1.0
  });

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

  // Extract exact star positions from stars only image
  const extractStarPositions = useCallback((img: HTMLImageElement): StarPosition[] => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    const stars: StarPosition[] = [];
    const threshold = 60; // Brightness threshold for star detection
    const minDistance = 3; // Minimum distance between stars
    
    // Scan for bright pixels (stars)
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        
        if (luminance > threshold) {
          // Check if this is a local maximum
          let isLocalMax = true;
          for (let dy = -1; dy <= 1 && isLocalMax; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && nx < canvas.width && ny >= 0 && ny < canvas.height) {
                const nIdx = (ny * canvas.width + nx) * 4;
                const nLuminance = 0.299 * data[nIdx] + 0.587 * data[nIdx + 1] + 0.114 * data[nIdx + 2];
                if (nLuminance > luminance) {
                  isLocalMax = false;
                }
              }
            }
          }
          
          if (isLocalMax) {
            // Check distance from existing stars
            const tooClose = stars.some(s => {
              const dx = s.x - x;
              const dy = s.y - y;
              return Math.sqrt(dx * dx + dy * dy) < minDistance;
            });
            
            if (!tooClose) {
              stars.push({
                x,
                y,
                brightness: luminance / 255,
                size: luminance > 200 ? 2 : 1,
                color: {
                  r: data[idx],
                  g: data[idx + 1],
                  b: data[idx + 2]
                }
              });
            }
          }
        }
      }
    }
    
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
      // Step 1: Extract star positions from stars only image
      toast.info(t('Step 1: Extracting star positions...', '步骤1：提取星体位置...'));
      const stars = extractStarPositions(starsOnlyElement);
      setDetectedStars(stars);
      
      if (stars.length === 0) {
        toast.warning(t('No stars detected in the image', '图像中未检测到星体'));
        setCurrentStep('upload');
        return;
      }
      
      // Step 2: Generate depth map from starless image
      toast.info(t('Step 2: Generating depth map from starless image...', '步骤2：从无星图像生成深度图...'));
      const depthMap = generateDepthMap(starlessElement);
      setDepthMapCanvas(depthMap);
      
      // Step 3: Assign depth to stars based on depth map
      toast.info(t('Step 3: Assigning depth to stars...', '步骤3：为星体分配深度...'));
      const depthCtx = depthMap.getContext('2d')!;
      const depthData = depthCtx.getImageData(0, 0, depthMap.width, depthMap.height);
      
      const processedStarsData: ProcessedStarData[] = stars.map(star => {
        // Get depth from depth map at star position
        const depthIdx = (Math.floor(star.y) * depthMap.width + Math.floor(star.x)) * 4;
        const depth = depthData.data[depthIdx] / 255; // 0-1 range
        
        // Convert to 3D coordinates
        // Keep X and Y exactly as they are in the image
        const centerX = depthMap.width / 2;
        const centerY = depthMap.height / 2;
        
        return {
          x: (star.x - centerX) * 0.1,
          y: (star.y - centerY) * 0.1,
          z: depth * 100, // Scale depth
          brightness: star.brightness,
          size: star.size,
          color3d: `rgb(${star.color.r}, ${star.color.g}, ${star.color.b})`,
          originalX: star.x,
          originalY: star.y
        };
      });
      
      setProcessedStars(processedStarsData);
      setCurrentStep('ready');
      
      toast.success(t(
        `Successfully processed ${stars.length} stars with depth mapping!`, 
        `成功处理了${stars.length}颗星体并分配了深度！`
      ));
      
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(t('Processing failed. Please try again.', '处理失败。请重试。'));
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
    }
  }, [starsOnlyElement, starlessElement, extractStarPositions, generateDepthMap, t]);

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);

  const toggleAnimation = useCallback(() => {
    setIsAnimating(prev => !prev);
  }, []);

  const generateVideo = useCallback(() => {
    if (processedStars.length === 0) {
      toast.error(t('Please process stars first', '请先处理星体'));
      return;
    }

    if (!canvasRef.current) {
      toast.error(t('Canvas not ready. Please wait and try again.', '画布未准备好，请稍后重试。'));
      return;
    }
    
    try {
      recordedChunksRef.current = [];
      setIsRecording(true);
      setIsAnimating(true);
      setCurrentStep('generating');
      toast.success(t('Recording video...', '正在录制视频...'));
      
      // Get the canvas stream
      const stream = canvasRef.current.captureStream(60); // 60 FPS
      
      // Create MediaRecorder with better codec support
      let options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp9' };
      
      // Fallback to vp8 if vp9 not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8' };
      }
      
      // Fallback to default if neither vp9 nor vp8 supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `starfield-3d-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setIsRecording(false);
        setIsAnimating(false);
        setCurrentStep('ready');
        toast.success(t('Video downloaded successfully!', '视频下载成功！'));
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Stop recording after the specified duration
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      }, animationSettings.duration * 1000);
      
    } catch (error) {
      console.error('Error generating video:', error);
      setIsRecording(false);
      setIsAnimating(false);
      setCurrentStep('ready');
      toast.error(t('Failed to generate video. Please try again.', '生成视频失败，请重试。'));
    }
  }, [processedStars, animationSettings.duration, t]);

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
                    <Label className="text-cosmic-200">{t('Flight Speed', '飞行速度')}</Label>
                    <span className="text-cosmic-300 text-sm">{animationSettings.speed.toFixed(1)}x</span>
                  </div>
                  <Slider
                    value={[animationSettings.speed]}
                    onValueChange={(value) => setAnimationSettings(prev => ({...prev, speed: value[0]}))}
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-cosmic-200">{t('Duration (seconds)', '持续时间（秒）')}</Label>
                    <span className="text-cosmic-300 text-sm">{animationSettings.duration}s</span>
                  </div>
                  <Slider
                    value={[animationSettings.duration]}
                    onValueChange={(value) => setAnimationSettings(prev => ({...prev, duration: value[0]}))}
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
            
            {currentStep === 'ready' && (
              <Button
                onClick={generateVideo}
                disabled={isRecording}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {isRecording ? t('Generating...', '生成中...') : t('Generate Video', '生成视频')}
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
              <StarField3D
                stars={processedStars}
                settings={animationSettings}
                isAnimating={isAnimating}
                isRecording={isRecording}
                backgroundImage={starlessImage}
                onCanvasReady={handleCanvasReady}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StarFieldGenerator;