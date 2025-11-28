"use client";

import { useEffect, useRef, memo } from "react";
import { useInView, useMotionValue, useSpring } from "framer-motion";

interface CounterProps {
  value: number;
  direction?: "up" | "down";
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

function Counter({
  value,
  direction = "up",
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? value : 0);
  // Faster, snappier spring for better perceived performance
  const springValue = useSpring(motionValue, {
    damping: 50,
    stiffness: 150,
    mass: 0.5,
  });
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = 
          prefix + 
          latest.toLocaleString("en-US", { 
            minimumFractionDigits: decimals, 
            maximumFractionDigits: decimals 
          }) + 
          suffix;
      }
    });
    
    return unsubscribe;
  }, [springValue, decimals, prefix, suffix]);

  return <span ref={ref} className={className} />;
}

export default memo(Counter);

