
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, MapPin } from "lucide-react";
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
        toast.success(
          t("Coordinates copied", "坐标已复制"), 
          { description: fullText }
        );
        
        // Reset state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy coordinates:", err);
        toast.error(
          t("Failed to copy coordinates", "复制坐标失败"), 
          { description: t("Please try again", "请重试") }
        );
      });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopyLocation}
      className={`${className} group transition-all duration-300`}
      disabled={copied}
    >
      {copied ? (
        <Check className="h-4 w-4 mr-2 text-green-400" />
      ) : (
        <MapPin className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
      )}
      {copied
        ? t("Copied!", "已复制！")
        : t("Copy Location", "复制位置")}
    </Button>
  );
};

export default CopyLocationButton;
