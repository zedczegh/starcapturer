
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe, Trash, MapPin, Map } from "lucide-react";
import { toast } from "sonner";
import { useMapProvider } from "@/contexts/MapProviderContext";

const PREF_KEY = "user_preferences";

interface Preferences {
  language: "en" | "zh";
  clearSiqsCacheOnLogin: boolean;
  allowLocationService: boolean;
}

const defaultPrefs: Preferences = {
  language: "en",
  clearSiqsCacheOnLogin: false,
  allowLocationService: true,
};

function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {}
  return defaultPrefs;
}

const PreferencesForm = () => {
  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);
  const { language, setLanguage, t } = useLanguage();
  const { provider, setProvider, isAMapReady } = useMapProvider();

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const handleChange = (key: keyof Preferences, value: any) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    localStorage.setItem(PREF_KEY, JSON.stringify(updated));
    if (key === "language") setLanguage(value);
  };

  const handleClearSiqsCacheNow = () => {
    try {
      // Remove any SIQS cache from localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("siqs_")) {
          localStorage.removeItem(key);
        }
      });
      toast.success(t("SIQS cache cleared.", "SIQS缓存已清空。"));
    } catch {
      toast.error(t("Error clearing cache.", "清除缓存时出错。"));
    }
  };

  return (
    <Card className="glassmorphism px-3 py-6 sm:px-8 sm:py-12 rounded-xl sm:rounded-2xl shadow-glow space-y-5 sm:space-y-8 flex flex-col border-transparent sm:border-cosmic-700/30">
      {/* Language Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <span className="font-medium text-base sm:text-lg">{t("Default Language", "默认语言")}</span>
        </div>
        <div className="flex gap-2">
          <Button
            variant={prefs.language === "en" ? "default" : "outline"}
            className="px-6 py-1.5 text-sm flex-1 sm:flex-none"
            onClick={() => handleChange("language", "en")}
          >
            English
          </Button>
          <Button
            variant={prefs.language === "zh" ? "default" : "outline"}
            className="px-6 py-1.5 text-sm flex-1 sm:flex-none"
            onClick={() => handleChange("language", "zh")}
          >
            中文
          </Button>
        </div>
      </div>
      {/* SIQS Cache on login */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <Trash className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
          <span className="font-medium text-sm sm:text-lg leading-tight">{t("Clear SIQS cache on login", "登录时清除SIQS缓存")}</span>
        </div>
        <Switch
          checked={prefs.clearSiqsCacheOnLogin}
          onCheckedChange={checked => handleChange("clearSiqsCacheOnLogin", checked)}
        />
      </div>
      {/* Immediate clear cache */}
      <div className="flex justify-stretch sm:justify-end">
        <Button
          variant="destructive"
          onClick={handleClearSiqsCacheNow}
          className="rounded-full px-6 w-full sm:w-auto"
        >
          {t("Clear Now", "立即清除")}
        </Button>
      </div>
      {/* Location Service */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          <span className="font-medium text-sm sm:text-lg leading-tight">{t("Enable location service by default", "默认启用定位服务")}</span>
        </div>
        <Switch
          checked={prefs.allowLocationService}
          onCheckedChange={checked => handleChange("allowLocationService", checked)}
        />
      </div>

      {/* Map Provider */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <Map className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-medium text-sm sm:text-lg">{t("Map Provider", "地图服务")}</span>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {t("Auto-detects based on location", "根据位置自动检测")}
            </span>
          </div>
        </div>
        <div className="flex gap-2 w-full">
          <Button
            variant={provider === "leaflet" ? "default" : "outline"}
            className="px-4 py-2 text-sm flex-1"
            onClick={() => setProvider("leaflet")}
          >
            Leaflet
          </Button>
          <Button
            variant={provider === "amap" ? "default" : "outline"}
            className="px-4 py-2 text-sm flex-1"
            onClick={() => setProvider("amap")}
          >
            {t("AMap", "高德地图")}
          </Button>
        </div>
        
        {/* Map Provider Status */}
        {provider === "amap" && (
          <div className="text-xs sm:text-sm text-muted-foreground pl-7 sm:pl-8">
            {isAMapReady 
              ? `✓ ${t("AMap loaded successfully", "高德地图加载成功")}`
              : `⏳ ${t("Loading AMap...", "正在加载高德地图...")}`}
          </div>
        )}
      </div>
    </Card>
  );
};

export default PreferencesForm;
