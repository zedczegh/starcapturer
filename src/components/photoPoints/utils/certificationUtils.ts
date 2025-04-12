
import { Award, ShieldCheck } from "lucide-react";

export const getCertificationInfo = (location) => {
  if (location.isDarkSkyReserve) {
    return {
      icon: Award,
      text: "Dark Sky Reserve",
      color: "text-blue-400",
      certType: "reserve"
    };
  }
  
  if (location.certification) {
    return {
      icon: ShieldCheck,
      text: "Certified Dark Sky",
      color: "text-indigo-400",
      certType: "certified"
    };
  }
  
  return null;
};

export const getLocalizedCertText = (certType, language) => {
  if (certType === "reserve" || certType === "certified") {
    return language === 'en' 
      ? certType === "reserve" ? "Dark Sky Reserve" : "Certified Dark Sky"
      : certType === "reserve" ? "暗夜保护区" : "认证暗夜地区";
  }
  
  // For backward compatibility with the old format that used text directly
  return language === 'en' 
    ? "Certified Location" 
    : "认证地点";
};
