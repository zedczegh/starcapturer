import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateUserProvidedBortleScale } from "@/lib/api/pollution";
import { useLanguage } from "@/contexts/LanguageContext";
import { RefreshCcw } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface BortleScaleUpdaterProps {
  latitude: number;
  longitude: number;
  currentBortleScale: number;
  onBortleScaleUpdate: (newBortleScale: number) => void;
}

const BortleScaleUpdater = ({ 
  latitude, 
  longitude, 
  currentBortleScale, 
  onBortleScaleUpdate 
}: BortleScaleUpdaterProps) => {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [bortleValue, setBortleValue] = useState(currentBortleScale.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleEdit = () => {
    if (!isEditing) {
      // Reset to current value when starting to edit
      setBortleValue(currentBortleScale.toString());
    }
    setIsEditing(!isEditing);
  };

  const handleSubmit = async () => {
    // Parse and validate input
    const newBortleScale = parseFloat(bortleValue);
    if (isNaN(newBortleScale) || newBortleScale < 1 || newBortleScale > 9) {
      toast({
        title: t ? t("Invalid value", "无效值") : "Invalid value",
        description: t 
          ? t("Please enter a number between 1 and 9", "请输入1到9之间的数字") 
          : "Please enter a number between 1 and 9",
        variant: "destructive"
      });
      return;
    }

    // Don't update if the value hasn't changed
    if (newBortleScale === currentBortleScale) {
      setIsEditing(false);
      return;
    }

    setIsSubmitting(true);
    try {
      // Update user-provided Bortle scale in API
      await updateUserProvidedBortleScale(
        latitude,
        longitude,
        newBortleScale,
        'observation'
      );

      // Update in parent component
      onBortleScaleUpdate(newBortleScale);
      
      toast({
        title: t ? t("Bortle scale updated", "波尔特尔等级已更新") : "Bortle scale updated",
        description: t 
          ? t("Light pollution measurement has been updated", "光污染测量已更新") 
          : "Light pollution measurement has been updated",
      });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating Bortle scale:", error);
      
      toast({
        title: t ? t("Update failed", "更新失败") : "Update failed",
        description: t 
          ? t("Failed to update light pollution data", "无法更新光污染数据") 
          : "Failed to update light pollution data",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="mt-4 flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleToggleEdit}
          className="text-xs flex items-center gap-1"
        >
          <RefreshCcw className="h-3 w-3" />
          {t ? t("Update Light Pollution", "更新光污染数据") : "Update Light Pollution"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {t ? t("Provide your own measurement", "提供您自己的测量值") : "Provide your own measurement"}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="1"
          max="9"
          step="0.1"
          value={bortleValue}
          onChange={(e) => setBortleValue(e.target.value)}
          className="w-20"
          placeholder="1-9"
        />
        <Button 
          size="sm" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? (t ? t("Saving...", "保存中...") : "Saving...")
            : (t ? t("Save", "保存") : "Save")}
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleToggleEdit}
          disabled={isSubmitting}
        >
          {t ? t("Cancel", "取消") : "Cancel"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t 
          ? t("Enter Bortle scale from 1 (darkest) to 9 (brightest)", "输入波尔特尔等级，从1（最暗）到9（最亮）") 
          : "Enter Bortle scale from 1 (darkest) to 9 (brightest)"}
      </p>
    </div>
  );
};

export default BortleScaleUpdater;
