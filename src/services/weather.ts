/**
 * Weather Service & Open-Meteo API Client
 */

// Asset background images generated for weather states
import bgSunnyDay from '@/src/assets/images/bg_sunny_day_1790600051948.jpg';
import bgClearNight from '@/src/assets/images/bg_clear_night_1790600067607.jpg';
import bgCloudyDay from '@/src/assets/images/bg_cloudy_day_1790600080356.jpg';
import bgRainyWeather from '@/src/assets/images/bg_rainy_weather_1790600093438.jpg';
import bgThunderstorm from '@/src/assets/images/bg_thunderstorm_1790600105203.jpg';
import bgSnowWinter from '@/src/assets/images/bg_snow_winter_1790600116296.jpg';
import bgFogMist from '@/src/assets/images/bg_fog_mist_1790600131461.jpg';

export type WeatherCategory =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'thunderstorm'
  | 'snow'
  | 'fog'
  | 'default';

export interface WeatherConditionInfo {
  category: WeatherCategory;
  description: string;
  emoji: string;
  isNight: boolean;
  backgroundImage: string;
  backgroundTheme: string; // for fallback gradient if image fails
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
}

export interface HourlyForecastItem {
  time: string;
  temp: number;
  code: number;
  isDay: boolean;
  pop: number; // precipitation probability
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  code: number;
  description: string;
  tempMax: number;
  tempMin: number;
  sunrise: string;
  sunset: string;
  uvIndex: number;
}

export interface WeatherDashboardData {
  location: {
    city: string;
    region?: string;
    country?: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  condition: WeatherConditionInfo;
  current: {
    tempC: number;
    tempF: number;
    apparentTempC: number;
    apparentTempF: number;
    humidity: number; // %
    windSpeedKmH: number; // km/h
    windDirectionDeg: number; // degrees
    windDirectionCompass: string; // e.g. NW, WSW
    visibilityKm: number; // km
    pressureHPa: number; // hPa
    cloudCover: number; // %
    sunriseFormatted: string;
    sunsetFormatted: string;
    sunriseRaw: string;
    sunsetRaw: string;
    isDay: boolean;
    weatherCode: number;
  };
  today: {
    tempMaxC: number;
    tempMinC: number;
    tempMaxF: number;
    tempMinF: number;
  };
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  rawResponse: Record<string, unknown>;
}

// Convert wind degrees to 16 cardinal points
export function degToCompass(deg: number): string {
  const val = Math.floor((deg / 22.5) + 0.5);
  const compassArr = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
  ];
  return compassArr[val % 16];
}

// Map WMO Weather Codes to Categories and Descriptions
export function parseWmoCode(code: number, isDay: boolean): { category: WeatherCategory; description: string; emoji: string } {
  switch (code) {
    case 0:
      return {
        category: 'clear',
        description: isDay ? 'Clear Sky' : 'Clear Starry Sky',
        emoji: isDay ? '☀️' : '🌙'
      };
    case 1:
      return {
        category: 'clear',
        description: isDay ? 'Mainly Clear' : 'Mostly Clear Night',
        emoji: isDay ? '🌤️' : '✨'
      };
    case 2:
      return {
        category: 'cloudy',
        description: 'Partly Cloudy',
        emoji: '⛅'
      };
    case 3:
      return {
        category: 'cloudy',
        description: 'Overcast Sky',
        emoji: '☁️'
      };
    case 45:
      return {
        category: 'fog',
        description: 'Atmospheric Fog',
        emoji: '🌫️'
      };
    case 48:
      return {
        category: 'fog',
        description: 'Icy Rime Fog',
        emoji: '🌫️'
      };
    case 51:
      return {
        category: 'rain',
        description: 'Light Drizzle',
        emoji: '🌦️'
      };
    case 53:
      return {
        category: 'rain',
        description: 'Moderate Drizzle',
        emoji: '🌦️'
      };
    case 55:
      return {
        category: 'rain',
        description: 'Dense Drizzle',
        emoji: '🌧️'
      };
    case 56:
    case 57:
      return {
        category: 'rain',
        description: 'Freezing Drizzle',
        emoji: '🌨️'
      };
    case 61:
      return {
        category: 'rain',
        description: 'Light Rain',
        emoji: '🌧️'
      };
    case 63:
      return {
        category: 'rain',
        description: 'Moderate Rain',
        emoji: '🌧️'
      };
    case 65:
      return {
        category: 'rain',
        description: 'Heavy Rain Showers',
        emoji: '🌧️'
      };
    case 66:
    case 67:
      return {
        category: 'rain',
        description: 'Freezing Rain',
        emoji: '🌧️'
      };
    case 71:
      return {
        category: 'snow',
        description: 'Light Snowfall',
        emoji: '🌨️'
      };
    case 73:
      return {
        category: 'snow',
        description: 'Moderate Snowfall',
        emoji: '❄️'
      };
    case 75:
      return {
        category: 'snow',
        description: 'Heavy Snowfall',
        emoji: '❄️'
      };
    case 77:
      return {
        category: 'snow',
        description: 'Snow Grains',
        emoji: '❄️'
      };
    case 80:
      return {
        category: 'rain',
        description: 'Light Rain Showers',
        emoji: '🌦️'
      };
    case 81:
      return {
        category: 'rain',
        description: 'Passing Rain Showers',
        emoji: '🌧️'
      };
    case 82:
      return {
        category: 'rain',
        description: 'Violent Rain Downpour',
        emoji: '⛈️'
      };
    case 85:
      return {
        category: 'snow',
        description: 'Light Snow Showers',
        emoji: '🌨️'
      };
    case 86:
      return {
        category: 'snow',
        description: 'Heavy Snow Showers',
        emoji: '❄️'
      };
    case 95:
      return {
        category: 'thunderstorm',
        description: 'Thunderstorm',
        emoji: '⛈️'
      };
    case 96:
    case 99:
      return {
        category: 'thunderstorm',
        description: 'Thunderstorm with Hail',
        emoji: '⛈️'
      };
    default:
      return {
        category: 'default',
        description: 'Clear Conditions',
        emoji: '🌤️'
      };
  }
}

