
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import PhotoPointsLayout from '@/components/photoPoints/PhotoPointsLayout';
import PhotoPointsView from '@/components/photoPoints/PhotoPointsView';

const PhotoPoints: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <PhotoPointsLayout pageTitle={t("Photo Points | SIQS", "拍摄点 | SIQS")}>
      <PhotoPointsView />
    </PhotoPointsLayout>
  );
};

export default PhotoPoints;
