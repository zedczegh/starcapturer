
import React from "react";
import BackButton from "@/components/navigation/BackButton";
import CopyLocationButton from "./CopyLocationButton";

interface LocationControlsSectionProps {
  locationData: any;
  isMobile: boolean;
}

const LocationControlsSection: React.FC<LocationControlsSectionProps> = ({
  locationData,
  isMobile
}) => {
  // Conditionally render back and copy buttons only if not mobile
  if (isMobile) {
    return null;
  }

  return (
    <div className="mt-6 flex justify-between items-center gap-4">
      <BackButton />
      {locationData?.latitude && locationData?.longitude && (
        <CopyLocationButton
          latitude={locationData.latitude}
          longitude={locationData.longitude}
          name={locationData.name}
          variant="outline"
          size="default"
        />
      )}
    </div>
  );
};

export default LocationControlsSection;

