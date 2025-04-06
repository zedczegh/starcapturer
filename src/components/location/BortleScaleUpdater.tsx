
import React, { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { updateUserProvidedBortleScale, findNearbyUserBortleMeasurement } from '@/lib/api/pollution';
import { getBortleScaleDescription } from '@/data/utils/bortleScaleUtils';
import { Slider } from '@/components/ui/slider';
import { Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface BortleScaleUpdaterProps {
  latitude: number;
  longitude: number;
  currentBortleScale: number | null;
  onBortleScaleUpdate: (newBortleScale: number) => void;
}

const BortleScaleUpdater: React.FC<BortleScaleUpdaterProps> = ({
  latitude,
  longitude,
  currentBortleScale,
  onBortleScaleUpdate
}) => {
  const { language, t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [bortleValue, setBortleValue] = useState<number>(currentBortleScale || 4);
  const [method, setMethod] = useState<'observation' | 'measurement' | 'estimate'>('observation');
  const { toast } = useToast();
  
  // Check if user has already submitted a measurement for this location
  const existingMeasurement = findNearbyUserBortleMeasurement(latitude, longitude);
  
  const handleToggleEdit = useCallback(() => {
    setIsEditing(prev => !prev);
    if (!isEditing) {
      setBortleValue(currentBortleScale || 4);
    }
  }, [isEditing, currentBortleScale]);
  
  const handleMethodChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    setMethod(event.target.value as 'observation' | 'measurement' | 'estimate');
  }, []);
  
  const handleSubmit = useCallback(() => {
    const success = updateUserProvidedBortleScale(latitude, longitude, bortleValue, method);
    
    if (success) {
      // Call the callback to update the parent component
      onBortleScaleUpdate(bortleValue);
      
      // Show success toast
      toast({
        title: t ? t("Light pollution data updated", "光污染数据已更新") : "Light pollution data updated",
        description: t 
          ? t("Thank you for contributing to our database", "感谢您对我们数据库的贡献") 
          : "Thank you for contributing to our database",
        variant: "default",
      });
      
      // Exit edit mode
      setIsEditing(false);
    } else {
      toast({
        title: t ? t("Update failed", "更新失败") : "Update failed",
        description: t 
          ? t("Please try again with valid values", "请使用有效值重试") 
          : "Please try again with valid values",
        variant: "destructive",
      });
    }
  }, [latitude, longitude, bortleValue, method, onBortleScaleUpdate, toast, t]);
  
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setBortleValue(currentBortleScale || 4);
  }, [currentBortleScale]);
  
  const getBortleColor = (value: number) => {
    if (value <= 2) return "bg-blue-800";
    if (value <= 3) return "bg-blue-600";  
    if (value <= 4) return "bg-blue-400";
    if (value <= 5) return "bg-yellow-400";
    if (value <= 6) return "bg-orange-400";
    if (value <= 7) return "bg-orange-500";
    return "bg-red-500";
  };
  
  return (
    <div className="mt-2">
      {isEditing ? (
        <div className="space-y-4 p-4 bg-black/20 rounded-lg">
          <div>
            <label className="text-sm font-medium">
              {t ? t("Bortle Scale", "包特尔等级") : "Bortle Scale"}: {bortleValue.toFixed(1)}
            </label>
            <Slider
              value={[bortleValue]}
              min={1}
              max={9}
              step={0.1}
              onValueChange={(values) => setBortleValue(values[0])}
              className="mt-2"
            />
            <div className="flex justify-between text-xs mt-1">
              <span>1 {t ? t("(Darkest)", "(最暗)") : "(Darkest)"}</span>
              <span>9 {t ? t("(Brightest)", "(最亮)") : "(Brightest)"}</span>
            </div>
            <p className="text-xs opacity-70 mt-1">
              {getBortleScaleDescription(bortleValue, language === 'zh' ? 'zh' : 'en')}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium block mb-1">
              {t ? t("Source of data", "数据来源") : "Source of data"}
            </label>
            <select
              value={method}
              onChange={handleMethodChange}
              className="w-full bg-black/30 border border-gray-600 rounded-md px-3 py-2 text-sm"
            >
              <option value="observation">
                {t ? t("Visual observation", "目视观察") : "Visual observation"}
              </option>
              <option value="measurement">
                {t ? t("SQM measurement", "SQM测量") : "SQM measurement"}
              </option>
              <option value="estimate">
                {t ? t("Estimate", "估计") : "Estimate"}
              </option>
            </select>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="default" className="flex-1" onClick={handleSubmit}>
              {t ? t("Submit", "提交") : "Submit"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleCancel}>
              {t ? t("Cancel", "取消") : "Cancel"}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          {existingMeasurement ? (
            <div className="text-xs text-gray-300 mt-1 italic">
              <Info className="inline h-3 w-3 mr-1" />
              {t 
                ? t("You've previously submitted Bortle data for this location", "您之前已为该位置提交了包特尔数据") 
                : "You've previously submitted Bortle data for this location"}
            </div>
          ) : null}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleToggleEdit}
            className="mt-1 text-xs"
          >
            {t ? t("Update light pollution data", "更新光污染数据") : "Update light pollution data"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default BortleScaleUpdater;
