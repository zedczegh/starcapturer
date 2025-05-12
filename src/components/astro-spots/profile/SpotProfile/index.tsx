
import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/NavBar";
import ProfileContent from './ProfileContent';
import ProfileFooter from './ProfileFooter';
import BackButton from "@/components/navigation/BackButton";

const AstroSpotProfile = () => {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [comingFromCommunity, setComingFromCommunity] = React.useState(false);

  React.useEffect(() => {
    if (location.state?.from === "community") {
      setComingFromCommunity(true);
    }
  }, [location.state]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-cosmic-950">
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
        />
      </div>
      
      <ProfileFooter />
    </div>
  );
};

export default AstroSpotProfile;
