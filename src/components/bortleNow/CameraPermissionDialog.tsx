
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';

interface CameraPermissionDialogProps {
  open: boolean;
  onPermissionResponse: (granted: boolean) => void;
}

const CameraPermissionDialog: React.FC<CameraPermissionDialogProps> = ({
  open,
  onPermissionResponse
}) => {
  const { t } = useLanguage();
  
  return (
    <Dialog open={open} onOpenChange={() => onPermissionResponse(false)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            {t("Camera Permission Required", "需要相机权限")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "This feature needs to access your camera to measure sky brightness and count stars.",
              "此功能需要访问您的相机以测量天空亮度和计算星星数量。"
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-cosmic-300">
            {t(
              "Your privacy is important. Photos are processed locally on your device and are not uploaded or stored.",
              "您的隐私很重要。照片在您的设备上本地处理，不会上传或存储。"
            )}
          </p>
        </div>
        
        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={() => onPermissionResponse(false)}
            className="flex-1"
          >
            {t("Deny", "拒绝")}
          </Button>
          <Button
            onClick={() => onPermissionResponse(true)}
            className="flex-1"
          >
            {t("Allow", "允许")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CameraPermissionDialog;
