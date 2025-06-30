
import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Music, Play, Pause, Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import ImageUploadZone from './ImageUploadZone';
import SonificationControls from './SonificationControls';
import AudioVisualization from './AudioVisualization';
import { analyzeAstronomyImage, generateAudioFromAnalysis } from '@/utils/sonification/audioProcessor';

interface AnalysisResult {
  stars: number;
  nebulae: number;
  galaxies: number;
  brightness: number;
  colorProfile: {
    red: number;
    green: number;
    blue: number;
  };
  dominantFrequencies: number[];
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
      // Simulate processing steps
      setProcessingProgress(20);
      
      // Analyze the image
      const analysis = await analyzeAstronomyImage(uploadedImage);
      setAnalysisResult(analysis);
      setProcessingProgress(60);

      // Generate audio
      const audio = await generateAudioFromAnalysis(analysis);
      setAudioBuffer(audio);
      setProcessingProgress(100);

      toast.success(t('Image processed successfully!', '图像处理成功！'));
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

  const downloadAudio = useCallback(() => {
    if (!audioBuffer || !audioContext) return;

    // Convert AudioBuffer to WAV and download
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);

    const channelData = audioBuffer.getChannelData(0);
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'astronomy-sonification.wav';
    a.click();
    URL.revokeObjectURL(url);
  }, [audioBuffer, audioContext]);

  const resetProcessor = useCallback(() => {
    setUploadedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setAudioBuffer(null);
    stopAudio();
    setProcessingProgress(0);
  }, [stopAudio]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-primary mb-2">
          {t('Astronomy Image Sonification', '天文图像声化')}
        </h2>
        <p className="text-cosmic-400">
          {t('Upload an astronomy image to generate a harmonic tune based on its celestial data', 
             '上传天文图像以基于其天体数据生成和声曲调')}
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
              <span>{t('Processing image...', '处理图像中...')}</span>
              <span>{processingProgress}%</span>
            </div>
            <Progress value={processingProgress} className="w-full" />
          </div>
        )}

        {uploadedImage && !isProcessing && !analysisResult && (
          <div className="mt-4 flex justify-center">
            <Button onClick={processImage} className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              {t('Generate Sonification', '生成声化')}
            </Button>
          </div>
        )}

        {analysisResult && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
