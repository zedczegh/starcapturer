
import React, { Suspense } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LazyComprehensiveServiceTest, LazyMapServiceTest } from '@/components/lazy/LazyServiceTest';
import NavBar from '@/components/NavBar';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-2 text-muted-foreground">Loading tests...</span>
  </div>
);

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

          <Suspense fallback={<LoadingSpinner />}>
            <LazyComprehensiveServiceTest />
          </Suspense>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Suspense fallback={<LoadingSpinner />}>
              <LazyMapServiceTest />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServiceTest;
