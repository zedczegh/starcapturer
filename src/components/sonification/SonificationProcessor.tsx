
import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Music, ArrowLeft, Upload, Sun, Moon, Globe } from 'lucide-react';
import { toast } from 'sonner';
import ImageTypeSelector from './ImageTypeSelector';
import ImageUploadZone from './ImageUploadZone';
import AnalysisStats from './AnalysisStats';
import SonificationControls from './SonificationControls';
import AudioVisualization from './AudioVisualization';
import { analyzeAstronomyImage, generateAudioFromAnalysis, exportToMp3 } from '@/utils/sonification/audioProcessor';

type ImageType = 'deep-sky' | 'solar' | 'planetary' | 'lunar';

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
  const [step, setStep] = useState<'select' | 'upload' | 'results'>('select');
  const [selectedImageType, setSelectedImageType] = useState<ImageType>('deep-sky');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [currentSource, setCurrentSource] = useState<AudioBufferSourceNode | null>(null);

  const handleImageTypeSelect = useCallback((type: ImageType) => {
    setSelectedImageType(type);
    setStep('upload');
  }, []);

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
      setProcessingProgress(15);
      
      const analysis = await analyzeAstronomyImage(uploadedImage, selectedImageType);
      setAnalysisResult(analysis);
      setProcessingProgress(50);

      const audio = await generateAudioFromAnalysis(analysis);
      setAudioBuffer(audio);
      setProcessingProgress(100);
      setStep('results');

      toast.success(t('Image analysis and sonification completed!', '图像分析和声化完成！'));
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error(t('Failed to process image', '处理图像失败'));
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  }, [uploadedImage, selectedImageType, t]);

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
    setStep('select');
    setSelectedImageType('deep-sky');
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

  const goBack = useCallback(() => {
    if (step === 'upload') {
      setStep('select');
      setUploadedImage(null);
      setImagePreview(null);
    } else if (step === 'results') {
      setStep('upload');
      setAnalysisResult(null);
      setAudioBuffer(null);
      if (currentSource) {
        currentSource.stop();
        setCurrentSource(null);
      }
      setIsPlaying(false);
    }
  }, [step, currentSource]);

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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Music className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary">
            {t('Astronomy Sonification', '天文声化处理')}
          </h1>
        </div>
        <p className="text-cosmic-400 max-w-2xl mx-auto">
          {t('Transform your astronomy images into beautiful harmonic compositions. Upload your photos and let AI create unique soundscapes based on celestial data.', 
             '将您的天文图像转换为美妙的和声作品。上传您的照片，让AI根据天体数据创造独特的音景。')}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step === 'select' ? 'bg-primary text-primary-foreground' : 
            ['upload', 'results'].includes(step) ? 'bg-primary/20 text-primary' : 'bg-cosmic-800 text-cosmic-400'
          }`}>
            1
          </div>
          <div className={`w-16 h-0.5 ${
            ['upload', 'results'].includes(step) ? 'bg-primary' : 'bg-cosmic-800'
          }`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step === 'upload' ? 'bg-primary text-primary-foreground' : 
            step === 'results' ? 'bg-primary/20 text-primary' : 'bg-cosmic-800 text-cosmic-400'
          }`}>
            2
          </div>
          <div className={`w-16 h-0.5 ${
            step === 'results' ? 'bg-primary' : 'bg-cosmic-800'
          }`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            step === 'results' ? 'bg-primary text-primary-foreground' : 'bg-cosmic-800 text-cosmic-400'
          }`}>
            3
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Card className="p-8 bg-cosmic-900/40 backdrop-blur-md border-cosmic-700/50">
        {/* Back Button */}
        {step !== 'select' && (
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={goBack}
              className="flex items-center gap-2 text-cosmic-400 hover:text-cosmic-200"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('Back', '返回')}
            </Button>
          </div>
        )}

        {/* Step 1: Image Type Selection */}
        {step === 'select' && (
          <ImageTypeSelector
            selectedType={selectedImageType}
            onTypeSelect={handleImageTypeSelect}
          />
        )}

        {/* Step 2: Image Upload */}
        {step === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-cosmic-200 mb-2">
                {t('Upload Your Image', '上传您的图像')}
              </h2>
              <p className="text-cosmic-400">
                {t('Selected type:', '选择的类型：')} 
                <span className="text-primary font-medium ml-1">
                  {selectedImageType === 'deep-sky' && t('Deep Sky', '深空')}
                  {selectedImageType === 'solar' && t('Solar', '太阳')}
                  {selectedImageType === 'planetary' && t('Planetary', '行星')}
                  {selectedImageType === 'lunar' && t('Lunar', '月球')}
                </span>
              </p>
            </div>

            <ImageUploadZone
              onImageUpload={handleImageUpload}
              imagePreview={imagePreview}
              isProcessing={isProcessing}
            />

            {isProcessing && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-cosmic-400">
                    {t('Analyzing image and generating sonification...', '分析图像并生成声化...')}
                  </span>
                  <span className="text-primary font-medium">{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
              </div>
            )}

            {uploadedImage && !isProcessing && (
              <div className="flex justify-center">
                <Button onClick={processImage} className="flex items-center gap-2 px-8">
                  <Music className="h-4 w-4" />
                  {t('Generate Sonification', '生成声化')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Results */}
        {step === 'results' && analysisResult && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-cosmic-200 mb-2">
                {t('Analysis Complete', '分析完成')}
              </h2>
              <p className="text-cosmic-400">
                {t('Your astronomy image has been analyzed and converted to audio', '您的天文图像已被分析并转换为音频')}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Image Preview */}
              <div className="space-y-4">
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Analyzed astronomy image"
                      className="w-full max-h-96 object-contain rounded-lg bg-cosmic-800/20"
                    />
                  </div>
                )}
                
                <AudioVisualization 
                  analysisResult={analysisResult}
                  isPlaying={isPlaying}
                />
              </div>

              {/* Right Column: Analysis Results */}
              <div className="space-y-6">
                <AnalysisStats analysisResult={analysisResult} />
                
                <SonificationControls
                  isPlaying={isPlaying}
                  onPlay={playAudio}
                  onStop={stopAudio}
                  onDownload={downloadAudio}
                  onReset={resetProcessor}
                  hasAudio={!!audioBuffer}
                />
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SonificationProcessor;
