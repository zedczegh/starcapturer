
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

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
        // No toast notification
        
        // Reset state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error("Failed to copy coordinates:", err);
        // No toast for errors
      });
  };

  // Button is removed on location details page, so return null to disable usage everywhere
  return null;
};

export default CopyLocationButton;
