"use client";

interface LoadingDotsProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingDots({ className = "", size = "md" }: LoadingDotsProps) {
  const sizeClasses = {
    sm: "h-1 w-1",
    md: "h-1.5 w-1.5",
    lg: "h-2 w-2",
  };

  return (
    <div className={`flex items-center gap-1 z-50 ${className}`}>
      <span
        className={`${sizeClasses[size]} rounded-full bg-current`}
        style={{ animation: "dotBounce 0.6s ease-in-out 0s infinite" }}
      />
      <span
        className={`${sizeClasses[size]} rounded-full bg-current`}
        style={{ animation: "dotBounce 0.6s ease-in-out 0.15s infinite" }}
      />
      <span
        className={`${sizeClasses[size]} rounded-full bg-current`}
        style={{ animation: "dotBounce 0.6s ease-in-out 0.3s infinite" }}
      />
      <style jsx>{`
        @keyframes dotBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
