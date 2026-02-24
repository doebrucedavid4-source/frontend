import { cn } from "@/lib/utils";

interface AnimatedWavesProps {
  position: "top" | "bottom";
  className: string;
}

export function AnimatedWaves({
  position = "bottom",
  className,
}: AnimatedWavesProps) {
  const isTop = position === "top";

  return (
    <div
      className={cn(
        "pointer-events-none absolute left-0 right-0 overflow-hidden z-0",
        isTop ? "top-0" : "bottom-0",
        isTop && "rotate-180",
        className
      )}
      style={{ height: "140px" }}
    >
      {/* Layer 1 — slowest, furthest back */}
      <svg
        className="absolute w-[200%] min-w-[1400px] bottom-0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        style={{ animation: "wave-drift-slow 18s ease-in-out infinite alternate", height: "100%" }}
      >
        <defs>
          <linearGradient id="wave-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.04" />
            <stop offset="50%" stopColor="hsl(var(--ring))" stopOpacity="0.08" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <path
          d="M0,90 C200,50 400,110 600,70 C800,30 1000,100 1200,60 C1300,40 1380,80 1440,65 L1440,140 L0,140 Z"
          fill="url(#wave-grad-1)"
        />
      </svg>

      {/* Layer 2 — middle, stroke-based */}
      <svg
        className="absolute w-[200%] min-w-[1400px] bottom-0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        style={{ animation: "wave-drift 10s ease-in-out infinite alternate", height: "100%" }}
      >
        <defs>
          <linearGradient id="wave-stroke-1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="30%" stopColor="hsl(var(--primary))" stopOpacity="0.18" />
            <stop offset="70%" stopColor="hsl(var(--ring))" stopOpacity="0.22" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,70 C120,110 280,30 420,70 C560,110 700,30 840,70 C980,110 1140,30 1280,70 C1350,90 1400,60 1440,75"
          fill="none"
          stroke="url(#wave-stroke-1)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Layer 3 — fastest, front, subtle stroke */}
      <svg
        className="absolute w-[200%] min-w-[1400px] bottom-0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        style={{ animation: "wave-drift-reverse 7s ease-in-out infinite alternate", height: "100%" }}
      >
        <defs>
          <linearGradient id="wave-stroke-2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--ring))" stopOpacity="0" />
            <stop offset="40%" stopColor="hsl(var(--ring))" stopOpacity="0.12" />
            <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(var(--ring))" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,85 C180,45 360,105 540,65 C720,25 900,95 1080,55 C1200,30 1340,80 1440,60"
          fill="none"
          stroke="url(#wave-stroke-2)"
          strokeWidth="1"
        />
      </svg>

      {/* Layer 4 — very subtle fill glow at bottom */}
      <svg
        className="absolute w-[200%] min-w-[1400px] bottom-0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 140"
        preserveAspectRatio="none"
        style={{ animation: "wave-drift 14s ease-in-out infinite alternate", height: "100%" }}
      >
        <defs>
          <linearGradient id="wave-glow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        <path
          d="M0,100 C160,70 320,115 480,85 C640,55 800,110 960,80 C1120,50 1280,100 1440,75 L1440,140 L0,140 Z"
          fill="url(#wave-glow)"
        />
      </svg>
    </div>
  );
}

