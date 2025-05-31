import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { Image, Loader2, Download, RefreshCw, Upload, Link as LinkIcon, X, History, Trash2, Share2, FileInput } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  getImageHistory, 
  saveImageHistory, 
  saveImageAsBase64, 
  exportImageHistoryAsToken, 
  importImageHistoryFromToken, 
  mergeImageHistoryFromToken 
} from "@/lib/storage";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

// Deklarasi tipe window
declare global {
  interface Window {
    _lastObjectUrl: string | null;
  }
}

// Inisialisasi property global
if (typeof window !== 'undefined') {
  window._lastObjectUrl = null;
}

// Interface untuk history item
interface HistoryItem {
  id: string;
  originalImage: string | null;
  resultImage: string;
  resizeFactor: string;
  timestamp: number;
  name?: string;
}

const ImageSuperscale = () => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [resizeFactor, setResizeFactor] = useState<string>("4");
  const [isAnime, setIsAnime] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [tokenCount, setTokenCount] = useState<number>(0);
  const [tokenLimit] = useState<number>(1000); // Contoh batas token
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("url");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [cooldownTime] = useState<number>(5000); // 5 detik cooldown antara request
  const [statusMessage, setStatusMessage] = useState<{message: string, type: 'error' | 'success' | 'info'} | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showShareDialog, setShowShareDialog] = useState<boolean>(false);
  const [shareToken, setShareToken] = useState<string>("");
  const [importToken, setImportToken] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const resizeOptions = ["2", "4", "6", "8", "16"];
  
  // Load history dari localStorage saat komponen mount
  useEffect(() => {
    const savedHistory = getImageHistory();
    if (savedHistory && Array.isArray(savedHistory)) {
      setHistory(savedHistory);
    }
  }, []);

  // Simpan history ke localStorage saat berubah
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
      
      // Pendekatan langsung - gunakan URL gambar sebagai sumber untuk elemen img
      // dan kemudian gambar langsung diproses untuk upscale
      
      // Set originalImage ke URL yang dimasukkan
      setOriginalImage(imageUrl);
      
      // Untuk kompatibilitas dengan fungsi upscale, kita tetap perlu membuat
      // objek File atau Blob, tapi kita akan melakukannya dengan cara yang berbeda
      
      // Buat elemen gambar untuk memverifikasi bahwa URL valid
      const img = document.createElement('img');
      
      // Buat promise untuk menunggu gambar dimuat
      const imageLoadPromise = new Promise((resolve, reject) => {
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Failed to load image from URL"));
        img.crossOrigin = "anonymous"; // Penting untuk CORS
        img.src = imageUrl;
      });
      
      // Tunggu gambar dimuat
      await imageLoadPromise;
      
      // Jika berhasil, kita akan menggunakan URL langsung untuk upscale
      showStatus('Image loaded successfully!', 'success');
      
      // Kita tidak perlu mengubah URL menjadi File/Blob untuk upscale
      // Cukup gunakan URL langsung
    } catch (error) {
      console.error('Error fetching image:', error);
      showStatus(error instanceof Error ? error.message : 'Failed to fetch image', 'error');
      setOriginalImage(null);
    }
  };
  
  const enhanceImageDirectly = async (imageUrl) => {
    try {
      showStatus('Enhancing image...', 'info');
      
      // Panggil API superscale langsung dengan URL gambar
      const apiUrl = `https://fastrestapis.fasturl.cloud/aiimage/superscale?imageUrl=${encodeURIComponent(imageUrl)}&resize=${resizeFactor}&anime=${isAnime}`;
      
      console.log("Calling API with params:", { 
        endpoint: "superscale", 
        imageUrl, 
        resize: resizeFactor, 
        anime: isAnime,
        fullUrl: apiUrl 
      });
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to enhance image (${response.status})`);
      }
      
      // Get the response JSON
      const responseData = await response.json();
      
      if (!responseData || !responseData.result) {
        throw new Error('Invalid response from API');
      }

      const resultUrl = responseData.result;

      // Deteksi perangkat mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Pada perangkat mobile, kita perlu lebih berhati-hati dengan ukuran gambar
      let resultImageUrl;
      
      try {
        // Untuk perangkat mobile, gunakan URL langsung
        if (isMobile) { 
          console.log("Mobile device detected, using direct URL");
          
          // Gunakan URL hasil langsung
          resultImageUrl = resultUrl;
          
          // Update UI with enhanced image
          setResultImage(resultImageUrl);
          
          // Add to history with URL reference
          addToHistory(resultImageUrl);
          
          showStatus('Image enhanced successfully!', 'success');
        } else {
          // Untuk desktop, kita bisa menggunakan URL langsung juga
          resultImageUrl = resultUrl;
            
            // Update UI with enhanced image
          setResultImage(resultImageUrl);
            
            // Add to history
          addToHistory(resultImageUrl);
            
            showStatus('Image enhanced successfully!', 'success');
        }
      } catch (memoryError) {
        console.error('Memory error:', memoryError);
        showStatus('Device memory limit reached. Try a smaller image or lower resize factor.', 'error');
        setResultImage(null);
      }
    } catch (error) {
      console.error('Error:', error);
      showStatus(error instanceof Error ? error.message : 'Failed to enhance image. Please try again.', 'error');
      setResultImage(null);
    }
  };
  
  // Fungsi untuk menambahkan item ke history
  const addToHistory = async (resultImageUrl: string) => {
    try {
      // Deteksi perangkat mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Konversi gambar ke base64 untuk penyimpanan yang lebih permanen
      let originalBase64 = null;
      let resultBase64 = null;
      
      // Untuk gambar original
      if (originalImage) {
        try {
          // Pastikan kita selalu menyimpan sebagai base64
          originalBase64 = await saveImageAsBase64(originalImage);
          
          // Resize jika mobile untuk menghemat ruang
          if (isMobile && originalBase64) {
            originalBase64 = await saveImageAsBase64WithResize(originalBase64, 400);
          }
        } catch (error) {
          console.error('Error converting original to base64:', error);
          originalBase64 = null;
        }
      }
      
      // Untuk gambar hasil
      try {
        // Pastikan kita selalu menyimpan sebagai base64
        resultBase64 = await saveImageAsBase64(resultImageUrl);
        
        // Resize jika mobile untuk menghemat ruang
        if (isMobile && resultBase64) {
          resultBase64 = await saveImageAsBase64WithResize(resultBase64, 800);
        }
      } catch (error) {
        console.error('Error converting result to base64:', error);
        // Fallback ke URL asli jika gagal konversi
        resultBase64 = resultImageUrl;
      }
      
      // Generate ID unik
      const id = `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Buat item history baru
      const newItem: HistoryItem = {
        id,
        originalImage: originalBase64,
        resultImage: resultBase64,
        resizeFactor,
        timestamp: Date.now(),
        name: uploadedImage?.name || `image_${new Date().toLocaleDateString()}`
      };
      
      // Tambahkan ke history (batasi hingga 10 item)
      setHistory(prev => {
        const newHistory = [newItem, ...prev].slice(0, 10);
        return newHistory;
      });
    } catch (error) {
      console.error('Error adding to history:', error);
      showStatus('Failed to save to history', 'error');
    }
  };

  // Fungsi untuk resize gambar sebelum konversi ke base64 (untuk perangkat mobile)
  const saveImageAsBase64WithResize = (imageUrl: string, maxDimension: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new globalThis.Image();
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        // Hitung dimensi baru dengan mempertahankan aspek rasio
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        
        // Buat canvas untuk resize gambar
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Gambar ke canvas dengan ukuran baru
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Konversi ke base64 dengan kualitas lebih rendah untuk mobile
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

  // Fungsi untuk memuat item dari history
  const loadFromHistory = (item: HistoryItem) => {
    setOriginalImage(item.originalImage);
    setResultImage(item.resultImage);
    setResizeFactor(item.resizeFactor);
    setShowHistory(false);
    
    showStatus('Loaded image from history', 'success');
  };

  // Fungsi untuk menghapus item dari history
  const deleteFromHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Mencegah trigger onClick parent
    
    setHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      saveImageHistory(newHistory);
      return newHistory;
    });
    
    showStatus('Removed from history', 'info');
  };

  // Fungsi untuk menghapus semua history
  const clearHistory = () => {
    setHistory([]);
    saveImageHistory([]);
    showStatus('History cleared', 'info');
  };
  
  const uploadToTempServer = async (file: File): Promise<string> => {
    try {
      showStatus('Uploading image to temporary storage...', 'info');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
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
  
  const handleSuperscale = async () => {
    if (!uploadedImage && !imageUrl) {
      showStatus('Please select an image or enter an image URL', 'error');
      return;
    }
    
    // Check cooldown to prevent flooding
    if (!checkCooldown()) {
      return;
    }
    
    setIsLoading(true);
    setResultImage(null);
    setLastRequestTime(Date.now());
    
    try {
      // Simulasi penggunaan token
      setTokenCount(prev => Math.min(prev + 50, tokenLimit));
      
      // Jika URL tab aktif dan URL ada, gunakan URL langsung
      if (activeTab === "url" && imageUrl) {
        // Gunakan URL langsung tanpa perlu upload ke server sementara
        await enhanceImageDirectly(imageUrl);
      } else if (uploadedImage) {
        // Jika kita memiliki file yang diupload, upload ke server sementara
        const targetImageUrl = await uploadToTempServer(uploadedImage);
        // Kemudian gunakan URL tersebut untuk upscale
        await enhanceImageDirectly(targetImageUrl);
      } else {
        throw new Error('No image selected');
      }
    } catch (error) {
      console.error('Error:', error);
      showStatus(error instanceof Error ? error.message : 'Failed to enhance image. Please try again.', 'error');
      setResultImage(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = () => {
    if (resultImage) {
      try {
        // Untuk blob URL, kita perlu mengambil blob terlebih dahulu
        if (resultImage.startsWith('blob:')) {
          fetch(resultImage)
            .then(res => res.blob())
            .then(blob => {
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              const fileName = uploadedImage ? 
                `enhanced_${resizeFactor}x_${uploadedImage.name}` : 
                `enhanced_${resizeFactor}x_image.png`;
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
          // Untuk gambar base64, kita bisa langsung menggunakan URL tersebut
          const link = document.createElement('a');
          link.href = resultImage;
          const fileName = uploadedImage ? 
            `enhanced_${resizeFactor}x_${uploadedImage.name}` : 
            `enhanced_${resizeFactor}x_image.png`;
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
    setResizeFactor("4");
    setIsAnime(false);
    setApiKey("");
    setShowHistory(false); // Tutup tampilan history jika sedang terbuka
  };

  // Fungsi untuk mengekspor history sebagai token
  const handleExportHistory = () => {
    try {
      const token = exportImageHistoryAsToken();
      setShareToken(token);
      setShowShareDialog(true);
      showStatus('History token generated successfully', 'success');
    } catch (error) {
      console.error('Error exporting history:', error);
      showStatus('Failed to generate history token', 'error');
    }
  };

  // Fungsi untuk mengimpor history dari token
  const handleImportHistory = () => {
    try {
      if (!importToken.trim()) {
        showStatus('Please enter a valid token', 'error');
        return;
      }

      const success = mergeImageHistoryFromToken(importToken);
      
      if (success) {
        // Refresh history dari localStorage
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

  // Fungsi untuk menyalin token ke clipboard
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

  // Tambahkan ini di bagian render, di dekat tombol History
  const renderHistoryDialog = () => (
    <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Image History</DialogTitle>
          <DialogDescription>
            Copy this token and share it with others to let them import your image history.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Textarea
              value={shareToken}
              readOnly
              className="h-20"
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="secondary" onClick={copyTokenToClipboard}>
            Copy
          </Button>
          <Button type="button" variant="outline" onClick={() => setShowShareDialog(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Tambahkan ini di bagian render, di dekat tombol History
  const renderHistoryActions = () => (
    <div className="flex flex-col sm:flex-row gap-2 mt-4">
      <Button 
        variant="outline" 
        size="sm"
        className="flex items-center gap-1"
        onClick={handleExportHistory}
      >
        <Share2 className="h-4 w-4" />
        Export History
      </Button>
      
      <div className="flex flex-1 gap-2">
        <Input
          placeholder="Paste history token here"
          value={importToken}
          onChange={(e) => setImportToken(e.target.value)}
          className="h-9"
        />
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleImportHistory}
        >
          Import
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="bg-[#150b30]/70 border-[#2a1b4a] hover:bg-[#1d1040]/90 transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center shadow-lg">
            <Image className="text-white" size={28} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-white text-xl mb-2">
              AI Image Enhancer 
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
          Enhance your images with AI technology. Transform low-resolution images into high-quality masterpieces.
        </CardDescription>
        
        {showHistory ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-medium">History</h3>
              {history.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearHistory} 
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  Clear All
                </Button>
              )}
            </div>
            
            {/* Add the history actions here */}
            {renderHistoryActions()}
            
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No history yet. Enhanced images will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                {history.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => loadFromHistory(item)}
                    className="bg-white/5 border border-purple-500/20 rounded-lg p-3 cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-20 h-20 bg-black/30 rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={item.resultImage} 
                          alt="History item" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error("Failed to load history image");
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23a78bfa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                            showStatus("Failed to load history image - try refreshing or clearing history", 'error');
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{item.name}</p>
                        <p className="text-gray-400 text-xs mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                        <p className="text-purple-300 text-xs mt-1">{item.resizeFactor}x upscale</p>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-300 hover:bg-red-900/20 h-8 w-8"
                          onClick={(e) => deleteFromHistory(item.id, e)}
                          title="Delete from history"
                        >
                          <Trash2 size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-blue-300 hover:bg-blue-900/20 h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = item.resultImage;
                            link.download = `enhanced_${item.resizeFactor}x_${item.name || 'image'}.png`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            showStatus('Image downloaded successfully', 'success');
                          }}
                          title="Download image"
                        >
                          <Download size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => setShowHistory(false)}
              className="w-full border-purple-500/30 text-purple-300 hover:bg-purple-600/10 hover:text-purple-200"
            >
              Back to Enhancer
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Tabs defaultValue="url" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 bg-white/10 border-white/20 mb-4">
                <TabsTrigger 
                  value="url" 
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300"
                >
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Image URL
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-url" className="text-white">Image URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="image-url"
                      placeholder="https://example.com/image.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/15 focus:border-purple-400"
                    />
                    <Button 
                      onClick={fetchImageFromUrl}
                      disabled={!imageUrl}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      title="Preview image before enhancing (optional)"
                    >
                      Preview
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400">Enter any URL to an image (max 5MB) - You can enhance directly without preview</p>
                </div>
              </TabsContent>
              
              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-upload" className="text-white">Upload Image</Label>
                  <div 
                    onClick={handleUploadClick}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragging 
                        ? 'border-purple-500 bg-purple-500/10' 
                        : 'border-white/20 hover:border-purple-400'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="image-upload"
                      accept="image/jpeg,image/png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {uploadedImagePreview ? (
                      <div className="space-y-4">
                        <div className="relative mx-auto max-w-xs rounded-lg overflow-hidden">
                          <img 
                            src={uploadedImagePreview} 
                            alt="Uploaded preview" 
                            className="w-full h-auto"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="absolute top-2 right-2 bg-black/50 border-none text-white hover:bg-black/70"
                            onClick={(e) => {
                              e.stopPropagation();
                              setUploadedImage(null);
                              setUploadedImagePreview(null);
                            }}
                          >
                            <X size={16} />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-300">
                          {uploadedImage?.name} ({Math.round(uploadedImage?.size / 1024)} KB)
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUploadClick();
                          }}
                          className="border-purple-500/30 text-purple-300 hover:bg-purple-600/10 hover:text-purple-200"
                        >
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                          <Upload className="text-gray-400" size={24} />
                        </div>
                        <div>
                          <p className="text-gray-300">Drag and drop or click to upload</p>
                          <p className="text-xs text-gray-400 mt-2">JPG, PNG (Max 5MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="space-y-2">
              <Label htmlFor="resize-factor" className="text-white">Resize Factor</Label>
              <Select value={resizeFactor} onValueChange={setResizeFactor}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:bg-white/15 focus:border-purple-400">
                  <SelectValue placeholder="Select resize factor" />
                </SelectTrigger>
                <SelectContent className="bg-[#1d1040] border-[#2a1b4a] text-white">
                  {resizeOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-400">Select how much to upscale the image (2x, 4x, 6x, 8x, or 16x)</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="anime-toggle" className="text-white">Anime Style</Label>
                <Switch
                  id="anime-toggle"
                  checked={isAnime}
                  onCheckedChange={setIsAnime}
                  className="data-[state=checked]:bg-purple-600"
                />
              </div>
              <p className="text-xs text-gray-400">Enable for better results with anime/cartoon images</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white">Token Usage</Label>
                <span className="text-xs text-gray-400">{tokenCount}/{tokenLimit}</span>
              </div>
              <Progress 
                value={(tokenCount / tokenLimit) * 100} 
                className="h-2 bg-white/10 progress-purple"
              />
            </div>
            
            <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-3">
              <p className="text-xs text-purple-300">
                <strong>Note:</strong> To prevent API flooding, there is a 5-second cooldown between requests.
              </p>
            </div>
          </div>
        )}
        
        {statusMessage && (
          <div className={`p-3 rounded-lg ${
            statusMessage.type === 'error' ? 'bg-red-900/20 text-red-300 border border-red-500/20' :
            statusMessage.type === 'success' ? 'bg-green-900/20 text-green-300 border border-green-500/20' :
            'bg-blue-900/20 text-blue-300 border border-blue-500/20'
          }`}>
            <p className="text-sm">{statusMessage.message}</p>
          </div>
        )}
        
        {(originalImage || resultImage) && (
          <div className="mt-6 space-y-6">
            <h3 className="text-white font-medium">Result:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {originalImage && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">Original</p>
                  <div className="relative rounded-lg overflow-hidden border border-purple-500/30">
                    <img 
                      src={originalImage} 
                      alt="Original image" 
                      className="w-full h-auto"
                      onError={(e) => {
                        console.error("Original image failed to load");
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                        e.currentTarget.alt = "Error loading image";
                        e.currentTarget.className = "w-full h-64 object-contain opacity-50 text-red-500";
                        showStatus("Failed to load original image", 'error');
                      }}
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>
              )}
              
              {resultImage && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-300">Enhanced ({resizeFactor}x)</p>
                  <div className="relative rounded-lg overflow-hidden border border-purple-500/30">
                    <img 
                      src={resultImage} 
                      alt="Enhanced image" 
                      className="w-full h-auto"
                      onError={(e) => {
                        console.error("Enhanced image failed to load");
                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                        e.currentTarget.alt = "Error loading image";
                        e.currentTarget.className = "w-full h-64 object-contain opacity-50 text-red-500";
                        showStatus("Failed to load enhanced image", 'error');
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button 
          onClick={handleSuperscale} 
          disabled={isLoading || (!imageUrl && !uploadedImage)}
          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {activeTab === "url" && imageUrl ? "Enhance URL Image" : "Enhance Uploaded Image"}
            </>
          )}
        </Button>
        
        {resultImage && (
          <Button 
            onClick={handleDownload}
            variant="outline"
            className="w-full sm:w-auto border-purple-500/30 text-purple-300 hover:bg-purple-600/10 hover:text-purple-200"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        )}
        
        <Button 
          onClick={resetForm}
          variant="ghost"
          className="w-full sm:w-auto text-gray-400 hover:text-white hover:bg-white/10"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </CardFooter>
      
      {/* Add the share dialog */}
      {renderHistoryDialog()}
    </Card>
  );
};

export default ImageSuperscale;