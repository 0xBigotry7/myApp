"use client";

import React, { useRef, useCallback, memo } from "react";
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

function SpotlightCard({
  children,
  className = "",
  spotlightColor = "rgba(255, 255, 255, 0.25)",
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rafRef = useRef<number>(0);

  // Throttle mouse move with RAF for better performance
  const handleMouseMove = useCallback(({
    currentTarget,
    clientX,
    clientY,
  }: React.MouseEvent) => {
    if (rafRef.current) return;
    
    rafRef.current = requestAnimationFrame(() => {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
      rafRef.current = 0;
    });
  }, [mouseX, mouseY]);

  return (
    <div
      className={cn(
        "group relative border border-white/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 overflow-hidden rounded-[2.5rem] shadow-xl transition-colors duration-200 will-change-auto",
        className
      )}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              500px circle at ${mouseX}px ${mouseY}px,
              ${spotlightColor},
              transparent 70%
            )
          `,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

export default memo(SpotlightCard);

