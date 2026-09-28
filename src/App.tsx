/**
 * ⛅ Weather Dashboard
 * Real-time meteorological intelligence with dynamic background atmospherics
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchWeatherData,
  GeocodingResult,
  POPULAR_CITIES,
  WeatherDashboardData,
  cToF,
} from './services/weather';
import { BackgroundLayer } from './components/BackgroundLayer';
import { SearchBar } from './components/SearchBar';
import { WeatherMetricCard } from './components/WeatherMetricCard';
import { ForecastSection } from './components/ForecastSection';
import { RawJsonResponse } from './components/RawJsonResponse';
import {
  RefreshCw,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

export default function App() {
  const [data, setData] = useState<WeatherDashboardData | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<GeocodingResult>(POPULAR_CITIES[0]); // Default: London
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [localTimeString, setLocalTimeString] = useState<string>('');

  // Fetch weather data for the selected location
  const loadWeather = useCallback(async (location: GeocodingResult) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await fetchWeatherData(location);
      setData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to fetch weather data';
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadWeather(selectedLocation);
  }, [loadWeather, selectedLocation]);

  // Update local time ticker for the target timezone
  useEffect(() => {
    if (!data?.location.timezone) return;

    const updateClock = () => {
      try {
        const now = new Date();
        const formatted = now.toLocaleTimeString([], {
          timeZone: data.location.timezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        setLocalTimeString(formatted);
      } catch {
        setLocalTimeString('');
      }
    };

    updateClock();
    const interval = setInterval(updateClock, 10000);
    return () => clearInterval(interval);
  }, [data?.location.timezone]);

  // Handle city selection
  const handleSelectCity = (city: GeocodingResult) => {
    setSelectedLocation(city);
  };

  // Temperature display helpers
  const displayCurrentTemp = data
    ? unit === 'C'
      ? `${data.current.tempC}°`
      : `${data.current.tempF}°`
    : '--°';

  const displayApparentTemp = data
    ? unit === 'C'
      ? `${data.current.apparentTempC}°`
      : `${data.current.apparentTempF}°`
    : '--°';

  const displayHigh = data
    ? unit === 'C'
      ? `${data.today.tempMaxC}°`
      : `${data.today.tempMaxF}°`
    : '--°';

  const displayLow = data
    ? unit === 'C'
      ? `${data.today.tempMinC}°`
      : `${data.today.tempMinF}°`
    : '--°';

  return (
    <div className="relative min-h-screen w-full flex flex-col font-sans text-white select-none overflow-x-hidden">
      {/* Dynamic full-screen background with smooth fade transition & dark overlay */}
      <BackgroundLayer
        imageUrl={data?.condition.backgroundImage || ''}
        themeFallback={data?.condition.backgroundTheme || 'from-sky-700 via-indigo-900 to-slate-950'}
        isNight={data?.condition.isNight ?? false}
      />

      {/* Main Content Viewport */}
      <div className="relative z-10 flex-1 flex flex-col max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 gap-6 sm:gap-8">
        {/* Top Header & App Brand */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/15 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl" role="img" aria-label="weather icon">
              ⛅
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Weather Dashboard
              </h1>
              <p className="text-xs text-white/70">
                Live atmospheric intelligence via Open-Meteo
              </p>
            </div>
          </div>

          {/* Unit Switcher & Refresh button */}
          <div className="flex items-center gap-3">
            {/* Unit Switcher */}
            <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/20 text-xs">
              <button
                type="button"
                onClick={() => setUnit('C')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  unit === 'C'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
                title="Celsius"
              >
                °C
              </button>
              <button
                type="button"
                onClick={() => setUnit('F')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  unit === 'F'
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-white/70 hover:text-white'
                }`}
                title="Fahrenheit"
              >
                °F
              </button>
            </div>

            {/* Refresh button */}
            <button
              type="button"
              onClick={() => loadWeather(selectedLocation)}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 text-white/90 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Refresh current data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Search Bar Section */}
        <section aria-label="Location search">
          <SearchBar
            onSelectCity={handleSelectCity}
            currentCityName={data?.location.city || selectedLocation.name}
            isLoading={isLoading}
          />
        </section>

        {/* Loading State Banner */}
        {isLoading && (
          <div className="w-full rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 p-8 text-center shadow-2xl flex flex-col items-center justify-center gap-4 animate-pulse">
            <div className="p-3 bg-white/15 rounded-full">
              <RefreshCw className="w-8 h-8 text-sky-300 animate-spin" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">
                Fetching live weather data…
              </h2>
              <p className="text-sm text-white/70 mt-1">
                Connecting to Open-Meteo satellite & radar telemetry for {selectedLocation.name}
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && errorMessage && (
          <div className="w-full rounded-2xl bg-rose-950/60 backdrop-blur-md border border-rose-500/40 p-6 sm:p-8 text-center shadow-2xl flex flex-col items-center gap-4">
            <div className="p-3 bg-rose-500/20 rounded-full text-rose-300">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Unable to retrieve weather data
              </h2>
              <p className="text-sm text-rose-200/90 mt-1 max-w-md mx-auto">
                {errorMessage}
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadWeather(selectedLocation)}
              className="px-5 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Weather Dashboard Main Content */}
        {!isLoading && data && (
          <main className="flex flex-col gap-6 sm:gap-8">
            {/* City Overview Hero Card */}
            <div className="relative overflow-hidden rounded-3xl bg-white/10 dark:bg-black/40 backdrop-blur-lg border border-white/20 shadow-2xl p-6 sm:p-10 transition-all">
              {/* Gloss highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left: City, Country, Local Time, Condition */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-white/15 border border-white/20 text-white/90">
                      {data.condition.isNight ? '🌙 Nighttime' : '☀️ Daytime'}
                    </span>
                    {localTimeString && (
                      <span className="text-xs text-white/70 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-300" />
                        {localTimeString}
                      </span>
                    )}
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mt-1 flex items-center gap-2.5">
                    <span>{data.location.city}</span>
                    <span className="text-2xl sm:text-3xl select-none" role="img" aria-label="flag">
                      {data.location.country?.toLowerCase() === 'india' || data.location.timezone?.includes('Kolkata') ? '🇮🇳' : '🌍'}
                    </span>
                  </h2>

                  {(data.location.region || data.location.country) && (
                    <p className="text-sm sm:text-base text-white/80 font-medium">
                      {[data.location.region, data.location.country].filter(Boolean).join(', ')}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-3xl sm:text-4xl" role="img" aria-label={data.condition.description}>
                      {data.condition.emoji}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                      {data.condition.description}
                    </span>
                  </div>
                </div>

                {/* Right: Big Temperature Display & High/Low / Feels Like */}
                <div className="flex flex-col sm:items-end justify-center">
                  <div className="flex items-start">
                    <span className="text-6xl sm:text-8xl font-black tracking-tighter text-white font-mono leading-none">
                      {displayCurrentTemp}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-3 text-sm sm:text-base text-white/80 font-mono">
                    <span className="flex items-center gap-1">
                      <ArrowUp className="w-4 h-4 text-rose-400" />
                      <span>{displayHigh}</span>
                    </span>
                    <span className="text-white/40">·</span>
                    <span className="flex items-center gap-1">
                      <ArrowDown className="w-4 h-4 text-sky-400" />
                      <span>{displayLow}</span>
                    </span>
                    <span className="text-white/40">·</span>
                    <span className="text-xs sm:text-sm text-white/70 font-sans font-medium">
                      Feels like {displayApparentTemp}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid of Detail Cards */}
            <section aria-label="Detailed Weather Metrics">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Live Weather Metrics
                </h3>
                <span className="text-xs text-white/60">
                  Updated every 15 mins
                </span>
              </div>

              {/* 8 Essential Detail Cards Required:
                  💧 Humidity (%), 🌬️ Wind Speed (km/h), 👁️ Visibility (km), 🌡️ Pressure (hPa),
                  🌅 Sunrise, 🌇 Sunset, 🧭 Wind Direction, and ☁️ Cloud Cover
              */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {/* 1. 💧 Humidity (%) */}
                <WeatherMetricCard
                  emoji="💧"
                  label="Humidity"
                  value={data.current.humidity}
                  unit="%"
                  subtext={
                    data.current.humidity < 40
                      ? 'Dry air'
                      : data.current.humidity > 70
                      ? 'Humid atmosphere'
                      : 'Comfortable balance'
                  }
                />

                {/* 2. 🌬️ Wind Speed (km/h) */}
                <WeatherMetricCard
                  emoji="🌬️"
                  label="Wind Speed"
                  value={data.current.windSpeedKmH}
                  unit="km/h"
                  subtext={
                    data.current.windSpeedKmH < 10
                      ? 'Gentle breeze'
                      : data.current.windSpeedKmH < 30
                      ? 'Moderate wind'
                      : 'Strong gusty wind'
                  }
                />

                {/* 3. 👁️ Visibility (km) */}
                <WeatherMetricCard
                  emoji="👁️"
                  label="Visibility"
                  value={data.current.visibilityKm}
                  unit="km"
                  subtext={
                    data.current.visibilityKm >= 10
                      ? 'Crystal clear view'
                      : data.current.visibilityKm >= 5
                      ? 'Moderate haze'
                      : 'Low fog / reduced sight'
                  }
                />

                {/* 4. 🌡️ Pressure (hPa) */}
                <WeatherMetricCard
                  emoji="🌡️"
                  label="Pressure"
                  value={data.current.pressureHPa}
                  unit="hPa"
                  subtext={
                    data.current.pressureHPa > 1015
                      ? 'High pressure (fair)'
                      : data.current.pressureHPa < 1005
                      ? 'Low pressure (storm risk)'
                      : 'Standard atmospheric'
                  }
                />

                {/* 5. 🌅 Sunrise */}
                <WeatherMetricCard
                  emoji="🌅"
                  label="Sunrise"
                  value={data.current.sunriseFormatted}
                  subtext="Dawn illumination"
                />

                {/* 6. 🌇 Sunset */}
                <WeatherMetricCard
                  emoji="🌇"
                  label="Sunset"
                  value={data.current.sunsetFormatted}
                  subtext="Dusk twilight"
                />

                {/* 7. 🧭 Wind Direction */}
                <WeatherMetricCard
                  emoji="🧭"
                  label="Wind Direction"
                  value={data.current.windDirectionCompass}
                  unit={`(${data.current.windDirectionDeg}°)`}
                  subtext="16-point cardinal compass"
                />

                {/* 8. ☁️ Cloud Cover */}
                <WeatherMetricCard
                  emoji="☁️"
                  label="Cloud Cover"
                  value={data.current.cloudCover}
                  unit="%"
                  subtext={
                    data.current.cloudCover < 20
                      ? 'Mostly clear blue'
                      : data.current.cloudCover < 60
                      ? 'Scattered clouds'
                      : 'Dense cloud canopy'
                  }
                />
              </div>
            </section>

            {/* Forecast Section (Hourly & 7-Day) */}
            <section aria-label="Forecast">
              <ForecastSection
                hourly={data.hourly}
                daily={data.daily}
                tempUnit={unit}
              />
            </section>

            {/* Atmosphere Background Status Kicker */}
            <div className="flex flex-wrap items-center justify-between text-xs text-white/60 px-2 py-1 bg-white/5 rounded-xl border border-white/10">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                Active backdrop: <strong className="text-white/80 capitalize">{data.condition.category}</strong>
                {data.condition.isNight ? ' (Night Mode)' : ' (Daylight Mode)'}
              </span>
              <span>
                Coordinates: {data.location.latitude.toFixed(2)}°, {data.location.longitude.toFixed(2)}°
              </span>
            </div>

            {/* Collapsible Raw JSON Response Section */}
            <section aria-label="Raw JSON Response">
              <RawJsonResponse data={data.rawResponse} />
            </section>
          </main>
        )}

        {/* Footer */}
        <footer className="mt-auto pt-6 pb-2 text-center text-xs text-white/50 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>⛅ Weather Dashboard &middot; Real-time meteorological telemetry</span>
          <span>Data provided by <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/80">Open-Meteo API</a></span>
        </footer>
      </div>
    </div>
  );
}
