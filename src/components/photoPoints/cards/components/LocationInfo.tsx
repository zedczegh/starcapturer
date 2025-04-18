
import React from 'react';
import { LightPollutionIndicator } from '@/components/location/LightPollutionIndicator';
import LocationMetadata from '../LocationMetadata';
import { getCertificationInfo, getLocalizedCertText } from '../utils/certificationUtils';
import { SharedAstroSpot } from '@/lib/api/astroSpots';

interface LocationInfoProps {
  location: SharedAstroSpot;
  certInfo: ReturnType<typeof getCertificationInfo>;
  displayName: string;
  language: string;
}

const LocationInfo: React.FC<LocationInfoProps> = ({
  location,
  certInfo,
  displayName,
  language
}) => {
  return (
    <>
      {certInfo && (
        <div className="flex items-center mt-1.5 mb-2">
          <div className={`px-2 py-0.5 rounded-full text-xs flex items-center ${certInfo.color}`}>
            {React.createElement(certInfo.icon, { className: "h-4 w-4 mr-1.5" })}
            <span>{getLocalizedCertText(certInfo, language)}</span>
          </div>
        </div>
      )}

      <div className="mb-4 mt-2">
        <LightPollutionIndicator 
          bortleScale={location.bortleScale || 5} 
          size="md"
          showBortleNumber={true}
          className="text-base"
        />
      </div>

      <LocationMetadata 
        distance={location.distance} 
        date={location.date}
        latitude={location.latitude}
        longitude={location.longitude}
        locationName={displayName}
      />
    </>
  );
};

export default LocationInfo;
