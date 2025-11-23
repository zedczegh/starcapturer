
import React, { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, MapPin, ArrowRight, Github, Twitter, BookOpen, Info } from "lucide-react";
import { useSiqsNavigation } from "@/hooks/navigation/useSiqsNavigation";
import NavBar from '@/components/NavBar';

interface PhotoPointsLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

const PhotoPointsLayout: React.FC<PhotoPointsLayoutProps> = ({ 
  children,
  pageTitle
}) => {
  const { t } = useLanguage();
  const { handleSIQSClick } = useSiqsNavigation(); // Re-enabled to use for location acquisition

  // Default page title
  const title = pageTitle || t("Photo Points Nearby | Sky Viewer", "附近拍摄点 | 天空观测");

  // Background image layer (nebula/starfield)
  return (
    <div className="relative min-h-screen bg-cosmic-950 overflow-x-hidden">
      {/* Background Image */}
      <div
        className="fixed inset-0 z-0 pointer-events-none select-none"
        aria-hidden="true"
        style={{
          background: "url('/lovable-uploads/bae4bb9f-d2ce-4f1b-9eae-e0e022866a36.png') center center / cover no-repeat",
          filter: 'blur(1.5px) brightness(0.80) saturate(1.15)',
        }}
      />
      {/* Overlay for darkness/gradient to maintain text readability */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'linear-gradient(120deg, rgba(10,17,34,0.80) 0%, rgba(40,22,44,0.60) 100%)',
        }}
      />
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <NavBar />
      <div className="relative pt-16 sm:pt-20 md:pt-28 pb-12 sm:pb-20 will-change-transform z-10">
        <div className="w-full mx-auto px-0 sm:px-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PhotoPointsLayout;
