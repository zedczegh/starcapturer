
import React, { useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, Play, Pause, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import ImageUploadZone from './ImageUploadZone';
import SonificationControls from './SonificationControls';
import AudioVisualization from './AudioVisualization';
import { processAstronomyImage, generateAudioFromData } from '@/utils/sonification/audioProcessor';

interface SonificationData {
  brightness: number[];
  starPositions: { x: number; y: number; intensity: number }[];
  colorProfile: { r: number; g: number; b: number }[];
  composition: {
    stars: number;
    nebulae: number;
    galaxies: number;
  };
}

const SonificationProcessor = () => {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [sonificationData, setSonificationData] = useState<SonificationData | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [currentSource, setCurrentSource] = useState<AudioBufferSourceNode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('Please select a valid image file', '请选择有效的图片文件'));
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('Image file too large (max 10MB)', '图片文件过大（最大10MB）'));
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    toast.success(t('Image uploaded successfully', '图片上传成功'));
  }, [t]);

  const processImage = useCallback(async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simulate processing progress
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Process the image
      const data = await processAstronomyImage(selectedImage);
      setSonificationData(data);

      // Generate audio
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(context);
      
      const buffer = await generateAudioFromData(data, context);
      setAudioBuffer(buffer);

      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      toast.success(t('Image processed successfully!', '图片处理成功！'));
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(t('Failed to process image', '图片处理失败'));
    } finally {
      setIsProcessing(false);
    }
  }, [selectedImage, t]);

  const togglePlayback = useCallback(() => {
    if (!audioContext || !audioBuffer) return;

    if (isPlaying) {
      // Stop playback
      if (currentSource) {
        currentSource.stop();
        setCurrentSource(null);
      }
      setIsPlaying(false);
    } else {
      // Start playback
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      
      source.onended = () => {
        setIsPlaying(false);
        setCurrentSource(null);
      };
      
      source.start();
      setCurrentSource(source);
      setIsPlaying(true);
    }
  }, [audioContext, audioBuffer, isPlaying, currentSource]);

  const downloadAudio = useCallback(() => {
    if (!audioBuffer) return;

    // Convert AudioBuffer to WAV file
    const length = audioBuffer.length;
    const sampleRate = audioBuffer.sampleRate;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);

    // WAV file header
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

    // Convert float32 to int16
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
    a.download = `astronomy-sonification-${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  }, [audioBuffer]);

  const resetProcessor = useCallback(() => {
    if (currentSource) {
      currentSource.stop();
    }
    setSelectedImage(null);
    setImagePreview(null);
    setSonificationData(null);
    setAudioBuffer(null);
    setCurrentSource(null);
    setIsPlaying(false);
    setProcessingProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [currentSource]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            {t('Astronomy Sonification', '天文声化处理器')}
          </h1>
          <p className="text-cosmic-400 max-w-2xl mx-auto">
            {t(
              'Transform your astronomy photographs into harmonic compositions that reveal the cosmic structure through sound',
              '将您的天文照片转换为和谐的音乐作品，通过声音揭示宇宙结构'
            )}
          </p>
        </motion.div>

        {/* Upload Section */}
        <Card className="glassmorphism p-6">
          <ImageUploadZone
            onImageUpload={handleImageUpload}
            imagePreview={imagePreview}
            isProcessing={isProcessing}
            ref={fileInputRef}
          />
          
          {selectedImage && !isProcessing && !sonificationData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center"
            >
              <Button onClick={processImage} className="bg-primary hover:bg-primary/90">
                <Upload className="w-4 h-4 mr-2" />
                {t('Process Image', '处理图片')}
              </Button>
            </motion.div>
          )}
        </Card>

        {/* Processing Progress */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="glassmorphism p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {t('Processing Astronomy Image...', '正在处理天文图片...')}
                    </h3>
                    <p className="text-cosmic-400 text-sm">
                      {t('Analyzing stellar data and generating harmonic patterns', '分析恒星数据并生成和谐音律')}
                    </p>
                  </div>
                  <Progress value={processingProgress} className="w-full" />
                  <p className="text-center text-xs text-cosmic-500">
                    {Math.round(processingProgress)}% {t('complete', '完成')}
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {sonificationData && audioBuffer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <SonificationControls
                isPlaying={isPlaying}
                onTogglePlayback={togglePlayback}
                onDownload={downloadAudio}
                onReset={resetProcessor}
                sonificationData={sonificationData}
              />
              
              <AudioVisualization
                audioBuffer={audioBuffer}
                isPlaying={isPlaying}
                sonificationData={sonificationData}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SonificationProcessor;
