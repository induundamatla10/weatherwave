import React, { useState } from 'react';
import { HourlyForecastItem, DailyForecastItem, parseWmoCode, cToF } from '../services/weather';
import { Calendar, Clock, Droplets } from 'lucide-react';

interface ForecastSectionProps {
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  tempUnit: 'C' | 'F';
}

export const ForecastSection: React.FC<ForecastSectionProps> = ({
  hourly,
  daily,
  tempUnit,
}) => {
  const [activeTab, setActiveTab] = useState<'hourly' | 'daily'>('hourly');

  const formatHourTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    } catch {
      return iso.slice(11, 16);
    }
  };

  const getDisplayTemp = (c: number) => {
    return tempUnit === 'C' ? `${c}°` : `${cToF(c)}°`;
  };

  return (
    <div className="w-full rounded-2xl bg-white/10 dark:bg-black/35 backdrop-blur-md border border-white/20 shadow-xl overflow-hidden p-5 sm:p-6 transition-all">
      {/* Header and Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-white/15">
        <div className="flex items-center gap-2">
          {activeTab === 'hourly' ? (
            <Clock className="w-5 h-5 text-sky-400" />
          ) : (
            <Calendar className="w-5 h-5 text-amber-300" />
          )}
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            {activeTab === 'hourly' ? '24-Hour Forecast' : '7-Day Extended Forecast'}
          </h3>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center bg-black/30 p-1 rounded-xl border border-white/15 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('hourly')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'hourly'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Hourly
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            7-Day
          </button>
        </div>
      </div>

      {/* Hourly Forecast Horizontal Scroll */}
      {activeTab === 'hourly' && (
        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-white/20 select-none">
          {hourly.map((item, idx) => {
            const parsed = parseWmoCode(item.code, item.isDay);
            const timeLabel = idx === 0 ? 'Now' : formatHourTime(item.time);

            return (
              <div
                key={item.time}
                className="flex flex-col items-center justify-between min-w-[76px] py-3 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors shrink-0 text-center"
              >
                <span className="text-xs text-white/70 font-medium font-mono">
                  {timeLabel}
                </span>

                <span className="text-2xl my-2" role="img" aria-label={parsed.description}>
                  {parsed.emoji}
                </span>

                <span className="text-sm font-bold text-white font-mono">
                  {getDisplayTemp(item.temp)}
                </span>

                {item.pop > 0 ? (
                  <span className="mt-1 flex items-center gap-0.5 text-[10px] text-sky-300 font-mono">
                    <Droplets className="w-2.5 h-2.5" />
                    {item.pop}%
                  </span>
                ) : (
                  <span className="mt-1 text-[10px] text-white/30 font-mono">--</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 7-Day Extended Forecast List */}
      {activeTab === 'daily' && (
        <div className="flex flex-col divide-y divide-white/10">
          {daily.map((day) => {
            const parsed = parseWmoCode(day.code, true);

            return (
              <div
                key={day.date}
                className="py-3 flex items-center justify-between gap-3 text-sm text-white hover:bg-white/5 px-2 rounded-lg transition-colors"
              >
                {/* Day name */}
                <div className="w-20 sm:w-24 shrink-0 font-medium">
                  <span>{day.dayName}</span>
                </div>

                {/* Condition Emoji + Label */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-xl shrink-0" role="img" aria-label={parsed.description}>
                    {parsed.emoji}
                  </span>
                  <span className="text-xs sm:text-sm text-white/80 truncate">
                    {parsed.description}
                  </span>
                </div>

                {/* Min / Max Temp Bar */}
                <div className="flex items-center gap-2 shrink-0 font-mono text-xs sm:text-sm">
                  <span className="text-white/60 w-8 text-right">
                    {getDisplayTemp(day.tempMin)}
                  </span>
                  <div className="w-16 sm:w-24 h-1.5 rounded-full bg-white/15 overflow-hidden relative">
                    <div className="absolute inset-y-0 bg-gradient-to-r from-sky-400 to-amber-400 rounded-full w-full" />
                  </div>
                  <span className="text-white font-bold w-8 text-left">
                    {getDisplayTemp(day.tempMax)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
