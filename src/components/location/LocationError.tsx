
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Map, AlertOctagon, Home } from "lucide-react";

interface LocationErrorProps {
  message?: string;
}

const LocationError: React.FC<LocationErrorProps> = ({ message }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  const handleOpenMap = () => {
    navigate("/map", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="glass-card p-8 max-w-md w-full">
          <AlertOctagon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {t("Location Error", "位置错误")}
          </h1>
          <p className="text-muted-foreground mb-6">
            {message || t(
              "We couldn't load this location. It may have been deleted or there might be a connection issue.",
              "无法加载此位置。它可能已被删除或存在连接问题。"
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              variant="default" 
              onClick={handleGoHome}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              {t("Go Home", "返回首页")}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleOpenMap}
              className="flex items-center gap-2"
            >
              <Map className="h-4 w-4" />
              {t("Search Map", "搜索地图")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationError;
