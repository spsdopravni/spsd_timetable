import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/context/DataContext";

// Lazy load pages
const Index = lazy(() => import("./pages/Index"));
const Pragensis = lazy(() => import("./pages/Pragensis"));
const NotFound = lazy(() => import("./pages/NotFound"));

const App = () => (
  <DataProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="h-screen w-screen bg-blue-50" />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/pragensis" element={<Pragensis />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </DataProvider>
);

export default App;
