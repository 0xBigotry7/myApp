"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface CalendarPickerProps {
  value: string;
  onChange: (date: string) => void;
  minDate?: string;
  label?: string;
}

export default function CalendarPicker({ value, onChange, minDate, label }: CalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );

  useEffect(() => {
    if (value) {
      const date = new Date(value + 'T12:00:00'); // Handle timezone properly
      setSelectedDate(date);
      setCurrentMonth(date);
    }
  }, [value]);

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const generateCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const firstDay = firstDayOfMonth(currentMonth);

    // Previous month's trailing days
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Current month's days
    for (let day = 1; day <= totalDays; day++) {
      days.push(day);
    }

    return days;
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const offsetDate = new Date(newDate.getTime() - (newDate.getTimezoneOffset() * 60000));
    setSelectedDate(offsetDate);
    onChange(offsetDate.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const isDateDisabled = (day: number) => {
    if (!minDate) return false;
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const min = new Date(minDate);
    return checkDate < min;
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const formatDisplayDate = () => {
    if (!selectedDate) return "Select date";
    return selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white focus:border-transparent transition-all"
      >
        <Calendar className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
        <span className={`flex-1 text-left text-lg font-medium ${selectedDate ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>
          {formatDisplayDate()}
        </span>
        <span className={`text-zinc-400 dark:text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {/* Calendar Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 sm:bg-transparent sm:dark:bg-transparent backdrop-blur-sm sm:backdrop-blur-none"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:absolute sm:top-full sm:left-0 sm:translate-x-0 sm:translate-y-0 sm:mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 p-4 w-[90vw] max-w-[320px] sm:w-80 animate-in fade-in zoom-in-95 duration-200">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="font-bold text-zinc-900 dark:text-white">
                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </div>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-bold text-zinc-400 dark:text-zinc-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} />;
                }

                const disabled = isDateDisabled(day);
                const selected = isSelected(day);
                const today = isToday(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => !disabled && handleDateClick(day)}
                    disabled={disabled}
                    className={`
                      aspect-square p-2 rounded-xl text-sm font-bold transition-all
                      ${disabled ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer'}
                      ${selected ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-md' : ''}
                      ${today && !selected ? 'border-2 border-zinc-900 dark:border-white text-zinc-900 dark:text-white' : ''}
                      ${!selected && !today && !disabled ? 'text-zinc-700 dark:text-zinc-300' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setSelectedDate(today);
                  setCurrentMonth(today);
                  const offsetDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000));
                  onChange(offsetDate.toISOString().split('T')[0]);
                  setIsOpen(false);
                }}
                className="flex-1 px-3 py-2.5 text-sm font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-3 py-2.5 text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
