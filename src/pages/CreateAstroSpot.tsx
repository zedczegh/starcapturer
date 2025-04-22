
import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import CreateAstroSpotDialog from '@/components/astro-spots/CreateAstroSpotDialog';

interface LocationState {
  latitude: number;
  longitude: number;
  name?: string;
}

const CreateAstroSpot: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;

  // If accessed directly without coordinates, redirect to home
  if (!state?.latitude || !state?.longitude) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background/95 backdrop-blur-sm">
      <CreateAstroSpotDialog
        latitude={state.latitude}
        longitude={state.longitude}
        defaultName={state.name}
      />
    </div>
  );
};

export default CreateAstroSpot;
