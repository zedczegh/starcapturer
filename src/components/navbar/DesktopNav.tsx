import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Moon, Sun, MessageCircle } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

// Modify the component to accept unreadCount
const DesktopNav = ({ 
  location, 
  locationId,
  unreadCount = 0
}: { 
  location: ReturnType<typeof useLocation>,
  locationId: string | null
  unreadCount?: number
}) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { t, changeLanguage } = useLanguage();
  const pathname = location.pathname;

  return (
    <div className="hidden md:flex items-center space-x-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            className="text-cosmic-300 hover:bg-cosmic-800/30 hover:text-white"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t("Toggle theme", "切换主题")}</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-cosmic-300 hover:bg-cosmic-800/30 hover:text-white"
              >
                {t("Language", "语言")}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{t("Change language", "更改语言")}</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent className="cosmic-dropdown w-40">
          <DropdownMenuItem onClick={() => changeLanguage("en")}>
            English
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => changeLanguage("zh")}>
            中文
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Button
              size="icon"
              variant={pathname === '/messages' ? 'secondary' : 'ghost'}
              className={cn(
                "text-cosmic-300",
                pathname === '/messages' 
                  ? "bg-cosmic-800/60 text-white" 
                  : "hover:bg-cosmic-800/30 hover:text-white"
              )}
              asChild
            >
              <Link to="/messages">
                <MessageCircle 
                  className={cn(
                    "h-5 w-5",
                    pathname === '/messages' ? "text-white" : ""
                  )} 
                />
              </Link>
            </Button>
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] flex items-center justify-center rounded-full bg-primary text-white text-xs px-1"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t("Messages", "消息")}</p>
        </TooltipContent>
      </Tooltip>

      <ProfileButton />
    </div>
  );
};

export default DesktopNav;
