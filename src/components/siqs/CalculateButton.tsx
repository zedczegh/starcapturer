
import React from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

interface CalculateButtonProps {
  loading: boolean;
  onClick: () => void;
}

const CalculateButton: React.FC<CalculateButtonProps> = ({ loading, onClick }) => {
  const { t } = useLanguage();
  
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full mt-4 bg-gradient-to-r from-primary/80 to-primary hover:opacity-90 transition-all duration-200"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        t("See More Details", "查看更多详情")
      )}
    </Button>
  );
};

export default CalculateButton;
