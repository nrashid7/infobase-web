import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/lib/LanguageContext";
import { MainLayout } from "./layouts/MainLayout";

// Lazy load pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Guides = lazy(() => import("./pages/Guides"));
const GuideDetail = lazy(() => import("./pages/GuideDetail"));
const Directory = lazy(() => import("./pages/Directory"));
const SiteDetail = lazy(() => import("./pages/SiteDetail"));
const About = lazy(() => import("./pages/About"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ServicesRedirect = lazy(() => import("./pages/ServicesRedirect"));
const BulkScrape = lazy(() => import("./pages/BulkScrape"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-pulse text-muted-foreground">Loading...</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/guides" element={<Guides />} />
                <Route path="/guides/:id" element={<GuideDetail />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/directory/:slug" element={<SiteDetail />} />
                <Route path="/sources" element={<Navigate to="/directory" replace />} />
                <Route path="/about" element={<About />} />
                <Route path="/bulk-scrape" element={<BulkScrape />} />
                
              {/* Redirect old routes */}
              <Route path="/services" element={<Navigate to="/guides" replace />} />
              <Route path="/services/:id" element={<ServicesRedirect />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
