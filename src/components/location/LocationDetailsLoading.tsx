
import React from "react";
import NavBar from "@/components/NavBar";
import LocationProfileSkeleton from "./LocationProfileSkeleton";

const LocationDetailsLoading = () => (
  <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
    <NavBar />
    <div className="container max-w-4xl py-8 px-4 md:px-6">
      <div className="glassmorphism rounded-xl border border-cosmic-700/50 shadow-glow overflow-hidden">
        <LocationProfileSkeleton />
      </div>
    </div>
  </div>
);

export default LocationDetailsLoading;
