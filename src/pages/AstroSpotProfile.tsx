
import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AstroSpotProfile from '@/components/astro-spots/profile/SpotProfile';

// This wrapper component ensures proper remounting of the profile
const AstroSpotProfilePage = () => {
  const { id } = useParams();
  const location = useLocation();
  
  // Using the ID and timestamp as key ensures the component fully remounts
  return <AstroSpotProfile key={`page-${id}-${location.state?.timestamp || Date.now()}`} />;
};

export default AstroSpotProfilePage;
