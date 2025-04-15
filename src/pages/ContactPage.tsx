
import React from 'react';
import NavBar from '@/components/NavBar';
import { useLanguage } from '@/contexts/LanguageContext';

const ContactPage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-6">{t("Contact Us", "联系我们")}</h1>
        <div className="prose max-w-none">
          <p>{t("If you have any questions or feedback, please don't hesitate to contact us.", 
            "如果您有任何问题或反馈，请随时联系我们。")}</p>
          <p>Email: info@example.com</p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
