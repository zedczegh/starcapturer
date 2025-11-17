import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import NavBar from '@/components/NavBar';
import WalletSection from '@/components/profile/WalletSection';
import PaymentMethodsSection from '@/components/profile/PaymentMethodsSection';

const WalletSettings = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!user) {
    navigate('/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-cosmic-950 to-slate-900">
      <NavBar />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/profile')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('Back to Profile', '返回个人资料')}
        </Button>

        <div className="space-y-6">
          {/* Wallet Section */}
          <Card className="bg-cosmic-900/90 backdrop-blur-2xl border border-primary/10 shadow-lg">
            <WalletSection />
          </Card>

          {/* Payment Methods Section */}
          <Card className="bg-cosmic-900/90 backdrop-blur-2xl border border-primary/10 shadow-lg">
            <PaymentMethodsSection />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WalletSettings;
