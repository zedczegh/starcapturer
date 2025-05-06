
import { Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import About from '@/pages/About';
import NotFound from '@/pages/NotFound';
import Profile from '@/pages/Profile';
import PhotoPointsNearby from '@/pages/PhotoPointsNearby';
import LocationDetails from '@/pages/LocationDetails';
import ShareLocation from '@/pages/ShareLocation';
import UsefulLinks from '@/pages/UsefulLinks';
import Collections from '@/pages/Collections';
import ProfileMini from '@/pages/ProfileMini';
import CommunityAstroSpots from '@/pages/CommunityAstroSpots';
import AstroSpotProfile from '@/pages/AstroSpotProfile';
import ManageAstroSpots from '@/pages/ManageAstroSpots';
import Preferences from '@/pages/Preferences';
import Messages from '@/pages/Messages';
import AboutSIQS from '@/pages/AboutSIQS';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/about" element={<About />} />
      <Route path="/about-siqs" element={<AboutSIQS />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/photo-points" element={<PhotoPointsNearby />} />
      <Route path="/location/:id" element={<LocationDetails />} />
      <Route path="/share-location" element={<ShareLocation />} />
      <Route path="/links" element={<UsefulLinks />} />
      <Route path="/collections" element={<Collections />} />
      <Route path="/profile/:id" element={<ProfileMini />} />
      <Route path="/community-spots" element={<CommunityAstroSpots />} />
      <Route path="/astro-spot/:id" element={<AstroSpotProfile />} />
      <Route path="/manage-spots" element={<ManageAstroSpots />} />
      <Route path="/preferences" element={<Preferences />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/messages/:id" element={<Messages />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
