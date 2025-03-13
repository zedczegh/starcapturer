
import { useState } from "react";

export const useSIQSAdvancedSettings = () => {
  const [seeingConditions, setSeeingConditions] = useState(2);
  const [bortleScale, setBortleScale] = useState(4); 
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  return {
    seeingConditions,
    setSeeingConditions,
    bortleScale,
    setBortleScale,
    showAdvancedSettings,
    setShowAdvancedSettings
  };
};
