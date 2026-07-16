import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings, Check, Clock } from "lucide-react";

interface PomodoroWidgetProps {
  data: {
    workTime?: number;
    shortBreak?: number;
    longBreak?: number;
    soundEnabled?: boolean;
    ambientSound?: string;
    phase?: "work" | "short" | "long";
  };
  onChange: (newData: any) => void;
  isEditing: boolean;
}

const SOUNDS = [
  { id: "none", label: "Silencio" },
  { id: "rain", label: "Lluvia relajante" },
  { id: "waves", label: "Olas de playa" },
  { id: "forest", label: "Bosque & Aves" },
  { id: "white", label: "Ruido Blanco" },
  { id: "music", label: "Estudio Lofi" }
];

export default function PomodoroWidget({ data, onChange, isEditing }: PomodoroWidgetProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [phase, setPhase] = useState<"work" | "short" | "long">(data.phase || "work");
  const [isPlaying, setIsPlaying] = useState(false);

  const changePhase = (newPhase: "work" | "short" | "long") => {
    setPhase(newPhase);
    onChange({ ...data, phase: newPhase });
  };

  // Read configurations with fallback
  const workTime = data.workTime || 25;
  const shortBreak = data.shortBreak || 5;
  const longBreak = data.longBreak || 15;
  const ambientSound = data.ambientSound || "none";

  const [timeLeft, setTimeLeft] = useState(workTime * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync timeLeft when configuration changes
  useEffect(() => {
    resetTimer();
  }, [workTime, shortBreak, longBreak, phase]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const resetTimer = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (phase === "work") setTimeLeft(workTime * 60);
    else if (phase === "short") setTimeLeft(shortBreak * 60);
    else if (phase === "long") setTimeLeft(longBreak * 60);
  };

  const handlePhaseComplete = () => {
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // Beep sound
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 note
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      // Ignored due to safe environments
    }

    // Toggle automatically to next logic state
    if (phase === "work") {
      changePhase("short");
    } else {
      changePhase("work");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const setWorkConfig = (key: string, val: number) => {
    onChange({
      ...data,
      [key]: val
    });
  };

  const setSoundConfig = (soundId: string) => {
    onChange({
      ...data,
      ambientSound: soundId
    });
  };

  const getPhaseSeconds = () => {
    if (phase === "work") return workTime * 60;
    if (phase === "short") return shortBreak * 60;
    return longBreak * 60;
  };

  const percentProgress = ((getPhaseSeconds() - timeLeft) / getPhaseSeconds()) * 100;

  const getContainerStyle = () => {
    if (phase === "work") {
      return {
        background: "linear-gradient(135deg, #041C1A 0%, #0C3835 50%, #021211 100%)",
      };
    } else if (phase === "short") {
      return {
        backgroundImage: "linear-gradient(rgba(11, 37, 36, 0.8), rgba(4, 18, 17, 0.9)), url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    } else {
      return {
        backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.8), rgba(8, 12, 21, 0.9)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      };
    }
  };

  return (
    <div 
      className="flex flex-col h-full justify-between p-4 text-white transition-all duration-500 ease-in-out relative select-none bg-transparent"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 flex-shrink-0 z-10">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase text-white/90 font-sans">
            Temporizador Pomodoro
          </span>
        </div>
        {isEditing && (
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showConfig ? (
        <div className="flex-1 flex flex-col justify-center space-y-2 text-xs text-white/90 py-1 z-10">
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="block text-[10px] font-bold text-white/60 mb-1">Foco (min)</label>
              <input
                type="number"
                value={workTime}
                onChange={(e) => setWorkConfig("workTime", Math.max(1, Number(e.target.value)))}
                className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded outline-none text-white font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/60 mb-1">Corto (min)</label>
              <input
                type="number"
                value={shortBreak}
                onChange={(e) => setWorkConfig("shortBreak", Math.max(1, Number(e.target.value)))}
                className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded outline-none text-white font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/60 mb-1">Largo (min)</label>
              <input
                type="number"
                value={longBreak}
                onChange={(e) => setWorkConfig("longBreak", Math.max(1, Number(e.target.value)))}
                className="w-full px-2 py-1.5 bg-white/10 border border-white/20 rounded outline-none text-white font-bold text-center"
              />
            </div>
          </div>

          <div className="pt-1.5">
            <label className="block text-[10px] font-bold text-white/60 mb-1">Sonido Ambiente (Simulado)</label>
            <select
              value={ambientSound}
              onChange={(e) => setSoundConfig(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/20 rounded outline-none px-2 py-1.5 text-xs text-white cursor-pointer"
            >
              {SOUNDS.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-950">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowConfig(false)}
            className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 font-semibold rounded text-white transition text-[11px] cursor-pointer mt-1"
          >
            Listo
          </button>
        </div>
      ) : (
        <div className="flex-grow flex flex-col justify-between min-h-0">
          {/* Tabs */}
          <div className="flex gap-1 justify-center py-1 z-10">
            <button
              onClick={() => changePhase("work")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                phase === "work"
                  ? "bg-emerald-500 text-white border-emerald-400 shadow-sm shadow-emerald-500/20"
                  : "bg-white/10 border-transparent text-white/70 hover:bg-white/20 hover:text-white"
              }`}
            >
              Foco
            </button>
            <button
              onClick={() => changePhase("short")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                phase === "short"
                  ? "bg-teal-500 text-white border-teal-400 shadow-sm shadow-teal-500/20"
                  : "bg-white/10 border-transparent text-white/70 hover:bg-white/20 hover:text-white"
              }`}
            >
              Pausa Corta
            </button>
            <button
              onClick={() => changePhase("long")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                phase === "long"
                  ? "bg-sky-500 text-white border-sky-400 shadow-sm shadow-sky-500/20"
                  : "bg-white/10 border-transparent text-white/70 hover:bg-white/20 hover:text-white"
              }`}
            >
              Pausa Larga
            </button>
          </div>

          {/* Time Dial visual */}
          <div className="flex flex-col items-center justify-center py-1.5 relative z-10">
            <span className="text-4xl font-extrabold tracking-tight text-white font-sans drop-shadow-sm">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] font-semibold text-white/70 mt-1 uppercase tracking-wider">
              {phase === "work" ? "Trabajando" : "Descanso"}
            </span>

            {/* Simulated sound pill */}
            {ambientSound !== "none" && (
              <div className="mt-1 flex items-center space-x-1 px-2 py-0.5 bg-white/10 border border-white/20 text-white rounded-full text-[9px] font-bold animate-pulse">
                <Volume2 className="w-2.5 h-2.5" />
                <span>Ambient: {SOUNDS.find((s) => s.id === ambientSound)?.label}</span>
              </div>
            )}

            {/* Horizontal timeline bar */}
            <div className="w-3/4 h-1 bg-white/15 rounded-full overflow-hidden mt-3">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  phase === "work" ? "bg-emerald-400" : phase === "short" ? "bg-teal-400" : "bg-sky-400"
                }`}
                style={{ width: `${percentProgress}%` }}
              />
            </div>
          </div>

          {/* Control triggers */}
          <div className="flex gap-2 justify-center py-1.5 flex-shrink-0 z-10">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-full cursor-pointer transition text-white ${
                isPlaying 
                  ? "bg-white/25 hover:bg-white/35 text-white" 
                  : phase === "work" 
                    ? "bg-emerald-500 hover:bg-emerald-450 shadow-md shadow-emerald-500/20" 
                    : phase === "short" 
                      ? "bg-teal-500 hover:bg-teal-450 shadow-md shadow-teal-500/20" 
                      : "bg-sky-500 hover:bg-sky-450 shadow-md shadow-sky-500/20"
              }`}
              title={isPlaying ? "Pausar" : "Iniciar"}
            >
              {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 fill-white" />}
            </button>
            <button
              onClick={resetTimer}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
