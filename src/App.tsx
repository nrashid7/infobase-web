import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import Index from "./pages/Index";
import Guides from "./pages/Guides";
import GuideDetail from "./pages/GuideDetail";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

// Admin/verification pages - not linked in public nav
import Claims from "./pages/Claims";
import ClaimDetail from "./pages/ClaimDetail";
import Sources from "./pages/Sources";
import SourceDetail from "./pages/SourceDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/guides" element={<Guides />} />
            <Route path="/guides/:id" element={<GuideDetail />} />
            <Route path="/about" element={<About />} />
            
            {/* Redirect old /services routes to /guides */}
            <Route path="/services" element={<Navigate to="/guides" replace />} />
            <Route path="/services/:id" element={<Navigate to="/guides/:id" replace />} />
          </Route>
          
          {/* Admin/Verification routes - hidden from nav */}
          <Route element={<MainLayout />}>
            <Route path="/admin/claims" element={<Claims />} />
            <Route path="/admin/claims/:id" element={<ClaimDetail />} />
            <Route path="/admin/sources" element={<Sources />} />
            <Route path="/admin/sources/:id" element={<SourceDetail />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
