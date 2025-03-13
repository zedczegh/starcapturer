
import React from "react";
import StatusMessage from "@/components/StatusMessage";

interface StatusMessageProps {
  message: string | null;
}

const SIQSStatusMessage: React.FC<StatusMessageProps> = ({ message }) => {
  return <StatusMessage message={message} />;
};

export default SIQSStatusMessage;
