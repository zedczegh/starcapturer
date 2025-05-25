
import React from "react";
import { Link, Location } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { MapPin, Users, MessageSquare, Map, Star } from "lucide-react";
import SiqsNavButton from "./SiqsNavButton";
import { NotificationBadge } from "@/components/ui/notification-badge";

interface MobileNavProps {
  location: Location;
  locationId: string | null;
  notificationCounts?: {
    unreadMessages: number;
    newReservations: number;
  };
}

const MobileNav: React.FC<MobileNavProps> = ({ 
  location, 
  locationId, 
  notificationCounts = { unreadMessages: 0, newReservations: 0 }
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-cosmic-900/95 backdrop-blur-lg border-t border-cosmic-700/40">
      <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
        <Button
          variant={location.pathname === "/photo-points" ? "default" : "ghost"}
          asChild
          size="sm"
          className="flex-col h-auto py-1.5 px-2 text-xs gap-1"
        >
          <Link to="/photo-points">
            <Map className="h-4 w-4" />
            <span className="text-xs">{t("Points", "观星点")}</span>
          </Link>
        </Button>

        <Button
          variant={location.pathname === "/community" ? "default" : "ghost"}
          asChild
          size="sm"
          className="flex-col h-auto py-1.5 px-2 text-xs gap-1"
        >
          <Link to="/community">
            <Users className="h-4 w-4" />
            <span className="text-xs">{t("Community", "社区")}</span>
          </Link>
        </Button>

        {user && (
          <>
            <div className="relative">
              <Button
                variant={location.pathname === "/messages" ? "default" : "ghost"}
                asChild
                size="sm"
                className="flex-col h-auto py-1.5 px-2 text-xs gap-1"
              >
                <Link to="/messages">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">{t("Messages", "消息")}</span>
                </Link>
              </Button>
              <NotificationBadge count={notificationCounts.unreadMessages} />
            </div>

            <div className="relative">
              <Button
                variant={location.pathname === "/manage-astro-spots" ? "default" : "ghost"}
                asChild
                size="sm"
                className="flex-col h-auto py-1.5 px-2 text-xs gap-1"
              >
                <Link to="/manage-astro-spots">
                  <Star className="h-4 w-4" />
                  <span className="text-xs">{t("My Spots", "我的点")}</span>
                </Link>
              </Button>
              <NotificationBadge count={notificationCounts.newReservations} />
            </div>
          </>
        )}

        <SiqsNavButton locationId={locationId} />
      </div>
    </nav>
  );
};

export default MobileNav;
