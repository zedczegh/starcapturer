
import React, { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gauge, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { validateSIQSData } from "@/utils/validation/dataValidation";
import { useToast } from "@/components/ui/use-toast";
import { getTranslatedDescription } from "@/components/siqs/utils/translations/descriptionTranslator";
import SIQSScoreSummary from "@/components/siqs/SIQSScoreSummary";
import SIQSFactorsDisplay from "@/components/siqs/SIQSFactorsDisplay";

interface SIQSSummaryProps {
  siqsResult: any;
  weatherData: any;
  locationData: any;
}

const SIQSSummary: React.FC<SIQSSummaryProps> = ({ siqsResult, weatherData, locationData }) => {
  const { t, language } = useLanguage();
  const [validatedSiqs, setValidatedSiqs] = useState(siqsResult);
  const { toast } = useToast();
  
  useEffect(() => {
    const isValid = validateSIQSData(siqsResult);
    
    if (isValid) {
      setValidatedSiqs(siqsResult);
    } else if (siqsResult && typeof siqsResult.score === 'number') {
      console.warn("SIQS data structure is invalid, creating basic object");
      setValidatedSiqs({
        score: siqsResult.score,
        isViable: siqsResult.score >= 2,
        factors: siqsResult.factors || []
      });
    } else {
      console.error("Invalid SIQS data provided:", siqsResult);
      if (!validatedSiqs) {
        setValidatedSiqs(null);
      }
      
      toast({
        title: t("SIQS Data Issue", "SIQS数据问题"),
        description: t(
          "There was an issue with the SIQS data. Some information may not be accurate.",
          "SIQS数据出现问题，部分信息可能不准确。"
        ),
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [siqsResult, t, toast, validatedSiqs]);
  
  if (!validatedSiqs) {
    return (
      <Card className="glassmorphism-strong">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            {t("No SIQS Data Available", "无天文观测质量评分数据")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {t("Please wait while we calculate SIQS score for this location.", "请等待我们计算此位置的天文观测质量评分。")}
        </CardContent>
      </Card>
    );
  }
  
  const siqsScore = useMemo(() => {
    return typeof validatedSiqs.score === 'number' ? 
      Math.round(validatedSiqs.score * 10) / 10 : 0;
  }, [validatedSiqs.score]);
  
  // Use night cloud data if available, using the same data source as in other components
  const enrichedWeatherData = useMemo(() => {
    const result = { ...weatherData };
    
    // Use nighttime cloud data from siqsResult if available
    if (validatedSiqs.nighttimeCloudData) {
      if (!result.nighttimeCloudData) {
        result.nighttimeCloudData = validatedSiqs.nighttimeCloudData;
      }
      // Override cloudCover with the forecast average for consistency
      if (typeof validatedSiqs.nighttimeCloudData.average === 'number') {
        result.cloudCover = validatedSiqs.nighttimeCloudData.average;
      }
    }
    
    return result;
  }, [weatherData, validatedSiqs]);
  
  // Process and translate factors
  const translatedFactors = useMemo(() => {
    if (!validatedSiqs.factors || !Array.isArray(validatedSiqs.factors)) return [];
    
    const factors = [...validatedSiqs.factors];
    const hasClearSkyFactor = factors.some(factor => 
      factor.name === 'Clear Sky Rate' || factor.name === '晴空率');
    
    if (!hasClearSkyFactor && enrichedWeatherData?.clearSkyRate) {
      const clearSkyRate = enrichedWeatherData.clearSkyRate;
      const clearSkyScore = Math.min(10, clearSkyRate / 10);
      
      factors.push({
        name: 'Clear Sky Rate',
        score: clearSkyScore,
        description: `Annual clear sky rate (${clearSkyRate}%), favorable for astrophotography`,
      });
    }
    
    // Sort factors by importance
    factors.sort((a, b) => {
      const order = [
        'Cloud Cover', '云层覆盖',
        'Light Pollution', '光污染',
        'Seeing Conditions', '视宁度',
        'Wind Speed', '风速',
        'Humidity', '湿度',
        'Moon Phase', '月相',
        'Air Quality', '空气质量',
        'Clear Sky Rate', '晴空率'
      ];
      
      const indexA = order.indexOf(a.name);
      const indexB = order.indexOf(b.name);
      
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      return 0;
    });
    
    // Update cloud cover factor to use forecast data if available
    if (enrichedWeatherData?.nighttimeCloudData?.average !== undefined) {
      for (let i = 0; i < factors.length; i++) {
        if (factors[i].name === 'Cloud Cover' || factors[i].name === '云层覆盖') {
          factors[i].description = language === 'zh' 
            ? `${Math.round(enrichedWeatherData.nighttimeCloudData.average)}%的夜间云层覆盖`
            : `${Math.round(enrichedWeatherData.nighttimeCloudData.average)}% night cloud cover`;
        }
      }
    }
    
    // Translate factor names and descriptions
    return factors.map(factor => ({
      ...factor,
      description: language === 'zh' ? 
        getTranslatedDescription(factor.description, 'zh') : 
        factor.description,
      name: language === 'zh' ? 
        (factor.name === 'Cloud Cover' ? '云层覆盖' :
         factor.name === 'Light Pollution' ? '光污染' :
         factor.name === 'Moon Phase' ? '月相' :
         factor.name === 'Humidity' ? '湿度' :
         factor.name === 'Wind Speed' ? '风速' :
         factor.name === 'Seeing Conditions' ? '视宁度' :
         factor.name === 'Air Quality' ? '空气质量' :
         factor.name === 'Clear Sky Rate' ? '晴空率' :
         factor.name) : 
        factor.name
    }));
  }, [validatedSiqs.factors, enrichedWeatherData, language]);
  
  return (
    <Card className="glassmorphism-strong">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          {t("SIQS Summary", "天文观测质量评分摘要")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <SIQSScoreSummary 
          score={siqsScore}
          language={language} 
          t={t}
        />
        
        <SIQSFactorsDisplay 
          factors={translatedFactors} 
          weatherData={enrichedWeatherData} 
        />
      </CardContent>
    </Card>
  );
};

export default SIQSSummary;
