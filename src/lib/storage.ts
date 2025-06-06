"use client";

// Import library pako untuk kompresi (perlu diinstal: npm install pako)
import pako from 'pako';

// Fungsi untuk menyimpan data ke localStorage
export const setStorageItem = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Fungsi untuk mengambil data dari localStorage
export const getStorageItem = (key: string) => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
  }
  return null;
};

// Fungsi untuk menghapus data dari localStorage
export const removeStorageItem = (key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
};

// Fungsi untuk memeriksa apakah data ada di localStorage
export const hasStorageItem = (key: string) => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key) !== null;
  }
  return false;
};

// Fungsi untuk menyimpan data user
export const setUserData = (userData: any, cookieOptions = {}) => {
  // Simpan di localStorage
  setStorageItem('user_data', userData);
  
  // Dalam implementasi nyata, di sini akan ada kode untuk menyimpan ke cookies
  // menggunakan library seperti js-cookie atau cookies-next
  console.log('User data saved with options:', cookieOptions);
};

// Fungsi untuk mengambil data user
export const getUserData = () => {
  return getStorageItem('user_data');
};

// Fungsi untuk menyimpan data tabel
export const saveTableData = (tableId: string, data: any[]) => {
  setStorageItem(`table_${tableId}`, data);
};

// Fungsi untuk mengambil data tabel
export const getTableData = (tableId: string) => {
  return getStorageItem(`table_${tableId}`) || [];
};

// Fungsi untuk menyimpan pengaturan aplikasi
export const saveAppSettings = (settings: any) => {
  setStorageItem('app_settings', settings);
};

// Fungsi untuk mengambil pengaturan aplikasi
export const getAppSettings = () => {
  return getStorageItem('app_settings') || {
    theme: 'light',
    language: 'en',
    notifications: true
  };
};

// Fungsi untuk menyimpan data grafik
export const saveChartData = (chartId: string, data: any) => {
  setStorageItem(`chart_${chartId}`, data);
};

// Fungsi untuk mengambil data grafik
export const getChartData = (chartId: string) => {
  return getStorageItem(`chart_${chartId}`);
};

// Fungsi khusus untuk menyimpan history gambar yang dienhance
export const saveImageHistory = (history: any[]) => {
  setStorageItem('image_enhancer_history', history);
};

// Fungsi untuk mengambil history gambar
export const getImageHistory = () => {
  return getStorageItem('image_enhancer_history') || [];
};

// Fungsi untuk menyimpan gambar sebagai base64
export const saveImageAsBase64 = async (imageUrl: string): Promise<string> => {
  if (typeof window === 'undefined') return '';
  
  try {
    // Jika sudah dalam format base64, kembalikan langsung
    if (imageUrl.startsWith('data:image')) {
      return imageUrl;
    }
    
    // Jika URL blob atau URL normal, konversi ke base64
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = (error) => {
        console.error('Error in FileReader:', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    // Jika gagal, coba pendekatan alternatif dengan Image API
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } catch (canvasError) {
          console.error('Canvas error:', canvasError);
          reject(canvasError);
        }
      };
      img.onerror = (imgError) => {
        console.error('Image load error:', imgError);
        reject(new Error('Failed to load image'));
      };
      img.src = imageUrl;
    });
  }
};

// Fungsi untuk mengekspor data localStorage sebagai token yang bisa di-copy paste
export const exportDataAsToken = (keys: string[] = []): string => {
  if (typeof window === 'undefined') return '';
  
  const exportData: Record<string, any> = {};
  
  // Jika tidak ada keys yang ditentukan, ekspor semua data
  if (keys.length === 0) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        exportData[key] = getStorageItem(key);
      }
    }
  } else {
    // Ekspor hanya keys yang ditentukan
    keys.forEach(key => {
      if (hasStorageItem(key)) {
        exportData[key] = getStorageItem(key);
      }
    });
  }
  
  // Encode data sebagai base64 untuk membuatnya lebih mudah ditransfer
  return btoa(JSON.stringify(exportData));
};

// Fungsi untuk mengekspor data dengan kompresi
export const exportDataAsCompressedToken = (keys: string[] = []): string => {
  if (typeof window === 'undefined') return '';
  
  const exportData: Record<string, any> = {};
  
  // Jika tidak ada keys yang ditentukan, ekspor semua data
  if (keys.length === 0) {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        exportData[key] = getStorageItem(key);
      }
    }
  } else {
    // Ekspor hanya keys yang ditentukan
    keys.forEach(key => {
      if (hasStorageItem(key)) {
        exportData[key] = getStorageItem(key);
      }
    });
  }
  
  // Konversi data ke string JSON
  const jsonString = JSON.stringify(exportData);
  
  // Konversi string ke Uint8Array
  const textEncoder = new TextEncoder();
  const uint8Array = textEncoder.encode(jsonString);
  
  // Kompres data
  const compressedData = pako.deflate(uint8Array);
  
  // Konversi ke base64
  return btoa(String.fromCharCode.apply(null, compressedData as unknown as number[]));
};

// Fungsi untuk mengimpor data dari token
export const importDataFromToken = (token: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Decode token dari base64
    const decodedData = JSON.parse(atob(token));
    
    // Simpan setiap item ke localStorage
    Object.entries(decodedData).forEach(([key, value]) => {
      setStorageItem(key, value);
    });
    
    return true;
  } catch (error) {
    console.error('Error importing data from token:', error);
    return false;
  }
};

// Fungsi untuk mengekspor data spesifik user
export const exportUserDataAsToken = (): string => {
  return exportDataAsToken(['user_data']);
};

