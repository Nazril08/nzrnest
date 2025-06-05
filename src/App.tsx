import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ImageSuperscalePage from "./pages/ImageSuperscale";
import ClashBuilder from "./pages/ClashBuilder";
import MusicRecognitionPage from "./pages/MusicRecognition";
import VoiceToTextPage from "./pages/VoiceToText";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/image-superscale" element={<ImageSuperscalePage />} />
          <Route path="/clash-builder" element={<ClashBuilder />} />
          <Route path="/music-recognition" element={<MusicRecognitionPage />} />
          <Route path="/voice-to-text" element={<VoiceToTextPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
