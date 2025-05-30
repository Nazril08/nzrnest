"use client";

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
    
    // Jika URL blob, konversi ke base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return '';
  }
}; 