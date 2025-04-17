
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LocationSearch from "./LocationSearch";
import { useLanguage } from "@/contexts/LanguageContext";

interface LocationSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectLocation: (location: { name: string; latitude: number; longitude: number }) => Promise<void>;
}

const LocationSearchDialog: React.FC<LocationSearchDialogProps> = ({
  open,
  onOpenChange,
  onSelectLocation
}) => {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <LocationSearch onSelectLocation={onSelectLocation} />
      </DialogContent>
    </Dialog>
  );
};

export default LocationSearchDialog;
