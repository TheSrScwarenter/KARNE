import React, { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number; // duration in ms, default 1000
  prefix?: string;
  suffix?: string;
  className?: string;
  locale?: string;
}

// Cubic ease-out function for a snappy start and elegant gentle deceleration
const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 900,
  prefix = '',
  suffix = '',
  className = '',
  locale = 'tr-TR',
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const prevValueRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    prevValueRef.current = endValue;

    if (startValue === endValue) {
      setDisplayValue(endValue);
      return;
    }

    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const current = Math.round(startValue + (endValue - startValue) * easedProgress);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateCounter);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, duration]);

  const formatted = displayValue.toLocaleString(locale);

  return (
    <span className={`inline-block tabular-nums transition-colors duration-300 ${className}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};
