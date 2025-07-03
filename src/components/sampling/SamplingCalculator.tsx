
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cmosSensors, getSensorsByCategory, getSensorsByManufacturer } from '@/data/cmosSensors';
import { Calculator, Camera, Telescope, Target } from 'lucide-react';

interface SamplingResult {
  pixelScale: number;
  samplingRate: number;
  recommendation: 'Under-sampled' | 'Well-sampled' | 'Over-sampled';
  explanation: string;
  fieldOfView: {
    width: number;
    height: number;
  };
}

const SamplingCalculator: React.FC = () => {
  const { t } = useLanguage();
  const [focalLength, setFocalLength] = useState<number>(1000);
  const [selectedSensor, setSelectedSensor] = useState<string>('');
  const [seeing, setSeeing] = useState<number>(2.0);
  const [category, setCategory] = useState<string>('All');
  const [manufacturer, setManufacturer] = useState<string>('All');
  const [result, setResult] = useState<SamplingResult | null>(null);

  // Calculate sampling when parameters change
  useEffect(() => {
    if (focalLength && selectedSensor && seeing) {
      calculateSampling();
    }
  }, [focalLength, selectedSensor, seeing]);

  const calculateSampling = () => {
    const sensor = cmosSensors.find(s => s.name === selectedSensor);
    if (!sensor || !focalLength || !seeing) return;

    // Calculate pixel scale in arcseconds per pixel
    const pixelScale = (sensor.pixelSize * 206.265) / focalLength;
    
    // Calculate sampling rate (pixel scale / seeing)
    const samplingRate = pixelScale / seeing;
    
    // Calculate field of view in arcminutes
    const fovWidth = (sensor.resolution.width * pixelScale) / 60;
    const fovHeight = (sensor.resolution.height * pixelScale) / 60;
    
    // Determine recommendation based on Nyquist sampling theorem
    let recommendation: 'Under-sampled' | 'Well-sampled' | 'Over-sampled';
    let explanation: string;
    
    if (samplingRate < 0.5) {
      recommendation = 'Under-sampled';
      explanation = t(
        'Under-sampled: Each star disk is smaller than 2 pixels. Consider using a longer focal length or binning.',
        '欠采样：每个星点小于2个像素。建议使用更长焦距或合并像素。'
      );
    } else if (samplingRate <= 1.0) {
      recommendation = 'Well-sampled';
      explanation = t(
        'Well-sampled: Optimal sampling for your seeing conditions. Good balance of resolution and sensitivity.',
        '良好采样：在您的视宁度条件下的最佳采样。分辨率和灵敏度的良好平衡。'
      );
    } else {
      recommendation = 'Over-sampled';
      explanation = t(
        'Over-sampled: Using more pixels than necessary. Consider using a shorter focal length or binning for better sensitivity.',
        '过度采样：使用了不必要的像素。建议使用更短焦距或合并像素以获得更好的灵敏度。'
      );
    }

    setResult({
      pixelScale,
      samplingRate,
      recommendation,
      explanation,
      fieldOfView: {
        width: fovWidth,
        height: fovHeight
      }
    });
  };

  const filteredSensors = () => {
    let sensors = cmosSensors;
    if (category !== 'All') {
      sensors = getSensorsByCategory(category);
    }
    if (manufacturer !== 'All') {
      sensors = getSensorsByManufacturer(manufacturer);
    }
    return sensors;
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Under-sampled': return 'destructive';
      case 'Well-sampled': return 'default';
      case 'Over-sampled': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Calculator className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-white">
            {t('Sampling Calculator', '采样计算器')}
          </h1>
        </div>
        <p className="text-cosmic-300 max-w-2xl mx-auto">
          {t(
            'Calculate pixel scale and sampling rates for your astronomy camera and telescope combination',
            '计算您的天文相机和望远镜组合的像素比例和采样率'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Parameters */}
        <Card className="cosmic-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Telescope className="h-5 w-5" />
              {t('Setup Parameters', '设置参数')}
            </CardTitle>
            <CardDescription>
              {t('Enter your telescope and camera specifications', '输入您的望远镜和相机规格')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="focalLength">
                {t('Focal Length (mm)', '焦距 (毫米)')}
              </Label>
              <Input
                id="focalLength"
                type="number"
                value={focalLength}
                onChange={(e) => setFocalLength(Number(e.target.value))}
                placeholder={t('e.g., 1000', '例如：1000')}
                className="cosmic-input"
              />
            </div>

            <div>
              <Label htmlFor="seeing">
                {t('Seeing (arcseconds)', '视宁度 (角秒)')}
              </Label>
              <Input
                id="seeing"
                type="number"
                step="0.1"
                value={seeing}
                onChange={(e) => setSeeing(Number(e.target.value))}
                placeholder={t('e.g., 2.0', '例如：2.0')}
                className="cosmic-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>{t('Category', '类别')}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="cosmic-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t('All', '全部')}</SelectItem>
                    <SelectItem value="Planetary">{t('Planetary', '行星')}</SelectItem>
                    <SelectItem value="Deep Sky">{t('Deep Sky', '深空')}</SelectItem>
                    <SelectItem value="All-round">{t('All-round', '全能')}</SelectItem>
                    <SelectItem value="Guiding">{t('Guiding', '导星')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('Manufacturer', '制造商')}</Label>
                <Select value={manufacturer} onValueChange={setManufacturer}>
                  <SelectTrigger className="cosmic-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t('All', '全部')}</SelectItem>
                    <SelectItem value="Sony">Sony</SelectItem>
                    <SelectItem value="Canon">Canon</SelectItem>
                    <SelectItem value="Nikon">Nikon</SelectItem>
                    <SelectItem value="Omnivision">Omnivision</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>{t('CMOS Sensor', 'CMOS传感器')}</Label>
              <Select value={selectedSensor} onValueChange={setSelectedSensor}>
                <SelectTrigger className="cosmic-input">
                  <SelectValue placeholder={t('Select a sensor', '选择传感器')} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSensors().map((sensor) => (
                    <SelectItem key={sensor.name} value={sensor.name}>
                      {sensor.name} ({sensor.manufacturer}) - {sensor.pixelSize}μm
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={calculateSampling} className="w-full cosmic-button">
              <Calculator className="h-4 w-4 mr-2" />
              {t('Calculate Sampling', '计算采样')}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="cosmic-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t('Sampling Results', '采样结果')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-cosmic-300">
                    {t('Pixel Scale', '像素比例')}
                  </Label>
                  <p className="text-white font-mono">
                    {result.pixelScale.toFixed(2)} "/pixel
                  </p>
                </div>
                <div>
                  <Label className="text-cosmic-300">
                    {t('Sampling Rate', '采样率')}
                  </Label>
                  <p className="text-white font-mono">
                    {result.samplingRate.toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-cosmic-300">
                    {t('Field of View (W)', '视场宽度')}
                  </Label>
                  <p className="text-white font-mono">
                    {result.fieldOfView.width.toFixed(1)}'
                  </p>
                </div>
                <div>
                  <Label className="text-cosmic-300">
                    {t('Field of View (H)', '视场高度')}
                  </Label>
                  <p className="text-white font-mono">
                    {result.fieldOfView.height.toFixed(1)}'
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-cosmic-700">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getRecommendationColor(result.recommendation) as any}>
                    {result.recommendation}
                  </Badge>
                </div>
                <p className="text-sm text-cosmic-300">
                  {result.explanation}
                </p>
              </div>

              <div className="bg-cosmic-800/50 rounded-lg p-3 text-xs text-cosmic-300">
                <p className="font-semibold mb-1">
                  {t('Sampling Guidelines:', '采样指南：')}
                </p>
                <ul className="space-y-1">
                  <li>• &lt; 0.5: {t('Under-sampled', '欠采样')}</li>
                  <li>• 0.5 - 1.0: {t('Well-sampled (optimal)', '良好采样（最佳）')}</li>
                  <li>• &gt; 1.0: {t('Over-sampled', '过度采样')}</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sensor Information */}
      {selectedSensor && (
        <Card className="cosmic-card mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {t('Sensor Information', '传感器信息')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const sensor = cmosSensors.find(s => s.name === selectedSensor);
              return sensor ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <Label className="text-cosmic-300">{t('Name', '名称')}</Label>
                    <p className="text-white">{sensor.name}</p>
                  </div>
                  <div>
                    <Label className="text-cosmic-300">{t('Manufacturer', '制造商')}</Label>
                    <p className="text-white">{sensor.manufacturer}</p>
                  </div>
                  <div>
                    <Label className="text-cosmic-300">{t('Pixel Size', '像素尺寸')}</Label>
                    <p className="text-white">{sensor.pixelSize}μm</p>
                  </div>
                  <div>
                    <Label className="text-cosmic-300">{t('Resolution', '分辨率')}</Label>
                    <p className="text-white">{sensor.resolution.width} × {sensor.resolution.height}</p>
                  </div>
                  <div>
                    <Label className="text-cosmic-300">{t('Type', '类型')}</Label>
                    <p className="text-white">{sensor.sensorType}</p>
                  </div>
                  <div>
                    <Label className="text-cosmic-300">{t('Category', '类别')}</Label>
                    <p className="text-white">{sensor.category}</p>
                  </div>
                </div>
              ) : null;
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SamplingCalculator;
