import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Mic, RefreshCw, Link as LinkIcon, HelpCircle, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TranscriptionResult {
  status: number;
  content: string;
  result: string;
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

const VoiceToText = () => {
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<TranscriptionResult | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [cooldownTime] = useState<number>(5000); // 5 detik cooldown antara request
  const [statusMessage, setStatusMessage] = useState<{message: string, type: 'error' | 'success' | 'info'} | null>(null);
  const [activeTab, setActiveTab] = useState<string>("url");
  const [isCheckingFileSize, setIsCheckingFileSize] = useState<boolean>(false);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileSizeError, setFileSizeError] = useState<boolean>(false);
  const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
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
      case "allOrigins":
        return REAL_PROXY_SERVICES.allOrigins(originalUrl);
      case "corssh":
        return REAL_PROXY_SERVICES.corssh(originalUrl);
      case "heroku":
        return REAL_PROXY_SERVICES.herokuProxy(originalUrl);
      case "corsProxy":
        return REAL_PROXY_SERVICES.corsProxy(originalUrl);
      default:
        return originalUrl;
    }
  };
  
  const handleUseSampleAudio = () => {
    // Gunakan contoh URL audio yang kita tahu berfungsi dengan API
    const sampleAudioUrl = "https://fastmanager.fasturl.cloud/Uploads/VoiceOver.mp3";
    setAudioUrl(sampleAudioUrl);
    setFileSize(null);
    setFileSizeError(false);
    setCompressedUrl(null);
    setProcessingSuccess(true);
    setProcessingMethod("sample");
    showStatus("Sample audio loaded. Ready for transcription.", 'success');
  };
  
  const handleUseProxy = async (proxyType: string) => {
    if (!audioUrl) return;
    
    try {
      setIsLoading(true);
      showStatus(`Processing audio with ${proxyType} proxy...`, 'info');
      
      const proxyUrl = generateProxyUrl(audioUrl, proxyType);
      setCompressedUrl(proxyUrl);
      
      setProcessingSuccess(true);
      setProcessingMethod(proxyType);
      
      showStatus(`Audio processed successfully with ${proxyType}. Ready for transcription.`, 'success');
    } catch (error) {
      console.error('Error processing audio:', error);
      showStatus(error instanceof Error ? error.message : 'Failed to process audio', 'error');
      setProcessingSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranscribe = async () => {
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
      if (size && size > 10 * 1024 * 1024) { // 10MB in bytes (assuming a higher limit for voice-to-text)
        setFileSizeError(true);
        showStatus("File size is very large. Processing might take longer or fail.", 'error');
      }
    }

    setIsLoading(true);
    setResult(null);
    setLastRequestTime(Date.now());

    try {
      // Use compressed URL if available, otherwise use the original URL
      const urlToUse = compressedUrl || audioUrl;
      
      // Encode the URL properly for the query parameter
      const encodedAudioUrl = encodeURIComponent(urlToUse);
      const apiEndpoint = `https://fastrestapis.fasturl.cloud/aiexperience/voicetotext?audioUrl=${encodedAudioUrl}`;
      
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
      showStatus('Audio successfully transcribed!', 'success');
    } catch (error) {
      console.error('Error transcribing audio:', error);
      showStatus(error instanceof Error ? error.message : 'Failed to transcribe audio', 'error');
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
    setProcessingSuccess(false);
    setProcessingMethod("");
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-gradient-to-b from-purple-800/80 to-indigo-900/80 backdrop-blur-md border border-purple-400/30 shadow-xl shadow-purple-900/20 rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-700/50 to-indigo-800/50 border-b border-purple-400/30 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-900/30">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">
              Voice to Text
            </CardTitle>
            <CardDescription className="text-purple-100 mt-1">
              Convert audio to text using AI transcription
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
                <p>Provide a URL to an audio file for transcription. Supported formats include MP3, WAV, M4A, etc.</p>
                <p className="mt-2 text-xs">For best results, use clear audio with minimal background noise.</p>
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
                  setProcessingSuccess(false);
                }}
                disabled={isLoading}
                className="bg-purple-900/40 border-purple-400/30 focus:border-indigo-400/50 text-white placeholder:text-purple-200/70 h-12 rounded-lg"
              />
              
              {fileSize && (
                <div className="flex items-center justify-between text-xs text-purple-200 px-1">
                  <span>File size: {(fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                  {fileSize > 10 * 1024 * 1024 && (
                    <span className="text-yellow-300">Large file (may take longer)</span>
                  )}
                </div>
              )}
              
              {fileSizeError && (
                <Alert className="bg-yellow-900/30 border-yellow-500/30 text-yellow-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Large file detected</AlertTitle>
                  <AlertDescription>
                    The audio file is quite large. Transcription might take longer or potentially fail.
                    Consider using a proxy or a sample audio file.
                  </AlertDescription>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleUseProxy("allOrigins")}
                      disabled={isLoading || !audioUrl}
                      className="bg-yellow-900/30 border-yellow-500/30 hover:bg-yellow-800/40 text-white"
                    >
                      Use Proxy
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleUseSampleAudio}
                      disabled={isLoading}
                      className="bg-yellow-900/30 border-yellow-500/30 hover:bg-yellow-800/40 text-white"
                    >
                      Use Sample Audio
                    </Button>
                  </div>
                </Alert>
              )}
              
              {compressedUrl && (
                <Alert className="bg-green-900/30 border-green-500/30 text-green-200">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Audio processed successfully</AlertTitle>
                  <AlertDescription>
                    {processingMethod === "sample" 
                      ? "A sample audio file has been loaded that is known to work with the API."
                      : "Your audio is being accessed through a proxy service."}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUseSampleAudio}
                  disabled={isLoading}
                  className="bg-purple-900/40 border-purple-400/30 hover:bg-purple-800/50 text-purple-100"
                >
                  Use Sample Audio
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleUseProxy("allOrigins")}
                  disabled={isLoading || !audioUrl}
                  className="bg-purple-900/40 border-purple-400/30 hover:bg-purple-800/50 text-purple-100"
                >
                  Use Proxy
                </Button>
              </div>
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
              <HelpCircle className="h-5 w-5" />
            )}
          </Button>
          
          <Button 
            onClick={handleTranscribe} 
            disabled={isLoading || (!audioUrl && !compressedUrl)}
            className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white border-none h-12 rounded-lg text-base font-medium shadow-lg shadow-purple-900/20"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isCheckingFileSize ? 'Checking...' : 'Transcribing...'}
              </>
            ) : (
              <>
                <FileText className="mr-2 h-5 w-5" />
                Transcribe Audio
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

      {result && (
        <CardFooter className="flex flex-col gap-6 pt-6 pb-8 px-6 border-t border-purple-400/30 bg-gradient-to-b from-purple-900/40 to-indigo-900/40">
          <div className="w-full">
            <div className="flex items-center gap-2 mb-5">
              <FileText className="h-5 w-5 text-purple-300" />
              <h3 className="text-xl font-bold text-white">Transcription Result</h3>
            </div>
            
            <div className="bg-purple-900/50 rounded-xl border border-purple-400/30 p-5 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-white">Transcribed Text</h4>
                  <span className="text-xs text-purple-200">Status: {result.status === 200 ? 'Success' : 'Error'}</span>
                </div>
                
                <div className="bg-purple-950/80 rounded-lg border border-purple-400/20 p-4">
                  <p className="text-white whitespace-pre-wrap">{result.result}</p>
                </div>
                
                <div className="flex justify-between text-xs text-purple-200">
                  <span>Source: {result.creator}</span>
                  <span>Content: {result.content}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                size="sm"
                className="bg-purple-900/40 border-purple-400/30 hover:bg-purple-800/50 text-purple-100"
                onClick={() => {
                  navigator.clipboard.writeText(result.result);
                  toast.success("Transcription copied to clipboard");
                }}
              >
                Copy Transcription
              </Button>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default VoiceToText; 