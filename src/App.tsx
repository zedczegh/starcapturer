
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import PhotoPoints from "./pages/PhotoPoints";
import LocationDetails from "./pages/LocationDetails";
import Profile from "./pages/Profile";
import Collections from "./pages/Collections";
import About from "./pages/About";
import Settings from "./pages/Settings";
import UsefulLinks from "./pages/UsefulLinks";
import Messages from "./pages/Messages";
import Community from "./pages/Community";
import ManageAstroSpots from "./pages/ManageAstroSpots";
import SonificationProcessorPage from "./pages/SonificationProcessor";
import MyReservations from "./pages/MyReservations";
import BortleNow from "./pages/BortleNow";
import SIQSCalculator from "./pages/SIQSCalculator";
import ComprehensiveServiceTest from "./pages/ComprehensiveServiceTest";

// Lazy load components
const LazyAstroSpotProfile = lazy(() => import("./components/astro-spots/profile/SpotProfile/index"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/photo-points" element={<PhotoPoints />} />
                <Route path="/location/:encodedLocation" element={<LocationDetails />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/about" element={<About />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/useful-links" element={<UsefulLinks />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/community" element={<Community />} />
                <Route path="/manage-astro-spots" element={<ManageAstroSpots />} />
                <Route path="/sonification" element={<SonificationProcessorPage />} />
                <Route path="/my-reservations" element={<MyReservations />} />
                <Route path="/bortle-now" element={<BortleNow />} />
                <Route path="/siqs-calculator" element={<SIQSCalculator />} />
                <Route path="/test-services" element={<ComprehensiveServiceTest />} />
                <Route
                  path="/astro-spot/:id"
                  element={
                    <Suspense fallback={<div>Loading...</div>}>
                      <LazyAstroSpotProfile />
                    </Suspense>
                  }
                />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
