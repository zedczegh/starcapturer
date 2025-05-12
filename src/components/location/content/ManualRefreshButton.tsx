
import React from "react";
import { Loader } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface ManualRefreshButtonProps {
  onRefresh: () => void;
  isRetrying: boolean;
}

const ManualRefreshButton: React.FC<ManualRefreshButtonProps> = ({ 
  onRefresh, 
  isRetrying 
}) => {
  const { t } = useLanguage();
  
  return (
    <div className="mb-4 flex justify-center">
      <Button 
        variant="outline" 
        onClick={onRefresh}
        disabled={isRetrying}
        className="flex items-center gap-2"
      >
        {isRetrying ? (
          <Loader className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {t("Manually Refresh Data", "手动刷新数据")}
      </Button>
    </div>
  );
};

export default ManualRefreshButton;
