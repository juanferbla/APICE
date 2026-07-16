import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Award, Clock, Sparkles, Zap, CheckCircle2, RefreshCw, Layers } from "lucide-react";
import { api } from "../utils/api";
import { FocusSession } from "../types";

interface StatsDashboardProps {
  sessions: FocusSession[];
}

const COLORS = ["#4f46e5", "#8b5cf6", "#0d9488", "#d97706", "#dc2626", "#475569"];
const PATTERN_COLORS = [
  "url(#pattern-stripes-blue)",
  "url(#pattern-stripes-purple)",
  "url(#pattern-stripes-teal)",
  "url(#pattern-stripes-amber)",
  "url(#pattern-stripes-red)",
  "url(#pattern-stripes-slate)"
];

export default function StatsDashboard({ sessions }: StatsDashboardProps) {
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [aiRating, setAiRating] = useState<string>("");

  // Aggregate stats
  const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);

  // Group by category (Trabajando, Creativo, etc.)
  const stateLabels: Record<string, string> = {
    trabajando: "Trabajando",
    creativo: "Creativo",
    reunion: "Reunión",
    llamada: "Llamada",
    distraido: "Distraído",
    off: "Tiempo Off"
  };

  const groupedData = Object.keys(stateLabels).map((stateKey, idx) => {
    const matching = sessions.filter((s) => s.activityState === stateKey);
    const secs = matching.reduce((sum, s) => sum + s.durationSeconds, 0);
    const hrs = Number((secs / 3600).toFixed(2));
    return {
      name: stateLabels[stateKey],
      horas: hrs,
      color: COLORS[idx % COLORS.length]
    };
  });

  const getAIAnalysis = async () => {
    setLoadingAI(true);
    try {
      const response = await api.analyzeProductivity();
      if (response) {
        setAiSummary(response.summary || "");
        setAiTips(response.tips || []);
        setAiRating(response.performanceRating || "");
      }
    } catch (err) {
      console.error(err);
      setAiSummary("No se pudo obtener el reporte automático en este momento. Registra tus estados de enfoque y completa tus hábitos para nutrir el modelo.");
      setAiTips([]);
      setAiRating("Modo Estándar");
    } finally {
      setLoadingAI(false);
    }
  };

  // Run initial AI summary once if empty and we have sessions
  useEffect(() => {
    if (sessions.length > 0 && !aiSummary) {
      getAIAnalysis();
    }
  }, [sessions]);

  // Average session length
  const avgSessionMin = sessions.length > 0
    ? Math.round((totalSeconds / sessions.length) / 60)
    : 0;

  // Compute daily streak of logged sessions
  const loggedDaysCount = new Set(sessions.map((s) => s.startTime.split("T")[0])).size;

  return (
    <div id="stats-dashboard-container" className="space-y-6">
      {/* Hidden SVG with Pattern Defs for Recharts Textured Bars */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <pattern id="pattern-stripes-blue" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="16" fill="#4f46e5" />
            <rect x="8" width="8" height="16" fill="#6366f1" />
          </pattern>
          <pattern id="pattern-stripes-purple" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="16" fill="#8b5cf6" />
            <rect x="8" width="8" height="16" fill="#a78bfa" />
          </pattern>
          <pattern id="pattern-stripes-teal" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="16" fill="#0d9488" />
            <rect x="8" width="8" height="16" fill="#2dd4bf" />
          </pattern>
          <pattern id="pattern-stripes-amber" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="16" fill="#d97706" />
            <rect x="8" width="8" height="16" fill="#fbbf24" />
          </pattern>
          <pattern id="pattern-stripes-red" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="16" fill="#dc2626" />
            <rect x="8" width="8" height="16" fill="#f87171" />
          </pattern>
          <pattern id="pattern-stripes-slate" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="16" fill="#475569" />
            <rect x="8" width="8" height="16" fill="#94a3b8" />
          </pattern>
        </defs>
      </svg>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E1E4E8] rounded-2xl p-4.5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Horas de Enfoque</span>
            <h3 className="text-2xl font-black text-gray-800 font-display">{totalHours} <span className="text-xs font-bold text-slate-500">hrs</span></h3>
          </div>
          <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E1E4E8] rounded-2xl p-4.5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Sesiones Logueadas</span>
            <h3 className="text-2xl font-black text-gray-800 font-display">{sessions.length} <span className="text-xs font-bold text-slate-500">ciclos</span></h3>
          </div>
          <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center text-purple-600 shadow-sm">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E1E4E8] rounded-2xl p-4.5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Promedio de Sesión</span>
            <h3 className="text-2xl font-black text-gray-800 font-display">{avgSessionMin} <span className="text-xs font-bold text-slate-500">min</span></h3>
          </div>
          <div className="w-10 h-10 bg-teal-50 border border-teal-100 rounded-xl flex items-center justify-center text-teal-600 shadow-sm">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-[#E1E4E8] rounded-2xl p-4.5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Días con Actividad</span>
            <h3 className="text-2xl font-black text-gray-800 font-display">{loggedDaysCount} <span className="text-xs font-bold text-slate-500">días</span></h3>
          </div>
          <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Gemini Report */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Graphical statistics */}
        <div className="lg:col-span-3 bg-white border border-[#E1E4E8] rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[340px]">
          <div>
            <h4 className="text-sm font-bold text-gray-800 tracking-tight leading-none mb-1 font-display">Distribución de Productividad</h4>
            <p className="text-[11px] text-slate-500 font-medium">Comparativa de horas de enfoque por categoría de actividades.</p>
          </div>

          <div className="h-60 mt-4 w-full">
            {sessions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 italic space-y-2">
                <Layers className="w-8 h-8 text-slate-400" />
                <span className="text-xs text-slate-500 font-semibold">No hay sesiones de enfoque logueadas para graficar. Cambia tu estado en el tracker.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupedData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", color: "#1e293b" }}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Bar dataKey="horas" radius={[4, 4, 0, 0]}>
                    {groupedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PATTERN_COLORS[index % PATTERN_COLORS.length]} stroke={entry.color} strokeWidth={1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gemini AI Strategic Advice */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50/40 to-indigo-100/10 border border-indigo-100 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <h4 className="text-sm font-bold text-indigo-900 tracking-tight font-display">Gemini Mentor de Productividad</h4>
              </div>
              <button
                onClick={getAIAnalysis}
                disabled={loadingAI}
                className="p-1.5 bg-white hover:bg-slate-50 rounded-xl border border-indigo-100 text-indigo-600 transition cursor-pointer shadow-sm"
                title="Actualizar reporte"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAI ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="text-xs text-slate-700 leading-relaxed font-medium space-y-3 whitespace-pre-wrap max-h-[240px] overflow-y-auto pr-1">
              {loadingAI ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[11px] text-indigo-800 font-bold animate-pulse">Analizando métricas y hábitos con Gemini AI...</p>
                </div>
              ) : aiSummary ? (
                <div className="space-y-3 text-[11px] text-slate-700 leading-relaxed">
                  <div className="bg-white border border-indigo-100/80 p-3.5 rounded-xl shadow-sm">
                    <p className="italic">"{aiSummary}"</p>
                  </div>
                  {aiTips.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="font-bold text-indigo-800 uppercase tracking-wider text-[9px]">Recomendaciones Senda:</p>
                      <ul className="space-y-1 list-disc pl-4 text-slate-600">
                        {aiTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  Completa y loguea algunas sesiones usando el selector de estado para que Gemini AI pueda darte sugerencias de optimización del tiempo.
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-indigo-100 pt-3.5 mt-3 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase">
            <span>Rendimiento: <strong className="text-emerald-600 font-black">{aiRating || "En Progreso"}</strong></span>
            <span className="text-indigo-600">Gemini 2.5 Flash</span>
          </div>
        </div>
      </div>
    </div>
  );
}
