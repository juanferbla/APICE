import React, { useState } from "react";
import { CheckSquare, Square, Check, Trash2, Plus, Star, Folder, FolderPlus } from "lucide-react";
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
      { id: "gt1", text: "Completar planificación de mi semana", done: true, priority: "high" },
      { id: "gt2", text: "Enviar reporte ejecutivo Sabora", done: false, priority: "high" },
      { id: "gt3", text: "Revisar agenda de estudio de React", done: false, priority: "medium" }
    ]
  }
];

export default function GoogleTasksWidget({ data, onChange, isEditing }: GoogleTasksWidgetProps) {
  const [newListName, setNewListName] = useState("");
  const [showAddList, setShowAddList] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");

  const rawLists = data.taskLists || DEFAULT_LISTS;
  const lists = rawLists.map((l: any) => ({
    id: l.id || l.listId || `list-fallback-${l.name}`,
    name: l.name,
    tasks: (l.tasks || []).map((t: any) => ({
      id: t.id,
      text: t.text,
      done: typeof t.done === "boolean" ? t.done : !!t.completed,
      priority: t.priority
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
      priority: newTaskPriority
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

    setNewTaskText("");
  };

  const handleToggleTask = (taskId: string) => {
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

  const handleRemoveTask = (taskId: string) => {
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

  const handleRemoveList = (listId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (lists.length <= 1) return; // Prevent empty lists

    const filtered = lists.filter((l) => l.id !== listId);
    onChange({
      ...data,
      taskLists: filtered,
      activeListId: filtered[0].id
    });
  };

  const getPriorityColor = (p?: string) => {
    if (p === "high") return "bg-red-50 border-red-100 text-red-600";
    if (p === "medium") return "bg-amber-50 border-amber-100 text-amber-700";
    return "bg-slate-50 border-slate-200 text-slate-500";
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 text-[#1A1C1E]">
      {/* Header with Lists Dropdown selector */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
        <div className="flex items-center space-x-1.5 min-w-0">
          <Folder className="w-4 h-4 text-violet-500 flex-shrink-0" />
          <select
            value={activeListId}
            onChange={(e) => onChange({ ...data, activeListId: e.target.value })}
            className="bg-transparent border-none font-bold text-xs text-gray-700 outline-none pr-3 py-0.5 max-w-[130px] cursor-pointer"
          >
            {lists.map((l) => (
              <option key={l.id} value={l.id} className="bg-white text-gray-700">
                {l.name}
              </option>
            ))}
          </select>
        </div>

        {isEditing && (
          <button
            onClick={() => setShowAddList(!showAddList)}
            className="p-1 hover:bg-gray-100 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
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
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-xs text-slate-900"
            />
          </div>
          <button
            onClick={handleAddList}
            className="w-full py-1.5 bg-violet-600 hover:bg-violet-700 font-semibold rounded text-white transition text-xs cursor-pointer"
          >
            Crear Lista
          </button>
        </div>
      ) : (
        <div className="flex-grow flex flex-col min-h-0">
          {/* Active tasks lists */}
          <div className="flex-grow overflow-y-auto pr-0.5 space-y-1.5 py-1">
            {activeList && activeList.tasks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[11px] text-slate-500 italic">
                No hay tareas en esta lista. ¡Agrega una nueva!
              </div>
            ) : (
              activeList?.tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`group px-2.5 py-2 bg-gray-50 hover:bg-gray-100/80 border border-slate-100 hover:border-violet-100 rounded-xl flex items-center justify-between text-xs transition cursor-pointer ${
                    task.done ? "opacity-60 line-through" : ""
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <button className="text-slate-400 hover:text-violet-500 transition cursor-pointer flex-shrink-0">
                      {task.done ? (
                        <CheckSquare className="w-4 h-4 text-violet-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                    <span className="truncate text-[11px] font-semibold text-gray-700">{task.text}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    {task.priority && !task.done && (
                      <span className={`px-1.5 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    )}
                    {isEditing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTask(task.id);
                        }}
                        className="p-0.5 text-red-500 hover:text-red-700 hover:bg-gray-100 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick task adder */}
          <div className="border-t border-slate-100 pt-2.5 mt-2 flex gap-1 items-center">
            <input
              type="text"
              placeholder="Nueva tarea..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] text-slate-800"
            />
            {/* Priority Selector */}
            <select
              value={newTaskPriority}
              onChange={(e: any) => setNewTaskPriority(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg text-[10px] outline-none px-1.5 py-1.5 font-bold text-gray-700"
            >
              <option value="high">H</option>
              <option value="medium">M</option>
              <option value="low">L</option>
            </select>
            <button
              onClick={handleAddTask}
              className="p-1.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
