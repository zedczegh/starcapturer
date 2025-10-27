import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Upload, Eye, Download, Loader2, Layers, Settings2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateSimpleDepthMap, detectStars, type SimpleDepthParams } from '@/lib/simpleDepthMap';
import { TraditionalMorphProcessor, type TraditionalInputs, type TraditionalMorphParams } from '@/lib/traditionalMorphMode';
import { NobelPrizeStereoscopeEngine } from '@/lib/advanced/NobelPrizeStereoscopeEngine';
import { AstrophysicsService, type AstrophysicsParams } from '@/services/AstrophysicsService';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
// @ts-ignore
import * as UTIF from 'utif';

interface ProcessingParams {
  maxShift: number;
  edgeWeight: number;
  blurSigma: number;
  contrastAlpha: number;
  starThreshold: number;
  nebulaDepthBoost: number;
  colorChannelWeights: {
    red: number;
    green: number;
    blue: number;
  };
  objectType: 'nebula' | 'galaxy' | 'planetary' | 'mixed';
  starParallaxPx: number;
  preserveStarShapes: boolean;
}

const StereoscopeProcessor: React.FC = () => {
  const { t } = useLanguage();
  
  // Mode selection
  const [processingMode, setProcessingMode] = useState<'fast' | 'traditional' | 'astrophysics'>('fast');
  
  // Fast mode states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Traditional mode states  
  const [starlessImage, setStarlessImage] = useState<File | null>(null);
  const [starsImage, setStarsImage] = useState<File | null>(null);
  const [starlessPreview, setStarlessPreview] = useState<string | null>(null);
  const [starsPreview, setStarsPreview] = useState<string | null>(null);
  
  // Common states
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [depthMapUrl, setDepthMapUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const starlessInputRef = useRef<HTMLInputElement>(null);
  const starsInputRef = useRef<HTMLInputElement>(null);
  
  const [params, setParams] = useState<ProcessingParams>({
    maxShift: 30,
    edgeWeight: 0.3,
    blurSigma: 1.0,
    contrastAlpha: 1.2,
    starThreshold: 200,
    nebulaDepthBoost: 1.5,
    colorChannelWeights: {
      red: 0.299,
      green: 0.587,
      blue: 0.114
    },
    objectType: 'nebula',
    starParallaxPx: 15, // Increased for better visibility
    preserveStarShapes: true,
  });

  // Add stereo spacing parameter
  const [stereoSpacing, setStereoSpacing] = useState<number>(600);
  
  // Add border size parameter (0-600px)
  const [borderSize, setBorderSize] = useState<number>(300);
  
  // Traditional mode parameters - enhanced for better 3D effect
  const [traditionalParams, setTraditionalParams] = useState<TraditionalMorphParams>({
    horizontalDisplace: 25, // Increased for more nebula depth
    starShiftAmount: 6, // Increased for more dramatic star 3D effect
    luminanceBlur: 1.5,
    contrastBoost: 1.2
  });

  // Astrophysics mode states
  const [astrophysicsObjectName, setAstrophysicsObjectName] = useState<string>('');
  const [astrophysicsParams, setAstrophysicsParams] = useState<AstrophysicsParams>({
    baseline: 1.0,
    fovDeg: 1.0,
    scaleFactor: 1000,
    radius: 0.5,
  });

  const validateImageFile = (file: File): boolean => {
    const supportedFormats = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
      'image/tiff', 'image/tif'  // Added TIFF support
    ];
    
    return supportedFormats.some(format => file.type.startsWith(format)) || 
           !!file.name.toLowerCase().match(/\.(tiff?|cr2|nef|arw|dng|raw|orf|rw2|pef)$/);
  };

  const isTiffFile = (file: File): boolean => {
    return file.type === 'image/tiff' || file.type === 'image/tif' || 
           !!file.name.toLowerCase().match(/\.tiff?$/);
  };

  const convertTiffToDataURL = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const ifds = UTIF.decode(buffer);
          UTIF.decodeImage(buffer, ifds[0]);
          const rgba = UTIF.toRGBA8(ifds[0]);
          
          // Create canvas and draw the TIFF image
          const canvas = document.createElement('canvas');
          canvas.width = ifds[0].width;
          canvas.height = ifds[0].height;
          const ctx = canvas.getContext('2d')!;
          
          const imageData = new ImageData(new Uint8ClampedArray(rgba), ifds[0].width, ifds[0].height);
          ctx.putImageData(imageData, 0, 0);
          
          resolve(canvas.toDataURL());
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const createPreviewUrl = async (file: File): Promise<string> => {
    if (isTiffFile(file)) {
      return await convertTiffToDataURL(file);
    }
    return URL.createObjectURL(file);
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (validateImageFile(file)) {
        setSelectedImage(file);
        try {
          const url = await createPreviewUrl(file);
          setPreviewUrl(url);
          setResultUrl(null);
          setDepthMapUrl(null);
          
          // Advanced format detected - no toast needed
        } catch (error) {
          console.error('Error processing TIFF file:', error);
          // Error handled via console - no toast needed
        }
      } else {
        // Invalid file format - error handled via console
        console.error('Invalid image file format');
      }
    }
  };

  const handleStarlessImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (validateImageFile(file)) {
        setStarlessImage(file);
        try {
          const url = await createPreviewUrl(file);
          setStarlessPreview(url);
          setResultUrl(null);
          setDepthMapUrl(null);
        } catch (error) {
          console.error('Error processing TIFF file:', error);
          // Error handled via console
        }
      } else {
        console.error('Invalid starless image file format');
      }
    }
  };

  const handleStarsImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (validateImageFile(file)) {
        setStarsImage(file);
        try {
          const url = await createPreviewUrl(file);
          setStarsPreview(url);
          setResultUrl(null);
          setDepthMapUrl(null);
        } catch (error) {
          console.error('Error processing TIFF file:', error);
          // Error handled via console
        }
      } else {
        console.error('Invalid stars-only image file format');
      }
    }
  };

  const createStereoViews = useCallback((
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    depthMap: ImageData,
    width: number,
    height: number,
    params: ProcessingParams,
    starMask: Uint8ClampedArray
  ): { left: ImageData; right: ImageData } => {
    const originalData = ctx.getImageData(0, 0, width, height);
    const leftData = new ImageData(width, height);
    const rightData = new ImageData(width, height);

    // SIMPLE INVERSE MAPPING - Pull pixels from source (prevents gaps and black lines)
    // For each destination pixel, look back to the source and copy the pixel
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const destIdx = (y * width + x) * 4;
        
        // Get depth value at current position
        const depthValue = depthMap.data[destIdx] / 255.0;
        
        // Check if this is a star
        const isStar = params.preserveStarShapes && starMask[y * width + x] === 255;
        
        // Calculate shift amount based on depth
        // Simple approach: deeper objects shift less, closer objects shift more
        const shift = depthValue * params.maxShift;
        
        // LEFT VIEW: Pull from right (shift source to left)
        // When looking at left eye, objects shift left based on depth
        const leftSourceX = Math.round(x + shift);
        
        if (leftSourceX >= 0 && leftSourceX < width) {
          const leftSrcIdx = (y * width + leftSourceX) * 4;
          leftData.data[destIdx] = originalData.data[leftSrcIdx];
          leftData.data[destIdx + 1] = originalData.data[leftSrcIdx + 1];
          leftData.data[destIdx + 2] = originalData.data[leftSrcIdx + 2];
          leftData.data[destIdx + 3] = 255;
        } else {
          // Fill with black if out of bounds
          leftData.data[destIdx] = 0;
          leftData.data[destIdx + 1] = 0;
          leftData.data[destIdx + 2] = 0;
          leftData.data[destIdx + 3] = 255;
        }
        
        // RIGHT VIEW: Pull from left (shift source to right)
        // When looking at right eye, objects shift right based on depth
        const rightSourceX = Math.round(x - shift);
        
        if (rightSourceX >= 0 && rightSourceX < width) {
          const rightSrcIdx = (y * width + rightSourceX) * 4;
          rightData.data[destIdx] = originalData.data[rightSrcIdx];
          rightData.data[destIdx + 1] = originalData.data[rightSrcIdx + 1];
          rightData.data[destIdx + 2] = originalData.data[rightSrcIdx + 2];
          rightData.data[destIdx + 3] = 255;
        } else {
          // Fill with black if out of bounds
          rightData.data[destIdx] = 0;
          rightData.data[destIdx + 1] = 0;
          rightData.data[destIdx + 2] = 0;
          rightData.data[destIdx + 3] = 255;
        }
      }
    }

    return { left: leftData, right: rightData };
  }, []);

  const processFastMode = async () => {
    if (!selectedImage) return;
    
    setProcessing(true);
    setProgress(0);
    
    try {
      setProgressText(t('Starting image processing...', '开始图像处理...'));
      setProgress(10);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = () => resolve(null);
        img.onerror = reject;
        img.src = previewUrl!;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      setProgressText(t('Analyzing image structure...', '分析图像结构...'));
      setProgress(30);

      const { width, height } = canvas;
      const imageData = ctx.getImageData(0, 0, width, height);
      
      // Use simple depth map generation
      const simpleParams: SimpleDepthParams = {
        depth: params.maxShift,
        edgeWeight: params.edgeWeight,
        brightnessWeight: 1 - params.edgeWeight
      };
      
      const depthMap = generateSimpleDepthMap(imageData, simpleParams);
      const starMask = detectStars(imageData.data, width, height, params.starThreshold);
      
      setProgressText(t('Creating depth map...', '创建深度图...'));
      setProgress(50);
      
      const depthCanvas = document.createElement('canvas');
      const depthCtx = depthCanvas.getContext('2d')!;
      depthCanvas.width = width;
      depthCanvas.height = height;
      depthCtx.putImageData(depthMap, 0, 0);
      setDepthMapUrl(depthCanvas.toDataURL('image/png'));

      setProgressText(t('Generating stereo views...', '生成立体视图...'));
      setProgress(70);

      const { left, right } = createStereoViews(canvas, ctx, depthMap, width, height, params, starMask);
      
      // Create debug star mask visualization
      const starMaskCanvas = document.createElement('canvas');
      starMaskCanvas.width = width;
      starMaskCanvas.height = height;
      const starMaskCtx = starMaskCanvas.getContext('2d')!;
      const starMaskImageData = new ImageData(width, height);
      
      for (let i = 0; i < starMask.length; i++) {
        const starValue = starMask[i];
        const pixelIdx = i * 4;
        starMaskImageData.data[pixelIdx] = starValue;     // Red
        starMaskImageData.data[pixelIdx + 1] = starValue; // Green  
        starMaskImageData.data[pixelIdx + 2] = starValue; // Blue
        starMaskImageData.data[pixelIdx + 3] = 255;       // Alpha
      }
      
      starMaskCtx.putImageData(starMaskImageData, 0, 0);
      console.log('Star mask visualization created', starMaskCanvas.toDataURL());

      setProgressText(t('Compositing final stereo pair...', '合成最终立体对...'));
      setProgress(90);

      const resultCanvas = document.createElement('canvas');
      const resultCtx = resultCanvas.getContext('2d')!;
      
      if (borderSize > 0) {
        // Add configurable borders around the entire image
        const totalWidth = width * 2 + stereoSpacing + (borderSize * 2);
        const totalHeight = height + (borderSize * 2);
        
        resultCanvas.width = totalWidth;
        resultCanvas.height = totalHeight;

        // Fill entire canvas with black (creates the border)
        resultCtx.fillStyle = '#000000';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

        // Place left and right images with border offset
        resultCtx.putImageData(left, borderSize, borderSize);
        resultCtx.putImageData(right, borderSize + width + stereoSpacing, borderSize);
      } else {
        // No borders - standard layout
        resultCanvas.width = width * 2 + stereoSpacing;
        resultCanvas.height = height;

        resultCtx.fillStyle = '#000000';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

        resultCtx.putImageData(left, 0, 0);
        resultCtx.putImageData(right, width + stereoSpacing, 0);
      }

      setResultUrl(resultCanvas.toDataURL('image/png'));
      setProgress(100);
      setProgressText(t('Processing complete!', '处理完成！'));
    } catch (error) {
      console.error('Error processing image:', error);
      setProgressText(t('Error processing image', '处理图像时出错'));
    } finally {
      setProcessing(false);
      setTimeout(() => {
        setProgress(0);
        setProgressText('');
      }, 3000);
    }
  };

  const processTraditionalMode = async () => {
    if (!starlessImage && !starsImage) {
      console.error('Please select at least one image');
      return;
    }

    console.log('Starting traditional mode processing...');
    setProcessing(true);
    setProgress(0);
    
    try {
      const processor = new TraditionalMorphProcessor();
      const inputs: TraditionalInputs = {
        starlessImage: starlessImage || undefined,
        starsOnlyImage: starsImage || undefined
      };

      console.log('Creating traditional stereo pair...');
      const { leftCanvas, rightCanvas, depthMap } = await processor.createTraditionalStereoPair(
        inputs,
        traditionalParams,
        (step, progressValue) => {
          console.log('Traditional processing step:', step, progressValue);
          setProgressText(t(step, step));
          if (progressValue) setProgress(progressValue);
        }
      );

      console.log('Setting depth map URL...');
      setDepthMapUrl(depthMap.toDataURL('image/png'));
      
      console.log('Creating final stereo pair...');
      
      // Create final stereo pair with configurable borders
      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d')!;
      
      if (borderSize > 0) {
        // Add configurable borders
        const totalWidth = leftCanvas.width * 2 + stereoSpacing + (borderSize * 2);
        const totalHeight = leftCanvas.height + (borderSize * 2);
        
        finalCanvas.width = totalWidth;
        finalCanvas.height = totalHeight;

        // Fill with black borders
        finalCtx.fillStyle = '#000000';
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        // Place left and right images with border offset
        finalCtx.drawImage(leftCanvas, borderSize, borderSize);
        finalCtx.drawImage(rightCanvas, borderSize + leftCanvas.width + stereoSpacing, borderSize);
      } else {
        // No borders - standard layout
        finalCanvas.width = leftCanvas.width * 2 + stereoSpacing;
        finalCanvas.height = leftCanvas.height;

        finalCtx.fillStyle = '#000000';
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        finalCtx.drawImage(leftCanvas, 0, 0);
        finalCtx.drawImage(rightCanvas, leftCanvas.width + stereoSpacing, 0);
      }
      
      console.log('Setting result URL...');
      setResultUrl(finalCanvas.toDataURL('image/png'));
      
      processor.dispose();
      
      setProgress(100);
      setProgressText(t('Processing complete!', '处理完成！'));
      console.log('Traditional mode processing completed successfully');
    } catch (error) {
      console.error('Error processing traditional mode:', error);
      setProgressText(t('Error processing images in traditional mode', '传统模式处理图像时出错'));
    } finally {
      setProcessing(false);
      setTimeout(() => {
        setProgress(0);
        setProgressText('');
      }, 3000);
    }
  };

  const processImage = async () => {
    if (processingMode === 'fast') {
      await processFastMode();
    } else if (processingMode === 'traditional') {
      await processTraditionalMode();
    } else {
      await processAstrophysicsMode();
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `stereoscope-${selectedImage?.name || 'image'}.png`;
    link.click();
  };

  const downloadDepthMap = () => {
    if (!depthMapUrl) return;
    
    const link = document.createElement('a');
    link.href = depthMapUrl;
    link.download = `depth-map-${selectedImage?.name || 'image'}.png`;
    link.click();
  };

  const processAstrophysicsMode = async () => {
    if (!starlessImage || !starsImage) {
      toast.error(t('Please upload both starless and stars images', '请上传无星和恒星图像'));
      return;
    }

    if (!astrophysicsObjectName && !astrophysicsParams.ra && !astrophysicsParams.dec) {
      toast.error(t('Please enter an object name or RA/Dec coordinates', '请输入对象名称或RA/Dec坐标'));
      return;
    }

    setProcessing(true);
    setProgress(0);

    try {
      setProgressText(t('Starting astrophysics mode...', '开始天体物理模式...'));
      setProgress(5);

      // Detect stars in the stars-only image first
      const starsUrl = URL.createObjectURL(starsImage);
      const starsImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => {
          console.error('Failed to load stars image:', e);
          reject(new Error('Failed to load stars image. Please check the file format.'));
        };
        img.src = starsUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = starsImg.width;
      canvas.height = starsImg.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(starsImg, 0, 0);

      URL.revokeObjectURL(starsUrl);

      setProgressText(t('Detecting stars in image...', '检测图像中的恒星...'));
      setProgress(15);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const starMask = detectStars(imageData.data, canvas.width, canvas.height, params.starThreshold);

      // Convert star mask to detected stars array
      const detectedStars: any[] = [];
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const idx = (y * canvas.width + x);
          if (starMask[idx] > 128) {
            // Find local maximum
            let isMax = true;
            let flux = 0;
            for (let dy = -2; dy <= 2; dy++) {
              for (let dx = -2; dx <= 2; dx++) {
                const checkIdx = ((y + dy) * canvas.width + (x + dx));
                if (checkIdx >= 0 && checkIdx < starMask.length) {
                  const checkVal = starMask[checkIdx];
                  if (checkVal > starMask[idx]) {
                    isMax = false;
                  }
                  flux += checkVal;
                }
              }
            }
            if (isMax && flux > 0) {
              detectedStars.push({ x, y, flux, radius: 2 });
            }
          }
        }
      }

      setProgressText(t(`Detected ${detectedStars.length} stars`, `检测到 ${detectedStars.length} 颗恒星`));
      setProgress(25);

      // Create astrophysics stereo pair
      const params_with_name = {
        ...astrophysicsParams,
        objectName: astrophysicsObjectName || undefined,
      };

      const { leftCanvas, rightCanvas, gaiaData } = await AstrophysicsService.createAstrophysicsStereoPair(
        starlessImage,
        starsImage,
        detectedStars,
        params_with_name,
        (step, prog) => {
          setProgressText(step);
          if (prog) setProgress(Math.min(prog, 95));
        }
      );

      setProgressText(t('Creating final stereo pair...', '创建最终立体对...'));
      setProgress(96);

      // Create final composite with spacing and borders
      const finalCanvas = document.createElement('canvas');
      const finalCtx = finalCanvas.getContext('2d')!;

      if (borderSize > 0) {
        const totalWidth = leftCanvas.width * 2 + stereoSpacing + (borderSize * 2);
        const totalHeight = leftCanvas.height + (borderSize * 2);
        
        finalCanvas.width = totalWidth;
        finalCanvas.height = totalHeight;

        finalCtx.fillStyle = '#000000';
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        finalCtx.drawImage(leftCanvas, borderSize, borderSize);
        finalCtx.drawImage(rightCanvas, borderSize + leftCanvas.width + stereoSpacing, borderSize);
      } else {
        finalCanvas.width = leftCanvas.width * 2 + stereoSpacing;
        finalCanvas.height = leftCanvas.height;

        finalCtx.fillStyle = '#000000';
        finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

        finalCtx.drawImage(leftCanvas, 0, 0);
        finalCtx.drawImage(rightCanvas, leftCanvas.width + stereoSpacing, 0);
      }

      setResultUrl(finalCanvas.toDataURL('image/png'));
      setProgress(100);
      setProgressText(t(`Astrophysics processing complete! Matched ${gaiaData.count} Gaia stars`, `天体物理处理完成！匹配了 ${gaiaData.count} 颗Gaia恒星`));

      toast.success(t('Astrophysics stereo pair generated successfully', '天体物理立体对生成成功'));
    } catch (error) {
      console.error('Error in astrophysics mode:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : (typeof error === 'string' ? error : t('Failed to process. Please check console for details.', '处理失败。请检查控制台获取详细信息。'));
      setProgressText(t('Error: ', '错误：') + errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
      setTimeout(() => {
        setProgress(0);
        setProgressText('');
      }, 3000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full">
          <Layers className="h-6 w-6 text-purple-400" />
          <span className="text-xl font-semibold text-white">
            {t('Stereoscope Processor', '立体镜处理器')}
          </span>
        </div>
        <p className="text-cosmic-300 text-lg max-w-3xl mx-auto">
          {t('Convert 2D astronomy images into 3D stereo pairs for stereoscopic viewing', '将2D天文图像转换为3D立体对用于立体观看')}
        </p>
      </div>

      {/* Processing Mode Tabs */}
      <div className="flex justify-center">
        <Tabs value={processingMode} onValueChange={(value) => setProcessingMode(value as 'fast' | 'traditional' | 'astrophysics')} className="w-full max-w-4xl">
          <TabsList className="grid w-full grid-cols-3 bg-cosmic-900/50 border border-cosmic-700/50">
            <TabsTrigger value="fast" className="flex items-center gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
              <Eye className="h-4 w-4" />
              {t('Fast Mode', '快速模式')}
            </TabsTrigger>
            <TabsTrigger value="traditional" className="flex items-center gap-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-300">
              <Layers className="h-4 w-4" />
              {t('Traditional Morph Mode', '传统变形模式')}
            </TabsTrigger>
            <TabsTrigger value="astrophysics" className="flex items-center gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Settings2 className="h-4 w-4" />
              {t('Astrophysics Mode', '天体物理模式')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="fast" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                      <Upload className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">
                        {t('Single Image Input', '单图像输入')}
                      </CardTitle>
                      <CardDescription className="text-cosmic-300">
                        {t('Upload a nebula or deep space image. Our AI will automatically detect stars and nebula structures.', '上传星云或深空图像。我们的AI将自动检测恒星和星云结构。')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-24 bg-cosmic-800/50 hover:bg-cosmic-700/50 border-2 border-dashed border-cosmic-600 hover:border-blue-500/50 transition-all"
                      variant="outline"
                      disabled={processing}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-6 h-6 text-cosmic-400" />
                        <span className="text-sm text-cosmic-300">
                          {selectedImage ? selectedImage.name : t('Click to upload image', '点击上传图像')}
                        </span>
                      </div>
                    </Button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.tiff,.tif,.cr2,.nef,.arw,.dng,.raw,.orf,.rw2,.pef"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    {previewUrl && (
                      <div className="space-y-2">
                        <Label>{t('Preview', '预览')}</Label>
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg border border-cosmic-700"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                      <Eye className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">
                        {t('AI Auto-Intelligence Parameters', 'AI自动智能参数')}
                      </CardTitle>
                      <CardDescription className="text-cosmic-300">
                        {t('Advanced parameters automatically optimized for your image.', '为您的图像自动优化的高级参数。')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label className="flex items-center justify-between">
                        <span>{t('Stereo Spacing', '立体间距')}</span>
                        <span className="text-amber-400 font-mono text-lg">({stereoSpacing}px)</span>
                      </Label>
                      <Slider
                        value={[stereoSpacing]}
                        onValueChange={([value]) => setStereoSpacing(value)}
                        min={0}
                        max={600}
                        step={10}
                        className="mt-2"
                      />
                      <p className="text-xs text-cosmic-400 mt-1">
                        {t('Gap between left and right stereo images for easier viewing', '左右立体图像之间的间隔，便于观看')}
                      </p>
                    </div>

                    <div>
                      <Label className="flex items-center justify-between">
                        <span>{t('Border Size', '边框大小')}</span>
                        <span className="text-amber-400 font-mono text-lg">({borderSize}px)</span>
                      </Label>
                      <Slider
                        value={[borderSize]}
                        onValueChange={([value]) => setBorderSize(value)}
                        min={0}
                        max={600}
                        step={25}
                        className="mt-2"
                      />
                      <p className="text-xs text-cosmic-400 mt-1">
                        {t('Size of black borders around stereo pair (0 = no borders)', '立体对周围黑色边框的大小（0 = 无边框）')}
                      </p>
                    </div>

                    {processing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{progressText}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                      </div>
                    )}

                    <Button
                      onClick={processImage}
                      disabled={!selectedImage || processing}
                      className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/20"
                    >
                      {processing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      {processing ? t('Processing...', '处理中...') : t('Generate', '生成')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="traditional" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                      <Layers className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">
                        {t('Starless & Stars Images', '无星和恒星图像')}
                      </CardTitle>
                      <CardDescription className="text-cosmic-300">
                        {t('Upload separate starless nebula and stars-only images for professional-quality 3D processing.', '上传分离的无星星云和纯星图像进行专业品质3D处理。')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-orange-400">{t('Stars-Only Image', '纯星图像')}</Label>
                      <Button
                        onClick={() => starsInputRef.current?.click()}
                        className="group w-full h-20 mt-2 bg-cosmic-800/50 hover:bg-orange-500/10 border-2 border-dashed border-cosmic-600 hover:border-orange-500/50 transition-all"
                        variant="outline"
                        disabled={processing}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-5 h-5 text-cosmic-400 group-hover:text-orange-400 transition-colors" />
                          <span className="text-sm text-cosmic-300 group-hover:hidden">
                            {t('Click to upload', '点击上传')}
                          </span>
                          <span className="text-sm text-orange-400 hidden group-hover:block">
                            {t('Stars Only', '纯星图像')}
                          </span>
                        </div>
                      </Button>
                      
                      <input
                        ref={starsInputRef}
                        type="file"
                        accept="image/*,.tiff,.tif,.cr2,.nef,.arw,.dng,.raw,.orf,.rw2,.pef"
                        onChange={handleStarsImageSelect}
                        className="hidden"
                      />

                      {starsPreview && (
                        <div className="mt-2">
                          <img
                            src={starsPreview}
                            alt="Stars Preview"
                            className="w-full h-32 object-cover rounded-lg border border-cosmic-700 hover:border-orange-500/50 transition-all"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-cosmic-200">{t('Starless Image', '无星图像')}</Label>
                      <Button
                        onClick={() => starlessInputRef.current?.click()}
                        className="group w-full h-20 mt-2 bg-cosmic-800/50 hover:bg-purple-500/10 border-2 border-dashed border-cosmic-600 hover:border-purple-500/50 transition-all"
                        variant="outline"
                        disabled={processing}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-5 h-5 text-cosmic-400 group-hover:text-purple-400 transition-colors" />
                          <span className="text-sm text-cosmic-300 group-hover:hidden">
                            {t('Click to upload', '点击上传')}
                          </span>
                          <span className="text-sm text-purple-400 hidden group-hover:block">
                            {t('Starless', '无星图像')}
                          </span>
                        </div>
                      </Button>
                      
                      <input
                        ref={starlessInputRef}
                        type="file"
                        accept="image/*,.tiff,.tif,.cr2,.nef,.arw,.dng,.raw,.orf,.rw2,.pef"
                        onChange={handleStarlessImageSelect}
                        className="hidden"
                      />

                      {starlessPreview && (
                        <div className="mt-2">
                          <img
                            src={starlessPreview}
                            alt="Starless Preview"
                            className="w-full h-32 object-cover rounded-lg border border-cosmic-700 hover:border-purple-500/50 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                      <Settings2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">
                        {t('Traditional Morph Parameters', '传统变形参数')}
                      </CardTitle>
                      <CardDescription className="text-cosmic-300">
                        {t('Professional parameters for authentic 3D astrophotography.', '用于真实3D天体摄影的专业参数。')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label className="flex items-center justify-between">
                        <span>{t('Horizontal Displacement', '水平位移')}</span>
                        <span className="text-amber-400 font-mono text-lg">({traditionalParams.horizontalDisplace})</span>
                      </Label>
                      <Slider
                        value={[traditionalParams.horizontalDisplace]}
                        onValueChange={([value]) => setTraditionalParams(prev => ({ ...prev, horizontalDisplace: value }))}
                        min={10}
                        max={50}
                        step={2}
                        className="mt-2"
                      />
                      <p className="text-xs text-cosmic-400 mt-1">
                        {t('Controls nebula depth displacement effect (10-30 recommended)', '控制星云深度位移效果（推荐10-30）')}
                      </p>
                    </div>

                     <div>
                       <Label className="flex items-center justify-between">
                         <span>{t('Star Shift Amount', '恒星位移量')}</span>
                         <span className="text-amber-400 font-mono text-lg">({traditionalParams.starShiftAmount}px)</span>
                       </Label>
                       <Slider
                         value={[traditionalParams.starShiftAmount]}
                         onValueChange={([value]) => setTraditionalParams(prev => ({ ...prev, starShiftAmount: value }))}
                         min={1}
                         max={10}
                         step={1}
                         className="mt-2"
                       />
                       <p className="text-xs text-cosmic-400 mt-1">
                         {t('Distance to shift individual stars for 3D positioning', '移动单个恒星进行3D定位的距离')}
                       </p>
                     </div>

                     <div>
                       <Label className="flex items-center justify-between">
                         <span>{t('Stereo Spacing', '立体间距')}</span>
                         <span className="text-amber-400 font-mono text-lg">({stereoSpacing}px)</span>
                       </Label>
                       <Slider
                         value={[stereoSpacing]}
                         onValueChange={([value]) => setStereoSpacing(value)}
                         min={0}
                         max={600}
                         step={10}
                         className="mt-2"
                       />
                       <p className="text-xs text-cosmic-400 mt-1">
                         {t('Gap between left and right stereo images for easier viewing', '左右立体图像之间的间隔，便于观看')}
                       </p>
                     </div>

                    <div>
                      <Label className="flex items-center justify-between">
                        <span>{t('Border Size', '边框大小')}</span>
                        <span className="text-amber-400 font-mono text-lg">({borderSize}px)</span>
                      </Label>
                      <Slider
                        value={[borderSize]}
                        onValueChange={([value]) => setBorderSize(value)}
                        min={0}
                        max={600}
                        step={25}
                        className="mt-2"
                      />
                      <p className="text-xs text-cosmic-400 mt-1">
                        {t('Size of black borders around stereo pair (0 = no borders)', '立体对周围黑色边框的大小（0 = 无边框）')}
                      </p>
                    </div>

                    {processing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{progressText}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                      </div>
                    )}

                    <Button
                      onClick={processImage}
                      disabled={(!starlessImage && !starsImage) || processing}
                      className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-lg shadow-lg shadow-amber-500/20"
                    >
                      {processing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Layers className="h-4 w-4 mr-2" />
                      )}
                      {processing ? t('Processing...', '处理中...') : t('Generate', '生成')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="astrophysics" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                      <Layers className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">
                        {t('Starless & Stars Images', '无星和恒星图像')}
                      </CardTitle>
                      <CardDescription className="text-cosmic-300">
                        {t('Upload separate images for Gaia-based precise depth mapping.', '上传分离的图像进行基于Gaia的精确深度映射。')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-orange-400">{t('Stars-Only Image', '纯星图像')}</Label>
                      <Button
                        onClick={() => starsInputRef.current?.click()}
                        className="group w-full h-20 mt-2 bg-cosmic-800/50 hover:bg-orange-500/10 border-2 border-dashed border-cosmic-600 hover:border-orange-500/50 transition-all"
                        variant="outline"
                        disabled={processing}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-5 h-5 text-cosmic-400 group-hover:text-orange-400 transition-colors" />
                          <span className="text-sm text-cosmic-300">
                            {starsImage ? starsImage.name : t('Click to upload', '点击上传')}
                          </span>
                        </div>
                      </Button>
                      
                      <input
                        ref={starsInputRef}
                        type="file"
                        accept="image/*,.tiff,.tif,.cr2,.nef,.arw,.dng,.raw,.orf,.rw2,.pef"
                        onChange={handleStarsImageSelect}
                        className="hidden"
                      />

                      {starsPreview && (
                        <div className="mt-2">
                          <img
                            src={starsPreview}
                            alt="Stars Preview"
                            className="w-full h-32 object-cover rounded-lg border border-cosmic-700 hover:border-orange-500/50 transition-all"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-cosmic-200">{t('Starless Image', '无星图像')}</Label>
                      <Button
                        onClick={() => starlessInputRef.current?.click()}
                        className="group w-full h-20 mt-2 bg-cosmic-800/50 hover:bg-purple-500/10 border-2 border-dashed border-cosmic-600 hover:border-purple-500/50 transition-all"
                        variant="outline"
                        disabled={processing}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-5 h-5 text-cosmic-400 group-hover:text-purple-400 transition-colors" />
                          <span className="text-sm text-cosmic-300">
                            {starlessImage ? starlessImage.name : t('Click to upload', '点击上传')}
                          </span>
                        </div>
                      </Button>
                      
                      <input
                        ref={starlessInputRef}
                        type="file"
                        accept="image/*,.tiff,.tif,.cr2,.nef,.arw,.dng,.raw,.orf,.rw2,.pef"
                        onChange={handleStarlessImageSelect}
                        className="hidden"
                      />

                      {starlessPreview && (
                        <div className="mt-2">
                          <img
                            src={starlessPreview}
                            alt="Starless Preview"
                            className="w-full h-32 object-cover rounded-lg border border-cosmic-700 hover:border-purple-500/50 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center border border-purple-500/30">
                      <Settings2 className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-white">
                        {t('Gaia Astrophysics Parameters', 'Gaia天体物理参数')}
                      </CardTitle>
                      <CardDescription className="text-cosmic-300">
                        {t('Precise depth mapping using Gaia DR3 stellar parallax data.', '使用Gaia DR3恒星视差数据进行精确深度映射。')}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label className="flex items-center justify-between mb-2">
                        <span>{t('Object Name', '对象名称')}</span>
                      </Label>
                      <Input
                        type="text"
                        placeholder={t('e.g., M31, NGC 7000, Orion Nebula', '例如: M31, NGC 7000, 猎户座星云')}
                        value={astrophysicsObjectName}
                        onChange={(e) => setAstrophysicsObjectName(e.target.value)}
                        className="bg-cosmic-800/50 border-cosmic-600"
                        disabled={processing}
                      />
                      <p className="text-xs text-cosmic-400 mt-1">
                        {t('Enter deep sky object name for automatic coordinate resolution', '输入深空对象名称以自动解析坐标')}
                      </p>
                    </div>

                    <div>
                      <Label className="flex items-center justify-between">
                        <span>{t('Field of View', '视场')}</span>
                        <span className="text-purple-400 font-mono text-lg">({astrophysicsParams.fovDeg}°)</span>
                      </Label>
                      <Slider
                        value={[astrophysicsParams.fovDeg || 1.0]}
                        onValueChange={([value]) => setAstrophysicsParams({ ...astrophysicsParams, fovDeg: value })}
                        min={0.1}
                        max={5.0}
                        step={0.1}
                        className="mt-2"
                      />
                      <p className="text-xs text-cosmic-400 mt-1">
                        {t('Field of view in degrees', '视场（度）')}
                      </p>
                    </div>

                    <div>
                      <Label className="flex items-center justify-between">
                        <span>{t('Stereo Baseline', '立体基线')}</span>
                        <span className="text-purple-400 font-mono text-lg">({astrophysicsParams.baseline} AU)</span>
                      </Label>
                      <Slider
                        value={[astrophysicsParams.baseline || 1.0]}
                        onValueChange={([value]) => setAstrophysicsParams({ ...astrophysicsParams, baseline: value })}
                        min={0.1}
                        max={10.0}
                        step={0.1}
                        className="mt-2"
                      />
                      <p className="text-xs text-cosmic-400 mt-1">
                        {t('Virtual camera separation in Astronomical Units', '虚拟相机间距（天文单位）')}
                      </p>
                    </div>

                    <div>
                      <Label className="flex items-center justify-between">
                        <span>{t('Depth Scale Factor', '深度缩放因子')}</span>
                        <span className="text-purple-400 font-mono text-lg">({astrophysicsParams.scaleFactor}x)</span>
                      </Label>
                      <Slider
                        value={[astrophysicsParams.scaleFactor || 1000]}
                        onValueChange={([value]) => setAstrophysicsParams({ ...astrophysicsParams, scaleFactor: value })}
                        min={100}
                        max={5000}
                        step={100}
                        className="mt-2"
                      />
                      <p className="text-xs text-cosmic-400 mt-1">
                        {t('Amplification of 3D effect for visual impact', '3D效果放大以获得视觉冲击')}
                      </p>
                    </div>

                    <div>
                      <Label className="flex items-center justify-between">
                        <span>{t('Stereo Spacing', '立体间距')}</span>
                        <span className="text-purple-400 font-mono text-lg">({stereoSpacing}px)</span>
                      </Label>
                      <Slider
                        value={[stereoSpacing]}
                        onValueChange={([value]) => setStereoSpacing(value)}
                        min={0}
                        max={600}
                        step={10}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="flex items-center justify-between">
                        <span>{t('Border Size', '边框大小')}</span>
                        <span className="text-purple-400 font-mono text-lg">({borderSize}px)</span>
                      </Label>
                      <Slider
                        value={[borderSize]}
                        onValueChange={([value]) => setBorderSize(value)}
                        min={0}
                        max={600}
                        step={25}
                        className="mt-2"
                      />
                    </div>

                    {processing && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{progressText}</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="w-full" />
                      </div>
                    )}

                    <Button
                      onClick={processImage}
                      disabled={(!starlessImage || !starsImage) || processing}
                      className="w-full h-14 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold text-lg shadow-lg shadow-purple-500/20"
                    >
                      {processing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Settings2 className="h-4 w-4 mr-2" />
                      )}
                      {processing ? t('Processing...', '处理中...') : t('Generate with Gaia', '使用Gaia生成')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Results Section */}
      {(depthMapUrl || resultUrl) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {depthMapUrl && (
              <Card className="cosmic-border bg-cosmic-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center justify-between">
                    {t('Generated Depth Map', '生成的深度图')}
                    <Button onClick={downloadDepthMap} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {t('Download', '下载')}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={depthMapUrl}
                    alt="Depth Map"
                    className="w-full max-w-2xl mx-auto rounded-lg border border-cosmic-700"
                  />
                </CardContent>
              </Card>
            )}

            {resultUrl && (
              <Card className="cosmic-border bg-cosmic-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center justify-between">
                    {t('Stereoscopic Result', '立体效果结果')}
                    <Button onClick={downloadResult} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {t('Download', '下载')}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <img
                    src={resultUrl}
                    alt="Stereoscopic Result"
                    className="w-full rounded-lg border border-cosmic-700"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
    </div>
  );
};

export default StereoscopeProcessor;