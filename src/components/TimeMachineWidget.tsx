import React, { useState, useEffect, useRef } from "react";
import {
  Timer,
  Clock,
  Hourglass,
  Music,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Edit2,
  Pencil,
  X,
  Settings,
  Check,
  Globe,
  Sparkles,
  Zap,
  Coffee,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sliders,
  Calendar,
  Flame,
  Radio,
  Music2,
  AlertCircle
} from "lucide-react";

export interface MusicStation {
  id: string;
  label: string;
  videoId: string;
  url?: string;
  desc?: string;
}

export interface TimeMachineData {
  // Navigation
  activeTab?: "pomodoro" | "clock" | "countdown" | "music";
  
  // Pomodoro
  workTime?: number;
  shortBreak?: number;
  longBreak?: number;
  phase?: "work" | "short" | "long";
  autoStartBreaks?: boolean;
  
  // Clock & Timezones
  showSeconds?: boolean;
  is24Hour?: boolean;
  clocks?: { label: string; timezone: string }[];
  
  // Countdowns
  countdowns?: { id: string; label: string; date: string; icon?: string }[];
  
  // Music & Ambient Audio
  musicStations?: MusicStation[];
  musicPresetId?: string;
  youtubeVideoId?: string;
  youtubeVideoUrl?: string;
  isPlayingMusic?: boolean;
  showVideo?: boolean;
  ambientSound?: "none" | "rain" | "waves" | "forest" | "white";
  ambientVolume?: number;
}

interface TimeMachineWidgetProps {
  data?: TimeMachineData;
  onChange: (newData: TimeMachineData) => void;
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
  { name: "⏰ [Otro] Zona u Offset Manual...", value: "custom" }
];

const DEFAULT_MUSIC_STATIONS: MusicStation[] = [
  { id: "lofi", label: "Lofi Focus ☕", videoId: "jfKfPfyJRdk", url: "https://www.youtube.com/watch?v=jfKfPfyJRdk", desc: "Beats relajantes sin letra" },
  { id: "rain", label: "Lluvia & Café 🌧️", videoId: "mPZkdNFkNps", url: "https://www.youtube.com/watch?v=mPZkdNFkNps", desc: "Sonido de lluvia suave con jazz" },
  { id: "synth", label: "Synthwave Beat 🌌", videoId: "4xDzrJKXOOY", url: "https://www.youtube.com/watch?v=4xDzrJKXOOY", desc: "Ritmo electrónico retro" },
  { id: "nature", label: "Bosque Zen 🌲", videoId: "M0AWBn_bS0U", url: "https://www.youtube.com/watch?v=M0AWBn_bS0U", desc: "Naturaleza y arroyos de agua" },
  { id: "jazz", label: "Café Jazz 🎷", videoId: "5wSBy6Yq_A8", url: "https://www.youtube.com/watch?v=5wSBy6Yq_A8", desc: "Jazz acústico de fondo" },
  { id: "piano", label: "Piano Suave 🎹", videoId: "Dx5qFedd3Y4", url: "https://www.youtube.com/watch?v=Dx5qFedd3Y4", desc: "Melodías en piano pacíficas" }
];

const EXTRACT_YOUTUBE_ID = (url: string) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  return match && match[2].length === 11 ? match[2] : "";
};

