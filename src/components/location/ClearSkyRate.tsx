
import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";
import { useAIKey, AIKeyInput } from './AIKeyInput';
import { toast } from 'sonner';

interface ClearSkyRateProps {
  locationName: string;
  latitude: number;
  longitude: number;
}

export const ClearSkyRate = ({ locationName, latitude, longitude }: ClearSkyRateProps) => {
  const [loading, setLoading] = useState(false);
  const [clearSkyRate, setClearSkyRate] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);
  const { t } = useLanguage();
  const apiKey = useAIKey();

  const fetchClearSkyRate = async () => {
    if (!apiKey) {
      setNeedsKey(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are an expert in astronomy and weather patterns. Please estimate the annual number of clear sky nights for the given location based on its geographical position and general weather patterns. Provide only the number and a very brief explanation.'
            },
            {
              role: 'user',
              content: `What is the estimated annual number of clear sky nights for ${locationName} (latitude: ${latitude}, longitude: ${longitude})?`
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setClearSkyRate(data.choices[0].message.content);
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      console.error('Error fetching clear sky rate:', error);
      toast.error(t(
        "Failed to fetch clear sky rate. Please try again.",
        "获取晴空率失败，请重试。"
      ));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (locationName && latitude && longitude) {
      fetchClearSkyRate();
    }
  }, [locationName, latitude, longitude, apiKey]);

  if (needsKey) {
    return <AIKeyInput onKeySet={() => setNeedsKey(false)} />;
  }

  return (
    <Card className="p-4 bg-cosmic-900/60 border-cosmic-700/30">
      <h3 className="text-sm font-medium text-cosmic-100 mb-2">
        {t("AI-Powered Annual Clear Sky Rate", "AI 驱动的年度晴空率")}
      </h3>
      <div className="text-cosmic-100">
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">
              {t("Analyzing location...", "正在分析位置...")}
            </span>
          </div>
        ) : (
          <p className="text-sm">{clearSkyRate || t("No data available", "暂无数据")}</p>
        )}
      </div>
    </Card>
  );
};
