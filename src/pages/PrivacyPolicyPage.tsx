
import React from 'react';
import NavBar from '@/components/NavBar';
import { useLanguage } from '@/contexts/LanguageContext';

const PrivacyPolicyPage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-6">{t("Privacy Policy", "隐私政策")}</h1>
        <div className="prose max-w-none">
          <p>{t("This Privacy Policy describes how we collect, use, and disclose your information when you use our service.", 
            "本隐私政策描述了我们在您使用我们的服务时如何收集、使用和披露您的信息。")}</p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
