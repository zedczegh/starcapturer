
import React from 'react';
import TestForecastAstro from '@/components/forecast/TestForecastAstro';

export default function TestForecastRoute() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Astronomical Forecast Testing</h1>
      <div className="mb-4 text-gray-600">
        This page demonstrates the enhanced forecast service with improved intelligence and batch processing capabilities.
      </div>
      <TestForecastAstro />
    </div>
  );
}
