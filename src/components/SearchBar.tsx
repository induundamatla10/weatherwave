import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X, Globe, Sparkles } from 'lucide-react';
import {
  searchCities,
  GeocodingResult,
  POPULAR_INDIAN_CITIES,
  POPULAR_GLOBAL_CITIES,
} from '../services/weather';

interface SearchBarProps {
  onSelectCity: (city: GeocodingResult) => void;
  currentCityName?: string;
  isLoading: boolean;
}

type RegionFilter = 'all' | 'india' | 'global';

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectCity,
  currentCityName,
  isLoading,
}) => {
  const [query, setQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for suggestions as user types or region changes
  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      try {
        const results = await searchCities(query, regionFilter);
        setSuggestions(results);
        setShowDropdown(true);
        if (results.length === 0) {
          setSearchError(
            regionFilter === 'india'
              ? `No Indian locations found matching "${query}". Try another spelling or switch to "All Locations".`
              : `No locations found matching "${query}". Check spelling or select from quick picks.`
          );
        }
      } catch {
        setSearchError('Error connecting to location service. Please try again.');
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, regionFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const results = await searchCities(query, regionFilter);
      if (results.length > 0) {
        onSelectCity(results[0]);
        setShowDropdown(false);
        setQuery('');
      } else {
        setSearchError(
          regionFilter === 'india'
            ? `Could not find "${query}" in India. Check spelling or try "All Locations".`
            : `Could not find "${query}". Check spelling or pick a recommended city.`
        );
        setShowDropdown(true);
      }
    } catch {
      setSearchError('Unable to look up location. Please check your internet connection.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (city: GeocodingResult) => {
    onSelectCity(city);
    setShowDropdown(false);
    setQuery('');
    setSearchError(null);
  };

  // Determine which quick picks to show based on active region filter
  const currentQuickPicks =
    regionFilter === 'india'
      ? POPULAR_INDIAN_CITIES.slice(0, 14)
      : regionFilter === 'global'
      ? POPULAR_GLOBAL_CITIES.slice(0, 12)
      : [
          POPULAR_INDIAN_CITIES[0], // Mumbai
          POPULAR_INDIAN_CITIES[1], // New Delhi
          POPULAR_INDIAN_CITIES[2], // Bengaluru
          POPULAR_INDIAN_CITIES[3], // Hyderabad
          POPULAR_GLOBAL_CITIES[0], // London
          POPULAR_GLOBAL_CITIES[1], // New York
          POPULAR_GLOBAL_CITIES[2], // Tokyo
          POPULAR_GLOBAL_CITIES[3], // Paris
          POPULAR_GLOBAL_CITIES[4], // Dubai
          POPULAR_INDIAN_CITIES[8], // Jaipur
          POPULAR_INDIAN_CITIES[9], // Kochi
          POPULAR_INDIAN_CITIES[15], // Srinagar
        ];

  return (
    <div ref={wrapperRef} className="w-full max-w-3xl mx-auto flex flex-col gap-3">
      {/* Search Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/60 group-focus-within:text-white transition-colors">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0 || searchError) setShowDropdown(true);
            }}
            placeholder={
              regionFilter === 'india'
                ? 'Search any city, town, or district in India (e.g. Hyderabad, Jaipur, Kochi, Bhimavaram)...'
                : 'Search any city or location in India or globally (e.g. Mumbai, Tokyo, London, New York)...'
            }
            disabled={isLoading}
            className="w-full pl-11 pr-10 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-white/15 dark:bg-black/40 backdrop-blur-md border border-white/25 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-sky-400/80 focus:border-transparent text-sm sm:text-base transition-all shadow-lg"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setSearchError(null);
              }}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || isSearching || !query.trim()}
          className="px-5 sm:px-7 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white font-semibold text-sm sm:text-base shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shrink-0 border border-sky-400/50"
        >
          {isSearching || isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span>Search</span>
          )}
        </button>
      </form>

      {/* Auto-suggest dropdown with full hierarchy */}
      {showDropdown && (suggestions.length > 0 || searchError) && (
        <div className="relative z-50">
          <div className="absolute top-1 inset-x-0 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
            {searchError && (
              <div className="p-4 text-sm text-amber-200 bg-amber-950/40 border-b border-white/10 flex items-center gap-2">
                <span>⚠️</span>
                <span>{searchError}</span>
              </div>
            )}

            {suggestions.map((item) => {
              const isIndia = item.country_code === 'IN' || item.country?.toLowerCase() === 'india';

              return (
                <button
                  key={`${item.id}-${item.latitude}-${item.longitude}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="w-full text-left px-5 py-3 hover:bg-white/15 transition-colors flex items-center justify-between border-b border-white/5 last:border-0 cursor-pointer text-white group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base select-none shrink-0" role="img" aria-label="country icon">
                      {isIndia ? '🇮🇳' : '🌍'}
                    </span>
                    <div className="flex flex-col truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm sm:text-base text-white group-hover:text-sky-300 transition-colors">
                          {item.name}
                        </span>
                        {item.admin1 && (
                          <span className="text-xs text-white/70">
                            ({item.admin1})
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-white/50 truncate">
                        {[item.admin1, item.country].filter(Boolean).join(', ')} &middot; {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[11px] font-mono uppercase bg-white/10 px-2 py-0.5 rounded text-white/80 border border-white/10">
                      {item.country_code || (isIndia ? 'IN' : 'INT')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Region Filter Switcher & Quick Pick Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
        {/* Region filter tabs */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/15 self-start text-xs">
          <button
            type="button"
            onClick={() => setRegionFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
              regionFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>All Locations</span>
          </button>
          <button
            type="button"
            onClick={() => setRegionFilter('india')}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              regionFilter === 'india'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <span>🇮🇳</span>
            <span>India</span>
          </button>
          <button
            type="button"
            onClick={() => setRegionFilter('global')}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
              regionFilter === 'global'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Worldwide</span>
          </button>
        </div>

        <span className="text-[11px] text-white/50 hidden sm:inline">
          {regionFilter === 'india' ? 'Search covers every city, town & state in India' : 'Instant global meteorological lookup'}
        </span>
      </div>

      {/* Quick Pick Cities Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs text-white/80">
        <span className="shrink-0 text-white/60 font-medium mr-1 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-sky-300" />
          Quick pick:
        </span>
        {currentQuickPicks.map((c) => {
          const isCurrent = currentCityName?.toLowerCase() === c.name.toLowerCase();
          const isIndia = c.country_code === 'IN' || c.country?.toLowerCase() === 'india';

          return (
            <button
              key={`${c.name}-${c.id}`}
              type="button"
              onClick={() => handleSelect(c)}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-xs font-medium transition-all cursor-pointer flex items-center gap-1 ${
                isCurrent
                  ? 'bg-white text-slate-900 shadow-md font-bold'
                  : 'bg-white/15 hover:bg-white/25 text-white/90 border border-white/15'
              }`}
            >
              <span>{isIndia ? '🇮🇳' : '🌍'}</span>
              <span>{c.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
