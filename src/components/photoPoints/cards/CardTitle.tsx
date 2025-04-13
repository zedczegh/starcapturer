
import React from 'react';

interface CardTitleProps {
  title: string;
  isMobile?: boolean;
}

const CardTitle: React.FC<CardTitleProps> = ({ 
  title, 
  isMobile = false 
}) => {
  return (
    <h3 className="font-semibold text-lg line-clamp-1">
      {title}
    </h3>
  );
};

export default CardTitle;
