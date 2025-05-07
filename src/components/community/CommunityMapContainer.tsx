
import React from "react";
import { Loader2 } from "lucide-react";

interface CommunityMapContainerProps {
  children: React.ReactNode;
}

const CommunityMapContainer: React.FC<CommunityMapContainerProps> = ({ children }) => {
  return (
    <div 
      className="rounded-xl mb-9 shadow-glow overflow-hidden ring-1 ring-cosmic-700/10 bg-gradient-to-tr from-cosmic-900 via-cosmic-800/90 to-blue-950/70 relative" 
      style={{ height: 380, minHeight: 275 }}
    >
      {children}
      
      {/* Loading overlay will be shown when children are null */}
      {!children && (
        <div className="absolute inset-0 flex justify-center items-center bg-cosmic-900/20 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary/80" />
        </div>
      )}
    </div>
  );
};

export default CommunityMapContainer;
