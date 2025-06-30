
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Play, Pause, Download, RefreshCw, Star, Palette, Music } from 'lucide-react';
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

interface SonificationControlsProps {
  isPlaying: boolean;
  onTogglePlayback: () => void;
  onDownload: () => void;
  onReset: () => void;
  sonificationData: SonificationData;
}

const SonificationControls: React.FC<SonificationControlsProps> = ({
  isPlaying,
  onTogglePlayback,
  onDownload,
  onReset,
  sonificationData
}) => {
  const { t } = useLanguage();

  return (
    <Card className="glassmorphism p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Playback Controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Music className="w-5 h-5 mr-2" />
            {t('Audio Controls', '音频控制')}
          </h3>
          
          <div className="flex space-x-3">
            <Button
              onClick={onTogglePlayback}
              className="bg-primary hover:bg-primary/90 flex-1"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 mr-2" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {isPlaying ? t('Pause', '暂停') : t('Play', '播放')}
            </Button>
            
            <Button
              onClick={onDownload}
              variant="outline"
              className="border-cosmic-600 hover:bg-cosmic-800"
            >
              <Download className="w-4 h-4 mr-2" />
              {t('Download', '下载')}
            </Button>
            
            <Button
              onClick={onReset}
              variant="outline"
              className="border-cosmic-600 hover:bg-cosmic-800"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Analysis Results */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Star className="w-5 h-5 mr-2" />
            {t('Analysis Results', '分析结果')}
          </h3>
          
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-cosmic-800/30 rounded-lg p-3 text-center"
            >
              <div className="text-2xl font-bold text-primary">
                {sonificationData.composition.stars}
              </div>
              <div className="text-xs text-cosmic-400">
                {t('Stars Detected', '检测到的恒星')}
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-cosmic-800/30 rounded-lg p-3 text-center"
            >
              <div className="text-2xl font-bold text-purple-400">
                {sonificationData.composition.nebulae}
              </div>
              <div className="text-xs text-cosmic-400">
                {t('Nebulae', '星云')}
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-cosmic-800/30 rounded-lg p-3 text-center"
            >
              <div className="text-2xl font-bold text-blue-400">
                {sonificationData.composition.galaxies}
              </div>
              <div className="text-xs text-cosmic-400">
                {t('Galaxies', '星系')}
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-cosmic-800/30 rounded-lg p-3 text-center"
            >
              <div className="text-2xl font-bold text-green-400">
                {sonificationData.starPositions.length}
              </div>
              <div className="text-xs text-cosmic-400">
                {t('Data Points', '数据点')}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SonificationControls;
