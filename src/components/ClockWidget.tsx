import React, { useState, useEffect } from "react";
import { 
  Clock, Globe, Hourglass, Settings, Plus, Trash2, CalendarDays, 
  ChevronRight, Sparkles, Check, CheckCircle2, Sliders, Calendar,
  HelpCircle, Trash, Info, Music, Youtube, Play, Pause, ExternalLink, Volume2
} from "lucide-react";

interface ClockWidgetProps {
  data: {
    showSeconds?: boolean;
    countdownDate?: string;
    countdownLabel?: string;
    clocks?: { label: string; timezone: string }[];
    countdowns?: { id: string; label: string; date: string }[];
    youtubeVideoId?: string;
    youtubeVideoUrl?: string;
    musicPresetId?: string;
    isPlayingMusic?: boolean;
    showVideo?: boolean;
  };
  onChange: (newData: any) => void;
  isEditing: boolean;
}

const TIMEZONE_PRESETS = [
  { name: "Local (Tu sistema)", value: "local" },
  { name: "UTC (Tiempo Universal)", value: "UTC" },
  { name: "Londres", value: "Europe/London" },
  { name: "Madrid / París", value: "Europe/Madrid" },
  { name: "Nueva York", value: "America/New_York" },
  { name: "Buenos Aires", value: "America/Argentina/Buenos_Aires" },
  { name: "Ciudad de México", value: "America/Mexico_City" },
  { name: "Bogotá / Lima", value: "America/Bogota" },
  { name: "Santiago de Chile", value: "America/Santiago" },
  { name: "Sídney", value: "Australia/Sydney" },
  { name: "Tokio", value: "Asia/Tokyo" },
  { name: "⏰ [Otro] Zona o Offset Manual...", value: "custom" }
];

const MUSIC_PRESETS = [
  { id: "lofi", label: "Lofi Focus ☕", videoId: "jfKfPfyJRdk", url: "https://www.youtube.com/watch?v=jfKfPfyJRdk" },
  { id: "rain", label: "Lluvia & Café 🌧️", videoId: "mPZkdNFkNps", url: "https://www.youtube.com/watch?v=mPZkdNFkNps" },
  { id: "synth", label: "Synthwave Beat 🌌", videoId: "4xDzrJKXOOY", url: "https://www.youtube.com/watch?v=4xDzrJKXOOY" },
  { id: "nature", label: "Bosque Zen 🌲", videoId: "M0AWBn_bS0U", url: "https://www.youtube.com/watch?v=M0AWBn_bS0U" },
  { id: "jazz", label: "Café Jazz 🎷", videoId: "5wSBy6Yq_A8", url: "https://www.youtube.com/watch?v=5wSBy6Yq_A8" },
  { id: "piano", label: "Piano Suave 🎹", videoId: "Dx5qFedd3Y4", url: "https://www.youtube.com/watch?v=Dx5qFedd3Y4" }
];

const extractYoutubeId = (url: string) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  return (match && match[2].length === 11) ? match[2] : "";
};

