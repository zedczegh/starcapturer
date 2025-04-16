
import React from "react";
import HeroContent from "./index/HeroContent";
import { COSMIC_NEBULA_BG } from "@/assets/index";

const Hero = () => {
  return (
    <div className="relative overflow-hidden pt-20">
      {/* Add the cosmic nebula background with opacity */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50 -z-10"
        style={{ backgroundImage: `url(${COSMIC_NEBULA_BG})` }}
      />
      <HeroContent />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cosmic-900 to-transparent z-10"></div>
    </div>
  );
};

export default Hero;
