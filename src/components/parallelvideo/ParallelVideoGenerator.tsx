import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Video, Download, Play, Pause } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TraditionalMorphService, TraditionalMorphParams } from '@/services/TraditionalMorphService';
import { VideoGenerationService, MotionSettings } from '@/services/VideoGenerationService';
import { validateImageFile } from '@/utils/imageProcessingUtils';
import StarField3D from '@/components/starfield/StarField3D';
import { toast } from 'sonner';
import { CanvasPool } from '@/lib/performance/CanvasPool';

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

  // Traditional Morph Parameters (matching Stereoscope Processor defaults)
  const [morphParams] = useState<TraditionalMorphParams>(
    TraditionalMorphService.DEFAULT_PARAMS
  );

  // 3D Star Field Motion Settings (matching Star Field Generator defaults)
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
    compositeImage: HTMLImageElement,
    starlessImage: HTMLImageElement,
    depthMap: HTMLCanvasElement
  ): { starsOnly: HTMLCanvasElement; stars: StarData[] } => {
    const canvasPool = CanvasPool.getInstance();
    const starsCanvas = canvasPool.acquire(compositeImage.width, compositeImage.height);
    const ctx = starsCanvas.getContext('2d')!;

    // Draw composite
    ctx.drawImage(compositeImage, 0, 0);
    const compositeData = ctx.getImageData(0, 0, starsCanvas.width, starsCanvas.height);

    // Draw starless to temp canvas
    const tempCanvas = canvasPool.acquire(starlessImage.width, starlessImage.height);
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(starlessImage, 0, 0);
    const starlessData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

    // Subtract starless from composite to get stars only
    const starsData = ctx.createImageData(starsCanvas.width, starsCanvas.height);
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
    const visited = new Uint8Array(starsCanvas.width * starsCanvas.height);
    const depthCtx = depthMap.getContext('2d')!;
    const depthData = depthCtx.getImageData(0, 0, depthMap.width, depthMap.height);

    for (let y = 1; y < starsCanvas.height - 1; y++) {
      for (let x = 1; x < starsCanvas.width - 1; x++) {
        const idx = y * starsCanvas.width + x;
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
          const centerX = starsCanvas.width / 2;
          const centerY = starsCanvas.height / 2;
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
    setProcessingStep(t('Processing with Traditional Morph...', '使用传统变形处理中...'));

    try {
      // Step 1: Create stereo pair with traditional morph
      setProcessingStep(t('Creating stereoscopic pair...', '创建立体对...'));
      const result = await TraditionalMorphService.createStereoPair(
        starlessFile,
        starsFile,
        morphParams,
        (step, progress) => {
          setProcessingStep(step);
        }
      );

      // Step 2: Load original starless image
      setProcessingStep(t('Separating layers...', '分离图层...'));
      const starlessImg = new Image();
      await new Promise((resolve, reject) => {
        starlessImg.onload = resolve;
        starlessImg.onerror = reject;
        starlessImg.src = URL.createObjectURL(starlessFile);
      });

      // Step 3: Load composite images
      const leftImg = new Image();
      const rightImg = new Image();
      
      await Promise.all([
        new Promise((resolve, reject) => {
          leftImg.onload = resolve;
          leftImg.onerror = reject;
          leftImg.src = result.leftComposite.toDataURL();
        }),
        new Promise((resolve, reject) => {
          rightImg.onload = resolve;
          rightImg.onerror = reject;
          rightImg.src = result.rightComposite.toDataURL();
        })
      ]);

      // Step 4: Extract stars from both views
      setProcessingStep(t('Detecting stars...', '检测星点...'));
      const leftResult = extractStarsFromComposite(leftImg, starlessImg, result.depthMap);
      const rightResult = extractStarsFromComposite(rightImg, starlessImg, result.depthMap);

      // Step 5: Set all processed data
      setLeftBackground(starlessImg.src);
      setRightBackground(starlessImg.src);
      setLeftStarsOnly(leftResult.starsOnly.toDataURL());
      setRightStarsOnly(rightResult.starsOnly.toDataURL());
      setLeftStars(leftResult.stars);
      setRightStars(rightResult.stars);

      setIsReady(true);
      setProcessingStep('');
      toast.success(t('Processing complete! Starting preview...', '处理完成！启动预览...'));

      // Auto-start animation after a short delay
      setTimeout(() => {
        setIsAnimating(true);
      }, 500);

    } catch (error) {
      console.error('Processing error:', error);
      toast.error(t('Failed to process images', '图片处理失败'));
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

      // Combine into side-by-side video
      setVideoProgress({ stage: t('Combining videos...', '合并视频...'), percent: 90 });
      
      // For now, download both videos separately
      // TODO: Implement side-by-side combination
      VideoGenerationService.downloadVideo(leftBlob, 'left-view.webm');
      VideoGenerationService.downloadVideo(rightBlob, 'right-view.webm');

      toast.success(t('Videos generated successfully', '视频生成成功'));
      setVideoProgress({ stage: '', percent: 100 });
    } catch (error) {
      console.error('Video generation error:', error);
      toast.error(t('Failed to generate videos', '视频生成失败'));
    } finally {
      setIsGenerating(false);
    }
  }, [leftCanvasRef, rightCanvasRef, motionSettings, t]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-cosmic-900/50 border-cosmic-700">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-white">
            {t('3D Parallel Video Generator', '3D平行视频生成器')}
          </CardTitle>
          <CardDescription className="text-cosmic-300">
            {t(
              'Generate stereoscopic 3D videos from starless and stars-only images',
              '从无星和仅星图像生成立体3D视频'
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Upload Images */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">
              {t('Step 1: Upload Images', '步骤1：上传图片')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Starless Image Upload */}
              <div>
                <Label className="text-cosmic-200">
                  {t('Starless Image', '无星图像')}
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
                  className="w-full mt-2"
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {starlessFile ? starlessFile.name : t('Upload Starless', '上传无星图像')}
                </Button>
              </div>

              {/* Stars Only Image Upload */}
              <div>
                <Label className="text-cosmic-200">
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
                  className="w-full mt-2"
                  variant="outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {starsFile ? starsFile.name : t('Upload Stars', '上传仅星图像')}
                </Button>
              </div>
            </div>

            <Button
              onClick={processImages}
              disabled={!starlessFile || !starsFile || isProcessing}
              className="w-full"
            >
              {isProcessing ? processingStep : t('Process with Traditional Morph', '使用传统变形处理')}
            </Button>
          </div>

          {/* Step 2: Configure Motion Settings */}
          {isReady && (
            <>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">
                  {t('Step 2: Configure Motion Settings', '步骤2：配置运动设置')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Motion Type */}
                  <div>
                    <Label className="text-cosmic-200">{t('Motion Type', '运动类型')}</Label>
                    <Select
                      value={motionSettings.motionType}
                      onValueChange={(value: any) => 
                        setMotionSettings({ ...motionSettings, motionType: value })
                      }
                    >
                      <SelectTrigger>
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
                  <div>
                    <Label className="text-cosmic-200">
                      {t('Duration', '时长')}: {motionSettings.duration}s
                    </Label>
                    <Slider
                      value={[motionSettings.duration]}
                      onValueChange={([value]) => 
                        setMotionSettings({ ...motionSettings, duration: value })
                      }
                      min={5}
                      max={30}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  {/* Depth Intensity */}
                  <div>
                    <Label className="text-cosmic-200">
                      {t('Depth Intensity', '深度强度')}: {depthIntensity}
                    </Label>
                    <Slider
                      value={[depthIntensity]}
                      onValueChange={([value]) => setDepthIntensity(value)}
                      min={0}
                      max={100}
                      step={1}
                      className="mt-2"
                    />
                  </div>

                  {/* Amplification */}
                  <div>
                    <Label className="text-cosmic-200">
                      {t('Amplification', '放大')}: {motionSettings.amplification}%
                    </Label>
                    <Slider
                      value={[motionSettings.amplification]}
                      onValueChange={([value]) => 
                        setMotionSettings({ ...motionSettings, amplification: value })
                      }
                      min={100}
                      max={300}
                      step={10}
                      className="mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3: Preview and Generate */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-white">
                  {t('Step 3: Preview & Generate', '步骤3：预览和生成')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left View Preview */}
                  <div>
                    <Label className="text-cosmic-200">{t('Left View', '左视图')}</Label>
                    <div className="mt-2 aspect-video bg-black rounded-lg overflow-hidden border border-cosmic-700">
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
                            console.log('Left canvas ready:', canvas.width, 'x', canvas.height);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cosmic-400">
                          {t('Processing...', '处理中...')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right View Preview */}
                  <div>
                    <Label className="text-cosmic-200">{t('Right View', '右视图')}</Label>
                    <div className="mt-2 aspect-video bg-black rounded-lg overflow-hidden border border-cosmic-700">
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
                            console.log('Right canvas ready:', canvas.width, 'x', canvas.height);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-cosmic-400">
                          {t('Processing...', '处理中...')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setIsAnimating(!isAnimating)}
                    className="flex-1"
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
                    onClick={generateParallelVideo}
                    disabled={isGenerating || !leftCanvasRef.current || !rightCanvasRef.current}
                    className="flex-1"
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
                    {t('Waiting for canvas to initialize...', '等待画布初始化...')}
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParallelVideoGenerator;
