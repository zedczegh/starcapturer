
import React from "react";
import HeroContent from "./index/HeroContent";
import StarryBackground from "./index/StarryBackground";

const Hero = () => {
  return (
    <div className="relative overflow-hidden pt-20">
      <StarryBackground />
      <HeroContent />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cosmic-900 to-transparent z-10"></div>
    </div>
  );
};

export default Hero;
