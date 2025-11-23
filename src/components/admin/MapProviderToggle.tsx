import React from 'react';
import { useMapProvider } from '@/contexts/MapProviderContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { Map, Globe } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MapProviderToggle: React.FC = () => {
  const { provider, setProvider, isAMapReady } = useMapProvider();
  const { t } = useLanguage();

  const handleToggle = (checked: boolean) => {
    setProvider(checked ? 'amap' : 'leaflet');
  };

  return (
    <Card className="bg-cosmic-900/50 border-cosmic-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cosmic-50">
          <Globe className="h-5 w-5" />
          {t('Map Provider Settings', '地图提供商设置')}
        </CardTitle>
        <CardDescription className="text-cosmic-300">
          {t('Switch between Leaflet (OpenStreetMap) and AMap for map rendering', '在Leaflet (OpenStreetMap) 和高德地图之间切换')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Map className="h-4 w-4 text-cosmic-400" />
            <Label htmlFor="map-provider" className="text-cosmic-200">
              {provider === 'leaflet' 
                ? t('Currently: OpenStreetMap (Leaflet)', '当前: OpenStreetMap (Leaflet)')
                : t('Currently: AMap (高德地图)', '当前: 高德地图')
              }
            </Label>
          </div>
          <Switch
            id="map-provider"
            checked={provider === 'amap'}
            onCheckedChange={handleToggle}
          />
        </div>

        <Alert className="bg-cosmic-800/50 border-cosmic-600">
          <AlertDescription className="text-xs text-cosmic-300">
            {provider === 'amap' && !isAMapReady && (
              <span className="text-yellow-400">
                {t('⚠️ AMap is loading... Maps will display once ready.', '⚠️ 高德地图加载中...准备就绪后显示地图。')}
              </span>
            )}
            {provider === 'amap' && isAMapReady && (
              <span className="text-green-400">
                {t('✓ AMap loaded successfully', '✓ 高德地图加载成功')}
              </span>
            )}
            {provider === 'leaflet' && (
              <span>
                {t('Using Leaflet with OpenStreetMap tiles', '使用Leaflet与OpenStreetMap瓦片')}
              </span>
            )}
          </AlertDescription>
        </Alert>

        <div className="text-xs text-cosmic-400 space-y-1 pt-2">
          <p>{t('• Leaflet: Global maps with OpenStreetMap data', '• Leaflet: 使用OpenStreetMap数据的全球地图')}</p>
          <p>{t('• AMap: Optimized for China with detailed local data', '• 高德地图: 为中国优化，包含详细本地数据')}</p>
          <p className="text-amber-400">{t('⚠️ Switching providers will refresh all map components', '⚠️ 切换提供商将刷新所有地图组件')}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default MapProviderToggle;
