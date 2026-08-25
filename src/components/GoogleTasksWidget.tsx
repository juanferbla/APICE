import React, { useState } from "react";
import {
  CheckSquare,
  Square,
  Trash2,
  Plus,
  Folder,
  FolderPlus,
  Calendar,
  Clock,
  AlignLeft,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle
} from "lucide-react";
import { TaskList, TaskItem } from "../types";

interface GoogleTasksWidgetProps {
  data: {
    taskLists?: TaskList[];
    activeListId?: string;
  };
  onChange: (newData: any) => void;
  isEditing: boolean;
}

const DEFAULT_LISTS: TaskList[] = [
  {
    id: "g-default",
    name: "Tareas de Google (General)",
    tasks: [
      {
        id: "gt1",
        text: "Completar planificación de mi semana",
        done: true,
        priority: "high",
        deadline: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        description: "Revisar objetivos y metas prioritarias del sprint."
      },
      {
        id: "gt2",
        text: "Enviar reporte ejecutivo Sabora",
        done: false,
        priority: "high",
        deadline: new Date().toISOString().split("T")[0],
        description: "Incluir métricas de conversión y balance mensual."
      },
      {
        id: "gt3",
        text: "Revisar agenda de estudio de React",
        done: false,
        priority: "medium",
        deadline: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
        description: "Módulos de optimización y Zustand."
      }
    ]
  }
];

