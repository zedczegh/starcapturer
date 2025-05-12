
import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";
import ProfileContent from './ProfileContent';
import ProfileFooter from './ProfileFooter';
import BackButton from "@/components/navigation/BackButton";

// Create this wrapper component to force complete remount when the ID changes
const AstroSpotProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [comingFromCommunity, setComingFromCommunity] = React.useState(false);

  useEffect(() => {
    // Log timestamp from state to help with debugging
    const timestamp = location.state?.timestamp;
    console.log("Profile opened for spot ID:", id, "with timestamp:", timestamp);
    
    if (location.state?.from === "community") {
      setComingFromCommunity(true);
    }
    
    // Force a render refresh when the ID or timestamp changes
    // This helps ensure we're showing the correct profile
  }, [id, location.state]);

  // Using the ID as a key on the div wrapper forces a complete component remount
  // when navigating between different spot IDs
  return (
    <div key={`profile-${id}-${location.state?.timestamp}`} className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
      <NavBar />
      <div className="container max-w-4xl py-8 px-4 md:px-6 relative">
        <div className="flex justify-between items-start mb-6">
          <BackButton
            destination={comingFromCommunity ? "/community" : "/manage-astro-spots"}
            className="text-gray-300 hover:bg-cosmic-800/50"
          />
        </div>

        <ProfileContent 
          spotId={id!} 
          user={!!user} 
          comingFromCommunity={comingFromCommunity}
          key={`${id}-${location.state?.timestamp}`} // Force re-render when navigation occurs
        />
      </div>
      
      <ProfileFooter />
    </div>
  );
};

export default AstroSpotProfile;
