
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, MapPin, Images, Info, Home } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface MobileNavProps {
  location: {
    pathname: string;
  };
  locationId?: string | null;
  isHomepage?: boolean;
}

const MobileNav: React.FC<MobileNavProps> = ({ location, locationId, isHomepage = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  // Close menu when clicking a link
  const closeMenu = () => setIsOpen(false);
  
  // On homepage, handle navigation differently
  const isLocationPage = locationId || isHomepage;
  
  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full bg-cosmic-950/80 text-white backdrop-blur-sm"
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-cosmic-950/95 backdrop-blur-md flex flex-col md:hidden"
          >
            <div className="flex justify-between items-center p-4">
              <Link to="/" onClick={closeMenu} className="flex items-center">
                <span className="text-xl font-semibold text-white">SIQS</span>
              </Link>
              <LanguageSwitcher />
            </div>

            <nav className="flex flex-col space-y-2 p-4 mt-4">
              <Link
                to="/"
                onClick={closeMenu}
                className={`flex items-center p-3 rounded-lg ${
                  isLocationPage ? "bg-cosmic-800/50 text-white" : "text-cosmic-200"
                }`}
              >
                <MapPin className="w-5 h-5 mr-3" />
                {t("Location", "位置")}
              </Link>
              
              <Link
                to="/photo-points"
                onClick={closeMenu}
                className={`flex items-center p-3 rounded-lg ${
                  location.pathname === "/photo-points" ? "bg-cosmic-800/50 text-white" : "text-cosmic-200"
                }`}
              >
                <Images className="w-5 h-5 mr-3" />
                {t("Photo Points", "摄影点")}
              </Link>
              
              <Link
                to="/about"
                onClick={closeMenu}
                className={`flex items-center p-3 rounded-lg ${
                  location.pathname === "/about" ? "bg-cosmic-800/50 text-white" : "text-cosmic-200"
                }`}
              >
                <Info className="w-5 h-5 mr-3" />
                {t("About", "关于")}
              </Link>
            </nav>
            
            <div className="mt-auto p-4 text-cosmic-300 text-sm">
              <p>© 2025 SIQS</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileNav;
