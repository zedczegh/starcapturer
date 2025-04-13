
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface RecommendationsFooterProps {
  hasLocations: boolean;
  searching: boolean;
}

const RecommendationsFooter: React.FC<RecommendationsFooterProps> = ({
  hasLocations,
  searching
}) => {
  const { t } = useLanguage();
  
  return (
    <>
      {hasLocations && (
        <div className="mt-4 flex justify-center">
          <Link to="/photo-points">
            <Button
              variant="ghost"
              size="sm"
              className="bg-gradient-to-r from-blue-500/10 to-green-500/10 hover:from-blue-500/20 hover:to-green-500/20 text-primary/90 hover:text-primary"
            >
              {t("View All Photo Points", "查看所有摄影点")}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {searching && (
        <div className="flex justify-center mt-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary/60" />
        </div>
      )}
    </>
  );
};

export default RecommendationsFooter;
