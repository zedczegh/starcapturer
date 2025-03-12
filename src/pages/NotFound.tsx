
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import NavBar from "@/components/NavBar";
import { AlertTriangle, Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen">
      <NavBar />
      
      <div className="container mx-auto px-4 flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full text-center glassmorphism rounded-xl p-10">
          <div className="inline-flex items-center justify-center p-4 bg-cosmic-800/50 rounded-full mb-6">
            <AlertTriangle className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="text-4xl font-bold mb-2">404</h1>
          <h2 className="text-xl mb-4">Page Not Found</h2>
          
          <p className="text-muted-foreground mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
          
          <Button size="lg" asChild>
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
