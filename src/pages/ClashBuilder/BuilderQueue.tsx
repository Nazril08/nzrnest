import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Clock, AlertCircle, Check, Settings2, Edit, Save, PenSquare } from "lucide-react";
import { toast } from "sonner";
import { Building } from './index';
import { Input } from "@/components/ui/input";

// Komponen TimePicker sederhana sebagai pengganti
const TimePicker = ({ date, setDate, className = "" }: { date: Date, setDate: (date: Date) => void, className?: string }) => {
  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(date);
    newDate.setHours(parseInt(e.target.value));
    setDate(newDate);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(date);
    newDate.setMinutes(parseInt(e.target.value));
    setDate(newDate);
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      <select 
        value={date.getHours()} 
        onChange={handleHourChange}
        className="bg-[#1d1040]/50 border border-[#2a1b4a] rounded px-2 py-1 text-white"
      >
        {Array.from({ length: 24 }, (_, i) => (
          <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
        ))}
      </select>
      <span className="text-white">:</span>
      <select 
        value={date.getMinutes()} 
        onChange={handleMinuteChange}
        className="bg-[#1d1040]/50 border border-[#2a1b4a] rounded px-2 py-1 text-white"
      >
        {Array.from({ length: 12 }, (_, i) => i * 5).map(minute => (
          <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
        ))}
      </select>
    </div>
  );
};

interface BuilderQueueProps {
  buildings: Building[];
  setBuildings: React.Dispatch<React.SetStateAction<Building[]>>;
  saveToLocalStorage: (buildings: Building[]) => void;
}

