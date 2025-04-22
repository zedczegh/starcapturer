
import React from 'react';
import PreferencesForm from "@/components/preferences/PreferencesForm";
import NavBar from "@/components/NavBar";
import AboutFooter from '@/components/about/AboutFooter';

// Rename to match the export
export const SettingsPage = () => (
  <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900 flex flex-col">
    <NavBar />
    <main className="container max-w-xl mx-auto pt-28 pb-16 px-2 flex-grow">
      <h1 className="text-3xl font-bold text-primary mb-6">Preferences</h1>
      <PreferencesForm />
    </main>
    <AboutFooter />
  </div>
);

// Export as default as well for flexibility
export default SettingsPage;

