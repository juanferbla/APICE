import React, { useState } from "react";
import { CheckCircle2, Circle, Flame, Sparkles, Plus, Trash2, Settings, Check } from "lucide-react";
import { Habit } from "../types";

interface HabitTrackerWidgetProps {
  data: {
    habits?: Habit[];
  };
  onChange: (newData: any) => void;
  isEditing: boolean;
}

const DEFAULT_HABITS: Habit[] = [
  { id: "h1", name: "Meditación 10 min", completedDays: ["2026-07-13", "2026-07-14", "2026-07-15"], color: "#10b981", streak: 3 },
  { id: "h2", name: "Tomar 2.5L Agua", completedDays: ["2026-07-14", "2026-07-15"], color: "#3b82f6", streak: 2 },
  { id: "h3", name: "Leer 20 mins", completedDays: ["2026-07-15"], color: "#f59e0b", streak: 1 }
];

export default function HabitTrackerWidget({ data, onChange, isEditing }: HabitTrackerWidgetProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitColor, setNewHabitColor] = useState("#10b981");

  const habits = data.habits || DEFAULT_HABITS;

  const getTodayString = () => {
    return new Date().toISOString().split("T")[0];
  };

  const handleToggleHabitToday = (habitId: string) => {
    const today = getTodayString();
    
    const updatedHabits = habits.map((h) => {
      if (h.id === habitId) {
        const completed = h.completedDays.includes(today);
        let newDays = [...h.completedDays];
        let newStreak = h.streak;

        if (completed) {
          newDays = newDays.filter((d) => d !== today);
          newStreak = Math.max(0, newStreak - 1);
        } else {
          newDays.push(today);
          newStreak += 1;
        }

        return {
          ...h,
          completedDays: newDays,
          streak: newStreak
        };
      }
      return h;
    });

    onChange({
      ...data,
      habits: updatedHabits
    });
  };

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return;

    const newHabit: Habit = {
      id: `h-${Date.now()}`,
      name: newHabitName.trim(),
      completedDays: [],
      color: newHabitColor,
      streak: 0
    };

    onChange({
      ...data,
      habits: [...habits, newHabit]
    });

    setNewHabitName("");
    setShowAdd(false);
  };

  const handleRemoveHabit = (id: string) => {
    onChange({
      ...data,
      habits: habits.filter((h) => h.id !== id)
    });
  };

  // Get active streak of habits
  const today = getTodayString();

  return (
    <div className="flex flex-col h-full justify-between p-4 text-[#1A1C1E]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
        <div className="flex items-center space-x-2">
          <Flame className="w-4 h-4 text-orange-500 animate-bounce" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-500 font-display">
            Hábitos Diarios
          </span>
        </div>
        
        {isEditing && (
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="p-1 hover:bg-gray-100 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            {showAdd ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Plus className="w-4 h-4" />}
          </button>
        )}
      </div>

      {showAdd ? (
        <div className="flex-1 flex flex-col justify-center space-y-3.5 text-xs py-1 text-gray-700">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Nombre del Hábito</label>
            <input
              type="text"
              placeholder="Ej: Caminar 30 min, Estudiar Inglés"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Color Temático</label>
            <div className="flex gap-2">
              {["#10b981", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#ef4444"].map((col) => (
                <button
                  key={col}
                  onClick={() => setNewHabitColor(col)}
                  className={`w-6 h-6 rounded-full cursor-pointer transition ${newHabitColor === col ? "scale-110 ring-2 ring-indigo-500" : ""}`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleAddHabit}
            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 font-semibold text-white rounded-lg transition text-xs cursor-pointer"
          >
            Añadir Hábito
          </button>
        </div>
      ) : (
        <div className="flex-grow overflow-y-auto pr-0.5 space-y-2 py-1">
          {habits.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[11px] text-slate-500 italic">
              No hay hábitos agregados. ¡Crea uno para empezar tu racha!
            </div>
          ) : (
            habits.map((h) => {
              const isCompletedToday = h.completedDays.includes(today);
              return (
                <div
                  key={h.id}
                  onClick={() => handleToggleHabitToday(h.id)}
                  className="group p-2.5 bg-gray-50 hover:bg-gray-100/80 border border-slate-100 hover:border-emerald-100 rounded-xl flex items-center justify-between cursor-pointer transition"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <button className="transition flex-shrink-0 cursor-pointer">
                      {isCompletedToday ? (
                        <CheckCircle2 className="w-5 h-5" style={{ color: h.color }} />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className={`text-[11px] font-bold text-gray-700 leading-tight truncate ${isCompletedToday ? "line-through opacity-60" : ""}`}>
                        {h.name}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium mt-0.5 flex items-center">
                        <Flame className="w-2.5 h-2.5 text-orange-500 mr-0.5 fill-orange-500/20" />
                        <span>Racha: <strong className="text-orange-600">{h.streak} días</strong></span>
                      </p>
                    </div>
                  </div>

                  {isEditing && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveHabit(h.id);
                      }}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-gray-100 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
