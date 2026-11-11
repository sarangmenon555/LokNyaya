"use client";

import { useEffect, useState } from "react";
import type { Status } from "@loknyaya/engine";

interface Props {
  fraction: number;
  label: string;
  caption: string;
  status: Status;
}

export default function ClockRing({ fraction, label, caption, status }: Props) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(Math.min(1, Math.max(0, fraction))));
    return () => cancelAnimationFrame(id);
  }, [fraction]);

  return (
    <div className={`ring s-${status}`} role="img" aria-label={`${label} ${caption}`}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ring-ticks" cx="60" cy="60" r="58" />
        <circle className="ring-track" cx="60" cy="60" r={radius} />
        <circle
          className="ring-value"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={`${shown * circumference} ${circumference}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="ring-text">
        <strong>{label}</strong>
        <span>{caption}</span>
      </div>
    </div>
  );
}
