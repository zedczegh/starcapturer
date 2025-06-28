
import React from 'react';
import NavBar from '@/components/NavBar';
import MapServiceTest from '@/components/test/MapServiceTest';

const MapServiceTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">
            Map Service Integration Test
          </h1>
          <p className="text-center text-muted-foreground mb-8">
            Testing Gaode Maps API integration with our service abstraction layer
          </p>
          <MapServiceTest />
        </div>
      </div>
    </div>
  );
};

export default MapServiceTestPage;
