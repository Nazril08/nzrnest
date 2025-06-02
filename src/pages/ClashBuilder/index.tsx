import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import BuilderStatus from './BuilderStatus';
import BuildingForm from './BuildingForm';
import BuildingQueue from './BuildingQueue';
import Schedule from './Schedule';
import Timeline from './Timeline';
import TownHallBuildings from './TownHallBuildings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  setStorageItem, 
  getStorageItem, 
  exportDataAsCompressedToken, 
  importDataFromCompressedToken 
} from '@/lib/storage';
import { toast } from 'sonner';
import { Clipboard, Share2 } from 'lucide-react';

// Constants
const NUM_BUILDERS = 5; // Default number of builders
const STORAGE_KEY = 'cocUpgradePlanner';
const BUILDER_COUNT_KEY = 'cocBuilderCount';

// Types
export interface Builder {
  id: number;
  name: string;
  status: 'idle' | 'busy';
  availableAt: Date;
  currentTask: string | null;
  inputValues: {
    days: number;
    hours: number;
    minutes: number;
  } | null;
}

export interface Building {
  id: number;
  name: string;
  baseName?: string;
  category: 'defense' | 'resource' | 'army' | 'wall' | 'other';
  duration: number;
  durationText: string;
  priority: 'low' | 'medium' | 'high';
  optimality?: 'Optimal' | 'Suboptimal';
}

export interface ScheduleItem {
  buildingId: number;
  buildingName: string;
  buildingCategory: string;
  builderId: number;
  builderName: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  durationText: string;
  isGoodTime: boolean;
}

interface AppData {
  builders: Builder[];
  buildings: Building[];
  schedule: ScheduleItem[];
  builderCount: number;
  selectedScheduleTasks: Record<string, number>;
  firstCheckedTaskIndices: Record<string, number>;
}

