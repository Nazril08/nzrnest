import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowRight, Zap, Image, FileText, Video, Music, Cpu, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const tools = [
    {
      title: "AI Image Enhancer",
      description: "Enhance your images with Waifu2x AI technology. Transform low-resolution images into high-quality masterpieces.",
      icon: Image,
      featured: false,
      category: "image",
      path: "/image-superscale"
    },
    {
      title: "Text Generator",
      description: "Generate high-quality content using advanced AI language models. Perfect for blogs, articles, and creative writing.",
      icon: FileText,
      category: "text"
    },
    {
      title: "Video Enhancer",
      description: "Improve video quality and resolution with AI-powered enhancement tools. Professional results in minutes.",
      icon: Video,
      category: "video"
    },
    {
      title: "Audio Processing",
      description: "Advanced audio enhancement and noise reduction powered by machine learning algorithms.",
      icon: Music,
      category: "audio"
    },
    {
      title: "Code Assistant",
      description: "AI-powered code generation and optimization tools for developers. Boost your productivity.",
      icon: Cpu,
      category: "development"
    },
    {
      title: "Smart Analytics",
      description: "Intelligent data analysis and insights generation using cutting-edge AI technologies.",
      icon: Zap,
      category: "analytics"
    }
  ];

  const filteredTools = tools.filter(tool =>
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Zap className="text-purple-400 mr-2" size={24} />
              <span className="text-purple-300 text-sm font-medium tracking-wider uppercase">Main Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              Powerful AI Tools at Your Fingertips
            </h2>
            <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed mb-10">
              A Complete Solution for AI-Powered Creativity and Productivity
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-white/10 border-white/20 text-white placeholder:text-gray-400 rounded-xl focus:bg-white/15 focus:border-purple-400 transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredTools.map((tool, index) => (
              <Link 
                to={tool.path || "#"} 
                key={index} 
                className={tool.path ? "cursor-pointer" : "cursor-not-allowed"}
              >
                <Card 
                  className={`group bg-[#150b30]/70 border-[#2a1b4a] hover:bg-[#1d1040]/90 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-600/10 backdrop-blur-sm overflow-hidden h-full`}
                >
                  <CardHeader className="pb-4 relative">
                    <div className="flex items-start space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-shadow duration-300">
                        <tool.icon className="text-white" size={28} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-white text-xl mb-2 group-hover:text-purple-300 transition-colors duration-300">
                          {tool.title}
                        </CardTitle>
                        <span className="inline-block px-3 py-1 bg-purple-600/20 text-purple-300 text-xs font-medium rounded-full border border-purple-500/30">
                          {tool.category}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-gray-300 leading-relaxed text-base mb-4">
                      {tool.description}
                    </CardDescription>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${tool.path ? 'text-purple-400' : 'text-gray-500'}`}>
                        {tool.path ? 'Try Now' : 'Coming Soon'}
                      </span>
                      <ArrowRight className={`h-4 w-4 ${tool.path ? 'text-purple-400 group-hover:translate-x-1 transition-transform duration-200' : 'text-gray-500'}`} />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {filteredTools.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-gray-400" size={32} />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">No tools found</h3>
              <p className="text-gray-400">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-[#150b30] to-[#1d1040] rounded-2xl p-12 border border-[#2a1b4a] backdrop-blur-sm">
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
      <footer className="border-t border-[#2a1b4a] py-12 px-4 sm:px-6 lg:px-8">
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
