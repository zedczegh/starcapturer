
import React, { useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

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
      
      // Create gradient background based on image type
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      switch (analysisResult.imageType) {
        case 'solar':
          gradient.addColorStop(0, 'rgba(255, 200, 50, 0.2)');
          gradient.addColorStop(1, 'rgba(255, 100, 0, 0.1)');
          break;
        case 'planetary':
          gradient.addColorStop(0, 'rgba(100, 150, 255, 0.2)');
          gradient.addColorStop(1, 'rgba(50, 100, 200, 0.1)');
          break;
        case 'lunar':
          gradient.addColorStop(0, 'rgba(200, 200, 200, 0.2)');
          gradient.addColorStop(1, 'rgba(150, 150, 150, 0.1)');
          break;
        default:
          gradient.addColorStop(0, `rgba(${analysisResult.colorProfile.red * 255}, ${analysisResult.colorProfile.green * 255}, ${analysisResult.colorProfile.blue * 255}, 0.15)`);
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw frequency bars with enhanced visualization
      const barWidth = width / analysisResult.dominantFrequencies.length;
      analysisResult.dominantFrequencies.forEach((freq, index) => {
        const barHeight = Math.min((freq / 1000) * height * 0.7, height * 0.8);
        const x = index * barWidth;
        const y = height - barHeight;
        
        // Rhythm-based pulsing
        const rhythmIndex = isPlaying ? Math.floor((Date.now() * 0.002) % analysisResult.rhythmPattern.length) : 0;
        const rhythmIntensity = analysisResult.rhythmPattern[rhythmIndex] || 1;
        const alpha = isPlaying ? 0.6 + 0.4 * rhythmIntensity * Math.sin(Date.now() * 0.01 + index) : 0.5;
        
        // Color based on image type
        let color = `rgba(139, 92, 246, ${alpha})`;
        if (analysisResult.imageType === 'solar') {
          color = `rgba(255, 150, 50, ${alpha})`;
        } else if (analysisResult.imageType === 'planetary') {
          color = `rgba(100, 150, 255, ${alpha})`;
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth - 2, barHeight);
        
        // Add harmonic overtones
        analysisResult.harmonicStructure.forEach((harmonic, hIndex) => {
          if (hIndex < 3) {
            const harmonicHeight = barHeight / (harmonic * 2);
            const harmonicY = y - harmonicHeight;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
            ctx.fillRect(x + hIndex, harmonicY, barWidth - 4, harmonicHeight);
          }
        });
      });

      // Draw celestial objects as enhanced particles
      const drawEnhancedParticles = (count: number, color: string, size: number, pattern: 'star' | 'circle' | 'cross') => {
        for (let i = 0; i < Math.min(count, 100); i++) {
          const x = (i * 137.5) % width; // Golden ratio distribution
          const y = (i * 73.3) % height;
          const pulse = isPlaying ? 1 + 0.4 * Math.sin(Date.now() * 0.005 + i * 0.1) : 1;
          
          ctx.fillStyle = color;
          
          switch (pattern) {
            case 'star':
              // Draw 4-pointed star
              ctx.save();
              ctx.translate(x, y);
              ctx.rotate(i * 0.1);
              ctx.beginPath();
              for (let j = 0; j < 8; j++) {
                const radius = (j % 2 === 0) ? size * pulse : size * pulse * 0.4;
                const angle = (j * Math.PI) / 4;
                const px = Math.cos(angle) * radius;
                const py = Math.sin(angle) * radius;
                if (j === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              }
              ctx.closePath();
              ctx.fill();
              ctx.restore();
              break;
              
            case 'cross':
              // Draw cross for solar features
              ctx.fillRect(x - size * pulse, y - size * pulse * 0.2, size * pulse * 2, size * pulse * 0.4);
              ctx.fillRect(x - size * pulse * 0.2, y - size * pulse, size * pulse * 0.4, size * pulse * 2);
              break;
              
            default:
              // Draw circle
              ctx.beginPath();
              ctx.arc(x, y, size * pulse, 0, Math.PI * 2);
              ctx.fill();
          }
        }
      };

      // Draw objects based on analysis
      drawEnhancedParticles(analysisResult.stars, 'rgba(255, 255, 255, 0.9)', 1, 'star');
      drawEnhancedParticles(analysisResult.nebulae, 'rgba(255, 100, 150, 0.7)', 4, 'circle');
      drawEnhancedParticles(analysisResult.galaxies, 'rgba(100, 150, 255, 0.8)', 3, 'circle');
      
      // Planetary/Solar objects
      if (analysisResult.planets > 0) {
        drawEnhancedParticles(analysisResult.planets, 'rgba(255, 200, 100, 0.9)', 8, 'circle');
      }
      if (analysisResult.moons > 0) {
        drawEnhancedParticles(analysisResult.moons, 'rgba(220, 220, 220, 0.8)', 4, 'circle');
      }
      if (analysisResult.sunspots > 0) {
        drawEnhancedParticles(analysisResult.sunspots, 'rgba(100, 50, 0, 0.8)', 3, 'circle');
      }
      if (analysisResult.solarFlares > 0) {
        drawEnhancedParticles(analysisResult.solarFlares, 'rgba(255, 100, 0, 0.9)', 6, 'cross');
      }

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

  const getImageTypeDisplay = () => {
    switch (analysisResult.imageType) {
      case 'solar': return t('Solar Imaging', '太阳成像');
      case 'planetary': return t('Planetary Imaging', '行星成像');
      case 'lunar': return t('Lunar Imaging', '月球成像');
      case 'mixed': return t('Mixed Objects', '混合天体');
      default: return t('Deep Sky', '深空');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {t('Audio Visualization', '音频可视化')}
        </h3>
        <span className="text-sm text-primary font-medium">
          {getImageTypeDisplay()}
        </span>
      </div>
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
        <p>{t('Enhanced visualization with planetary and solar object detection', '增强可视化包含行星和太阳天体检测')}</p>
        <div className="flex justify-center gap-3 flex-wrap">
          <span>⭐ {t('Stars', '恒星')}</span>
          <span>🌌 {t('Nebulae', '星云')}</span>
          <span>🌀 {t('Galaxies', '星系')}</span>
          {analysisResult.planets > 0 && <span>🪐 {t('Planets', '行星')}</span>}
          {analysisResult.moons > 0 && <span>🌙 {t('Moons', '卫星')}</span>}
          {analysisResult.sunspots > 0 && <span>🔴 {t('Sunspots', '太阳黑子')}</span>}
          {analysisResult.solarFlares > 0 && <span>☀️ {t('Solar Flares', '太阳耀斑')}</span>}
        </div>
      </div>
    </div>
  );
};

export default AudioVisualization;
