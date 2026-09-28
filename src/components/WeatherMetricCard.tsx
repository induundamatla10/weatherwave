import React from 'react';

export interface WeatherMetricCardProps {
  emoji: string;
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
}

export const WeatherMetricCard: React.FC<WeatherMetricCardProps> = ({
  emoji,
  label,
  value,
  unit,
  subtext,
}) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/10 dark:bg-black/35 backdrop-blur-md border border-white/20 p-5 shadow-xl transition-all duration-200 hover:bg-white/15 hover:border-white/30 hover:shadow-2xl">
      {/* Subtle top gloss highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl select-none" role="img" aria-label={label}>
          {emoji}
        </span>
        <span className="text-xs font-medium tracking-wide uppercase text-white/70">
          {label}
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-sm font-medium text-white/80">
            {unit}
          </span>
        )}
      </div>

      {subtext && (
        <div className="mt-2 text-xs text-white/60 font-medium truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};
