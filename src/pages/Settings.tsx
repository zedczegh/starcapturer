
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import AboutFooter from '@/components/about/AboutFooter';
import { Card } from '@/components/ui/card';
import { Settings as SettingsIcon } from 'lucide-react';

const Settings: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
      <NavBar />
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <SettingsIcon className="w-8 h-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-white">
              {t('Settings', '设置')}
            </h1>
          </div>
          
          <Card className="glassmorphism p-6">
            <p className="text-cosmic-300 text-center">
              {t('Settings page coming soon...', '设置页面即将推出...')}
            </p>
          </Card>
        </div>
      </main>
      <AboutFooter />
    </div>
  );
};

export default Settings;
