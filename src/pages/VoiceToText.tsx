import VoiceToText from "@/components/ui/voice-to-text";
import { ArrowLeft, Mic, Headphones, Sparkles, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const VoiceToTextPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-600/10 via-transparent to-transparent"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-[10%] left-[5%] opacity-10">
          <Mic size={60} className="text-purple-300" />
        </div>
        <div className="absolute top-[20%] right-[10%] opacity-10">
          <Headphones size={80} className="text-purple-300" />
        </div>
        <div className="absolute bottom-[15%] left-[15%] opacity-10">
          <FileText size={70} className="text-purple-300" />
        </div>
        <div className="absolute bottom-[25%] right-[5%] opacity-10">
          <Sparkles size={50} className="text-purple-300" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-b border-purple-400/20 backdrop-blur-md bg-purple-950/30 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-900/30">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-white text-xl font-bold">NzrNest</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-purple-200/80 hover:text-white transition-colors">Home</Link>
              <a href="#" className="text-purple-200/80 hover:text-white transition-colors">About</a>
              <a href="#" className="text-purple-200/80 hover:text-white transition-colors">Tools</a>
              <a href="#" className="text-purple-200/80 hover:text-white transition-colors">Docs</a>
              <a href="#" className="text-purple-200/80 hover:text-white transition-colors">Pricing</a>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/" className="text-white hover:text-white transition-colors flex items-center px-4 py-2 rounded-lg border border-purple-400/30 hover:bg-purple-800/30">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 relative z-0">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center mb-4 px-4 py-1 rounded-full bg-purple-800/50 border border-purple-400/30">
              <Mic className="h-4 w-4 text-purple-300 mr-2" />
              <span className="text-purple-200 text-sm font-medium">Audio Transcription Tool</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Voice to Text
            </h1>
            
            <p className="text-purple-200 text-lg max-w-2xl mx-auto leading-relaxed">
              Convert audio files to text using AI-powered transcription technology.
              Simply paste an audio URL and get accurate text transcription in seconds.
            </p>
          </div>
          
          <VoiceToText />
          
          <div className="mt-16 text-center">
            <div className="p-6 bg-purple-900/30 rounded-xl border border-purple-400/20 backdrop-blur-sm max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold text-white mb-3">How It Works</h3>
              <p className="text-purple-200 mb-4">
                This tool uses advanced AI speech recognition to convert spoken words from audio files into written text.
                The audio is processed through sophisticated language models to ensure accurate transcription.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4">
                  <div className="w-10 h-10 bg-purple-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <p className="text-purple-200 text-sm">Paste audio URL</p>
                </div>
                <div className="p-4">
                  <div className="w-10 h-10 bg-purple-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <p className="text-purple-200 text-sm">Process with AI</p>
                </div>
                <div className="p-4">
                  <div className="w-10 h-10 bg-purple-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <p className="text-purple-200 text-sm">Get transcribed text</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-8 px-4 border-t border-purple-400/20 bg-purple-950/30 backdrop-blur-md mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-purple-200/70 text-sm">
            © 2025 NzrNest. All rights reserved. Powered by Fast REST API.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default VoiceToTextPage; 