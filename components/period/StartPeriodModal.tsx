"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getTranslations, type Locale } from "@/lib/i18n";
import { X, Calendar, Droplets, Save, Loader2, PenLine } from "lucide-react";

interface Props {
  onClose: () => void;
  locale: Locale;
}

export default function StartPeriodModal({ onClose, locale }: Props) {
  const router = useRouter();
  const t = getTranslations(locale);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split("T")[0],
    flowIntensity: "medium",
    notes: "",
  });

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/period/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to start period");

      router.refresh();
      handleClose();
    } catch (error) {
      console.error("Error starting period:", error);
      alert("Failed to start period");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div 
        className={`relative bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col transition-transform duration-300 ${isVisible ? "translate-y-0" : "translate-y-full sm:translate-y-0 sm:scale-100 sm:opacity-100"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white">
          <h3 className="text-xl font-black text-zinc-900 flex items-center gap-2">
            <span className="bg-rose-100 text-rose-600 w-8 h-8 rounded-lg flex items-center justify-center">
              <Droplets className="w-5 h-5" />
            </span>
            {t.startPeriod}
          </h3>
          <button
            onClick={handleClose}
            className="p-2 -mr-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              {t.startDate}
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                max={new Date().toISOString().split("T")[0]}
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-900 font-medium focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all cursor-pointer"
                required
              />
            </div>
          </div>

          {/* Flow Intensity */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
              {t.flowIntensity}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["light", "medium", "heavy"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, flowIntensity: level }))}
                  className={`py-2.5 rounded-xl border-2 transition-all text-sm font-bold capitalize ${
                    formData.flowIntensity === level
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-zinc-100 bg-white text-zinc-500 hover:border-zinc-200"
                  }`}
                >
                  {t[level as keyof typeof t]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              {t.notes}
            </label>
            <div className="relative">
              <PenLine className="absolute left-4 top-4 w-4 h-4 text-zinc-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none resize-none transition-all placeholder:text-zinc-400"
                placeholder={`${t.notes}...`}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3.5 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-[2] py-3.5 bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isLoading ? t.saving : t.startPeriod}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
