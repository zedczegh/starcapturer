import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SimpleAnimationControlsProps {
  settings: {
    type: string;
    speed: number;
    duration: number;
  };
  onSettingsChange: (settings: any) => void;
  isAnimating: boolean;
  isRecording: boolean;
  onToggleAnimation: () => void;
  onStartRecording: () => void;
  disabled: boolean;
}

const SimpleAnimationControls: React.FC<SimpleAnimationControlsProps> = ({
  settings,
  onSettingsChange,
  isAnimating,
  isRecording,
  onToggleAnimation,
  onStartRecording,
  disabled
}) => {
  const { t } = useLanguage();

  const updateSetting = (key: string, value: any) => {
    onSettingsChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card className="bg-cosmic-900/50 border-cosmic-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('Animation Settings', '动画设置')}
        </CardTitle>
        <CardDescription className="text-cosmic-400">
          {t('Simple controls for your 3D star field animation', '3D星场动画的简单控制')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Animation Type */}
        <div className="space-y-3">
          <Label className="text-cosmic-200">{t('Animation Type', '动画类型')}</Label>
          <Select
            value={settings.type}
            onValueChange={(value) => updateSetting('type', value)}
            disabled={disabled}
          >
            <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700/50 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-cosmic-800 border-cosmic-700">
              <SelectItem value="zoom_through" className="text-white hover:bg-cosmic-700">
                {t('Zoom Through Stars', '缩放穿越星体')}
              </SelectItem>
              <SelectItem value="parallax_drift" className="text-white hover:bg-cosmic-700">
                {t('Parallax Drift', '视差漂移')}
              </SelectItem>
              <SelectItem value="spiral_zoom" className="text-white hover:bg-cosmic-700">
                {t('Spiral Zoom', '螺旋缩放')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Animation Speed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-cosmic-200">{t('Speed', '速度')}</Label>
            <span className="text-cosmic-300 text-sm">{settings.speed.toFixed(1)}x</span>
          </div>
          <Slider
            value={[settings.speed]}
            onValueChange={(value) => updateSetting('speed', value[0])}
            min={0.5}
            max={3.0}
            step={0.1}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-cosmic-200">{t('Duration (seconds)', '持续时间（秒）')}</Label>
            <span className="text-cosmic-300 text-sm">{settings.duration}s</span>
          </div>
          <Slider
            value={[settings.duration]}
            onValueChange={(value) => updateSetting('duration', value[0])}
            min={10}
            max={60}
            step={5}
            disabled={disabled}
            className="w-full"
          />
        </div>

        {/* Control Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onToggleAnimation}
            disabled={disabled}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isAnimating ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                {t('Pause Preview', '暂停预览')}
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {t('Preview Animation', '预览动画')}
              </>
            )}
          </Button>

          <Button
            onClick={onStartRecording}
            disabled={isRecording || disabled}
            className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
          >
            {isRecording ? t('Generating Video...', '生成视频中...') : t('Generate Video', '生成视频')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleAnimationControls;