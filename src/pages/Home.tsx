
import React from 'react';
import { Container } from '@/components/ui/container';
import HeroSection from '@/components/index/HeroSection';
import ScienceSection from '@/components/index/ScienceSection';
import PhotoPointsSection from '@/components/index/PhotoPointsSection';
import CalculatorSection from '@/components/index/CalculatorSection';
import Footer from '@/components/index/Footer';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <Container>
        <ScienceSection />
        <PhotoPointsSection />
        <CalculatorSection />
        <Footer />
      </Container>
    </div>
  );
};

export default HomePage;
