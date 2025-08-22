import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Settings, Zap, RotateCw, Move } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AnimationControlsProps {
  settings: {
    speed: number;
    direction: string;
    movement: string;
    duration: number;
    fieldOfView: number;
  };
  onSettingsChange: (settings: any) => void;
  isAnimating: boolean;
  isRecording: boolean;
  onToggleAnimation: () => void;
  onStartRecording: () => void;
  disabled: boolean;
}

const AnimationControls: React.FC<AnimationControlsProps> = ({
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

  const updateSliderSetting = (key: string, value: number[]) => {
    updateSetting(key, value[0]);
  };

  return (
    <Card className="bg-cosmic-900/50 border-cosmic-700/50">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('Animation Controls', '动画控制')}
        </CardTitle>
        <CardDescription className="text-cosmic-400">
          {t('Configure animation parameters', '配置动画参数')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Animation Toggle */}
        <Button
          onClick={onToggleAnimation}
          disabled={disabled}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          {isAnimating ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              {t('Pause Animation', '暂停动画')}
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {t('Play Animation', '播放动画')}
            </>
          )}
        </Button>

        {/* Movement Type */}
        <div className="space-y-3">
          <Label className="text-cosmic-200 flex items-center gap-2">
            <Move className="h-4 w-4" />
            {t('Movement Type', '运动类型')}
          </Label>
          <Select
            value={settings.movement}
            onValueChange={(value) => updateSetting('movement', value)}
            disabled={disabled}
          >
            <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700/50 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-cosmic-800 border-cosmic-700">
              <SelectItem value="zoom" className="text-white hover:bg-cosmic-700">
                {t('Zoom Through', '缩放穿越')}
              </SelectItem>
              <SelectItem value="orbit" className="text-white hover:bg-cosmic-700">
                {t('Orbital Rotation', '轨道旋转')}
              </SelectItem>
              <SelectItem value="drift" className="text-white hover:bg-cosmic-700">
                {t('Gentle Drift', '轻柔漂移')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Direction */}
        <div className="space-y-3">
          <Label className="text-cosmic-200 flex items-center gap-2">
            <RotateCw className="h-4 w-4" />
            {t('Direction', '方向')}
          </Label>
          <Select
            value={settings.direction}
            onValueChange={(value) => updateSetting('direction', value)}
            disabled={disabled}
          >
            <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700/50 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-cosmic-800 border-cosmic-700">
              <SelectItem value="forward" className="text-white hover:bg-cosmic-700">
                {t('Forward', '向前')}
              </SelectItem>
              <SelectItem value="backward" className="text-white hover:bg-cosmic-700">
                {t('Backward', '向后')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Animation Speed */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-cosmic-200 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t('Speed', '速度')}
            </Label>
            <span className="text-cosmic-300 text-sm">{settings.speed.toFixed(1)}x</span>
          </div>
          <Slider
            value={[settings.speed]}
            onValueChange={(value) => updateSliderSetting('speed', value)}
            min={0.1}
            max={5}
            step={0.1}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-cosmic-400">
            <span>0.1x</span>
            <span>5.0x</span>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-cosmic-200">
              {t('Duration (seconds)', '持续时间（秒）')}
            </Label>
            <span className="text-cosmic-300 text-sm">{settings.duration}s</span>
          </div>
          <Slider
            value={[settings.duration]}
            onValueChange={(value) => updateSliderSetting('duration', value)}
            min={5}
            max={60}
            step={1}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-cosmic-400">
            <span>5s</span>
            <span>60s</span>
          </div>
        </div>

        {/* Field of View */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-cosmic-200">
              {t('Field of View', '视野')}
            </Label>
            <span className="text-cosmic-300 text-sm">{settings.fieldOfView}°</span>
          </div>
          <Slider
            value={[settings.fieldOfView]}
            onValueChange={(value) => updateSliderSetting('fieldOfView', value)}
            min={30}
            max={120}
            step={5}
            disabled={disabled}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-cosmic-400">
            <span>30°</span>
            <span>120°</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnimationControls;