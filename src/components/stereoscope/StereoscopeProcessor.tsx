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
  
  // Unified mode states
  const [starlessImage, setStarlessImage] = useState<File | null>(null);
  const [starsImage, setStarsImage] = useState<File | null>(null);
  const [starlessPreview, setStarlessPreview] = useState<string | null>(null);
  const [starsPreview, setStarsPreview] = useState<string | null>(null);
  
  // Result states
  const [processing, setProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [starlessDepthMapUrl, setStarlessDepthMapUrl] = useState<string | null>(null);
  const [starsDepthMapUrl, setStarsDepthMapUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
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

  const handleStarlessImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (validateImageFile(file)) {
        setStarlessImage(file);
        try {
          const url = await createPreviewUrl(file);
          setStarlessPreview(url);
          setResultUrl(null);
          setStarlessDepthMapUrl(null);
          setStarsDepthMapUrl(null);
        } catch (error) {
          console.error('Error processing TIFF file:', error);
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
          setStarlessDepthMapUrl(null);
          setStarsDepthMapUrl(null);
        } catch (error) {
          console.error('Error processing TIFF file:', error);
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

  const processUnifiedMode = async () => {
    if (!starlessImage || !starsImage) {
      console.error('Please select both starless and stars images');
      return;
    }
    
    setProcessing(true);
    setProgress(0);
    
    try {
      setProgressText(t('Loading images...', '加载图像...'));
      setProgress(10);
      
      // Load both images
      const starlessImg = new Image();
      const starsImg = new Image();
      
      await Promise.all([
        new Promise((resolve, reject) => {
          starlessImg.onload = resolve;
          starlessImg.onerror = reject;
          starlessImg.src = starlessPreview!;
        }),
        new Promise((resolve, reject) => {
          starsImg.onload = resolve;
          starsImg.onerror = reject;
          starsImg.src = starsPreview!;
        })
      ]);

      const width = Math.max(starlessImg.width, starsImg.width);
      const height = Math.max(starlessImg.height, starsImg.height);
      
      // Create canvases
      const starlessCanvas = document.createElement('canvas');
      const starlessCtx = starlessCanvas.getContext('2d')!;
      starlessCanvas.width = width;
      starlessCanvas.height = height;
      starlessCtx.drawImage(starlessImg, 0, 0, width, height);
      
      const starsCanvas = document.createElement('canvas');
      const starsCtx = starsCanvas.getContext('2d')!;
      starsCanvas.width = width;
      starsCanvas.height = height;
      starsCtx.drawImage(starsImg, 0, 0, width, height);

      // STEP 1: Generate depth map from starless (Fast Mode approach)
      setProgressText(t('Generating starless depth map...', '生成无星深度图...'));
      setProgress(25);
      
      const starlessImageData = starlessCtx.getImageData(0, 0, width, height);
      const simpleParams: SimpleDepthParams = {
        depth: params.maxShift,
        edgeWeight: params.edgeWeight,
        brightnessWeight: 1 - params.edgeWeight
      };
      
      const starlessDepthMap = generateSimpleDepthMap(starlessImageData, simpleParams);
      
      // Save starless depth map
      const starlessDepthCanvas = document.createElement('canvas');
      const starlessDepthCtx = starlessDepthCanvas.getContext('2d')!;
      starlessDepthCanvas.width = width;
      starlessDepthCanvas.height = height;
      starlessDepthCtx.putImageData(starlessDepthMap, 0, 0);
      setStarlessDepthMapUrl(starlessDepthCanvas.toDataURL('image/png'));

      // STEP 2: Generate depth map for stars (using same Fast Mode approach)
      setProgressText(t('Generating stars depth map...', '生成恒星深度图...'));
      setProgress(35);
      
      const starsImageData = starsCtx.getImageData(0, 0, width, height);
      const starsDepthMap = generateSimpleDepthMap(starsImageData, simpleParams);
      
      // Save stars depth map
      const starsDepthCanvas = document.createElement('canvas');
      const starsDepthCtx = starsDepthCanvas.getContext('2d')!;
      starsDepthCanvas.width = width;
      starsDepthCanvas.height = height;
      starsDepthCtx.putImageData(starsDepthMap, 0, 0);
      setStarsDepthMapUrl(starsDepthCanvas.toDataURL('image/png'));

      // STEP 3: Process starless with its own depth map (Fast Mode displacement)
      setProgressText(t('Processing starless displacement...', '处理无星位移...'));
      setProgress(50);
      
      const starMask = detectStars(starlessImageData.data, width, height, params.starThreshold);
      const { left: starlessLeft, right: starlessRight } = createStereoViews(
        starlessCanvas, 
        starlessCtx, 
        starlessDepthMap, 
        width, 
        height, 
        params, 
        starMask
      );

      // STEP 4: Process stars with starless depth map (Traditional Mode displacement)
      setProgressText(t('Processing stars displacement...', '处理恒星位移...'));
      setProgress(70);
      
      const { left: starsLeft, right: starsRight } = createStereoViews(
        starsCanvas, 
        starsCtx, 
        starlessDepthMap, // Use starless depth map for stars
        width, 
        height, 
        params, 
        new Uint8ClampedArray(width * height) // No star masking for stars layer
      );

      // STEP 5: Composite starless + stars for each eye
      setProgressText(t('Compositing layers...', '合成图层...'));
      setProgress(85);
      
      const compositeLeft = new ImageData(width, height);
      const compositeRight = new ImageData(width, height);
      
      for (let i = 0; i < starlessLeft.data.length; i += 4) {
        // Composite left eye: starless + stars
        compositeLeft.data[i] = Math.min(255, starlessLeft.data[i] + starsLeft.data[i]);
        compositeLeft.data[i + 1] = Math.min(255, starlessLeft.data[i + 1] + starsLeft.data[i + 1]);
        compositeLeft.data[i + 2] = Math.min(255, starlessLeft.data[i + 2] + starsLeft.data[i + 2]);
        compositeLeft.data[i + 3] = 255;
        
        // Composite right eye: starless + stars
        compositeRight.data[i] = Math.min(255, starlessRight.data[i] + starsRight.data[i]);
        compositeRight.data[i + 1] = Math.min(255, starlessRight.data[i + 1] + starsRight.data[i + 1]);
        compositeRight.data[i + 2] = Math.min(255, starlessRight.data[i + 2] + starsRight.data[i + 2]);
        compositeRight.data[i + 3] = 255;
      }

      // STEP 6: Create final stereo pair
      setProgressText(t('Creating final stereo pair...', '创建最终立体对...'));
      setProgress(95);

      const resultCanvas = document.createElement('canvas');
      const resultCtx = resultCanvas.getContext('2d')!;
      
      if (borderSize > 0) {
        const totalWidth = width * 2 + stereoSpacing + (borderSize * 2);
        const totalHeight = height + (borderSize * 2);
        
        resultCanvas.width = totalWidth;
        resultCanvas.height = totalHeight;

        resultCtx.fillStyle = '#000000';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

        resultCtx.putImageData(compositeLeft, borderSize, borderSize);
        resultCtx.putImageData(compositeRight, borderSize + width + stereoSpacing, borderSize);
      } else {
        resultCanvas.width = width * 2 + stereoSpacing;
        resultCanvas.height = height;

        resultCtx.fillStyle = '#000000';
        resultCtx.fillRect(0, 0, resultCanvas.width, resultCanvas.height);

        resultCtx.putImageData(compositeLeft, 0, 0);
        resultCtx.putImageData(compositeRight, width + stereoSpacing, 0);
      }

      setResultUrl(resultCanvas.toDataURL('image/png'));
      setProgress(100);
      setProgressText(t('Processing complete!', '处理完成！'));
    } catch (error) {
      console.error('Error processing images:', error);
      setProgressText(t('Error processing images', '处理图像时出错'));
    } finally {
      setProcessing(false);
      setTimeout(() => {
        setProgress(0);
        setProgressText('');
      }, 3000);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    
    const link = document.createElement('a');
    link.href = resultUrl;
    link.download = `stereoscope-result.png`;
    link.click();
  };

  const downloadStarlessDepthMap = () => {
    if (!starlessDepthMapUrl) return;
    
    const link = document.createElement('a');
    link.href = starlessDepthMapUrl;
    link.download = `depth-map-starless.png`;
    link.click();
  };

  const downloadStarsDepthMap = () => {
    if (!starsDepthMapUrl) return;
    
    const link = document.createElement('a');
    link.href = starsDepthMapUrl;
    link.download = `depth-map-stars.png`;
    link.click();
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

      {/* Unified Input Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                <Layers className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">
                  {t('Input Images', '输入图像')}
                </CardTitle>
                <CardDescription className="text-cosmic-300">
                  {t('Upload starless and stars-only images for unified 3D processing', '上传无星和纯星图像进行统一3D处理')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-purple-400">{t('Starless Image', '无星图像')}</Label>
                <Button
                  onClick={() => starlessInputRef.current?.click()}
                  className="group w-full h-20 mt-2 bg-cosmic-800/50 hover:bg-purple-500/10 border-2 border-dashed border-cosmic-600 hover:border-purple-500/50 transition-all"
                  variant="outline"
                  disabled={processing}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-5 h-5 text-cosmic-400 group-hover:text-purple-400 transition-colors" />
                    <span className="text-sm text-cosmic-300">
                      {starlessImage ? starlessImage.name : t('Click to upload starless', '点击上传无星图像')}
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
                      className="w-full h-40 object-cover rounded-lg border border-cosmic-700 hover:border-purple-500/50 transition-all"
                    />
                  </div>
                )}
              </div>

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
                      {starsImage ? starsImage.name : t('Click to upload stars', '点击上传纯星图像')}
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
                      className="w-full h-40 object-cover rounded-lg border border-cosmic-700 hover:border-orange-500/50 transition-all"
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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                <Settings2 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">
                  {t('Processing Parameters', '处理参数')}
                </CardTitle>
                <CardDescription className="text-cosmic-300">
                  {t('Configure stereo spacing and borders', '配置立体间距和边框')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label className="flex items-center justify-between">
                  <span>{t('Stereo Spacing', '立体间距')}</span>
                  <span className="text-blue-400 font-mono text-lg">({stereoSpacing}px)</span>
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
                  {t('Gap between left and right stereo images', '左右立体图像之间的间隔')}
                </p>
              </div>

              <div>
                <Label className="flex items-center justify-between">
                  <span>{t('Border Size', '边框大小')}</span>
                  <span className="text-blue-400 font-mono text-lg">({borderSize}px)</span>
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
                  {t('Size of black borders around stereo pair', '立体对周围黑色边框的大小')}
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
                onClick={processUnifiedMode}
                disabled={!starlessImage || !starsImage || processing}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold shadow-lg shadow-blue-500/20"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {processing ? t('Processing...', '处理中...') : t('Generate 3D Stereo', '生成3D立体')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {resultUrl && (
        <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-3">
              <Eye className="h-6 w-6 text-green-400" />
              {t('Stereo Result', '立体结果')}
            </CardTitle>
            <CardDescription className="text-cosmic-300">
              {t('View your 3D stereoscopic pair. Use cross-eye or parallel viewing technique.', '查看您的3D立体对。使用交叉眼或平行观看技术。')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <img
                src={resultUrl}
                alt="Stereo Result"
                className="w-full rounded-lg border border-cosmic-700"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button
                  onClick={downloadResult}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {t('Download Result', '下载结果')}
                </Button>
                {starlessDepthMapUrl && (
                  <Button
                    onClick={downloadStarlessDepthMap}
                    variant="outline"
                    className="w-full border-cosmic-600 hover:border-cosmic-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('Starless Depth', '无星深度图')}
                  </Button>
                )}
                {starsDepthMapUrl && (
                  <Button
                    onClick={downloadStarsDepthMap}
                    variant="outline"
                    className="w-full border-cosmic-600 hover:border-cosmic-500"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t('Stars Depth', '恒星深度图')}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StereoscopeProcessor;