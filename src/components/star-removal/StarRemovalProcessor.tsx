import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Upload, Download, Sparkles, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { UploadProgress } from '@/components/ui/upload-progress';
import { loadImageFromFile, validateImageFile } from '@/utils/imageProcessingUtils';
import { detectStarsImproved, removeStarsImproved, ImprovedStarDetectionSettings } from '@/utils/improvedStarDetection';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const StarRemovalProcessor: React.FC = () => {
  const { language } = useLanguage();
  
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalElement, setOriginalElement] = useState<HTMLImageElement | null>(null);
  const [starlessImage, setStarlessImage] = useState<string | null>(null);
  const [starsOnlyImage, setStarsOnlyImage] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ show: false, progress: 0, fileName: '' });
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  
  const [settings, setSettings] = useState<ImprovedStarDetectionSettings>({
    threshold: 0.8,
    sensitivity: 1.0,
    minStarRadius: 2,
    maxStarRadius: 20,
    circularityThreshold: 0.5,  // More lenient
    sharpnessThreshold: 0.25,   // More lenient
    psfThreshold: 0.35,         // More lenient
  });
  
  const [showComparison, setShowComparison] = useState<'starless' | 'stars' | 'split'>('starless');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error || t('Invalid file', '无效文件'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploadProgress({ show: true, progress: 0, fileName: file.name });

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 20, 90)
        }));
      }, 100);

      const { dataUrl, element } = await loadImageFromFile(file, {
        enableDownscale: true,
        maxResolution: 4096 * 4096
      });
      
      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, progress: 100 }));

      setOriginalImage(dataUrl);
      setOriginalElement(element);
      setStarlessImage(null);
      setStarsOnlyImage(null);

      setTimeout(() => {
        setUploadProgress({ show: false, progress: 0, fileName: '' });
      }, 500);

      toast.success(t('Image uploaded successfully', '图像上传成功'));
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(t('Failed to upload image', '上传图像失败'));
      if (fileInputRef.current) fileInputRef.current.value = '';
      setUploadProgress({ show: false, progress: 0, fileName: '' });
    }
  }, [language]);

  const processImage = useCallback(async () => {
    if (!originalElement) {
      toast.error(t('Please upload an image first', '请先上传图像'));
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingStage('');

    try {
      // Client-side processing with improved algorithm
      console.log('🚀 Starting star detection...');
      toast.info(t('Detecting and removing stars...', '正在检测和移除星点...'));

      // Detect stars using improved algorithm with shape analysis
      const detectedStars = await detectStarsImproved(
        originalElement,
        settings,
        (progress, stage) => {
          setProcessingProgress(Math.floor(progress * 0.6)); // First 60% of progress
          setProcessingStage(stage);
        }
      );

      console.log(`Detected ${detectedStars.length} stars with improved algorithm`);

      if (detectedStars.length === 0) {
        toast.warning(t(
          'No stars detected. Try adjusting the detection parameters.',
          '未检测到星点。请尝试调整检测参数。'
        ));
        setIsProcessing(false);
        setProcessingProgress(0);
        setProcessingStage('');
        return;
      }

      // Remove stars and create separated images
      const { starImage, starlessImage: nebulaImage } = await removeStarsImproved(
        originalElement,
        detectedStars,
        (progress, stage) => {
          setProcessingProgress(60 + Math.floor(progress * 0.4)); // Last 40% of progress
          setProcessingStage(stage);
        }
      );

      setProcessingProgress(100);
      setProcessingStage('Complete!');

      setStarlessImage(nebulaImage);
      setStarsOnlyImage(starImage);

      toast.success(t(
        `Successfully removed ${detectedStars.length} stars!`,
        `成功移除 ${detectedStars.length} 个星点！`
      ));
    } catch (error) {
      console.error('Processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(t(`Failed to process image: ${errorMessage}`, `处理图像失败: ${errorMessage}`));
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(0);
        setProcessingStage('');
      }, 1000);
    }
  }, [originalElement, settings, language, originalImage]);

  const downloadImage = useCallback((imageUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t('Image downloaded', '图像已下载'));
  }, [language]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
          {t('Star Removal Tool', '星点移除工具')}
        </h1>
        <p className="text-cosmic-300 text-lg max-w-3xl mx-auto">
          {t(
            'Remove stars from deep sky images to reveal nebulae and galaxies. Powered by advanced star detection algorithms.',
            '从深空图像中移除星点以揭示星云和星系。基于先进的星点检测算法。'
          )}
        </p>
      </div>

      {/* Upload Card */}
      <Card className="border-cosmic-700/50 bg-cosmic-900/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Upload className="h-5 w-5 text-amber-400" />
            {t('Upload Image', '上传图像')}
          </CardTitle>
          <CardDescription className="text-cosmic-300">
            {t('Upload a deep sky astrophotography image (JPEG, PNG, TIFF)', '上传深空天体摄影图像（JPEG、PNG、TIFF）')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full border-cosmic-700 hover:bg-cosmic-800"
              disabled={isProcessing}
            >
              <Upload className="mr-2 h-4 w-4" />
              {t('Choose Image', '选择图像')}
            </Button>
          </div>

          <UploadProgress
            show={uploadProgress.show}
            progress={uploadProgress.progress}
            fileName={uploadProgress.fileName}
          />

          {originalImage && (
            <div className="space-y-4">
              <img
                src={originalImage}
                alt="Original"
                className="w-full rounded-lg border border-cosmic-700"
              />
              
              <Alert className="border-amber-500/30 bg-amber-500/10">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-cosmic-200">
                  {t(
                    'Adjust the detection settings below to fine-tune star removal for your image.',
                    '调整下方的检测设置以微调您图像的星点移除效果。'
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Card */}
      {originalImage && (
        <Card className="border-cosmic-700/50 bg-cosmic-900/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-5 w-5 text-purple-400" />
            {t('Detection Settings', '检测设置')}
          </CardTitle>
          <CardDescription className="text-cosmic-300">
            {t('Adjust star detection parameters', '调整星点检测参数')}
          </CardDescription>
          
          <div className="flex items-center gap-3 mt-4 p-3 bg-cosmic-800/30 rounded-lg border border-cosmic-700/50 opacity-50 cursor-not-allowed" title="Backend processing not yet implemented">
            <Switch
              checked={false}
              disabled={true}
              id="backend-processing"
            />
            <div className="flex-1">
              <Label htmlFor="backend-processing" className="text-cosmic-400 font-medium">
                {t('Backend ML Processing (Coming Soon)', '后端机器学习处理（即将推出）')}
              </Label>
              <p className="text-xs text-cosmic-500 mt-1">
                {t(
                  'Server-side StarNet processing - requires deployment',
                  '服务器端StarNet处理 - 需要部署'
                )}
              </p>
            </div>
          </div>
        </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-blue-500/30 bg-blue-500/10">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-cosmic-200 text-xs">
                {t(
                  '💡 Advanced algorithm with shape analysis. Check browser console (F12) for detailed detection logs.',
                  '💡 使用形状分析的高级算法。查看浏览器控制台(F12)以获取详细检测日志。'
                )}
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-cosmic-200">
                  {t('Brightness Threshold', '亮度阈值')}
                </Label>
                <span className="text-sm text-cosmic-400">{settings.threshold.toFixed(1)}</span>
              </div>
              <Slider
                value={[settings.threshold]}
                onValueChange={([value]) => setSettings({ ...settings, threshold: value })}
                min={0.5}
                max={1.5}
                step={0.1}
                className="w-full"
              />
              <p className="text-xs text-cosmic-400">
                {t('Controls detection sensitivity to bright objects', '控制对明亮物体的检测灵敏度')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-cosmic-200">
                  {t('Circularity', '圆形度')}
                </Label>
                <span className="text-sm text-cosmic-400">{settings.circularityThreshold.toFixed(2)}</span>
              </div>
              <Slider
                value={[settings.circularityThreshold]}
                onValueChange={([value]) => setSettings({ ...settings, circularityThreshold: value })}
                min={0.3}
                max={0.9}
                step={0.05}
                className="w-full"
              />
              <p className="text-xs text-cosmic-400">
                {t('Lower = detect more objects. Higher = only perfect circles (preserve nebulae)', '更低=检测更多对象。更高=仅完美圆形（保留星云）')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-cosmic-200">
                  {t('Edge Sharpness', '边缘锐度')}
                </Label>
                <span className="text-sm text-cosmic-400">{settings.sharpnessThreshold.toFixed(2)}</span>
              </div>
              <Slider
                value={[settings.sharpnessThreshold]}
                onValueChange={([value]) => setSettings({ ...settings, sharpnessThreshold: value })}
                min={0.1}
                max={0.8}
                step={0.05}
                className="w-full"
              />
              <p className="text-xs text-cosmic-400">
                {t('Lower = more lenient. Stars have sharp edges, nebulae are soft', '更低=更宽松。星点锐利，星云柔和')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-cosmic-200">
                  {t('PSF Match Score', 'PSF匹配分数')}
                </Label>
                <span className="text-sm text-cosmic-400">{settings.psfThreshold.toFixed(2)}</span>
              </div>
              <Slider
                value={[settings.psfThreshold]}
                onValueChange={([value]) => setSettings({ ...settings, psfThreshold: value })}
                min={0.2}
                max={0.8}
                step={0.05}
                className="w-full"
              />
              <p className="text-xs text-cosmic-400">
                {t('Lower = more detections. Measures radial brightness falloff', '更低=更多检测。测量径向亮度衰减')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-cosmic-200 text-sm">
                    {t('Min Radius', '最小半径')}
                  </Label>
                  <span className="text-sm text-cosmic-400">{settings.minStarRadius}px</span>
                </div>
                <Slider
                  value={[settings.minStarRadius]}
                  onValueChange={([value]) => setSettings({ ...settings, minStarRadius: value })}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-cosmic-200 text-sm">
                    {t('Max Radius', '最大半径')}
                  </Label>
                  <span className="text-sm text-cosmic-400">{settings.maxStarRadius}px</span>
                </div>
                <Slider
                  value={[settings.maxStarRadius]}
                  onValueChange={([value]) => setSettings({ ...settings, maxStarRadius: value })}
                  min={10}
                  max={40}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={processImage}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    {t('Processing...', '处理中...')} {processingProgress}%
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t('Remove Stars', '移除星点')}
                  </>
                )}
              </Button>

              {isProcessing && (
                <div className="space-y-2">
                  <div className="w-full h-2 bg-cosmic-800/60 rounded-full overflow-hidden border border-cosmic-700/30">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-cosmic-400 text-center">
                    {processingStage}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Card */}
      {starlessImage && starsOnlyImage && (
        <Card className="border-cosmic-700/50 bg-cosmic-900/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Eye className="h-5 w-5 text-green-400" />
              {t('Results', '结果')}
            </CardTitle>
            <CardDescription className="text-cosmic-300">
              {t('View and download the processed images', '查看和下载处理后的图像')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* View Toggle */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={showComparison === 'starless' ? 'default' : 'outline'}
                onClick={() => setShowComparison('starless')}
                size="sm"
              >
                <EyeOff className="mr-2 h-4 w-4" />
                {t('Starless', '无星点')}
              </Button>
              <Button
                variant={showComparison === 'stars' ? 'default' : 'outline'}
                onClick={() => setShowComparison('stars')}
                size="sm"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {t('Stars Only', '仅星点')}
              </Button>
              <Button
                variant={showComparison === 'split' ? 'default' : 'outline'}
                onClick={() => setShowComparison('split')}
                size="sm"
              >
                <Eye className="mr-2 h-4 w-4" />
                {t('Side by Side', '并排对比')}
              </Button>
            </div>

            {/* Image Display */}
            {showComparison === 'starless' && (
              <div className="space-y-2">
                <img
                  src={starlessImage}
                  alt="Starless"
                  className="w-full rounded-lg border border-cosmic-700"
                />
                <p className="text-sm text-cosmic-400 text-center">
                  {t('Starless Image - Pure nebula/galaxy', '无星点图像 - 纯星云/星系')}
                </p>
              </div>
            )}

            {showComparison === 'stars' && (
              <div className="space-y-2">
                <img
                  src={starsOnlyImage}
                  alt="Stars Only"
                  className="w-full rounded-lg border border-cosmic-700 bg-black"
                />
                <p className="text-sm text-cosmic-400 text-center">
                  {t('Removed Stars', '移除的星点')}
                </p>
              </div>
            )}

            {showComparison === 'split' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <img
                    src={starlessImage}
                    alt="Starless"
                    className="w-full rounded-lg border border-cosmic-700"
                  />
                  <p className="text-sm text-cosmic-400 text-center">
                    {t('Starless', '无星点')}
                  </p>
                </div>
                <div className="space-y-2">
                  <img
                    src={starsOnlyImage}
                    alt="Stars Only"
                    className="w-full rounded-lg border border-cosmic-700 bg-black"
                  />
                  <p className="text-sm text-cosmic-400 text-center">
                    {t('Stars Only', '仅星点')}
                  </p>
                </div>
              </div>
            )}

            {/* Download Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-4">
              <Button
                onClick={() => downloadImage(starlessImage, 'starless.png')}
                variant="outline"
                className="border-cosmic-700 hover:bg-cosmic-800"
              >
                <Download className="mr-2 h-4 w-4" />
                {t('Download Starless', '下载无星点图像')}
              </Button>
              <Button
                onClick={() => downloadImage(starsOnlyImage, 'stars-only.png')}
                variant="outline"
                className="border-cosmic-700 hover:bg-cosmic-800"
              >
                <Download className="mr-2 h-4 w-4" />
                {t('Download Stars', '下载星点图像')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StarRemovalProcessor;
