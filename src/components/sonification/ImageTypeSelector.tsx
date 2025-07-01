
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Sun, Moon, Globe, Telescope } from 'lucide-react';

type ImageType = 'deep-sky' | 'solar' | 'planetary' | 'lunar';

interface ImageTypeSelectorProps {
  selectedType: ImageType;
  onTypeSelect: (type: ImageType) => void;
}

const ImageTypeSelector: React.FC<ImageTypeSelectorProps> = ({
  selectedType,
  onTypeSelect
}) => {
  const { t } = useLanguage();

  const imageTypes = [
    {
      type: 'deep-sky' as const,
      icon: Telescope,
      title: t('Deep Sky', '深空'),
      description: t('Nebulae, galaxies, star clusters', '星云、星系、星团'),
      color: 'bg-purple-500/20 border-purple-500/40 hover:bg-purple-500/30'
    },
    {
      type: 'solar' as const,
      icon: Sun,
      title: t('Solar', '太阳'),
      description: t('Sun, sunspots, solar flares', '太阳、太阳黑子、太阳耀斑'),
      color: 'bg-yellow-500/20 border-yellow-500/40 hover:bg-yellow-500/30'
    },
    {
      type: 'planetary' as const,
      icon: Globe,
      title: t('Planetary', '行星'),
      description: t('Planets, moons, surface features', '行星、卫星、表面特征'),
      color: 'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30'
    },
    {
      type: 'lunar' as const,
      icon: Moon,
      title: t('Lunar', '月球'),
      description: t('Moon phases, craters, maria', '月相、陨石坑、月海'),
      color: 'bg-gray-500/20 border-gray-500/40 hover:bg-gray-500/30'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-cosmic-200 mb-2">
          {t('Select Image Type', '选择图像类型')}
        </h3>
        <p className="text-sm text-cosmic-400">
          {t('Choose the type of astronomy image for optimized analysis', '选择天文图像类型以进行优化分析')}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {imageTypes.map(({ type, icon: Icon, title, description, color }) => (
          <Card
            key={type}
            className={`p-4 cursor-pointer transition-all duration-200 border-2 ${
              selectedType === type 
                ? `${color} ring-2 ring-primary/50` 
                : 'bg-cosmic-900/20 border-cosmic-700/50 hover:border-cosmic-600/50'
            }`}
            onClick={() => onTypeSelect(type)}
          >
            <div className="flex items-center space-x-3">
              <Icon className={`h-6 w-6 ${
                selectedType === type ? 'text-primary' : 'text-cosmic-400'
              }`} />
              <div className="flex-1">
                <h4 className={`font-medium ${
                  selectedType === type ? 'text-primary' : 'text-cosmic-200'
                }`}>
                  {title}
                </h4>
                <p className="text-xs text-cosmic-400 mt-1">
                  {description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ImageTypeSelector;
