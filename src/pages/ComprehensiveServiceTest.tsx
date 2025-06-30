
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import NavBar from '@/components/NavBar';
import AboutFooter from '@/components/about/AboutFooter';
import { Card } from '@/components/ui/card';
import { TestTube } from 'lucide-react';

const ComprehensiveServiceTest: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-950 to-cosmic-900">
      <NavBar />
      <main className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center mb-8">
            <TestTube className="w-8 h-8 text-primary mr-3" />
            <h1 className="text-3xl font-bold text-white">
              {t('Service Test', '服务测试')}
            </h1>
          </div>
          
          <Card className="glassmorphism p-6">
            <p className="text-cosmic-300 text-center">
              {t('Comprehensive service testing dashboard coming soon...', '综合服务测试面板即将推出...')}
            </p>
          </Card>
        </div>
      </main>
      <AboutFooter />
    </div>
  );
};

export default ComprehensiveServiceTest;
