import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/lib/LanguageContext";
import { MainLayout } from "./layouts/MainLayout";
import Index from "./pages/Index";
import Guides from "./pages/Guides";
import GuideDetail from "./pages/GuideDetail";
import Directory from "./pages/Directory";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import ServicesRedirect from "./pages/ServicesRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/guides/:id" element={<GuideDetail />} />
              <Route path="/directory" element={<Directory />} />
              <Route path="/sources" element={<Navigate to="/directory" replace />} />
              <Route path="/about" element={<About />} />
              
            {/* Redirect old routes */}
            <Route path="/services" element={<Navigate to="/guides" replace />} />
            <Route path="/services/:id" element={<ServicesRedirect />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
