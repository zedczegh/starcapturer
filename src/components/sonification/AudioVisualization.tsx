
import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

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

interface AudioVisualizationProps {
  audioBuffer: AudioBuffer;
  isPlaying: boolean;
  sonificationData: SonificationData;
}

const AudioVisualization: React.FC<AudioVisualizationProps> = ({
  audioBuffer,
  isPlaying,
  sonificationData
}) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [waveformData, setWaveformData] = useState<number[]>([]);

  useEffect(() => {
    if (audioBuffer) {
      // Extract waveform data for visualization
      const channelData = audioBuffer.getChannelData(0);
      const samples = 200; // Number of samples for visualization
      const blockSize = Math.floor(channelData.length / samples);
      const filteredData = [];

      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[i * blockSize + j]);
        }
        filteredData.push(sum / blockSize);
      }

      setWaveformData(filteredData);
    }
  }, [audioBuffer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.1)');
      gradient.addColorStop(1, 'rgba(17, 24, 39, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw waveform
      const barWidth = width / waveformData.length;
      
      waveformData.forEach((value, index) => {
        const barHeight = value * height * 0.8;
        const x = index * barWidth;
        const y = height - barHeight;

        // Create bar gradient
        const barGradient = ctx.createLinearGradient(0, y, 0, height);
        barGradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
        barGradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.6)');
        barGradient.addColorStop(1, 'rgba(16, 185, 129, 0.4)');

        ctx.fillStyle = barGradient;
        ctx.fillRect(x, y, barWidth - 1, barHeight);

        // Add glow effect when playing
        if (isPlaying) {
          ctx.shadowColor = 'rgba(139, 92, 246, 0.5)';
          ctx.shadowBlur = 10;
          ctx.fillRect(x, y, barWidth - 1, barHeight);
          ctx.shadowBlur = 0;
        }
      });

      // Draw star positions overlay
      sonificationData.starPositions.forEach(star => {
        const x = (star.x / 100) * width;
        const y = (star.y / 100) * height;
        const radius = Math.max(1, star.intensity * 3);

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.intensity})`;
        ctx.fill();

        // Add sparkle effect
        if (isPlaying) {
          ctx.beginPath();
          ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(139, 92, 246, 0.3)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [waveformData, isPlaying, sonificationData]);

  return (
    <Card className="glassmorphism p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">
          {t('Audio Visualization', '音频可视化')}
        </h3>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <canvas
            ref={canvasRef}
            width={800}
            height={300}
            className="w-full h-auto bg-cosmic-900/20 rounded-lg border border-cosmic-700/30"
          />
          
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-cosmic-400 text-center">
                <div className="text-sm">
                  {t('Press play to see visualization', '点击播放查看可视化效果')}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        <div className="text-xs text-cosmic-500 text-center">
          {t(
            'Visualization combines audio waveform with stellar positions from your image',
            '可视化结合了音频波形和图片中的恒星位置'
          )}
        </div>
      </div>
    </Card>
  );
};

export default AudioVisualization;