// Get appropriate background image and fallback gradient based on category & day/night
export function getBackgroundForCondition(category: WeatherCategory, isNight: boolean): { image: string; theme: string } {
  if (isNight) {
    switch (category) {
      case 'clear':
        return {
          image: bgClearNight,
          theme: 'from-slate-950 via-indigo-950 to-slate-900'
        };
      case 'thunderstorm':
        return {
          image: bgThunderstorm,
          theme: 'from-purple-950 via-slate-950 to-neutral-900'
        };
      case 'rain':
        return {
          image: bgRainyWeather,
          theme: 'from-slate-950 via-blue-950 to-zinc-900'
        };
      case 'snow':
        return {
          image: bgSnowWinter,
          theme: 'from-slate-900 via-blue-950 to-slate-950'
        };
      case 'fog':
        return {
          image: bgFogMist,
          theme: 'from-zinc-950 via-slate-900 to-stone-900'
        };
      case 'cloudy':
      default:
        return {
          image: bgClearNight,
          theme: 'from-slate-950 via-sky-950 to-slate-900'
        };
    }
  }

  // Daytime
  switch (category) {
    case 'clear':
      return {
        image: bgSunnyDay,
        theme: 'from-sky-500 via-blue-600 to-amber-400'
      };
    case 'cloudy':
      return {
        image: bgCloudyDay,
        theme: 'from-slate-600 via-zinc-500 to-slate-400'
      };
    case 'rain':
      return {
        image: bgRainyWeather,
        theme: 'from-slate-700 via-blue-900 to-slate-800'
      };
    case 'thunderstorm':
      return {
        image: bgThunderstorm,
        theme: 'from-slate-900 via-purple-900 to-indigo-950'
      };
    case 'snow':
      return {
        image: bgSnowWinter,
        theme: 'from-slate-400 via-sky-200 to-blue-300'
      };
    case 'fog':
      return {
        image: bgFogMist,
        theme: 'from-stone-500 via-zinc-400 to-slate-600'
      };
    case 'default':
    default:
      return {
        image: bgSunnyDay,
        theme: 'from-sky-600 via-blue-500 to-cyan-400'
      };
  }
}

// Format ISO time to readable 12-hour or 24-hour time "06:45 AM"
export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return isoString;
  }
}

// Format date to weekday "Monday, Sep 28"
export function formatDayDate(isoDate: string): string {
  try {
    const date = new Date(isoDate + 'T12:00:00');
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return isoDate;
  }
}

export function cToF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

import { POPULAR_INDIAN_CITIES, POPULAR_GLOBAL_CITIES } from './locationsData';

export { POPULAR_INDIAN_CITIES, POPULAR_GLOBAL_CITIES };

