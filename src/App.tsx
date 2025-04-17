
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LocationDetails from './pages/LocationDetails';
import PhotoPointsNearby from './pages/PhotoPointsNearby';
import NotFound from './pages/NotFound';
import AboutSIQS from './pages/AboutSIQS';
import About from './pages/About';
import UsefulLinks from './pages/UsefulLinks';
import ShareLocation from './pages/ShareLocation';
import './App.css';

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <LanguageProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LocationDetails />} />
              <Route path="/location/:id" element={<LocationDetails />} />
              <Route path="/photo-points" element={<PhotoPointsNearby />} />
              <Route path="/about-siqs" element={<AboutSIQS />} />
              <Route path="/about" element={<About />} />
              <Route path="/links" element={<UsefulLinks />} />
              <Route path="/useful-links" element={<UsefulLinks />} />
              <Route path="/share" element={<ShareLocation />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </LanguageProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
