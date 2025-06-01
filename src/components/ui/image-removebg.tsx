import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Image, Loader2, Download, RefreshCw, Upload, Link as LinkIcon, X, History, Trash2, Share2, FileInput, Settings, Check } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  getImageHistory, 
  saveImageHistory, 
  saveImageAsBase64, 
  exportImageHistoryAsToken, 
  importImageHistoryFromToken, 
  mergeImageHistoryFromToken,
  exportCompactImageHistoryAsToken,
  importDataFromCompressedToken,
  exportSelectedImageHistoryAsToken
} from "@/lib/storage";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Interface for history item
interface HistoryItem {
  id: string;
  originalImage: string | null;
  resultImage: string;
  timestamp: number;
  name?: string;
}

const ImageRemoveBg = () => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [tokenLimit] = useState<number>(1000); // Example token limit
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("url");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [cooldownTime] = useState<number>(5000); // 5 second cooldown between requests
  const [statusMessage, setStatusMessage] = useState<{message: string, type: 'error' | 'success' | 'info'} | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showShareDialog, setShowShareDialog] = useState<boolean>(false);
  const [shareToken, setShareToken] = useState<string>("");
  const [importToken, setImportToken] = useState<string>("");
  const [exportLimit, setExportLimit] = useState<number>(1);
  const [includeOriginals, setIncludeOriginals] = useState<boolean>(false);
  const [exportMode, setExportMode] = useState<'standard' | 'compact'>('standard');
  const [historyTab, setHistoryTab] = useState<string>("items");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Load history from localStorage when component mounts
  useEffect(() => {
    const savedHistory = getImageHistory();
    if (savedHistory && Array.isArray(savedHistory)) {
      setHistory(savedHistory);
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    if (history.length > 0) {
      saveImageHistory(history);
    }
  }, [history]);
  
  const showStatus = (message: string, type: 'error' | 'success' | 'info') => {
    setStatusMessage({ message, type });
    
    toast({
      title: type === 'error' ? 'Error' : type === 'success' ? 'Success' : 'Info',
      description: message,
      variant: type === 'error' ? 'destructive' : 'default'
    });
  };
  
  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      showStatus("Please select an image file", 'error');
      return false;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showStatus("File size exceeds 5MB limit", 'error');
      return false;
    }
    
    return true;
  };
  
  const processFile = (file: File) => {
    if (!validateFile(file)) return;
    
    setUploadedImage(file);
    setImageUrl('');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const preview = event.target?.result as string;
      setUploadedImagePreview(preview);
      setOriginalImage(preview);
    };
    reader.readAsDataURL(file);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);
  
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
  
  const fetchImageFromUrl = async () => {
    if (!imageUrl) {
      showStatus("Please enter an image URL", 'error');
      return;
    }
    
    try {
      showStatus("Fetching image...", 'info');
      
      // Set originalImage to the entered URL
      setOriginalImage(imageUrl);
      
      // Create an image element to verify that the URL is valid
      const img = document.createElement('img');
      
      // Create a promise to wait for the image to load
      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image from URL"));
        img.crossOrigin = "anonymous"; // Important for CORS
        img.src = imageUrl;
      });
      
      // Wait for the image to load
      await imageLoadPromise;
      
      // If successful, we'll use the URL directly for background removal
      showStatus('Image loaded successfully!', 'success');
    } catch (error) {
      console.error('Error fetching image:', error);
      showStatus(error instanceof Error ? error.message : 'Failed to fetch image', 'error');
      setOriginalImage(null);
    }
  };

  const removeBackground = async (imageUrl: string) => {
    try {
      showStatus('Removing background...', 'info');
      
      // API URL for background removal
      const apiUrl = `https://api.ryzumi.vip/api/ai/removebg?url=${encodeURIComponent(imageUrl)}`;
      
      console.log("Calling API:", { 
        imageUrl, 
        fullUrl: apiUrl 
      });
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'image/png, image/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to remove background (${response.status})`);
      }
      
      // Check content type to handle different response formats
      const contentType = response.headers.get('content-type');
      
      let resultImageUrl;
      
      if (contentType && contentType.includes('image/')) {
        // The API returned an image directly (not JSON)
        const imageBlob = await response.blob();
        resultImageUrl = URL.createObjectURL(imageBlob);
      } else {
        // Try to parse as JSON as fallback
        try {
          const text = await response.text();
          const responseData = JSON.parse(text);
          
          if (!responseData || !responseData.url) {
            throw new Error('Invalid response from API');
          }
          
          resultImageUrl = responseData.url;
        } catch (e) {
          console.error("Response parsing error:", e);
          throw new Error("Invalid response format from API");
        }
      }
      
      // Update UI with processed image
      setResultImage(resultImageUrl);
      
      // Add to history
      addToHistory(resultImageUrl);
      
      showStatus('Background removed successfully!', 'success');
    } catch (error) {
      console.error('Error:', error);
      showStatus(error instanceof Error ? error.message : 'Failed to remove background. Please try again.', 'error');
      setResultImage(null);
    }
  };
  
  // Function to add an item to history
  const addToHistory = async (resultImageUrl: string) => {
    try {
      // Detect mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Convert images to base64 for more permanent storage
      let originalBase64 = null;
      let resultBase64 = null;
      
      // For original image
      if (originalImage) {
        try {
          // Make sure we always save as base64
          originalBase64 = await saveImageAsBase64(originalImage);
          
          // Resize if mobile to save space
          if (isMobile && originalBase64) {
            originalBase64 = await saveImageAsBase64WithResize(originalBase64, 400);
          }
        } catch (error) {
          console.error('Error converting original to base64:', error);
          originalBase64 = null;
        }
      }
      
      // For result image
      try {
        // Make sure we always save as base64
        resultBase64 = await saveImageAsBase64(resultImageUrl);
        
        // Resize if mobile to save space
        if (isMobile && resultBase64) {
          resultBase64 = await saveImageAsBase64WithResize(resultBase64, 800);
        }
      } catch (error) {
        console.error('Error converting result to base64:', error);
        // Fallback to original URL if conversion fails
        resultBase64 = resultImageUrl;
      }
      
      // Generate unique ID
      const id = `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create new history item
      const newItem: HistoryItem = {
        id,
        originalImage: originalBase64,
        resultImage: resultBase64,
        timestamp: Date.now(),
        name: uploadedImage?.name || `image_${new Date().toLocaleDateString()}`
      };
      
      // Add to history (limit to 10 items)
      setHistory(prev => {
        const newHistory = [newItem, ...prev].slice(0, 10);
        return newHistory;
      });
    } catch (error) {
      console.error('Error adding to history:', error);
      showStatus('Failed to save to history', 'error');
    }
  };

  // Function to resize image before conversion to base64 (for mobile devices)
  const saveImageAsBase64WithResize = (imageUrl: string, maxDimension: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new globalThis.Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        
        // Create canvas for resizing the image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw to canvas with new size
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with lower quality for mobile
        try {
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(base64);
        } catch (e) {
          reject(e);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for resizing'));
      };
      
      img.src = imageUrl;
    });
  };

  // Function to load item from history
  const loadFromHistory = (item: HistoryItem) => {
    setOriginalImage(item.originalImage);
    setResultImage(item.resultImage);
    setShowHistory(false);
    
    showStatus('Loaded image from history', 'success');
  };

  // Function to delete item from history
  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent parent onClick trigger
    
    setHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      saveImageHistory(newHistory);
      return newHistory;
    });
    
    showStatus('Removed from history', 'info');
  };

  // Function to clear all history
  const clearHistory = () => {
    setHistory([]);
    saveImageHistory([]);
    showStatus('History cleared', 'info');
  };

  // This correctly uses POST for file uploads
  const uploadToTempServer = async (file: File): Promise<string> => {
    try {
      showStatus('Uploading image to temporary storage...', 'info');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',  // POST is correct here for file uploads
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }
      
      const uploadResult = await uploadResponse.json();
      // Convert the URL to direct download link
      const directUrl = uploadResult.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');
      
      return directUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image to temporary storage');
    }
  };
  
  const handleRemoveBackground = async () => {
    if (!uploadedImage && !imageUrl) {
      showStatus('Please select an image or enter an image URL', 'error');
      return;
    }
    
    // Enhanced anti-flooding check - this ensures we don't make too many requests in a short time
    if (!checkCooldown()) {
      return;
    }
    
    setIsLoading(true);
    setResultImage(null);
    setLastRequestTime(Date.now());
    
    try {
      // Simulate token usage
      setTokenCount(prev => Math.min(prev + 50, tokenLimit));
      
      // If URL tab is active and URL exists, use URL directly
      if (activeTab === "url" && imageUrl) {
        // Use URL directly without uploading to temporary server
        await removeBackground(imageUrl);
      } else if (uploadedImage) {
        // If we have an uploaded file, upload to temporary server
        const targetImageUrl = await uploadToTempServer(uploadedImage);
        // Then use that URL for background removal
        await removeBackground(targetImageUrl);
      } else {
        throw new Error('No image selected');
      }
    } catch (error) {
      console.error('Error:', error);
      showStatus(error instanceof Error ? error.message : 'Failed to remove background. Please try again.', 'error');
      setResultImage(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (resultImage) {
      try {
        // For blob URLs, we need to get the blob first
        if (resultImage.startsWith('blob:')) {
          fetch(resultImage)
            .then(res => res.blob())
            .then(blob => {
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              const fileName = uploadedImage ? 
                `nobg_${uploadedImage.name}` : 
                `nobg_image.png`;
              link.download = fileName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              
              showStatus('Image downloaded successfully', 'success');
            })
            .catch(err => {
              console.error('Download error:', err);
              showStatus('Failed to download image', 'error');
            });
        } else {
          // For base64 images, we can use the URL directly
          const link = document.createElement('a');
          link.href = resultImage;
          const fileName = uploadedImage ? 
            `nobg_${uploadedImage.name}` : 
            `nobg_image.png`;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          showStatus('Image downloaded successfully', 'success');
        }
      } catch (error) {
        console.error('Download error:', error);
        showStatus('Failed to download image', 'error');
      }
    }
  };
  
  const resetForm = () => {
    setImageUrl("");
    setUploadedImage(null);
    setUploadedImagePreview(null);
    setOriginalImage(null);
    setResultImage(null);
    setShowHistory(false); // Close history view if open
  };

  // Function to export history as token
  const handleExportHistory = () => {
    try {
      let token;
      
      if (exportMode === 'compact') {
        if (selectedImages.length > 0) {
          // Use export function with selected IDs
          token = exportSelectedImageHistoryAsToken(selectedImages, includeOriginals);
        } else {
          // Use export function with limit
          token = exportCompactImageHistoryAsToken(exportLimit, includeOriginals);
        }
      } else {
        token = exportImageHistoryAsToken();
      }
      
      setShareToken(token);
      showStatus('History token generated successfully', 'success');
    } catch (error) {
      console.error('Error exporting history:', error);
      showStatus('Failed to generate history token', 'error');
    }
  };

  // Function to manage image selection
  const toggleImageSelection = (id: string) => {
    setSelectedImages(prev => {
      if (prev.includes(id)) {
        return prev.filter(imageId => imageId !== id);
      } else {
        // Limit to max 3 images
        if (prev.length >= 3) {
          showStatus('Maximum 3 images can be selected', 'info');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Function to toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(prev => !prev);
    // Reset selection when exiting selection mode
    if (selectionMode) {
      setSelectedImages([]);
    }
  };

  // Function to import history from token
  const handleImportHistory = () => {
    try {
      if (!importToken.trim()) {
        showStatus('Please enter a valid token', 'error');
        return;
      }

      let success;
      
      // Try to import with compressed format first
      try {
        success = importDataFromCompressedToken(importToken);
      } catch (e) {
        // If it fails, try with standard format
        success = mergeImageHistoryFromToken(importToken);
      }
      
      if (success) {
        // Refresh history from localStorage
        const savedHistory = getImageHistory();
        if (savedHistory && Array.isArray(savedHistory)) {
          setHistory(savedHistory);
        }
        
        setImportToken('');
        showStatus('History imported successfully', 'success');
      } else {
        showStatus('Invalid token or no new items to import', 'error');
      }
    } catch (error) {
      console.error('Error importing history:', error);
      showStatus('Failed to import history', 'error');
    }
  };

  // Function to copy token to clipboard
  const copyTokenToClipboard = () => {
    navigator.clipboard.writeText(shareToken)
      .then(() => {
        showStatus('Token copied to clipboard', 'success');
      })
      .catch((error) => {
        console.error('Error copying to clipboard:', error);
        showStatus('Failed to copy token', 'error');
      });
  };

  return (
    <Card className="bg-[#150b30]/70 border-[#2a1b4a] hover:bg-[#1d1040]/90 transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg">
            <Image className="text-white" size={28} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-white text-xl mb-2">
              AI Background Remover
            </CardTitle>
            <span className="inline-block px-3 py-1 bg-purple-600/20 text-purple-300 text-xs font-medium rounded-full border border-purple-500/30">
              image
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(!showHistory)}
            className="text-purple-300 hover:text-purple-100 hover:bg-purple-600/20"
            title="View History"
          >
            <History size={20} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-gray-300 leading-relaxed text-base mb-4">
          Remove backgrounds from your images with AI technology. Get transparent PNG images with just one click.
        </CardDescription>
        
        {showHistory ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-medium">History</h3>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={toggleSelectionMode}
                  className={`text-xs ${selectionMode ? 'bg-purple-600/30 text-purple-200' : 'text-gray-400 hover:text-white'}`}
                >
                  {selectionMode ? 'Cancel Selection' : 'Select Images'}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowShareDialog(true)}
                  className="text-xs text-gray-400 hover:text-white"
                  disabled={history.length === 0}
                >
                  <Share2 className="h-3.5 w-3.5 mr-1" />
                  Share
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearHistory}
                  className="text-xs text-gray-400 hover:text-white hover:bg-red-900/20"
                  disabled={history.length === 0}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
            
            {history.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 mx-auto bg-purple-800/20 rounded-full flex items-center justify-center mb-4">
                  <History className="text-purple-300/50" size={28} />
                </div>
                <p className="text-gray-400">No history found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    className={`relative group rounded-lg border ${selectionMode ? 'cursor-pointer' : ''} ${
                      selectedImages.includes(item.id) 
                        ? 'border-purple-500 bg-purple-900/30' 
                        : 'border-[#2a1b4a] bg-[#150b30]/60 hover:bg-[#1d1040]/80'
                    } p-3 transition-all duration-200`}
                    onClick={() => selectionMode ? toggleImageSelection(item.id) : loadFromHistory(item)}
                  >
                    {selectionMode && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className={`w-5 h-5 rounded flex items-center justify-center ${
                          selectedImages.includes(item.id) 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-white/10'
                        }`}>
                          {selectedImages.includes(item.id) && <Check size={12} />}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <div className="flex-shrink-0 w-24 h-24 rounded overflow-hidden bg-gray-800/50">
                        {item.resultImage && (
                          <img 
                            src={item.resultImage} 
                            alt="Result" 
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-gray-300 truncate">{item.name}</p>
                          {!selectionMode && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-gray-500 hover:text-white hover:bg-red-900/20"
                              onClick={(e) => deleteFromHistory(item.id, e)}
                            >
                              <X size={14} />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <Tabs 
              defaultValue={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-[#150b30]">
                <TabsTrigger value="url">Image URL</TabsTrigger>
                <TabsTrigger value="upload">Upload Image</TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="mt-4 space-y-4">
                <div className="flex space-x-2">
                  <Input
                    type="text"
                    placeholder="Enter image URL..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 bg-[#150b30] border-[#2a1b4a] text-white"
                  />
                  <Button 
                    variant="outline" 
                    onClick={fetchImageFromUrl}
                    className="border-[#2a1b4a] text-purple-300 hover:bg-purple-900/30"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Fetch
                  </Button>
                </div>
                <p className="text-xs text-gray-500">Enter a direct link to an image (JPG, PNG)</p>
              </TabsContent>
              
              <TabsContent value="upload" className="mt-4 space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${
                    isDragging
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-[#2a1b4a] hover:border-purple-600/50 hover:bg-[#150b30]'
                  } transition-all duration-200`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {uploadedImagePreview ? (
                    <div className="space-y-4">
                      <div className="relative mx-auto max-w-xs rounded overflow-hidden">
                        <img
                          src={uploadedImagePreview}
                          alt="Preview"
                          className="max-h-48 mx-auto"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setUploadedImage(null);
                            setUploadedImagePreview(null);
                          }}
                          className="absolute top-2 right-2 bg-black/50 text-white rounded-full h-6 w-6"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                      <p className="text-sm text-gray-300">
                        {uploadedImage?.name} ({Math.round(uploadedImage?.size / 1024)} KB)
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                      <p className="text-sm text-gray-300 mb-2">Drag & drop an image here</p>
                      <p className="text-xs text-gray-500 mb-4">or</p>
                      <Button
                        variant="outline"
                        onClick={handleUploadClick}
                        className="border-[#2a1b4a] text-purple-300 hover:bg-purple-900/30"
                      >
                        Browse Files
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="pt-4 space-y-6">
              <div className="flex justify-between items-center">
                <Button
                  onClick={handleRemoveBackground}
                  disabled={isLoading || (!imageUrl && !uploadedImage)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Remove Background
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="border-[#2a1b4a] text-purple-300 hover:bg-purple-900/30"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
              
              {tokenCount > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">API Token Usage</span>
                    <span className="text-gray-400">{tokenCount}/{tokenLimit}</span>
                  </div>
                  <Progress value={(tokenCount / tokenLimit) * 100} className="h-1" />
                </div>
              )}
              
              {resultImage && (
                <div className="rounded-lg border border-[#2a1b4a] bg-[#150b30]/60 p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-medium">Result</h3>
                    <Button
                      variant="outline"
                      onClick={handleDownload}
                      className="border-[#2a1b4a] text-purple-300 hover:bg-purple-900/30"
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {originalImage && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400">Original</p>
                        <div className="rounded border border-[#2a1b4a] bg-gray-900/50 overflow-hidden">
                          <img
                            src={originalImage}
                            alt="Original"
                            className="max-h-64 mx-auto"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400">No Background</p>
                      <div className="rounded border border-[#2a1b4a] bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAOxAAADsQBlSsOGwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAETSURBVDiNpZIxTsNAEEXfOJYTpUUUXCASUj5lbsJZcgFOwll8D25BCwXIUpzkAJZSREo0JIrXxSZyQnYdR/7S7Gj2v/l/dgdeqHPuJIRwlVLahRCuyrLcxpbUsw9FUZz7vr9JKb2XUr5lWXZuZg/fDMzsHVjHGLehhbvC3QeNMcaqqqrhnIEB7v4MrMzszsy2MUZCCKtxPcaIu6/MrMcYY2yBewSGP/B94Ol0BpyZ2XLwNwvg1MzWADnn/WjAOXdSVdUD0JjZ3WD+DXQxxl3OeQ+0OeehmVVDp0FgCNyXUm6APefcaQjhuvf+ZVzn+/5l8ASbcYHZM/5L809grNmnwtyHVBTFuZk9/nZ+A6TzR/fpX431AAAAAElFTkSuQmCC')] overflow-hidden">
                        <img
                          src={resultImage}
                          alt="No Background"
                          className="max-h-64 mx-auto"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      
      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="bg-[#150b30] border-[#2a1b4a] text-white">
          <DialogHeader>
            <DialogTitle>Share History</DialogTitle>
            <DialogDescription className="text-gray-400">
              Export your history as a token to share with others.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Label className="text-sm text-gray-300">Export Mode</Label>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExportMode('standard')}
                  className={`text-xs ${exportMode === 'standard' ? 'bg-purple-600/30 border-purple-500' : 'border-[#2a1b4a]'}`}
                >
                  Standard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExportMode('compact')}
                  className={`text-xs ${exportMode === 'compact' ? 'bg-purple-600/30 border-purple-500' : 'border-[#2a1b4a]'}`}
                >
                  Compact
                </Button>
              </div>
            </div>
            
            {exportMode === 'compact' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="export-limit" className="text-sm text-gray-300 min-w-[100px]">
                    Items to Export
                  </Label>
                  <Input
                    id="export-limit"
                    type="number"
                    min="1"
                    max="10"
                    value={exportLimit}
                    onChange={(e) => setExportLimit(parseInt(e.target.value) || 1)}
                    className="w-20 bg-[#150b30] border-[#2a1b4a]"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-original"
                    checked={includeOriginals}
                    onCheckedChange={(checked) => setIncludeOriginals(!!checked)}
                  />
                  <Label htmlFor="include-original" className="text-sm text-gray-300">
                    Include original images
                  </Label>
                </div>
              </div>
            )}
            
            <div className="pt-2">
              <Button
                onClick={handleExportHistory}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                Generate Token
              </Button>
            </div>
            
            {shareToken && (
              <div className="space-y-2 pt-2">
                <Label className="text-sm text-gray-300">Share Token</Label>
                <div className="flex space-x-2">
                  <Textarea
                    value={shareToken}
                    readOnly
                    className="bg-[#150b30] border-[#2a1b4a] text-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={copyTokenToClipboard}
                  className="w-full border-[#2a1b4a] text-purple-300 hover:bg-purple-900/30"
                >
                  Copy to Clipboard
                </Button>
              </div>
            )}
            
            <div className="border-t border-[#2a1b4a] pt-4 mt-4">
              <Label className="text-sm text-gray-300 mb-2 block">Import from Token</Label>
              <div className="flex space-x-2">
                <Textarea
                  value={importToken}
                  onChange={(e) => setImportToken(e.target.value)}
                  placeholder="Paste token here..."
                  className="bg-[#150b30] border-[#2a1b4a] text-xs"
                />
              </div>
              <Button
                variant="outline"
                onClick={handleImportHistory}
                className="w-full mt-2 border-[#2a1b4a] text-purple-300 hover:bg-purple-900/30"
              >
                Import History
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default ImageRemoveBg; 