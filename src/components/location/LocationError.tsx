
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import { useLanguage } from "@/contexts/LanguageContext";

interface LocationErrorProps {
  message?: string;
}

const LocationError: React.FC<LocationErrorProps> = ({ 
  message 
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("Location Not Found", "位置未找到")}</h1>
          <p className="text-muted-foreground mb-6">
            {message || t("The location information you're looking for doesn't exist or has expired. Redirecting you to the home page...", 
               "您正在查找的位置信息不存在或已过期。正在将您重定向到首页...")}
          </p>
          <Button onClick={() => navigate("/")} className="mt-2">
            {t("Go to Home Page", "返回首页")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LocationError;
