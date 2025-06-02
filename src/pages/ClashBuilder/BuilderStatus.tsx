import { useState } from 'react';
import { Builder } from '.';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface BuilderStatusProps {
  builders: Builder[];
  setBuilders: React.Dispatch<React.SetStateAction<Builder[]>>;
  userBuilderCount: number;
  updateBuilderCount: (count: number) => void;
  saveToLocalStorage: (builders: Builder[]) => void;
}

export default function BuilderStatus({
  builders,
  setBuilders,
  userBuilderCount,
  updateBuilderCount,
  saveToLocalStorage: saveToStorage
}: BuilderStatusProps) {
  // Update builder status (idle/busy)
  const updateBuilderStatus = (index: number, status: 'idle' | 'busy') => {
    const newBuilders = [...builders];
    newBuilders[index].status = status;
    
    if (status === 'idle') {
      newBuilders[index].availableAt = new Date();
      newBuilders[index].currentTask = null;
      newBuilders[index].inputValues = null; // Reset input values
    } else if (status === 'busy' && !newBuilders[index].inputValues) {
      // Initialize input values for a new busy builder
      newBuilders[index].inputValues = {
        days: 0,
        hours: 0,
        minutes: 0
      };
    }
    
    setBuilders(newBuilders);
    saveToStorage(newBuilders);
  };

  // Update builder time from days, hours, minutes inputs
  const updateBuilderDaysHoursMinutes = (index: number, field: 'days' | 'hours' | 'minutes', value: number) => {
    const newBuilders = [...builders];
    const builder = newBuilders[index];
    
    // Initialize inputValues if not exists
    if (!builder.inputValues) {
      builder.inputValues = {
        days: 0,
        hours: 0,
        minutes: 0
      };
    }
    
    // Update the specific field
    builder.inputValues[field] = value;
    
    // Calculate new available time
    const now = new Date();
    const newAvailableAt = new Date(
      now.getTime() + 
      (builder.inputValues.days * 24 * 60 * 60 * 1000) + 
      (builder.inputValues.hours * 60 * 60 * 1000) + 
      (builder.inputValues.minutes * 60 * 1000)
    );
    
    // Update builder
    builder.availableAt = newAvailableAt;
    setBuilders(newBuilders);
    saveToStorage(newBuilders);
  };

  // Set builder time to current time
  const setBuilderToCurrentTime = (index: number) => {
    const newBuilders = [...builders];
    const builder = newBuilders[index];
    
    // Get current time
    const now = new Date();
    
    // If the builder has a current task, we'll keep that and just update the time
    if (builder.status === 'busy') {
      // Calculate the time difference between now and availableAt
      const availableAt = new Date(builder.availableAt);
      const diffMs = availableAt.getTime() - now.getTime();
      
      // Only update if the time is in the future
      if (diffMs > 0) {
        // Convert to days, hours, minutes
        const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
        const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
        const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
        
        // Update input values with accurate time
        builder.inputValues = {
          days,
          hours,
          minutes
        };
        
        // Show toast or alert to notify user
        if (typeof window !== 'undefined') {
          alert('Waktu builder telah diperbarui ke waktu sekarang!');
        }
      } else {
        // If the time is in the past, set the builder to idle
        builder.status = 'idle';
        builder.availableAt = now;
        builder.inputValues = null;
        builder.currentTask = null;
        
        // Show toast or alert to notify user
        if (typeof window !== 'undefined') {
          alert('Builder telah selesai dan sekarang tersedia!');
        }
      }
    }
    
    setBuilders(newBuilders);
    saveToStorage(newBuilders);
  };

  // Update builder current task
  const updateBuilderTask = (index: number, task: string) => {
    const newBuilders = [...builders];
    newBuilders[index].currentTask = task;
    setBuilders(newBuilders);
    saveToStorage(newBuilders);
  };

  // Format date to readable string
  const formatDate = (date: Date): string => {
    // Format: "DD MMM YYYY, HH:MM"
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    return new Intl.DateTimeFormat('id-ID', options).format(date);
  };

  // Get builder remaining time in days, hours, minutes
  const getBuilderRemainingTime = (builder: Builder) => {
    const now = new Date();
    const availableAt = new Date(builder.availableAt);
    
    // If builder is idle or available time is in the past, return 0s
    if (builder.status === 'idle' || availableAt <= now) {
      return { days: 0, hours: 0, minutes: 0 };
    }
    
    // If builder has custom input values, use those
    if (builder.inputValues) {
      return builder.inputValues;
    }
    
    // Calculate remaining time
    const diffMs = availableAt.getTime() - now.getTime();
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
    
    return {
      days: days,
      hours: hours,
      minutes: minutes
    };
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="flex items-center mb-2 text-gray-300">
          <svg className="w-4 h-4 mr-1 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          Jumlah Builder
        </Label>
        <div className="flex items-center space-x-2">
          <Select
            value={userBuilderCount.toString()}
            onValueChange={(value) => updateBuilderCount(parseInt(value))}
          >
            <SelectTrigger className="w-full bg-[#1d1040]/50 border-[#2a1b4a] text-white">
              <SelectValue placeholder="Pilih jumlah builder" />
            </SelectTrigger>
            <SelectContent className="bg-[#1d1040] border-[#2a1b4a] text-white">
              <SelectItem value="1">1 Builder</SelectItem>
              <SelectItem value="2">2 Builders</SelectItem>
              <SelectItem value="3">3 Builders</SelectItem>
              <SelectItem value="4">4 Builders</SelectItem>
              <SelectItem value="5">5 Builders</SelectItem>
              <SelectItem value="6">6 Builders (with O.T.T.O)</SelectItem>
            </SelectContent>
          </Select>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </TooltipTrigger>
              <TooltipContent className="bg-[#1d1040] border-[#2a1b4a] text-white">
                <p>Pilih jumlah builder yang Anda miliki di game</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {builders.map((builder, index) => (
        <div 
          key={builder.id}
          className={`p-3 rounded-lg ${
            builder.status === 'busy' 
              ? 'bg-[#2a1b4a]/60 border border-amber-700/30' 
              : 'bg-[#2a1b4a]/60 border border-emerald-700/30'
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <Label className="font-medium text-white">{builder.name}</Label>
            <span className={`px-2 py-1 text-xs rounded-full ${
              builder.status === 'busy' 
                ? 'bg-amber-900/30 text-amber-200/90' 
                : 'bg-emerald-900/30 text-emerald-200/90'
            }`}>
              {builder.status === 'busy' ? 'Sibuk' : 'Tersedia'}
            </span>
          </div>
          
          <div className="space-y-2">
            <RadioGroup 
              value={builder.status} 
              onValueChange={(value: 'idle' | 'busy') => updateBuilderStatus(index, value)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="idle" id={`builder${index}_idle`} className="text-purple-400 border-gray-500" />
                <Label htmlFor={`builder${index}_idle`} className="text-sm text-gray-300">Tersedia sekarang</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="busy" id={`builder${index}_busy`} className="text-purple-400 border-gray-500" />
                <Label htmlFor={`builder${index}_busy`} className="text-sm text-gray-300">Sibuk sampai (tanggal & menit)</Label>
              </div>
            </RadioGroup>
            
            <div className={`${builder.status === 'busy' ? '' : 'opacity-50 pointer-events-none'}`}>
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-gray-300">Waktu selesai:</div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setBuilderToCurrentTime(index)}
                        className="h-7 px-2 py-1 text-xs bg-[#2a1b4a]/60 border-purple-500/50 text-purple-300 hover:bg-[#2a1b4a] hover:text-purple-200"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Set Waktu Sekarang
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[#1d1040] border-[#2a1b4a] text-white">
                      <p>Mengatur waktu berdasarkan waktu saat ini untuk akurasi lebih tinggi</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <Input
                  id={`builder${index}_days`}
                  type="number"
                  placeholder="0"
                  min={0}
                  value={getBuilderRemainingTime(builder).days > 0 ? getBuilderRemainingTime(builder).days : ''}
                  onChange={(e) => updateBuilderDaysHoursMinutes(index, 'days', parseInt(e.target.value) || 0)}
                  className="pl-2 pr-8 py-1 text-sm no-spinner bg-[#1d1040]/50 border-[#2a1b4a] text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">Hari</span>
              </div>
              <div className="relative">
                <Input
                  id={`builder${index}_hours`}
                  type="number"
                  placeholder="0"
                  min={0}
                  max={23}
                  value={getBuilderRemainingTime(builder).hours > 0 ? getBuilderRemainingTime(builder).hours : ''}
                  onChange={(e) => updateBuilderDaysHoursMinutes(index, 'hours', parseInt(e.target.value) || 0)}
                  className="pl-2 pr-8 py-1 text-sm no-spinner bg-[#1d1040]/50 border-[#2a1b4a] text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">Jam</span>
              </div>
              <div className="relative">
                <Input
                  id={`builder${index}_minutes`}
                  type="number"
                  placeholder="0"
                  min={0}
                  max={59}
                  value={getBuilderRemainingTime(builder).minutes > 0 ? getBuilderRemainingTime(builder).minutes : ''}
                  onChange={(e) => updateBuilderDaysHoursMinutes(index, 'minutes', parseInt(e.target.value) || 0)}
                  className="pl-2 pr-8 py-1 text-sm no-spinner bg-[#1d1040]/50 border-[#2a1b4a] text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">Menit</span>
              </div>
              </div>
              
              {/* Add completion date display */}
              {builder.status === 'busy' && (
                <div className="mt-2 text-xs text-center">
                  <span className="text-gray-400">Selesai pada: </span>
                  <span className="text-amber-300 font-medium">{formatDate(new Date(builder.availableAt))}</span>
                </div>
              )}
            </div>
            
            <div className={builder.status === 'busy' ? '' : 'hidden'}>
              <Input
                id={`builder${index}_task`}
                type="text"
                placeholder="Upgrade saat ini"
                value={builder.currentTask || ''}
                onChange={(e) => updateBuilderTask(index, e.target.value)}
                className="w-full px-2 py-1 text-sm bg-[#1d1040]/50 border-[#2a1b4a] text-white"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 