export default function ClockWidget({ data, onChange, isEditing }: ClockWidgetProps) {
  const [time, setTime] = useState(new Date());
  const [showConfig, setShowConfig] = useState(false);
  const [activeTab, setActiveTab] = useState<"world" | "countdown" | "music">("world");
  const [configTab, setConfigTab] = useState<"general" | "clocks" | "countdowns">("general");

  // New clock input states
  const [newClockLabel, setNewClockLabel] = useState("");
  const [newClockZone, setNewClockZone] = useState("Europe/Madrid");
  const [customZoneValue, setCustomZoneValue] = useState("");

  // New countdown input states
  const [newCdLabel, setNewCdLabel] = useState("");
  const [newCdDate, setNewCdDate] = useState("");

  // Music focus states
  const [customYoutubeInput, setCustomYoutubeInput] = useState(data.youtubeVideoUrl || "");
  const [inputError, setInputError] = useState(false);

  const youtubeVideoId = data.youtubeVideoId || "jfKfPfyJRdk";
  const youtubeVideoUrl = data.youtubeVideoUrl || "https://www.youtube.com/watch?v=jfKfPfyJRdk";
  const musicPresetId = data.musicPresetId || "lofi";
  const isPlayingMusic = data.isPlayingMusic || false;
  const showVideo = data.showVideo !== false;

  const clocks = data.clocks || [{ label: "Local", timezone: "local" }];
  const showSeconds = data.showSeconds !== false;

  // Retrieve countdowns list with backward compatibility with legacy single countdown fields
  const getCountdownsList = (): { id: string; label: string; date: string }[] => {
    const list = data.countdowns || [];
    const final_list = [...list];
    if (data.countdownDate && !list.some(c => c.date === data.countdownDate)) {
      final_list.unshift({
        id: "legacy",
        label: data.countdownLabel || "Meta Principal",
        date: data.countdownDate
      });
    }
    return final_list;
  };

  const finalCountdowns = getCountdownsList();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Highly robust timezone formatting parser
  const getOffsetTime = (date: Date, tz: string, secondsEnabled: boolean) => {
    if (!tz || tz.trim().toLowerCase() === "local") {
      return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: secondsEnabled ? "2-digit" : undefined,
        hour12: false
      });
    }

    const cleanTz = tz.trim();

    // 1. Try native IANA lookup (e.g. America/Bogota, Europe/Paris)
    try {
      return date.toLocaleTimeString(undefined, {
        timeZone: cleanTz,
        hour: "2-digit",
        minute: "2-digit",
        second: secondsEnabled ? "2-digit" : undefined,
        hour12: false
      });
    } catch (err) {
      // 2. Try parsing manual timezone offset values
      // Patterns matched: UTC+5, GMT-3, +05:30, -08:00, +5, -3, +5.5
      try {
        const match = cleanTz.match(/^(?:UTC|GMT)?([+-])(\d{1,2})(?::?(\d{2}))?$/i) || cleanTz.match(/^([+-])(\d{1,2})(?:\.(\d+))?$/);
        if (match) {
          const sign = match[1] === "+" ? 1 : -1;
          const hours = parseFloat(match[2]);
          const minsStr = match[3] || "0";
          let minutes = 0;
          if (minsStr.length === 1 && cleanTz.includes(".")) {
            minutes = parseFloat("0." + minsStr) * 60;
          } else {
            minutes = parseInt(minsStr, 10);
          }

          const offsetMs = (hours * 60 + minutes) * 60 * 1000 * sign;
          const utc = date.getTime() + date.getTimezoneOffset() * 60000;
          const targetTime = new Date(utc + offsetMs);

          return targetTime.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: secondsEnabled ? "2-digit" : undefined,
            hour12: false
          });
        }

        // 3. Raw number input check (e.g. 5, -8, +2)
        const num = parseFloat(cleanTz);
        if (!isNaN(num) && num >= -12 && num <= 14) {
          const sign = num >= 0 ? 1 : -1;
          const absNum = Math.abs(num);
          const hours = Math.floor(absNum);
          const minutes = (absNum - hours) * 60;

          const offsetMs = (hours * 60 + minutes) * 60 * 1000 * sign;
          const utc = date.getTime() + date.getTimezoneOffset() * 60000;
          const targetTime = new Date(utc + offsetMs);

          return targetTime.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: secondsEnabled ? "2-digit" : undefined,
            hour12: false
          });
        }
      } catch (e) {
        // Fall back to showing label
      }
    }

    return "No válido";
  };

  const getCountdownDetails = (targetDateStr: string) => {
    if (!targetDateStr) return { text: "Sin fecha", expired: false };
    const target = new Date(targetDateStr);
    const diff = target.getTime() - time.getTime();
    if (isNaN(diff)) {
      return { text: "Error fecha", expired: false };
    }
    if (diff <= 0) {
      return { text: "¡Llegó el momento!", expired: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    return { text: parts.join(" "), expired: false };
  };

  // World Clocks action handlers
  const handleAddClock = () => {
    if (!newClockLabel.trim()) return;
    const zoneToSave = newClockZone === "custom" ? customZoneValue.trim() : newClockZone;
    if (!zoneToSave) return;

    const updatedClocks = [...clocks, { label: newClockLabel.trim(), timezone: zoneToSave }];
    onChange({ ...data, clocks: updatedClocks });
    setNewClockLabel("");
    setCustomZoneValue("");
  };

  const handleRemoveClock = (index: number) => {
    const updatedClocks = clocks.filter((_, i) => i !== index);
    onChange({ ...data, clocks: updatedClocks });
  };

  // Multiple countdowns action handlers
  const handleAddCountdown = () => {
    if (!newCdLabel.trim() || !newCdDate) return;
    const newId = Math.random().toString(36).substring(2, 9);
    const updatedCountdowns = [...finalCountdowns, { id: newId, label: newCdLabel.trim(), date: newCdDate }];

    onChange({
      ...data,
      countdowns: updatedCountdowns,
      countdownDate: "", // migrate legacy single countdown properties
      countdownLabel: ""
    });
    setNewCdLabel("");
    setNewCdDate("");
  };

  const handleRemoveCountdown = (id: string, index: number) => {
    const updated = finalCountdowns.filter((cd, idx) => cd.id ? cd.id !== id : idx !== index);
    onChange({
      ...data,
      countdowns: updated,
      countdownDate: "",
      countdownLabel: ""
    });
  };

  // Music Action Handlers
  const handleTogglePlay = () => {
    onChange({
      ...data,
      isPlayingMusic: !isPlayingMusic
    });
  };

  const handleToggleVideo = () => {
    onChange({
      ...data,
      showVideo: !showVideo
    });
  };

  const handleSelectPreset = (preset: typeof MUSIC_PRESETS[0]) => {
    onChange({
      ...data,
      youtubeVideoId: preset.videoId,
      youtubeVideoUrl: preset.url,
      musicPresetId: preset.id,
      isPlayingMusic: true
    });
    setCustomYoutubeInput(preset.url);
    setInputError(false);
  };

  const handleLoadCustomVideo = () => {
    const extractedId = extractYoutubeId(customYoutubeInput);
    if (extractedId) {
      onChange({
        ...data,
        youtubeVideoId: extractedId,
        youtubeVideoUrl: customYoutubeInput,
        musicPresetId: "custom",
        isPlayingMusic: true
      });
      setInputError(false);
    } else {
      setInputError(true);
    }
  };

  const renderYoutubePlayer = () => {
    if (!isPlayingMusic || !youtubeVideoId) return null;

    const iframeSrc = `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=0&loop=1&playlist=${youtubeVideoId}&controls=1&showinfo=0&rel=0`;

    if (activeTab === "music" && showVideo) {
      return (
        <div className="w-full aspect-video rounded-xl overflow-hidden border border-slate-100 shadow-inner bg-black mb-2 mt-2 shrink-0">
          <iframe
            src={iframeSrc}
            title="Focus Music Stream"
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    // Background mode (invisible player)
    return (
      <div style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, overflow: "hidden", pointerEvents: "none", zIndex: -50 }}>
        <iframe
          src={iframeSrc}
          title="Focus Music Background Stream"
          width="1"
          height="1"
          className="border-0"
          allow="accelerometer; autoplay; encrypted-media"
        />
      </div>
    );
  };

  const localTimeStr = time.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: false
  });

  const localDateStr = time.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short"
  });

  return (
    <div className="flex flex-col h-full justify-between p-4 text-slate-800 select-none bg-white">
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-500 font-sans">
            Reloj Digital & Tiempos
          </span>
        </div>
        {isEditing && (
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              showConfig 
                ? "bg-indigo-50 text-indigo-600 border border-indigo-100" 
                : "hover:bg-slate-50 text-slate-400 hover:text-slate-600"
            }`}
            title="Configuración"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>

      {showConfig ? (
        /* Configuration Panel */
        <div className="flex-1 flex flex-col justify-between min-h-0 text-xs">
          {/* Config Sub-Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5 mb-2.5 flex-shrink-0">
            <button
              onClick={() => setConfigTab("general")}
              className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                configTab === "general" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              General
            </button>
            <button
              onClick={() => setConfigTab("clocks")}
              className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                configTab === "clocks" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Relojes ({clocks.length})
            </button>
            <button
              onClick={() => setConfigTab("countdowns")}
              className={`flex-1 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                configTab === "countdowns" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Cuentas ({finalCountdowns.length})
            </button>
          </div>

          <div className="flex-grow overflow-y-auto pr-1 max-h-[220px] min-h-0">
            {configTab === "general" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 text-[11px]">Mostrar Segundos</span>
                  <input
                    type="checkbox"
                    checked={showSeconds}
                    onChange={(e) => onChange({ ...data, showSeconds: e.target.checked })}
                    className="accent-indigo-500 w-4 h-4 cursor-pointer"
                  />
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed font-semibold bg-indigo-50/30 p-2.5 rounded-xl border border-indigo-50/50">
                  <div className="flex items-center space-x-1.5 mb-1 text-indigo-700 font-bold">
                    <Info className="w-3.5 h-3.5" />
                    <span>Diseño Responsivo Desktop</span>
                  </div>
                  Este componente se organiza dinámicamente en pestañas claras para evitar que la información y las etiquetas de texto se corten o encimen en pantallas reducidas.
                </div>
              </div>
            )}

            {configTab === "clocks" && (
              <div className="space-y-3">
                {/* Active Clocks List */}
                <div className="space-y-1 max-h-[85px] overflow-y-auto">
                  {clocks.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                      <div className="min-w-0">
                        <span className="font-bold text-[10px] text-slate-700 block truncate">{c.label}</span>
                        <span className="text-[8px] text-slate-400 font-bold block truncate">
                          {c.timezone === "local" ? "Hora del Sistema" : c.timezone}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveClock(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Clock Form */}
                <div className="bg-slate-50 p-2.5 border border-slate-100 rounded-xl space-y-1.5">
                  <div className="flex gap-1">
                    <input
                      type="text"
                      placeholder="Etiqueta (ej: Londres, Servidores)"
                      value={newClockLabel}
                      onChange={(e) => setNewClockLabel(e.target.value)}
                      className="w-1/2 px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[10px] font-bold focus:border-indigo-500"
                    />
                    <select
                      value={newClockZone}
                      onChange={(e) => setNewClockZone(e.target.value)}
                      className="w-1/2 bg-white border border-slate-200 rounded-lg text-[10px] outline-none px-1 py-1.5 font-bold cursor-pointer"
                    >
                      {TIMEZONE_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value}>
                          {preset.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {newClockZone === "custom" && (
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="Huso IANA (America/Lima) o Offset (UTC-5, +5.5)"
                        value={customZoneValue}
                        onChange={(e) => setCustomZoneValue(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none text-[10px] font-mono focus:border-indigo-500"
                      />
                      <div className="flex justify-between text-[8px] text-indigo-600 font-bold px-1">
                        <span>Previsualización:</span>
                        <span className="font-mono">
                          {getOffsetTime(time, customZoneValue || "local", showSeconds)}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleAddClock}
                    className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition text-[10px] cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Añadir Reloj de Zona</span>
                  </button>
                </div>
              </div>
            )}

            {configTab === "countdowns" && (
              <div className="space-y-3">
                {/* Active Countdowns List */}
                <div className="space-y-1 max-h-[85px] overflow-y-auto">
                  {finalCountdowns.map((cd, idx) => (
                    <div key={cd.id || idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                      <div className="min-w-0">
                        <span className="font-bold text-[10px] text-slate-700 block truncate">{cd.label}</span>
                        <span className="text-[8px] text-slate-400 font-bold block">
                          {new Date(cd.date).toLocaleDateString()} {new Date(cd.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveCountdown(cd.id, idx)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Countdown Form */}
                <div className="bg-slate-50 p-2.5 border border-slate-100 rounded-xl space-y-1.5">
                  <input
                    type="text"
                    placeholder="Etiqueta de la cuenta (ej: Hito Q3, Fin de Proyecto)"
                    value={newCdLabel}
                    onChange={(e) => setNewCdLabel(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[10px] font-bold focus:border-indigo-500"
                  />
                  <input
                    type="datetime-local"
                    value={newCdDate}
                    onChange={(e) => setNewCdDate(e.target.value)}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg outline-none text-[10px] font-bold focus:border-indigo-500 cursor-pointer"
                  />
                  <button
                    onClick={handleAddCountdown}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition text-[10px] cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Añadir Cuenta Regresiva</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setShowConfig(false)}
            className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 font-bold rounded-xl text-white transition text-[10px] cursor-pointer flex-shrink-0 mt-2"
          >
            Listo, volver al Reloj
          </button>
        </div>
      ) : (
        /* Standard Dashboard View */
        <div className="flex-1 flex flex-col justify-between min-h-0">
          {/* Main Digital Clock Card */}
          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-3.5 text-center flex flex-col items-center justify-center shadow-inner relative overflow-hidden group mb-2">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-emerald-500/5 opacity-40 pointer-events-none" />
            <span className="font-mono text-3xl font-black tracking-tight text-slate-800 drop-shadow-sm select-all z-10">
              {localTimeStr}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 z-10 flex items-center space-x-1.5">
              <CalendarDays className="w-3 h-3 text-indigo-500" />
              <span>{localDateStr}</span>
            </span>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl gap-0.5 flex-shrink-0">
            <button
              onClick={() => setActiveTab("world")}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                activeTab === "world"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="Horas Mundo"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Relojes ({clocks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("countdown")}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                activeTab === "countdown"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="Cuentas Regresivas"
            >
              <Hourglass className="w-3.5 h-3.5" />
              <span>Cuentas ({finalCountdowns.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("music")}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center justify-center space-x-1 cursor-pointer ${
                activeTab === "music"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="Música Focus"
            >
              <Music className="w-3.5 h-3.5 text-indigo-500" />
              <span>Música</span>
            </button>
          </div>

          {/* Dynamic lists container with scrolling to ensure no cut-offs */}
          <div className="flex-grow overflow-y-auto pr-0.5 mt-2 max-h-[220px] min-h-[100px]">
            {activeTab === "world" && (
              <div className="space-y-1.5">
                {clocks.map((c, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50/50 px-2.5 py-1.5 border border-slate-100 rounded-xl hover:shadow-sm hover:bg-slate-50 transition duration-150">
                    <div className="flex flex-col min-w-0 mr-2">
                      <span className="text-[10px] font-bold text-slate-700 truncate">{c.label}</span>
                      <span className="text-[8px] text-slate-400 font-semibold truncate">
                        {c.timezone === "local" ? "Hora Local" : c.timezone}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg shrink-0">
                      {getOffsetTime(time, c.timezone, showSeconds)}
                    </span>
                  </div>
                ))}
                {clocks.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-[10px] font-semibold">
                    No hay relojes de zona configurados.
                  </div>
                )}
              </div>
            )}

            {activeTab === "countdown" && (
              <div className="space-y-1.5">
                {finalCountdowns.map((cd, idx) => {
                  const { text, expired } = getCountdownDetails(cd.date);
                  return (
                    <div 
                      key={cd.id || idx} 
                      className={`px-2.5 py-1.5 border rounded-xl hover:shadow-sm transition duration-150 flex items-center justify-between min-w-0 ${
                        expired 
                          ? "bg-emerald-50/70 border-emerald-100/80 text-emerald-800" 
                          : "bg-indigo-50/50 border-indigo-100/60 text-indigo-900"
                      }`}
                    >
                      <div className="flex flex-col min-w-0 mr-2">
                        <span className="text-[10px] font-black truncate">{cd.label}</span>
                        <span className="text-[8px] text-slate-400 font-semibold">
                          {new Date(cd.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-lg shrink-0 ${
                        expired ? "bg-emerald-100 text-emerald-900" : "bg-indigo-100 text-indigo-950"
                      }`}>
                        {text}
                      </span>
                    </div>
                  );
                })}
                {finalCountdowns.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-[10px] font-semibold">
                    No hay cuentas regresivas configuradas.
                  </div>
                )}
              </div>
            )}

            {activeTab === "music" && (
              <div className="space-y-3">
                {/* Play/Pause & Options */}
                <div className="flex items-center justify-between bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-2 min-w-0">
                    <button
                      onClick={handleTogglePlay}
                      className={`p-2 rounded-xl transition cursor-pointer shrink-0 ${
                        isPlayingMusic
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                      title={isPlayingMusic ? "Pausar música" : "Reproducir música"}
                    >
                      {isPlayingMusic ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    </button>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[10px] font-bold text-slate-700">
                        {isPlayingMusic ? "Música Activa 🎵" : "Música Pausada 🔇"}
                      </span>
                      <span className="text-[8px] text-slate-400 font-bold truncate max-w-[110px]">
                        {musicPresetId === "custom" ? "Video personalizado" : MUSIC_PRESETS.find(p => p.id === musicPresetId)?.label || "Focus Lofi"}
                      </span>
                    </div>
                  </div>

                  <label className="flex items-center space-x-1.5 cursor-pointer text-[10px] font-bold text-slate-600 shrink-0">
                    <input
                      type="checkbox"
                      checked={showVideo}
                      onChange={handleToggleVideo}
                      className="accent-indigo-500 rounded cursor-pointer"
                    />
                    <span>Ver Video</span>
                  </label>
                </div>

                {/* Video Container (renders only inside the tab if active and checked) */}
                {renderYoutubePlayer()}

                {/* Quick Presets Grid */}
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                    Canales de Enfoque Rápido
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    {MUSIC_PRESETS.map((preset) => {
                      const isSelected = musicPresetId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          onClick={() => handleSelectPreset(preset)}
                          className={`px-2 py-1.5 rounded-lg border text-[9px] font-bold text-left truncate transition cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-sm"
                              : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200"
                          }`}
                        >
                          <span className="truncate">{preset.label}</span>
                          {isSelected && isPlayingMusic && (
                            <span className="flex space-x-0.5 items-end h-2.5 shrink-0 ml-1">
                              <span className="w-0.5 bg-indigo-500 animate-[bounce_1s_infinite_100ms] h-full" />
                              <span className="w-0.5 bg-indigo-500 animate-[bounce_1s_infinite_300ms] h-2/3" />
                              <span className="w-0.5 bg-indigo-500 animate-[bounce_1s_infinite_200ms] h-4/5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom URL Input */}
                <div className="space-y-1">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                    Reproducir cualquier video de YouTube
                  </span>
                  <div className="flex gap-1">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="Link o ID (ej: jfKfPfyJRdk)..."
                        value={customYoutubeInput}
                        onChange={(e) => {
                          setCustomYoutubeInput(e.target.value);
                          setInputError(false);
                        }}
                        className={`w-full pl-2 pr-6 py-1 bg-white border rounded-lg outline-none text-[9px] font-medium focus:border-indigo-500 ${
                          inputError ? "border-red-400 focus:border-red-500" : "border-slate-200"
                        }`}
                      />
                      {customYoutubeInput && (
                        <button
                          onClick={() => setCustomYoutubeInput("")}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <button
                      onClick={handleLoadCustomVideo}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition text-[9px] cursor-pointer flex items-center space-x-1 shrink-0"
                    >
                      <Youtube className="w-3 h-3 text-red-400 fill-current" />
                      <span>Cargar</span>
                    </button>
                  </div>
                  {inputError && (
                    <span className="text-[8px] font-bold text-red-500 block leading-tight">
                      URL inválida. Ingresa un link completo o ID de 11 letras.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Background YouTube stream player (handles continuous playback when not viewing the music tab) */}
      {activeTab !== "music" && renderYoutubePlayer()}
    </div>
  );
}
