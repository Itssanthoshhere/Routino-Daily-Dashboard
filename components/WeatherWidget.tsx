"use client";

import { useEffect, useState } from "react";
import { Sun, CloudSun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, MapPin } from "lucide-react";

type WeatherState = {
  temp: number;
  condition: string;
  code: number;
  city?: string;
  isDay: boolean;
};

// WMO Weather interpretation codes (WW)
function getWeatherLabel(code: number, isDay: boolean): { label: string; icon: typeof Sun } {
  if (code === 0) return { label: isDay ? "Sunny" : "Clear Night", icon: Sun };
  if (code === 1 || code === 2) return { label: "Partly Cloudy", icon: CloudSun };
  if (code === 3) return { label: "Overcast", icon: Cloud };
  if (code === 45 || code === 48) return { label: "Foggy", icon: CloudFog };
  if (code >= 51 && code <= 67) return { label: "Rain Showers", icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: "Snow Flurries", icon: CloudSnow };
  if (code >= 80 && code <= 82) return { label: "Heavy Rain", icon: CloudRain };
  if (code >= 95) return { label: "Thunderstorm", icon: CloudLightning };
  return { label: "Fair", icon: Sun };
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Check cached weather from localStorage (valid for 30 minutes)
    try {
      const cached = localStorage.getItem("routino_weather");
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 30 * 60 * 1000) {
          setWeather(data);
          setLoading(false);
          return;
        }
      }
    } catch {}

    async function loadWeather(lat: number, lon: number, cityName?: string) {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day`
        );
        if (!res.ok) return;
        const json = await res.json();
        const current = json.current;
        if (!current) return;

        const info: WeatherState = {
          temp: Math.round(current.temperature_2m),
          condition: getWeatherLabel(current.weather_code, current.is_day === 1).label,
          code: current.weather_code,
          city: cityName,
          isDay: current.is_day === 1,
        };

        if (active) {
          setWeather(info);
          setLoading(false);
          try {
            localStorage.setItem(
              "routino_weather",
              JSON.stringify({ data: info, timestamp: Date.now() })
            );
          } catch {}
        }
      } catch {
        if (active) setLoading(false);
      }
    }

    // Try browser geolocation first; if not available or denied, use IP-based location
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          loadWeather(pos.coords.latitude, pos.coords.longitude, "Local");
        },
        async () => {
          // Geolocation denied or unavailable -> fallback to free IP lookup
          try {
            const ipRes = await fetch("https://ipapi.co/json/").catch(() => null);
            if (ipRes && ipRes.ok) {
              const ipData = await ipRes.json();
              if (ipData.latitude && ipData.longitude) {
                loadWeather(ipData.latitude, ipData.longitude, ipData.city || "Local");
                return;
              }
            }
          } catch {}
          // Ultimate safe fallback
          loadWeather(12.9716, 77.5946, "Bengaluru");
        },
        { timeout: 4000 }
      );
    } else {
      loadWeather(12.9716, 77.5946, "Bengaluru");
    }

    return () => {
      active = false;
    };
  }, []);

  if (loading || !weather) {
    return (
      <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1 text-[11px] text-muted animate-pulse">
        <Sun size={13} className="text-[#e7ae51]" />
        <span>Weather...</span>
      </div>
    );
  }

  const { icon: WeatherIcon, label } = getWeatherLabel(weather.code, weather.isDay);

  return (
    <div
      className="hidden sm:inline-flex items-center gap-2 rounded-full border border-line bg-white/80 backdrop-blur-sm px-3.5 py-1.5 text-[11px] font-medium text-ink shadow-sm hover:bg-white transition"
      title={`${weather.city ? weather.city + " · " : ""}${label} (${weather.temp}°C)`}
    >
      <WeatherIcon size={14} className="text-[#d4af37]" />
      <span>{weather.temp}°C</span>
      <span className="text-[#c4cbc3]">·</span>
      <span className="text-muted text-[10px] font-normal">{label}</span>
      {weather.city && weather.city !== "Local" && (
        <span className="text-[10px] text-[#89948b] hidden md:inline">({weather.city})</span>
      )}
    </div>
  );
}
