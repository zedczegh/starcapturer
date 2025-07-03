
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, Target, Zap, Database } from 'lucide-react';

interface BortleValidationDisplayProps {
  validatedScale: number;
  confidence: 'high' | 'medium' | 'low';
  sources: string[];
  adjustments: string[];
  isValidating: boolean;
}

const BortleValidationDisplay: React.FC<BortleValidationDisplayProps> = ({
  validatedScale,
  confidence,
  sources,
  adjustments,
  isValidating
}) => {
  const { t } = useLanguage();
  
  const getConfidenceIcon = () => {
    switch (confidence) {
      case 'high': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'medium': return <Target className="h-4 w-4 text-yellow-400" />;
      case 'low': return <AlertTriangle className="h-4 w-4 text-orange-400" />;
    }
  };
  
  const getConfidenceColor = () => {
    switch (confidence) {
      case 'high': return 'text-green-400 border-green-500/30 bg-green-500/10';
      case 'medium': return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      case 'low': return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
    }
  };
  
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'star_count': return <Zap className="h-3 w-3" />;
      case 'terrain_corrected': return <Target className="h-3 w-3" />;
      case 'api': return <Database className="h-3 w-3" />;
      default: return <Info className="h-3 w-3" />;
    }
  };
  
  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'star_count': return t('Star Count Analysis', '星数分析');
      case 'terrain_corrected': return t('Terrain Correction', '地形校正');
      case 'api': return t('External Data', '外部数据');
      case 'historical': return t('Historical Data', '历史数据');
      case 'initial': return t('Initial Measurement', '初始测量');
      default: return source;
    }
  };
  
  if (isValidating) {
    return (
      <motion.div
        className="bg-cosmic-800/30 rounded-lg p-4 border border-cosmic-700/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
          <span className="text-sm text-cosmic-300">
            {t('Validating measurement...', '验证测量中...')}
          </span>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      className="bg-cosmic-800/30 rounded-lg p-4 border border-cosmic-700/30 space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {/* Confidence Indicator */}
      <div className={`flex items-center justify-between p-3 rounded-lg border ${getConfidenceColor()}`}>
        <div className="flex items-center space-x-2">
          {getConfidenceIcon()}
          <span className="font-medium text-sm">
            {t('Measurement Confidence', '测量置信度')}
          </span>
        </div>
        <span className="text-sm font-medium capitalize">
          {t(confidence, confidence === 'high' ? '高' : confidence === 'medium' ? '中' : '低')}
        </span>
      </div>
      
      {/* Data Sources */}
      {sources.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-cosmic-200 flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>{t('Data Sources', '数据来源')}</span>
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {sources.map((source, index) => (
              <div
                key={`${source}-${index}`}
                className="flex items-center space-x-2 p-2 bg-cosmic-700/30 rounded text-xs"
              >
                {getSourceIcon(source)}
                <span className="text-cosmic-300">{getSourceLabel(source)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Adjustments Applied */}
      {adjustments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-cosmic-200 flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>{t('Applied Corrections', '应用的校正')}</span>
          </h4>
          <div className="space-y-1">
            {adjustments.slice(0, 3).map((adjustment, index) => (
              <div
                key={index}
                className="text-xs text-cosmic-400 bg-cosmic-700/20 p-2 rounded"
              >
                {adjustment}
              </div>
            ))}
            {adjustments.length > 3 && (
              <div className="text-xs text-cosmic-500">
                {t(`+${adjustments.length - 3} more adjustments`, `+${adjustments.length - 3} 项其他校正`)}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Validated Result */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-primary">
            {t('Validated Bortle Scale', '验证的波特尔等级')}
          </span>
          <span className="text-lg font-bold text-primary">
            {validatedScale.toFixed(1)}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default BortleValidationDisplay;
