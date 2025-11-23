
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
    <Card className="glassmorphism px-8 py-12 rounded-2xl shadow-glow space-y-8 flex flex-col">
      {/* Language Switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-6 w-6 text-primary" />
          <span className="font-medium text-lg">{t("Default Language", "默认语言")}</span>
        </div>
        <div className="flex gap-4">
          <Button
            variant={prefs.language === "en" ? "default" : "outline"}
            className="px-4 py-1"
            onClick={() => handleChange("language", "en")}
          >
            English
          </Button>
          <Button
            variant={prefs.language === "zh" ? "default" : "outline"}
            className="px-4 py-1"
            onClick={() => handleChange("language", "zh")}
          >
            中文
          </Button>
        </div>
      </div>
      {/* SIQS Cache on login */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trash className="h-5 w-5 text-destructive" />
          <span className="font-medium text-lg">{t("Clear SIQS cache on login", "登录时清除SIQS缓存")}</span>
        </div>
        <Switch
          checked={prefs.clearSiqsCacheOnLogin}
          onCheckedChange={checked => handleChange("clearSiqsCacheOnLogin", checked)}
        />
      </div>
      {/* Immediate clear cache */}
      <div className="flex justify-end">
        <Button
          variant="destructive"
          onClick={handleClearSiqsCacheNow}
          className="rounded-full px-6"
        >
          {t("Clear Now", "立即清除")}
        </Button>
      </div>
      {/* Location Service */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-primary" />
          <span className="font-medium text-lg">{t("Enable location service by default", "默认启用定位服务")}</span>
        </div>
        <Switch
          checked={prefs.allowLocationService}
          onCheckedChange={checked => handleChange("allowLocationService", checked)}
        />
      </div>

      {/* Map Provider */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Map className="h-5 w-5 text-primary" />
          <div className="flex flex-col">
            <span className="font-medium text-lg">{t("Map Provider", "地图服务")}</span>
            <span className="text-sm text-muted-foreground">
              {t("Auto-detects based on location", "根据位置自动检测")}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={provider === "leaflet" ? "default" : "outline"}
            className="px-4 py-1"
            onClick={() => setProvider("leaflet")}
          >
            Leaflet
          </Button>
          <Button
            variant={provider === "amap" ? "default" : "outline"}
            className="px-4 py-1"
            onClick={() => setProvider("amap")}
          >
            {t("AMap", "高德地图")}
          </Button>
        </div>
      </div>

      {/* Map Provider Status */}
      {provider === "amap" && (
        <div className="text-sm text-muted-foreground">
          {isAMapReady 
            ? `✓ ${t("AMap loaded successfully", "高德地图加载成功")}`
            : `⏳ ${t("Loading AMap...", "正在加载高德地图...")}`}
        </div>
      )}
    </Card>
  );
};

export default PreferencesForm;
