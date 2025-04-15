
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import NavBar from '@/components/NavBar';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, Home } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen">
      <NavBar />
      
      <div className="container mx-auto px-4 flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full text-center glassmorphism rounded-xl p-10">
          <div className="inline-flex items-center justify-center p-4 bg-cosmic-800/50 rounded-full mb-6">
            <AlertTriangle className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <h2 className="text-xl mb-4">{t("Page Not Found", "页面未找到")}</h2>
          
          <p className="text-muted-foreground mb-8">
            {t("The page you're looking for doesn't exist or has been moved.", 
              "您寻找的页面不存在或已被移动。")}
          </p>
          
          <Button size="lg" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              {t("Back to Home", "返回首页")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
