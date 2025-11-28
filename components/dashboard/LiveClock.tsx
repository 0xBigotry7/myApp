"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Clock } from "lucide-react";

export default function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 text-sm font-medium bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/50 dark:border-zinc-700/50 transition-colors">
      <Clock size={14} />
      <span>{format(time, "h:mm:ss a")}</span>
    </div>
  );
}

