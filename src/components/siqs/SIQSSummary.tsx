
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { siqsToColor, siqsToText } from "@/lib/calculateSIQS";
import { cn } from "@/lib/utils";

export interface SIQSSummaryProps {
  score: number;
  isViable: boolean;
  onViewDetails?: () => void;
}

const SIQSSummary: React.FC<SIQSSummaryProps> = ({
  score,
  isViable,
  onViewDetails,
}) => {
  const { t, language } = useLanguage();
  
  // Get color and text based on SIQS score
  const scoreColor = siqsToColor(score, isViable);
  const scoreText = siqsToText(score, language === 'zh');
  
  // Define the scale for the gauge
  const gaugeScale = Math.min(Math.max(score / 10, 0), 1) * 180;
  
  return (
    <Card className="backdrop-blur-sm bg-cosmic-800/40 border-cosmic-700/30 shadow-lg h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-center text-gradient-blue">
          {t("SIQS Summary", "SIQS 总结")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-grow flex flex-col">
        <div className="flex-grow flex flex-col items-center justify-center py-6">
          {score > 0 ? (
            <>
              <div className="relative w-48 h-24 mb-6">
                {/* Gauge background */}
                <div className="absolute w-full h-full rounded-t-full overflow-hidden bg-cosmic-900 border-2 border-cosmic-700/50"></div>
                
                {/* Gauge fill */}
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-full transition-all duration-1000 ease-out"
                  style={{
                    height: `${Math.min(Math.max(score / 10, 0), 1) * 100}%`,
                    backgroundColor: scoreColor,
                    opacity: 0.7,
                  }}
                ></div>
                
                {/* Gauge needle */}
                <div
                  className="absolute bottom-0 left-1/2 w-1 bg-white h-24 origin-bottom transition-transform duration-1000 ease-out shadow-glow-sm"
                  style={{
                    transform: `translateX(-50%) rotate(${gaugeScale - 90}deg)`,
                  }}
                ></div>
                
                {/* Gauge center point */}
                <div className="absolute bottom-0 left-1/2 w-4 h-4 rounded-full bg-white shadow-glow-sm transform -translate-x-1/2 translate-y-1/2"></div>
                
                {/* Score value */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-white shadow-text">
                  {score.toFixed(1)}
                </div>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-1" style={{ color: scoreColor }}>
                  {scoreText.title}
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  {scoreText.description}
                </p>
              </div>
              
              <div className="w-full">
                <Button
                  onClick={onViewDetails}
                  className={cn(
                    "w-full flex items-center justify-center transition-all",
                    isViable
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-red-600 hover:bg-red-700"
                  )}
                  disabled={!isViable}
                >
                  {isViable
                    ? t("View Detailed Report", "查看详细报告")
                    : t("Not Viable for Imaging", "不适合成像")}
                  {isViable && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="w-24 h-24 mx-auto rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-muted-foreground">?</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {t("No Score Yet", "尚无评分")}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                {t(
                  "Select a location and calculate SIQS to see if your location is viable for astrophotography.",
                  "选择一个位置并计算SIQS，以查看您的位置是否适合天文摄影。"
                )}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SIQSSummary;
