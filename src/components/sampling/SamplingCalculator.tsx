
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cmosSensors, getSensorsByCategory, getSensorsByManufacturer } from '@/data/cmosSensors';
import { Calculator, Camera, Telescope, Target, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

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

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case 'Under-sampled': return <XCircle className="h-5 w-5 text-red-400" />;
      case 'Well-sampled': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'Over-sampled': return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      default: return <Info className="h-5 w-5" />;
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Under-sampled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'Well-sampled': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Over-sampled': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-cosmic-700/50 text-cosmic-300 border-cosmic-600/30';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-900 via-cosmic-800 to-cosmic-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30">
              <Calculator className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-cosmic-200 bg-clip-text text-transparent">
              {t('Sampling Calculator', '采样计算器')}
            </h1>
          </div>
          <p className="text-cosmic-300 max-w-3xl mx-auto text-lg leading-relaxed">
            {t(
              'Calculate pixel scale and sampling rates for your astronomy camera and telescope combination. Optimize your setup for the best image quality.',
              '计算您的天文相机和望远镜组合的像素比例和采样率。优化您的设置以获得最佳图像质量。'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Input Parameters - Takes 2/3 width on large screens */}
          <div className="xl:col-span-2">
            <Card className="cosmic-card border-cosmic-600/30 bg-cosmic-800/50 backdrop-blur-sm">
              <CardHeader className="border-b border-cosmic-700/30">
                <CardTitle className="flex items-center gap-3 text-2xl text-white">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Telescope className="h-6 w-6 text-primary" />
                  </div>
                  {t('Setup Parameters', '设置参数')}
                </CardTitle>
                <CardDescription className="text-cosmic-300 text-base">
                  {t('Configure your telescope and camera specifications', '配置您的望远镜和相机规格')}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Telescope Settings */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Telescope className="h-5 w-5 text-primary" />
                    {t('Telescope Configuration', '望远镜配置')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="focalLength" className="text-white font-medium">
                        {t('Focal Length (mm)', '焦距 (毫米)')}
                      </Label>
                      <Input
                        id="focalLength"
                        type="number"
                        value={focalLength}
                        onChange={(e) => setFocalLength(Number(e.target.value))}
                        placeholder={t('e.g., 1000', '例如：1000')}
                        className="cosmic-input bg-cosmic-700/50 border-cosmic-600/50 text-white placeholder:text-cosmic-400 h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seeing" className="text-white font-medium">
                        {t('Seeing (arcseconds)', '视宁度 (角秒)')}
                      </Label>
                      <Input
                        id="seeing"
                        type="number"
                        step="0.1"
                        value={seeing}
                        onChange={(e) => setSeeing(Number(e.target.value))}
                        placeholder={t('e.g., 2.0', '例如：2.0')}
                        className="cosmic-input bg-cosmic-700/50 border-cosmic-600/50 text-white placeholder:text-cosmic-400 h-12"
                      />
                    </div>
                  </div>
                </div>

                {/* Camera Settings */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Camera className="h-5 w-5 text-primary" />
                    {t('Camera Configuration', '相机配置')}
                  </h3>
                  
                  {/* Filters Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-white font-medium">{t('Category', '类别')}</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="cosmic-input bg-cosmic-700/50 border-cosmic-600/50 text-white h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-cosmic-800 border-cosmic-600/50">
                          <SelectItem value="All">{t('All Categories', '全部类别')}</SelectItem>
                          <SelectItem value="Planetary">{t('Planetary', '行星')}</SelectItem>
                          <SelectItem value="Deep Sky">{t('Deep Sky', '深空')}</SelectItem>
                          <SelectItem value="All-round">{t('All-round', '全能')}</SelectItem>
                          <SelectItem value="Guiding">{t('Guiding', '导星')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-white font-medium">{t('Manufacturer', '制造商')}</Label>
                      <Select value={manufacturer} onValueChange={setManufacturer}>
                        <SelectTrigger className="cosmic-input bg-cosmic-700/50 border-cosmic-600/50 text-white h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-cosmic-800 border-cosmic-600/50">
                          <SelectItem value="All">{t('All Brands', '全部品牌')}</SelectItem>
                          <SelectItem value="ZWO">ZWO</SelectItem>
                          <SelectItem value="QHY">QHY</SelectItem>
                          <SelectItem value="ToupTek">ToupTek</SelectItem>
                          <SelectItem value="SBIG">SBIG</SelectItem>
                          <SelectItem value="Moravian">Moravian</SelectItem>
                          <SelectItem value="Sony">Sony</SelectItem>
                          <SelectItem value="Canon">Canon</SelectItem>
                          <SelectItem value="Nikon">Nikon</SelectItem>
                          <SelectItem value="Omnivision">Omnivision</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Sensor Selection */}
                  <div className="space-y-2">
                    <Label className="text-white font-medium">{t('Camera/Sensor', '相机/传感器')}</Label>
                    <Select value={selectedSensor} onValueChange={setSelectedSensor}>
                      <SelectTrigger className="cosmic-input bg-cosmic-700/50 border-cosmic-600/50 text-white h-12">
                        <SelectValue placeholder={t('Select a camera or sensor', '选择相机或传感器')} />
                      </SelectTrigger>
                      <SelectContent className="bg-cosmic-800 border-cosmic-600/50 max-h-64">
                        {filteredSensors().map((sensor) => (
                          <SelectItem key={sensor.name} value={sensor.name}>
                            <div className="flex items-center justify-between w-full">
                              <span>{sensor.name}</span>
                              <div className="flex items-center gap-2 ml-4">
                                <Badge variant="outline" className="text-xs">
                                  {sensor.manufacturer}
                                </Badge>
                                <span className="text-xs text-cosmic-400">
                                  {sensor.pixelSize}μm
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Calculate Button */}
                  <Button 
                    onClick={calculateSampling} 
                    className="w-full h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg font-semibold"
                  >
                    <Calculator className="h-6 w-6 mr-3" />
                    {t('Calculate Sampling', '计算采样')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="xl:col-span-1">
            {result ? (
              <Card className="cosmic-card border-cosmic-600/30 bg-cosmic-800/50 backdrop-blur-sm sticky top-8">
                <CardHeader className="border-b border-cosmic-700/30">
                  <CardTitle className="flex items-center gap-3 text-xl text-white">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    {t('Results', '结果')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-cosmic-700/30 rounded-xl p-4 border border-cosmic-600/30">
                      <Label className="text-cosmic-300 text-sm font-medium">
                        {t('Pixel Scale', '像素比例')}
                      </Label>
                      <p className="text-2xl font-bold text-white font-mono mt-1">
                        {result.pixelScale.toFixed(2)}"
                      </p>
                      <p className="text-xs text-cosmic-400">{t('arcsec/pixel', '角秒/像素')}</p>
                    </div>
                    
                    <div className="bg-cosmic-700/30 rounded-xl p-4 border border-cosmic-600/30">
                      <Label className="text-cosmic-300 text-sm font-medium">
                        {t('Sampling Rate', '采样率')}
                      </Label>
                      <p className="text-2xl font-bold text-white font-mono mt-1">
                        {result.samplingRate.toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-cosmic-700/30 rounded-xl p-4 border border-cosmic-600/30">
                      <Label className="text-cosmic-300 text-sm font-medium">
                        {t('Field of View', '视场')}
                      </Label>
                      <div className="mt-1 space-y-1">
                        <p className="text-lg font-bold text-white font-mono">
                          {result.fieldOfView.width.toFixed(1)}' × {result.fieldOfView.height.toFixed(1)}'
                        </p>
                        <p className="text-xs text-cosmic-400">{t('arcminutes', '角分')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className={`rounded-xl p-4 border ${getRecommendationColor(result.recommendation)}`}>
                    <div className="flex items-center gap-3 mb-3">
                      {getRecommendationIcon(result.recommendation)}
                      <span className="font-semibold text-lg">
                        {t(result.recommendation, result.recommendation)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">
                      {result.explanation}
                    </p>
                  </div>

                  {/* Guidelines */}
                  <div className="bg-cosmic-700/20 rounded-xl p-4 border border-cosmic-600/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-white text-sm">
                        {t('Sampling Guidelines', '采样指南')}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs text-cosmic-300">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-3 w-3 text-red-400" />
                        <span>&lt; 0.5: {t('Under-sampled', '欠采样')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-green-400" />
                        <span>0.5 - 1.0: {t('Well-sampled (optimal)', '良好采样（最佳）')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3 w-3 text-yellow-400" />
                        <span>&gt; 1.0: {t('Over-sampled', '过度采样')}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="cosmic-card border-cosmic-600/30 bg-cosmic-800/50 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="text-cosmic-400 mb-4">
                    <Target className="h-12 w-12 mx-auto opacity-50" />
                  </div>
                  <p className="text-cosmic-300">
                    {t(
                      'Configure your setup parameters and select a camera to see sampling analysis',
                      '配置您的设置参数并选择相机以查看采样分析'
                    )}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sensor Information */}
        {selectedSensor && (
          <Card className="cosmic-card border-cosmic-600/30 bg-cosmic-800/50 backdrop-blur-sm mt-8">
            <CardHeader className="border-b border-cosmic-700/30">
              <CardTitle className="flex items-center gap-3 text-xl text-white">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Camera className="h-5 w-5 text-primary" />
                </div>
                {t('Camera/Sensor Details', '相机/传感器详情')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {(() => {
                const sensor = cmosSensors.find(s => s.name === selectedSensor);
                return sensor ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    <div className="space-y-2">
                      <Label className="text-cosmic-300 text-sm font-medium">{t('Model', '型号')}</Label>
                      <p className="text-white font-semibold">{sensor.name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-cosmic-300 text-sm font-medium">{t('Brand', '品牌')}</Label>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                        {sensor.manufacturer}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-cosmic-300 text-sm font-medium">{t('Pixel Size', '像素尺寸')}</Label>
                      <p className="text-white font-mono font-semibold">{sensor.pixelSize}μm</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-cosmic-300 text-sm font-medium">{t('Resolution', '分辨率')}</Label>
                      <p className="text-white font-mono">{sensor.resolution.width} × {sensor.resolution.height}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-cosmic-300 text-sm font-medium">{t('Type', '类型')}</Label>
                      <Badge variant={sensor.sensorType === 'Color' ? 'default' : 'secondary'}>
                        {sensor.sensorType}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-cosmic-300 text-sm font-medium">{t('Category', '类别')}</Label>
                      <Badge variant="outline" className="bg-cosmic-700/50 text-cosmic-200 border-cosmic-600/50">
                        {t(sensor.category, sensor.category)}
                      </Badge>
                    </div>
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SamplingCalculator;
