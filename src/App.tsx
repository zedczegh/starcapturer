
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import PageLoader from "@/components/loaders/PageLoader";

// Lazy load components for better performance
const PhotoPoints = lazy(() => import("./pages/PhotoPoints"));
const LocationDetails = lazy(() => import("./pages/LocationDetails"));
const Profile = lazy(() => import("./pages/Profile"));
const Collections = lazy(() => import("./pages/Collections"));
const UsefulLinks = lazy(() => import("./pages/UsefulLinks"));
const Messages = lazy(() => import("./pages/Messages"));
const ManageAstroSpots = lazy(() => import("./pages/ManageAstroSpots"));
const AstroSpots = lazy(() => import("./pages/AstroSpots"));
const AstroSpotProfile = lazy(() => import("./pages/AstroSpotProfile"));
const BortleNow = lazy(() => import("./pages/BortleNow"));
const About = lazy(() => import("./pages/About"));
const Community = lazy(() => import("./pages/Community"));
const MyReservations = lazy(() => import("./pages/MyReservations"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
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
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/photo-points" element={<PhotoPoints />} />
                  <Route path="/location/:lat/:lng" element={<LocationDetails />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/collections" element={<Collections />} />
                  <Route path="/useful-links" element={<UsefulLinks />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/manage-astro-spots" element={<ManageAstroSpots />} />
                  <Route path="/astro-spots" element={<AstroSpots />} />
                  <Route path="/astro-spot/:id" element={<AstroSpotProfile />} />
                  <Route path="/bortle-now" element={<BortleNow />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/my-reservations" element={<MyReservations />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
