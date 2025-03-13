
import React, { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

interface StatusMessageProps {
  message: string | null;
  type?: 'info' | 'success' | 'error';
  onClear?: () => void;
  autoHideDuration?: number;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ 
  message, 
  type = 'info',
  onClear,
  autoHideDuration = 3000
}) => {
  const { t } = useLanguage();
  
  useEffect(() => {
    if (message && onClear && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClear();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [message, onClear, autoHideDuration]);
  
  if (!message) return null;
  
  const bgClass = type === 'error' 
    ? 'bg-destructive/15 text-destructive border-destructive/30' 
    : type === 'success'
      ? 'bg-green-500/15 text-green-400 border-green-500/30'
      : 'bg-primary/15 text-primary-foreground/90 border-primary/30';
  
  const Icon = type === 'error' 
    ? AlertCircle 
    : type === 'success'
      ? CheckCircle
      : Info;
  
  return (
    <div className={`mb-4 p-3 rounded-md flex items-start ${bgClass} border shadow-lg animate-fade-in`}>
      <Icon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
      <div className="flex-1">{message}</div>
      {onClear && (
        <button 
          onClick={onClear} 
          className="ml-2 text-current opacity-70 hover:opacity-100 transition-opacity"
          aria-label={t("Clear message", "清除消息")}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default StatusMessage;
