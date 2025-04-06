
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LocationEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  locationData: any;
  onUpdateLocation: (data: any) => Promise<void>;
  language: string;
}

const LocationEditDialog: React.FC<LocationEditDialogProps> = ({
  isOpen,
  onClose,
  locationData,
  onUpdateLocation,
  language
}) => {
  const [name, setName] = useState(locationData?.name || "");
  const [bortleScale, setBortleScale] = useState(
    locationData?.bortleScale?.toString() || "5"
  );
  const [seeingConditions, setSeeingConditions] = useState(
    locationData?.seeingConditions?.toString() || "3"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      await onUpdateLocation({
        name,
        bortleScale: parseFloat(bortleScale),
        seeingConditions: parseInt(seeingConditions, 10),
      });
      
      onClose();
    } catch (error) {
      console.error("Error updating location:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-cosmic-900/90 border-cosmic-700/50 max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === 'en' ? 'Edit Location' : '编辑位置'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {language === 'en' ? 'Location Name' : '位置名称'}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === 'en' ? 'Enter location name' : '输入位置名称'}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bortleScale">
              {language === 'en' ? 'Bortle Scale (1-9)' : '波尔特尔等级 (1-9)'}
            </Label>
            <Select value={bortleScale} onValueChange={(value) => setBortleScale(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 90 }, (_, i) => (i + 10) / 10).map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value.toFixed(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="seeingConditions">
              {language === 'en' ? 'Seeing Conditions (1-5)' : '视宁度 (1-5)'}
            </Label>
            <Select value={seeingConditions} onValueChange={(value) => setSeeingConditions(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((value) => (
                  <SelectItem key={value} value={value.toString()}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {language === 'en' ? 'Cancel' : '取消'}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? (language === 'en' ? 'Saving...' : '保存中...')
                : (language === 'en' ? 'Save Changes' : '保存更改')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LocationEditDialog;
