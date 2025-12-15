import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Cpu, Zap, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { detectGPUCapabilities, type GPUCapabilities } from '@/utils/gpuVideoEncoder';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GPUSettingsPanelProps {
  onSettingsChange?: (settings: GPUSettings) => void;
  compact?: boolean;
}

export interface GPUSettings {
  preferredGPU: 'default' | 'high-performance' | 'low-power';
  useHardwareAcceleration: boolean;
  targetQuality: 'preview' | '720p' | '1080p' | '4k';
}

const GPUSettingsPanel: React.FC<GPUSettingsPanelProps> = ({ onSettingsChange, compact = false }) => {
  const { language } = useLanguage();
  const t = (en: string, zh: string) => language === 'zh' ? zh : en;

  const [capabilities, setCapabilities] = useState<GPUCapabilities | null>(null);
  const [settings, setSettings] = useState<GPUSettings>({
    preferredGPU: 'high-performance',
    useHardwareAcceleration: true,
    targetQuality: '1080p'
  });

  useEffect(() => {
    const caps = detectGPUCapabilities();
    setCapabilities(caps);
    
    // Auto-detect best settings
    if (caps.hardwareAcceleration) {
      setSettings(prev => ({ ...prev, useHardwareAcceleration: true }));
    }
  }, []);

  useEffect(() => {
    onSettingsChange?.(settings);
  }, [settings, onSettingsChange]);

  const updateSetting = <K extends keyof GPUSettings>(key: K, value: GPUSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-cosmic-800/30 rounded-lg border border-cosmic-700/30">
        <Cpu className="w-4 h-4 text-cyan-400" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-cosmic-200">{t('GPU:', 'GPU:')}</span>
            <Badge variant="secondary" className="text-xs truncate max-w-[150px]">
              {capabilities?.preferredGPU || 'Detecting...'}
            </Badge>
            {capabilities?.hardwareAcceleration && (
              <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">
                <Zap className="w-3 h-3 mr-1" />
                {t('HW Accel', '硬件加速')}
              </Badge>
            )}
          </div>
        </div>
        <Select
          value={settings.targetQuality}
          onValueChange={(v) => updateSetting('targetQuality', v as GPUSettings['targetQuality'])}
        >
          <SelectTrigger className="w-[100px] h-8 bg-cosmic-800/50 border-cosmic-700/50 text-white text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-cosmic-800 border-cosmic-700">
            <SelectItem value="preview" className="text-white hover:bg-cosmic-700">480p</SelectItem>
            <SelectItem value="720p" className="text-white hover:bg-cosmic-700">720p</SelectItem>
            <SelectItem value="1080p" className="text-white hover:bg-cosmic-700">1080p</SelectItem>
            <SelectItem value="4k" className="text-white hover:bg-cosmic-700">4K</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <Card className="bg-cosmic-900/60 border-cosmic-700/50">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-5 h-5 text-cyan-400" />
          <h4 className="text-sm font-medium text-white">{t('GPU & Performance', 'GPU与性能')}</h4>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-cosmic-400" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  {t(
                    'Hardware acceleration uses your GPU for faster video encoding. Higher quality settings require more GPU memory.',
                    '硬件加速使用GPU进行更快的视频编码。更高的质量设置需要更多GPU内存。'
                  )}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* GPU Info */}
        <div className="p-3 bg-cosmic-800/40 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-cosmic-400">{t('Detected GPU', '检测到的GPU')}</span>
            <Badge variant="secondary" className="text-xs">
              {capabilities?.preferredGPU || t('Detecting...', '检测中...')}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-cosmic-400">{t('Renderer', '渲染器')}</span>
            <span className="text-xs text-cosmic-300 truncate max-w-[200px]">
              {capabilities?.renderer || '-'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-cosmic-400">{t('Max Texture', '最大纹理')}</span>
            <span className="text-xs text-cosmic-300">
              {capabilities?.maxTextureSize ? `${capabilities.maxTextureSize}px` : '-'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-cosmic-400">WebGL2</span>
            <Badge variant={capabilities?.webgl2 ? 'default' : 'destructive'} className="text-xs">
              {capabilities?.webgl2 ? t('Supported', '支持') : t('Not Supported', '不支持')}
            </Badge>
          </div>
        </div>

        {/* Hardware Acceleration Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <Label className="text-sm text-cosmic-200">
              {t('Hardware Acceleration', '硬件加速')}
            </Label>
          </div>
          <Switch
            checked={settings.useHardwareAcceleration}
            onCheckedChange={(checked) => updateSetting('useHardwareAcceleration', checked)}
            disabled={!capabilities?.hardwareAcceleration}
          />
        </div>

        {/* GPU Power Preference */}
        <div className="space-y-2">
          <Label className="text-xs text-cosmic-400">{t('GPU Power Mode', 'GPU功耗模式')}</Label>
          <Select
            value={settings.preferredGPU}
            onValueChange={(v) => updateSetting('preferredGPU', v as GPUSettings['preferredGPU'])}
          >
            <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700/50 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-cosmic-800 border-cosmic-700">
              <SelectItem value="high-performance" className="text-white hover:bg-cosmic-700">
                {t('High Performance (Dedicated GPU)', '高性能（独立GPU）')}
              </SelectItem>
              <SelectItem value="low-power" className="text-white hover:bg-cosmic-700">
                {t('Power Saving (Integrated GPU)', '省电（集成GPU）')}
              </SelectItem>
              <SelectItem value="default" className="text-white hover:bg-cosmic-700">
                {t('Let Browser Decide', '由浏览器决定')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Output Quality */}
        <div className="space-y-2">
          <Label className="text-xs text-cosmic-400">{t('Output Quality', '输出质量')}</Label>
          <Select
            value={settings.targetQuality}
            onValueChange={(v) => updateSetting('targetQuality', v as GPUSettings['targetQuality'])}
          >
            <SelectTrigger className="bg-cosmic-800/50 border-cosmic-700/50 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-cosmic-800 border-cosmic-700">
              <SelectItem value="preview" className="text-white hover:bg-cosmic-700">
                480p - {t('Fast Preview', '快速预览')}
              </SelectItem>
              <SelectItem value="720p" className="text-white hover:bg-cosmic-700">
                720p HD - {t('Balanced', '平衡')}
              </SelectItem>
              <SelectItem value="1080p" className="text-white hover:bg-cosmic-700">
                1080p Full HD - {t('Recommended', '推荐')}
              </SelectItem>
              <SelectItem value="4k" className="text-white hover:bg-cosmic-700">
                4K Ultra HD - {t('Maximum Quality', '最高质量')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default GPUSettingsPanel;
