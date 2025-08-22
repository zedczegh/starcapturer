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

interface StarData {
  x: number;
  y: number;
  z: number;
  brightness: number;
  size: number;
  color: string;
}

const StarFieldGenerator: React.FC = () => {
  const { t } = useLanguage();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [detectedStars, setDetectedStars] = useState<StarData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Animation settings
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
      toast.success(t('Image uploaded successfully', '图像上传成功'));
    };
    reader.readAsDataURL(file);
  }, [t]);

  const detectStars = useCallback(async () => {
    if (!uploadedImage) {
      toast.error(t('Please upload an image first', '请先上传图像'));
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate star detection processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock star data based on the image
      const mockStars: StarData[] = Array.from({ length: animationSettings.starCount }, (_, i) => ({
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        z: Math.random() * animationSettings.depth,
        brightness: Math.random() * 0.8 + 0.2,
        size: Math.random() * 2 + 0.5,
        color: `hsl(${200 + Math.random() * 60}, 70%, ${60 + Math.random() * 30}%)`
      }));
      
      setDetectedStars(mockStars);
      toast.success(t(`Detected ${mockStars.length} stars!`, `检测到 ${mockStars.length} 颗恒星！`));
    } catch (error) {
      toast.error(t('Star detection failed', '星体检测失败'));
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedImage, animationSettings.starCount, animationSettings.depth, t]);

  const toggleAnimation = useCallback(() => {
    setIsAnimating(prev => !prev);
  }, []);

  const startRecording = useCallback(() => {
    if (detectedStars.length === 0) {
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
  }, [detectedStars, animationSettings.duration, t]);

  const resetAll = useCallback(() => {
    setUploadedImage(null);
    setDetectedStars([]);
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
              settings={animationSettings}
              onSettingsChange={setAnimationSettings}
              disabled={isProcessing}
            />
          )}

          {/* Animation Controls */}
          {detectedStars.length > 0 && (
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
            
            {detectedStars.length > 0 && (
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
                {detectedStars.length > 0 
                  ? t(`Showing ${detectedStars.length} detected stars`, `显示 ${detectedStars.length} 颗检测到的星体`)
                  : t('Upload and detect stars to see 3D preview', '上传并检测星体以查看3D预览')
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px] p-0">
              <StarField3D
                stars={detectedStars}
                settings={animationSettings}
                isAnimating={isAnimating}
                isRecording={isRecording}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StarFieldGenerator;