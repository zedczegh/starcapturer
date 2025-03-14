import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Map from './pages/Map';
import LocationDetails from './pages/LocationDetails';
import SavedLocations from './pages/SavedLocations';
import Settings from './pages/Settings';
import ShareLocation from './pages/ShareLocation';
import PhotoPointsNearby from './pages/PhotoPointsNearby';
import CurrentLocation from './pages/CurrentLocation';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/map" element={<Map />} />
      <Route path="/location/:locationId" element={<LocationDetails />} />
      <Route path="/locations" element={<SavedLocations />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/share" element={<ShareLocation />} />
      <Route path="/photo-points" element={<PhotoPointsNearby />} />
      <Route path="/current-location" element={<CurrentLocation />} />
    </Routes>
  );
}

export default App;
