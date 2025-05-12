
import React from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorDisplayProps {
  errorMessage: string | null;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorMessage }) => {
  if (!errorMessage) return null;
  
  return (
    <div className="mb-4 rounded-md border border-red-800/40 bg-red-900/20 p-3 text-sm">
      <div className="flex items-center">
        <AlertTriangle className="mr-2 h-4 w-4 text-red-400" />
        <span className="text-red-200">{errorMessage}</span>
      </div>
    </div>
  );
};

export default ErrorDisplay;
