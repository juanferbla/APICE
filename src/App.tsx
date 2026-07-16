import React, { useState, useEffect } from "react";
import {
  Layout,
  Plus,
  Minus,
  Trash2,
  Sliders,
  Sparkles,
  RefreshCw,
  LogOut,
  Save,
  Grid,
  TrendingUp,
  User,
  Undo,
  Check,
  Edit2,
  X,
  Compass,
  ArrowUp,
  ArrowDown,
  Home,
  Briefcase,
  GraduationCap,
  Zap,
  Clock,
  Timer,
  CloudSun,
  Calculator,
  FileText,
  Image as ImageIcon,
  Bookmark,
  Newspaper,
  Globe,
  CheckSquare,
  Flame,
  Calendar
} from "lucide-react";
import { api } from "./utils/api";
import { User as UserType, Dashboard, Widget, FocusSession } from "./types";
import AuthScreen from "./components/AuthScreen";
import StatusTracker from "./components/StatusTracker";
import StatsDashboard from "./components/StatsDashboard";

// Widgets components
import ClockWidget from "./components/ClockWidget";
import PomodoroWidget from "./components/PomodoroWidget";
import WeatherWidget from "./components/WeatherWidget";
import CalculatorWidget from "./components/CalculatorWidget";
import NotesWidget from "./components/NotesWidget";
import ImageWidget from "./components/ImageWidget";
import BookmarksWidget from "./components/BookmarksWidget";
import NewsfeedWidget from "./components/NewsfeedWidget";
import EmbedWidget from "./components/EmbedWidget";
import GoogleTasksWidget from "./components/GoogleTasksWidget";
import HabitTrackerWidget from "./components/HabitTrackerWidget";
import DailyPlannerWidget from "./components/DailyPlannerWidget";

const DASHBOARD_TYPES = [
  { id: "personal", label: "Personal", icon: Home },
  { id: "trabajo", label: "Trabajo", icon: Briefcase },
  { id: "estudio", label: "Estudio", icon: GraduationCap },
  { id: "hobbies", label: "Hobbies", icon: Zap }
];

