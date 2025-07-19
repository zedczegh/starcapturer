import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck } from 'lucide-react';
import VerificationApplicationForm from './VerificationApplicationForm';

interface VerificationButtonProps {
  spotId: string;
  spotName: string;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  isCreator: boolean;
  onStatusUpdate: () => void;
}

const VerificationButton: React.FC<VerificationButtonProps> = ({
  spotId,
  spotName,
  verificationStatus,
  isCreator,
  onStatusUpdate
}) => {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);

  if (!isCreator || verificationStatus === 'verified') {
    return null;
  }

  const getButtonText = () => {
    switch (verificationStatus) {
      case 'pending':
        return t('Application Pending', '申请待审核');
      case 'rejected':
        return t('Reapply for Verification', '重新申请验证');
      default:
        return t('Apply for Verification', '申请验证');
    }
  };

  const isDisabled = verificationStatus === 'pending';

  return (
    <>
      <Button
        onClick={() => setShowForm(true)}
        disabled={isDisabled}
        variant="outline"
        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 disabled:opacity-50"
      >
        <Shield className="h-4 w-4 mr-2" />
        {getButtonText()}
      </Button>

      <VerificationApplicationForm
        spotId={spotId}
        spotName={spotName}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={onStatusUpdate}
      />
    </>
  );
};

export default VerificationButton;