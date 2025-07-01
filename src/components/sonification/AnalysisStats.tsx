
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, Cloud, Circle, Palette, Contrast, Sun, Moon, Globe } from 'lucide-react';

interface AnalysisResult {
  stars: number;
  nebulae: number;
  galaxies: number;
  planets: number;
  moons: number;
  sunspots: number;
  solarFlares: number;
  brightness: number;
  contrast: number;
  saturation: number;
  imageType: 'deep-sky' | 'planetary' | 'solar' | 'lunar' | 'mixed';
  colorProfile: {
    red: number;
    green: number;
    blue: number;
  };
}

interface AnalysisStatsProps {
  analysisResult: AnalysisResult;
}

const AnalysisStats: React.FC<AnalysisStatsProps> = ({ analysisResult }) => {
  const { t } = useLanguage();

  const getImageTypeConfig = () => {
    switch (analysisResult.imageType) {
      case 'solar':
        return {
          icon: Sun,
          title: t('Solar Imaging', '太阳成像'),
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10'
        };
      case 'planetary':
        return {
          icon: Globe,
          title: t('Planetary Imaging', '行星成像'),
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10'
        };
      case 'lunar':
        return {
          icon: Moon,
          title: t('Lunar Imaging', '月球成像'),
          color: 'text-gray-300',
          bgColor: 'bg-gray-500/10'
        };
      default:
        return {
          icon: Star,
          title: t('Deep Sky', '深空'),
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/10'
        };
    }
  };

  const typeConfig = getImageTypeConfig();
  const TypeIcon = typeConfig.icon;

  // Only show stars for deep-sky images, disable for solar/lunar/planetary
  const celestialObjects = [
    ...(analysisResult.imageType === 'deep-sky' && analysisResult.stars > 0 ? [{ 
      icon: Star, 
      label: t('Stars', '恒星'), 
      value: analysisResult.stars, 
      color: 'text-white' 
    }] : []),
    ...(analysisResult.nebulae > 0 ? [{ 
      icon: Cloud, 
      label: t('Nebulae', '星云'), 
      value: analysisResult.nebulae, 
      color: 'text-pink-400' 
    }] : []),
    ...(analysisResult.galaxies > 0 ? [{ 
      icon: Circle, 
      label: t('Galaxies', '星系'), 
      value: analysisResult.galaxies, 
      color: 'text-blue-400' 
    }] : []),
    ...(analysisResult.planets > 0 ? [{ 
      icon: Globe, 
      label: t('Planets', '行星'), 
      value: analysisResult.planets, 
      color: 'text-orange-400' 
    }] : []),
    ...(analysisResult.moons > 0 ? [{ 
      icon: Moon, 
      label: t('Moons', '卫星'), 
      value: analysisResult.moons, 
      color: 'text-gray-300' 
    }] : []),
    ...(analysisResult.sunspots > 0 ? [{ 
      icon: Circle, 
      label: t('Sunspots', '太阳黑子'), 
      value: analysisResult.sunspots, 
      color: 'text-red-600' 
    }] : []),
    ...(analysisResult.solarFlares > 0 ? [{ 
      icon: Sun, 
      label: t('Solar Flares', '太阳耀斑'), 
      value: analysisResult.solarFlares, 
      color: 'text-yellow-300' 
    }] : [])
  ];

  const imageProperties = [
    { 
      icon: Sun, 
      label: t('Brightness', '亮度'), 
      value: Math.round(analysisResult.brightness * 100), 
      unit: '%',
      color: 'text-yellow-400' 
    },
    { 
      icon: Contrast, 
      label: t('Contrast', '对比度'), 
      value: Math.round(analysisResult.contrast * 100), 
      unit: '%',
      color: 'text-gray-300' 
    },
    { 
      icon: Palette, 
      label: t('Saturation', '饱和度'), 
      value: Math.round(analysisResult.saturation * 100), 
      unit: '%',
      color: 'text-purple-400' 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Image Type Header */}
      <Card className={`p-4 ${typeConfig.bgColor} border-cosmic-700/50`}>
        <div className="flex items-center justify-center gap-3">
          <TypeIcon className={`h-6 w-6 ${typeConfig.color}`} />
          <h3 className="text-lg font-semibold text-cosmic-200">
            {typeConfig.title}
          </h3>
          <Badge variant="outline" className="text-xs">
            {t('Analysis Complete', '分析完成')}
          </Badge>
        </div>
      </Card>

      {/* Celestial Objects */}
      {celestialObjects.length > 0 && (
        <Card className="p-4 bg-cosmic-900/30 border-cosmic-700/50">
          <h4 className="text-sm font-medium text-cosmic-300 mb-3 flex items-center gap-2">
            <Star className="h-4 w-4" />
            {t('Detected Objects', '检测到的天体')}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {celestialObjects.map(({ icon: Icon, label, value, color }, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-cosmic-800/30 rounded-lg">
                <Icon className={`h-4 w-4 ${color}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-cosmic-400 truncate">{label}</div>
                  <div className="font-semibold text-cosmic-200">{value.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Image Properties */}
      <Card className="p-4 bg-cosmic-900/30 border-cosmic-700/50">
        <h4 className="text-sm font-medium text-cosmic-300 mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4" />
          {t('Image Properties', '图像属性')}
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {imageProperties.map(({ icon: Icon, label, value, unit, color }, index) => (
            <div key={index} className="text-center p-3 bg-cosmic-800/30 rounded-lg">
              <Icon className={`h-5 w-5 ${color} mx-auto mb-2`} />
              <div className="text-lg font-bold text-cosmic-200">
                {value}{unit}
              </div>
              <div className="text-xs text-cosmic-400">{label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Color Profile */}
      <Card className="p-4 bg-cosmic-900/30 border-cosmic-700/50">
        <h4 className="text-sm font-medium text-cosmic-300 mb-3">
          {t('Color Profile', '色彩配置')}
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-sm text-cosmic-400 flex-1">{t('Red', '红色')}</span>
            <span className="text-sm font-medium text-cosmic-200">
              {Math.round(analysisResult.colorProfile.red * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-sm text-cosmic-400 flex-1">{t('Green', '绿色')}</span>
            <span className="text-sm font-medium text-cosmic-200">
              {Math.round(analysisResult.colorProfile.green * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-cosmic-400 flex-1">{t('Blue', '蓝色')}</span>
            <span className="text-sm font-medium text-cosmic-200">
              {Math.round(analysisResult.colorProfile.blue * 100)}%
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AnalysisStats;
