"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { CalendarIcon, ArrowRight } from "lucide-react";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  isEqual,
  startOfMonth,
} from "date-fns";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Pre-defined date range presets
const presets = [
  {
    label: "Today",
    getValue: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Yesterday",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 1)),
      to: endOfDay(subDays(new Date(), 1)),
    }),
  },
  {
    label: "Last 7 Days",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 Days",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "This Month",
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfDay(new Date()),
    }),
  },
];

interface DashboardDateFilterProps {
  className?: string;
}

export function DashboardDateFilter({ className }: DashboardDateFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse dates from URL params or use default (last 30 days)
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const getInitialRange = (): DateRange => {
    if (fromParam && toParam) {
      return {
        from: new Date(fromParam),
        to: new Date(toParam),
      };
    }
    // Default to last 30 days
    return {
      from: startOfDay(subDays(new Date(), 29)),
      to: endOfDay(new Date()),
    };
  };

  const [date, setDate] = React.useState<DateRange | undefined>(
    getInitialRange,
  );
  const [open, setOpen] = React.useState(false);

  // Update URL when date changes
  const updateUrlParams = React.useCallback(
    (range: DateRange | undefined) => {
      if (!range?.from || !range?.to) return;

      const params = new URLSearchParams(searchParams.toString());
      params.set("from", format(range.from, "yyyy-MM-dd"));
      params.set("to", format(range.to, "yyyy-MM-dd"));

      router.push(`${pathname}?${params.toString()}`);
      setOpen(false);
    },
    [pathname, router, searchParams],
  );

  // Handle preset selection
  const handlePresetClick = (preset: (typeof presets)[0]) => {
    const range = preset.getValue();
    setDate(range);
    updateUrlParams(range);
  };

  // Handle custom range selection
  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    // Only update URL when both from and to are selected
    if (range?.from && range?.to) {
      updateUrlParams(range);
    }
  };

  // Determine which preset matches current selection
  const getActivePreset = () => {
    if (!date?.from || !date?.to) return null;
    return presets.find((preset) => {
      const presetRange = preset.getValue();
      return (
        isEqual(startOfDay(date.from!), startOfDay(presetRange.from)) &&
        isEqual(startOfDay(date.to!), startOfDay(presetRange.to))
      );
    })?.label;
  };

  const activePreset = getActivePreset();

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full sm:w-[400px] justify-start text-left font-normal gap-2",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="h-4 w-4 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-1">
              <span className="font-medium">
                {date?.from ? format(date.from, "MMM dd, yyyy") : "Start date"}
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium">
                {date?.to ? format(date.to, "MMM dd, yyyy") : "End date"}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            {/* Quick Filters Sidebar */}
            <div className="p-4 min-w-[160px]">
              <p className="text-xs font-semibold text-muted-foreground mb-3">
                Quick Filters
              </p>
              <div className="flex flex-col gap-1">
                {presets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant={
                      activePreset === preset.label ? "default" : "ghost"
                    }
                    size="sm"
                    className="justify-start text-sm font-medium"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator orientation="vertical" className="h-auto" />

            {/* Calendar */}
            <div className="p-4">
              <Calendar
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={handleSelect}
                numberOfMonths={2}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
