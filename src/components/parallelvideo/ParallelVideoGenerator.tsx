import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Video, Play, Pause, RotateCcw, Sparkles, Eye, Settings2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TraditionalMorphService, TraditionalMorphParams } from '@/services/TraditionalMorphService';
import { VideoGenerationService, MotionSettings } from '@/services/VideoGenerationService';
import { validateImageFile } from '@/utils/imageProcessingUtils';
import StarField3D from '@/components/starfield/StarField3D';
import { toast } from 'sonner';
import { CanvasPool } from '@/lib/performance/CanvasPool';
import { Separator } from '@/components/ui/separator';

interface StarData {
  x: number;
  y: number;
  z: number;
  brightness: number;
  size: number;
  color3d: string;
}

const ParallelVideoGenerator: React.FC = () => {
  const { language } = useLanguage();

  // File inputs
  const [starlessFile, setStarlessFile] = useState<File | null>(null);
  const [starsFile, setStarsFile] = useState<File | null>(null);
  const starlessInputRef = useRef<HTMLInputElement>(null);
  const starsInputRef = useRef<HTMLInputElement>(null);

  // Morphed images - separated into backgrounds and stars
  const [leftBackground, setLeftBackground] = useState<string | null>(null);
  const [rightBackground, setRightBackground] = useState<string | null>(null);
  const [leftStarsOnly, setLeftStarsOnly] = useState<string | null>(null);
  const [rightStarsOnly, setRightStarsOnly] = useState<string | null>(null);

  // Detected stars for 3D rendering
  const [leftStars, setLeftStars] = useState<StarData[]>([]);
  const [rightStars, setRightStars] = useState<StarData[]>([]);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState({ stage: '', percent: 0 });
  const [isReady, setIsReady] = useState(false);

  // Canvas refs for video generation
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Traditional Morph Parameters - now configurable!
  const [morphParams, setMorphParams] = useState<TraditionalMorphParams>({
    horizontalDisplace: 25,
    starShiftAmount: 6,
    luminanceBlur: 1.5,
    contrastBoost: 1.2,
    stereoSpacing: 600,
    borderSize: 0 // No borders for video
  });

  // 3D Star Field Motion Settings - complete settings
  const [motionSettings, setMotionSettings] = useState<MotionSettings>({
    motionType: 'zoom_in',
    speed: 1.5,
    duration: 10,
    fieldOfView: 75,
    amplification: 150,
    spin: 0,
    spinDirection: 'clockwise'
  });

  const [depthIntensity, setDepthIntensity] = useState<number>(50);
  const [isAnimating, setIsAnimating] = useState(false);

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  // Handle file uploads
  const handleFileUpload = useCallback((
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'starless' | 'stars'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    if (type === 'starless') {
      setStarlessFile(file);
    } else {
      setStarsFile(file);
    }
  }, []);

  // Extract stars from composite image
  const extractStarsFromComposite = useCallback((
    compositeCanvas: HTMLCanvasElement,
    starlessImage: HTMLImageElement,
    depthMap: HTMLCanvasElement
  ): { starsOnly: HTMLCanvasElement; stars: StarData[] } => {
    const canvasPool = CanvasPool.getInstance();
    const starsCanvas = canvasPool.acquire(compositeCanvas.width, compositeCanvas.height);
    const ctx = starsCanvas.getContext('2d')!;

    // Get composite data
    const compositeCtx = compositeCanvas.getContext('2d')!;
    const compositeData = compositeCtx.getImageData(0, 0, compositeCanvas.width, compositeCanvas.height);

    // Draw starless to temp canvas
    const tempCanvas = canvasPool.acquire(starlessImage.width, starlessImage.height);
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(starlessImage, 0, 0);
    const starlessData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

    // Subtract starless from composite to get stars only
    const starsData = ctx.createImageData(compositeCanvas.width, compositeCanvas.height);
    for (let i = 0; i < compositeData.data.length; i += 4) {
      starsData.data[i] = Math.max(0, compositeData.data[i] - starlessData.data[i]);
      starsData.data[i + 1] = Math.max(0, compositeData.data[i + 1] - starlessData.data[i + 1]);
      starsData.data[i + 2] = Math.max(0, compositeData.data[i + 2] - starlessData.data[i + 2]);
      starsData.data[i + 3] = 255;
    }

    ctx.putImageData(starsData, 0, 0);

    // Detect star positions
    const stars: StarData[] = [];
    const threshold = 50;
    const visited = new Uint8Array(compositeCanvas.width * compositeCanvas.height);
    const depthCtx = depthMap.getContext('2d')!;
    const depthData = depthCtx.getImageData(0, 0, depthMap.width, depthMap.height);

    for (let y = 1; y < compositeCanvas.height - 1; y++) {
      for (let x = 1; x < compositeCanvas.width - 1; x++) {
        const idx = y * compositeCanvas.width + x;
        if (visited[idx]) continue;

        const pixelIdx = idx * 4;
        const luminance = 0.299 * starsData.data[pixelIdx] + 
                         0.587 * starsData.data[pixelIdx + 1] + 
                         0.114 * starsData.data[pixelIdx + 2];

        if (luminance > threshold) {
          visited[idx] = 1;
          
          // Get depth
          const depthIdx = (Math.floor(y) * depthMap.width + Math.floor(x)) * 4;
          const depth = depthData.data[depthIdx] / 255;

          // Calculate 3D coordinates
          const centerX = compositeCanvas.width / 2;
          const centerY = compositeCanvas.height / 2;
          const scale = 0.08;

          stars.push({
            x: (x - centerX) * scale,
            y: -(y - centerY) * scale,
            z: (depth - 0.5) * 200 * (0.2 + (depthIntensity / 100) * 1.8),
            brightness: luminance / 255,
            size: 3,
            color3d: `rgb(${starsData.data[pixelIdx]}, ${starsData.data[pixelIdx + 1]}, ${starsData.data[pixelIdx + 2]})`
          });
        }
      }
    }

    canvasPool.release(tempCanvas);
    console.log(`Detected ${stars.length} stars in composite`);
    return { starsOnly: starsCanvas, stars };
  }, [depthIntensity]);

  // Process images with Traditional Morph
  const processImages = useCallback(async () => {
    if (!starlessFile || !starsFile) {
      toast.error(t('Please upload both images', '请上传两张图片'));
      return;
    }

    setIsProcessing(true);
    setIsReady(false);
    setProcessingStep(t('Initializing...', '初始化...'));

    try {
      // Step 1: Create stereo pair with traditional morph
      setProcessingStep(t('Creating stereoscopic pair with Traditional Morph...', '使用传统变形创建立体对...'));
      const result = await TraditionalMorphService.createStereoPair(
        starlessFile,
        starsFile,
        morphParams,
        (step, progress) => {
          setProcessingStep(step);
        }
      );

      console.log('Stereo pair created:', result);

      // Step 2: Load original starless image
      setProcessingStep(t('Loading starless background...', '加载无星背景...'));
      const starlessImg = new Image();
      await new Promise<void>((resolve, reject) => {
        starlessImg.onload = () => resolve();
        starlessImg.onerror = () => reject(new Error('Failed to load starless image'));
        starlessImg.src = URL.createObjectURL(starlessFile);
      });

      console.log('Starless image loaded:', starlessImg.width, 'x', starlessImg.height);

      // Step 3: Extract stars from both views
      setProcessingStep(t('Separating stars from left view...', '从左视图分离星点...'));
      const leftResult = extractStarsFromComposite(result.leftComposite, starlessImg, result.depthMap);
      
      setProcessingStep(t('Separating stars from right view...', '从右视图分离星点...'));
      const rightResult = extractStarsFromComposite(result.rightComposite, starlessImg, result.depthMap);

      console.log('Stars extracted - Left:', leftResult.stars.length, 'Right:', rightResult.stars.length);

      // Step 4: Set all processed data
      setLeftBackground(starlessImg.src);
      setRightBackground(starlessImg.src);
      setLeftStarsOnly(leftResult.starsOnly.toDataURL());
      setRightStarsOnly(rightResult.starsOnly.toDataURL());
      setLeftStars(leftResult.stars);
      setRightStars(rightResult.stars);

      setIsReady(true);
      setProcessingStep('');
      toast.success(t('Processing complete! Preview ready.', '处理完成！预览就绪。'));

      // Auto-start animation after a short delay
      setTimeout(() => {
        setIsAnimating(true);
      }, 800);

    } catch (error) {
      console.error('Processing error:', error);
      toast.error(t('Failed to process images: ' + (error as Error).message, '图片处理失败：' + (error as Error).message));
      setIsReady(false);
    } finally {
      setIsProcessing(false);
    }
  }, [starlessFile, starsFile, morphParams, t, extractStarsFromComposite]);

  // Generate parallel videos
  const generateParallelVideo = useCallback(async () => {
    if (!leftCanvasRef.current || !rightCanvasRef.current) {
      toast.error(t('Canvas not ready', '画布未就绪'));
      return;
    }

    setIsGenerating(true);
    
    try {
      // Generate left video
      setVideoProgress({ stage: t('Generating left video...', '生成左侧视频...'), percent: 0 });
      const leftBlob = await VideoGenerationService.generateVideo({
        sourceCanvas: leftCanvasRef.current,
        duration: motionSettings.duration,
        fps: 30,
        width: leftCanvasRef.current.width,
        height: leftCanvasRef.current.height,
        format: 'webm',
        onProgress: (progress) => {
          setVideoProgress({ 
            stage: t('Generating left video...', '生成左侧视频...'), 
            percent: progress.percent / 2 
          });
        }
      });

      // Generate right video
      setVideoProgress({ stage: t('Generating right video...', '生成右侧视频...'), percent: 50 });
      const rightBlob = await VideoGenerationService.generateVideo({
        sourceCanvas: rightCanvasRef.current,
        duration: motionSettings.duration,
        fps: 30,
        width: rightCanvasRef.current.width,
        height: rightCanvasRef.current.height,
        format: 'webm',
        onProgress: (progress) => {
          setVideoProgress({ 
            stage: t('Generating right video...', '生成右侧视频...'), 
            percent: 50 + progress.percent / 2 
          });
        }
      });

      // Download both videos
      setVideoProgress({ stage: t('Downloading...', '下载中...'), percent: 95 });
      VideoGenerationService.downloadVideo(leftBlob, `left-view-${Date.now()}.webm`);
      VideoGenerationService.downloadVideo(rightBlob, `right-view-${Date.now()}.webm`);

      toast.success(t('Videos generated successfully!', '视频生成成功！'));
      setVideoProgress({ stage: '', percent: 100 });
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error(t('Failed to generate videos', '视频生成失败'));
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setVideoProgress({ stage: '', percent: 0 });
      }, 2000);
    }
  }, [leftCanvasRef, rightCanvasRef, motionSettings, t]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero Header */}
      <div className="text-center mb-8 space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-purple-500/30">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {t('3D Parallel Video Generator', '3D平行视频生成器')}
          </h1>
        </div>
        <p className="text-lg text-cosmic-300 max-w-3xl mx-auto">
          {t(
            'Generate stunning stereoscopic 3D videos from astronomy images using Traditional Morph processing',
            '使用传统变形处理从天文图像生成令人惊叹的立体3D视频'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Step 1: Upload & Traditional Morph Settings */}
        <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
                <Upload className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">
                  {t('Step 1: Upload Images & Configure Traditional Morph', '步骤1：上传图片并配置传统变形')}
                </CardTitle>
                <CardDescription className="text-cosmic-300">
                  {t('Upload your starless and stars-only images, then adjust morph parameters', '上传无星和仅星图像，然后调整变形参数')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Image Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-cosmic-200 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  {t('Starless Image (Background)', '无星图像（背景）')}
                </Label>
                <input
                  ref={starlessInputRef}
                  type="file"
                  accept="image/*,.tif,.tiff"
                  onChange={(e) => handleFileUpload(e, 'starless')}
                  className="hidden"
                />
                <Button
                  onClick={() => starlessInputRef.current?.click()}
                  className="w-full h-24 bg-cosmic-800/50 hover:bg-cosmic-700/50 border-2 border-dashed border-cosmic-600 hover:border-amber-500/50 transition-all"
                  variant="outline"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-cosmic-400" />
                    <span className="text-sm text-cosmic-300">
                      {starlessFile ? starlessFile.name : t('Click to upload', '点击上传')}
                    </span>
                  </div>
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-cosmic-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {t('Stars Only Image', '仅星图像')}
                </Label>
                <input
                  ref={starsInputRef}
                  type="file"
                  accept="image/*,.tif,.tiff"
                  onChange={(e) => handleFileUpload(e, 'stars')}
                  className="hidden"
                />
                <Button
                  onClick={() => starsInputRef.current?.click()}
                  className="w-full h-24 bg-cosmic-800/50 hover:bg-cosmic-700/50 border-2 border-dashed border-cosmic-600 hover:border-amber-500/50 transition-all"
                  variant="outline"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-6 h-6 text-cosmic-400" />
                    <span className="text-sm text-cosmic-300">
                      {starsFile ? starsFile.name : t('Click to upload', '点击上传')}
                    </span>
                  </div>
                </Button>
              </div>
            </div>

            <Separator className="bg-cosmic-700/30" />

            {/* Traditional Morph Parameters */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">
                  {t('Traditional Morph Parameters', '传统变形参数')}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Horizontal Displacement */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 flex items-center justify-between">
                    <span>{t('Horizontal Displacement', '水平位移')}</span>
                    <span className="text-amber-400 font-mono">{morphParams.horizontalDisplace}</span>
                  </Label>
                  <Slider
                    value={[morphParams.horizontalDisplace]}
                    onValueChange={([value]) => 
                      setMorphParams({ ...morphParams, horizontalDisplace: value })
                    }
                    min={10}
                    max={50}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-cosmic-400">
                    {t('Controls nebula depth displacement (10-50 recommended)', '控制星云深度位移（推荐10-50）')}
                  </p>
                </div>

                {/* Star Shift */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 flex items-center justify-between">
                    <span>{t('Star Shift Amount', '星点位移量')}</span>
                    <span className="text-amber-400 font-mono">{morphParams.starShiftAmount}px</span>
                  </Label>
                  <Slider
                    value={[morphParams.starShiftAmount]}
                    onValueChange={([value]) => 
                      setMorphParams({ ...morphParams, starShiftAmount: value })
                    }
                    min={2}
                    max={15}
                    step={0.5}
                    className="mt-2"
                  />
                  <p className="text-xs text-cosmic-400">
                    {t('Distance to shift individual stars for 3D positioning', '单个星点的3D定位位移距离')}
                  </p>
                </div>

                {/* Luminance Blur */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 flex items-center justify-between">
                    <span>{t('Depth Map Blur', '深度图模糊')}</span>
                    <span className="text-amber-400 font-mono">{morphParams.luminanceBlur.toFixed(1)}px</span>
                  </Label>
                  <Slider
                    value={[morphParams.luminanceBlur]}
                    onValueChange={([value]) => 
                      setMorphParams({ ...morphParams, luminanceBlur: value })
                    }
                    min={0.5}
                    max={3}
                    step={0.1}
                    className="mt-2"
                  />
                  <p className="text-xs text-cosmic-400">
                    {t('Smoothing for depth map transitions', '深度图过渡平滑度')}
                  </p>
                </div>

                {/* Contrast Boost */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 flex items-center justify-between">
                    <span>{t('Contrast Boost', '对比度增强')}</span>
                    <span className="text-amber-400 font-mono">{morphParams.contrastBoost.toFixed(2)}x</span>
                  </Label>
                  <Slider
                    value={[morphParams.contrastBoost]}
                    onValueChange={([value]) => 
                      setMorphParams({ ...morphParams, contrastBoost: value })
                    }
                    min={1.0}
                    max={1.5}
                    step={0.05}
                    className="mt-2"
                  />
                  <p className="text-xs text-cosmic-400">
                    {t('Final contrast adjustment', '最终对比度调整')}
                  </p>
                </div>
              </div>
            </div>

            {/* Process Button */}
            <Button
              onClick={processImages}
              disabled={!starlessFile || !starsFile || isProcessing}
              className="w-full h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-lg shadow-lg shadow-amber-500/20"
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{processingStep || t('Processing...', '处理中...')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  {t('Process with Traditional Morph', '使用传统变形处理')}
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Motion Settings & Preview */}
        {isReady && (
          <Card className="bg-gradient-to-br from-cosmic-900/80 to-cosmic-800/80 border-cosmic-700/50 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                  <Settings2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">
                    {t('Step 2: Configure 3D Motion Settings', '步骤2：配置3D运动设置')}
                  </CardTitle>
                  <CardDescription className="text-cosmic-300">
                    {t('Adjust animation parameters for your 3D star field', '调整3D星场的动画参数')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Motion Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Motion Type */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200">{t('Motion Type', '运动类型')}</Label>
                  <Select
                    value={motionSettings.motionType}
                    onValueChange={(value: any) => 
                      setMotionSettings({ ...motionSettings, motionType: value })
                    }
                  >
                    <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zoom_in">{t('Zoom In', '拉近')}</SelectItem>
                      <SelectItem value="zoom_out">{t('Zoom Out', '拉远')}</SelectItem>
                      <SelectItem value="pan_left">{t('Pan Left', '向左平移')}</SelectItem>
                      <SelectItem value="pan_right">{t('Pan Right', '向右平移')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Duration */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 flex justify-between">
                    <span>{t('Duration', '时长')}</span>
                    <span className="text-blue-400 font-mono">{motionSettings.duration}s</span>
                  </Label>
                  <Slider
                    value={[motionSettings.duration]}
                    onValueChange={([value]) => 
                      setMotionSettings({ ...motionSettings, duration: value })
                    }
                    min={5}
                    max={30}
                    step={1}
                  />
                </div>

                {/* Speed */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 flex justify-between">
                    <span>{t('Speed', '速度')}</span>
                    <span className="text-blue-400 font-mono">{motionSettings.speed.toFixed(1)}x</span>
                  </Label>
                  <Slider
                    value={[motionSettings.speed]}
                    onValueChange={([value]) => 
                      setMotionSettings({ ...motionSettings, speed: value })
                    }
                    min={0.5}
                    max={3}
                    step={0.1}
                  />
                </div>

                {/* Amplification */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 flex justify-between">
                    <span>{t('Amplification', '放大')}</span>
                    <span className="text-blue-400 font-mono">{motionSettings.amplification}%</span>
                  </Label>
                  <Slider
                    value={[motionSettings.amplification]}
                    onValueChange={([value]) => 
                      setMotionSettings({ ...motionSettings, amplification: value })
                    }
                    min={100}
                    max={300}
                    step={10}
                  />
                </div>

                {/* Spin Amount */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200 flex justify-between">
                    <span>{t('Spin Amount', '旋转量')}</span>
                    <span className="text-blue-400 font-mono">{motionSettings.spin}°</span>
                  </Label>
                  <Slider
                    value={[motionSettings.spin]}
                    onValueChange={([value]) => 
                      setMotionSettings({ ...motionSettings, spin: value })
                    }
                    min={0}
                    max={90}
                    step={5}
                  />
                </div>

                {/* Spin Direction */}
                <div className="space-y-2">
                  <Label className="text-cosmic-200">{t('Spin Direction', '旋转方向')}</Label>
                  <Select
                    value={motionSettings.spinDirection}
                    onValueChange={(value: any) => 
                      setMotionSettings({ ...motionSettings, spinDirection: value })
                    }
                  >
                    <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clockwise">{t('Clockwise', '顺时针')}</SelectItem>
                      <SelectItem value="counterclockwise">{t('Counterclockwise', '逆时针')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Depth Intensity */}
                <div className="space-y-2 md:col-span-3">
                  <Label className="text-cosmic-200 flex justify-between">
                    <span>{t('3D Depth Intensity', '3D深度强度')}</span>
                    <span className="text-blue-400 font-mono">{depthIntensity}</span>
                  </Label>
                  <Slider
                    value={[depthIntensity]}
                    onValueChange={([value]) => setDepthIntensity(value)}
                    min={0}
                    max={100}
                    step={5}
                  />
                  <p className="text-xs text-cosmic-400">
                    {t('Controls the parallax effect intensity', '控制视差效果强度')}
                  </p>
                </div>
              </div>

              <Separator className="bg-cosmic-700/30" />

              {/* Preview Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-cyan-400" />
                  {t('Preview', '预览')}
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left View */}
                  <div className="space-y-2">
                    <Label className="text-cosmic-200 text-sm">
                      {t('Left View', '左视图')} ({leftStars.length} {t('stars', '星点')})
                    </Label>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden border-2 border-cosmic-700 shadow-2xl">
                      {leftStars.length > 0 ? (
                        <StarField3D
                          stars={leftStars}
                          settings={motionSettings}
                          isAnimating={isAnimating}
                          isRecording={false}
                          backgroundImage={leftBackground}
                          starsOnlyImage={leftStarsOnly}
                          depthIntensity={depthIntensity}
                          onCanvasReady={(canvas) => { 
                            leftCanvasRef.current = canvas;
                            console.log('Left canvas ready');
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cosmic-400">
                          {t('Waiting...', '等待中...')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right View */}
                  <div className="space-y-2">
                    <Label className="text-cosmic-200 text-sm">
                      {t('Right View', '右视图')} ({rightStars.length} {t('stars', '星点')})
                    </Label>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden border-2 border-cosmic-700 shadow-2xl">
                      {rightStars.length > 0 ? (
                        <StarField3D
                          stars={rightStars}
                          settings={motionSettings}
                          isAnimating={isAnimating}
                          isRecording={false}
                          backgroundImage={rightBackground}
                          starsOnlyImage={rightStarsOnly}
                          depthIntensity={depthIntensity}
                          onCanvasReady={(canvas) => { 
                            rightCanvasRef.current = canvas;
                            console.log('Right canvas ready');
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cosmic-400">
                          {t('Waiting...', '等待中...')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setIsAnimating(!isAnimating)}
                    className="flex-1 bg-cosmic-800 hover:bg-cosmic-700 border border-cosmic-600"
                    variant="outline"
                    disabled={!leftCanvasRef.current || !rightCanvasRef.current}
                  >
                    {isAnimating ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        {t('Pause Preview', '暂停预览')}
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        {t('Play Preview', '播放预览')}
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      setIsAnimating(false);
                      setTimeout(() => setIsAnimating(true), 100);
                    }}
                    className="bg-cosmic-800 hover:bg-cosmic-700 border border-cosmic-600"
                    variant="outline"
                    disabled={!leftCanvasRef.current || !rightCanvasRef.current}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>

                  <Button
                    onClick={generateParallelVideo}
                    disabled={isGenerating || !leftCanvasRef.current || !rightCanvasRef.current}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold shadow-lg shadow-blue-500/20"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {isGenerating 
                      ? `${videoProgress.stage} (${Math.round(videoProgress.percent)}%)` 
                      : t('Generate Videos', '生成视频')
                    }
                  </Button>
                </div>

                {(!leftCanvasRef.current || !rightCanvasRef.current) && (
                  <p className="text-sm text-cosmic-400 text-center">
                    {t('Initializing canvas...', '初始化画布中...')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ParallelVideoGenerator;
