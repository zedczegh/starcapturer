import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from './contexts/LanguageContext';
import { initializeApp } from "./services/appInitService";
import Layout from './components/layout/Layout';
import PhotoPointsNearby from './pages/PhotoPointsNearby';
import LocationDetails from './pages/LocationDetails';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  // Initialize app on startup
  useEffect(() => {
    initializeApp();
  }, []);

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/photopoints" />} />
            <Route path="/photopoints" element={<PhotoPointsNearby />} />
            <Route path="/location/:id" element={<LocationDetails />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </LanguageProvider>
  );
};

export default App;
