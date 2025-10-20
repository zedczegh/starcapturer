import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Upload, Eye, Download, Loader2, Layers } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { generateSimpleDepthMap, detectStars, type SimpleDepthParams } from '@/lib/simpleDepthMap';
import { TraditionalMorphProcessor, type TraditionalInputs, type TraditionalMorphParams } from '@/lib/traditionalMorphMode';
import { NobelPrizeStereoscopeEngine } from '@/lib/advanced/NobelPrizeStereoscopeEngine';
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
  const [processingMode, setProcessingMode] = useState<'fast' | 'traditional'>('fast');
  
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
    starBackgroundShift: 25, // Initial shift of all stars left/back (behind nebula)
    luminanceBlur: 1.5,
    contrastBoost: 1.2
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
    } else {
      await processTraditionalMode();
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cosmic-200 bg-clip-text text-transparent mb-4">
            {t('Stereoscope Processor', '立体镜处理器')}
          </h1>
          <p className="text-cosmic-300 text-lg">
            {t('Convert 2D astronomy images into 3D stereo pairs for stereoscopic viewing', '将2D天文图像转换为3D立体对用于立体观看')}
          </p>
        </div>

        <Tabs value={processingMode} onValueChange={(value) => setProcessingMode(value as 'fast' | 'traditional')} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fast" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {t('Fast Mode', '快速模式')}
            </TabsTrigger>
            <TabsTrigger value="traditional" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              {t('Traditional Morph Mode', '传统变形模式')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="fast" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="cosmic-border bg-cosmic-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    {t('Single Image Input', '单图像输入')}
                  </CardTitle>
                  <CardDescription>
                    {t('Upload a nebula or deep space image. Our AI will automatically detect stars and nebula structures.', '上传星云或深空图像。我们的AI将自动检测恒星和星云结构。')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                      variant="outline"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {t('Select Image', '选择图像')}
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

              <Card className="cosmic-border bg-cosmic-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary">
                    {t('AI Auto-Intelligence Parameters', 'AI自动智能参数')}
                  </CardTitle>
                  <CardDescription>
                    {t('Advanced parameters automatically optimized for your image.', '为您的图像自动优化的高级参数。')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label>{t('Stereo Spacing', '立体间距')} ({stereoSpacing}px)</Label>
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
                      <Label>{t('Border Size', '边框大小')} ({borderSize}px)</Label>
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
                      className="w-full"
                    >
                      {processing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Eye className="h-4 w-4 mr-2" />
                      )}
                      {processing ? t('Processing...', '处理中...') : t('Generate Fast Stereo Pair', '生成快速立体对')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="traditional" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="cosmic-border bg-cosmic-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    {t('Starless & Stars Images', '无星和恒星图像')}
                  </CardTitle>
                  <CardDescription>
                    {t('Upload separate starless nebula and stars-only images for professional-quality 3D processing.', '上传分离的无星星云和纯星图像进行专业品质3D处理。')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">{t('Starless Nebula Image', '无星星云图像')}</Label>
                      <Button
                        onClick={() => starlessInputRef.current?.click()}
                        className="w-full mt-2"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {t('Select Starless Image', '选择无星图像')}
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
                            className="w-full h-32 object-cover rounded-lg border border-cosmic-700"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm font-medium">{t('Stars-Only Image', '纯星图像')}</Label>
                      <Button
                        onClick={() => starsInputRef.current?.click()}
                        className="w-full mt-2"
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {t('Select Stars Image', '选择星图像')}
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
                            className="w-full h-32 object-cover rounded-lg border border-cosmic-700"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cosmic-border bg-cosmic-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary">
                    {t('Traditional Morph Parameters', '传统变形参数')}
                  </CardTitle>
                  <CardDescription>
                    {t('Professional parameters for authentic 3D astrophotography.', '用于真实3D天体摄影的专业参数。')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <Label>{t('Horizontal Displacement', '水平位移')} ({traditionalParams.horizontalDisplace})</Label>
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
                       <Label>{t('Star Shift Amount', '恒星位移量')} ({traditionalParams.starShiftAmount}px)</Label>
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
                       <Label>{t('Stereo Spacing', '立体间距')} ({stereoSpacing}px)</Label>
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
                      <Label>{t('Border Size', '边框大小')} ({borderSize}px)</Label>
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
                      className="w-full"
                    >
                      {processing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Layers className="h-4 w-4 mr-2" />
                      )}
                      {processing ? t('Processing...', '处理中...') : t('Generate Traditional Stereo Pair', '生成传统立体对')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Results Section */}
        {(depthMapUrl || resultUrl) && (
          <div className="mt-8 space-y-6">
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
    </div>
  );
};

export default StereoscopeProcessor;