const WIDGET_OPTIONS = [
  { type: "clock", label: "Reloj & Cuenta Regresiva", icon: Clock, defaultTitle: "Hora Mundial" },
  { type: "pomodoro", label: "Pomodoro Focus Timer", icon: Timer, defaultTitle: "Enfoque Activo" },
  { type: "weather", label: "Clima & Comparador", icon: CloudSun, defaultTitle: "Clima Global" },
  { type: "calculator", label: "Calculadora Matemática", icon: Calculator, defaultTitle: "Operaciones" },
  { type: "notes", label: "Notas Rápidas", icon: FileText, defaultTitle: "Ideas Libres" },
  { type: "image", label: "Imagen Decorativa / Vision Board", icon: ImageIcon, defaultTitle: "Inspiración" },
  { type: "bookmarks", label: "Marcadores & Webmixes", icon: Bookmark, defaultTitle: "Accesos Directos" },
  { type: "newsfeed", label: "Agregador Noticias RSS", icon: Newspaper, defaultTitle: "Noticias del Día" },
  { type: "embed", label: "Código / Música Embebida", icon: Globe, defaultTitle: "Reproductor Embebido" },
  { type: "google-tasks", label: "Tareas de Google", icon: CheckSquare, defaultTitle: "Lista de Tareas" },
  { type: "habit-tracker", label: "Seguimiento de Hábitos", icon: Flame, defaultTitle: "Mis Hábitos" },
  { type: "daily-planner", label: "Planificador Diario & Finanzas", icon: Calendar, defaultTitle: "Estrategia Diaria" }
];

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [currentView, setCurrentView] = useState<"dashboard" | "stats">("dashboard");
  const [activeDashboardId, setActiveDashboardId] = useState<string>("personal");
  
  // Dashboard state
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isEditingLayout, setIsEditingLayout] = useState(false);
  const [showAddWidgetModal, setShowAddWidgetModal] = useState(false);

  // Stats sessions
  const [sessions, setSessions] = useState<FocusSession[]>([]);

  // Local widget editing / name state
  const [renamingWidgetId, setRenamingWidgetId] = useState<string | null>(null);
  const [tempWidgetTitle, setTempWidgetTitle] = useState("");

  // Check auth session on startup
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userId = api.getUserId();
        if (userId) {
          setUser({
            id: userId,
            email: "juanferbla@gmail.com",
            username: "Juan Fernando"
          });
          loadUserDashboards();
          loadUserSessions();
        }
      } catch (err) {
        console.log("No active session found");
      }
    };
    checkAuth();
  }, []);

  const loadUserDashboards = async () => {
    try {
      const data = await api.getDashboards();
      if (data && data.length > 0) {
        setDashboards(data);
      }
    } catch (err) {
      console.error("Failed to load dashboards:", err);
    }
  };

  const loadUserSessions = async () => {
    try {
      const data = await api.getFocusSessions();
      if (data) {
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  const handleAuthSuccess = (authenticatedUser: UserType) => {
    setUser(authenticatedUser);
    loadUserDashboards();
    loadUserSessions();
  };

  const handleLogout = async () => {
    try {
      api.setUserId("");
      setUser(null);
      setDashboards([]);
      setSessions([]);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Find active dashboard
  const activeDashboard = dashboards.find((d) => d.id === activeDashboardId) || dashboards[0];

  // Update a specific widget data
  const handleUpdateWidgetData = (widgetId: string, newData: any) => {
    if (!activeDashboard) return;

    const updatedWidgets = activeDashboard.widgets.map((w) => {
      if (w.id === widgetId) {
        return { ...w, data: { ...w.data, ...newData } };
      }
      return w;
    });

    updateDashboardWidgets(updatedWidgets);
  };

  // Save changes to database
  const updateDashboardWidgets = async (updatedWidgets: Widget[]) => {
    if (!activeDashboard) return;

    const updatedDashboards = dashboards.map((d) => {
      if (d.id === activeDashboardId) {
        return { ...d, widgets: updatedWidgets };
      }
      return d;
    });

    setDashboards(updatedDashboards);

    // Save persist to server API
    try {
      await api.saveDashboards(updatedDashboards);
    } catch (err) {
      console.error("Failed to persist dashboard layout:", err);
    }
  };

  // Add new widget
  const handleAddWidget = (type: string) => {
    if (!activeDashboard) return;

    const option = WIDGET_OPTIONS.find((opt) => opt.type === type);
    const newWidget: Widget = {
      id: `w-${type}-${Date.now()}`,
      type: type as any,
      title: option?.defaultTitle || "Nuevo Bloque",
      x: 0,
      y: 0,
      w: (type === "daily-planner" || type === "bookmarks" || type === "weather") ? 5 : 4,
      h: 4,
      color: "bg-slate-900/60 backdrop-blur-md border border-slate-700/50",
      data: {}
    };

    const updatedWidgets = [...activeDashboard.widgets, newWidget];
    updateDashboardWidgets(updatedWidgets);
    setShowAddWidgetModal(false);
  };

  // Delete widget
  const handleDeleteWidget = (widgetId: string) => {
    if (!activeDashboard) return;
    const updated = activeDashboard.widgets.filter((w) => w.id !== widgetId);
    updateDashboardWidgets(updated);
  };

  // Reset default configuration layout
  const handleResetDefaultLayout = async () => {
    if (!window.confirm("¿Estás seguro de que deseas restablecer el diseño predeterminado? Se perderán los widgets personalizados.")) return;
    try {
      await api.saveDashboards([]);
      window.location.reload();
    } catch (err) {
      console.error("Failed to reset layouts:", err);
    }
  };

  // Reorder widget moves
  const handleMoveWidget = (index: number, direction: "up" | "down") => {
    if (!activeDashboard) return;
    const widgets = [...activeDashboard.widgets];
    const targetIdx = direction === "up" ? index - 1 : index + 1;

    if (targetIdx < 0 || targetIdx >= widgets.length) return;

    // Swap elements
    const temp = widgets[index];
    widgets[index] = widgets[targetIdx];
    widgets[targetIdx] = temp;

    updateDashboardWidgets(widgets);
  };

  // Start widget title renaming
  const startRenaming = (w: Widget) => {
    setRenamingWidgetId(w.id);
    setTempWidgetTitle(w.title);
  };

  const saveWidgetName = () => {
    if (!activeDashboard || !renamingWidgetId) return;

    const updated = activeDashboard.widgets.map((w) => {
      if (w.id === renamingWidgetId) {
        return { ...w, title: tempWidgetTitle.trim() || w.title };
      }
      return w;
    });

    updateDashboardWidgets(updated);
    setRenamingWidgetId(null);
  };

  // Resize a widget dynamically on width (w) or height (h)
  const handleResizeWidget = (widgetId: string, dimension: "w" | "h", direction: "inc" | "dec") => {
    if (!activeDashboard) return;

    const updatedWidgets = activeDashboard.widgets.map((w) => {
      if (w.id === widgetId) {
        let currentW = w.w || 4;
        let currentH = w.h || 4;

        if (dimension === "w") {
          // Adjust width in grid column spans (standard columns: 1x, 2x, 3x, 4x)
          if (direction === "inc") {
            if (currentW <= 3) currentW = 5;       // Upgrade to 2 columns
            else if (currentW <= 6) currentW = 8;  // Upgrade to 3 columns
            else if (currentW <= 9) currentW = 11; // Upgrade to 4 columns
          } else {
            if (currentW >= 10) currentW = 8;     // Downgrade to 3 columns
            else if (currentW >= 7) currentW = 5;  // Downgrade to 2 columns
            else if (currentW >= 4) currentW = 3;  // Downgrade to 1 column
          }
        } else {
          // Adjust height in vertical grid units (from min-height: 240px to 600px+)
          if (direction === "inc") {
            currentH = Math.min(12, currentH + 1);
          } else {
            currentH = Math.max(3, currentH - 1);
          }
        }

        return { ...w, w: currentW, h: currentH };
      }
      return w;
    });

    updateDashboardWidgets(updatedWidgets);
  };

  // Translate widget.w to responsive column-span Tailwind classes
  const getWidgetSpanClass = (widget: Widget) => {
    const w = widget.w || 4; // Default to 4
    if (w <= 3) {
      return "col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1";
    } else if (w <= 6) {
      return "col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2";
    } else if (w <= 9) {
      return "col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3";
    } else {
      return "col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-4";
    }
  };

  // Convert widget.h to an inline CSS minHeight style
  const getWidgetHeightStyle = (widget: Widget) => {
    const h = widget.h || 4; // Default to 4
    if (h <= 3) return { minHeight: "240px", height: "100%" };
    if (h === 4) return { minHeight: "310px", height: "100%" };
    if (h === 5) return { minHeight: "380px", height: "100%" };
    if (h === 6) return { minHeight: "450px", height: "100%" };
    if (h === 7) return { minHeight: "520px", height: "100%" };
    if (h === 8) return { minHeight: "590px", height: "100%" };
    return { minHeight: `${h * 75}px`, height: "100%" };
  };

  // Render correct Widget controller depending on type
  const renderWidgetContent = (w: Widget) => {
    const props = {
      data: w.data,
      onChange: (newData: any) => handleUpdateWidgetData(w.id, newData),
      isEditing: isEditingLayout
    };

    switch (w.type) {
      case "clock":
        return <ClockWidget {...props} />;
      case "pomodoro":
        return <PomodoroWidget {...props} />;
      case "weather":
        return <WeatherWidget {...props} />;
      case "calculator":
        return <CalculatorWidget />;
      case "notes":
        return <NotesWidget {...props} />;
      case "image":
        return <ImageWidget {...props} />;
      case "bookmarks":
        return <BookmarksWidget {...props} />;
      case "newsfeed":
        return <NewsfeedWidget {...props} />;
      case "embed":
        return <EmbedWidget {...props} />;
      case "google-tasks":
        return <GoogleTasksWidget {...props} />;
      case "habit-tracker":
        return <HabitTrackerWidget {...props} />;
      case "daily-planner":
        return <DailyPlannerWidget {...props} />;
      default:
        return <div className="p-4 text-xs text-slate-500 italic">Componente desconocido ({w.type})</div>;
    }
  };

  if (!user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans relative overflow-hidden selection:bg-indigo-500/20 selection:text-indigo-900">
      
      {/* Background Ambient Glow Circles mimicking the target dashboard image */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-100/35 rounded-full filter blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-100/35 rounded-full filter blur-[130px] pointer-events-none" />
      <div className="absolute top-[35%] right-[15%] w-[40%] h-[40%] bg-sky-100/25 rounded-full filter blur-[110px] pointer-events-none" />
      
      {/* Premium Header - White Glossy Glassmorphic Design */}
      <header className="sticky top-0 z-50 bg-white/75 backdrop-blur-xl border-b border-slate-200/60 px-4 py-3 sm:px-6 flex items-center justify-between shadow-[0_2px_15px_rgba(0,0,0,0.01)]">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 leading-none font-display">Senda Dashboard</h1>
            <p className="text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest mt-1">Organizador Diario Todo-en-Uno</p>
          </div>
        </div>

        {/* View selection tabs - High Fidelity Styled */}
        <div className="flex bg-slate-100 border border-slate-200 p-0.5 rounded-xl text-xs text-slate-500 font-bold shadow-inner">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              currentView === "dashboard" ? "bg-white text-slate-900 border border-slate-200/40 shadow-sm" : "hover:text-slate-900"
            }`}
          >
            <Grid className="w-4 h-4 text-indigo-500" />
            <span>Mis Dashboards</span>
          </button>
          <button
            onClick={() => setCurrentView("stats")}
            className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center space-x-1.5 ${
              currentView === "stats" ? "bg-white text-slate-900 border border-slate-200/40 shadow-sm" : "hover:text-slate-900"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Mi Desempeño</span>
          </button>
        </div>

        {/* User profile & logout actions - High Fidelity */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-2 bg-white/80 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
            <div className="w-5.5 h-5.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-[10px]">
              {user.email.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{user.email}</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl text-slate-400 hover:text-red-500 transition cursor-pointer shadow-sm bg-white"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Status tracker bar */}
        <StatusTracker onSessionLogged={loadUserSessions} />

        {currentView === "stats" ? (
          <StatsDashboard sessions={sessions} />
        ) : (
          <div className="space-y-6">
            
            {/* Dashboard category switchboard and custom filter toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/65 border border-slate-200/60 p-3.5 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.01)] backdrop-blur-md">
              <div className="flex flex-wrap gap-2">
                {DASHBOARD_TYPES.map((d) => {
                  const isActive = activeDashboardId === d.id;
                  const Icon = d.icon;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setActiveDashboardId(d.id)}
                      className={`px-4 py-2 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center space-x-2 ${
                        isActive
                          ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/15"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 shadow-sm"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-white animate-pulse" : "text-slate-400"}`} />
                      <span>{d.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Edit Mode Custom layout controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setIsEditingLayout(!isEditingLayout)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm ${
                    isEditingLayout
                      ? "bg-emerald-600 border-emerald-400 text-white animate-pulse shadow-md shadow-emerald-600/15"
                      : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {isEditingLayout ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Terminar Diseño</span>
                    </>
                  ) : (
                    <>
                      <Sliders className="w-4 h-4" />
                      <span>Personalizar Diseño</span>
                    </>
                  )}
                </button>

                {isEditingLayout && (
                  <>
                    <button
                      onClick={() => setShowAddWidgetModal(true)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Añadir Bloque</span>
                    </button>

                    <button
                      onClick={handleResetDefaultLayout}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
                      title="Reiniciar a valores por defecto"
                    >
                      <Undo className="w-4 h-4" />
                      <span className="hidden sm:inline">Reiniciar</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Widgets layout Grid */}
            {activeDashboard && activeDashboard.widgets.length === 0 ? (
              <div className="py-24 text-center space-y-3.5 bg-white/45 border border-dashed border-slate-300 rounded-3xl">
                <Grid className="w-10 h-10 text-slate-400 mx-auto animate-pulse" />
                <div>
                  <h3 className="text-slate-700 font-bold font-display">Dashboard sin bloques</h3>
                  <p className="text-xs text-slate-450 max-w-sm mx-auto mt-1 font-semibold">Presiona "Personalizar Diseño" para agregar widgets interactivos, listas de tareas, pomodoros, clima o notas.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
                {activeDashboard?.widgets.map((widget, idx) => {
                  const spanClass = getWidgetSpanClass(widget);

                  const isPomodoro = widget.type === "pomodoro";
                  const pomodoroPhase = widget.data?.phase || "work";

                  const heightStyle = getWidgetHeightStyle(widget);
                  const customStyle = {
                    ...heightStyle,
                    ...(isPomodoro ? {
                      background: pomodoroPhase === "work"
                        ? "linear-gradient(135deg, #041C1A 0%, #0C3835 50%, #021211 100%)"
                        : pomodoroPhase === "short"
                        ? "linear-gradient(rgba(11, 37, 36, 0.8), rgba(4, 18, 17, 0.9)), url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop&q=80')"
                        : "linear-gradient(rgba(15, 23, 42, 0.8), rgba(8, 12, 21, 0.9)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80')",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    } : {})
                  };

                  return (
                    <div
                      key={widget.id}
                      style={customStyle}
                      className={`${spanClass} ${isPomodoro ? "" : "bg-white/75 backdrop-blur-xl"} border ${
                        isEditingLayout ? "border-dashed border-indigo-500/50 ring-4 ring-indigo-500/35 scale-[1.01] shadow-lg shadow-indigo-500/10" : "border-slate-200/60"
                      } rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.04)] hover:border-slate-350 transition-all duration-300 flex flex-col overflow-hidden group`}
                    >
                      {/* Widget Title toolbar - Styled like the clean premium card panels of the image */}
                      <div className={`px-4.5 py-3 border-b flex items-center justify-between ${
                        isPomodoro
                          ? "border-white/10 bg-transparent text-white"
                          : "border-slate-100 bg-slate-50/50 text-slate-700"
                      }`}>
                        <div className="flex items-center space-x-2 min-w-0">
                          {renamingWidgetId === widget.id ? (
                            <div className="flex gap-1.5">
                              <input
                                type="text"
                                value={tempWidgetTitle}
                                onChange={(e) => setTempWidgetTitle(e.target.value)}
                                className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-white max-w-[120px] outline-none"
                              />
                              <button
                                onClick={saveWidgetName}
                                className="p-0.5 bg-emerald-600 rounded text-white cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <h3 className={`text-[13px] font-bold tracking-wider uppercase truncate font-sans ${
                              isPomodoro ? "text-white" : "text-slate-700"
                            }`}>
                              {widget.title}
                            </h3>
                          )}

                          {isEditingLayout && renamingWidgetId !== widget.id && (
                            <button
                              onClick={() => startRenaming(widget)}
                              className={`p-0.5 rounded cursor-pointer ${
                                isPomodoro ? "text-white/70 hover:text-white" : "text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>

                        {/* Reordering and deleting tools in Edit Mode */}
                        {isEditingLayout && (
                          <div className="flex items-center space-x-1.5">
                            <button
                              onClick={() => handleMoveWidget(idx, "up")}
                              disabled={idx === 0}
                              className={`p-1 rounded disabled:opacity-30 cursor-pointer ${
                                isPomodoro ? "hover:bg-white/10 text-white" : "hover:bg-slate-200 text-slate-400"
                              }`}
                              title="Mover Izquierda/Arriba"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleMoveWidget(idx, "down")}
                              disabled={idx === activeDashboard.widgets.length - 1}
                              className={`p-1 rounded disabled:opacity-30 cursor-pointer ${
                                isPomodoro ? "hover:bg-white/10 text-white" : "hover:bg-slate-200 text-slate-400"
                              }`}
                              title="Mover Derecha/Abajo"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteWidget(widget.id)}
                              className={`p-1 rounded transition cursor-pointer ${
                                isPomodoro ? "hover:bg-red-500/20 text-red-300" : "hover:bg-red-50 text-red-400"
                              }`}
                              title="Eliminar bloque"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Widget custom interactive content */}
                      <div className="flex-grow min-h-0 overflow-y-auto">
                        {renderWidgetContent(widget)}
                      </div>

                      {/* Accessible Sizing Controls in Customization Mode */}
                      {isEditingLayout && (
                        <div className={`px-4.5 py-2.5 border-t flex flex-wrap items-center justify-between gap-3 text-xs font-semibold ${
                          isPomodoro ? "border-white/10 bg-black/35 text-white" : "border-slate-100 bg-slate-50/90 text-slate-700"
                        }`}>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Ancho:</span>
                            <div className="flex bg-slate-200/60 dark:bg-black/30 rounded-lg p-0.5 items-center gap-0.5">
                              <button
                                onClick={() => handleResizeWidget(widget.id, "w", "dec")}
                                disabled={(widget.w || 4) <= 3}
                                className={`p-1 rounded transition disabled:opacity-30 cursor-pointer ${
                                  isPomodoro ? "hover:bg-white/10 text-white" : "hover:bg-white text-slate-700"
                                }`}
                                title="Reducir Ancho"
                                aria-label={`Reducir ancho de ${widget.title}`}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-[10px] font-mono font-bold min-w-[24px] text-center">
                                {widget.w <= 3 ? "1x" : widget.w <= 6 ? "2x" : widget.w <= 9 ? "3x" : "4x"}
                              </span>
                              <button
                                onClick={() => handleResizeWidget(widget.id, "w", "inc")}
                                disabled={(widget.w || 4) >= 10}
                                className={`p-1 rounded transition disabled:opacity-30 cursor-pointer ${
                                  isPomodoro ? "hover:bg-white/10 text-white" : "hover:bg-white text-slate-700"
                                }`}
                                title="Aumentar Ancho"
                                aria-label={`Aumentar ancho de ${widget.title}`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">Alto:</span>
                            <div className="flex bg-slate-200/60 dark:bg-black/30 rounded-lg p-0.5 items-center gap-0.5">
                              <button
                                onClick={() => handleResizeWidget(widget.id, "h", "dec")}
                                disabled={(widget.h || 4) <= 3}
                                className={`p-1 rounded transition disabled:opacity-30 cursor-pointer ${
                                  isPomodoro ? "hover:bg-white/10 text-white" : "hover:bg-white text-slate-700"
                                }`}
                                title="Reducir Alto"
                                aria-label={`Reducir alto de ${widget.title}`}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-[10px] font-mono font-bold min-w-[24px] text-center">
                                {widget.h || 4}x
                              </span>
                              <button
                                onClick={() => handleResizeWidget(widget.id, "h", "inc")}
                                disabled={(widget.h || 4) >= 12}
                                className={`p-1 rounded transition disabled:opacity-30 cursor-pointer ${
                                  isPomodoro ? "hover:bg-white/10 text-white" : "hover:bg-white text-slate-700"
                                }`}
                                title="Aumentar Alto"
                                aria-label={`Aumentar alto de ${widget.title}`}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-100 py-5 px-6 text-center text-[10px] text-slate-400 font-extrabold uppercase tracking-widest bg-white/30 backdrop-blur-md">
        <span>Senda Dashboard — 2026</span>
      </footer>

      {/* Add Widget Modal overlay */}
      {showAddWidgetModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowAddWidgetModal(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-full text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight font-display">Añadir Nuevo Bloque</h3>
              <p className="text-xs text-slate-500 mt-1 font-semibold">Selecciona qué bloque deseas integrar en tu layout actual.</p>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-[340px] overflow-y-auto pr-1">
              {WIDGET_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.type}
                    onClick={() => handleAddWidget(opt.type)}
                    className="w-full text-left p-3 bg-slate-50 hover:bg-gray-100 border border-slate-200 hover:border-indigo-500/30 rounded-2xl text-xs font-bold text-slate-700 transition cursor-pointer flex items-center justify-between shadow-sm group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-200">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span>{opt.label}</span>
                    </div>
                    <Plus className="w-4 h-4 text-indigo-600" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
