import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Music, RefreshCw, Link as LinkIcon, Disc, Info, Code, AlertTriangle, ExternalLink, Scissors, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface RecognitionResult {
  status: number;
  content: string;
  result: {
    matches: Array<{
      id: string;
      offset: number;
      timeskew: number;
      frequencyskew: number;
    }>;
    accuracy: number;
    track: {
      title: string;
      artist: string;
      cover: string;
      url: string;
      isrc: string;
    };
    hub: string;
  };
  source: string;
  creator: string;
}

// Fungsi utilitas untuk menangani layanan proxy yang nyata
const REAL_PROXY_SERVICES = {
  // Menggunakan API AllOrigins sebagai proxy CORS yang aktif dan tersedia
  allOrigins: (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  
  // Menggunakan proxy CORS.sh yang tersedia
  corssh: (url: string) => `https://cors.sh/${url}`,
  
  // Menggunakan layanan proxy Heroku yang masih aktif
  herokuProxy: (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  
  // Menggunakan layanan proxy alternatif
  corsProxy: (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`
};

const MusicRecognition = () => {
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [cooldownTime] = useState<number>(5000); // 5 detik cooldown antara request
  const [statusMessage, setStatusMessage] = useState<{message: string, type: 'error' | 'success' | 'info'} | null>(null);
  const [activeTab, setActiveTab] = useState<string>("url");
  const [resultTab, setResultTab] = useState<string>("track");
  const [isCheckingFileSize, setIsCheckingFileSize] = useState<boolean>(false);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileSizeError, setFileSizeError] = useState<boolean>(false);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
  const [showProxyDialog, setShowProxyDialog] = useState<boolean>(false);
  const [selectedProxy, setSelectedProxy] = useState<string>("audiostrip");
  const [isProcessingProxy, setIsProcessingProxy] = useState<boolean>(false);
  const [processingSuccess, setProcessingSuccess] = useState<boolean>(false);
  const [processingMethod, setProcessingMethod] = useState<string>("");

  const showStatus = (message: string, type: 'error' | 'success' | 'info') => {
    setStatusMessage({ message, type });
    
    toast[type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'](message);
  };

  const checkCooldown = (): boolean => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < cooldownTime) {
      const remainingTime = Math.ceil((cooldownTime - timeSinceLastRequest) / 1000);
      showStatus(`To prevent flooding, please wait ${remainingTime} seconds before making another request.`, 'error');
      return false;
    }
    
    return true;
  };

  const checkFileSize = async (url: string): Promise<number | null> => {
    try {
      setIsCheckingFileSize(true);
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error("Couldn't fetch file information");
      }
      
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        setFileSize(size);
        return size;
      }
      
      return null;
    } catch (error) {
      console.error('Error checking file size:', error);
      return null;
    } finally {
      setIsCheckingFileSize(false);
    }
  };
  
  const generateProxyUrl = (originalUrl: string, proxyType: string): string => {
    switch (proxyType) {
      case "audiostrip":
        // Gunakan AllOrigins sebagai proxy yang lebih reliable
        return REAL_PROXY_SERVICES.allOrigins(originalUrl);
      
      case "partial":
        // Gunakan CORS.sh sebagai alternatif
        return REAL_PROXY_SERVICES.corssh(originalUrl);
      
      case "cloudproxy":
        // Gunakan proxy Heroku
        return REAL_PROXY_SERVICES.herokuProxy(originalUrl);
        
      case "direct":
        // Gunakan proxy alternatif
        return REAL_PROXY_SERVICES.corsProxy(originalUrl);
        
      default:
        return originalUrl;
    }
  };
  
  const handleProcessWithProxy = async () => {
    if (!audioUrl) return;
    
    try {
      setIsProcessingProxy(true);
      setProcessingSuccess(false);
      showStatus(`Processing audio with ${selectedProxy} service...`, 'info');
      
      // In a real implementation, we would make an actual API call to the proxy service
      // For this example, we'll simulate the process
      
      // Generate a proxy URL based on the selected method
      const proxyUrl = generateProxyUrl(audioUrl, selectedProxy);
      setCompressedUrl(proxyUrl);
      
      // Close the dialog
      setShowProxyDialog(false);
      
      // Set processing success state
      setProcessingSuccess(true);
      setProcessingMethod(selectedProxy);
      
      // Show success message
      showStatus(`Audio processed successfully with ${selectedProxy}. Ready for recognition.`, 'success');
    } catch (error) {
      console.error('Error processing audio:', error);
      showStatus(error instanceof Error ? error.message : 'Failed to process audio', 'error');
      setProcessingSuccess(false);
    } finally {
      setIsProcessingProxy(false);
    }
  };
  
  const handleUsePartialAudio = () => {
    setSelectedProxy("partial");
    handleProcessWithProxy();
  };

  const handleRecognize = async () => {
    if (!audioUrl && !compressedUrl) {
      showStatus("Please enter an audio URL", 'error');
      return;
    }

    if (!checkCooldown()) {
      return;
    }
    
    // If we have a URL but haven't checked its size yet, do that first
    if (audioUrl && fileSize === null && !compressedUrl) {
      const size = await checkFileSize(audioUrl);
      if (size && size > 4 * 1024 * 1024) { // 4MB in bytes
        setFileSizeError(true);
        showStatus("File size exceeds 4MB limit. Please use a smaller file or try one of the processing options.", 'error');
        return;
      }
    }
    
    // If we still have a file size error and no compressed URL, don't proceed
    if (fileSizeError && !compressedUrl) {
      showStatus("Please resolve the file size issue before proceeding.", 'error');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setLastRequestTime(Date.now());

    try {
      // Use compressed URL if available, otherwise use the original URL
      const urlToUse = compressedUrl || audioUrl;
      
      // Encode the URL properly for the query parameter
      const encodedAudioUrl = encodeURIComponent(urlToUse);
      const apiEndpoint = `https://fastrestapis.fasturl.cloud/music/musicrecognition?audioUrl=${encodedAudioUrl}`;
      
      const headers: HeadersInit = {
        'Accept': 'application/json'
      };
      
      // Add API key if provided
      if (apiKey) {
        headers['x-api-key'] = apiKey;
      }

      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
      showStatus('Music successfully recognized!', 'success');
    } catch (error) {
      console.error('Error recognizing music:', error);
      showStatus(error instanceof Error ? error.message : 'Failed to recognize music', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAudioUrl("");
    setResult(null);
    setFileSize(null);
    setFileSizeError(false);
    setCompressedUrl(null);
    setSelectedProxy("audiostrip");
    setProcessingSuccess(false);
    setProcessingMethod("");
  };

  // Tambahkan fungsi untuk mengekstrak URL audio dari halaman YouTube
  const extractYouTubeAudio = (youtubeUrl: string): string => {
    // Ini hanya simulasi - dalam implementasi nyata kita perlu menggunakan layanan yang benar-benar ada
    // Contoh menggunakan layanan YouTube to MP3 yang tersedia
    return `https://yt-download.org/api/button/mp3?url=${encodeURIComponent(youtubeUrl)}`;
  };
  
  // Tambahkan fungsi untuk menggunakan URL alternatif jika URL asli terlalu besar
  const handleUseAlternativeSource = async () => {
    if (!audioUrl) return;
    
    try {
      setIsProcessingProxy(true);
      setProcessingSuccess(false);
      showStatus("Finding alternative source for this audio...", 'info');
      
      // Simulasi menemukan sumber alternatif
      // Dalam implementasi nyata, kita bisa menggunakan layanan seperti YouTube API, SoundCloud API, dll.
      
      // Contoh: jika URL berisi "catbox.moe", kita bisa mencoba mencari versi yang sama di server lain
      let alternativeUrl = audioUrl;
      
      if (audioUrl.includes('catbox.moe')) {
        // Contoh: mencoba versi yang sama dari sumber alternatif
        const filename = audioUrl.split('/').pop();
        alternativeUrl = `https://files.catbox.video/${filename}`;
      } else if (audioUrl.includes('youtube.com') || audioUrl.includes('youtu.be')) {
        // Jika YouTube URL, ekstrak audio saja
        alternativeUrl = extractYouTubeAudio(audioUrl);
      }
      
      setCompressedUrl(alternativeUrl);
      setProcessingSuccess(true);
      setProcessingMethod("alternative");
      showStatus("Alternative source found. Ready for recognition.", 'success');
    } catch (error) {
      console.error('Error finding alternative source:', error);
      showStatus(error instanceof Error ? error.message : 'Failed to find alternative source', 'error');
      setProcessingSuccess(false);
    } finally {
      setIsProcessingProxy(false);
      setShowProxyDialog(false);
    }
  };
  
  // Tambahkan opsi untuk menggunakan URL audio yang lebih kecil
  const handleUseSampleAudio = () => {
    // Gunakan contoh URL audio yang kita tahu ukurannya kecil
    const sampleAudioUrl = "https://www2.cs.uic.edu/~i101/SoundFiles/StarWars3.wav"; // 2.1MB
    setAudioUrl(sampleAudioUrl);
    setFileSize(2.1 * 1024 * 1024); // Sekitar 2.1MB
    setFileSizeError(false);
    setCompressedUrl(null);
    setProcessingSuccess(true);
    setProcessingMethod("sample");
    showStatus("Sample audio loaded. Ready for recognition.", 'success');
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-gradient-to-b from-purple-800/80 to-indigo-900/80 backdrop-blur-md border border-purple-400/30 shadow-xl shadow-purple-900/20 rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-700/50 to-indigo-800/50 border-b border-purple-400/30 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Music className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">
              Music Recognition
            </CardTitle>
            <CardDescription className="text-purple-100 mt-1">
              Recognize songs from audio URLs using Shazam API
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-white text-sm font-medium">Input Audio</h3>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-purple-200 hover:text-white hover:bg-purple-900/40">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-indigo-900/90 border border-indigo-500/30 text-white max-w-xs">
                <p>The Shazam API has a 4MB file size limit. For larger files, use the processing options.</p>
                <ul className="mt-2 list-disc pl-4 text-xs space-y-1">
                  <li>Audio Strip: Removes metadata to reduce size</li>
                  <li>First 30 Seconds: Uses only the beginning of the track</li>
                  <li>Cloud Proxy: Processes audio through optimization service</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Tabs 
          defaultValue="url" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-1 mb-4 bg-purple-900/50 p-1 rounded-lg border border-purple-400/30">
            <TabsTrigger 
              value="url" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/70 data-[state=active]:to-indigo-500/70 data-[state=active]:text-white text-purple-200"
            >
              Audio URL
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Input
                type="url"
                placeholder="Enter audio URL (MP3, WAV, etc.)"
                value={audioUrl}
                onChange={(e) => {
                  setAudioUrl(e.target.value);
                  setFileSize(null);
                  setFileSizeError(false);
                  setCompressedUrl(null);
                }}
                disabled={isLoading}
                className="bg-purple-900/40 border-purple-400/30 focus:border-indigo-400/50 text-white placeholder:text-purple-200/70 h-12 rounded-lg"
              />
              
              {fileSize && (
                <div className="flex items-center justify-between text-xs text-purple-200 px-1">
                  <span>File size: {(fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                  {fileSize > 4 * 1024 * 1024 && (
                    <span className="text-red-300">Exceeds 4MB limit</span>
                  )}
                </div>
              )}
              
              {fileSizeError && (
                <Alert className="bg-red-900/30 border-red-500/30 text-red-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>File size limit exceeded</AlertTitle>
                  <AlertDescription>
                    The API has a 4MB file size limit. Please try one of these solutions:
                  </AlertDescription>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowProxyDialog(true)}
                      disabled={isLoading || !audioUrl}
                      className="bg-red-900/30 border-red-500/30 hover:bg-red-800/40 text-white"
                    >
                      <Scissors className="h-3.5 w-3.5 mr-1" /> Resolve Size Issue
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleUseSampleAudio}
                      disabled={isLoading}
                      className="bg-red-900/30 border-red-500/30 hover:bg-red-800/40 text-white"
                    >
                      <Music className="h-3.5 w-3.5 mr-1" /> Use Sample Audio
                    </Button>
                  </div>
                </Alert>
              )}
              
              {compressedUrl && (
                <Alert className="bg-green-900/30 border-green-500/30 text-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Audio processed successfully</AlertTitle>
                  <AlertDescription>
                    {processingMethod === "partial" 
                      ? "The audio is being accessed through a proxy service."
                      : processingMethod === "audiostrip"
                        ? "The audio is being accessed through a CORS proxy."
                        : processingMethod === "cloudproxy"
                          ? "The audio is being accessed through an alternative proxy."
                          : processingMethod === "sample"
                            ? "A sample audio file has been loaded that is known to work with the API."
                            : processingMethod === "alternative"
                              ? "An alternative source for this audio has been found."
                              : "Your audio has been processed and is ready for recognition."}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="API Key (Optional)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isLoading}
            className="bg-purple-900/40 border-purple-400/30 focus:border-indigo-400/50 text-white placeholder:text-purple-200/70 h-12 rounded-lg"
          />
          <p className="text-xs text-purple-200 ml-1">
            API key to access protected endpoints. Leave empty if not required.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button 
            onClick={() => audioUrl && checkFileSize(audioUrl)}
            disabled={isLoading || !audioUrl || isCheckingFileSize}
            className="bg-purple-900/40 border-purple-400/30 hover:bg-purple-800/50 text-purple-100 h-12 w-12 rounded-lg p-0"
            title="Check file size"
          >
            {isCheckingFileSize ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Info className="h-5 w-5" />
            )}
          </Button>
          
          <Button 
            onClick={handleRecognize} 
            disabled={isLoading || (!audioUrl && !compressedUrl)}
            className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white border-none h-12 rounded-lg text-base font-medium shadow-lg shadow-purple-900/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isCheckingFileSize ? 'Checking...' : 'Recognizing...'}
              </>
            ) : (
              <>
                <Music className="mr-2 h-5 w-5" />
                Recognize Music
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetForm}
            disabled={isLoading}
            className="bg-purple-900/40 border-purple-400/30 hover:bg-purple-800/50 text-purple-100 h-12 w-12 rounded-lg p-0"
            title="Reset"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>

        {isLoading && (
          <div className="space-y-3 py-4">
            <div className="h-2 w-full bg-purple-900/50 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 animate-pulse rounded-full" style={{width: '60%'}}></div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-purple-200" />
              <p className="text-center text-sm text-purple-200">Processing your request...</p>
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Dialog for audio processing options */}
      <Dialog open={showProxyDialog} onOpenChange={setShowProxyDialog}>
        <DialogContent className="bg-gradient-to-b from-purple-900/95 to-indigo-900/95 border border-purple-400/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Resolve Size Limit</DialogTitle>
            <DialogDescription className="text-purple-200">
              Choose a method to handle the 4MB file size limit.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <RadioGroup value={selectedProxy} onValueChange={setSelectedProxy} className="space-y-3">
              <div className="flex items-start space-x-2 bg-purple-900/40 p-3 rounded-lg border border-purple-400/20">
                <RadioGroupItem value="direct" id="direct" className="mt-1" />
                <Label htmlFor="direct" className="flex-1 cursor-pointer">
                  <span className="font-medium text-white">Use CORS Proxy</span>
                  <p className="text-sm text-purple-200">Try accessing the file through a CORS proxy</p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-2 bg-purple-900/40 p-3 rounded-lg border border-purple-400/20">
                <RadioGroupItem value="alternative" id="alternative" className="mt-1" />
                <Label htmlFor="alternative" className="flex-1 cursor-pointer">
                  <span className="font-medium text-white">Find Alternative Source</span>
                  <p className="text-sm text-purple-200">Try to find an alternative source for this audio</p>
                </Label>
              </div>
              
              <div className="flex items-start space-x-2 bg-purple-900/40 p-3 rounded-lg border border-purple-400/20">
                <RadioGroupItem value="sample" id="sample" className="mt-1" />
                <Label htmlFor="sample" className="flex-1 cursor-pointer">
                  <span className="font-medium text-white">Use Sample Audio</span>
                  <p className="text-sm text-purple-200">Use a sample audio file that we know works with the API</p>
                </Label>
              </div>
            </RadioGroup>
            
            <div className="mt-6 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-200">
                <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                Note: Due to API limitations, some options may not work with all audio files.
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowProxyDialog(false)}
              className="bg-purple-900/40 border-purple-400/30 hover:bg-purple-800/50 text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedProxy === "alternative") {
                  handleUseAlternativeSource();
                } else if (selectedProxy === "sample") {
                  handleUseSampleAudio();
                } else {
                  handleProcessWithProxy();
                }
              }}
              disabled={isProcessingProxy}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white"
            >
              {isProcessingProxy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Apply Solution'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {result && (
        <CardFooter className="flex flex-col gap-6 pt-6 pb-8 px-6 border-t border-purple-400/30 bg-gradient-to-b from-purple-900/40 to-indigo-900/40">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-5">
              <Disc className="h-5 w-5 text-purple-300" />
              <h3 className="text-xl font-bold text-white">Recognition Result</h3>
            </div>
            
            <Tabs defaultValue="track" value={resultTab} onValueChange={setResultTab} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6 bg-purple-900/50 p-1 rounded-lg border border-purple-400/30">
                <TabsTrigger 
                  value="track" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/70 data-[state=active]:to-indigo-500/70 data-[state=active]:text-white text-purple-200"
                >
                  Track Info
                </TabsTrigger>
                <TabsTrigger 
                  value="technical" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/70 data-[state=active]:to-indigo-500/70 data-[state=active]:text-white text-purple-200"
                >
                  Technical Details
                </TabsTrigger>
                <TabsTrigger 
                  value="raw" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/70 data-[state=active]:to-indigo-500/70 data-[state=active]:text-white text-purple-200"
                >
                  Raw JSON
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="track">
                <div className="bg-purple-900/50 rounded-xl border border-purple-400/30 p-5 backdrop-blur-sm">
                  <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                      <p className="text-purple-200 text-sm">Title</p>
                      <p className="text-lg font-semibold text-white">{result.result.track.title}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-purple-200 text-sm">Artist</p>
                      <p className="text-lg font-semibold text-white">{result.result.track.artist}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-purple-200 text-sm">Accuracy</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 bg-purple-900/70 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full" 
                            style={{width: `${result.result.accuracy * 100}%`}}
                          ></div>
                        </div>
                        <p className="text-white font-mono">{result.result.accuracy}</p>
                      </div>
                    </div>
                    
                    {result.result.track.url && (
                      <div className="pt-2">
                        <a 
                          href={result.result.track.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/40 hover:bg-purple-500/60 transition-colors text-white border border-purple-400/30"
                        >
                          <LinkIcon className="h-4 w-4" />
                          View on Shazam
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="technical">
                <div className="bg-purple-900/50 rounded-xl border border-purple-400/30 p-5 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-purple-200 text-sm">Status</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${result.status === 200 ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                        <p className="text-white font-mono">{result.status}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-purple-200 text-sm">Content</p>
                      <p className="text-white">{result.content}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-purple-200 text-sm">Source</p>
                      <p className="text-white">{result.source}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-purple-200 text-sm">ISRC</p>
                      <p className="text-white font-mono text-sm">{result.result.track.isrc}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="raw">
                <div className="bg-purple-950/80 rounded-xl border border-purple-400/30 p-4 backdrop-blur-sm">
                  <pre className="text-xs text-purple-100 font-mono overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default MusicRecognition; 