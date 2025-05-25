import React from "react";
import { Link, useNavigate, Location } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import SiqsNavButton from "./SiqsNavButton";
import ProfileButton from "./ProfileButton";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { MessageSquare, MapPin } from "lucide-react";

interface DesktopNavProps {
  location: Location;
  locationId: string | null;
  notificationCounts?: {
    unreadMessages: number;
    newReservations: number;
  };
}

const DesktopNav: React.FC<DesktopNavProps> = ({ 
  location, 
  locationId, 
  notificationCounts = { unreadMessages: 0, newReservations: 0 }
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="hidden md:flex items-center space-x-2">
      <div className="flex items-center space-x-1">
        <Button
          variant={location.pathname === "/photo-points" ? "default" : "ghost"}
          asChild
          size="sm"
          className="h-8 px-3 text-sm font-medium"
        >
          <Link to="/photo-points">{t("Photo Points", "观星点")}</Link>
        </Button>

        <Button
          variant={location.pathname === "/community" ? "default" : "ghost"}
          asChild
          size="sm"
          className="h-8 px-3 text-sm font-medium"
        >
          <Link to="/community">{t("Community", "社区")}</Link>
        </Button>

        {user && (
          <>
            <div className="relative">
              <Button
                variant={location.pathname === "/messages" ? "default" : "ghost"}
                asChild
                size="sm"
                className="h-8 px-3 text-sm font-medium"
              >
                <Link to="/messages">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {t("Messages", "消息")}
                </Link>
              </Button>
              <NotificationBadge count={notificationCounts.unreadMessages} />
            </div>

            <div className="relative">
              <Button
                variant={location.pathname === "/manage-astro-spots" ? "default" : "ghost"}
                asChild
                size="sm"
                className="h-8 px-3 text-sm font-medium"
              >
                <Link to="/manage-astro-spots">
                  <MapPin className="h-4 w-4 mr-1" />
                  {t("My AstroSpots", "我的观星点")}
                </Link>
              </Button>
              <NotificationBadge count={notificationCounts.newReservations} />
            </div>
          </>
        )}

        <SiqsNavButton locationId={locationId} />
      </div>

      <ProfileButton />
    </div>
  );
};

export default DesktopNav;
