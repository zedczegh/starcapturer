import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Music, Sun, Moon, Globe } from 'lucide-react';
import { toast } from 'sonner';
import ImageUploadZone from './ImageUploadZone';
import SonificationControls from './SonificationControls';
import AudioVisualization from './AudioVisualization';
import { analyzeAstronomyImage, generateAudioFromAnalysis, exportToMp3 } from '@/utils/sonification/audioProcessor';

interface AnalysisResult {
  // Deep sky objects
  stars: number;
  nebulae: number;
  galaxies: number;
  
  // Planetary/Solar objects
  planets: number;
  moons: number;
  sunspots: number;
  solarFlares: number;
  
  // Image characteristics
  brightness: number;
  contrast: number;
  saturation: number;
  imageType: 'deep-sky' | 'planetary' | 'solar' | 'lunar' | 'mixed';
  
  colorProfile: {
    red: number;
    green: number;
    blue: number;
  };
  
  dominantFrequencies: number[];
  harmonicStructure: number[];
  rhythmPattern: number[];
}

const SonificationProcessor: React.FC = () => {
  const { t } = useLanguage();
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [currentSource, setCurrentSource] = useState<AudioBufferSourceNode | null>(null);

  const handleImageUpload = useCallback((file: File) => {
    setUploadedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setAnalysisResult(null);
    setAudioBuffer(null);
  }, []);

  const processImage = useCallback(async () => {
    if (!uploadedImage) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Enhanced processing steps
      setProcessingProgress(15);
      
      // Analyze the image with enhanced detection
      const analysis = await analyzeAstronomyImage(uploadedImage);
      setAnalysisResult(analysis);
      setProcessingProgress(50);

      // Generate enhanced audio
      const audio = await generateAudioFromAnalysis(analysis);
      setAudioBuffer(audio);
      setProcessingProgress(100);

      toast.success(t('Enhanced image analysis completed!', '增强图像分析完成！'));
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error(t('Failed to process image', '处理图像失败'));
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [uploadedImage, t]);

  const playAudio = useCallback(async () => {
    if (!audioBuffer) return;

    try {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
      }

      const ctx = audioContext || new AudioContext();
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        setCurrentSource(null);
      };

      source.start();
      setCurrentSource(source);
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
      toast.error(t('Failed to play audio', '播放音频失败'));
    }
  }, [audioBuffer, audioContext]);

  const stopAudio = useCallback(() => {
    if (currentSource) {
      currentSource.stop();
      setCurrentSource(null);
      setIsPlaying(false);
    }
  }, [currentSource]);

  const downloadAudio = useCallback(async () => {
    if (!audioBuffer) return;

    try {
      const mp3Blob = await exportToMp3(audioBuffer);
      const url = URL.createObjectURL(mp3Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `astronomy-sonification-${analysisResult?.imageType || 'audio'}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(t('Audio downloaded as MP3', '音频已下载为MP3格式'));
    } catch (error) {
      console.error('Error downloading audio:', error);
      toast.error(t('Failed to download audio', '下载音频失败'));
    }
  }, [audioBuffer, analysisResult, t]);

  const resetProcessor = useCallback(() => {
    setUploadedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setAudioBuffer(null);
    if (currentSource) {
      currentSource.stop();
      setCurrentSource(null);
    }
    setIsPlaying(false);
    setProcessingProgress(0);
  }, [currentSource]);

  const getImageTypeIcon = () => {
    if (!analysisResult) return <Music className="h-5 w-5" />;
    
    switch (analysisResult.imageType) {
      case 'solar': return <Sun className="h-5 w-5 text-yellow-400" />;
      case 'lunar': return <Moon className="h-5 w-5 text-gray-300" />;
      case 'planetary': return <Globe className="h-5 w-5 text-blue-400" />;
      default: return <Music className="h-5 w-5 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          {getImageTypeIcon()}
          <h2 className="text-2xl font-bold text-primary">
            {t('Enhanced Astronomy Sonification', '增强天文声化处理')}
          </h2>
        </div>
        <p className="text-cosmic-400">
          {t('Upload astronomy images for enhanced AI-powered sonification with planetary and solar object detection', 
             '上传天文图像进行增强AI驱动的声化处理，支持行星和太阳天体检测')}
        </p>
      </div>

      <Card className="p-6 bg-cosmic-900/40 backdrop-blur-md">
        <ImageUploadZone
          onImageUpload={handleImageUpload}
          imagePreview={imagePreview}
          isProcessing={isProcessing}
        />

        {isProcessing && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{t('Processing with enhanced algorithms...', '使用增强算法处理中...')}</span>
              <span>{processingProgress}%</span>
            </div>
            <Progress value={processingProgress} className="w-full" />
          </div>
        )}

        {uploadedImage && !isProcessing && !analysisResult && (
          <div className="mt-4 flex justify-center">
            <Button onClick={processImage} className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              {t('Generate Enhanced Sonification', '生成增强声化')}
            </Button>
          </div>
        )}

        {analysisResult && (
          <div className="mt-6 space-y-4">
            {/* Enhanced statistics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {/* Deep sky objects */}
              <div className="text-center p-3 bg-cosmic-800/30 rounded-lg">
                <div className="font-semibold text-primary">{analysisResult.stars}</div>
                <div className="text-cosmic-400">{t('Stars', '恒星')}</div>
              </div>
              <div className="text-center p-3 bg-cosmic-800/30 rounded-lg">
                <div className="font-semibold text-primary">{analysisResult.nebulae}</div>
                <div className="text-cosmic-400">{t('Nebulae', '星云')}</div>
              </div>
              <div className="text-center p-3 bg-cosmic-800/30 rounded-lg">
                <div className="font-semibold text-primary">{analysisResult.galaxies}</div>
                <div className="text-cosmic-400">{t('Galaxies', '星系')}</div>
              </div>
              <div className="text-center p-3 bg-cosmic-800/30 rounded-lg">
                <div className="font-semibold text-primary">{Math.round(analysisResult.brightness * 100)}%</div>
                <div className="text-cosmic-400">{t('Brightness', '亮度')}</div>
              </div>
              
              {/* Planetary/Solar objects - only show if detected */}
              {(analysisResult.planets > 0 || analysisResult.moons > 0 || analysisResult.sunspots > 0 || analysisResult.solarFlares > 0) && (
                <>
                  {analysisResult.planets > 0 && (
                    <div className="text-center p-3 bg-blue-800/30 rounded-lg">
                      <div className="font-semibold text-blue-300">{analysisResult.planets}</div>
                      <div className="text-cosmic-400">{t('Planets', '行星')}</div>
                    </div>
                  )}
                  {analysisResult.moons > 0 && (
                    <div className="text-center p-3 bg-gray-700/30 rounded-lg">
                      <div className="font-semibold text-gray-300">{analysisResult.moons}</div>
                      <div className="text-cosmic-400">{t('Moons', '卫星')}</div>
                    </div>
                  )}
                  {analysisResult.sunspots > 0 && (
                    <div className="text-center p-3 bg-orange-800/30 rounded-lg">
                      <div className="font-semibold text-orange-300">{analysisResult.sunspots}</div>
                      <div className="text-cosmic-400">{t('Sunspots', '太阳黑子')}</div>
                    </div>
                  )}
                  {analysisResult.solarFlares > 0 && (
                    <div className="text-center p-3 bg-yellow-800/30 rounded-lg">
                      <div className="font-semibold text-yellow-300">{analysisResult.solarFlares}</div>
                      <div className="text-cosmic-400">{t('Solar Flares', '太阳耀斑')}</div>
                    </div>
                  )}
                </>
              )}
              
              {/* Image characteristics */}
              <div className="text-center p-3 bg-cosmic-800/30 rounded-lg">
                <div className="font-semibold text-primary">{Math.round(analysisResult.contrast * 100)}%</div>
                <div className="text-cosmic-400">{t('Contrast', '对比度')}</div>
              </div>
              <div className="text-center p-3 bg-cosmic-800/30 rounded-lg">
                <div className="font-semibold text-primary">{Math.round(analysisResult.saturation * 100)}%</div>
                <div className="text-cosmic-400">{t('Saturation', '饱和度')}</div>
              </div>
            </div>

            <AudioVisualization 
              analysisResult={analysisResult}
              isPlaying={isPlaying}
            />

            <SonificationControls
              isPlaying={isPlaying}
              onPlay={playAudio}
              onStop={stopAudio}
              onDownload={downloadAudio}
              onReset={resetProcessor}
              hasAudio={!!audioBuffer}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default SonificationProcessor;
