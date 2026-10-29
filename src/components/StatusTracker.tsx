import React, { useState, useEffect, useRef } from "react";
import {
  User,
  ShieldAlert,
  Sparkles,
  Phone,
  Video,
  Code,
  Brain,
  Zap,
  Moon,
  Clock,
  Briefcase,
  GraduationCap,
  Gamepad2,
  Home,
} from "lucide-react";
import { api } from "../utils/api";

const ROLE_CONFIGS: Record<
  string,
  {
    roleName: string;
    description: string;
    icon: any;
    colorScheme: string;
    states: Array<{ value: string; label: string; icon: any; color: string }>;
  }
> = {
  personal: {
    roleName: "Desarrollo Personal",
    description: "Hábitos, Lectura & Crecimiento",
    icon: User,
    colorScheme: "border-indigo-200 dark:border-indigo-850 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400",
    states: [
      { value: "habits", label: "Hábitos", icon: Zap, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/60" },
      { value: "reading", label: "Lectura", icon: Brain, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/60" },
      { value: "planning", label: "Planificando", icon: Clock, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/60" },
      { value: "off", label: "Tiempo libre", icon: Moon, color: "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700" }
    ]
  },
  trabajo: {
    roleName: "Profesional / Laboral",
    description: "Proyectos, Reuniones & Clientes",
    icon: Briefcase,
    colorScheme: "border-blue-200 dark:border-blue-850 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400",
    states: [
      { value: "trabajando", label: "Trabajando", icon: Code, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/60" },
      { value: "reunion", label: "En Reunión", icon: Video, color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-900/60" },
      { value: "llamada", label: "En Llamada", icon: Phone, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/60" },
      { value: "distraido", label: "Distraído", icon: Zap, color: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border-red-100 dark:border-red-900/60" },
      { value: "off", label: "Tiempo libre", icon: Moon, color: "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700" }
    ]
  },
  estudio: {
    roleName: "Estudiante / Académico",
    description: "Cursos, Práctica & Aprendizaje",
    icon: GraduationCap,
    colorScheme: "border-violet-200 dark:border-violet-850 bg-violet-50/50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400",
    states: [
      { value: "estudiando", label: "Estudiando", icon: Brain, color: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-100 dark:border-violet-900/60" },
      { value: "practicando", label: "Práctica", icon: Code, color: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 border-pink-100 dark:border-pink-900/60" },
      { value: "lectura", label: "Lectura", icon: Clock, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/60" },
      { value: "off", label: "Tiempo libre", icon: Moon, color: "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700" }
    ]
  },
  hobbies: {
    roleName: "Recreación / Ocio",
    description: "Creación, Gaming & Relajación",
    icon: Gamepad2,
    colorScheme: "border-purple-200 dark:border-purple-850 bg-purple-50/50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400",
    states: [
      { value: "creando", label: "Creando", icon: Brain, color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-100 dark:border-purple-900/60" },
      { value: "gaming", label: "Gaming/Hobby", icon: Zap, color: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/40 border-pink-100 dark:border-pink-900/60" },
      { value: "off", label: "Tiempo libre", icon: Moon, color: "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700" }
    ]
  },
  hogar: {
    roleName: "Administrador del Hogar",
    description: "Tareas, Compras & Cocina",
    icon: Home,
    colorScheme: "border-emerald-200 dark:border-emerald-850 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400",
    states: [
      { value: "tareas_hogar", label: "Tareas Hogar", icon: Zap, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/60" },
      { value: "cocinando", label: "Cocinando", icon: Brain, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/60" },
      { value: "off", label: "Tiempo libre", icon: Moon, color: "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700" }
    ]
  }
};

interface StatusTrackerProps {
  activeDashboardId: string;
  onSessionLogged: () => void;
}

export default function StatusTracker({ activeDashboardId, onSessionLogged }: StatusTrackerProps) {
  const [activeState, setActiveState] = useState("off");
  const [sessionStartTime, setSessionStartTime] = useState<string | null>(null);
  const [secondsCounter, setSecondsCounter] = useState(0);

  const counterInterval = useRef<NodeJS.Timeout | null>(null);

  const currentRoleConfig = ROLE_CONFIGS[activeDashboardId] || ROLE_CONFIGS.personal;

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (counterInterval.current) clearInterval(counterInterval.current);
    };
  }, []);

  // Save current active session and reset to "off" if the user switches active dashboard (roles)
  useEffect(() => {
    if (activeState !== "off") {
      handleStateChange("off");
    }
  }, [activeDashboardId]);

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

  const currentConfig = currentRoleConfig.states.find((s) => s.value === activeState) || currentRoleConfig.states[currentRoleConfig.states.length - 1];
  const RoleIcon = currentRoleConfig.icon;

  return (
    <div id="status-tracker-container" className="bg-white dark:bg-slate-900 border border-[#E1E4E8] dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm transition-colors duration-200">
      <div className="flex items-center space-x-3.5 min-w-0">
        <div className={`p-2.5 rounded-xl border flex items-center justify-center transition-all duration-300 ${currentConfig.color}`}>
          <currentConfig.icon className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <RoleIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Rol: {currentRoleConfig.roleName}
            </span>
          </div>
          <div className="flex items-center space-x-2.5 mt-0.5 min-w-0">
            <span className="text-sm font-black text-gray-800 dark:text-slate-100 truncate">
              {activeState === "off" ? "Tiempo libre" : currentConfig.label}
            </span>
            {activeState !== "off" && (
              <span className="font-mono text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-900/60 tracking-wider">
                {formatCounter(secondsCounter)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* States Grid Selector for current Role */}
      <div className="flex flex-wrap gap-1.5 items-center justify-end">
        {currentRoleConfig.states.map((st) => {
          const Icon = st.icon;
          const isActive = activeState === st.value;
          return (
            <button
              key={st.value}
              onClick={() => handleStateChange(st.value)}
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 transition text-xs font-bold cursor-pointer ${
                isActive
                  ? "bg-indigo-600 border-indigo-500 dark:border-indigo-400 text-white shadow-sm"
                  : "bg-gray-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white"
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