export default function BuilderQueue({ buildings, setBuildings, saveToLocalStorage }: BuilderQueueProps) {
  const [selectedBuilder, setSelectedBuilder] = useState<number>(1);
  const [sleepStartTime, setSleepStartTime] = useState<Date>(() => {
    // Default to 22:00 (10 PM)
    const date = new Date();
    date.setHours(22, 0, 0, 0);
    return date;
  });
  
  const [sleepEndTime, setSleepEndTime] = useState<Date>(() => {
    // Default to 06:00 (6 AM)
    const date = new Date();
    date.setHours(6, 0, 0, 0);
    return date;
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [optimizeQueue, setOptimizeQueue] = useState<boolean>(true);
  
  // State untuk edit mode
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editLevel, setEditLevel] = useState<string>('');
  
  // State untuk mode edit global
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  
  // Fungsi untuk menentukan optimalitas jadwal
  const determineOptimality = (building: Building, currentTime: number, sleepStartTime: number, sleepEndTime: number): 'Optimal' | 'Suboptimal' => {
    const endTime = currentTime + building.duration;
    
    // Batas waktu sebelum tidur (30 menit = 30 * 60 * 1000 ms)
    const timeBufferBeforeSleep = 30 * 60 * 1000; // 30 menit
    
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
      endTime < sleepStartTime && 
      (sleepStartTime - endTime) < timeBufferBeforeSleep // Kurang dari 30 menit sebelum tidur
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
    const highPriorityBuildings = buildings.filter(b => b.priority === 'high' || b.category === 'resource'); // Resource buildings selalu prioritas tinggi
    const mediumPriorityBuildings = buildings.filter(b => b.priority === 'medium' && b.category !== 'resource');
    const lowPriorityBuildings = buildings.filter(b => b.priority === 'low' && b.category !== 'resource');
    
    // Bagi bangunan menjadi upgrade pendek dan panjang
    const shortHighPriority = highPriorityBuildings.filter(b => b.duration <= 6 * 60 * 60 * 1000).sort((a, b) => a.duration - b.duration);
    const longHighPriority = highPriorityBuildings.filter(b => b.duration > 6 * 60 * 60 * 1000).sort((a, b) => a.duration - b.duration);
    
    const shortMediumPriority = mediumPriorityBuildings.filter(b => b.duration <= 6 * 60 * 60 * 1000).sort((a, b) => a.duration - b.duration);
    const longMediumPriority = mediumPriorityBuildings.filter(b => b.duration > 6 * 60 * 60 * 1000).sort((a, b) => a.duration - b.duration);
    
    const shortLowPriority = lowPriorityBuildings.filter(b => b.duration <= 6 * 60 * 60 * 1000).sort((a, b) => a.duration - b.duration);
    const longLowPriority = lowPriorityBuildings.filter(b => b.duration > 6 * 60 * 60 * 1000).sort((a, b) => a.duration - b.duration);
    
    // Gabungkan semua bangunan berdasarkan prioritas
    // Pendek dengan prioritas tinggi terlebih dahulu
    const shortUpgrades = [...shortHighPriority, ...shortMediumPriority, ...shortLowPriority];
    // Kemudian panjang dengan prioritas tinggi terlebih dahulu
    const longUpgrades = [...longHighPriority, ...longMediumPriority, ...longLowPriority];
    
    const optimizedQueue: Building[] = [];
    let currentTime = startTime;
    
    // Batas waktu sebelum tidur (30 menit = 30 * 60 * 1000 ms)
    const timeBufferBeforeSleep = 30 * 60 * 1000; // 30 menit
    
    // Tambahkan upgrade pendek selama masih cukup waktu sebelum tidur
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
      if (sleepStartTime - currentTime < timeBufferBeforeSleep) {
        break;
      }
    }
    
    // Tambahkan upgrade panjang ke queue
    for (const upgrade of longUpgrades) {
      const endTime = currentTime + upgrade.duration;
      const optimality = determineOptimality(upgrade, currentTime, sleepStartTime, sleepEndTime);
      optimizedQueue.push({...upgrade, optimality});
      currentTime = endTime;
    }
    
    return optimizedQueue;
  };
  
  // Fungsi untuk menghitung waktu selesai
  const calculateEndTime = (buildings: Building[]): { endTimes: Date[], totalDuration: number } => {
    const now = new Date();
    let currentTime = now.getTime();
    const endTimes: Date[] = [];
    let totalDuration = 0;
    
    // Jika optimasi diaktifkan, gunakan urutan yang dioptimalkan
    let processedBuildings = buildings;
    if (optimizeQueue) {
      const sleepStartMs = sleepStartTime.getTime();
      const sleepEndMs = sleepEndTime.getTime() + (sleepEndTime < sleepStartTime ? 24 * 60 * 60 * 1000 : 0);
      processedBuildings = optimizeBuilderQueue([...buildings], currentTime, sleepStartMs, sleepEndMs);
    }
    
    for (const building of processedBuildings) {
      const endTime = new Date(currentTime + building.duration);
      endTimes.push(endTime);
      currentTime += building.duration;
      totalDuration += building.duration;
    }
    
    return { endTimes, totalDuration };
  };
  
  const { endTimes, totalDuration } = calculateEndTime(buildings);
  
  // Format durasi total
  const formatTotalDuration = (ms: number): string => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    
    let parts: string[] = [];
    if (days > 0) parts.push(`${days} hari`);
    if (hours > 0) parts.push(`${hours} jam`);
    if (minutes > 0) parts.push(`${minutes} menit`);
    return parts.length > 0 ? parts.join(' ') : '0 menit';
  };
  
  // Format tanggal dan waktu
  const formatDateTime = (date: Date): string => {
    return `${date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  // Fungsi untuk mendapatkan ikon kategori
  const getCategoryIcon = (category: 'defense' | 'resource' | 'army' | 'wall' | 'other') => {
    switch (category) {
      case 'defense':
        return <span className="mr-1" title="Defense">🛡️</span>;
      case 'resource':
        return <span className="mr-1" title="Resource">💰</span>;
      case 'army':
        return <span className="mr-1" title="Army">⚔️</span>;
      case 'wall':
        return <span className="mr-1" title="Wall">🧱</span>;
      default:
        return <span className="mr-1" title="Other">🏠</span>;
    }
  };
  
  // Hapus building dari queue
  const removeBuilding = (id: number) => {
    const updatedBuildings = buildings.filter(b => b.id !== id);
    setBuildings(updatedBuildings);
    saveToLocalStorage(updatedBuildings);
    toast.success('Building dihapus dari antrean');
  };
  
  // Ubah prioritas building
  const changePriority = (id: number, priority: 'low' | 'medium' | 'high') => {
    const updatedBuildings = buildings.map(b => 
      b.id === id ? { ...b, priority } : b
    );
    setBuildings(updatedBuildings);
    saveToLocalStorage(updatedBuildings);
    toast.success(`Prioritas diubah menjadi ${priority}`);
  };
  
  // Urutkan buildings berdasarkan prioritas
  const sortByPriority = () => {
    const priorityValues = { high: 3, medium: 2, low: 1 };
    const sortedBuildings = [...buildings].sort((a, b) => 
      priorityValues[b.priority] - priorityValues[a.priority]
    );
    setBuildings(sortedBuildings);
    saveToLocalStorage(sortedBuildings);
    toast.success('Building diurutkan berdasarkan prioritas');
  };
  
  // Hapus semua buildings
  const clearAll = () => {
    setBuildings([]);
    saveToLocalStorage([]);
    toast.success('Semua building dihapus dari antrean');
  };
  
  // Dapatkan warna badge berdasarkan prioritas
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-600/70';
      case 'medium':
        return 'bg-yellow-600/70';
      case 'low':
        return 'bg-green-600/70';
      default:
        return 'bg-gray-600/70';
    }
  };
  
  // Dapatkan warna badge berdasarkan optimalitas
  const getOptimalityColor = (optimality: string | undefined): string => {
    switch (optimality) {
      case 'Optimal':
        return 'bg-green-600/70';
      case 'Suboptimal':
        return 'bg-red-600/70';
      default:
        return 'bg-gray-600/70';
    }
  };
  
  // Dapatkan icon berdasarkan optimalitas
  const getOptimalityIcon = (optimality: string | undefined) => {
    switch (optimality) {
      case 'Optimal':
        return <Check className="h-3 w-3" />;
      case 'Suboptimal':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };
  
  // Fungsi untuk memulai edit
  const startEdit = (building: Building) => {
    setEditingId(building.id);
    // Ekstrak nama dan level dari nama bangunan
    const match = building.name.match(/(.+) Level (\d+)/);
    if (match) {
      setEditName(match[1]);
      setEditLevel(match[2]);
    } else {
      setEditName(building.name);
      setEditLevel('1');
    }
  };
  
  // Fungsi untuk menyimpan hasil edit
  const saveEdit = (id: number) => {
    const updatedBuildings = buildings.map(b => 
      b.id === id ? { 
        ...b, 
        name: `${editName} Level ${editLevel}`,
        baseName: editName
      } : b
    );
    setBuildings(updatedBuildings);
    saveToLocalStorage(updatedBuildings);
    setEditingId(null);
    toast.success('Building berhasil diperbarui');
  };
  
  // Fungsi untuk membatalkan edit
  const cancelEdit = () => {
    setEditingId(null);
  };
  
  // Efek untuk mengoptimalkan antrean saat pengaturan berubah
  useEffect(() => {
    if (optimizeQueue && buildings.length > 0) {
      const now = new Date();
      const sleepStartMs = sleepStartTime.getTime();
      const sleepEndMs = sleepEndTime.getTime() + (sleepEndTime < sleepStartTime ? 24 * 60 * 60 * 1000 : 0);
      
      const optimizedQueue = optimizeBuilderQueue([...buildings], now.getTime(), sleepStartMs, sleepEndMs);
      
      // Hanya perbarui jika urutan berubah
      if (JSON.stringify(optimizedQueue.map(b => b.id)) !== JSON.stringify(buildings.map(b => b.id))) {
        setBuildings(optimizedQueue);
        saveToLocalStorage(optimizedQueue);
        toast.success('Antrean dioptimalkan berdasarkan waktu tidur');
      }
    }
  }, [sleepStartTime, sleepEndTime, optimizeQueue]);
  
  // Efek untuk menyimpan waktu tidur ke localStorage
  useEffect(() => {
    localStorage.setItem('sleepStartTime', sleepStartTime.toISOString());
    localStorage.setItem('sleepEndTime', sleepEndTime.toISOString());
    localStorage.setItem('optimizeQueue', optimizeQueue.toString());
  }, [sleepStartTime, sleepEndTime, optimizeQueue]);
  
  // Efek untuk memuat waktu tidur dari localStorage
  useEffect(() => {
    const savedSleepStartTime = localStorage.getItem('sleepStartTime');
    const savedSleepEndTime = localStorage.getItem('sleepEndTime');
    const savedOptimizeQueue = localStorage.getItem('optimizeQueue');
    
    if (savedSleepStartTime) {
      setSleepStartTime(new Date(savedSleepStartTime));
    }
    
    if (savedSleepEndTime) {
      setSleepEndTime(new Date(savedSleepEndTime));
    }
    
    if (savedOptimizeQueue) {
      setOptimizeQueue(savedOptimizeQueue === 'true');
    }
  }, []);
  
  // Fungsi untuk toggle mode edit
  const toggleEditMode = () => {
    if (isEditMode) {
      // Jika sedang dalam mode edit, matikan mode edit
      setIsEditMode(false);
      setEditingId(null);
    } else {
      // Jika tidak dalam mode edit, aktifkan mode edit
      setIsEditMode(true);
    }
    toast.success(isEditMode ? 'Mode edit dinonaktifkan' : 'Mode edit diaktifkan');
  };
  
  return (
    <Card className="bg-[#150b30]/70 border-[#2a1b4a] backdrop-blur-sm overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold text-white flex items-center">
          <Clock className="w-5 h-5 mr-2 text-purple-400" />
          Antrean Builder {selectedBuilder}
        </CardTitle>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleEditMode}
            className={`bg-[#1d1040]/50 border-[#2a1b4a] text-white hover:bg-[#2a1b4a] ${
              isEditMode ? 'border-green-500 text-green-400' : ''
            }`}
          >
            <PenSquare className="h-4 w-4 mr-1" />
            {isEditMode ? 'Selesai Edit' : 'Edit Semua'}
          </Button>
          
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="bg-[#1d1040]/50 border-[#2a1b4a] text-white hover:bg-[#2a1b4a]">
                <Settings2 className="h-4 w-4 mr-1" />
                Pengaturan
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#150b30] border-[#2a1b4a] text-white">
              <DialogHeader>
                <DialogTitle>Pengaturan Optimasi</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Waktu Mulai Tidur</label>
                  <TimePicker 
                    date={sleepStartTime} 
                    setDate={setSleepStartTime} 
                    className="bg-[#1d1040]/50 border-[#2a1b4a]"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Waktu Bangun</label>
                  <TimePicker 
                    date={sleepEndTime} 
                    setDate={setSleepEndTime} 
                    className="bg-[#1d1040]/50 border-[#2a1b4a]"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="optimize-queue"
                    checked={optimizeQueue}
                    onChange={(e) => setOptimizeQueue(e.target.checked)}
                    className="rounded border-[#2a1b4a] bg-[#1d1040]/50"
                  />
                  <label htmlFor="optimize-queue" className="text-sm font-medium">
                    Aktifkan Optimasi Otomatis
                  </label>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={sortByPriority}
            className="bg-[#1d1040]/50 border-[#2a1b4a] text-white hover:bg-[#2a1b4a]"
          >
            Urutkan
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAll}
            className="bg-[#1d1040]/50 border-[#2a1b4a] text-white hover:bg-[#2a1b4a]"
          >
            Hapus Semua
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {buildings.length > 0 ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2 text-sm text-gray-400">
              <div>Total: {buildings.length} building</div>
              <div>Total waktu: {formatTotalDuration(totalDuration)}</div>
            </div>
            
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {buildings.map((building, index) => {
                  const endTime = endTimes[index];
                  const now = new Date();
                  const sleepStartMs = sleepStartTime.getTime();
                  const sleepEndMs = sleepEndTime.getTime() + (sleepEndTime < sleepStartTime ? 24 * 60 * 60 * 1000 : 0);
                  
                  // Determine if this building's completion time is during sleep
                  const endTimeMs = endTime.getTime();
                  const isDuringSleep = endTimeMs >= sleepStartMs && endTimeMs <= sleepEndMs;
                  
                  // Determine optimality if not already set
                  const optimality = building.optimality || (
                    optimizeQueue ? 
                      determineOptimality(building, now.getTime() + (index > 0 ? totalDuration : 0), sleepStartMs, sleepEndMs) :
                      undefined
                  );
                  
                  // Check if this building should be in edit mode
                  const isEditing = isEditMode || editingId === building.id;
                  
                  return (
                    <div 
                      key={building.id} 
                      className={`p-3 rounded-md border ${
                        isDuringSleep ? 'border-amber-500/30 bg-amber-900/10' : 'border-[#2a1b4a]/50 bg-[#1d1040]/30'
                      } ${isEditing ? 'border-green-500/50 bg-green-900/10' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          {isEditing ? (
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center space-x-2">
                                <Input
                                  value={editingId === building.id ? editName : building.name.split(' Level ')[0]}
                                  onChange={(e) => {
                                    setEditingId(building.id);
                                    setEditName(e.target.value);
                                    setEditLevel(building.name.split(' Level ')[1] || '1');
                                  }}
                                  className="bg-[#1d1040]/50 border-[#2a1b4a] text-white w-40"
                                  placeholder="Nama bangunan"
                                  onFocus={() => {
                                    if (!editingId) {
                                      setEditingId(building.id);
                                      const match = building.name.match(/(.+) Level (\d+)/);
                                      if (match) {
                                        setEditName(match[1]);
                                        setEditLevel(match[2]);
                                      } else {
                                        setEditName(building.name);
                                        setEditLevel('1');
                                      }
                                    }
                                  }}
                                />
                                <Input
                                  value={editingId === building.id ? editLevel : building.name.split(' Level ')[1] || '1'}
                                  onChange={(e) => {
                                    setEditingId(building.id);
                                    setEditLevel(e.target.value);
                                    if (!editName) {
                                      setEditName(building.name.split(' Level ')[0]);
                                    }
                                  }}
                                  className="bg-[#1d1040]/50 border-[#2a1b4a] text-white w-16"
                                  placeholder="Level"
                                  type="number"
                                  min="1"
                                  onFocus={() => {
                                    if (!editingId) {
                                      setEditingId(building.id);
                                      const match = building.name.match(/(.+) Level (\d+)/);
                                      if (match) {
                                        setEditName(match[1]);
                                        setEditLevel(match[2]);
                                      } else {
                                        setEditName(building.name);
                                        setEditLevel('1');
                                      }
                                    }
                                  }}
                                />
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-green-400 hover:text-green-300 hover:bg-[#2a1b4a]/50"
                                  onClick={() => saveEdit(building.id)}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-[#2a1b4a]/50"
                                  onClick={() => {
                                    if (isEditMode) {
                                      removeBuilding(building.id);
                                    } else {
                                      cancelEdit();
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <h3 className="text-white font-medium flex items-center">
                                {getCategoryIcon(building.category)}
                                {building.name}
                              </h3>
                              <Badge className={`ml-2 ${getPriorityColor(building.priority)}`}>
                                {building.priority}
                              </Badge>
                              {optimality && (
                                <Badge className={`ml-2 flex items-center ${getOptimalityColor(optimality)}`}>
                                  {getOptimalityIcon(optimality)}
                                  <span className="ml-1">{optimality}</span>
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="text-sm text-gray-400 mt-1">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              <span>{building.durationText}</span>
                            </div>
                            <div className="mt-1">
                              Selesai: {formatDateTime(endTime)}
                              {isDuringSleep && (
                                <span className="text-amber-400 ml-2">(saat tidur)</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-1">
                          {!isEditing && (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-[#2a1b4a]/50"
                                onClick={() => startEdit(building)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Select
                                value={building.priority}
                                onValueChange={(value: 'low' | 'medium' | 'high') => changePriority(building.id, value)}
                              >
                                <SelectTrigger className="w-[100px] h-8 text-xs bg-[#1d1040]/50 border-[#2a1b4a] text-white">
                                  <SelectValue placeholder="Prioritas" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1d1040] border-[#2a1b4a] text-white">
                                  <SelectItem value="high">Tinggi</SelectItem>
                                  <SelectItem value="medium">Sedang</SelectItem>
                                  <SelectItem value="low">Rendah</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeBuilding(building.id)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-[#2a1b4a]/50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>Belum ada building dalam antrean</p>
            <p className="text-sm mt-2">Tambahkan building dari daftar di bawah</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 