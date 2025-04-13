
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

const ViewAllButton: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="mt-4 flex justify-center">
      <Link to="/photo-points">
        <Button
          variant="ghost"
          size="sm"
          className="bg-gradient-to-r from-blue-500/10 to-green-500/10 hover:from-blue-500/20 hover:to-green-500/20 text-primary/90 hover:text-primary"
        >
          {t("View All Photo Points", "查看所有摄影点")}
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
};

export default ViewAllButton;
