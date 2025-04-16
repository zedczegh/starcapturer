
import React from "react";
import HeroContent from "./index/HeroContent";
import BackgroundWrapper from "./layout/BackgroundWrapper";

const Hero = () => {
  return (
    <BackgroundWrapper>
      <div className="relative overflow-hidden pt-20">
        <HeroContent />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cosmic-900 to-transparent z-10"></div>
      </div>
    </BackgroundWrapper>
  );
};

export default Hero;
