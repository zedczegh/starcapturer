import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, MoonStar, User } from "lucide-react";
import MapSelector from "./MapSelector";

const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const locationId = location.pathname.startsWith('/location/') 
    ? location.pathname.split('/location/')[1] 
    : null;
  
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);
  
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);
  
  const handleSIQSClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (locationId) {
      navigate(`/location/${locationId}`);
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById('calculator-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };
  
  const handleLocationSelect = (location: { name: string; latitude: number; longitude: number }) => {
    const locationId = Date.now().toString();
    navigate(`/location/${locationId}`);
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        scrolled ? "py-2 glassmorphism" : "py-4 bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <MoonStar className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold tracking-tight">
            Astro<span className="text-primary">SIQS</span>
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <NavLink to="/" active={location.pathname === "/"}>
            Home
          </NavLink>
          <a
            href={locationId ? `/location/${locationId}` : "/#calculator-section"}
            onClick={handleSIQSClick}
            className={cn(
              "relative text-sm font-medium transition-colors hover:text-primary",
              location.pathname.startsWith('/location/') ? "text-primary" : "text-foreground/70"
            )}
          >
            SIQS Now
            {location.pathname.startsWith('/location/') && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </a>
          <NavLink to="/about" active={location.pathname === "/about"}>
            About SIQS
          </NavLink>
          <NavLink to="/photo-points" active={location.pathname === "/photo-points"}>
            Photo Points Nearby
          </NavLink>
          <NavLink to="/share" active={location.pathname === "/share"}>
            Share Location
          </NavLink>
        </nav>
        
        <div className="hidden md:flex items-center space-x-2">
          <MapSelector onSelectLocation={handleLocationSelect}>
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </MapSelector>
          <Button variant="outline" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Sign In</span>
          </Button>
          <Button>Get Started</Button>
        </div>
        
        <button 
          className="md:hidden flex items-center"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>
      
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glassmorphism py-4 animate-fade-in">
          <div className="container mx-auto px-4 flex flex-col space-y-4">
            <MobileNavLink to="/" onClick={() => setMenuOpen(false)}>
              Home
            </MobileNavLink>
            <a
              href={locationId ? `/location/${locationId}` : "/#calculator-section"}
              onClick={(e) => {
                handleSIQSClick(e);
                setMenuOpen(false);
              }}
              className="text-foreground/80 hover:text-primary text-lg font-medium py-2 transition-colors"
            >
              SIQS Now
            </a>
            <MobileNavLink to="/about" onClick={() => setMenuOpen(false)}>
              About SIQS
            </MobileNavLink>
            <MobileNavLink to="/photo-points" onClick={() => setMenuOpen(false)}>
              Photo Points Nearby
            </MobileNavLink>
            <MobileNavLink to="/share" onClick={() => setMenuOpen(false)}>
              Share Location
            </MobileNavLink>
            <MapSelector onSelectLocation={handleLocationSelect}>
              <Button variant="outline" className="w-full flex items-center justify-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Search Location</span>
              </Button>
            </MapSelector>
            <div className="pt-2 border-t border-cosmic-700">
              <Button className="w-full">Sign In</Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const NavLink = ({ 
  to, 
  active, 
  children 
}: { 
  to: string; 
  active: boolean; 
  children: React.ReactNode 
}) => {
  return (
    <Link
      to={to}
      className={cn(
        "relative text-sm font-medium transition-colors hover:text-primary",
        active ? "text-primary" : "text-foreground/70"
      )}
    >
      {children}
      {active && (
        <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
      )}
    </Link>
  );
};

const MobileNavLink = ({ 
  to, 
  onClick, 
  children 
}: { 
  to: string; 
  onClick: () => void; 
  children: React.ReactNode 
}) => {
  return (
    <Link
      to={to}
      className="text-foreground/80 hover:text-primary text-lg font-medium py-2 transition-colors"
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

export default NavBar;
