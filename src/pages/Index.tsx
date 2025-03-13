
import React, { useEffect } from "react";
import { useQueryClient } from '@tanstack/react-query';
import { prefetchPopularLocations } from '@/lib/queryPrefetcher';
import HeroSection from "@/components/index/HeroSection";
import CalculatorSection from "@/components/index/CalculatorSection";
import ScienceSection from "@/components/index/ScienceSection";
import PhotoPointsSection from "@/components/index/PhotoPointsSection";
import Footer from "@/components/index/Footer";

const Index = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    prefetchPopularLocations(queryClient);
  }, [queryClient]);

  return (
    <div className="min-h-screen">
      <HeroSection />
      <CalculatorSection />
      <ScienceSection />
      <PhotoPointsSection />
      <Footer />
    </div>
  );
};

export default Index;
