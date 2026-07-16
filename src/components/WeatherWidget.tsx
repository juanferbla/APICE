import React, { useState } from "react";
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Search, Plus, Trash2, ChevronRight, Wind, Droplets } from "lucide-react";

interface WeatherWidgetProps {
  data: {
    cities?: string[];
    activeCity?: string;
  };
  onChange: (newData: any) => void;
  isEditing: boolean;
}

// Simulated real weather conditions with mock variance
const MOCK_WEATHER_DATA: Record<string, { temp: number; state: string; hum: number; wind: number; forecast: { day: string; temp: number; state: string }[] }> = {
  "buenos aires": {
    temp: 14, state: "Lluvia", hum: 88, wind: 15,
    forecast: [
      { day: "Jue", temp: 15, state: "Parcialmente nublado" },
      { day: "Vie", temp: 17, state: "Soleado" },
      { day: "Sáb", temp: 19, state: "Soleado" }
    ]
  },
  "madrid": {
    temp: 26, state: "Soleado", hum: 32, wind: 10,
    forecast: [
      { day: "Jue", temp: 28, state: "Soleado" },
      { day: "Vie", temp: 30, state: "Soleado" },
      { day: "Sáb", temp: 27, state: "Parcialmente nublado" }
    ]
  },
  "miami": {
    temp: 31, state: "Tormenta", hum: 75, wind: 18,
    forecast: [
      { day: "Jue", temp: 29, state: "Nublado" },
      { day: "Vie", temp: 31, state: "Tormenta" },
      { day: "Sáb", temp: 32, state: "Soleado" }
    ]
  },
  "parís": {
    temp: 18, state: "Nublado", hum: 60, wind: 12,
    forecast: [
      { day: "Jue", temp: 19, state: "Nublado" },
      { day: "Vie", temp: 21, state: "Parcialmente nublado" },
      { day: "Sáb", temp: 23, state: "Soleado" }
    ]
  },
  "tokio": {
    temp: 22, state: "Parcialmente nublado", hum: 55, wind: 8,
    forecast: [
      { day: "Jue", temp: 24, state: "Soleado" },
      { day: "Vie", temp: 21, state: "Nublado" },
      { day: "Sáb", temp: 19, state: "Lluvia" }
    ]
  },
  "londres": {
    temp: 15, state: "Nublado", hum: 82, wind: 20,
    forecast: [
      { day: "Jue", temp: 16, state: "Lluvia" },
      { day: "Vie", temp: 18, state: "Nublado" },
      { day: "Sáb", temp: 20, state: "Parcialmente nublado" }
    ]
  }
};

const DEFAULT_WEATHER = {
  temp: 20, state: "Soleado", hum: 50, wind: 10,
  forecast: [
    { day: "Jue", temp: 22, state: "Soleado" },
    { day: "Vie", temp: 21, state: "Parcialmente nublado" },
    { day: "Sáb", temp: 23, state: "Soleado" }
  ]
};

