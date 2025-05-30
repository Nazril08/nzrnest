
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Image, FileText, Video, Music, Cpu } from "lucide-react";

const Index = () => {
  const tools = [
    {
      title: "AI Image Upscaler",
      description: "Enhance your images with AI-powered upscaling technology. Transform low-resolution images into high-quality masterpieces.",
      icon: Image,
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=600&h=400",
      featured: true
    },
    {
      title: "Text Generator",
      description: "Generate high-quality content using advanced AI language models. Perfect for blogs, articles, and creative writing.",
      icon: FileText,
    },
    {
      title: "Video Enhancer",
      description: "Improve video quality and resolution with AI-powered enhancement tools. Professional results in minutes.",
      icon: Video,
    },
    {
      title: "Audio Processing",
      description: "Advanced audio enhancement and noise reduction powered by machine learning algorithms.",
      icon: Music,
    },
    {
      title: "Code Assistant",
      description: "AI-powered code generation and optimization tools for developers. Boost your productivity.",
      icon: Cpu,
    },
    {
      title: "Smart Analytics",
      description: "Intelligent data analysis and insights generation using cutting-edge AI technologies.",
      icon: Zap,
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-white text-xl font-bold">NzrNest</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Home</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">About</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Tools</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Docs</a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" className="text-white hover:bg-white/10">
                Sign In
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                Sign Up
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-6">
            <Zap className="text-purple-400 mr-2" size={20} />
            <span className="text-purple-300 text-sm font-medium">Launch Your AI Startup with</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Next-Gen AI Tools for
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Modern Creators
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Powerful AI-driven tools designed for creators, developers, and businesses. 
            Transform your workflow with cutting-edge technology and seamless integration.
          </p>
          
          <Button className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 py-3 rounded-lg">
            Try AI Tools
          </Button>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <Zap className="text-purple-400 mr-2" size={20} />
              <span className="text-purple-300 text-sm font-medium">Main Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful AI Tools at Your Fingertips
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A Complete Solution for AI-Powered Creativity and Productivity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool, index) => (
              <Card 
                key={index} 
                className={`bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 backdrop-blur-sm ${
                  tool.featured ? 'lg:col-span-2 lg:row-span-1' : ''
                }`}
              >
                <CardHeader className="pb-4">
                  {tool.image && (
                    <div className="mb-4 rounded-lg overflow-hidden">
                      <img 
                        src={tool.image} 
                        alt={tool.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                      <tool.icon className="text-purple-400" size={24} />
                    </div>
                    <div>
                      <CardTitle className="text-white text-xl">{tool.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-300 leading-relaxed">
                    {tool.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-12 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-center mb-4">
              <Zap className="text-purple-400 mr-2" size={20} />
              <span className="text-purple-300 text-sm font-medium">Kickstart your AI Startup</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of creators and businesses using NzrNest to accelerate their projects with AI-powered tools.
            </p>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 py-3 rounded-lg">
              Get Started Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4 sm:px-6 lg:px-8">
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

export default Index;