export default function TimeMachineWidget({ data = {}, onChange, isEditing }: TimeMachineWidgetProps) {
  // Active Tab
  const [activeTab, setActiveTab] = useState<"pomodoro" | "clock" | "countdown" | "music">(
    data.activeTab || "pomodoro"
  );
  const [showConfig, setShowConfig] = useState(false);

  // Live Current Clock Time
  const [now, setNow] = useState(new Date());

  // Pomodoro Timer State
  const workTime = data.workTime || 25;
  const shortBreak = data.shortBreak || 5;
  const longBreak = data.longBreak || 15;
  const [phase, setPhase] = useState<"work" | "short" | "long">(data.phase || "work");
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(workTime * 60);
  const pomodoroInterval = useRef<NodeJS.Timeout | null>(null);

  // Sound Synth Generator Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ambientNodeRef = useRef<AudioNode | null>(null);

  // Clocks Data
  const showSeconds = data.showSeconds !== false;
  const is24Hour = data.is24Hour !== false;
  const clocks = data.clocks && data.clocks.length > 0 ? data.clocks : [
    { label: "Local", timezone: "local" },
    { label: "Madrid", timezone: "Europe/Madrid" },
    { label: "New York", timezone: "America/New_York" }
  ];

  // Countdowns Data
  const countdowns = data.countdowns && data.countdowns.length > 0 ? data.countdowns : [
    { id: "cd-1", label: "Fin de Año 2026", date: "2026-12-31T23:59:59", icon: "✨" },
    { id: "cd-2", label: "Próxima Meta Clave", date: "2026-09-30T18:00:00", icon: "🎯" }
  ];

  // Music Stations Data & State
  const musicStations: MusicStation[] = data.musicStations && data.musicStations.length > 0
    ? data.musicStations
    : DEFAULT_MUSIC_STATIONS;

  const musicPresetId = data.musicPresetId || (musicStations[0]?.id || "lofi");
  const youtubeVideoId = data.youtubeVideoId || (musicStations[0]?.videoId || "jfKfPfyJRdk");
  const isPlayingMusic = data.isPlayingMusic || false;
  const showVideo = data.showVideo || false;
  const ambientSound = data.ambientSound || "none";
  const [ambientVolume, setAmbientVolume] = useState(data.ambientVolume ?? 0.5);

  // Station Management Modal / Form State
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [stationToEdit, setStationToEdit] = useState<MusicStation | null>(null);
  const [stationFormTitle, setStationFormTitle] = useState("");
  const [stationFormUrl, setStationFormUrl] = useState("");
  const [stationFormDesc, setStationFormDesc] = useState("");
  const [stationFormError, setStationFormError] = useState("");

  // Sub-Form inputs
  const [newClockLabel, setNewClockLabel] = useState("");
  const [newClockZone, setNewClockZone] = useState("Europe/Madrid");
  const [customZoneValue, setCustomZoneValue] = useState("");

  const [newCdLabel, setNewCdLabel] = useState("");
  const [newCdDate, setNewCdDate] = useState("");
  const [newCdIcon, setNewCdIcon] = useState("🎯");

  const [customYtInput, setCustomYtInput] = useState(data.youtubeVideoUrl || "");

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update tab in parent when changed
  const switchTab = (tab: "pomodoro" | "clock" | "countdown" | "music") => {
    setActiveTab(tab);
    onChange({ ...data, activeTab: tab });
  };

  // Sync timeLeft when config changes
  useEffect(() => {
    if (!isPlaying) {
      if (phase === "work") setTimeLeft(workTime * 60);
      else if (phase === "short") setTimeLeft(shortBreak * 60);
      else if (phase === "long") setTimeLeft(longBreak * 60);
    }
  }, [workTime, shortBreak, longBreak, phase]);

  // Pomodoro Interval Ticker
  useEffect(() => {
    if (isPlaying) {
      pomodoroInterval.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (pomodoroInterval.current) clearInterval(pomodoroInterval.current);
    }

    return () => {
      if (pomodoroInterval.current) clearInterval(pomodoroInterval.current);
    };
  }, [isPlaying, phase]);

  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Gentle dual-tone chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start(ctx.currentTime);
      osc2.start(ctx.currentTime + 0.15);
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    } catch (e) {
      // Audio context policy safe ignore
    }
  };

  const handlePhaseComplete = () => {
    setIsPlaying(false);
    if (pomodoroInterval.current) clearInterval(pomodoroInterval.current);
    playChime();

    if (phase === "work") {
      setPhase("short");
      setTimeLeft(shortBreak * 60);
      onChange({ ...data, phase: "short" });
    } else {
      setPhase("work");
      setTimeLeft(workTime * 60);
      onChange({ ...data, phase: "work" });
    }
  };

  const changePhase = (newPhase: "work" | "short" | "long") => {
    setIsPlaying(false);
    if (pomodoroInterval.current) clearInterval(pomodoroInterval.current);
    setPhase(newPhase);
    if (newPhase === "work") setTimeLeft(workTime * 60);
    else if (newPhase === "short") setTimeLeft(shortBreak * 60);
    else setTimeLeft(longBreak * 60);
    onChange({ ...data, phase: newPhase });
  };

  const resetPomodoro = () => {
    setIsPlaying(false);
    if (pomodoroInterval.current) clearInterval(pomodoroInterval.current);
    if (phase === "work") setTimeLeft(workTime * 60);
    else if (phase === "short") setTimeLeft(shortBreak * 60);
    else setTimeLeft(longBreak * 60);
  };

  const quickSetWorkTime = (minutes: number) => {
    setIsPlaying(false);
    if (pomodoroInterval.current) clearInterval(pomodoroInterval.current);
    setPhase("work");
    setTimeLeft(minutes * 60);
    onChange({ ...data, workTime: minutes, phase: "work" });
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getPhaseTotalSeconds = () => {
    if (phase === "work") return workTime * 60;
    if (phase === "short") return shortBreak * 60;
    return longBreak * 60;
  };

  const percentProgress = Math.min(100, Math.max(0, ((getPhaseTotalSeconds() - timeLeft) / (getPhaseTotalSeconds() || 1)) * 100));

  // Timezone formatting
  const getFormattedTimeForZone = (date: Date, tz: string) => {
    if (!tz || tz.trim().toLowerCase() === "local") {
      return date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: showSeconds ? "2-digit" : undefined,
        hour12: !is24Hour
      });
    }

    try {
      return date.toLocaleTimeString(undefined, {
        timeZone: tz.trim(),
        hour: "2-digit",
        minute: "2-digit",
        second: showSeconds ? "2-digit" : undefined,
        hour12: !is24Hour
      });
    } catch {
      try {
        const match = tz.match(/^(?:UTC|GMT)?([+-])(\d{1,2})(?::?(\d{2}))?$/i);
        if (match) {
          const sign = match[1] === "+" ? 1 : -1;
          const hours = parseFloat(match[2]);
          const mins = parseInt(match[3] || "0", 10);
          const offsetMs = (hours * 60 + mins) * 60 * 1000 * sign;
          const utc = date.getTime() + date.getTimezoneOffset() * 60000;
          const target = new Date(utc + offsetMs);
          return target.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: showSeconds ? "2-digit" : undefined,
            hour12: !is24Hour
          });
        }
      } catch {}
      return "Zona Inválida";
    }
  };

  // Countdown calculations
  const getCountdownStats = (targetDateStr: string) => {
    if (!targetDateStr) return { text: "Sin fecha", expired: false, days: 0, hours: 0, minutes: 0, seconds: 0 };
    const target = new Date(targetDateStr);
    const diff = target.getTime() - now.getTime();
    if (isNaN(diff)) return { text: "Fecha no válida", expired: false, days: 0, hours: 0, minutes: 0, seconds: 0 };
    if (diff <= 0) return { text: "¡Llegó la fecha!", expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      text: `${days}d ${hours}h ${minutes}m ${seconds}s`,
      expired: false,
      days,
      hours,
      minutes,
      seconds
    };
  };

  // Music handlers & Station Management
  const selectMusicStation = (station: MusicStation) => {
    onChange({
      ...data,
      musicPresetId: station.id,
      youtubeVideoId: station.videoId,
      youtubeVideoUrl: station.url,
      isPlayingMusic: true
    });
  };

  const openAddStationModal = (prefillUrl?: string) => {
    setStationToEdit(null);
    setStationFormTitle("");
    setStationFormUrl(prefillUrl || "");
    setStationFormDesc("");
    setStationFormError("");
    setIsStationModalOpen(true);
  };

  const openEditStationModal = (station: MusicStation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setStationToEdit(station);
    setStationFormTitle(station.label);
    setStationFormUrl(station.url || `https://www.youtube.com/watch?v=${station.videoId}`);
    setStationFormDesc(station.desc || "");
    setStationFormError("");
    setIsStationModalOpen(true);
  };

  const handleSaveStation = () => {
    if (!stationFormTitle.trim()) {
      setStationFormError("Ingresa un nombre para la estación.");
      return;
    }
    const videoId = EXTRACT_YOUTUBE_ID(stationFormUrl);
    if (!videoId) {
      setStationFormError("Enlace o ID de YouTube inválido. Debe ser una URL de video o un ID de 11 caracteres.");
      return;
    }

    if (stationToEdit) {
      // Update existing station
      const updated = musicStations.map((st) =>
        st.id === stationToEdit.id
          ? {
              ...st,
              label: stationFormTitle.trim(),
              url: stationFormUrl.trim(),
              videoId: videoId,
              desc: stationFormDesc.trim() || ""
            }
          : st
      );
      onChange({
        ...data,
        musicStations: updated,
        ...(musicPresetId === stationToEdit.id
          ? { youtubeVideoId: videoId, youtubeVideoUrl: stationFormUrl.trim() }
          : {})
      });
    } else {
      // Create new station
      const newStation: MusicStation = {
        id: `station-${Date.now()}`,
        label: stationFormTitle.trim(),
        url: stationFormUrl.trim(),
        videoId: videoId,
        desc: stationFormDesc.trim() || "Estación personalizada"
      };
      const updated = [...musicStations, newStation];
      onChange({
        ...data,
        musicStations: updated,
        musicPresetId: newStation.id,
        youtubeVideoId: newStation.videoId,
        youtubeVideoUrl: newStation.url,
        isPlayingMusic: true
      });
    }

    setIsStationModalOpen(false);
    setStationToEdit(null);
  };

  const handleDeleteStation = (stationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = musicStations.filter((st) => st.id !== stationId);
    const isCurrent = musicPresetId === stationId;
    const nextStation = updated.length > 0 ? updated[0] : null;

    onChange({
      ...data,
      musicStations: updated,
      ...(isCurrent
        ? nextStation
          ? {
              musicPresetId: nextStation.id,
              youtubeVideoId: nextStation.videoId,
              youtubeVideoUrl: nextStation.url
            }
          : {
              musicPresetId: "",
              youtubeVideoId: "",
              youtubeVideoUrl: "",
              isPlayingMusic: false
            }
        : {})
    });
  };

  const handleResetDefaultStations = () => {
    onChange({
      ...data,
      musicStations: DEFAULT_MUSIC_STATIONS,
      musicPresetId: DEFAULT_MUSIC_STATIONS[0].id,
      youtubeVideoId: DEFAULT_MUSIC_STATIONS[0].videoId,
      youtubeVideoUrl: DEFAULT_MUSIC_STATIONS[0].url
    });
  };

  const handleCustomYoutubeSubmit = () => {
    const id = EXTRACT_YOUTUBE_ID(customYtInput);
    if (id) {
      onChange({
        ...data,
        musicPresetId: "custom",
        youtubeVideoId: id,
        youtubeVideoUrl: customYtInput,
        isPlayingMusic: true
      });
    }
  };

  const toggleMusicPlay = () => {
    onChange({
      ...data,
      isPlayingMusic: !isPlayingMusic
    });
  };

  // Clocks management
  const handleAddClock = () => {
    if (!newClockLabel.trim()) return;
    const tz = newClockZone === "custom" ? customZoneValue.trim() : newClockZone;
    if (!tz) return;
    const updated = [...clocks, { label: newClockLabel.trim(), timezone: tz }];
    onChange({ ...data, clocks: updated });
    setNewClockLabel("");
    setCustomZoneValue("");
  };

  const handleRemoveClock = (index: number) => {
    const updated = clocks.filter((_, i) => i !== index);
    onChange({ ...data, clocks: updated });
  };

  // Countdowns management
  const handleAddCountdown = () => {
    if (!newCdLabel.trim() || !newCdDate) return;
    const newId = `cd-${Date.now()}`;
    const updated = [...countdowns, { id: newId, label: newCdLabel.trim(), date: newCdDate, icon: newCdIcon }];
    onChange({ ...data, countdowns: updated });
    setNewCdLabel("");
    setNewCdDate("");
  };

  const handleRemoveCountdown = (id: string) => {
    const updated = countdowns.filter((c) => c.id !== id);
    onChange({ ...data, countdowns: updated });
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/90 text-white rounded-xl overflow-hidden select-none font-sans relative">
      
      {/* Top Universal Quick Navigation Toolbar */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-3 py-2 flex items-center justify-between gap-2 flex-shrink-0">
        
        {/* Navigation Tabs Pill */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs">
          <button
            onClick={() => switchTab("pomodoro")}
            className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "pomodoro"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Pomodoro & Enfoque"
          >
            <Timer className="w-3.5 h-3.5" />
            <span className="text-[11px]">Enfoque</span>
          </button>

          <button
            onClick={() => switchTab("clock")}
            className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "clock"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Hora & Reloj Mundial"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[11px]">Reloj</span>
          </button>

          <button
            onClick={() => switchTab("countdown")}
            className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "countdown"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Cuentas Regresivas"
          >
            <Hourglass className="w-3.5 h-3.5" />
            <span className="text-[11px]">Metas</span>
          </button>

          <button
            onClick={() => switchTab("music")}
            className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "music"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Música & Ambiente"
          >
            <Music className="w-3.5 h-3.5" />
            <span className="text-[11px]">Música</span>
            {isPlayingMusic && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            )}
          </button>
        </div>

        {/* Live Persistent Quick Indicator */}
        <div className="flex items-center gap-2">
          {/* Quick local digital time badge */}
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-[11px] font-mono font-bold text-slate-300">
            <span className="text-indigo-400">🕒</span>
            <span>{now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: !is24Hour })}</span>
          </div>

          {/* Quick music toggle */}
          <button
            onClick={toggleMusicPlay}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isPlayingMusic
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 animate-pulse"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title={isPlayingMusic ? "Pausar música" : "Reproducir música de enfoque"}
          >
            {isPlayingMusic ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Settings Config Toggle */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              showConfig
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title="Configurar Máquina del Tiempo"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Tab Content Panel */}
      <div className="flex-1 p-3.5 overflow-y-auto flex flex-col justify-between min-h-0">
        
        {/* Settings Overlay View */}
        {showConfig ? (
          <div className="space-y-3.5 py-1 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Configuración General
              </span>
              <button
                onClick={() => setShowConfig(false)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-bold text-[11px] cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* Pomodoro Durations */}
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                Tiempos de Pomodoro (Minutos)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Enfoque</label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={workTime}
                    onChange={(e) => onChange({ ...data, workTime: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Pausa Corta</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={shortBreak}
                    onChange={(e) => onChange({ ...data, shortBreak: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Pausa Larga</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={longBreak}
                    onChange={(e) => onChange({ ...data, longBreak: Math.max(1, Number(e.target.value)) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-bold text-center"
                  />
                </div>
              </div>
            </div>

            {/* Clock display options */}
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block">
                Visualización de Hora
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Mostrar Segundos</span>
                <input
                  type="checkbox"
                  checked={showSeconds}
                  onChange={(e) => onChange({ ...data, showSeconds: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Formato 24 Horas</span>
                <input
                  type="checkbox"
                  checked={is24Hour}
                  onChange={(e) => onChange({ ...data, is24Hour: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300">Mostrar Video YouTube</span>
                <input
                  type="checkbox"
                  checked={showVideo}
                  onChange={(e) => onChange({ ...data, showVideo: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        ) : activeTab === "pomodoro" ? (
          /* TAB 1: POMODORO & ENFOQUE */
          <div className="flex flex-col h-full justify-between gap-3">
            
            {/* Phase Selector & Quick Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
              <div className="flex gap-1 bg-slate-950/70 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => changePhase("work")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                    phase === "work"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Foco ({workTime}m)
                </button>
                <button
                  onClick={() => changePhase("short")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                    phase === "short"
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Pausa ({shortBreak}m)
                </button>
                <button
                  onClick={() => changePhase("long")}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                    phase === "long"
                      ? "bg-sky-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Descanso ({longBreak}m)
                </button>
              </div>

              {/* Fast Work Time Pickers */}
              <div className="flex gap-1 text-[10px]">
                {[15, 25, 45, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => quickSetWorkTime(m)}
                    className={`px-2 py-0.5 rounded border transition cursor-pointer font-bold ${
                      workTime === m && phase === "work"
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </div>

            {/* Central Timer Dial Display */}
            <div className="flex flex-col items-center justify-center my-auto py-2">
              <div className="text-center relative">
                <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  {formatTimer(timeLeft)}
                </span>
                
                <div className="flex items-center justify-center gap-2 mt-1.5">
                  <span className={`text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
                    phase === "work"
                      ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/80"
                      : phase === "short"
                      ? "bg-teal-950/60 text-teal-400 border-teal-800/80"
                      : "bg-sky-950/60 text-sky-400 border-sky-800/80"
                  }`}>
                    {phase === "work" ? "🚀 Sesión de Enfoque Activa" : "☕ Pausa Reparadora"}
                  </span>
                </div>
              </div>

              {/* Smooth Progress Bar */}
              <div className="w-full max-w-xs h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3 shadow-inner">
                <div
                  className={`h-full transition-all duration-300 ${
                    phase === "work" ? "bg-emerald-500" : phase === "short" ? "bg-teal-500" : "bg-sky-500"
                  }`}
                  style={{ width: `${percentProgress}%` }}
                />
              </div>
            </div>

            {/* Bottom Timer Controls & Session Info */}
            <div className="flex items-center justify-center gap-3 pt-2 border-t border-slate-800/60">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-lg cursor-pointer ${
                  isPlaying
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                    : phase === "work"
                    ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                    : "bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20"
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Iniciar Enfoque</span>
                  </>
                )}
              </button>

              <button
                onClick={resetPomodoro}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer border border-slate-700/80"
                title="Reiniciar temporizador"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : activeTab === "clock" ? (
          /* TAB 2: RELOJ & ZONAS MUNDIALES */
          <div className="space-y-3">
            {/* Primary Big Local Clock Card */}
            <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Tu Hora Local
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white mt-0.5">
                  {now.toLocaleTimeString(undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: showSeconds ? "2-digit" : undefined,
                    hour12: !is24Hour
                  })}
                </div>
                <div className="text-[11px] text-slate-400 font-medium capitalize mt-0.5">
                  {now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
              <div className="p-3 bg-indigo-950/50 border border-indigo-800/50 rounded-2xl text-indigo-400">
                <Clock className="w-7 h-7 animate-spin" style={{ animationDuration: "60s" }} />
              </div>
            </div>

            {/* World Clocks List */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>Zonas Horarias</span>
                <span>{clocks.length} Activas</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto pr-1">
                {clocks.map((c, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/60 border border-slate-800/80 p-2.5 rounded-xl flex items-center justify-between group hover:border-slate-700 transition"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-200 block truncate">{c.label}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{c.timezone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-indigo-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {getFormattedTimeForZone(now, c.timezone)}
                      </span>
                      <button
                        onClick={() => handleRemoveClock(idx)}
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition cursor-pointer p-0.5"
                        title="Eliminar reloj"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add World Clock Inline Form */}
              <div className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Ciudad / Nombre..."
                  value={newClockLabel}
                  onChange={(e) => setNewClockLabel(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none"
                />
                <select
                  value={newClockZone}
                  onChange={(e) => setNewClockZone(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white outline-none cursor-pointer max-w-[130px]"
                >
                  {TIMEZONE_PRESETS.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddClock}
                  className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold cursor-pointer"
                  title="Añadir zona horaria"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === "countdown" ? (
          /* TAB 3: CUENTAS REGRESIVAS & METAS */
          <div className="space-y-3 flex flex-col h-full justify-between">
            <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
              {countdowns.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No hay cuentas regresivas activas. ¡Agrega tu primera meta abajo!
                </div>
              ) : (
                countdowns.map((cd) => {
                  const stats = getCountdownStats(cd.date);
                  return (
                    <div
                      key={cd.id}
                      className={`p-3 rounded-xl border transition flex items-center justify-between group ${
                        stats.expired
                          ? "bg-slate-950/40 border-slate-800 text-slate-500"
                          : "bg-slate-950/80 border-slate-800/90 text-slate-200 hover:border-indigo-500/40"
                      }`}
                    >
                      <div className="min-w-0 flex-1 mr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{cd.icon || "🎯"}</span>
                          <span className="text-xs font-black truncate">{cd.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Fecha: {new Date(cd.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-lg border ${
                          stats.expired
                            ? "bg-slate-900 border-slate-800 text-slate-500"
                            : "bg-indigo-950/60 border-indigo-800/60 text-indigo-300"
                        }`}>
                          {stats.text}
                        </span>

                        <button
                          onClick={() => handleRemoveCountdown(cd.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition cursor-pointer p-1"
                          title="Eliminar meta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add countdown form */}
            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Agregar Cuenta Regresiva
              </span>
              <div className="flex flex-col sm:flex-row gap-1.5">
                <input
                  type="text"
                  placeholder="Título de la meta..."
                  value={newCdLabel}
                  onChange={(e) => setNewCdLabel(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none"
                />
                <input
                  type="datetime-local"
                  value={newCdDate}
                  onChange={(e) => setNewCdDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none cursor-pointer"
                />
                <button
                  onClick={handleAddCountdown}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 4: MÚSICA & ESTACIONES DE ENFOQUE */
          <div className="space-y-3 flex flex-col h-full justify-between relative">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-indigo-400" />
                  Estaciones de Enfoque ({musicStations.length})
                </span>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleResetDefaultStations}
                    className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition cursor-pointer text-[10px] flex items-center gap-1"
                    title="Restaurar estaciones recomendadas"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">Restaurar</span>
                  </button>

                  <button
                    onClick={() => openAddStationModal()}
                    className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 transition shadow-sm cursor-pointer"
                    title="Crear nueva estación de enfoque"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Nueva Estación</span>
                  </button>
                </div>
              </div>

              {/* Stations Grid */}
              {musicStations.length === 0 ? (
                <div className="text-center py-6 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 p-4">
                  <Music2 className="w-6 h-6 mx-auto text-slate-600 mb-1.5" />
                  <p className="text-xs text-slate-400 font-medium">No tienes estaciones personalizadas.</p>
                  <button
                    onClick={handleResetDefaultStations}
                    className="mt-2 text-[11px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                  >
                    Restaurar estaciones sugeridas
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[145px] overflow-y-auto pr-1">
                  {musicStations.map((station) => {
                    const isCurrent = musicPresetId === station.id;
                    return (
                      <div
                        key={station.id}
                        onClick={() => selectMusicStation(station)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                          isCurrent
                            ? "bg-indigo-950/85 border-indigo-500 text-white shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/50"
                            : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/80"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold truncate block">{station.label}</span>
                              {isCurrent && isPlayingMusic && (
                                <span className="flex h-2 w-2 relative flex-shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                              )}
                            </div>
                            {station.desc && (
                              <span className="text-[9px] text-slate-400 block mt-0.5 truncate">{station.desc}</span>
                            )}
                          </div>

                          {/* Actions: Edit & Delete */}
                          <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => openEditStationModal(station, e)}
                              className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-indigo-900/40 rounded transition cursor-pointer"
                              title="Editar estación"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteStation(station.id, e)}
                              className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded transition cursor-pointer"
                              title="Eliminar estación"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Custom YouTube URL & Quick Save */}
              <div className="flex flex-col sm:flex-row gap-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Pegar enlace o ID de YouTube..."
                  value={customYtInput}
                  onChange={(e) => setCustomYtInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleCustomYoutubeSubmit}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-bold text-xs cursor-pointer flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Cargar</span>
                  </button>
                  <button
                    onClick={() => openAddStationModal(customYtInput)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg font-bold text-xs cursor-pointer border border-slate-700 flex items-center gap-1"
                    title="Guardar como nueva estación fija"
                  >
                    <Plus className="w-3 h-3" />
                    <span className="hidden sm:inline">Guardar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Embedded Audio/Video Player Component */}
            {youtubeVideoId && (
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/90 flex items-center justify-between gap-3 shadow-inner">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`p-2 rounded-lg ${isPlayingMusic ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40" : "bg-slate-800 text-slate-400"}`}>
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">
                      {musicStations.find((p) => p.id === musicPresetId)?.label || "Stream Personalizado"}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {isPlayingMusic ? "Reproduciendo en vivo 🎵" : "Pausado"} · ID: {youtubeVideoId}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMusicPlay}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                      isPlayingMusic
                        ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20"
                        : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                    }`}
                  >
                    {isPlayingMusic ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                    <span>{isPlayingMusic ? "Pausar" : "Escuchar"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Background Hidden/Miniature Iframe for YouTube Audio */}
            {isPlayingMusic && youtubeVideoId && (
              <div className={showVideo ? "w-full aspect-video mt-2 rounded-lg overflow-hidden border border-slate-800" : "sr-only pointer-events-none"}>
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&enablejsapi=1&loop=1&playlist=${youtubeVideoId}`}
                  title="Audio Player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  className="w-full h-full"
                />
              </div>
            )}

            {/* Modal Dialog for Add / Edit Station */}
            {isStationModalOpen && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-30 p-3 flex flex-col justify-center rounded-xl animate-in fade-in duration-150">
                <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-indigo-400" />
                      {stationToEdit ? "Editar Estación de Enfoque" : "Nueva Estación de Enfoque"}
                    </span>
                    <button
                      onClick={() => setIsStationModalOpen(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {stationFormError && (
                    <div className="p-2 bg-red-950/60 border border-red-800 text-red-300 text-[11px] rounded-lg flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{stationFormError}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                        Nombre de la Estación *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Lofi Coding Beats ☕"
                        value={stationFormTitle}
                        onChange={(e) => setStationFormTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                        Enlace o ID de YouTube *
                      </label>
                      <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=... o ID de 11 letras"
                        value={stationFormUrl}
                        onChange={(e) => setStationFormUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                      />
                      {stationFormUrl && EXTRACT_YOUTUBE_ID(stationFormUrl) && (
                        <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">
                          ✓ Video detectado: {EXTRACT_YOUTUBE_ID(stationFormUrl)}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                        Descripción o Estilo (opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Ritmo relajante para programar sin distracciones"
                        value={stationFormDesc}
                        onChange={(e) => setStationFormDesc(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800">
                    <button
                      onClick={() => setIsStationModalOpen(false)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveStation}
                      className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{stationToEdit ? "Guardar Cambios" : "Crear Estación"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="bg-slate-950/60 border-t border-slate-800/60 px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-500">
        <span className="font-semibold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          Máquina del Tiempo — Todo en Uno
        </span>
        <span className="font-mono">{phase === "work" ? "Enfoque" : "Descanso"} · {formatTimer(timeLeft)}</span>
      </div>
    </div>
  );
}
