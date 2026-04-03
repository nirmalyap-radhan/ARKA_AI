import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./hooks/use-auth";
import ProtectedRoute from "./components/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const PlannerPage = lazy(() => import("./pages/PlannerPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const ARScannerPage = lazy(() => import("./pages/ARScannerPage"));
const VRScannerPage = lazy(() => import("./pages/VRScannerPage"));
const CulturePage = lazy(() => import("./pages/CulturePage"));
const RiskPredictionPage = lazy(() => import("./pages/RiskPredictionPage"));
const TrackingPage = lazy(() => import("./pages/TrackingPage"));
const MemoriesPage = lazy(() => import("./pages/MemoriesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="min-h-screen bg-[#030712] flex items-center justify-center text-[#00f2ff] font-mono">LOADING SYSTEM...</div>}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <div className="flex flex-col min-h-screen">
                      <Navbar />
                      <main className="flex-grow">
                        <Suspense fallback={<div className="flex-grow flex items-center justify-center bg-background">Loading Module...</div>}>
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/planner" element={<PlannerPage />} />
                            <Route path="/chat" element={<ChatPage />} />
                            <Route path="/scanner" element={<ARScannerPage />} />
                            <Route path="/vr-scanner" element={<VRScannerPage />} />
                            <Route path="/culture" element={<CulturePage />} />
                            <Route path="/risk-prediction" element={<RiskPredictionPage />} />
                            <Route path="/tracking" element={<TrackingPage />} />
                            <Route path="/memories" element={<MemoriesPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </main>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
