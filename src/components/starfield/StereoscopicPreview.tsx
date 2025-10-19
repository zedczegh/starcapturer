import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { processFrameToStereoscopic } from '@/utils/stereoscopicVideoUtils';
import { TraditionalMorphParams } from '@/lib/traditionalMorphMode';

interface StereoscopicPreviewProps {
  sourceCanvas: HTMLCanvasElement | null;
  starsOnlyImage: string | null;
  starlessImage: string | null;
  isAnimating: boolean;
  animationProgress: number;
  duration: number;
  traditionalParams: TraditionalMorphParams;
  stereoSpacing: number;
  borderSize: number;
  onToggleAnimation: () => void;
  onReplay: () => void;
  language: 'en' | 'zh';
}

const StereoscopicPreview: React.FC<StereoscopicPreviewProps> = ({
  sourceCanvas,
  starsOnlyImage,
  starlessImage,
  isAnimating,
  animationProgress,
  duration,
  traditionalParams,
  stereoSpacing,
  borderSize,
  onToggleAnimation,
  onReplay,
  language
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);
  
  const t = (en: string, zh: string) => language === 'en' ? en : zh;

  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Process and render stereoscopic frame
  const renderStereoscopicFrame = useCallback(async () => {
    if (!sourceCanvas || !canvasRef.current || !starsOnlyImage || !starlessImage || isProcessing) {
      return;
    }

    // Throttle updates to 30fps max
    const now = performance.now();
    if (now - lastUpdateTimeRef.current < 33) {
      return;
    }
    lastUpdateTimeRef.current = now;

    setIsProcessing(true);
    
    try {
      const stereoCanvas = await processFrameToStereoscopic(
        sourceCanvas,
        starsOnlyImage,
        starlessImage,
        traditionalParams,
        stereoSpacing,
        borderSize
      );

      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Update canvas dimensions if needed
        if (canvasRef.current.width !== stereoCanvas.width || canvasRef.current.height !== stereoCanvas.height) {
          canvasRef.current.width = stereoCanvas.width;
          canvasRef.current.height = stereoCanvas.height;
        }
        
        ctx.clearRect(0, 0, stereoCanvas.width, stereoCanvas.height);
        ctx.drawImage(stereoCanvas, 0, 0);
      }
    } catch (error) {
      console.error('Stereoscopic preview render error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [sourceCanvas, starsOnlyImage, starlessImage, traditionalParams, stereoSpacing, borderSize, isProcessing]);

  // Update stereoscopic preview when animation progresses
  useEffect(() => {
    if (!isAnimating || !sourceCanvas) return;

    const updateLoop = () => {
      renderStereoscopicFrame();
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    updateLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, sourceCanvas, renderStereoscopicFrame]);

  // Initial render when settings change
  useEffect(() => {
    if (!isAnimating && sourceCanvas) {
      renderStereoscopicFrame();
    }
  }, [traditionalParams, stereoSpacing, borderSize, sourceCanvas, isAnimating, renderStereoscopicFrame]);

  return (
    <Card className="bg-cosmic-900/50 border-cosmic-700/50 h-[600px]">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12h3m-3 0a3 3 0 11-6 0" />
          </svg>
          {t('Stereoscopic 3D Preview', '立体3D预览')}
        </CardTitle>
        <CardDescription className="text-cosmic-400">
          {t('Side-by-side stereoscopic view with depth processing', '具有深度处理的并排立体视图')}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[500px] p-0">
        <div className="space-y-2 h-full flex flex-col">
          {/* Canvas Container */}
          <div className="flex-1 flex items-center justify-center bg-black overflow-hidden">
            <canvas 
              ref={canvasRef}
              className="max-w-full max-h-full object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
          
          {/* Progress Bar and Controls */}
          <div className="space-y-2 px-4 pb-3">
            {/* Play/Pause and Replay Buttons */}
            <div className="flex items-center justify-center gap-2">
              <Button
                onClick={onToggleAnimation}
                variant="outline"
                size="sm"
                className="bg-cosmic-800/50 border-cosmic-700/50 hover:bg-cosmic-700/50"
              >
                {isAnimating ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    {t('Pause', '暂停')}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    {t('Play', '播放')}
                  </>
                )}
              </Button>
              
              <Button
                onClick={onReplay}
                disabled={isAnimating && animationProgress < 10}
                variant="outline"
                size="sm"
                className="bg-cosmic-800/50 border-cosmic-700/50 hover:bg-cosmic-700/50 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {t('Replay', '重播')}
              </Button>
            </div>
            
            {/* Progress bar with moving slider dot - YouTube style */}
            <div className="relative w-full h-1 bg-cosmic-800/50 rounded-full overflow-visible">
              {/* Played portion (white) */}
              <div 
                className="absolute left-0 top-0 h-full bg-white/80 transition-all duration-100 rounded-full"
                style={{ width: `${animationProgress}%` }}
              />
              {/* Moving dot at current position */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-all duration-100"
                style={{ left: `calc(${animationProgress}% - 0.375rem)` }}
              />
            </div>
            
            {/* Time display only */}
            <div className="flex items-center justify-between text-xs text-cosmic-300">
              <span>{formatTime((animationProgress / 100) * duration)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StereoscopicPreview;
