
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
      
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-nebula-gradient -z-10" />
        
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            <div className="lg:w-1/2 animate-slide-up">
              <div className="lg:sticky lg:top-32">
                <div className="flex items-center mb-6">
                  <div className="h-0.5 w-10 bg-primary mr-4" />
                  <h2 className="text-lg font-medium text-primary">Calculate Your SIQS</h2>
                </div>
                
                <h3 className="text-3xl font-bold mb-6">
                  Find Your Perfect <span className="text-gradient-blue">Astrophotography Spot</span>
                </h3>
                
                <p className="text-muted-foreground mb-8">
                  Enter your location details and observing conditions to calculate the Stellar Imaging Quality Score. 
                  AstroSIQS combines real-time weather data with your input to provide a precise assessment for astrophotography.
                </p>
                
                <SIQSCalculator className="max-w-xl" />
              </div>
            </div>
            
            <div className="lg:w-1/2 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center mb-6">
                <div className="h-0.5 w-10 bg-primary mr-4" />
                <h2 className="text-lg font-medium text-primary">Recent Locations</h2>
              </div>
              
              <h3 className="text-3xl font-bold mb-6">
                Explore <span className="text-gradient-blue">Community Spots</span>
              </h3>
              
              <p className="text-muted-foreground mb-8">
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
      
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-cosmic-glow -z-10" />
        
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8">
            <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
            <span className="text-xs font-medium text-primary">The Science Behind SIQS</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 max-w-3xl mx-auto">
            Data-Driven <span className="text-gradient-blue">Astrophotography Planning</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-12">
            The Stellar Imaging Quality Score (SIQS) is a comprehensive metric that evaluates a location's
            suitability for astrophotography based on five critical factors.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <FeatureCard
              title="Cloud Cover"
              description="The single most important factor (40% of SIQS). Locations with more than 20% cloud cover are marked as non-viable."
              weight="40%"
              color="rgb(59, 130, 246)"
            />
            <FeatureCard
              title="Light Pollution"
              description="Based on the Bortle scale (25% of SIQS). Darker skies (Bortle 1-3) significantly improve your images' quality."
              weight="25%"
              color="rgb(168, 85, 247)"
            />
            <FeatureCard
              title="Seeing Conditions"
              description="Atmospheric stability (20% of SIQS). Better seeing allows for sharper, more detailed images of celestial objects."
              weight="20%"
              color="rgb(236, 72, 153)"
            />
            <FeatureCard
              title="Wind Speed"
              description="Camera stability factor (10% of SIQS). Strong winds can cause vibrations that blur your images."
              weight="10%"
              color="rgb(34, 197, 94)"
            />
            <FeatureCard
              title="Humidity"
              description="Dew risk assessment (5% of SIQS). High humidity can cause condensation on optical surfaces and electronics."
              weight="5%"
              color="rgb(234, 179, 8)"
            />
            <div className="glassmorphism rounded-xl p-6 h-full flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center mb-4">
                <div className="bg-cosmic-100/10 h-20 w-20 rounded-full flex items-center justify-center">
                  <div className="bg-cosmic-100/20 h-16 w-16 rounded-full flex items-center justify-center">
                    <Star className="h-10 w-10 text-primary" />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-2">SIQS Score</h3>
              <p className="text-sm text-muted-foreground text-center">
                The final SIQS score (0-10) combines all factors to provide a single, easy-to-understand quality rating.
              </p>
            </div>
          </div>
          
          <Button size="lg" className="mt-12" asChild>
            <Link to="/about">
              Learn More About SIQS
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
      
      <footer className="bg-cosmic-900 border-t border-cosmic-800 py-12">
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

interface FeatureCardProps {
  title: string;
  description: string;
  weight: string;
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, weight, color }) => {
  return (
    <div className="glassmorphism rounded-xl p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <div 
          className="px-2 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: color, color: 'white' }}
        >
          {weight}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

export default Index;
