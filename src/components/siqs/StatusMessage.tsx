
import React from "react";
import { AlertCircle, CheckCircle, Info } from "lucide-react";

interface StatusMessageProps {
  message: string | null;
  type?: 'info' | 'success' | 'error';
}

const StatusMessage: React.FC<StatusMessageProps> = ({ 
  message, 
  type = 'info' 
}) => {
  if (!message) return null;
  
  const getBgColor = () => {
    switch (type) {
      case 'success': return "bg-green-500/10 border-green-500/30";
      case 'error': return "bg-red-500/10 border-red-500/30";
      default: return "bg-blue-500/10 border-blue-500/30";
    }
  };
  
  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };
  
  return (
    <div className={`mb-4 p-3 ${getBgColor()} border rounded-md text-sm animate-fade-in flex items-center gap-2`}>
      {getIcon()}
      <span>{message}</span>
    </div>
  );
};

export default StatusMessage;
