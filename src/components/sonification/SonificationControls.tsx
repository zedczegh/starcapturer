
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, RotateCcw } from 'lucide-react';

interface SonificationControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onStop: () => void;
  onDownload: () => void;
  onReset: () => void;
  hasAudio: boolean;
}

const SonificationControls: React.FC<SonificationControlsProps> = ({
  isPlaying,
  onPlay,
  onStop,
  onDownload,
  onReset,
  hasAudio
}) => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      <Button
        onClick={isPlaying ? onStop : onPlay}
        disabled={!hasAudio}
        className="flex items-center gap-2 bg-primary hover:bg-primary/80"
      >
        {isPlaying ? (
          <>
            <Pause className="h-4 w-4" />
            {t('Pause', '暂停')}
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            {t('Play', '播放')}
          </>
        )}
      </Button>

      <Button
        onClick={onDownload}
        disabled={!hasAudio}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        {t('Download', '下载')}
      </Button>

      <Button
        onClick={onReset}
        variant="outline"
        className="flex items-center gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        {t('Reset', '重置')}
      </Button>
    </div>
  );
};

export default SonificationControls;
