
import React, { ReactNode } from 'react';
import ErrorBoundary from '../ErrorBoundary';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Home, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ErrorBoundaryProviderProps {
  children: ReactNode;
}

const ErrorBoundaryProvider: React.FC<ErrorBoundaryProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const handleReset = () => {
    // Refresh the current page
    window.location.reload();
  };
  
  const handleGoHome = () => {
    // Navigate to home page
    navigate('/', { replace: true });
  };
  
  const fallbackUI = (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md p-6 bg-cosmic-900/70 rounded-lg border border-cosmic-700/50 shadow-lg">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="h-8 w-8 text-amber-500"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {t("Something went wrong", "出现了问题")}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t(
              "We encountered an unexpected error. Please try refreshing the page or go back to the home page.",
              "我们遇到了意外错误。请尝试刷新页面或返回首页。"
            )}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="default"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t("Refresh Page", "刷新页面")}
            </Button>
            <Button
              variant="outline"
              onClick={handleGoHome}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              {t("Go to Home", "返回首页")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ErrorBoundary
      fallback={fallbackUI}
      onReset={handleReset}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundaryProvider;
