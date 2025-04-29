
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface CopyLocationButtonProps {
  latitude: number;
  longitude: number;
  name?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const CopyLocationButton: React.FC<CopyLocationButtonProps> = ({
  latitude,
  longitude,
  name,
  variant = "default",
  size = "default",
  className = ""
}) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopyLocation = () => {
    // Format coordinates
    const coordText = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    
    // Add location name if provided
    const fullText = name 
      ? `${name}: ${coordText}`
      : coordText;
    
    // Copy to clipboard
    navigator.clipboard.writeText(fullText)
      .then(() => {
        setCopied(true);
        toast.success(t("Coordinates copied to clipboard", "坐标已复制到剪贴板"));
        
        // Reset state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy coordinates:", err);
        toast.error(t("Failed to copy coordinates", "无法复制坐标"));
      });
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleCopyLocation}
    >
      {copied ? (
        <Check className="h-4 w-4 mr-1" />
      ) : (
        <Copy className="h-4 w-4 mr-1" />
      )}
      {t("Copy Location", "复制位置")}
    </Button>
  );
};

export default CopyLocationButton;
