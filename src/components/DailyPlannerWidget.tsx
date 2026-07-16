import React, { useState } from "react";
import { Sparkles, Calendar, Receipt, BookOpen, Smile, Plus, Trash2, CheckSquare, Square, Check, RefreshCw, Target, Moon, Frown, Meh, AlertCircle, Zap } from "lucide-react";
import { api } from "../utils/api";

interface Bill {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  paid: boolean;
}

interface PlanItem {
  id: string;
  text: string;
  checked: boolean;
}

interface DailyPlannerWidgetProps {
  data: {
    motivation?: string;
    planItems?: PlanItem[];
    debioHacerHoy?: string;
    training?: string;
    moodAm?: string;
    moodPm?: string;
    journal?: string;
    visionBoard?: string;
    reading?: { book: string; progress: number };
    unpaidBills?: Bill[];
  };
  onChange: (newData: any) => void;
  isEditing: boolean;
}

const MOODS = ["Feliz", "Enfocado", "Cansado", "Energético", "Estresado", "Desmotivado"];

const getMoodIcon = (mood: string) => {
  const m = mood.toLowerCase();
  if (m.includes("feliz")) return <Smile className="w-3.5 h-3.5 text-amber-500 animate-pulse" />;
  if (m.includes("enfocado")) return <Target className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />;
  if (m.includes("cansado")) return <Moon className="w-3.5 h-3.5 text-blue-400 animate-pulse" />;
  if (m.includes("energético") || m.includes("energetico")) return <Zap className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />;
  if (m.includes("estresado")) return <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" />;
  if (m.includes("desmotivado")) return <Frown className="w-3.5 h-3.5 text-slate-400 animate-pulse" />;
  return <Meh className="w-3.5 h-3.5 text-slate-400 animate-pulse" />;
};

