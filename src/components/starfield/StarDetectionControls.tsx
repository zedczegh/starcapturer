import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Eye, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StarDetectionControlsProps {
  settings: {
    threshold: number;
    minStarSize: number;
    maxStarSize: number;
    sigma: number;
    sensitivity: number;
  };
  onSettingsChange: (settings: any) => void;
  disabled: boolean;
}

const StarDetectionControls: React.FC<StarDetectionControlsProps> = ({
  settings,
  onSettingsChange,
  disabled
}) => {
  const { t } = useLanguage();

  const updateSetting = (key: string, value: number[]) => {
    onSettingsChange(prev => ({
      ...prev,
      [key]: value[0]
    }));
  };

  return (
    <Card className="bg-cosmic-900/50 border-cosmic-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Eye className="h-5 w-5" />
          {t('Star Detection', '星体检测')}
        </CardTitle>
        <CardDescription className="text-cosmic-400">
          {t('Configure star detection parameters', '配置星体检测参数')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Detection Threshold */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-cosmic-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t('Brightness Threshold', '亮度阈值')}
            </Label>
            <span className="text-cosmic-300 text-sm">{settings.threshold}</span>
          </div>
          <Slider
            value={[settings.threshold]}
            onValueChange={(value) => updateSetting('threshold', value)}
            min={10}
            max={200}
            step={5}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-cosmic-400">
            <span>10</span>
            <span>200</span>
          </div>
        </div>

        {/* Sensitivity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-cosmic-200">
              {t('Sensitivity', '灵敏度')}
            </Label>
            <span className="text-cosmic-300 text-sm">{settings.sensitivity.toFixed(1)}</span>
          </div>
          <Slider
            value={[settings.sensitivity]}
            onValueChange={(value) => updateSetting('sensitivity', value)}
            min={0.1}
            max={1.0}
            step={0.1}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-cosmic-400">
            <span>0.1</span>
            <span>1.0</span>
          </div>
        </div>

        {/* Min Star Size */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-cosmic-200">
              {t('Min Star Size', '最小星体大小')}
            </Label>
            <span className="text-cosmic-300 text-sm">{settings.minStarSize}px</span>
          </div>
          <Slider
            value={[settings.minStarSize]}
            onValueChange={(value) => updateSetting('minStarSize', value)}
            min={1}
            max={10}
            step={1}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-cosmic-400">
            <span>1px</span>
            <span>10px</span>
          </div>
        </div>

        {/* Max Star Size */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-cosmic-200">
              {t('Max Star Size', '最大星体大小')}
            </Label>
            <span className="text-cosmic-300 text-sm">{settings.maxStarSize}px</span>
          </div>
          <Slider
            value={[settings.maxStarSize]}
            onValueChange={(value) => updateSetting('maxStarSize', value)}
            min={5}
            max={50}
            step={1}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-cosmic-400">
            <span>5px</span>
            <span>50px</span>
          </div>
        </div>

        {/* Noise Reduction */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-cosmic-200">
              {t('Noise Reduction', '噪声抑制')}
            </Label>
            <span className="text-cosmic-300 text-sm">{settings.sigma.toFixed(1)}</span>
          </div>
          <Slider
            value={[settings.sigma]}
            onValueChange={(value) => updateSetting('sigma', value)}
            min={0.5}
            max={3.0}
            step={0.1}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-cosmic-400">
            <span>0.5</span>
            <span>3.0</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StarDetectionControls;