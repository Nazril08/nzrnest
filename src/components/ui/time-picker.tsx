import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  className?: string;
}

export function TimePicker({ date, setDate, className = "" }: TimePickerProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleHourChange = (hour: string) => {
    const newDate = new Date(date);
    newDate.setHours(parseInt(hour));
    setDate(newDate);
  };

  const handleMinuteChange = (minute: string) => {
    const newDate = new Date(date);
    newDate.setMinutes(parseInt(minute));
    setDate(newDate);
  };

  return (
    <div className="flex space-x-2">
      <Select
        value={date.getHours().toString()}
        onValueChange={handleHourChange}
      >
        <SelectTrigger className={`w-full ${className}`}>
          <SelectValue placeholder="Jam" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((hour) => (
            <SelectItem key={hour} value={hour.toString()}>
              {hour.toString().padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="flex items-center text-gray-400">:</span>

      <Select
        value={date.getMinutes().toString()}
        onValueChange={handleMinuteChange}
      >
        <SelectTrigger className={`w-full ${className}`}>
          <SelectValue placeholder="Menit" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((minute) => (
            <SelectItem key={minute} value={minute.toString()}>
              {minute.toString().padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 