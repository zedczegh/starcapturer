
import React from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

interface StatusMessageProps {
  message: string | null;
  loading?: boolean;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, loading }) => {
  if (!message) return null;

  const isSuccess = message.toLowerCase().includes("found") || 
                   message.toLowerCase().includes("selected") ||
                   message.toLowerCase().includes("已找到") || 
                   message.toLowerCase().includes("已选择");

  return (
    <div className="text-sm mt-2 mb-4">
      <div className="flex items-center">
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 text-green-500 animate-spin" />
        ) : isSuccess ? (
          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
        ) : (
          <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
        )}
        <span>{message}</span>
      </div>
    </div>
  );
};

export default StatusMessage;
