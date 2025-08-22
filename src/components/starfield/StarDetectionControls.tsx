import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Eye, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StarDetectionControlsProps {
  settings: {
    starCount: number;
    brightness: number;
    depth: number;
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
        {/* Star Count */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-cosmic-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {t('Star Count', '星体数量')}
            </Label>
            <span className="text-cosmic-300 text-sm">{settings.starCount}</span>
          </div>
          <Slider
            value={[settings.starCount]}
            onValueChange={(value) => updateSetting('starCount', value)}
            min={100}
            max={5000}
            step={100}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-cosmic-400">
            <span>100</span>
            <span>5000</span>
          </div>
        </div>

        {/* Star Brightness */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-cosmic-200">
              {t('Brightness', '亮度')}
            </Label>
            <span className="text-cosmic-300 text-sm">{settings.brightness.toFixed(1)}</span>
          </div>
          <Slider
            value={[settings.brightness]}
            onValueChange={(value) => updateSetting('brightness', value)}
            min={0.1}
            max={3}
            step={0.1}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-cosmic-400">
            <span>0.1</span>
            <span>3.0</span>
          </div>
        </div>

        {/* Field Depth */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-cosmic-200">
              {t('Field Depth', '场深度')}
            </Label>
            <span className="text-cosmic-300 text-sm">{settings.depth}</span>
          </div>
          <Slider
            value={[settings.depth]}
            onValueChange={(value) => updateSetting('depth', value)}
            min={50}
            max={500}
            step={10}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-cosmic-400">
            <span>50</span>
            <span>500</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StarDetectionControls;