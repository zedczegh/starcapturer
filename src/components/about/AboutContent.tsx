
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import AboutIntro from "./AboutIntro";
import LocationDiscoverySection from "./LocationDiscoverySection";
import SiqsSection from "./SiqsSection";
import ScienceSection from "./ScienceSection";

export const AboutContent = () => {
  const { t } = useLanguage();
  
  return (
    <div className="space-y-6">
      <AboutIntro />
      <LocationDiscoverySection />
      <SiqsSection />
      <ScienceSection />
    </div>
  );
};

export default AboutContent;
