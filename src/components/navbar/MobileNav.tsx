
import React from "react";
import { useLocation } from "react-router-dom";
import { Telescope, Map, Smartphone, Link2, Info, Users } from "lucide-react";
import { MobileNavButton } from "./NavButtons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMessageConversation } from "@/hooks/messaging/useMessageConversation";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileNavProps {
  location: ReturnType<typeof useLocation>;
  locationId: string | null;
}

const MobileNav: React.FC<MobileNavProps> = ({
  location,
  locationId
}) => {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const { activeConversation } = useMessageConversation();

  // Hide the mobile nav when in message conversation on mobile
  if (isMobile && activeConversation && location.pathname === "/messages") {
    return null;
  }

  // Use a default location ID for when there isn't one
  const detailsPath = locationId ? `/location/${locationId}` : '/location/default';

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 mobile-nav-bar">
      <div className="flex justify-around items-center py-3 px-2 bg-[#123341]/[0.84] backdrop-blur-xl border-t border-cosmic-100/10">
        <MobileNavButton 
          to="/photo-points" 
          icon={<Telescope className="h-5 w-5" />} 
          label={t("Photo", "拍摄")} 
          active={location.pathname === "/photo-points"} 
        />
        
        <MobileNavButton 
          to={detailsPath}
          icon={<Map className="h-5 w-5" />} 
          label={t("Location", "位置")} 
          active={location.pathname.startsWith('/location/')} 
        />

        <MobileNavButton
          to="/community"
          icon={<Users className="h-5 w-5" />}
          label={t("Community", "社区")}
          active={location.pathname === "/community"}
        />

        <MobileNavButton 
          to="/share" 
          icon={<Smartphone className="h-5 w-5" />} 
          label={t("Bortle", "光污染")} 
          active={location.pathname === "/share"} 
        />
        
        <MobileNavButton 
          to="/useful-links" 
          icon={<Link2 className="h-5 w-5" />} 
          label={t("Links", "资源")} 
          active={location.pathname === "/useful-links"} 
        />
        
        <MobileNavButton 
          to="/about" 
          icon={<Info className="h-5 w-5" />} 
          label={t("About", "关于")} 
          active={location.pathname === "/about"} 
        />
      </div>
    </div>
  );
};

export default MobileNav;
