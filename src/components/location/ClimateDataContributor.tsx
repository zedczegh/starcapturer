
import React, { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CloudSun, Upload, LineChart, RefreshCw } from "lucide-react";
import { useClearSkyDataCollection } from '@/hooks/useClearSkyDataCollection';
import { useLanguage } from '@/contexts/LanguageContext';

interface ClimateDataContributorProps {
  latitude: number;
  longitude: number;
  locationName?: string | null;
}

/**
 * Component that enables users to contribute clear sky data to improve the model
 */
const ClimateDataContributor: React.FC<ClimateDataContributorProps> = ({
  latitude,
  longitude,
  locationName
}) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [userCloudCover, setUserCloudCover] = useState<number>(20);
  const [userVisibility, setUserVisibility] = useState<number>(80);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    recordCurrentObservation,
    recordManualObservation,
    collectionStats,
    lastCollectionTime
  } = useClearSkyDataCollection({
    latitude,
    longitude,
    autoCollect: true
  });
  
  // Handle automatic data collection
  const handleAutoCollection = async () => {
    setIsSubmitting(true);
    
    try {
      const success = recordCurrentObservation();
      
      if (success) {
        toast({
          title: t("Data Contributed", "数据已贡献"),
          description: t("Thank you for contributing to our clear sky database!", "感谢您为我们的晴空数据库做出贡献！"),
          variant: "default",
        });
      } else {
        toast({
          title: t("Collection Failed", "收集失败"),
          description: t("Unable to collect weather data. Please try again.", "无法收集天气数据。请再试一次。"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in auto collection:", error);
      toast({
        title: t("Error", "错误"),
        description: t("An error occurred while collecting data.", "收集数据时发生错误。"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle manual data submission
  const handleManualSubmission = async () => {
    setIsSubmitting(true);
    
    try {
      const success = recordManualObservation(userCloudCover, userVisibility);
      
      if (success) {
        toast({
          title: t("Data Submitted", "数据已提交"),
          description: t("Thank you for contributing your observation!", "感谢您贡献您的观测数据！"),
          variant: "default",
        });
      } else {
        toast({
          title: t("Submission Failed", "提交失败"),
          description: t("Unable to submit your observation. Please try again.", "无法提交您的观测数据。请再试一次。"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in manual submission:", error);
      toast({
        title: t("Error", "错误"),
        description: t("An error occurred while submitting data.", "提交数据时发生错误。"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format last collection time
  const formattedLastCollection = lastCollectionTime 
    ? new Date(lastCollectionTime).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')
    : null;
  
  return (
    <Card className="shadow-lg border border-cosmic-600/30">
      <CardHeader className="bg-cosmic-800/30 pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <CloudSun className="h-5 w-5 text-blue-400" />
            {t("Climate Data Contribution", "气候数据贡献")}
          </CardTitle>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
            {t("Beta", "测试版")}
          </Badge>
        </div>
        <CardDescription>
          {t(
            "Help improve our clear sky predictions by contributing local observations",
            "通过贡献本地观测数据，帮助改进我们的晴空预测"
          )}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {t("Current Cloud Cover", "当前云层覆盖")}
            </span>
            <span className="text-sm font-bold">{userCloudCover}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[userCloudCover]}
            onValueChange={(values) => setUserCloudCover(values[0])}
            className="my-2"
          />
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {t("Current Visibility", "当前能见度")}
            </span>
            <span className="text-sm font-bold">{userVisibility}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[userVisibility]}
            onValueChange={(values) => setUserVisibility(values[0])}
            className="my-2"
          />
        </div>
        
        <div className="flex flex-col gap-4 mt-6">
          <Button 
            variant="outline" 
            onClick={handleManualSubmission} 
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 hover:bg-blue-500/20"
          >
            <Upload className="h-4 w-4 mr-2" />
            {t("Submit My Observation", "提交我的观测数据")}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleAutoCollection} 
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30 hover:bg-green-500/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("Use Current Weather Data", "使用当前天气数据")}
          </Button>
        </div>
        
        <div className="flex justify-between items-center mt-4 pt-2 border-t border-cosmic-700/30 text-xs text-muted-foreground">
          <div>
            <span>{t("Contributions", "贡献数据")}: </span>
            <span className="font-medium">{collectionStats.observationsCount}</span>
          </div>
          {formattedLastCollection && (
            <div>
              <span>{t("Last update", "上次更新")}: </span>
              <span className="font-medium">{formattedLastCollection}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClimateDataContributor;
