"use client";

import * as React from "react";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  className,
}: DateTimePickerProps) {
  const [date, setDate] = React.useState<Date | undefined>(
    value ? new Date(value) : undefined
  );
  const [time, setTime] = React.useState<string>("09:00");

  React.useEffect(() => {
    if (value) {
      const d = new Date(value);
      setDate(d);
      setTime(format(d, "HH:mm"));
    } else {
      // Set default to tomorrow at 9 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      setDate(tomorrow);
      setTime("09:00");
      onChange?.(tomorrow.toISOString());
    }
  }, []);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate);
      const [hours, minutes] = time.split(":");
      selectedDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      onChange?.(selectedDate.toISOString());
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (date) {
      const [hours, minutes] = newTime.split(":");
      const newDate = new Date(date);
      newDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      setDate(newDate);
      onChange?.(newDate.toISOString());
    }
  };

  // Generate time options (every 30 minutes)
  const timeOptions = React.useMemo(() => {
    const options: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const h = hour.toString().padStart(2, "0");
        const m = minute.toString().padStart(2, "0");
        options.push(`${h}:${m}`);
      }
    }
    return options;
  }, []);

  const formatTimeOption = (timeStr: string) => {
    const [hour, minute] = timeStr.split(":");
    const h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${minute} ${ampm}`;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                disabled={(date) =>
                  date < new Date(new Date().setHours(0, 0, 0, 0))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Picker */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time
          </Label>
          <Select value={time} onValueChange={handleTimeChange}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {time ? formatTimeOption(time) : "Select time"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {timeOptions.map((timeOption) => (
                <SelectItem key={timeOption} value={timeOption}>
                  {formatTimeOption(timeOption)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Preview */}
      {date && time && (
        <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium text-primary">Scheduled for:</p>
          </div>
          <p className="text-base font-semibold">
            {format(date, "EEEE, MMMM d, yyyy")} at {formatTimeOption(time)}
          </p>
        </div>
      )}
    </div>
  );
}
