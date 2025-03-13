
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { shareAstroSpot, SharedAstroSpot } from "@/lib/api";
import { Share, Camera, X, Upload, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ShareLocationFormProps {
  userLocation?: { latitude: number; longitude: number; name?: string } | null;
  siqs?: number;
  isViable?: boolean;
  onClose?: () => void;
}

const ShareLocationForm: React.FC<ShareLocationFormProps> = ({
  userLocation,
  siqs = 0,
  isViable = false,
  onClose
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState(userLocation?.name || "");
  const [latitude, setLatitude] = useState(userLocation?.latitude?.toString() || "");
  const [longitude, setLongitude] = useState(userLocation?.longitude?.toString() || "");
  const [description, setDescription] = useState("");
  const [photographer, setPhotographer] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [targets, setTargets] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !latitude || !longitude || !description.trim() || !photographer.trim()) {
      toast({
        title: t("Missing Information", "缺少信息"),
        description: t("Please fill in all required fields.", "请填写所有必填字段。"),
        variant: "destructive",
      });
      return;
    }
    
    // Parse coordinates
    const latValue = parseFloat(latitude);
    const longValue = parseFloat(longitude);
    
    if (isNaN(latValue) || isNaN(longValue)) {
      toast({
        title: t("Invalid Coordinates", "无效坐标"),
        description: t("Please enter valid latitude and longitude values.", "请输入有效的纬度和经度值。"),
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Process targets into an array
      const targetsArray = targets
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);
        
      // Share the astro spot
      shareAstroSpot({
        name,
        latitude: latValue,
        longitude: longValue,
        description,
        bortleScale: 4, // Default value
        photographer,
        photoUrl: photoUrl || undefined,
        targets: targetsArray.length > 0 ? targetsArray : undefined,
        siqs: siqs || 0,
        isViable: isViable || false,
        timestamp: new Date().toISOString(),
      });
      
      toast({
        title: t("Location Shared", "位置已分享"),
        description: t("Thank you for sharing your astrophotography spot!", "感谢您分享您的天文摄影点！"),
      });
      
      // Reset form
      setName("");
      setDescription("");
      setPhotographer("");
      setPhotoUrl("");
      setTargets("");
      
      // Close the form if callback provided
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error("Error sharing location:", error);
      toast({
        title: t("Error", "错误"),
        description: t("Failed to share location. Please try again.", "分享位置失败。请重试。"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Share className="h-5 w-5 mr-2 text-primary" />
            <CardTitle>{t("Share Your Astrophotography Spot", "分享您的天文摄影点")}</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          {t("Share your favorite stargazing location with the community", "与社区分享您最喜欢的观星地点")}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("Location Name *", "位置名称 *")}</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder={t("e.g., Mount Wilson Observatory", "例如，威尔逊山天文台")}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">{t("Latitude *", "纬度 *")}</Label>
              <Input 
                id="latitude" 
                value={latitude} 
                onChange={(e) => setLatitude(e.target.value)} 
                placeholder="e.g., 34.2256"
                required
                type="number"
                step="0.000001"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="longitude">{t("Longitude *", "经度 *")}</Label>
              <Input 
                id="longitude" 
                value={longitude} 
                onChange={(e) => setLongitude(e.target.value)} 
                placeholder="e.g., -118.0692"
                required
                type="number"
                step="0.000001"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">{t("Description *", "描述 *")}</Label>
            <Textarea 
              id="description" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder={t("Describe the location and what makes it good for astrophotography...", "描述此位置及其适合天文摄影的原因...")}
              required
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="photographer">{t("Your Name/Username *", "您的姓名/用户名 *")}</Label>
            <Input 
              id="photographer" 
              value={photographer} 
              onChange={(e) => setPhotographer(e.target.value)} 
              placeholder="e.g., StarChaser42"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="targets">{t("Recommended Targets (comma-separated)", "推荐目标（逗号分隔）")}</Label>
            <Input 
              id="targets" 
              value={targets} 
              onChange={(e) => setTargets(e.target.value)} 
              placeholder="e.g., Andromeda Galaxy, Pleiades, Jupiter"
            />
            <p className="text-xs text-muted-foreground">
              {t("List astronomical objects that are good to photograph from this location", "列出适合从该位置拍摄的天文对象")}
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="photoUrl">{t("Photo URL", "照片URL")}</Label>
            <Input 
              id="photoUrl" 
              value={photoUrl} 
              onChange={(e) => setPhotoUrl(e.target.value)} 
              placeholder="https://example.com/your-astrophoto.jpg"
            />
            <p className="text-xs text-muted-foreground">
              {t("Share a URL to a photo you've taken at this location", "分享您在该位置拍摄的照片的URL")}
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose}>
                {t("Cancel", "取消")}
              </Button>
            )}
            
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("Sharing...", "分享中...")}
                </>
              ) : (
                <>
                  <Share className="h-4 w-4 mr-2" />
                  {t("Share Location", "分享位置")}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ShareLocationForm;
