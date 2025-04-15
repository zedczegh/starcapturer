
import React from 'react';
import NavBar from '@/components/NavBar';
import { useLanguage } from '@/contexts/LanguageContext';

const TermsOfServicePage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-6">{t("Terms of Service", "服务条款")}</h1>
        <div className="prose max-w-none">
          <p>{t("By accessing our website, you agree to be bound by these Terms of Service.", 
            "通过访问我们的网站，您同意受这些服务条款的约束。")}</p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
