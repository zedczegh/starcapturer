
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowUp, 
  ArrowDown, 
  Circle, 
  CheckCircle, 
  XCircle, 
  HelpCircle 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

export interface SIQSSummaryProps {
  className?: string;
  siqs?: number; // Make SIQS optional prop for compatibility
  location?: any; // Add location prop for compatibility
}

const SIQSSummary: React.FC<SIQSSummaryProps> = ({ 
  className = '',
  siqs,
  location
}) => {
  const { t } = useLanguage();
  
  // Get SIQS from location if not directly provided
  const score = siqs !== undefined ? siqs : (location?.siqsResult?.score || 0);
  
  // Determine if viable (default to true if unavailable)
  const isViable = location?.siqsResult?.isViable !== undefined 
    ? location.siqsResult.isViable 
    : (score >= 5.0);
  
  const getIcon = () => {
    if (score >= 8.0) {
      return <ArrowUp className="h-5 w-5 text-green-500" />;
    } else if (score >= 5.0) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (score >= 3.0) {
      return <Circle className="h-5 w-5 text-yellow-500" />;
    } else if (score > 0) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <HelpCircle className="h-5 w-5 text-gray-500" />;
  };
  
  const getConditionText = () => {
    if (score >= 8.0) {
      return t("Excellent", "极佳");
    } else if (score >= 5.0) {
      return t("Good", "良好");
    } else if (score >= 3.0) {
      return t("Fair", "一般");
    } else if (score > 0) {
      return t("Poor", "较差");
    }
    return t("Unknown", "未知");
  };
  
  const getColor = () => {
    if (score >= 8.0) return "text-green-500";
    if (score >= 5.0) return "text-green-400";
    if (score >= 3.0) return "text-yellow-500";
    if (score > 0) return "text-red-500";
    return "text-gray-500";
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-cosmic-700 bg-cosmic-800/40 backdrop-blur-sm ${className}`}>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-3">
              {getIcon()}
            </div>
            <div>
              <div className="text-sm font-medium">
                {t("SIQS Score", "SIQS 评分")}
              </div>
              <div className="text-xs text-muted-foreground">
                {getConditionText()}
              </div>
            </div>
          </div>
          <div className={`text-2xl font-bold ${getColor()}`}>
            {score.toFixed(1)}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SIQSSummary;
