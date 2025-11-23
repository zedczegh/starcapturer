import React from 'react';
import PreferencesForm from "@/components/preferences/PreferencesForm";
import NavBar from "@/components/NavBar";

const PreferencesPage = () => (
  <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-cosmic-900 flex flex-col">
    <NavBar />
    <main className="w-full mx-auto pt-20 pb-16 px-3 sm:px-4 sm:container sm:max-w-xl flex-grow">
      <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-4 sm:mb-6 px-1">Preferences</h1>
      <PreferencesForm />
    </main>
  </div>
);

export default PreferencesPage;
