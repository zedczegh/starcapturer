
import React from "react";
import StatusMessage from "@/components/StatusMessage";

interface LocationStatusMessageProps {
  message: string | null;
  type?: 'info' | 'success' | 'error';
  onClear?: () => void;
}

const LocationStatusMessage: React.FC<LocationStatusMessageProps> = (props) => {
  return <StatusMessage {...props} />;
};

export default LocationStatusMessage;
