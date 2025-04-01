
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { 
  Cloud, 
  Moon, 
  Thermometer, 
  Wind, 
  Droplets, 
  Eye, 
  AlertTriangle,
  Building2
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from '@/components/ui/tooltip';

interface SIQSFactor {
  name: string;
  score: number;
  description?: string;
  weight?: number;
  icon?: string;
}

interface SIQSFactorsProps {
  factors: SIQSFactor[];
  className?: string;
  showDescription?: boolean;
}

const SIQSFactors: React.FC<SIQSFactorsProps> = ({ 
  factors, 
  className = '',
  showDescription = true
}) => {
  const { language } = useLanguage();
  
  // Get icon component based on factor name
  const getIconComponent = (factorName: string) => {
    const lowerName = factorName.toLowerCase();
    
    if (lowerName.includes('cloud') || lowerName.includes('云')) {
      return <Cloud className="h-4 w-4" />;
    }
    if (lowerName.includes('moon') || lowerName.includes('月')) {
      return <Moon className="h-4 w-4" />;
    }
    if (lowerName.includes('temperature') || lowerName.includes('温度')) {
      return <Thermometer className="h-4 w-4" />;
    }
    if (lowerName.includes('wind') || lowerName.includes('风')) {
      return <Wind className="h-4 w-4" />;
    }
    if (lowerName.includes('humid') || lowerName.includes('湿')) {
      return <Droplets className="h-4 w-4" />;
    }
    if (lowerName.includes('seeing') || lowerName.includes('视宁度')) {
      return <Eye className="h-4 w-4" />;
    }
    if (lowerName.includes('light') || lowerName.includes('pollution') || 
        lowerName.includes('光污染') || lowerName.includes('bortle')) {
      return <Building2 className="h-4 w-4" />;
    }
    
    return <AlertTriangle className="h-4 w-4" />;
  };
  
  // Get progress color based on score
  const getProgressColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-green-400';
    if (score >= 4) return 'bg-yellow-400';
    if (score >= 2) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  if (!factors || factors.length === 0) {
    return null;
  }
  
  return (
    <div className={`space-y-3 ${className}`}>
      {factors.map((factor, index) => (
        <div key={`factor-${index}`} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center space-x-2">
                    {getIconComponent(factor.name)}
                    <span>{factor.name}</span>
                  </div>
                </TooltipTrigger>
                {factor.description && (
                  <TooltipContent side="top" className="max-w-[250px] text-xs">
                    {factor.description}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            
            <span className="font-medium">
              {Math.round(factor.score * 10) / 10}
              <span className="text-xs text-muted-foreground">/10</span>
            </span>
          </div>
          
          <Progress 
            value={factor.score * 10} 
            max={100} 
            className={`h-1.5 ${getProgressColor(factor.score)}`}
          />
          
          {showDescription && factor.description && (
            <p className="text-xs text-muted-foreground ml-6">
              {factor.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default SIQSFactors;
