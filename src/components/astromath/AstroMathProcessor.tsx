import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, Download, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { MathematicalUniverse, AnalysisResult } from '@/lib/astromath/MathematicalUniverse';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

const AstroMathProcessor: React.FC = () => {
  const { t } = useLanguage();
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error(t('File too large. Maximum size is 50MB.', '文件过大。最大为50MB。'));
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('Please upload an image file.', '请上传图片文件。'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setImageUrl(event.target?.result as string);
        toast.success(t('Image loaded successfully!', '图片加载成功！'));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!image) {
      toast.error(t('Please upload an image first.', '请先上传图片。'));
      return;
    }

    setProcessing(true);
    toast.info(t('Analyzing cosmic mathematics...', '分析宇宙数学...'));

    try {
      const engine = new MathematicalUniverse();
      const analysisResult = await engine.analyzeImage(image);
      
      setResult(analysisResult);
      toast.success(t('Mathematical analysis complete!', '数学分析完成！'));
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(t('Analysis failed. Please try again.', '分析失败。请重试。'));
    } finally {
      setProcessing(false);
    }
  };

  const exportResults = () => {
    if (!result) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      accuracy: result.accuracy,
      equations: result.equations,
      structures: result.structures,
      insights: result.insights,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `astro-math-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(t('Results exported successfully!', '结果导出成功！'));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            {t('Astro Math', '天文数学')}
          </h1>
          <p className="text-lg text-cosmic-300 max-w-3xl mx-auto">
            {t(
              'Reverse-engineer mathematical equations from astrophotography. Discover the mathematical universe hidden in cosmic imagery.',
              '从天文摄影中逆向工程数学方程。发现隐藏在宇宙图像中的数学宇宙。'
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-cosmic-400">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {t('Fourier Analysis', '傅里叶分析')}
            </span>
            <span>•</span>
            <span>{t('Parametric Equations', '参数方程')}</span>
            <span>•</span>
            <span>{t('Fractal Dimension', '分形维度')}</span>
            <span>•</span>
            <span>{t('Celestial Mechanics', '天体力学')}</span>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="p-8 bg-gradient-to-br from-cosmic-900/50 to-cosmic-800/50 border-cosmic-700">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">
                {t('Upload Astrophoto', '上传天文照片')}
              </h2>
              <p className="text-cosmic-300">
                {t('Upload any astronomy image to extract its mathematical essence', '上传任何天文图像以提取其数学本质')}
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg text-white font-semibold flex items-center gap-2 transition-all">
                  <Upload className="h-5 w-5" />
                  {t('Select Image', '选择图片')}
                </div>
              </label>

              {imageUrl && (
                <div className="w-full max-w-2xl">
                  <img
                    src={imageUrl}
                    alt="Uploaded"
                    className="w-full rounded-lg border border-cosmic-700"
                  />
                </div>
              )}

              {image && !processing && (
                <Button
                  onClick={analyzeImage}
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {t('Analyze Mathematics', '分析数学')}
                </Button>
              )}

              {processing && (
                <div className="flex items-center gap-2 text-amber-400">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t('Analyzing cosmic mathematics...', '分析宇宙数学...')}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Results Section */}
        {result && (
          <Card className="p-8 bg-gradient-to-br from-cosmic-900/50 to-cosmic-800/50 border-cosmic-700">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {t('Mathematical Analysis', '数学分析')}
                  </h2>
                  <p className="text-cosmic-300">
                    {t('Accuracy:', '准确度：')} {(result.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
                <Button onClick={exportResults} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  {t('Export', '导出')}
                </Button>
              </div>

              <Tabs defaultValue="equations" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="equations">{t('Equations', '方程')}</TabsTrigger>
                  <TabsTrigger value="structures">{t('Structures', '结构')}</TabsTrigger>
                  <TabsTrigger value="insights">{t('Insights', '洞察')}</TabsTrigger>
                </TabsList>

                <TabsContent value="equations">
                  <ScrollArea className="h-[600px] w-full rounded-lg border border-cosmic-700 p-4">
                    <div className="space-y-4">
                      {result.equations.map((eq, idx) => (
                        <Card key={idx} className="p-4 bg-cosmic-800/30">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-amber-400 uppercase">
                                {eq.type}
                              </span>
                              <span className="text-xs text-cosmic-400">
                                {t('Accuracy:', '准确度：')} {(eq.accuracy * 100).toFixed(1)}%
                              </span>
                            </div>
                            <pre className="text-white font-mono text-sm whitespace-pre-wrap bg-cosmic-900/50 p-3 rounded">
                              {eq.equation}
                            </pre>
                            <p className="text-cosmic-300 text-sm">{eq.description}</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Object.entries(eq.parameters).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="text-xs bg-cosmic-700/50 px-2 py-1 rounded text-cosmic-200"
                                >
                                  {key}: {typeof value === 'number' ? value.toFixed(3) : value}
                                </span>
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="structures">
                  <ScrollArea className="h-[600px] w-full rounded-lg border border-cosmic-700 p-4">
                    <div className="space-y-4">
                      {result.structures.map((structure, idx) => (
                        <Card key={idx} className="p-4 bg-cosmic-800/30">
                          <div className="space-y-3">
                            <h3 className="text-lg font-bold text-white">{structure.name}</h3>
                            <div className="space-y-2">
                              <p className="text-sm text-cosmic-300">
                                {t('Coordinates:', '坐标：')} {structure.coordinates.length} {t('points', '点')}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {structure.characteristics.map((char, i) => (
                                  <span
                                    key={i}
                                    className="text-xs bg-blue-500/20 px-2 py-1 rounded text-blue-300"
                                  >
                                    {char}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="border-t border-cosmic-700 pt-2 mt-2">
                              <p className="text-xs text-cosmic-400">
                                {structure.equations.length} {t('associated equations', '相关方程')}
                              </p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="insights">
                  <ScrollArea className="h-[600px] w-full rounded-lg border border-cosmic-700 p-4">
                    <div className="space-y-3">
                      {result.insights.map((insight, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20"
                        >
                          <p className="text-white">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AstroMathProcessor;