// Popular default cities (combined curated mix with top Indian & global metros)
export const POPULAR_CITIES: GeocodingResult[] = [
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

// Search for cities and locations in India and worldwide
export async function searchCities(
  query: string,
  regionFilter: 'all' | 'india' | 'global' = 'all'
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const lowerQuery = trimmed.toLowerCase();
  const queryMentionsIndia =
    lowerQuery.includes('india') ||
    lowerQuery.includes('bharat') ||
    regionFilter === 'india';

  // Extract base city name in case user typed "Jaipur, Rajasthan" or "Hyderabad, India"
  const parts = trimmed.split(',');
  const primaryName = parts[0].trim();
  const secondaryFilter = parts.length > 1 ? parts.slice(1).join(' ').trim().toLowerCase() : '';

  // 1. Instant local catalog search
  const combinedCatalog = [...POPULAR_INDIAN_CITIES, ...POPULAR_GLOBAL_CITIES];
  const localMatches = combinedCatalog.filter((loc) => {
    if (regionFilter === 'india' && loc.country_code !== 'IN') return false;
    if (regionFilter === 'global' && loc.country_code === 'IN') return false;

    const nameMatch = loc.name.toLowerCase().includes(primaryName.toLowerCase());
    const adminMatch = loc.admin1 ? loc.admin1.toLowerCase().includes(primaryName.toLowerCase()) : false;
    const countryMatch = loc.country ? loc.country.toLowerCase().includes(primaryName.toLowerCase()) : false;

    if (secondaryFilter) {
      const secMatch =
        (loc.admin1 && loc.admin1.toLowerCase().includes(secondaryFilter)) ||
        (loc.country && loc.country.toLowerCase().includes(secondaryFilter));
      return (nameMatch || adminMatch) && secMatch;
    }

    return nameMatch || adminMatch || countryMatch;
  });

  // 2. Fetch live results from Open-Meteo Geocoding API with larger count (up to 30)
  let apiResults: GeocodingResult[] = [];
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(primaryName)}&count=30&language=en&format=json`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.results)) {
        apiResults = data.results;
      }
    }
  } catch (err) {
    console.warn('Open-Meteo geocoding fetch error, using local catalog:', err);
  }

  // 3. Filter and rank results
  const allCandidates = [...localMatches, ...apiResults];

  // Deduplicate by close geographic coordinates (~5km) or exact ID
  const deduplicated: GeocodingResult[] = [];
  for (const candidate of allCandidates) {
    const exists = deduplicated.some(
      (d) =>
        d.id === candidate.id ||
        (Math.abs(d.latitude - candidate.latitude) < 0.05 &&
          Math.abs(d.longitude - candidate.longitude) < 0.05)
    );
    if (!exists) {
      // Check secondary filter (state or country) if user provided "City, State"
      if (secondaryFilter) {
        const matchesSec =
          (candidate.admin1 && candidate.admin1.toLowerCase().includes(secondaryFilter)) ||
          (candidate.country && candidate.country.toLowerCase().includes(secondaryFilter)) ||
          (candidate.country_code && candidate.country_code.toLowerCase().includes(secondaryFilter));
        if (matchesSec) {
          deduplicated.push(candidate);
        }
      } else {
        deduplicated.push(candidate);
      }
    }
  }

  // Filter by selected region tab
  let filtered = deduplicated;
  if (regionFilter === 'india') {
    filtered = deduplicated.filter(
      (c) => c.country_code === 'IN' || (c.country && c.country.toLowerCase() === 'india')
    );
  } else if (regionFilter === 'global') {
    filtered = deduplicated.filter(
      (c) => c.country_code !== 'IN' && (!c.country || c.country.toLowerCase() !== 'india')
    );
  }

  // 4. Sort with smart prioritization
  return filtered.sort((a, b) => {
    const aIsIndia = a.country_code === 'IN' || a.country?.toLowerCase() === 'india';
    const bIsIndia = b.country_code === 'IN' || b.country?.toLowerCase() === 'india';

    // If search mentions India or user is in India mode, put India first
    if (queryMentionsIndia && aIsIndia !== bIsIndia) {
      return aIsIndia ? -1 : 1;
    }

    // Exact city name matches come first
    const aExact = a.name.toLowerCase() === primaryName.toLowerCase();
    const bExact = b.name.toLowerCase() === primaryName.toLowerCase();
    if (aExact !== bExact) return aExact ? -1 : 1;

    // Starts-with matches next
    const aStarts = a.name.toLowerCase().startsWith(primaryName.toLowerCase());
    const bStarts = b.name.toLowerCase().startsWith(primaryName.toLowerCase());
    if (aStarts !== bStarts) return aStarts ? -1 : 1;

    return 0;
  }).slice(0, 20);
}

// Fetch complete weather data for latitude & longitude
export async function fetchWeatherData(
  location: GeocodingResult
): Promise<WeatherDashboardData> {
  const { latitude, longitude, name, admin1, country, timezone = 'auto' } = location;

  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,visibility&hourly=temperature_2m,weather_code,relative_humidity_2m,precipitation_probability,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=${encodeURIComponent(timezone || 'auto')}`;

  const res = await fetch(weatherUrl);
  if (!res.ok) {
    throw new Error(`Weather service returned ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();

  const current = data.current || {};
  const daily = data.daily || {};
  const hourly = data.hourly || {};

  const isNight = current.is_day === 0;
  const weatherCode = current.weather_code ?? 0;
  const parsedCondition = parseWmoCode(weatherCode, !isNight);
  const bg = getBackgroundForCondition(parsedCondition.category, isNight);

  const condition: WeatherConditionInfo = {
    category: parsedCondition.category,
    description: parsedCondition.description,
    emoji: parsedCondition.emoji,
    isNight,
    backgroundImage: bg.image,
    backgroundTheme: bg.theme,
  };

  const tempC = Math.round(current.temperature_2m ?? 20);
  const apparentTempC = Math.round(current.apparent_temperature ?? tempC);

  const windSpeedKmH = Math.round(current.wind_speed_10m ?? 0);
  const windDirectionDeg = Math.round(current.wind_direction_10m ?? 0);
  const windDirectionCompass = degToCompass(windDirectionDeg);

  // visibility in Open-Meteo is in meters, convert to km
  const visibilityMeters = current.visibility ?? 10000;
  const visibilityKm = Math.round((visibilityMeters / 1000) * 10) / 10;

  const humidity = Math.round(current.relative_humidity_2m ?? 50);
  const pressureHPa = Math.round(current.pressure_msl ?? current.surface_pressure ?? 1013);
  const cloudCover = Math.round(current.cloud_cover ?? 0);

  const sunriseRaw = daily.sunrise?.[0] || '';
  const sunsetRaw = daily.sunset?.[0] || '';
  const sunriseFormatted = sunriseRaw ? formatTime(sunriseRaw) : '--:--';
  const sunsetFormatted = sunsetRaw ? formatTime(sunsetRaw) : '--:--';

  const tempMaxC = Math.round(daily.temperature_2m_max?.[0] ?? tempC);
  const tempMinC = Math.round(daily.temperature_2m_min?.[0] ?? tempC);

  // Prepare hourly data (next 24 points)
  const hourlyList: HourlyForecastItem[] = [];
  if (hourly.time && Array.isArray(hourly.time)) {
    // find index closest to now
    const nowIso = current.time || new Date().toISOString();
    let startIndex = hourly.time.findIndex((t: string) => t >= nowIso.slice(0, 13));
    if (startIndex === -1) startIndex = 0;

    for (let i = startIndex; i < Math.min(startIndex + 24, hourly.time.length); i++) {
      hourlyList.push({
        time: hourly.time[i],
        temp: Math.round(hourly.temperature_2m?.[i] ?? 0),
        code: hourly.weather_code?.[i] ?? 0,
        isDay: hourly.is_day ? hourly.is_day[i] === 1 : true,
        pop: hourly.precipitation_probability?.[i] ?? 0,
      });
    }
  }

  // Prepare daily data (next 7 days)
  const dailyList: DailyForecastItem[] = [];
  if (daily.time && Array.isArray(daily.time)) {
    for (let i = 0; i < daily.time.length; i++) {
      const code = daily.weather_code?.[i] ?? 0;
      const parsed = parseWmoCode(code, true);
      const dateStr = daily.time[i];
      const dayDate = new Date(dateStr + 'T12:00:00');
      const dayName = i === 0 ? 'Today' : dayDate.toLocaleDateString([], { weekday: 'short' });

      dailyList.push({
        date: dateStr,
        dayName,
        code,
        description: parsed.description,
        tempMax: Math.round(daily.temperature_2m_max?.[i] ?? 0),
        tempMin: Math.round(daily.temperature_2m_min?.[i] ?? 0),
        sunrise: daily.sunrise?.[i] ? formatTime(daily.sunrise[i]) : '--:--',
        sunset: daily.sunset?.[i] ? formatTime(daily.sunset[i]) : '--:--',
        uvIndex: Math.round(daily.uv_index_max?.[i] ?? 0),
      });
    }
  }

  return {
    location: {
      city: name,
      region: admin1,
      country: country,
      latitude,
      longitude,
      timezone: data.timezone || timezone,
    },
    condition,
    current: {
      tempC,
      tempF: cToF(tempC),
      apparentTempC,
      apparentTempF: cToF(apparentTempC),
      humidity,
      windSpeedKmH,
      windDirectionDeg,
      windDirectionCompass,
      visibilityKm,
      pressureHPa,
      cloudCover,
      sunriseFormatted,
      sunsetFormatted,
      sunriseRaw,
      sunsetRaw,
      isDay: !isNight,
      weatherCode,
    },
    today: {
      tempMaxC,
      tempMinC,
      tempMaxF: cToF(tempMaxC),
      tempMinF: cToF(tempMinC),
    },
    hourly: hourlyList,
    daily: dailyList,
    rawResponse: data,
  };
}