// Fungsi untuk mengimpor data user dari token
export const importUserDataFromToken = (token: string): boolean => {
  return importDataFromToken(token);
};

// Fungsi untuk mengekspor history gambar sebagai token
export const exportImageHistoryAsToken = (): string => {
  return exportDataAsToken(['image_enhancer_history']);
};

// Fungsi untuk mengimpor history gambar dari token
export const importImageHistoryFromToken = (token: string): boolean => {
  return importDataFromToken(token);
};

// Fungsi untuk mengekspor history gambar sebagai token yang lebih kecil
export const exportCompactImageHistoryAsToken = (limit = 3, includeOriginal = false): string => {
  try {
    const history = getImageHistory() || [];
    
    // Batasi jumlah item history
    const limitedHistory = history.slice(0, limit);
    
    // Buat versi ringkas dari setiap item
    const compactHistory = limitedHistory.map(item => {
      // Buat objek baru dengan properti yang diperlukan saja
      return {
        id: item.id,
        resultImage: item.resultImage,
        // Sertakan gambar asli hanya jika diminta
        originalImage: includeOriginal ? item.originalImage : null,
        resizeFactor: item.resizeFactor,
        timestamp: item.timestamp,
        name: item.name
      };
    });
    
    // Gunakan fungsi kompresi untuk menghasilkan token
    const dataToExport = { image_enhancer_history: compactHistory };
    
    // Konversi data ke string JSON
    const jsonString = JSON.stringify(dataToExport);
    
    // Konversi string ke Uint8Array
    const textEncoder = new TextEncoder();
    const uint8Array = textEncoder.encode(jsonString);
    
    // Kompres data
    const compressedData = pako.deflate(uint8Array);
    
    // Konversi ke base64
    return btoa(String.fromCharCode.apply(null, compressedData as unknown as number[]));
  } catch (error) {
    console.error('Error exporting compact image history:', error);
    return '';
  }
};

// Fungsi untuk menggabungkan history gambar dari token dengan history yang sudah ada
export const mergeImageHistoryFromToken = (token: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Decode token dari base64
    const decodedData = JSON.parse(atob(token));
    
    // Ambil history gambar dari token
    const importedHistory = decodedData['image_enhancer_history'] || [];
    
    // Ambil history gambar yang sudah ada
    const currentHistory = getImageHistory();
    
    // Gabungkan history, hindari duplikat berdasarkan id atau properti unik lainnya
    const mergedHistory = [...currentHistory];
    
    importedHistory.forEach((importedItem: any) => {
      // Asumsikan setiap item memiliki id atau properti unik lainnya
      // Sesuaikan dengan struktur data history gambar Anda
      const isDuplicate = currentHistory.some((existingItem: any) => 
        existingItem.id === importedItem.id || 
        existingItem.originalImageUrl === importedItem.originalImageUrl
      );
      
      if (!isDuplicate) {
        mergedHistory.push(importedItem);
      }
    });
    
    // Simpan history yang sudah digabungkan
    saveImageHistory(mergedHistory);
    
    return true;
  } catch (error) {
    console.error('Error merging image history from token:', error);
    return false;
  }
};

// Fungsi untuk mengimpor data dari token terkompresi
export const importDataFromCompressedToken = (token: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Decode token dari base64
    const binaryString = atob(token);
    
    // Konversi string ke array byte
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Dekompresi data
    const decompressedData = pako.inflate(bytes);
    
    // Konversi kembali ke string
    const textDecoder = new TextDecoder();
    const jsonString = textDecoder.decode(decompressedData);
    
    // Parse JSON
    const decodedData = JSON.parse(jsonString);
    
    // Simpan setiap item ke localStorage
    Object.entries(decodedData).forEach(([key, value]) => {
      setStorageItem(key, value);
    });
    
    return true;
  } catch (error) {
    console.error('Error importing data from compressed token:', error);
    return false;
  }
};

// Fungsi untuk mengekspor history gambar tertentu berdasarkan ID yang dipilih
export const exportSelectedImageHistoryAsToken = (selectedIds: string[], includeOriginal = false): string => {
  try {
    const history = getImageHistory() || [];
    
    // Filter history berdasarkan ID yang dipilih
    const selectedHistory = history.filter(item => selectedIds.includes(item.id));
    
    if (selectedHistory.length === 0) {
      throw new Error('No selected images found');
    }
    
    // Buat versi ringkas dari setiap item
    const compactHistory = selectedHistory.map(item => {
      // Buat objek baru dengan properti yang diperlukan saja
      return {
        id: item.id,
        resultImage: item.resultImage,
        // Sertakan gambar asli hanya jika diminta
        originalImage: includeOriginal ? item.originalImage : null,
        resizeFactor: item.resizeFactor,
        timestamp: item.timestamp,
        name: item.name
      };
    });
    
    // Gunakan fungsi kompresi untuk menghasilkan token
    const dataToExport = { image_enhancer_history: compactHistory };
    
    // Konversi data ke string JSON
    const jsonString = JSON.stringify(dataToExport);
    
    // Konversi string ke Uint8Array
    const textEncoder = new TextEncoder();
    const uint8Array = textEncoder.encode(jsonString);
    
    // Kompres data
    const compressedData = pako.deflate(uint8Array);
    
    // Konversi ke base64
    return btoa(String.fromCharCode.apply(null, compressedData as unknown as number[]));
  } catch (error) {
    console.error('Error exporting selected image history:', error);
    return '';
  }
}; 