export default function DailyPlannerWidget({ data, onChange, isEditing }: DailyPlannerWidgetProps) {
  const [activeTab, setActiveTab] = useState<"hoy" | "finanzas" | "mente">("hoy");
  const [loadingAIPrompt, setLoadingAIPrompt] = useState(false);

  // Bill input states
  const [billTitle, setBillTitle] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [billDate, setBillDate] = useState("");

  // Todo input states
  const [todoText, setTodoText] = useState("");

  const planItems = data.planItems || [];
  const unpaidBills = data.unpaidBills || [];
  const reading = data.reading || { book: "Ninguno", progress: 0 };

  const handleToggleTodo = (id: string) => {
    const updated = planItems.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    onChange({ ...data, planItems: updated });
  };

  const handleAddTodo = () => {
    if (!todoText.trim()) return;
    const newItem: PlanItem = {
      id: `p-${Date.now()}`,
      text: todoText.trim(),
      checked: false,
    };
    onChange({ ...data, planItems: [...planItems, newItem] });
    setTodoText("");
  };

  const handleRemoveTodo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange({ ...data, planItems: planItems.filter((i) => i.id !== id) });
  };

  const handleAddBill = () => {
    if (!billTitle.trim() || !billAmount) return;
    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      title: billTitle.trim(),
      amount: Number(billAmount) || 0,
      dueDate: billDate || new Date().toISOString().split("T")[0],
      paid: false,
    };
    onChange({ ...data, unpaidBills: [...unpaidBills, newBill] });
    setBillTitle("");
    setBillAmount("");
    setBillDate("");
  };

  const handleToggleBillPaid = (id: string) => {
    const updated = unpaidBills.map((b) =>
      b.id === id ? { ...b, paid: !b.paid } : b
    );
    onChange({ ...data, unpaidBills: updated });
  };

  const handleRemoveBill = (id: string) => {
    onChange({ ...data, unpaidBills: unpaidBills.filter((b) => b.id !== id) });
  };

  const generateAIMotivation = async () => {
    setLoadingAIPrompt(true);
    try {
      const response = await api.generateMotivation(
        data.moodAm || "Estándar",
        "Enfoque y Hábitos",
        "Trabajar en mis metas"
      );
      if (response && response.quote) {
        onChange({
          ...data,
          motivation: `"${response.quote}" — ${response.author || "Coach"}. \nEstrategia: ${response.strategy || ""}`,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAIPrompt(false);
    }
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 text-[#1A1C1E]">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2 flex-shrink-0">
        <div className="flex bg-gray-100 border border-slate-200 rounded-xl p-0.5 text-xs text-slate-500 font-bold">
          <button
            onClick={() => setActiveTab("hoy")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
              activeTab === "hoy" ? "bg-white text-gray-800 shadow-sm" : "hover:text-gray-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Plan Hoy</span>
          </button>
          <button
            onClick={() => setActiveTab("finanzas")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
              activeTab === "finanzas" ? "bg-white text-gray-800 shadow-sm" : "hover:text-gray-800"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Finanzas</span>
          </button>
          <button
            onClick={() => setActiveTab("mente")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1 ${
              activeTab === "mente" ? "bg-white text-gray-800 shadow-sm" : "hover:text-gray-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Auto-Cuidado</span>
          </button>
        </div>
      </div>

      {/* Tab contents */}
      <div className="flex-grow overflow-y-auto pr-0.5 space-y-2.5 min-h-0 text-xs font-medium py-1 text-gray-700">
        {activeTab === "hoy" && (
          <div className="space-y-2.5">
            {/* Gemini Motivation Banner */}
            <div className="relative bg-gradient-to-r from-indigo-50/50 to-indigo-100/30 border border-indigo-100 p-2.5 rounded-xl text-[11px] leading-relaxed">
              <div className="flex items-center justify-between mb-1 text-indigo-800 font-bold">
                <div className="flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                  <span>Motivación y Estrategia AI</span>
                </div>
                <button
                  onClick={generateAIMotivation}
                  disabled={loadingAIPrompt}
                  className="p-1 bg-indigo-100/60 hover:bg-indigo-100 rounded text-indigo-700 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingAIPrompt ? "animate-spin" : ""}`} />
                </button>
              </div>
              <p className="text-indigo-950 italic font-medium leading-relaxed">
                {data.motivation || "Establece tus prioridades hoy. Presiona el botón para generar tu motivación diaria inteligente con Gemini."}
              </p>
            </div>

            {/* Initial & Final Mood logs */}
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 border border-slate-100 rounded-xl">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 flex items-center space-x-1">
                  <span>Ánimo AM (Inicio)</span>
                  {data.moodAm && getMoodIcon(data.moodAm)}
                </label>
                <select
                  value={data.moodAm || ""}
                  onChange={(e) => onChange({ ...data, moodAm: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 outline-none text-[11px] text-gray-700 cursor-pointer"
                >
                  <option value="">Seleccionar</option>
                  {MOODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-bold mb-1 flex items-center space-x-1">
                  <span>Ánimo PM (Cierre)</span>
                  {data.moodPm && getMoodIcon(data.moodPm)}
                </label>
                <select
                  value={data.moodPm || ""}
                  onChange={(e) => onChange({ ...data, moodPm: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 outline-none text-[11px] text-gray-700 cursor-pointer"
                >
                  <option value="">Seleccionar</option>
                  {MOODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checklist: Qué debo hacer hoy */}
            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-500 flex items-center space-x-1.5 text-[11px] font-display">
                <span>¿Qué debo completar hoy sin falta?</span>
              </h5>
              <div className="space-y-1 max-h-[110px] overflow-y-auto">
                {planItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleTodo(item.id)}
                    className="group px-2 py-1.5 bg-gray-50 border border-slate-100 hover:border-indigo-100 rounded-lg flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {item.checked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-300" />
                      )}
                      <span className={`truncate text-[11px] ${item.checked ? "line-through text-slate-400" : "text-gray-700 font-semibold"}`}>{item.text}</span>
                    </div>
                    {isEditing && (
                      <button
                        onClick={(e) => handleRemoveTodo(item.id, e)}
                        className="p-0.5 text-red-500 hover:text-red-700 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Agregar actividad..."
                  value={todoText}
                  onChange={(e) => setTodoText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] text-slate-800"
                />
                <button
                  onClick={handleAddTodo}
                  className="px-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Training Logs */}
            <div>
              <label className="block text-[10px] text-slate-400 font-bold mb-1">Entrenamiento / Bienestar del Día</label>
              <input
                type="text"
                value={data.training || ""}
                onChange={(e) => onChange({ ...data, training: e.target.value })}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] text-slate-800"
                placeholder="Ej: Yoga 20 min, Trote 5k, etc."
              />
            </div>
          </div>
        )}

        {activeTab === "finanzas" && (
          <div className="space-y-2">
            {/* Unpaid bills layout */}
            <h5 className="font-bold text-slate-500 text-[11px] font-display">Pagos & Cuentas Programadas</h5>
            <div className="space-y-1 max-h-[140px] overflow-y-auto">
              {unpaidBills.length === 0 ? (
                <div className="py-6 text-center text-slate-400 italic">No hay cuentas pendientes agregadas.</div>
              ) : (
                unpaidBills.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => handleToggleBillPaid(b.id)}
                    className="group px-2.5 py-2 bg-gray-50 border border-slate-100 rounded-xl flex items-center justify-between cursor-pointer hover:border-indigo-100 transition"
                  >
                    <div className="min-w-0 flex-1 flex items-center space-x-2">
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${b.paid ? "bg-emerald-600 border-emerald-500 text-white" : "border-slate-300"}`}>
                        {b.paid && <Check className="w-2.5 h-2.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-bold text-[11px] leading-none truncate ${b.paid ? "line-through text-slate-400 font-normal" : "text-gray-700"}`}>{b.title}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Vence: {b.dueDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 flex-shrink-0">
                      <span className="font-mono text-[11px] font-black text-emerald-600">${b.amount}</span>
                      {isEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveBill(b.id);
                          }}
                          className="p-0.5 text-red-500 hover:text-red-700 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Quick Bill Adder */}
            <div className="bg-gray-50 p-2.5 border border-slate-100 rounded-xl space-y-1.5">
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="Cuenta (ej: Spotify)"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] text-slate-800"
                />
                <input
                  type="number"
                  placeholder="Monto"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-16 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] text-slate-800"
                />
              </div>
              <div className="flex gap-1">
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] text-slate-800"
                />
                <button
                  onClick={handleAddBill}
                  className="px-3 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-lg text-white text-[11px] cursor-pointer"
                >
                  Agregar Pago
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "mente" && (
          <div className="space-y-2.5">
            {/* Reading list tracker */}
            <div>
              <h5 className="font-bold text-slate-500 text-[11px] mb-1 font-display">Mi Lectura Actual</h5>
              <div className="bg-gray-50 p-2.5 border border-slate-100 rounded-xl space-y-2">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={reading.book}
                    onChange={(e) => onChange({ ...data, reading: { ...reading, book: e.target.value } })}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none text-[11px]"
                    placeholder="Libro de hoy"
                  />
                  <input
                    type="number"
                    value={reading.progress}
                    onChange={(e) => onChange({ ...data, reading: { ...reading, progress: Math.min(100, Math.max(0, Number(e.target.value))) } })}
                    className="w-12 bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 outline-none text-[11px] text-center font-bold text-emerald-600"
                    placeholder="%"
                  />
                </div>
                {/* Horizontal progress */}
                <div>
                  <div className="flex justify-between text-[9px] text-slate-400 mb-0.5">
                    <span>Progreso de Lectura</span>
                    <span className="font-bold text-emerald-600">{reading.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 border border-slate-200/50 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-[repeating-linear-gradient(45deg,#10b981,#10b981_6px,#059669_6px,#059669_12px)] rounded-full transition-all duration-300 shadow-[0_1px_2px_rgba(0,0,0,0.15)]" style={{ width: `${reading.progress}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Vision Board Sticker preview */}
            <div>
              <h5 className="font-bold text-slate-500 text-[11px] mb-1 font-display">Vision Board (Enlace de Foto)</h5>
              <input
                type="text"
                value={data.visionBoard || ""}
                onChange={(e) => onChange({ ...data, visionBoard: e.target.value })}
                placeholder="Pegar URL de foto inspiradora..."
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] mb-1.5 text-slate-800"
              />
              {data.visionBoard && (
                <div className="w-full h-20 rounded-lg overflow-hidden border border-slate-200 relative group">
                  <img
                    src={data.visionBoard}
                    alt="Vision Inspiration"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div className="absolute inset-0 bg-slate-900/10" />
                </div>
              )}
            </div>

            {/* Journaling section */}
            <div>
              <h5 className="font-bold text-slate-500 text-[11px] mb-1 font-display">Mi Diario / Journal</h5>
              <textarea
                value={data.journal || ""}
                onChange={(e) => onChange({ ...data, journal: e.target.value })}
                className="w-full h-20 p-2 bg-white border border-slate-200 rounded-lg outline-none resize-none text-[11px] text-gray-700"
                placeholder="¿Qué estás aprendiendo o agradeciendo hoy? Escribe tus reflexiones..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
