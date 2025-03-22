import React from "react";
import { Link } from "react-router-dom";
import { MoonStar } from "lucide-react";
import LanguageSwitcher from "../LanguageSwitcher";
import { cn } from "@/lib/utils";
interface NavHeaderProps {
  scrolled: boolean;
  children?: React.ReactNode;
}
const NavHeader: React.FC<NavHeaderProps> = ({
  scrolled,
  children
}) => {
  return <header className="">
      <div className="container mx-auto px-4 flex items-center justify-between bg-cosmic-700">
        <Link to="/" className="flex items-center space-x-2 z-20">
          <MoonStar className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">
            Astro<span className="text-primary">SIQS</span>
          </span>
        </Link>
        
        {children}
        
        <div className="flex md:hidden items-center space-x-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>;
};
export default NavHeader;