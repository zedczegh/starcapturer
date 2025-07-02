
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calculator, Camera, Telescope, ArrowLeft, Info } from 'lucide-react';
import { cmosSensors, getSensorById, getAllBrands, getSensorsByBrand } from '@/data/cmosSensors';
import { toast } from 'sonner';

interface SamplingResults {
  pixelScale: number; // arcsec/pixel
  nyquistSampling: number; // arcsec
  criticalSampling: number; // arcsec
  samplingRatio: number;
  fovX: number; // degrees
  fovY: number; // degrees
  samplingQuality: 'Undersampled' | 'Critical' | 'Nyquist' | 'Oversampled';
  recommendation: string;
}

const SamplingCalculator: React.FC = () => {
  const { t } = useLanguage();
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedSensorId, setSelectedSensorId] = useState<string>('');
  const [focalLength, setFocalLength] = useState<string>('');
  const [seeing, setSeeing] = useState<string>('2');
  const [binning, setBinning] = useState<string>('1');
  const [customPixelSize, setCustomPixelSize] = useState<string>('');
  const [useCustomSensor, setUseCustomSensor] = useState(false);
  const [results, setResults] = useState<SamplingResults | null>(null);

  const brands = getAllBrands();
  const availableSensors = selectedBrand ? getSensorsByBrand(selectedBrand) : [];

  const calculateSampling = () => {
    if (!focalLength || parseFloat(focalLength) <= 0) {
      toast.error(t('Please enter a valid focal length', '请输入有效的焦距'));
      return;
    }

    let pixelSize: number;
    let sensorSizeX: number = 0;
    let sensorSizeY: number = 0;

    if (useCustomSensor) {
      if (!customPixelSize || parseFloat(customPixelSize) <= 0) {
        toast.error(t('Please enter a valid pixel size', '请输入有效的像素尺寸'));
        return;
      }
      pixelSize = parseFloat(customPixelSize);
    } else {
      if (!selectedSensorId) {
        toast.error(t('Please select a sensor', '请选择传感器'));
        return;
      }
      const sensor = getSensorById(selectedSensorId);
      if (!sensor) return;
      
      pixelSize = sensor.pixelSize;
      sensorSizeX = sensor.sensorSizeX;
      sensorSizeY = sensor.sensorSizeY;
    }

    const focalLengthMm = parseFloat(focalLength);
    const seeingArcsec = parseFloat(seeing);
    const binningFactor = parseFloat(binning);
    const effectivePixelSize = pixelSize * binningFactor;

    // Calculate pixel scale in arcsec/pixel
    const pixelScale = (effectivePixelSize / focalLengthMm) * 206.265;

    // Calculate sampling metrics
    const nyquistSampling = seeingArcsec / 2;
    const criticalSampling = seeingArcsec;
    const samplingRatio = pixelScale / nyquistSampling;

    // Calculate field of view
    let fovX = 0;
    let fovY = 0;
    if (sensorSizeX > 0 && sensorSizeY > 0) {
      fovX = (sensorSizeX / focalLengthMm) * 57.2958; // degrees
      fovY = (sensorSizeY / focalLengthMm) * 57.2958; // degrees
    }

    // Determine sampling quality
    let samplingQuality: SamplingResults['samplingQuality'];
    let recommendation: string;

    if (samplingRatio < 0.5) {
      samplingQuality = 'Undersampled';
      recommendation = t('Undersampled - Consider using shorter focal length or larger pixels', '欠采样 - 考虑使用较短焦距或较大像素');
    } else if (samplingRatio <= 1) {
      samplingQuality = 'Critical';
      recommendation = t('Critical sampling - Good balance for most applications', '临界采样 - 大多数应用的良好平衡');
    } else if (samplingRatio <= 2) {
      samplingQuality = 'Nyquist';
      recommendation = t('Nyquist sampling - Optimal for capturing stellar detail', 'Nyquist采样 - 捕获星点细节的最佳选择');
    } else {
      samplingQuality = 'Oversampled';
      recommendation = t('Oversampled - May benefit from binning or longer focal length', '过采样 - 可能受益于合并像素或更长焦距');
    }

    const calculationResults: SamplingResults = {
      pixelScale,
      nyquistSampling,
      criticalSampling,
      samplingRatio,
      fovX,
      fovY,
      samplingQuality,
      recommendation
    };

    setResults(calculationResults);
    
    toast.success(t('Sampling calculation completed', '采样计算完成'));
  };

  const getSamplingQualityColor = (quality: string) => {
    switch (quality) {
      case 'Undersampled': return 'text-red-400';
      case 'Critical': return 'text-yellow-400';
      case 'Nyquist': return 'text-green-400';
      case 'Oversampled': return 'text-blue-400';
      default: return 'text-cosmic-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Calculator className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary">
            {t('Sampling Calculator', '采样计算器')}
          </h1>
        </div>
        <p className="text-cosmic-400 max-w-2xl mx-auto">
          {t('Calculate pixel scale and sampling quality for your astronomy camera and telescope setup', 
             '计算您的天文相机和望远镜设置的像素比例和采样质量')}
        </p>
      </div>

      <Card className="p-6 bg-cosmic-900/40 backdrop-blur-md border-cosmic-700/50">
        <div className="space-y-6">
          {/* Telescope Settings */}
          <div>
            <h3 className="text-lg font-semibold text-cosmic-200 mb-3 flex items-center gap-2">
              <Telescope className="h-5 w-5 text-primary" />
              {t('Telescope Settings', '望远镜设置')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="focalLength" className="text-cosmic-300">
                  {t('Focal Length (mm)', '焦距 (毫米)')}
                </Label>
                <Input
                  id="focalLength"
                  type="number"
                  value={focalLength}
                  onChange={(e) => setFocalLength(e.target.value)}
                  placeholder="1000"
                  className="bg-cosmic-800/50 border-cosmic-600 text-cosmic-200"
                />
              </div>
              <div>
                <Label htmlFor="seeing" className="text-cosmic-300">
                  {t('Seeing (arcsec)', '视宁度 (角秒)')}
                </Label>
                <Input
                  id="seeing"
                  type="number"
                  step="0.1"
                  value={seeing}
                  onChange={(e) => setSeeing(e.target.value)}
                  placeholder="2.0"
                  className="bg-cosmic-800/50 border-cosmic-600 text-cosmic-200"
                />
              </div>
            </div>
          </div>

          <Separator className="bg-cosmic-700/50" />

          {/* Camera Settings */}
          <div>
            <h3 className="text-lg font-semibold text-cosmic-200 mb-3 flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              {t('Camera Settings', '相机设置')}
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-cosmic-300">
                  <input
                    type="radio"
                    checked={!useCustomSensor}
                    onChange={() => setUseCustomSensor(false)}
                    className="text-primary"
                  />
                  {t('Select from database', '从数据库选择')}
                </label>
                <label className="flex items-center gap-2 text-cosmic-300">
                  <input
                    type="radio"
                    checked={useCustomSensor}
                    onChange={() => setUseCustomSensor(true)}
                    className="text-primary"
                  />
                  {t('Custom sensor', '自定义传感器')}
                </label>
              </div>

              {!useCustomSensor ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand" className="text-cosmic-300">
                      {t('Brand', '品牌')}
                    </Label>
                    <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                      <SelectTrigger className="bg-cosmic-800/50 border-cosmic-600 text-cosmic-200">
                        <SelectValue placeholder={t('Select brand', '选择品牌')} />
                      </SelectTrigger>
                      <SelectContent className="bg-cosmic-800 border-cosmic-600">
                        {brands.map((brand) => (
                          <SelectItem key={brand} value={brand} className="text-cosmic-200">
                            {brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sensor" className="text-cosmic-300">
                      {t('Sensor Model', '传感器型号')}
                    </Label>
                    <Select 
                      value={selectedSensorId} 
                      onValueChange={setSelectedSensorId}
                      disabled={!selectedBrand}
                    >
                      <SelectTrigger className="bg-cosmic-800/50 border-cosmic-600 text-cosmic-200">
                        <SelectValue placeholder={t('Select sensor', '选择传感器')} />
                      </SelectTrigger>
                      <SelectContent className="bg-cosmic-800 border-cosmic-600">
                        {availableSensors.map((sensor) => (
                          <SelectItem key={sensor.id} value={sensor.id} className="text-cosmic-200">
                            {sensor.model} ({sensor.pixelSize}μm)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="customPixelSize" className="text-cosmic-300">
                    {t('Pixel Size (μm)', '像素尺寸 (微米)')}
                  </Label>
                  <Input
                    id="customPixelSize"
                    type="number"
                    step="0.01"
                    value={customPixelSize}
                    onChange={(e) => setCustomPixelSize(e.target.value)}
                    placeholder="3.76"
                    className="bg-cosmic-800/50 border-cosmic-600 text-cosmic-200"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="binning" className="text-cosmic-300">
                  {t('Binning', '像素合并')}
                </Label>
                <Select value={binning} onValueChange={setBinning}>
                  <SelectTrigger className="bg-cosmic-800/50 border-cosmic-600 text-cosmic-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-800 border-cosmic-600">
                    <SelectItem value="1" className="text-cosmic-200">1x1</SelectItem>
                    <SelectItem value="2" className="text-cosmic-200">2x2</SelectItem>
                    <SelectItem value="3" className="text-cosmic-200">3x3</SelectItem>
                    <SelectItem value="4" className="text-cosmic-200">4x4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={calculateSampling}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              <Calculator className="h-5 w-5" />
              {t('Calculate Sampling', '计算采样')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Results */}
      {results && (
        <Card className="p-6 bg-cosmic-900/40 backdrop-blur-md border-cosmic-700/50">
          <h3 className="text-xl font-semibold text-cosmic-200 mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            {t('Sampling Results', '采样结果')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-cosmic-400 text-sm">{t('Pixel Scale', '像素比例')}</p>
              <p className="text-2xl font-bold text-primary">
                {results.pixelScale.toFixed(2)} "/px
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-cosmic-400 text-sm">{t('Sampling Quality', '采样质量')}</p>
              <p className={`text-xl font-semibold ${getSamplingQualityColor(results.samplingQuality)}`}>
                {results.samplingQuality}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-cosmic-400 text-sm">{t('Sampling Ratio', '采样比率')}</p>
              <p className="text-xl font-semibold text-cosmic-200">
                {results.samplingRatio.toFixed(2)}
              </p>
            </div>
          </div>

          <Separator className="bg-cosmic-700/50 my-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-cosmic-200">{t('Sampling Details', '采样详情')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-cosmic-400">{t('Nyquist Sampling:', 'Nyquist采样:')}</span>
                  <span className="text-cosmic-200">{results.nyquistSampling.toFixed(2)} "/px</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cosmic-400">{t('Critical Sampling:', '临界采样:')}</span>
                  <span className="text-cosmic-200">{results.criticalSampling.toFixed(2)} "/px</span>
                </div>
              </div>
            </div>

            {results.fovX > 0 && results.fovY > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-cosmic-200">{t('Field of View', '视野')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-cosmic-400">{t('Horizontal:', '水平:')}</span>
                    <span className="text-cosmic-200">
                      {results.fovX >= 1 ? `${results.fovX.toFixed(2)}°` : `${(results.fovX * 60).toFixed(1)}'`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cosmic-400">{t('Vertical:', '垂直:')}</span>
                    <span className="text-cosmic-200">
                      {results.fovY >= 1 ? `${results.fovY.toFixed(2)}°` : `${(results.fovY * 60).toFixed(1)}'`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-cosmic-800/30 rounded-lg">
            <p className="text-sm text-cosmic-300">
              <strong className="text-primary">{t('Recommendation:', '建议:')}</strong> {results.recommendation}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SamplingCalculator;
