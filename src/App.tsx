import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/context/DataContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load pages with preloading
const Index = lazy(() =>
  import("./pages/Index").then(module => ({ default: module.default }))
);
const Spsmotol = lazy(() =>
  import("./pages/Spsmotol").then(module => ({ default: module.default }))
);
const SpsMoravska = lazy(() =>
  import("./pages/SpsMoravska").then(module => ({ default: module.default }))
);
const Bikefest = lazy(() =>
  import("./pages/Bikefest").then(module => ({ default: module.default }))
);
const Menu = lazy(() =>
  import("./pages/Menu").then(module => ({ default: module.default }))
);
const Mobile = lazy(() =>
  import("./pages/Mobile").then(module => ({ default: module.default }))
);
const MobileMotol = lazy(() =>
  import("./pages/MobileMotol").then(module => ({ default: module.default }))
);
const MobileMoravska = lazy(() =>
  import("./pages/MobileMoravska").then(module => ({ default: module.default }))
);
const MobileBikefest = lazy(() =>
  import("./pages/MobileBikefest").then(module => ({ default: module.default }))
);
const NotFound = lazy(() =>
  import("./pages/NotFound").then(module => ({ default: module.default }))
);

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={
              <div className="h-screen w-screen bg-blue-50 dark:bg-gray-900 flex items-center justify-center">
                <LoadingSpinner />
              </div>
            }>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/spsmotol" element={<Spsmotol />} />
                <Route path="/spsmoravska" element={<SpsMoravska />} />
                <Route path="/bikefest" element={<Bikefest />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/m" element={<Mobile />} />
                <Route path="/m/motol" element={<MobileMotol />} />
                <Route path="/m/moravska" element={<MobileMoravska />} />
                <Route path="/m/bikefest" element={<MobileBikefest />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
