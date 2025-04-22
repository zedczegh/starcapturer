
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import IndexPage from '@/pages/Index';
import PhotoPointsNearby from '@/pages/PhotoPointsNearby';
import LocationDetails from '@/pages/LocationDetails';
import Collections from '@/pages/Collections';
import { ProfilePage } from '@/pages/Profile';
import { SettingsPage } from '@/pages/Preferences';
import NavBar from '@/components/NavBar';
import AuthRequired from '@/components/auth/AuthRequired';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import './App.css';
import CreateAstroSpot from '@/pages/CreateAstroSpot';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/photo-points" element={<PhotoPointsNearby />} />
      <Route path="/location/:locationId" element={<LocationDetails />} />
      <Route path="/collections" element={<AuthRequired><Collections /></AuthRequired>} />
      <Route path="/profile" element={<AuthRequired><ProfilePage /></AuthRequired>} />
      <Route path="/settings" element={<AuthRequired><SettingsPage /></AuthRequired>} />
      <Route path="/create-astro-spot" element={<CreateAstroSpot />} />
    </Routes>
  );
};

export default App;