export default function WeatherWidget({ data, onChange, isEditing }: WeatherWidgetProps) {
  const cities = data.cities || ["Buenos Aires", "Madrid", "Miami"];
  const activeCity = data.activeCity || cities[0] || "Madrid";
  const [newCity, setNewCity] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const getWeatherData = (cityName: string) => {
    const key = cityName.toLowerCase().trim();
    return MOCK_WEATHER_DATA[key] || {
      ...DEFAULT_WEATHER,
      // Introduce simple pseudo-random offsets based on city name characters
      temp: 15 + (cityName.length % 15)
    };
  };

  const handleAddCity = () => {
    if (!newCity.trim()) return;
    const formatted = newCity.trim();
    if (!cities.map((c) => c.toLowerCase()).includes(formatted.toLowerCase())) {
      const updated = [...cities, formatted];
      onChange({
        ...data,
        cities: updated,
        activeCity: formatted
      });
    }
    setNewCity("");
    setShowAdd(false);
  };

  const handleRemoveCity = (cityName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = cities.filter((c) => c.toLowerCase() !== cityName.toLowerCase());
    const nextActive = activeCity.toLowerCase() === cityName.toLowerCase() ? updated[0] || "" : activeCity;
    onChange({
      ...data,
      cities: updated,
      activeCity: nextActive
    });
  };

  const getWeatherIcon = (state: string) => {
    const s = state.toLowerCase();
    if (s.includes("sol") || s.includes("despejado")) {
      return <Sun className="w-8 h-8 text-amber-500 fill-amber-500/20" />;
    }
    if (s.includes("lluvia") || s.includes("llovizna")) {
      return <CloudRain className="w-8 h-8 text-sky-500" />;
    }
    if (s.includes("tormenta") || s.includes("rayos")) {
      return <CloudLightning className="w-8 h-8 text-violet-500 animate-pulse" />;
    }
    if (s.includes("nieva") || s.includes("nieve") || s.includes("fresco")) {
      return <CloudSnow className="w-8 h-8 text-sky-300" />;
    }
    return <Cloud className="w-8 h-8 text-slate-400 fill-slate-400/10" />;
  };

  const activeWeatherData = getWeatherData(activeCity);

  return (
    <div className="flex flex-col h-full justify-between p-4 text-[#1A1C1E]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Cloud className="w-4 h-4 text-sky-500" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-500 font-display">
            Comparador de Clima
          </span>
        </div>
        {isEditing && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="p-1 hover:bg-gray-100 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {showAdd ? (
        <div className="flex-1 flex flex-col justify-center space-y-3 py-2 text-xs text-gray-700">
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Buscar ciudad (ej: París, Tokio)"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCity()}
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs text-slate-900"
            />
            <button
              onClick={handleAddCity}
              className="px-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-semibold text-xs cursor-pointer"
            >
              Añadir
            </button>
          </div>
          <p className="text-[10px] text-slate-400">Introduce cualquier ciudad para ver sus condiciones simuladas.</p>
        </div>
      ) : (
        <div className="flex-grow grid grid-cols-5 gap-3 min-h-0 overflow-y-auto py-1">
          {/* Active city detail pane */}
          <div className="col-span-3 bg-gradient-to-br from-sky-50 to-indigo-50/50 rounded-2xl p-3 border border-sky-100/50 flex flex-col justify-between text-sky-950">
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1 pr-1">
                <h4 className="font-bold text-sm text-sky-950 tracking-tight leading-tight truncate">{activeCity}</h4>
                <p className="text-[10px] text-sky-800 font-semibold mt-0.5 capitalize">{activeWeatherData.state}</p>
              </div>
              <div className="flex-shrink-0">
                {getWeatherIcon(activeWeatherData.state)}
              </div>
            </div>

            <div className="my-2 flex items-baseline">
              <span className="text-3xl font-black tracking-tight text-sky-900">{activeWeatherData.temp}</span>
              <span className="text-sm font-bold text-sky-600 ml-0.5">°C</span>
            </div>

            <div className="grid grid-cols-2 gap-1 border-t border-sky-100 pt-2 text-[10px] text-sky-800">
              <div className="flex items-center space-x-1">
                <Droplets className="w-3 h-3 text-sky-500" />
                <span className="font-semibold">{activeWeatherData.hum}% Hum</span>
              </div>
              <div className="flex items-center space-x-1">
                <Wind className="w-3 h-3 text-teal-600" />
                <span className="font-semibold">{activeWeatherData.wind} km/h</span>
              </div>
            </div>
          </div>

          {/* Comparative cities list */}
          <div className="col-span-2 space-y-1.5 overflow-y-auto pr-0.5">
            {cities.map((city) => {
              const info = getWeatherData(city);
              const isActive = city.toLowerCase() === activeCity.toLowerCase();
              return (
                <div
                  key={city}
                  onClick={() => onChange({ ...data, activeCity: city })}
                  className={`px-2 py-1.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    isActive
                      ? "bg-sky-50 border-sky-200 text-sky-800 shadow-sm"
                      : "bg-gray-50 border-slate-100 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold truncate leading-tight">{city}</p>
                    <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{info.temp}°C</p>
                  </div>
                  {isEditing && (
                    <button
                      onClick={(e) => handleRemoveCity(city, e)}
                      className="p-0.5 text-red-500 hover:text-red-700 hover:bg-gray-100 rounded transition cursor-pointer ml-1"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
