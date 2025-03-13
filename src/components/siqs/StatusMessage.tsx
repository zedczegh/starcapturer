
import React from "react";

interface StatusMessageProps {
  message: string | null;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message }) => {
  if (!message) return null;
  
  return (
    <div className="mb-4 p-3 bg-background/70 border border-border rounded-md text-sm animate-fade-in">
      {message}
    </div>
  );
};

export default StatusMessage;
