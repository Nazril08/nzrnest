import ImageSuperscale from "@/components/ui/image-superscale";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const ImageSuperscalePage = () => {
  return (
    <div className="min-h-screen bg-purple-gradient">
      {/* Navigation */}
      <nav className="border-b border-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-white text-xl font-bold">NzrNest</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-300 hover:text-white transition-colors">Home</Link>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">About</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Tools</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Docs</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            </div>

            <div className="flex items-center space-x-4">
              <Link to="/" className="text-white hover:text-purple-300 transition-colors flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              AI Image Enhancer 
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Transform your images into high-quality masterpieces with  AI technology.
            </p>
          </div>
          
          <ImageSuperscale />
          
          <div className="mt-12 text-center">
            <p className="text-gray-400 text-sm">
              This tool uses Waifu2x AI models to enhance image quality. Results may vary depending on the input image quality.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[#2a1b4a] py-12 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-white text-xl font-bold">NzrNest</span>
            </div>
            <p className="text-gray-400">© 2025 NzrNest. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ImageSuperscalePage; 