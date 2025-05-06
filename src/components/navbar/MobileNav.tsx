import React from "react";
import { useLocation } from "react-router-dom";
import { Home, Map, Compass, MessageCircle, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

// Modify the component to accept unreadCount
const MobileNav = ({ 
  location, 
  locationId,
  unreadCount = 0
}: { 
  location: ReturnType<typeof useLocation>,
  locationId: string | null,
  unreadCount?: number
}) => {
  const { t } = useLanguage();
  const { pathname } = location;

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <nav className="fixed bottom-0 left-0 right-0 z-50 mobile-nav-bar backdrop-blur-lg">
        <div className="flex items-center justify-around py-2">
          <NavButton 
            to="/photo-points" 
            icon={<Home className="h-6 w-6" />} 
            label={t("Home", "首页")}
            active={pathname === '/photo-points'}
          />
          <NavButton 
            to="/community" 
            icon={<Compass className="h-6 w-6" />} 
            label={t("Community", "社区")}
            active={pathname === '/community'}
          />
          <NavButton 
            to="/share" 
            icon={<Map className="h-6 w-6" />} 
            label={t("Share", "分享")}
            active={pathname === '/share'}
          />
          <NavButton 
            to="/messages" 
            icon={<MessageCircle className="h-6 w-6" />} 
            label={t("Messages", "消息")}
            active={pathname === '/messages'}
            badge={unreadCount > 0 ? unreadCount : undefined}
          />
          <NavButton 
            to="/profile" 
            icon={<User className="h-6 w-6" />} 
            label={t("Profile", "个人资料")}
            active={pathname === '/profile'}
          />
        </div>
      </nav>
    </motion.div>
  );
};

// Modifying the NavButton component to support badges
const NavButton = ({ to, icon, label, active, badge }: { 
  to: string; 
  icon: React.ReactNode; 
  label: string;
  active: boolean;
  badge?: number;
}) => {
  return (
    <Link 
      to={to} 
      className={cn(
        "mobile-nav-item flex flex-col items-center justify-center p-1 w-1/5",
        active ? "active" : ""
      )}
    >
      <div className="relative">
        <div className={cn(
          "icon-container flex items-center justify-center p-2 rounded-full mb-1",
          active ? "bg-primary/30" : "bg-cosmic-800/30"
        )}>
          {icon}
        </div>
        {badge !== undefined && badge > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] flex items-center justify-center rounded-full bg-primary text-white text-xs px-1"
          >
            {badge > 99 ? '99+' : badge}
          </Badge>
        )}
      </div>
      <span className={cn(
        "text-xs", 
        active ? "text-white" : "text-cosmic-300"
      )}>
        {label}
      </span>
    </Link>
  );
};

export default MobileNav;
