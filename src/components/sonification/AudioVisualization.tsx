
import React, { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

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

interface AudioVisualizationProps {
  analysisResult: AnalysisResult;
  isPlaying: boolean;
}

const AudioVisualization: React.FC<AudioVisualizationProps> = ({
  analysisResult,
  isPlaying
}) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, `rgba(${analysisResult.colorProfile.red * 255}, ${analysisResult.colorProfile.green * 255}, ${analysisResult.colorProfile.blue * 255}, 0.1)`);
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw frequency bars
      const barWidth = width / analysisResult.dominantFrequencies.length;
      analysisResult.dominantFrequencies.forEach((freq, index) => {
        const barHeight = (freq / 1000) * height * 0.8;
        const x = index * barWidth;
        const y = height - barHeight;
        
        const alpha = isPlaying ? 0.8 + 0.2 * Math.sin(Date.now() * 0.01 + index) : 0.6;
        ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      });

      // Draw celestial objects as particles
      const drawParticles = (count: number, color: string, size: number) => {
        for (let i = 0; i < count; i++) {
          const x = Math.random() * width;
          const y = Math.random() * height;
          const pulse = isPlaying ? 1 + 0.3 * Math.sin(Date.now() * 0.005 + i) : 1;
          
          ctx.beginPath();
          ctx.arc(x, y, size * pulse, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      };

      drawParticles(analysisResult.stars, 'rgba(255, 255, 255, 0.8)', 1);
      drawParticles(analysisResult.nebulae, 'rgba(255, 100, 150, 0.6)', 3);
      drawParticles(analysisResult.galaxies, 'rgba(100, 150, 255, 0.7)', 2);

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analysisResult, isPlaying]);

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-center">
        {t('Audio Visualization', '音频可视化')}
      </h3>
      <div className="relative bg-cosmic-900/20 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          className="w-full h-48 object-contain"
        />
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <span className="text-cosmic-400 text-sm">
              {t('Press play to see visualization', '按播放查看可视化')}
            </span>
          </div>
        )}
      </div>
      
      <div className="text-xs text-cosmic-400 text-center space-y-1">
        <p>{t('Visualization shows frequency mapping based on celestial objects', '可视化显示基于天体的频率映射')}</p>
        <div className="flex justify-center gap-4">
          <span>⭐ {t('Stars', '恒星')}</span>
          <span>🌌 {t('Nebulae', '星云')}</span>
          <span>🌀 {t('Galaxies', '星系')}</span>
        </div>
      </div>
    </div>
  );
};

export default AudioVisualization;
