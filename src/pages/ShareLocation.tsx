
import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { MapPin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import BackButton from "@/components/navigation/BackButton";
import { toast } from "sonner";

// Import translation keys
import { shareLocationKeys } from "@/lib/localization/keys";

const ShareLocation: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  
  // Form state
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name || !latitude || !longitude) {
      toast.error(
        language === "en" 
          ? "Please fill in all required fields" 
          : "请填写所有必填字段"
      );
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Implement API call to share location
      // This is a placeholder for the actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success(
        language === "en" 
          ? "Location shared successfully!" 
          : "位置已成功分享！"
      );
      
      // Navigate back to home page
      navigate("/");
    } catch (error) {
      console.error("Error sharing location:", error);
      toast.error(
        language === "en" 
          ? "Failed to share location. Please try again." 
          : "分享位置失败。请重试。"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-950 bg-[url('/src/assets/star-field-bg.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      <Helmet>
        <title>{t("Share Location | Sky Viewer", "分享位置 | 天空观测")}</title>
      </Helmet>
      
      <div className="pt-20 md:pt-28 pb-20">
        <div className="container mx-auto px-4">
          <BackButton destination="/" />
          
          <div className="max-w-md mx-auto mt-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">{t("Share Your Location", "分享您的位置")}</h1>
              <p className="text-muted-foreground">
                {t("Help others discover great viewing spots by sharing your location.", "通过分享您的位置，帮助他人发现优质的观测点。")}
              </p>
            </div>
            
            <div className="glassmorphism p-6 rounded-lg border border-cosmic-600/30">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("Location Name", "位置名称")} *</Label>
                  <Input
                    id="name"
                    placeholder={t("e.g. Mountain Peak Observatory", "例如：山顶天文台")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">{t("Latitude", "纬度")} *</Label>
                    <Input
                      id="latitude"
                      placeholder="e.g. 35.6762"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      required
                      type="number"
                      step="0.0001"
                      min="-90"
                      max="90"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="longitude">{t("Longitude", "经度")} *</Label>
                    <Input
                      id="longitude"
                      placeholder="e.g. 139.6503"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      required
                      type="number"
                      step="0.0001"
                      min="-180"
                      max="180"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">{t("Description", "描述")}</Label>
                  <Textarea
                    id="description"
                    placeholder={t("Tell others what makes this location special for stargazing...", "告诉他人这个位置为何适合观星...")}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t("Processing...", "处理中...")}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Share2 className="mr-2 h-4 w-4" />
                      {t("Share Location", "分享位置")}
                    </span>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareLocation;
