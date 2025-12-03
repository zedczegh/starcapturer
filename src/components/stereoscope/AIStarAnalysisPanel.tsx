import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Star, Telescope, Layers, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { analyzeStarsWithAI, StarAnalysisResult, getRecommendedParams } from '@/services/aiStarAnalysis';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AIStarAnalysisPanelProps {
  imageDataUrl: string | null;
  onApplyRecommendations?: (params: {
    maxShift: number;
    objectType: 'nebula' | 'galaxy' | 'planetary' | 'mixed';
    starDisplacement?: number;
    nebulaDisplacement?: number;
  }) => void;
}

const AIStarAnalysisPanel: React.FC<AIStarAnalysisPanelProps> = ({
  imageDataUrl,
  onApplyRecommendations
}) => {
  const { t } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<StarAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!imageDataUrl) {
      toast.error(t('Please upload an image first', '请先上传图像'));
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await analyzeStarsWithAI(imageDataUrl, 'star-analysis');
      if (result && 'summary' in result) {
        setAnalysis(result as StarAnalysisResult);
        toast.success(t('AI analysis complete!', 'AI分析完成！'));
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      if (error?.message?.includes('429') || error?.status === 429) {
        toast.error(t('Rate limit exceeded. Please try again later.', '请求过于频繁，请稍后再试。'));
      } else if (error?.message?.includes('402') || error?.status === 402) {
        toast.error(t('AI credits depleted. Please add credits.', 'AI积分已用完，请充值。'));
      } else {
        toast.error(t('Analysis failed. Please try again.', '分析失败，请重试。'));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyRecommendations = () => {
    if (analysis && onApplyRecommendations) {
      const params = getRecommendedParams(analysis);
      onApplyRecommendations({
        maxShift: params.maxShift,
        objectType: params.objectType
      });
      toast.success(t('Recommendations applied!', '建议已应用！'));
    }
  };

  const getObjectTypeIcon = (type: string) => {
    switch (type) {
      case 'star': return <Star className="h-3 w-3" />;
      case 'nebula': return <Sparkles className="h-3 w-3" />;
      case 'galaxy': return <Telescope className="h-3 w-3" />;
      default: return <Layers className="h-3 w-3" />;
    }
  };

  const getDistanceColor = (distance: string) => {
    switch (distance) {
      case 'near': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'far': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'very_far': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="bg-cosmic-800/50 border-cosmic-600/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-cosmic-100">
          <Sparkles className="h-4 w-4 text-purple-400" />
          {t('AI Star Analysis', 'AI星体分析')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleAnalyze}
          disabled={!imageDataUrl || isAnalyzing}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('Analyzing...', '分析中...')}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('Analyze with AI', '使用AI分析')}
            </>
          )}
        </Button>

        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Summary */}
              <div className="p-3 rounded-lg bg-cosmic-700/50 border border-cosmic-600/30">
                <p className="text-sm text-cosmic-200">{analysis.summary}</p>
              </div>

              {/* Object Classification */}
              <div className="flex flex-wrap gap-2">
                {analysis.objectClassification.hasNebula && (
                  <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    <Sparkles className="mr-1 h-3 w-3" />
                    {t('Nebula', '星云')}
                  </Badge>
                )}
                {analysis.objectClassification.hasGalaxy && (
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    <Telescope className="mr-1 h-3 w-3" />
                    {t('Galaxy', '星系')}
                  </Badge>
                )}
                {analysis.objectClassification.hasStarCluster && (
                  <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                    <Star className="mr-1 h-3 w-3" />
                    {t('Star Cluster', '星团')}
                  </Badge>
                )}
              </div>

              {/* Detected Objects */}
              {analysis.objects && analysis.objects.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-cosmic-300 uppercase tracking-wide">
                    {t('Detected Objects', '检测到的天体')}
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1.5">
                    {analysis.objects.slice(0, 8).map((obj, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-cosmic-700/30 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {getObjectTypeIcon(obj.type)}
                          <span className="text-cosmic-200">{obj.name}</span>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${getDistanceColor(obj.estimatedDistance)}`}>
                          L{obj.depthLayer}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.stereoscopicRecommendations && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-cosmic-300 uppercase tracking-wide flex items-center gap-1">
                    <Lightbulb className="h-3 w-3" />
                    {t('Recommendations', '建议')}
                  </h4>
                  <div className="p-3 rounded-lg bg-cosmic-700/30 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-cosmic-400">{t('Max Shift', '最大位移')}</span>
                      <span className="text-cosmic-200">{analysis.stereoscopicRecommendations.suggestedMaxShift}px</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-cosmic-400">{t('Depth Contrast', '深度对比')}</span>
                      <span className="text-cosmic-200 capitalize">{analysis.stereoscopicRecommendations.depthContrast}</span>
                    </div>
                    {analysis.stereoscopicRecommendations.processingTips?.length > 0 && (
                      <div className="pt-2 border-t border-cosmic-600/30">
                        <p className="text-[10px] text-cosmic-400 italic">
                          {analysis.stereoscopicRecommendations.processingTips[0]}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleApplyRecommendations}
                    variant="outline"
                    size="sm"
                    className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                  >
                    {t('Apply Recommendations', '应用建议')}
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default AIStarAnalysisPanel;
