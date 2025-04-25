
import React from 'react';
import { motion } from 'framer-motion';
import SIQSScore from '../SIQSScore';
import { animationVariants } from './utils/animationUtils';

interface ScoreDisplayProps {
  siqsScore: number | null;
  latitude: number;
  longitude: number;
  locationName: string | null;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  siqsScore,
  latitude,
  longitude,
  locationName
}) => {
  if (siqsScore === null) return null;

  return (
    <motion.div 
      variants={animationVariants} 
      transition={{ delay: 0.2 }}
    >
      <SIQSScore 
        siqsScore={siqsScore}
        latitude={latitude}
        longitude={longitude}
        locationName={locationName}
      />
    </motion.div>
  );
};

export default ScoreDisplay;
