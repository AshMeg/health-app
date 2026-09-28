import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * The Garden's atmosphere: time of day from the user's clock, and weather
 * only from a real provider. Without real weather the Garden stays neutral —
 * nothing is ever made up. A future provider (or historical weather) just
 * needs to return a `Weather`.
 */

export type TimeOfDay = "morning" | "day" | "evening" | "night";
export type WeatherKind = "clear" | "cloudy" | "rain" | "snow" | "fog" | "storm";

export type Weather = {
  kind: WeatherKind;
  cloudCover: number; // 0–100
  windKmh: number;
  temperatureC?: number;
  sunrise?: string;
  sunset?: string;
  fetchedAt: string;
};

export function timeOfDay(now = new Date(), weather?: Weather | null): TimeOfDay {
  const h = now.getHours() + now.getMinutes() / 60;
  const hour = (iso?: string, fallback = 0) => (iso ? new Date(iso).getHours() + new Date(iso).getMinutes() / 60 : fallback);
  const rise = hour(weather?.sunrise, 6.5);
  const set = hour(weather?.sunset, 19.5);
  if (h < rise - 0.5 || h >= set + 0.75) return "night";
  if (h < rise + 2.5) return "morning";
  if (h >= set - 1.5) return "evening";
  return "day";
}

/** WMO weather codes → Bloom's calm categories. */
function kindFor(code: number, cloud: number): WeatherKind {
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (code >= 2 || cloud > 60) return "cloudy";
  return "clear";
}

const PREF = "bloom.garden.weather.v1";
const CACHE = "bloom.garden.weather.cache.v1";
const listeners = new Set<() => void>();

type Pref = { enabled: boolean; lat?: number; lon?: number };

function readPref(): string {
  try {
    return localStorage.getItem(PREF) ?? "";
  } catch {
    return "";
  }
}
function parsePref(raw: string): Pref {
  try {
    return raw ? (JSON.parse(raw) as Pref) : { enabled: false };
  } catch {
    return { enabled: false };
  }
}
function writePref(p: Pref) {
  try {
    localStorage.setItem(PREF, JSON.stringify(p));
    if (!p.enabled) localStorage.removeItem(CACHE);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useWeatherPreference() {
  const raw = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readPref,
    () => "",
  );
  const pref = parsePref(raw);
  const [error, setError] = useState<string | null>(null);

  const enable = () => {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Your browser can't share a location, so the Garden will keep its calm default sky.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        // Rounded to ~1 km: enough for weather, no more precise than it needs to be.
        writePref({ enabled: true, lat: Math.round(pos.coords.latitude * 100) / 100, lon: Math.round(pos.coords.longitude * 100) / 100 }),
      () => setError("Location wasn't shared, so the Garden will keep its calm default sky."),
      { maximumAge: 3_600_000, timeout: 10_000 },
    );
  };
  const disable = () => writePref({ enabled: false });
  return { enabled: pref.enabled, enable, disable, error };
}

/** Current real weather, refreshed every 30 minutes, or null when unavailable/off. */
export function useWeather(): Weather | null {
  const raw = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    readPref,
    () => "",
  );
  const pref = parsePref(raw);
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    if (!pref.enabled || pref.lat === undefined || pref.lon === undefined) {
      setWeather(null);
      return;
    }
    let live = true;
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE) ?? "null") as Weather | null;
      if (cached && Date.now() - new Date(cached.fetchedAt).getTime() < 30 * 60_000) {
        setWeather(cached);
        return;
      }
    } catch {
      /* ignore */
    }
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${pref.lat}&longitude=${pref.lon}&current=weather_code,cloud_cover,wind_speed_10m,temperature_2m&daily=sunrise,sunset&forecast_days=1&timezone=auto`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d) => {
        const c = d.current ?? {};
        const w: Weather = {
          kind: kindFor(Number(c.weather_code ?? 0), Number(c.cloud_cover ?? 0)),
          cloudCover: Number(c.cloud_cover ?? 0),
          windKmh: Number(c.wind_speed_10m ?? 0),
          temperatureC: typeof c.temperature_2m === "number" ? c.temperature_2m : undefined,
          sunrise: d.daily?.sunrise?.[0],
          sunset: d.daily?.sunset?.[0],
          fetchedAt: new Date().toISOString(),
        };
        if (!live) return;
        setWeather(w);
        localStorage.setItem(CACHE, JSON.stringify(w));
      })
      .catch(() => live && setWeather(null));
    return () => {
      live = false;
    };
  }, [pref.enabled, pref.lat, pref.lon]);

  return weather;
}

export function useTimeOfDay(weather: Weather | null) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 5 * 60_000);
    return () => clearInterval(t);
  }, []);
  return now ? timeOfDay(now, weather) : "day";
}

export const weatherLabel: Record<WeatherKind, string> = {
  clear: "Clear skies",
  cloudy: "Cloudy",
  rain: "Rain",
  snow: "Snow",
  fog: "Mist",
  storm: "Stormy",
};
