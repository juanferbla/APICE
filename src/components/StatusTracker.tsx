import React, { useState, useEffect, useRef } from "react";
import { User, ShieldAlert, Sparkles, Phone, Video, Code, Brain, Zap, Moon, Clock, Play, Pause } from "lucide-react";
import { api } from "../utils/api";

const STATES = [
  { value: "trabajando", label: "Trabajando", icon: Code, color: "text-blue-600 bg-blue-50 border-blue-100" },
  { value: "creativo", label: "Creativo", icon: Brain, color: "text-purple-600 bg-purple-50 border-purple-100" },
  { value: "reunion", label: "En Reunión", icon: Video, color: "text-teal-600 bg-teal-50 border-teal-100" },
  { value: "llamada", label: "En Llamada", icon: Phone, color: "text-amber-600 bg-amber-50 border-amber-100" },
  { value: "distraido", label: "Distraído", icon: Zap, color: "text-red-600 bg-red-50 border-red-100" },
  { value: "off", label: "Tiempo Off", icon: Moon, color: "text-slate-500 bg-slate-50 border-slate-100" }
];

interface StatusTrackerProps {
  onSessionLogged: () => void;
}

export default function StatusTracker({ onSessionLogged }: StatusTrackerProps) {
  const [activeState, setActiveState] = useState("off");
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [secondsCounter, setSecondsCounter] = useState(0);

  const counterInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (counterInterval.current) clearInterval(counterInterval.current);
    };
  }, []);

  const handleStateChange = async (newState: string) => {
    const now = new Date().toISOString();

    // If there was an active focus session, log it to the database
    if (sessionStartTime && secondsCounter > 0 && activeState !== "off") {
      try {
        await api.saveFocusSession({
          startTime: sessionStartTime,
          endTime: now,
          activityState: activeState,
          durationSeconds: secondsCounter
        });
        onSessionLogged();
      } catch (err) {
        console.error("Failed to log focus session:", err);
      }
    }

    // Set new active focus state
    setActiveState(newState);
    setSessionStartTime(now);
    setSecondsCounter(0);

    // Setup counter ticker
    if (counterInterval.current) {
      clearInterval(counterInterval.current);
    }

    if (newState !== "off") {
      counterInterval.current = setInterval(() => {
        setSecondsCounter((prev) => prev + 1);
      }, 1000);
    }
  };

  const formatCounter = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const currentConfig = STATES.find((s) => s.value === activeState) || STATES[5];

  return (
    <div id="status-tracker-container" className="bg-white border border-[#E1E4E8] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center space-x-3.5 min-w-0">
        <div className={`p-2 rounded-xl border flex items-center justify-center transition-all duration-300 ${currentConfig.color}`}>
          <currentConfig.icon className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs text-slate-500 font-bold tracking-wide uppercase">Estado de Enfoque Activo</h4>
          <div className="flex items-center space-x-2.5 mt-1 min-w-0">
            <span className="text-sm font-black text-gray-800 truncate">{currentConfig.label}</span>
            {activeState !== "off" && (
              <span className="font-mono text-[11px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded border border-indigo-100 tracking-wider">
                {formatCounter(secondsCounter)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* States Grid Selector */}
      <div className="flex flex-wrap gap-1.5 items-center justify-end">
        {STATES.map((st) => {
          const Icon = st.icon;
          const isActive = activeState === st.value;
          return (
            <button
              key={st.value}
              onClick={() => handleStateChange(st.value)}
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 transition text-xs font-bold cursor-pointer ${
                isActive
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                  : "bg-gray-50 border-slate-200 hover:bg-gray-100 text-gray-700 hover:text-gray-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{st.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
