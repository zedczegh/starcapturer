import React from 'react';
import PreferencesForm from "@/components/preferences/PreferencesForm";
import NavBar from "@/components/NavBar";

const PreferencesPage = () => (
  <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-cosmic-900 flex flex-col">
    <NavBar />
    <main className="container max-w-xl mx-auto pt-28 pb-16 px-2 flex-grow">
      <h1 className="text-3xl font-bold text-primary mb-6">Preferences</h1>
      <PreferencesForm />
    </main>
  </div>
);

export default PreferencesPage;
