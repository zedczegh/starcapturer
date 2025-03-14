
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import PhotoPointsNearby from './pages/PhotoPointsNearby';
import LocationDetails from './pages/LocationDetails';
import ShareLocation from './pages/ShareLocation';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/photo-points" element={<PhotoPointsNearby />} />
      <Route path="/location/:locationId" element={<LocationDetails />} />
      <Route path="/share" element={<ShareLocation />} />
    </Routes>
  );
}

export default App;
