import { useState } from 'react';
import { Building } from '.';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BuildingFormProps {
  buildings: Building[];
  setBuildings: React.Dispatch<React.SetStateAction<Building[]>>;
  formatDuration: (days: number, hours: number, minutes: number) => string;
  saveToLocalStorage: (buildings: Building[]) => void;
}

export default function BuildingForm({
  buildings,
  setBuildings,
  formatDuration,
  saveToLocalStorage: saveToStorage
}: BuildingFormProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Building['category']>('defense');
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [priority, setPriority] = useState<Building['priority']>('medium');
  const [quantity, setQuantity] = useState(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.trim() === '' || (days === 0 && hours === 0 && minutes === 0)) {
      alert('Silakan masukkan nama bangunan dan durasi');
      return;
    }
    
    // Validate quantity
    if (quantity < 1 || quantity > 100) {
      alert('Quantity harus antara 1 dan 100');
      return;
    }
    
    // Calculate duration in milliseconds
    const durationMs = (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
    
    // Create new buildings array
    const newBuildings = [...buildings];
    
    // Add multiple buildings based on quantity
    for (let i = 0; i < quantity; i++) {
      // Create building object
      const building: Building = {
        id: Date.now() + i, // Unique ID for each building
        name: quantity > 1 ? `${name} (${i+1}/${quantity})` : name,
        category: category,
        duration: durationMs,
        durationText: formatDuration(days, hours, minutes),
        priority: priority
      };
      
      // Add to buildings array
      newBuildings.push(building);
    }
    
    // Update buildings state
    setBuildings(newBuildings);
    saveToStorage(newBuildings);
    
    // Clear form
    setName('');
    setDays(0);
    setHours(0);
    setMinutes(0);
    setQuantity(1);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="buildingName" className="block text-gray-300 text-sm font-medium mb-1">
          Nama Bangunan
        </Label>
        <Input
          id="buildingName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="contoh: Cannon level 10"
          className="w-full bg-[#1d1040]/50 border-[#2a1b4a] text-white"
        />
      </div>
      
      <div>
        <Label htmlFor="buildingCategory" className="block text-gray-300 text-sm font-medium mb-1">
          Kategori
        </Label>
        <Select value={category} onValueChange={(value: Building['category']) => setCategory(value)}>
          <SelectTrigger className="w-full bg-[#1d1040]/50 border-[#2a1b4a] text-white">
            <SelectValue placeholder="Pilih kategori" />
          </SelectTrigger>
          <SelectContent className="bg-[#1d1040] border-[#2a1b4a] text-white">
            <SelectItem value="defense">Pertahanan</SelectItem>
            <SelectItem value="resource">Sumber Daya</SelectItem>
            <SelectItem value="army">Pasukan</SelectItem>
            <SelectItem value="wall">Dinding</SelectItem>
            <SelectItem value="other">Lainnya</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label className="block text-gray-300 text-sm font-medium mb-1">
          Durasi Upgrade
        </Label>
        <div className="grid grid-cols-3 gap-2">
          <div className="relative">
            <Input
              id="upgradeDays"
              type="number"
              min={0}
              placeholder="0"
              value={days > 0 ? days : ''}
              onChange={(e) => setDays(parseInt(e.target.value) || 0)}
              className="pl-2 pr-8 py-1 text-sm no-spinner bg-[#1d1040]/50 border-[#2a1b4a] text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">Hari</span>
          </div>
          <div className="relative">
            <Input
              id="upgradeHours"
              type="number"
              min={0}
              max={23}
              placeholder="0"
              value={hours > 0 ? hours : ''}
              onChange={(e) => setHours(parseInt(e.target.value) || 0)}
              className="pl-2 pr-8 py-1 text-sm no-spinner bg-[#1d1040]/50 border-[#2a1b4a] text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">Jam</span>
          </div>
          <div className="relative">
            <Input
              id="upgradeMinutes"
              type="number"
              min={0}
              max={59}
              placeholder="0"
              value={minutes > 0 ? minutes : ''}
              onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
              className="pl-2 pr-8 py-1 text-sm no-spinner bg-[#1d1040]/50 border-[#2a1b4a] text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">Menit</span>
          </div>
        </div>
      </div>
      
      <div>
        <Label htmlFor="buildingPriority" className="block text-gray-300 text-sm font-medium mb-1">
          Prioritas
        </Label>
        <Select value={priority} onValueChange={(value: Building['priority']) => setPriority(value)}>
          <SelectTrigger className="w-full bg-[#1d1040]/50 border-[#2a1b4a] text-white">
            <SelectValue placeholder="Pilih prioritas" />
          </SelectTrigger>
          <SelectContent className="bg-[#1d1040] border-[#2a1b4a] text-white">
            <SelectItem value="high">Tinggi</SelectItem>
            <SelectItem value="medium">Sedang</SelectItem>
            <SelectItem value="low">Rendah</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label htmlFor="buildingQuantity" className="block text-gray-300 text-sm font-medium mb-1">
          Jumlah
        </Label>
        <Input
          id="buildingQuantity"
          type="number"
          min={1}
          max={100}
          placeholder="1"
          value={quantity > 1 ? quantity : ''}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="w-full bg-[#1d1040]/50 border-[#2a1b4a] text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
      
      <Button type="submit" className="w-full bg-purple-900/60 hover:bg-purple-800/70 text-purple-200/90 border border-purple-700/30">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
        </svg>
        Tambah ke Antrean
      </Button>
    </form>
  );
} 