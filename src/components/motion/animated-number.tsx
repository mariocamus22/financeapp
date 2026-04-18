"use client";

import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    const from = mounted.current ? fromRef.current : 0;
    mounted.current = true;
    const controls = animate(from, value, {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
      onComplete: () => {
        fromRef.current = value;
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span className={className}>{format(display)}</span>;
}
