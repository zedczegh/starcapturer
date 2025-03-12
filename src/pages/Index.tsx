
import React from "react";
import { Link } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import SIQSCalculator from "@/components/SIQSCalculator";
import LocationCard from "@/components/LocationCard";
import { getRecentLocations } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, Star } from "lucide-react";

const Index = () => {
  const recentLocations = getRecentLocations();
  
  return (
    <div className="min-h-screen">
      <NavBar />
      
      <Hero />
      
      <section className="relative py-12 overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-nebula-gradient -z-10" />
        
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            <div className="lg:w-1/2 animate-slide-up">
              <div className="lg:sticky lg:top-32">
                <div className="flex items-center mb-4">
                  <div className="h-0.5 w-10 bg-primary mr-4" />
                  <h2 className="text-lg font-medium text-primary">Calculate Your SIQS</h2>
                </div>
                
                <h3 className="text-2xl font-bold mb-4">
                  Find Your Perfect <span className="text-gradient-blue">Astrophotography Spot</span>
                </h3>
                
                <p className="text-muted-foreground mb-6">
                  Enter your location details to calculate the Stellar Imaging Quality Score. 
                  AstroSIQS combines real-time weather data to provide a precise assessment for astrophotography.
                </p>
                
                <SIQSCalculator className="max-w-xl" />
              </div>
            </div>
            
            <div className="lg:w-1/2 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center mb-4">
                <div className="h-0.5 w-10 bg-primary mr-4" />
                <h2 className="text-lg font-medium text-primary">Recent Locations</h2>
              </div>
              
              <h3 className="text-2xl font-bold mb-4">
                Explore <span className="text-gradient-blue">Community Spots</span>
              </h3>
              
              <p className="text-muted-foreground mb-6">
                Discover locations recently analyzed by other astrophotographers. 
                Browse through their SIQS scores and find new potential imaging spots.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {recentLocations.map((location) => (
                  <LocationCard
                    key={location.id}
                    id={location.id}
                    name={location.name}
                    latitude={location.latitude}
                    longitude={location.longitude}
                    siqs={location.siqs}
                    isViable={location.isViable}
                    timestamp={location.timestamp}
                  />
                ))}
              </div>
              
              <Button variant="outline" className="w-full" asChild>
                <Link to="/locations">
                  View All Locations
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-cosmic-glow -z-10" />
        
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
            <span className="text-xs font-medium text-primary">The Science Behind SIQS</span>
          </div>
          
          <h2 className="text-3xl font-bold mb-4 max-w-3xl mx-auto">
            Data-Driven <span className="text-gradient-blue">Astrophotography Planning</span>
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
            The Stellar Imaging Quality Score (SIQS) is a comprehensive metric that evaluates a location's
            suitability for astrophotography based on five critical factors.
          </p>
          
          <Button size="lg" className="mt-6" asChild>
            <Link to="/about">
              Learn More About SIQS
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
      
      <footer className="bg-cosmic-900 border-t border-cosmic-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <Star className="h-6 w-6 text-primary mr-2" />
              <span className="text-xl font-bold">
                Astro<span className="text-primary">SIQS</span>
              </span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-6 md:mb-0">
              <Link to="/" className="text-sm text-foreground/70 hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/about" className="text-sm text-foreground/70 hover:text-primary transition-colors">
                About SIQS
              </Link>
              <Link to="/locations" className="text-sm text-foreground/70 hover:text-primary transition-colors">
                Explore Locations
              </Link>
              <Link to="/community" className="text-sm text-foreground/70 hover:text-primary transition-colors">
                Community
              </Link>
            </div>
            
            <div className="text-sm text-foreground/50">
              &copy; {new Date().getFullYear()} AstroSIQS
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
