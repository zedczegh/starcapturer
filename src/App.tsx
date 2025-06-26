import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { HelmetProvider } from 'react-helmet-async';
import NavBar from "./components/navbar/NavBar";
import PageLoader from "./components/loaders/PageLoader";

const Home = lazy(() => import("./pages/Home"));
const Community = lazy(() => import("./pages/Community"));
const PhotoPoints = lazy(() => import("./pages/PhotoPoints"));
const ManageAstroSpots = lazy(() => import("./pages/ManageAstroSpots"));
const AstroSpotDetails = lazy(() => import("./pages/AstroSpotDetails"));
const Profile = lazy(() => import("./pages/Profile"));
const Preferences = lazy(() => import("./pages/Preferences"));
const Messages = lazy(() => import("./pages/Messages"));
const Wallet = lazy(() => import("./pages/Wallet"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCanceled = lazy(() => import("./pages/PaymentCanceled"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <AuthProvider>
            <LanguageProvider>
              <TooltipProvider>
                <Toaster />
                <BrowserRouter>
                  <div className="min-h-screen bg-background">
                    <NavBar />
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/community" element={<Community />} />
                        <Route path="/photo-points" element={<PhotoPoints />} />
                        <Route path="/manage-astro-spots" element={<ManageAstroSpots />} />
                        <Route path="/astro-spot/:id" element={<AstroSpotDetails />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/preferences" element={<Preferences />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/wallet" element={<Wallet />} />
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        <Route path="/payment-canceled" element={<PaymentCanceled />} />
                      </Routes>
                    </Suspense>
                  </div>
                </BrowserRouter>
              </TooltipProvider>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
