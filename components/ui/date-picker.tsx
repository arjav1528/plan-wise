"use client";

import * as React from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import "react-datepicker/dist/react-datepicker.css";

interface DatePickerComponentProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  className?: string;
}

export function DatePickerComponent({
  selected,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  minDate,
  className,
}: DatePickerComponentProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <DatePicker
        selected={selected || null}
        onChange={onChange}
        minDate={minDate}
        disabled={disabled}
        dateFormat="MMMM d, yyyy"
        placeholderText={placeholder}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm",
          "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "cursor-pointer transition-colors hover:border-ring"
        )}
        wrapperClassName="w-full"
        calendarClassName="!border !border-border !rounded-lg !shadow-lg !bg-background !p-4"
        dayClassName={(date) => {
          if (!date) return "";
          try {
            const isSelected = selected && format(date, "yyyy-MM-dd") === format(selected, "yyyy-MM-dd");
            const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
            return cn(
              "!rounded-md !transition-colors",
              isSelected
                ? "!bg-primary !text-primary-foreground !font-semibold"
                : "hover:!bg-accent hover:!text-accent-foreground",
              isToday && !isSelected && "!bg-accent/50 !font-medium"
            );
          } catch {
            return "";
          }
        }}
        renderCustomHeader={({
          date,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <div className="flex items-center justify-between px-2 py-3 mb-2 border-b border-border">
            <button
              onClick={(e) => {
                e.preventDefault();
                decreaseMonth();
              }}
              disabled={prevMonthButtonDisabled}
              className={cn(
                "p-2 rounded-md hover:bg-accent transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                prevMonthButtonDisabled && "opacity-50 cursor-not-allowed"
              )}
              type="button"
              aria-label="Previous month"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <span className="text-base font-semibold text-foreground">
              {format(date, "MMMM yyyy")}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                increaseMonth();
              }}
              disabled={nextMonthButtonDisabled}
              className={cn(
                "p-2 rounded-md hover:bg-accent transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                nextMonthButtonDisabled && "opacity-50 cursor-not-allowed"
              )}
              type="button"
              aria-label="Next month"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}
        popperClassName="z-50"
        popperModifiers={[
          {
            name: "offset",
            options: {
              offset: [0, 8],
            },
          },
        ]}
      />
      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  );
}

