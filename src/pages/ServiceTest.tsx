
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import ComprehensiveServiceTest from '@/components/test/ComprehensiveServiceTest';
import MapServiceTest from '@/components/test/MapServiceTest';
import NavBar from '@/components/NavBar';

const ServiceTest: React.FC = () => {
  const { t } = useLanguage();

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gradient-to-br from-cosmic-900 via-cosmic-800 to-cosmic-900 p-4">
        <div className="max-w-6xl mx-auto space-y-8 pt-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('Service Testing Dashboard', '服务测试面板')}
            </h1>
            <p className="text-cosmic-200">
              {t('Test all services and verify functionality across different environments', '测试所有服务并验证不同环境下的功能')}
            </p>
          </div>

          <ComprehensiveServiceTest />
          
          <div className="grid md:grid-cols-2 gap-6">
            <MapServiceTest />
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceTest;
