
import React from "react";
import { Progress } from "@/components/ui/progress";
import { getProgressColorClass } from "../utils/progressColor";
import { 
  CloudIcon, 
  SunIcon, 
  MoonIcon, 
  WindIcon,
  DropletIcon,
  EyeIcon,
  GaugeIcon,
  CloudFogIcon
} from "lucide-react";

export interface FactorItemProps {
  factor: {
    name: string;
    score: number;
    description: string;
    nighttimeData?: {
      average: number;
      timeRange?: string;
    }
  };
}

const FactorItem: React.FC<FactorItemProps> = ({ factor }) => {
  const { name, score, description } = factor;
  
  // Get icon based on factor name
  const getIcon = () => {
    switch (name) {
      case "Cloud Cover":
      case "云层覆盖":
      case "Nighttime Cloud Cover":
      case "夜间云层覆盖":
        return <CloudIcon className="h-4 w-4 text-blue-400" />;
      case "Light Pollution":
      case "光污染":
        return <SunIcon className="h-4 w-4 text-yellow-500" />;
      case "Moon Phase":
      case "月相":
        return <MoonIcon className="h-4 w-4 text-gray-300" />;
      case "Wind Speed":
      case "风速":
        return <WindIcon className="h-4 w-4 text-cyan-400" />;
      case "Humidity":
      case "湿度":
        return <DropletIcon className="h-4 w-4 text-cyan-300" />;
      case "Seeing Conditions":
      case "视宁度":
        return <EyeIcon className="h-4 w-4 text-purple-400" />;
      case "Air Quality":
      case "空气质量":
        return <CloudFogIcon className="h-4 w-4 text-green-400" />;
      case "Clear Sky Rate":
      case "晴空率":
        return <GaugeIcon className="h-4 w-4 text-orange-400" />;
      default:
        return <GaugeIcon className="h-4 w-4 text-primary" />;
    }
  };
  
  // Format score for display
  const scoreDisplay = Math.round(score * 10) / 10;
  
  // Get appropriate color class for the progress bar
  const colorClass = getProgressColorClass(score);
  
  // Calculate bar width
  const barWidth = Math.max(5, Math.min(100, score * 10));
  
  // Determine if this factor has nighttime data
  const hasNighttimeData = factor.nighttimeData && 
    typeof factor.nighttimeData.average === 'number';
  
  // Get night description if available
  const nightDescription = hasNighttimeData && factor.nighttimeData?.timeRange ? 
    ` (${factor.nighttimeData?.timeRange})` : '';

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm font-medium">
            {name}
            {hasNighttimeData && (
              <span className="text-xs text-primary-foreground/70 ml-1">
                {nightDescription}
              </span>
            )}
          </span>
        </div>
        <span className={`text-sm font-bold ${colorClass.replace('bg-', 'text-')}`}>
          {scoreDisplay.toFixed(1)}
        </span>
      </div>
      
      <Progress value={barWidth} className="h-2" colorClass={colorClass} />
      
      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>
    </div>
  );
};

export default FactorItem;
