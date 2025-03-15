
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertCircle } from "lucide-react";

interface LocationErrorProps {
  message?: string;
  autoRedirect?: boolean;
}

const LocationError: React.FC<LocationErrorProps> = ({ 
  message,
  autoRedirect = false // Disabled auto-redirect by default
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl p-8 glassmorphism rounded-xl shadow-lg border border-destructive/10">
          <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">{t("Location Not Found", "位置未找到")}</h1>
          <p className="text-muted-foreground mb-6">
            {message || t("The location information you're looking for doesn't exist or has expired.", 
               "您正在查找的位置信息不存在或已过期。")}
          </p>
          <Button 
            onClick={() => navigate("/")} 
            className="mt-2 transition-all hover:scale-105"
          >
            {t("Go to Home Page", "返回首页")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LocationError;
