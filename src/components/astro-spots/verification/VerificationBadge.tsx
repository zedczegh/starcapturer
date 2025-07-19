import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface VerificationBadgeProps {
  status: 'unverified' | 'pending' | 'verified' | 'rejected';
  className?: string;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({ status, className = '' }) => {
  const { t } = useLanguage();

  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          label: t('Verified', '已验证'),
          icon: CheckCircle,
          className: 'bg-green-500/20 text-green-400 border-green-500/30'
        };
      case 'pending':
        return {
          label: t('Pending Review', '待审核'),
          icon: Clock,
          className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
        };
      case 'rejected':
        return {
          label: t('Rejected', '已拒绝'),
          icon: XCircle,
          className: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
      default:
        return {
          label: t('Unverified', '未验证'),
          icon: AlertCircle,
          className: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className} flex items-center gap-1.5 px-2 py-1`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
};

export default VerificationBadge;