export default function GoogleTasksWidget({ data, onChange, isEditing }: GoogleTasksWidgetProps) {
  const [newListName, setNewListName] = useState("");
  const [showAddList, setShowAddList] = useState(false);

  // New task form state
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const rawLists = data.taskLists || DEFAULT_LISTS;
  const lists = rawLists.map((l: any) => ({
    id: l.id || l.listId || `list-fallback-${l.name}`,
    name: l.name,
    tasks: (l.tasks || []).map((t: any) => ({
      id: t.id,
      text: t.text || t.title || "Sin título",
      done: typeof t.done === "boolean" ? t.done : !!t.completed,
      priority: (t.priority as "low" | "medium" | "high") || "medium",
      deadline: t.deadline || t.dueDate || "",
      description: t.description || t.notes || t.desc || ""
    }))
  }));

  const activeListId = data.activeListId || lists[0]?.id || "g-default";
  const activeList = lists.find((l) => l.id === activeListId) || lists[0];

  const handleAddTask = () => {
    if (!newTaskText.trim() || !activeList) return;

    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      done: false,
      priority: newTaskPriority,
      ...(newTaskDeadline.trim() ? { deadline: newTaskDeadline.trim(), dueDate: newTaskDeadline.trim() } : {}),
      ...(newTaskDescription.trim() ? { description: newTaskDescription.trim() } : {})
    };

    const updatedLists = lists.map((l) => {
      if (l.id === activeListId) {
        return { ...l, tasks: [...l.tasks, newTask] };
      }
      return l;
    });

    onChange({
      ...data,
      taskLists: updatedLists
    });

    // Reset inputs
    setNewTaskText("");
    setNewTaskDeadline("");
    setNewTaskPriority("medium");
    setNewTaskDescription("");
    setIsFormExpanded(false);
  };

  const handleToggleTask = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedLists = lists.map((l) => {
      if (l.id === activeListId) {
        const updatedTasks = l.tasks.map((t) => {
          if (t.id === taskId) {
            return { ...t, done: !t.done };
          }
          return t;
        });
        return { ...l, tasks: updatedTasks };
      }
      return l;
    });

    onChange({
      ...data,
      taskLists: updatedLists
    });
  };

  const handleRemoveTask = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedLists = lists.map((l) => {
      if (l.id === activeListId) {
        return { ...l, tasks: l.tasks.filter((t) => t.id !== taskId) };
      }
      return l;
    });

    onChange({
      ...data,
      taskLists: updatedLists
    });
  };

  const handleAddList = () => {
    if (!newListName.trim()) return;

    const newList: TaskList = {
      id: `list-${Date.now()}`,
      name: newListName.trim(),
      tasks: []
    };

    onChange({
      ...data,
      taskLists: [...lists, newList],
      activeListId: newList.id
    });

    setNewListName("");
    setShowAddList(false);
  };

  const getPriorityBadge = (p?: string) => {
    switch (p) {
      case "high":
        return {
          label: "H",
          name: "Alta",
          className: "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
        };
      case "medium":
        return {
          label: "M",
          name: "Media",
          className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
        };
      case "low":
      default:
        return {
          label: "L",
          name: "Baja",
          className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
        };
    }
  };

  const formatDeadline = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date().toISOString().split("T")[0];
    const taskDate = dateStr.split("T")[0];

    const isOverdue = taskDate < today;
    const isToday = taskDate === today;

    // Formatting date
    let formatted = dateStr;
    try {
      const d = new Date(dateStr + "T00:00:00");
      formatted = d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
    } catch {
      formatted = dateStr;
    }

    return {
      text: isToday ? `Hoy (${formatted})` : formatted,
      isOverdue,
      isToday
    };
  };

  return (
    <div className="flex flex-col h-full justify-between p-3.5 text-[#1A1C1E] dark:text-slate-100">
      {/* Header with Lists Dropdown selector */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-1.5">
        <div className="flex items-center space-x-1.5 min-w-0">
          <Folder className="w-4 h-4 text-violet-500 flex-shrink-0" />
          <select
            value={activeListId}
            onChange={(e) => onChange({ ...data, activeListId: e.target.value })}
            className="w-auto max-w-full bg-transparent border-none font-bold text-xs text-gray-800 dark:text-slate-100 outline-none pr-2 py-0.5 cursor-pointer"
          >
            {lists.map((l) => (
              <option
                key={l.id}
                value={l.id}
                className="bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 font-medium"
              >
                {l.name} ({l.tasks.length})
              </option>
            ))}
          </select>
        </div>

        {isEditing && (
          <button
            onClick={() => setShowAddList(!showAddList)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
            title="Crear nueva lista"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showAddList ? (
        <div className="flex-1 flex flex-col justify-center space-y-2.5 text-xs py-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Nombre de la lista</label>
            <input
              type="text"
              placeholder="Ej: Estudio de Inglés"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowAddList(false)}
              className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-semibold rounded text-slate-700 dark:text-slate-300 transition text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddList}
              className="flex-1 py-1.5 bg-violet-600 hover:bg-violet-700 font-semibold rounded text-white transition text-xs cursor-pointer"
            >
              Crear Lista
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col min-h-0 justify-between">
          {/* Active tasks lists */}
          <div className="flex-grow overflow-y-auto pr-0.5 space-y-1.5 py-1 max-h-[160px]">
            {activeList && activeList.tasks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[11px] text-slate-400 italic py-4">
                No hay tareas en esta lista. ¡Crea una abajo con nombre, fecha, prioridad y notas!
              </div>
            ) : (
              activeList?.tasks.map((task) => {
                const priorityInfo = getPriorityBadge(task.priority);
                const deadlineInfo = formatDeadline(task.deadline);
                const isExpanded = expandedTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    className={`group p-2 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100/90 dark:hover:bg-slate-850 border border-slate-200/70 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-500/50 rounded-xl flex flex-col gap-1 text-xs transition cursor-pointer ${
                      task.done ? "opacity-60 bg-slate-50/50 dark:bg-slate-900/40" : ""
                    }`}
                    onClick={() => {
                      if (task.description) {
                        setExpandedTaskId(isExpanded ? null : task.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <button
                          onClick={(e) => handleToggleTask(task.id, e)}
                          className="text-slate-400 hover:text-violet-500 transition cursor-pointer flex-shrink-0"
                          title={task.done ? "Marcar como pendiente" : "Marcar como completada"}
                        >
                          {task.done ? (
                            <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 dark:text-slate-600" />
                          )}
                        </button>
                        <span
                          className={`truncate text-[11px] font-semibold text-gray-800 dark:text-slate-200 ${
                            task.done ? "line-through text-slate-400 dark:text-slate-500" : ""
                          }`}
                        >
                          {task.text}
                        </span>
                      </div>

                      {/* Badges & Actions */}
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        {/* Priority Badge */}
                        {task.priority && (
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold tracking-wider ${priorityInfo.className}`}
                            title={`Importancia: ${priorityInfo.name} (${priorityInfo.label})`}
                          >
                            {priorityInfo.label}
                          </span>
                        )}

                        {/* Deadline Badge */}
                        {deadlineInfo && (
                          <span
                            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-medium border ${
                              deadlineInfo.isOverdue && !task.done
                                ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                                : deadlineInfo.isToday && !task.done
                                ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                            }`}
                            title={`Fecha límite: ${task.deadline}`}
                          >
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{deadlineInfo.text}</span>
                          </span>
                        )}

                        {/* Description indicator / Toggle */}
                        {task.description && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTaskId(isExpanded ? null : task.id);
                            }}
                            className="text-slate-400 hover:text-violet-500 p-0.5"
                            title={isExpanded ? "Ocultar descripción" : "Ver descripción"}
                          >
                            <AlignLeft className="w-3 h-3" />
                          </button>
                        )}

                        {/* Remove Task Button */}
                        <button
                          onClick={(e) => handleRemoveTask(task.id, e)}
                          className="p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition opacity-80 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                          title="Eliminar tarea"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Expandable Task Description */}
                    {isExpanded && task.description && (
                      <div className="mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-800/80 text-[10px] text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-950/40 p-1.5 rounded-md">
                        <p className="whitespace-pre-wrap leading-relaxed">{task.description}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* New Task Creation Form */}
          <div className="border-t border-slate-100 dark:border-slate-800/90 pt-2 mt-1.5">
            {!isFormExpanded ? (
              /* Compact Quick Bar */
              <div className="flex gap-1 items-center">
                <input
                  type="text"
                  placeholder="Nombre de la nueva tarea..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (newTaskDeadline || newTaskDescription) {
                        handleAddTask();
                      } else {
                        handleAddTask();
                      }
                    }
                  }}
                  onFocus={() => setIsFormExpanded(true)}
                  className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-[11px] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:border-violet-500"
                />

                {/* Importance Selector */}
                <select
                  value={newTaskPriority}
                  onChange={(e: any) => setNewTaskPriority(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] outline-none px-1.5 py-1.5 font-bold text-gray-700 dark:text-slate-200 cursor-pointer"
                  title="Importancia: Alta (H), Media (M), Baja (L)"
                >
                  <option value="high">H (Alta)</option>
                  <option value="medium">M (Media)</option>
                  <option value="low">L (Baja)</option>
                </select>

                <button
                  onClick={() => setIsFormExpanded(true)}
                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 cursor-pointer transition"
                  title="Añadir detalles (Fecha y Descripción)"
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleAddTask}
                  className="p-1.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-white cursor-pointer shadow-sm transition"
                  title="Crear tarea"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Expanded Full Task Form (Nombre, Fecha/Deadline, Importancia H/M/L, Descripción) */
              <div className="bg-slate-50 dark:bg-slate-900/90 border border-violet-200 dark:border-violet-900/60 rounded-xl p-2.5 space-y-2 animate-in fade-in duration-150 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 flex items-center gap-1">
                    <Plus className="w-3 h-3" />
                    Nueva Tarea
                  </span>
                  <button
                    onClick={() => setIsFormExpanded(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
                    title="Minimizar formulario"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* 1. Nombre */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                    Nombre de la tarea *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Preparar presentación del proyecto..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    autoFocus
                    className="w-full px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-violet-500"
                  />
                </div>

                {/* 2. Fecha de entrega (Deadline) & 3. Importancia (H, M, L) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5 text-violet-500" />
                      Fecha de entrega (Deadline)
                    </label>
                    <input
                      type="date"
                      value={newTaskDeadline}
                      onChange={(e) => setNewTaskDeadline(e.target.value)}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs text-slate-900 dark:text-slate-100 focus:border-violet-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                      Importancia (H, M, L)
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setNewTaskPriority("high")}
                        className={`py-1 rounded-lg text-[10px] font-extrabold border transition cursor-pointer flex items-center justify-center gap-1 ${
                          newTaskPriority === "high"
                            ? "bg-red-500 text-white border-red-600 shadow-sm"
                            : "bg-white dark:bg-slate-950 text-red-600 dark:text-red-400 border-slate-200 dark:border-slate-700 hover:border-red-300"
                        }`}
                      >
                        <span>H</span>
                        <span className="text-[9px] font-normal opacity-90 hidden sm:inline">Alta</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewTaskPriority("medium")}
                        className={`py-1 rounded-lg text-[10px] font-extrabold border transition cursor-pointer flex items-center justify-center gap-1 ${
                          newTaskPriority === "medium"
                            ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                            : "bg-white dark:bg-slate-950 text-amber-600 dark:text-amber-400 border-slate-200 dark:border-slate-700 hover:border-amber-300"
                        }`}
                      >
                        <span>M</span>
                        <span className="text-[9px] font-normal opacity-90 hidden sm:inline">Media</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setNewTaskPriority("low")}
                        className={`py-1 rounded-lg text-[10px] font-extrabold border transition cursor-pointer flex items-center justify-center gap-1 ${
                          newTaskPriority === "low"
                            ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                            : "bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-700 hover:border-emerald-300"
                        }`}
                      >
                        <span>L</span>
                        <span className="text-[9px] font-normal opacity-90 hidden sm:inline">Baja</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Descripción */}
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1">
                    <AlignLeft className="w-2.5 h-2.5 text-violet-500" />
                    Descripción o Notas (opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalles, enlaces o subtareas..."
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    className="w-full px-2.5 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-violet-500 resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormExpanded(false);
                      setNewTaskText("");
                      setNewTaskDeadline("");
                      setNewTaskDescription("");
                    }}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddTask}
                    disabled={!newTaskText.trim()}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold text-white transition flex items-center gap-1 cursor-pointer ${
                      newTaskText.trim()
                        ? "bg-violet-600 hover:bg-violet-700 shadow-sm"
                        : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>Guardar Tarea</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

