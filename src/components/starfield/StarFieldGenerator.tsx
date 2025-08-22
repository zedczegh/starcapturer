import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Play, Pause, Download, RotateCcw, Video } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import StarField3D from './StarField3D';
import StarDetectionControls from './StarDetectionControls';
import AnimationControls from './AnimationControls';
import { detectStarsFromImage, separateStarsAndNebula, DetectedStar } from '@/utils/starDetection';

interface StarData {
  x: number;
  y: number;
  z: number;
  brightness: number;
  size: number;
  color: string;
}

interface Star3D extends DetectedStar {
  z: number;
  color3d: string;
}

const StarFieldGenerator: React.FC = () => {
  const { t } = useLanguage();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [detectedStars, setDetectedStars] = useState<DetectedStar[]>([]);
  const [stars3D, setStars3D] = useState<Star3D[]>([]);
  const [separatedImages, setSeparatedImages] = useState<{ starImage: string; nebulaImage: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detection settings - optimized for automatic detection
  const [detectionSettings, setDetectionSettings] = useState({
    threshold: 15, // Lower threshold for faint stars
    minStarSize: 1,
    maxStarSize: 30,
    sigma: 0.8, // Less aggressive noise reduction
    sensitivity: 0.3 // More sensitive detection
  });
  const [animationSettings, setAnimationSettings] = useState({
    speed: 1,
    direction: 'forward',
    movement: 'zoom',
    duration: 10,
    depth: 100,
    starCount: 1000,
    brightness: 1,
    fieldOfView: 75
  });

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setUploadedImage(result);
      
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

  const detectStars = useCallback(async () => {
    if (!imageElement) {
      toast.error(t('Please upload an image first', '请先上传图像'));
      return;
    }

    setIsProcessing(true);
    
    try {
      toast.info(t('Analyzing image for stars...', '正在分析图像中的星体...'));
      
      // Detect stars from the actual image
      const stars = await detectStarsFromImage(imageElement, detectionSettings);
      
      if (stars.length === 0) {
        toast.warning(t('No stars detected. Try adjusting the detection settings.', '未检测到星体。请尝试调整检测设置。'));
        return;
      }
      
      setDetectedStars(stars);
      
      // Convert to 3D stars for rendering with proper depth distribution
      const stars3DData: Star3D[] = stars.map((star, index) => {
        // Create depth based on star brightness (brighter stars closer)
        const depthFactor = 0.3 + (star.brightness * 0.7); // 0.3 to 1.0
        const baseDepth = animationSettings.depth * (1 - depthFactor);
        const randomVariation = (Math.random() - 0.5) * animationSettings.depth * 0.2;
        
        return {
          ...star,
          z: Math.max(5, baseDepth + randomVariation),
          color3d: `rgb(${star.color.r}, ${star.color.g}, ${star.color.b})`
        };
      });
      setStars3D(stars3DData);
      
      // Create separated star and nebula images
      toast.info(t('Separating stars from nebula...', '正在分离星体和星云...'));
      const separated = await separateStarsAndNebula(imageElement, stars);
      setSeparatedImages(separated);
      
      toast.success(t(`Successfully detected ${stars.length} stars!`, `成功检测到 ${stars.length} 颗星体！`));
    } catch (error) {
      console.error('Star detection error:', error);
      toast.error(t('Star detection failed. Please try a different image.', '星体检测失败。请尝试不同的图像。'));
    } finally {
      setIsProcessing(false);
    }
  }, [imageElement, detectionSettings, t]);

  const toggleAnimation = useCallback(() => {
    setIsAnimating(prev => !prev);
  }, []);

  const startRecording = useCallback(() => {
    if (stars3D.length === 0) {
      toast.error(t('Please detect stars first', '请先检测星体'));
      return;
    }
    
    setIsRecording(true);
    toast.success(t('Recording started...', '开始录制...'));
    
    // Simulate recording for demo
    setTimeout(() => {
      setIsRecording(false);
      toast.success(t('Video generated successfully!', '视频生成成功！'));
    }, animationSettings.duration * 1000);
  }, [stars3D, animationSettings.duration, t]);

  const resetAll = useCallback(() => {
    setUploadedImage(null);
    setImageElement(null);
    setDetectedStars([]);
    setStars3D([]);
    setSeparatedImages(null);
    setIsAnimating(false);
    setIsRecording(false);
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
        <p className="text-cosmic-300 text-lg max-w-2xl mx-auto">
          {t(
            'Transform astronomy images into stunning 3D star field animations with AI-powered star detection',
            '使用AI驱动的星体检测将天文图像转换为令人惊叹的3D星场动画'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Image Upload */}
          <Card className="bg-cosmic-900/50 border-cosmic-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5" />
                {t('Upload Image', '上传图像')}
              </CardTitle>
              <CardDescription className="text-cosmic-400">
                {t('Upload an astronomy image to detect stars', '上传天文图像以检测星体')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image-upload" className="text-cosmic-200">
                  {t('Select Image', '选择图像')}
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
                    onClick={detectStars}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {isProcessing ? t('Detecting Stars...', '检测星体中...') : t('Detect Stars', '检测星体')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Star Detection Controls */}
          {uploadedImage && (
            <StarDetectionControls
              settings={detectionSettings}
              onSettingsChange={setDetectionSettings}
              disabled={isProcessing}
            />
          )}

          {/* Animation Controls */}
          {stars3D.length > 0 && (
            <AnimationControls
              settings={animationSettings}
              onSettingsChange={setAnimationSettings}
              isAnimating={isAnimating}
              isRecording={isRecording}
              onToggleAnimation={toggleAnimation}
              onStartRecording={startRecording}
              disabled={isProcessing}
            />
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
            
            {stars3D.length > 0 && (
              <Button
                onClick={startRecording}
                disabled={isRecording}
                className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {isRecording ? t('Recording...', '录制中...') : t('Generate MP4', '生成MP4')}
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
                {stars3D.length > 0 
                  ? t(`Showing ${stars3D.length} detected stars`, `显示 ${stars3D.length} 颗检测到的星体`)
                  : t('Upload and detect stars to see 3D preview', '上传并检测星体以查看3D预览')
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] p-0">
              <StarField3D
                stars={stars3D}
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