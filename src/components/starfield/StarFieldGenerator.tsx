import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Upload, Play, Pause, Download, RotateCcw, Video, Layers, CheckCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import StarField3D from './StarField3D';
import { detectStarsFromImage, separateStarsAndNebula, DetectedStar } from '@/utils/starDetection';

interface StarLayer {
  name: string;
  stars: DetectedStar[];
  averageSize: number;
  depth: number;
  color: string;
}

interface ProcessedStarData {
  x: number;
  y: number;
  z: number;
  brightness: number;
  size: number;
  color3d: string;
  layer: string;
}

const StarFieldGenerator: React.FC = () => {
  const { t } = useLanguage();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [detectedStars, setDetectedStars] = useState<DetectedStar[]>([]);
  const [starLayers, setStarLayers] = useState<StarLayer[]>([]);
  const [processedStars, setProcessedStars] = useState<ProcessedStarData[]>([]);
  const [separatedImages, setSeparatedImages] = useState<{ starImage: string; nebulaImage: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'ready' | 'generating'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simplified animation settings - only essential controls
  const [animationSettings, setAnimationSettings] = useState({
    type: 'zoom_through',
    speed: 1.0,
    duration: 15,
    movement: 'zoom',
    direction: 'forward',
    fieldOfView: 75,
    depth: 100,
    brightness: 1
  });

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      setCurrentStep('upload');
      
      // Create image element for processing
      const img = new Image();
      img.onload = () => {
        setImageElement(img);
        toast.success(t('Image uploaded successfully', '图像上传成功'));
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  }, [t]);

  const analyzeStarSizes = (stars: DetectedStar[]): StarLayer[] => {
    if (stars.length === 0) return [];

    // Sort stars by size
    const sortedStars = [...stars].sort((a, b) => b.size - a.size);
    
    // Create size-based layers
    const layers: StarLayer[] = [
      {
        name: 'Large Stars (Foreground)',
        stars: sortedStars.filter(star => star.size >= 4),
        averageSize: 0,
        depth: 20, // Closest
        color: '#ffffff'
      },
      {
        name: 'Medium Stars (Mid-field)',
        stars: sortedStars.filter(star => star.size >= 2 && star.size < 4),
        averageSize: 0,
        depth: 60, // Middle
        color: '#e6f3ff'
      },
      {
        name: 'Small Stars (Background)',
        stars: sortedStars.filter(star => star.size < 2),
        averageSize: 0,
        depth: 100, // Farthest
        color: '#cce7ff'
      }
    ];

    // Calculate average sizes
    layers.forEach(layer => {
      if (layer.stars.length > 0) {
        layer.averageSize = layer.stars.reduce((sum, star) => sum + star.size, 0) / layer.stars.length;
      }
    });

    // Filter out empty layers
    return layers.filter(layer => layer.stars.length > 0);
  };

  const processStarLayers = useCallback(async () => {
    if (!imageElement) {
      toast.error(t('Please upload an image first', '请先上传图像'));
      return;
    }

    setIsProcessing(true);
    setCurrentStep('processing');
    
    try {
      // Step 1: Auto-detect stars with optimized settings
      toast.info(t('Step 1: Detecting stars from image...', '步骤1：从图像中检测星体...'));
      
      const optimizedSettings = {
        threshold: 12,
        minStarSize: 1,
        maxStarSize: 50,
        sigma: 0.6,
        sensitivity: 0.4
      };
      
      const stars = await detectStarsFromImage(imageElement, optimizedSettings);
      
      if (stars.length === 0) {
        toast.warning(t('No stars detected in the image', '图像中未检测到星体'));
        setCurrentStep('upload');
        return;
      }
      
      setDetectedStars(stars);
      
      // Step 2: Analyze star sizes and create 3D layers
      toast.info(t('Step 2: Analyzing star sizes and creating 3D layers...', '步骤2：分析星体大小并创建3D层...'));
      
      const layers = analyzeStarSizes(stars);
      setStarLayers(layers);
      
      // Step 3: Separate stars from nebulae/background
      toast.info(t('Step 3: Separating stars from background...', '步骤3：从背景中分离星体...'));
      
      const separated = await separateStarsAndNebula(imageElement, stars);
      setSeparatedImages(separated);
      
      // Step 4: Create 3D star data with proper layering
      toast.info(t('Step 4: Generating 3D star field...', '步骤4：生成3D星场...'));
      
      const processedStarsData: ProcessedStarData[] = [];
      
      layers.forEach(layer => {
        layer.stars.forEach(star => {
          // Add random variation to depth within layer
          const depthVariation = (Math.random() - 0.5) * 20;
          const finalDepth = Math.max(5, layer.depth + depthVariation);
          
          processedStarsData.push({
            x: (star.x - imageElement.width / 2) / 2, // Center and scale
            y: (star.y - imageElement.height / 2) / 2,
            z: finalDepth,
            brightness: star.brightness,
            size: star.size,
            color3d: `rgb(${star.color.r}, ${star.color.g}, ${star.color.b})`,
            layer: layer.name
          });
        });
      });
      
      setProcessedStars(processedStarsData);
      setCurrentStep('ready');
      
      toast.success(t(
        `Successfully processed ${stars.length} stars in ${layers.length} layers!`, 
        `成功处理了${layers.length}层中的${stars.length}颗星体！`
      ));
      
    } catch (error) {
      console.error('Star processing error:', error);
      toast.error(t('Star processing failed. Please try a different image.', '星体处理失败。请尝试不同的图像。'));
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
    }
  }, [imageElement, t]);

  const toggleAnimation = useCallback(() => {
    setIsAnimating(prev => !prev);
  }, []);

  const generateVideo = useCallback(() => {
    if (processedStars.length === 0) {
      toast.error(t('Please process stars first', '请先处理星体'));
      return;
    }
    
    setIsRecording(true);
    setCurrentStep('generating');
    toast.success(t('Generating combined video...', '生成合成视频...'));
    
    // Simulate video generation process
    setTimeout(() => {
      setIsRecording(false);
      setCurrentStep('ready');
      toast.success(t('3D star field video generated successfully!', '3D星场视频生成成功！'));
    }, animationSettings.duration * 1000);
  }, [processedStars, animationSettings.duration, t]);

  const resetAll = useCallback(() => {
    setUploadedImage(null);
    setImageElement(null);
    setDetectedStars([]);
    setStarLayers([]);
    setProcessedStars([]);
    setSeparatedImages(null);
    setIsAnimating(false);
    setIsRecording(false);
    setCurrentStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
            'Transform astronomy images into stunning 3D star field animations. Upload → Auto-Process → Generate Video',
            '将天文图像转换为令人惊叹的3D星场动画。上传 → 自动处理 → 生成视频'
          )}
        </p>
      </div>

      {/* Workflow Steps */}
      <div className="flex justify-center">
        <div className="flex items-center gap-4 bg-cosmic-900/50 border border-cosmic-700/50 rounded-lg p-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${currentStep === 'upload' ? 'bg-blue-500/20 text-blue-300' : (currentStep === 'processing' || currentStep === 'ready' || currentStep === 'generating') ? 'bg-green-500/20 text-green-300' : 'bg-cosmic-800/50 text-cosmic-400'}`}>
            <Upload className="h-4 w-4" />
            <span className="text-sm">1. Upload</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${currentStep === 'processing' ? 'bg-blue-500/20 text-blue-300' : currentStep === 'ready' || currentStep === 'generating' ? 'bg-green-500/20 text-green-300' : 'bg-cosmic-800/50 text-cosmic-400'}`}>
            <Layers className="h-4 w-4" />
            <span className="text-sm">2. Process</span>
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
                {t('Upload Astronomy Image', '上传天文图像')}
              </CardTitle>
              <CardDescription className="text-cosmic-400">
                {t('Select a high-quality astronomy image with visible stars', '选择包含可见星体的高质量天文图像')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-upload" className="text-cosmic-200">
                  {t('Select Image File', '选择图像文件')}
                </Label>
                <Input
                  ref={fileInputRef}
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bg-cosmic-800/50 border-cosmic-700/50 text-white file:bg-cosmic-700 file:text-white file:border-0"
                />
              </div>
              
              {uploadedImage && (
                <div className="space-y-4">
                  <div className="relative">
                    <img
                      src={uploadedImage}
                      alt="Uploaded astronomy image"
                      className="w-full h-32 object-cover rounded-lg border border-cosmic-700/50"
                    />
                  </div>
                  
                  <Button
                    onClick={processStarLayers}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isProcessing ? t('Processing...', '处理中...') : t('Auto-Process Stars', '自动处理星体')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Star Layers Info */}
          {starLayers.length > 0 && (
            <Card className="bg-cosmic-900/50 border-cosmic-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  {t('Detected Star Layers', '检测到的星体层')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {starLayers.map((layer, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-cosmic-800/30 rounded-lg border border-cosmic-700/30">
                    <div>
                      <div className="text-white text-sm font-medium">{layer.name}</div>
                      <div className="text-cosmic-400 text-xs">
                        {layer.stars.length} stars • Avg size: {layer.averageSize.toFixed(1)}px
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-cosmic-300 text-xs">Depth: {layer.depth}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Simple Animation Controls */}
          {currentStep === 'ready' && (
            <Card className="bg-cosmic-900/50 border-cosmic-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  {t('Animation Settings', '动画设置')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-cosmic-200">{t('Animation Type', '动画类型')}</Label>
                  <Select
                    value={animationSettings.type}
                    onValueChange={(value) => setAnimationSettings(prev => ({...prev, type: value, movement: value === 'zoom_through' ? 'zoom' : 'drift'}))}
                  >
                    <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-cosmic-800 border-cosmic-700">
                      <SelectItem value="zoom_through" className="text-white hover:bg-cosmic-700">
                        {t('Zoom Through Stars', '缩放穿越星体')}
                      </SelectItem>
                      <SelectItem value="parallax_drift" className="text-white hover:bg-cosmic-700">
                        {t('Parallax Drift', '视差漂移')}
                      </SelectItem>
                      <SelectItem value="spiral_zoom" className="text-white hover:bg-cosmic-700">
                        {t('Spiral Zoom', '螺旋缩放')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-cosmic-200">{t('Speed', '速度')}</Label>
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
                    min={10}
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
                  ? t(`Showing ${processedStars.length} stars in ${starLayers.length} layers`, `显示${starLayers.length}层中的${processedStars.length}颗星体`)
                  : t('Upload and process an image to see the 3D preview', '上传并处理图像以查看3D预览')
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] p-0">
              <StarField3D
                stars={processedStars}
                settings={animationSettings}
                isAnimating={isAnimating}
                isRecording={isRecording}
                separatedImages={separatedImages}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StarFieldGenerator;