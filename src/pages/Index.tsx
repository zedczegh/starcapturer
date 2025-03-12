
import React from "react";
import { Link } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Hero from "@/components/Hero";
import SIQSCalculator from "@/components/SIQSCalculator";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, Star, Camera, Map, LocateFixed, CloudLightning } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen">
      <NavBar />
      
      <Hero />
      
      <section id="calculator-section" className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-nebula-gradient -z-10" />
        
        {/* Background image for calculator section */}
        <div className="absolute inset-0 opacity-20 -z-10">
          <img 
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb" 
            alt="Starry lake" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center max-w-3xl mx-auto">
            <div className="w-full animate-slide-up">
              <div className="flex items-center mb-4">
                <div className="h-0.5 w-10 bg-primary mr-4" />
                <h2 className="text-lg font-medium text-primary">Calculate Your SIQS</h2>
              </div>
              
              <h3 className="text-3xl font-bold mb-6">
                Find Your Perfect <span className="text-gradient-blue">Astrophotography Spot</span>
              </h3>
              
              <p className="text-muted-foreground mb-8">
                Enter your location details to calculate the Stellar Imaging Quality Score. 
                AstroSIQS combines real-time weather data to provide a precise assessment for astrophotography.
              </p>
              
              <SIQSCalculator className="max-w-xl mx-auto shadow-lg" hideRecommendedPoints={true} />
            </div>
          </div>
        </div>
      </section>
      
      <section className="py-24 relative">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-cosmic-900/80 z-10" />
          <img 
            src="https://images.unsplash.com/photo-1492321936769-b49830bc1d1e" 
            alt="Astronomy landscape" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-cosmic-glow -z-10" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-6">
            <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
            <span className="text-xs font-medium text-primary">The Science Behind SIQS</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-8 max-w-3xl mx-auto text-white">
            Data-Driven <span className="text-gradient-blue">Astrophotography Planning</span>
          </h2>
          
          <p className="text-lg text-white/80 max-w-3xl mx-auto mb-10">
            The Stellar Imaging Quality Score (SIQS) is a comprehensive metric that evaluates a location's
            suitability for astrophotography based on five critical factors.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
            <div className="glassmorphism p-6 rounded-xl text-left hover-card">
              <div className="bg-primary/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Light Pollution</h3>
              <p className="text-sm text-muted-foreground">Measures ambient light using the Bortle scale, which affects visibility of celestial objects.</p>
            </div>
            
            <div className="glassmorphism p-6 rounded-xl text-left hover-card">
              <div className="bg-primary/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <LocateFixed className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Seeing Conditions</h3>
              <p className="text-sm text-muted-foreground">Evaluates atmospheric stability which impacts image sharpness and clarity.</p>
            </div>
            
            <div className="glassmorphism p-6 rounded-xl text-left hover-card">
              <div className="bg-primary/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                <CloudLightning className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Weather Data</h3>
              <p className="text-sm text-muted-foreground">Incorporates cloud cover, humidity, and wind speed from real-time meteorological sources.</p>
            </div>
          </div>
          
          <Button size="lg" className="mt-6 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90" asChild>
            <Link to="/about">
              Learn More About SIQS
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
      
      <section className="py-16 bg-cosmic-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center mb-12">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-6">
              <Map className="h-3.5 w-3.5 mr-2 text-primary" />
              <span className="text-xs font-medium text-primary">Discover Photo Spots</span>
            </div>
            
            <h2 className="text-3xl font-bold mb-4">
              Explore <span className="text-gradient-blue">Community Locations</span>
            </h2>
            
            <p className="text-muted-foreground max-w-2xl">
              Browse through our curated collection of astrophotography locations shared by the community.
              Find hidden gems with perfect conditions for your next shoot.
            </p>
          </div>
          
          <div className="flex justify-center">
            <Button size="lg" className="bg-gradient-to-r from-primary/90 to-primary/70 hover:opacity-90" asChild>
              <Link to="/photo-points">
                <Camera className="mr-2 h-4 w-4" />
                View All Photo Points
              </Link>
            </Button>
          </div>
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
              <Link to="/photo-points" className="text-sm text-foreground/70 hover:text-primary transition-colors">
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
