import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Eye, Download, Loader2, Layers } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { generateScientificAstroDepthMap } from '@/lib/scientificAstroDepth';
import { TraditionalMorphProcessor, type TraditionalInputs, type TraditionalMorphParams } from '@/lib/traditionalMorphMode';
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
  const [stereoSpacing, setStereoSpacing] = useState<number>(300);
  
  // Add autocrop toggle
  const [autoCrop, setAutoCrop] = useState<boolean>(false);
  
  // Traditional mode parameters
  const [traditionalParams, setTraditionalParams] = useState<TraditionalMorphParams>({
    horizontalDisplace: 20,
    starShiftAmount: 3,
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
          
          if (file.name.toLowerCase().match(/\.(tiff?|cr2|nef|arw|dng|raw|orf|rw2|pef)$/)) {
            toast.info(t('Advanced format detected. Processing for optimal results...', '检测到高级格式。正在处理以获得最佳结果...'));
          }
        } catch (error) {
          console.error('Error processing TIFF file:', error);
          toast.error(t('Error processing TIFF file. Please try a different format.', '处理TIFF文件时出错。请尝试其他格式。'));
        }
      } else {
        toast.error(t('Please select a valid image file (JPEG, PNG, TIFF, RAW formats supported)', '请选择有效的图像文件（支持JPEG、PNG、TIFF、RAW格式）'));
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
          toast.error(t('Error processing TIFF file. Please try a different format.', '处理TIFF文件时出错。请尝试其他格式。'));
        }
      } else {
        toast.error(t('Please select a valid starless image file', '请选择有效的无星图像文件'));
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
          toast.error(t('Error processing TIFF file. Please try a different format.', '处理TIFF文件时出错。请尝试其他格式。'));
        }
      } else {
        toast.error(t('Please select a valid stars-only image file', '请选择有效的纯星图像文件'));
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

    // Initialize with black
    leftData.data.fill(0);
    rightData.data.fill(0);
    for (let i = 3; i < leftData.data.length; i += 4) {
      leftData.data[i] = 255; // Alpha
      rightData.data[i] = 255; // Alpha
    }

    // Count stars for debugging
    let starCount = 0;
    for (let i = 0; i < starMask.length; i++) {
      if (starMask[i] === 255) starCount++;
    }
    console.log(`Detected ${starCount} star pixels`);
    console.log(`Star parallax: ${params.starParallaxPx}px, Max shift: ${params.maxShift}px`);

    // Process each source pixel and place it correctly in left/right views
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const srcIdx = y * width + x;
        const srcPixelIdx = srcIdx * 4;
        
        // Get source pixel data
        const r = originalData.data[srcPixelIdx];
        const g = originalData.data[srcPixelIdx + 1];
        const b = originalData.data[srcPixelIdx + 2];
        
        // Skip black pixels
        if (r === 0 && g === 0 && b === 0) continue;
        
        let leftDestX = x;   // Left image - no shift for stars
        let rightDestX = x;  // Right image - will be shifted for stars
        
        if (params.preserveStarShapes && starMask[srcIdx] === 255) {
          // Star pixel - only process if it's a genuine bright star (not hot pixels/noise)
          const starBrightness = Math.max(r, g, b);
          
          // Much higher threshold to avoid hot pixels - only process very bright stars
          if (starBrightness > params.starThreshold + 50) {
            // Very bright stars appear closer - shift RIGHT on right image
            rightDestX = x + Math.round(params.starParallaxPx);
          } else if (starBrightness > params.starThreshold) {
            // Medium bright stars appear further - shift LEFT on right image  
            rightDestX = x - Math.round(params.starParallaxPx * 0.3);
          } else {
            // Too dim - treat as nebula, not a star
            const depthValue = depthMap.data[srcPixelIdx] / 255.0;
            const baseShift = Math.round(depthValue * params.maxShift);
            leftDestX = x - baseShift;
            rightDestX = x + baseShift;
          }
          
          if (x < 5 && y < 5) {
            console.log(`Star at (${x},${y}) brightness=${starBrightness}, threshold=${params.starThreshold}, moving to rightX=${rightDestX}`);
          }
        } else {
          // Non-star pixel - use depth map for subtle parallax
          const depthValue = depthMap.data[srcPixelIdx] / 255.0;
          const baseShift = Math.round(depthValue * params.maxShift);
          leftDestX = x - baseShift;  // Left view shifts opposite
          rightDestX = x + baseShift; // Right view normal shift
        }
        
        // Place original pixel in left view
        if (leftDestX >= 0 && leftDestX < width) {
          const leftDestIdx = (y * width + leftDestX) * 4;
          leftData.data[leftDestIdx] = r;
          leftData.data[leftDestIdx + 1] = g;
          leftData.data[leftDestIdx + 2] = b;
          leftData.data[leftDestIdx + 3] = 255;
        }
        
        // Place original pixel in right view
        if (rightDestX >= 0 && rightDestX < width) {
          const rightDestIdx = (y * width + rightDestX) * 4;
          rightData.data[rightDestIdx] = r;
          rightData.data[rightDestIdx + 1] = g;
          rightData.data[rightDestIdx + 2] = b;
          rightData.data[rightDestIdx + 3] = 255;
        }
      }
    }

    return { left: leftData, right: rightData };
  }, []);

  const processFastMode = async () => {
    if (!selectedImage) return;
    
    setProcessing(true);
    
    try {
      toast.info(t('Starting image processing...', '开始图像处理...'));
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = previewUrl!;
      });

      // Optional auto-crop to 16:9 aspect ratio for optimal processing
      let finalWidth = img.width;
      let finalHeight = img.height;
      let cropX = 0;
      let cropY = 0;
      
      if (autoCrop) {
        const targetRatio = 16 / 9;
        const currentRatio = finalWidth / finalHeight;
        
        if (Math.abs(currentRatio - targetRatio) > 0.1) {
          if (currentRatio > targetRatio) {
            finalWidth = Math.round(finalHeight * targetRatio);
            cropX = (img.width - finalWidth) / 2;
          } else {
            finalHeight = Math.round(finalWidth / targetRatio);
            cropY = (img.height - finalHeight) / 2;
          }
          toast.info(t('Auto-cropping to 16:9 for optimal processing', '自动裁剪为16:9以获得最佳处理效果'));
        }
      }

      canvas.width = finalWidth;
      canvas.height = finalHeight;
      ctx.drawImage(img, cropX, cropY, finalWidth, finalHeight, 0, 0, finalWidth, finalHeight);

      const { width, height } = canvas;
      const { depthMap, starMask } = generateScientificAstroDepthMap(canvas, ctx, width, height, params);
      
      const depthCanvas = document.createElement('canvas');
      const depthCtx = depthCanvas.getContext('2d')!;
      depthCanvas.width = width;
      depthCanvas.height = height;
      depthCtx.putImageData(depthMap, 0, 0);
      setDepthMapUrl(depthCanvas.toDataURL());

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

      const resultCanvas = document.createElement('canvas');
      const resultCtx = resultCanvas.getContext('2d')!;
      
      // Add 600px borders around the entire image
      const borderSize = 600;
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

      setResultUrl(resultCanvas.toDataURL());
      
      toast.success(t('Nobel Prize-level stereoscopic pair generated successfully!', '诺贝尔奖级立体镜对生成成功！'));
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error(t('Error processing image', '处理图像时出错'));
    } finally {
      setProcessing(false);
    }
  };

  const processTraditionalMode = async () => {
    if (!starlessImage || !starsImage) {
      toast.error(t('Please select both starless and stars-only images', '请选择无星和纯星图像'));
      return;
    }

    setProcessing(true);
    
    try {
      const processor = new TraditionalMorphProcessor();
      const inputs: TraditionalInputs = {
        starlessImage,
        starsOnlyImage: starsImage
      };

      const { leftCanvas, rightCanvas, depthMap } = await processor.createTraditionalStereoPair(
        inputs,
        traditionalParams,
        (step) => {
          toast.info(t(step, step));
        }
      );

      setDepthMapUrl(depthMap.toDataURL());
      const finalPair = processor.createFinalStereoPair(leftCanvas, rightCanvas, stereoSpacing);
      setResultUrl(finalPair.toDataURL());
      processor.dispose();
      
      toast.success(t('Traditional morph stereoscopic pair created successfully!', '传统变形立体对创建成功！'));
    } catch (error) {
      console.error('Error processing traditional mode:', error);
      toast.error(t('Error processing images in traditional mode', '传统模式处理图像时出错'));
    } finally {
      setProcessing(false);
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
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autocrop">{t('Auto-crop to 16:9', '自动裁剪为16:9')}</Label>
                      <Switch
                        id="autocrop"
                        checked={autoCrop}
                        onCheckedChange={setAutoCrop}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="cosmic-border bg-cosmic-900/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-primary">
                    {t('AI Auto-Intelligence Parameters', 'AI自动智能参数')}
                  </CardTitle>
                  <CardDescription>
                    {t('Advanced parameters automatically optimized for your image. Manual adjustments available for fine-tuning.', '为您的图像自动优化的高级参数。可进行手动调整以进行微调。')}
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
                    {t('Upload separate starless nebula and stars-only images for professional-quality 3D processing based on photographingspace.com methodology.', '上传分离的无星星云和纯星图像，基于photographingspace.com方法进行专业品质3D处理。')}
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
                    {t('Professional parameters based on J-P Metsavainio\'s methodology for authentic 3D astrophotography.', '基于J-P Metsavainio方法的专业参数，用于真实的3D天体摄影。')}
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

                    <Button
                      onClick={processImage}
                      disabled={!starlessImage || !starsImage || processing}
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