export default function ClashBuilder() {
  // State
  const [builders, setBuilders] = useState<Builder[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [userBuilderCount, setUserBuilderCount] = useState(NUM_BUILDERS);
  const [selectedScheduleTasks, setSelectedScheduleTasks] = useState<Record<string, number>>({});
  const [firstCheckedTaskIndices, setFirstCheckedTaskIndices] = useState<Record<string, number>>({});
  const [sleepTime, setSleepTime] = useState("22:00");
  const [sleepDuration, setSleepDuration] = useState(8);
  const [shareToken, setShareToken] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);

  // Initialize builders array
  const initBuilders = (count: number): Builder[] => {
    const newBuilders: Builder[] = [];
    for (let i = 0; i < count; i++) {
      newBuilders.push({
        id: i + 1,
        name: `Builder ${i + 1}`,
        status: 'idle',
        availableAt: new Date(),
        currentTask: null,
        inputValues: null
      });
    }
    return newBuilders;
  };

  // Update builder count
  const updateBuilderCount = (newCount: number) => {
    setUserBuilderCount(newCount);
    
    // Save to storage
    setStorageItem(BUILDER_COUNT_KEY, newCount);
    
    // Keep existing builders' data if possible
    const existingBuilders = [...builders];
    
    // Initialize new builder array
    const newBuilders = initBuilders(newCount);
    
    // Copy existing builder data
    for (let i = 0; i < Math.min(existingBuilders.length, newCount); i++) {
      newBuilders[i] = existingBuilders[i];
    }
    
    // Update builders
    setBuilders(newBuilders);
    saveToStorage(newBuilders, buildings, schedule, newCount, selectedScheduleTasks, firstCheckedTaskIndices);
  };

  // Format duration text
  const formatDuration = (days: number, hours: number, minutes: number): string => {
    let parts: string[] = [];
    if (days > 0) parts.push(`${days}h`);
    if (hours > 0) parts.push(`${hours}j`);
    if (minutes > 0) parts.push(`${minutes}m`);
    return parts.length > 0 ? parts.join(' ') : '0m';
  };

  // Check if upgrade time is good based on sleep schedule
  const checkUpgradeTime = (duration: number, startHour: number, sleepHour: number): boolean => {
    const durationHours = duration / (60 * 60 * 1000);
    
    // For long upgrades (>8h), starting before sleep is good
    if (durationHours > 8) {
      // If it starts 0-3 hours before sleep time, it's good
      const hoursBeforeSleep = (sleepHour - startHour + 24) % 24;
      return hoursBeforeSleep <= 3 && hoursBeforeSleep >= 0;
    }
    
    // For short upgrades, starting after waking up is good
    return Math.abs(startHour - sleepHour) > 8;
  };

  // Save data to storage
  const saveToStorage = (
    builders: Builder[],
    buildings: Building[],
    schedule: ScheduleItem[],
    builderCount: number,
    selectedTasks: Record<string, number>,
    checkedIndices: Record<string, number>
  ) => {
    setStorageItem(STORAGE_KEY, {
      builders,
      buildings,
      schedule,
      builderCount,
      selectedScheduleTasks: selectedTasks,
      firstCheckedTaskIndices: checkedIndices
    });
  };

  // Load data from storage
  const loadFromStorage = () => {
    const data = getStorageItem(STORAGE_KEY);
    if (data) {
      try {
        const parsed = data as AppData;
        
        // Get builder count if available
        if (parsed.builderCount) {
          setUserBuilderCount(parsed.builderCount);
        }
        
        // Initialize builders with the correct count
        const newBuilders = initBuilders(parsed.builderCount || userBuilderCount);
        
        // Convert date strings back to Date objects
        if (parsed.builders) {
          // Only copy data for the number of builders we have
          for (let i = 0; i < Math.min(parsed.builders.length, newBuilders.length); i++) {
            if (parsed.builders[i]) {
              newBuilders[i] = {
                ...parsed.builders[i],
                availableAt: new Date(parsed.builders[i].availableAt)
              };
            }
          }
        }
        
        if (parsed.buildings) {
          setBuildings(parsed.buildings);
        }
        
        if (parsed.schedule) {
          setSchedule(parsed.schedule.map(item => ({
            ...item,
            startTime: new Date(item.startTime),
            endTime: new Date(item.endTime)
          })));
        }
        
        // Load selected schedule tasks if available
        if (parsed.selectedScheduleTasks) {
          setSelectedScheduleTasks(parsed.selectedScheduleTasks);
        }
        
        // Load first checked task indices if available
        if (parsed.firstCheckedTaskIndices) {
          setFirstCheckedTaskIndices(parsed.firstCheckedTaskIndices);
        }
        
        setBuilders(newBuilders);
      } catch (error) {
        console.error('Error loading data from storage:', error);
      }
    }
  };

  // Generate upgrade schedule
  const generateSchedule = () => {
    if (buildings.length === 0) {
      toast.error('Silakan tambahkan bangunan ke antrean terlebih dahulu');
      return;
    }
    
    // Check if we have any builders
    if (userBuilderCount === 0) {
      toast.error('Anda harus memiliki minimal 1 builder untuk membuat jadwal');
      return;
    }
    
    // Sort buildings by priority and duration
    const sortedBuildings = [...buildings].sort((a, b) => {
      // First sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      // Then by duration (longer first)
      return b.duration - a.duration;
    });
    
    // Get sleep time
    const [sleepHours, sleepMinutes] = sleepTime.split(':').map(Number);
    
    // Create a copy of builders for scheduling
    const scheduleBuilders = JSON.parse(JSON.stringify(builders)) as Builder[];
    
    // Clear previous schedule
    const newSchedule: ScheduleItem[] = [];
    // Reset selected tasks since the building IDs will change
    const newSelectedTasks: Record<string, number> = {};
    
    // Assign buildings to builders
    sortedBuildings.forEach(building => {
      // Extract base name for display
      const baseName = building.name.replace(/\s*\(\d+\/\d+\)$/, '');
      
      // Find the earliest available builder
      scheduleBuilders.sort((a, b) => new Date(a.availableAt).getTime() - new Date(b.availableAt).getTime());
      const builder = scheduleBuilders[0];
      
      // Calculate start and end times
      const startTime = new Date(builder.availableAt);
      const endTime = new Date(startTime.getTime() + building.duration);
      
      // Check if this is a good time based on sleep schedule
      const startHour = startTime.getHours();
      const isGoodTime = checkUpgradeTime(building.duration, startHour, sleepHours);
      
      // Update builder availability
      builder.availableAt = endTime;
      builder.currentTask = baseName;
      builder.status = 'busy';
      
      // Add to schedule
      newSchedule.push({
        buildingId: building.id,
        buildingName: baseName,
        buildingCategory: building.category,
        builderId: builder.id,
        builderName: builder.name,
        startTime: startTime,
        endTime: endTime,
        duration: building.duration,
        durationText: building.durationText,
        isGoodTime: isGoodTime
      });
    });
    
    // Update schedule state
    setSchedule(newSchedule);
    setSelectedScheduleTasks(newSelectedTasks);
    
    // Save to storage
    saveToStorage(builders, buildings, newSchedule, userBuilderCount, newSelectedTasks, firstCheckedTaskIndices);
    
    toast.success('Jadwal upgrade berhasil dibuat');
  };

  // Clear schedule
  const clearSchedule = () => {
    setSchedule([]);
    setSelectedScheduleTasks({});
    setFirstCheckedTaskIndices({});
    saveToStorage(builders, buildings, [], userBuilderCount, {}, {});
    toast.success('Jadwal berhasil dihapus');
  };

  // Generate share token
  const generateShareToken = () => {
    try {
      const token = exportDataAsCompressedToken([STORAGE_KEY]);
      setShareToken(token);
      setShowShareModal(true);
      return token;
    } catch (error) {
      console.error('Error generating share token:', error);
      toast.error('Gagal membuat token berbagi');
      return '';
    }
  };

  // Import from token
  const importFromToken = (token: string) => {
    try {
      if (importDataFromCompressedToken(token)) {
        loadFromStorage();
        toast.success('Data berhasil diimpor');
        setShowShareModal(false);
        return true;
      } else {
        toast.error('Gagal mengimpor data');
        return false;
      }
    } catch (error) {
      console.error('Error importing from token:', error);
      toast.error('Token tidak valid');
      return false;
    }
  };

  // Copy token to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Token disalin ke clipboard');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Gagal menyalin ke clipboard');
    }
  };

  // Fungsi untuk menentukan optimalitas jadwal
  const determineOptimality = (building: Building, currentTime: number, sleepStartTime: number, sleepEndTime: number): 'Optimal' | 'Suboptimal' => {
    const endTime = currentTime + building.duration;
    const nextStartTime = endTime;
    
    // Konversi waktu ke format 24 jam untuk memudahkan perbandingan
    const endTimeHour = new Date(endTime).getHours();
    const sleepStartHour = new Date(sleepStartTime).getHours();
    
    // Jika upgrade selesai saat tidur dan tidak ada upgrade berikutnya yang dijadwalkan
    if (
      (endTime >= sleepStartTime && endTime <= sleepEndTime) || 
      // Atau jika upgrade panjang (> 6 jam) selesai di awal waktu tidur
      (building.duration > 6 * 60 * 60 * 1000 && 
       Math.abs(endTimeHour - sleepStartHour) < 2)
    ) {
      return 'Suboptimal';
    }
    
    // Jika upgrade pendek dan ada waktu cukup sebelum tidur untuk upgrade lain
    if (
      building.duration <= 6 * 60 * 60 * 1000 && 
      nextStartTime < sleepStartTime && 
      (sleepStartTime - nextStartTime) < 2 * 60 * 60 * 1000 // Kurang dari 2 jam sebelum tidur
    ) {
      return 'Suboptimal';
    }
    
    // Jika upgrade berurutan dengan jeda minimal
    return 'Optimal';
  };

  // Fungsi untuk mengoptimalkan urutan upgrade
  const optimizeBuilderQueue = (buildings: Building[], startTime: number, sleepStartTime: number, sleepEndTime: number): Building[] => {
    if (buildings.length === 0) return [];
    
    // Kelompokkan bangunan berdasarkan prioritas
    const highPriorityBuildings = buildings.filter(b => b.priority === 'high');
    const mediumPriorityBuildings = buildings.filter(b => b.priority === 'medium');
    const lowPriorityBuildings = buildings.filter(b => b.priority === 'low');
    
    // Untuk setiap kelompok prioritas, pisahkan antara upgrade pendek dan panjang
    const processBuildings = (priorityBuildings: Building[]): Building[] => {
      // Bagi bangunan menjadi upgrade pendek dan panjang
      const shortUpgrades = priorityBuildings.filter(b => b.duration <= 6 * 60 * 60 * 1000); // <= 6 jam
      const longUpgrades = priorityBuildings.filter(b => b.duration > 6 * 60 * 60 * 1000);  // > 6 jam
      
      // Urutkan upgrade pendek berdasarkan durasi (pendek ke panjang)
      shortUpgrades.sort((a, b) => a.duration - b.duration);
      
      // Urutkan upgrade panjang berdasarkan durasi (panjang ke pendek)
      longUpgrades.sort((a, b) => b.duration - a.duration);
      
      return [...shortUpgrades, ...longUpgrades];
    };
    
    // Proses setiap kelompok prioritas
    const sortedHighPriority = processBuildings(highPriorityBuildings);
    const sortedMediumPriority = processBuildings(mediumPriorityBuildings);
    const sortedLowPriority = processBuildings(lowPriorityBuildings);
    
    // Gabungkan semua bangunan berdasarkan prioritas
    const sortedBuildings = [...sortedHighPriority, ...sortedMediumPriority, ...sortedLowPriority];
    
    const optimizedQueue: Building[] = [];
    let currentTime = startTime;
    
    // Tambahkan upgrade pendek selama masih cukup waktu sebelum tidur
    const shortUpgrades = sortedBuildings.filter(b => b.duration <= 6 * 60 * 60 * 1000);
    const longUpgrades = sortedBuildings.filter(b => b.duration > 6 * 60 * 60 * 1000);
    
    // Proses upgrade pendek terlebih dahulu
    for (const upgrade of shortUpgrades) {
      const endTime = currentTime + upgrade.duration;
      
      // Jika upgrade pendek selesai sebelum tidur atau
      // jika upgrade pendek selesai setelah bangun tidur
      if (endTime < sleepStartTime || endTime > sleepEndTime) {
        optimizedQueue.push({...upgrade, optimality: 'Optimal'});
        currentTime = endTime;
      } else {
        // Simpan untuk diproses nanti
        longUpgrades.push(upgrade);
      }
      
      // Jika waktu yang tersisa sebelum tidur tidak cukup untuk upgrade pendek lainnya
      // hentikan loop dan mulai proses upgrade panjang
      if (sleepStartTime - currentTime < 2 * 60 * 60 * 1000) {
        break;
      }
    }
    
    // Cari upgrade panjang yang optimal untuk waktu tidur
    // Prioritaskan upgrade yang selesai setelah bangun tidur
    longUpgrades.sort((a, b) => {
      // Prioritaskan berdasarkan tingkat prioritas terlebih dahulu
      if (a.priority !== b.priority) {
        const priorityValues = { high: 3, medium: 2, low: 1 };
        return priorityValues[b.priority] - priorityValues[a.priority];
      }
      
      const aEndTime = currentTime + a.duration;
      const bEndTime = currentTime + b.duration;
      
      // Prioritaskan upgrade yang selesai setelah bangun tidur
      if (aEndTime > sleepEndTime && bEndTime <= sleepEndTime) return -1;
      if (aEndTime <= sleepEndTime && bEndTime > sleepEndTime) return 1;
      
      // Jika keduanya selesai setelah bangun tidur, pilih yang lebih pendek
      if (aEndTime > sleepEndTime && bEndTime > sleepEndTime) {
        return a.duration - b.duration;
      }
      
      // Jika keduanya selesai sebelum bangun tidur, pilih yang selesai mendekati waktu bangun
      return bEndTime - aEndTime;
    });
    
    // Tambahkan upgrade panjang ke queue
    for (const upgrade of longUpgrades) {
      const endTime = currentTime + upgrade.duration;
      const optimality = determineOptimality(upgrade, currentTime, sleepStartTime, sleepEndTime);
      optimizedQueue.push({...upgrade, optimality});
      currentTime = endTime;
    }
    
    return optimizedQueue;
  };

  // Effect to initialize app
  useEffect(() => {
    // Get builder count from storage or use default
    const storedBuilderCount = getStorageItem(BUILDER_COUNT_KEY) || NUM_BUILDERS;
    setUserBuilderCount(storedBuilderCount);
    
    // Initialize builders
    setBuilders(initBuilders(storedBuilderCount));
    
    // Load data from storage
    loadFromStorage();
  }, []);

  return (
    <div className="min-h-screen bg-purple-gradient py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">COC Builder Planner</h1>
          <p className="text-purple-200">Optimize your upgrade schedule for maximum efficiency</p>
          
          <div className="flex justify-center mt-4 space-x-4">
            <Button 
              onClick={generateShareToken} 
              variant="outline" 
              className="bg-purple-900/30 border-purple-700/30 text-purple-200/90 hover:bg-purple-800/40 hover:text-purple-100"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Bagikan Konfigurasi
            </Button>
            
            <Button 
              onClick={() => {
                const token = prompt('Masukkan token konfigurasi:');
                if (token) importFromToken(token);
              }} 
              variant="outline" 
              className="bg-purple-900/30 border-purple-700/30 text-purple-200/90 hover:bg-purple-800/40 hover:text-purple-100"
            >
              <Clipboard className="w-4 h-4 mr-2" />
              Import Konfigurasi
            </Button>
          </div>
        </header>

        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#150b30] border border-[#2a1b4a] rounded-lg p-6 max-w-lg w-full">
              <h3 className="text-xl font-semibold text-white mb-4">Bagikan Konfigurasi</h3>
              <p className="text-gray-300 mb-4">Salin token di bawah ini untuk membagikan konfigurasi builder Anda:</p>
              
              <div className="bg-[#1d1040] border border-[#2a1b4a] rounded p-3 mb-4 overflow-auto max-h-32">
                <code className="text-xs text-gray-300 break-all">{shareToken}</code>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button 
                  onClick={() => copyToClipboard(shareToken)} 
                  variant="outline" 
                  className="bg-purple-900/30 border-purple-700/30 text-purple-200/90 hover:bg-purple-800/40 hover:text-purple-100"
                >
                  <Clipboard className="w-4 h-4 mr-2" />
                  Salin Token
                </Button>
                <Button 
                  onClick={() => setShowShareModal(false)} 
                  variant="outline" 
                  className="bg-rose-900/30 border-rose-700/30 text-rose-200/90 hover:bg-rose-800/40 hover:text-rose-100"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Sidebar */}
          <div className="md:col-span-4">
            <Card className="mb-6 bg-[#150b30]/70 border-[#2a1b4a] backdrop-blur-sm overflow-hidden">
              <CardContent className="p-5">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  Builder Status
                </h2>
                
                <BuilderStatus 
                  builders={builders} 
                  setBuilders={setBuilders}
                  userBuilderCount={userBuilderCount}
                  updateBuilderCount={updateBuilderCount}
                  saveToLocalStorage={(b) => saveToStorage(b, buildings, schedule, userBuilderCount, selectedScheduleTasks, firstCheckedTaskIndices)}
                />
              </CardContent>
            </Card>

            <Card className="mb-6 bg-[#150b30]/70 border-[#2a1b4a] backdrop-blur-sm overflow-hidden">
              <CardContent className="p-5">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                  </svg>
                  Sleep Settings
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sleepTime" className="block text-gray-300 text-sm font-medium mb-1">
                      Waktu Tidur
                    </Label>
                    <Input
                      id="sleepTime"
                      type="time"
                      value={sleepTime}
                      onChange={(e) => setSleepTime(e.target.value)}
                      className="w-full bg-[#1d1040]/50 border-[#2a1b4a] text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="sleepDuration" className="block text-gray-300 text-sm font-medium mb-1">
                      Durasi Tidur (jam)
                    </Label>
                    <Input
                      id="sleepDuration"
                      type="number"
                      min={1}
                      max={12}
                      value={sleepDuration}
                      onChange={(e) => setSleepDuration(parseInt(e.target.value) || 8)}
                      className="w-full bg-[#1d1040]/50 border-[#2a1b4a] text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Content Area */}
          <div className="md:col-span-8">
            <Card className="mb-6 bg-[#150b30]/70 border-[#2a1b4a] backdrop-blur-sm overflow-hidden">
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    Building Queue
                  </h2>
                </div>
                
                <BuildingQueue 
                  buildings={buildings}
                  setBuildings={setBuildings}
                  saveToLocalStorage={(b) => saveToStorage(builders, b, schedule, userBuilderCount, selectedScheduleTasks, firstCheckedTaskIndices)}
                />
              </CardContent>
            </Card>

            <Card className="mb-6 bg-[#150b30]/70 border-[#2a1b4a] backdrop-blur-sm overflow-hidden">
              <CardContent className="p-5">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Add Building
                </h2>
                
                <BuildingForm 
                  buildings={buildings}
                  setBuildings={setBuildings}
                  formatDuration={formatDuration}
                  saveToLocalStorage={(b) => saveToStorage(builders, b, schedule, userBuilderCount, selectedScheduleTasks, firstCheckedTaskIndices)}
                />
              </CardContent>
            </Card>

            <Card className="mb-6 bg-[#150b30]/70 border-[#2a1b4a] backdrop-blur-sm overflow-hidden">
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Upgrade Schedule
                  </h2>
                  <div className="flex space-x-2">
                    <button 
                      onClick={generateSchedule}
                      className="px-3 py-1 bg-purple-900/50 text-purple-200/90 rounded-lg hover:bg-purple-800/60 transition-colors text-sm flex items-center border border-purple-700/30"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                      </svg>
                      Generate Schedule
                    </button>
                    <button 
                      onClick={clearSchedule}
                      className="px-3 py-1 bg-rose-900/50 text-rose-200/90 rounded-lg hover:bg-rose-800/60 transition-colors text-sm flex items-center border border-rose-700/30"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                      Clear Schedule
                    </button>
                  </div>
                </div>
                
                <Schedule 
                  schedule={schedule}
                  builders={builders}
                  selectedScheduleTasks={selectedScheduleTasks}
                  setSelectedScheduleTasks={setSelectedScheduleTasks}
                  firstCheckedTaskIndices={firstCheckedTaskIndices}
                  setFirstCheckedTaskIndices={setFirstCheckedTaskIndices}
                  saveToLocalStorage={() => saveToStorage(builders, buildings, schedule, userBuilderCount, selectedScheduleTasks, firstCheckedTaskIndices)}
                />
              </CardContent>
            </Card>

            <Card className="bg-[#150b30]/70 border-[#2a1b4a] backdrop-blur-sm overflow-hidden">
              <CardContent className="p-5">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                  </svg>
                  Timeline View
                </h2>
                
                <Timeline 
                  schedule={schedule}
                  builders={builders}
                  selectedScheduleTasks={selectedScheduleTasks}
                  firstCheckedTaskIndices={firstCheckedTaskIndices}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Town Hall Buildings Section */}
        <TownHallBuildings 
          buildings={buildings}
          setBuildings={setBuildings}
          saveToLocalStorage={(b) => saveToStorage(builders, b, schedule, userBuilderCount, selectedScheduleTasks, firstCheckedTaskIndices)}
        />
      </div>
    </div>
  );
} 