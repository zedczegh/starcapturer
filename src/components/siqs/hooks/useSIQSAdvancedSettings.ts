import { useState } from "react";

export const useSIQSAdvancedSettings = () => {
  const seeingConditions = 2;
  const bortleScale = 4; 
  
  return {
    seeingConditions,
    bortleScale
  };
};
