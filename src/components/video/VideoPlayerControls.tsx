import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface VideoPlayerControlsProps {
  isPlaying: boolean;
  progress: number; // 0-100
  duration: number; // in seconds
  onPlayPause: () => void;
  onReplay: () => void;
  disabled?: boolean;
  className?: string;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const VideoPlayerControls: React.FC<VideoPlayerControlsProps> = ({
  isPlaying,
  progress,
  duration,
  onPlayPause,
  onReplay,
  disabled = false,
  className = ''
}) => {
  const { t } = useLanguage();
  
  const currentTime = (progress / 100) * duration;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Play/Pause and Replay Buttons */}
      <div className="flex items-center justify-center gap-2">
        <Button
          onClick={onPlayPause}
          disabled={disabled}
          variant="outline"
          size="sm"
          className="bg-cosmic-800/50 border-cosmic-700/50 hover:bg-cosmic-700/50 disabled:opacity-50 transition-colors"
        >
          {isPlaying ? (
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
          disabled={disabled}
          variant="outline"
          size="sm"
          className="bg-cosmic-800/50 border-cosmic-700/50 hover:bg-cosmic-700/50 disabled:opacity-50 transition-colors"
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
          style={{ width: `${progress}%` }}
        />
        {/* Moving dot at current position */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-all duration-100"
          style={{ left: `calc(${progress}% - 0.375rem)` }}
        />
      </div>
      
      {/* Time display */}
      <div className="flex items-center justify-between text-xs text-cosmic-300">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default VideoPlayerControls;
