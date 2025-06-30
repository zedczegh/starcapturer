
import React from 'react';
import NavBar from '@/components/NavBar';
import AboutFooter from '@/components/about/AboutFooter';
import SonificationProcessor from '@/components/sonification/SonificationProcessor';

const SonificationProcessorPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
      <NavBar />
      <main className="pt-16">
        <SonificationProcessor />
      </main>
      <AboutFooter />
    </div>
  );
};

export default SonificationProcessorPage;
