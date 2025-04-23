
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from "@/contexts/LanguageContext";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const EmptyAstroSpotsState: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-16 rounded-xl bg-cosmic-800/30 border border-cosmic-700/30 shadow-inner mt-4">
      <Trash2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
      <p className="text-cosmic-300 mb-4">
        {t("You haven't created any AstroSpots yet.", "您还没有创建任何观星点。")}
      </p>
      <Button 
        variant="outline" 
        onClick={() => navigate('/photo-points')}
        className="mt-2"
      >
        {t("Create Your First AstroSpot", "创建您的第一个观星点")}
      </Button>
    </div>
  );
};

export default EmptyAstroSpotsState;
