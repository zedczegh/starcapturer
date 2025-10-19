import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Video, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TraditionalMorphService, TraditionalMorphParams } from '@/services/TraditionalMorphService';
import { VideoGenerationService, MotionSettings } from '@/services/VideoGenerationService';
import { validateImageFile } from '@/utils/imageProcessingUtils';
import StarField3D from '@/components/starfield/StarField3D';
import { toast } from 'sonner';

const ParallelVideoGenerator: React.FC = () => {
  const { language } = useLanguage();

  // File inputs
  const [starlessFile, setStarlessFile] = useState<File | null>(null);
  const [starsFile, setStarsFile] = useState<File | null>(null);
  const starlessInputRef = useRef<HTMLInputElement>(null);
  const starsInputRef = useRef<HTMLInputElement>(null);

  // Morphed images
  const [leftComposite, setLeftComposite] = useState<string | null>(null);
  const [rightComposite, setRightComposite] = useState<string | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoProgress, setVideoProgress] = useState({ stage: '', percent: 0 });

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

  // Process images with Traditional Morph
  const processImages = useCallback(async () => {
    if (!starlessFile || !starsFile) {
      toast.error(t('Please upload both images', '请上传两张图片'));
      return;
    }

    setIsProcessing(true);
    setProcessingStep(t('Processing with Traditional Morph...', '使用传统变形处理中...'));

    try {
      const result = await TraditionalMorphService.createStereoPair(
        starlessFile,
        starsFile,
        morphParams,
        (step, progress) => {
          setProcessingStep(step);
        }
      );

      // Extract composite images
      const { leftImage, rightImage } = await TraditionalMorphService.extractCompositeImages(result);
      
      setLeftComposite(leftImage);
      setRightComposite(rightImage);
      
      toast.success(t('Images processed successfully', '图片处理成功'));
      setProcessingStep('');
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(t('Failed to process images', '图片处理失败'));
    } finally {
      setIsProcessing(false);
    }
  }, [starlessFile, starsFile, morphParams, t]);

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
          {leftComposite && rightComposite && (
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
                    <div className="mt-2 aspect-video bg-black rounded-lg overflow-hidden">
                      <StarField3D
                        stars={[]} // TODO: Extract stars from left composite
                        settings={motionSettings}
                        isAnimating={isAnimating}
                        isRecording={false}
                        backgroundImage={leftComposite}
                        starsOnlyImage={leftComposite}
                        depthIntensity={depthIntensity}
                        onCanvasReady={(canvas) => { leftCanvasRef.current = canvas; }}
                      />
                    </div>
                  </div>

                  {/* Right View Preview */}
                  <div>
                    <Label className="text-cosmic-200">{t('Right View', '右视图')}</Label>
                    <div className="mt-2 aspect-video bg-black rounded-lg overflow-hidden">
                      <StarField3D
                        stars={[]} // TODO: Extract stars from right composite
                        settings={motionSettings}
                        isAnimating={isAnimating}
                        isRecording={false}
                        backgroundImage={rightComposite}
                        starsOnlyImage={rightComposite}
                        depthIntensity={depthIntensity}
                        onCanvasReady={(canvas) => { rightCanvasRef.current = canvas; }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setIsAnimating(!isAnimating)}
                    className="flex-1"
                    variant="outline"
                  >
                    {isAnimating ? t('Pause Preview', '暂停预览') : t('Play Preview', '播放预览')}
                  </Button>

                  <Button
                    onClick={generateParallelVideo}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {isGenerating 
                      ? `${videoProgress.stage} (${Math.round(videoProgress.percent)}%)` 
                      : t('Generate Videos', '生成视频')
                    }
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ParallelVideoGenerator;
