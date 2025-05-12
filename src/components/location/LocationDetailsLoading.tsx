
import React from "react";
import NavBar from "@/components/NavBar";
import LocationProfileSkeleton from "./LocationProfileSkeleton";
import { motion } from "framer-motion";

const LocationDetailsLoading = () => (
  <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
    <NavBar />
    <div className="container max-w-4xl py-8 px-4 md:px-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="glassmorphism rounded-xl border border-cosmic-700/50 shadow-glow overflow-hidden"
      >
        <LocationProfileSkeleton />
      </motion.div>
    </div>
  </div>
);

export default LocationDetailsLoading;
