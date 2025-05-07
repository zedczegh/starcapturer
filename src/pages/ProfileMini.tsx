
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateProfileTag } from "@/utils/linkTranslations";
import { useMessageNavigation } from "@/hooks/useMessageNavigation";
import { fetchUserProfile } from "@/utils/profileUtils";

interface ProfileData {
  username: string | null;
  avatar_url: string | null;
  tags: string[];
}

const ProfileMini: React.FC = () => {
  const { id: profileId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();
  
  // Check if we came from messages to hide the "Send message" button
  const isFromMessages = location.state?.fromMessages;
  const { activeConversation } = useMessageNavigation();

  useEffect(() => {
    if (!profileId) return;
    
    const loadProfile = async () => {
      setLoading(true);
      try {
        const profileData = await fetchUserProfile(profileId);
        
        if (profileData) {
          setProfile({
            username: profileData.username || "Stargazer",
            avatar_url: profileData.avatar_url,
            tags: profileData.tags || [],
          });
        }
      } catch (err) {
        console.error("Exception fetching profile data:", err);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [profileId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-cosmic-900">{t("Loading...", "加载中...")}</div>;
  }
  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cosmic-900 text-white">
        <User className="w-10 h-10 mb-4 text-cosmic-400" />
        <div>{t("User not found.", "找不到用户。")}</div>
        <Button className="mt-4" onClick={() => navigate(-1)}>{t("Back", "返回")}</Button>
      </div>
    );
  }

  const handleSendMessage = () => {
    if (profileId) {
      navigate(`/messages/${profileId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950 flex flex-col items-center px-4 pt-20">
      <Card className="max-w-xl w-full mx-auto mt-4 glassmorphism p-8 rounded-xl shadow-glow">
        <div className="flex gap-4 items-center mb-8">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" className="w-20 h-20 rounded-full border-2 border-primary shadow" />
          ) : (
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-cosmic-800 border-2 border-cosmic-700 shadow-glow">
              <User className="w-10 h-10 text-cosmic-400" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">
              {profile.username ? `@${profile.username}` : t("Stargazer", "星空观察者")}
            </h2>
            {profile.tags && profile.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {profile.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs bg-primary/20 text-primary-foreground">
                    {language === 'zh' ? translateProfileTag(tag) : tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-between mt-6">
          {!isFromMessages && user && user.id !== profileId && (
            <Button
              onClick={handleSendMessage}
              className="w-full mr-2"
            >
              {t("Send Message", "发送消息")}
            </Button>
          )}
          <Button 
            variant="secondary" 
            onClick={() => navigate(-1)}
            className={isFromMessages || (user && user.id !== profileId) ? "" : "w-full"}
          >
            {t("Back", "返回")}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ProfileMini;
