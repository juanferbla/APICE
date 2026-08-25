import React, { useState } from "react";
import { StickyNote, Edit, Check } from "lucide-react";

interface NotesWidgetProps {
  data: {
    title?: string;
    text?: string;
    emojiIcon?: string;
  };
  onChange: (newData: any) => void;
  isEditing: boolean;
}

const EMOJIS = ["💡", "📝", "📌", "⭐", "🔥", "⚠️", "🧠", "🎯", "🍀", "💼", "🏠", "🧘"];

export default function NotesWidget({ data, onChange, isEditing }: NotesWidgetProps) {
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(data.title || "Nota rápida");
  const [text, setText] = useState(data.text || "");
  const [emoji, setEmoji] = useState(data.emojiIcon || "📌");

  const handleSave = () => {
    onChange({
      title,
      text,
      emojiIcon: emoji
    });
    setEditMode(false);
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-1.5 mb-2">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="text-sm">{emoji}</span>
          {editMode ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent border-b border-slate-200 dark:border-slate-750 font-bold text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 max-w-[120px]"
            />
          ) : (
            <span className="text-xs font-bold truncate text-slate-500 dark:text-slate-400 font-display">
              {title}
            </span>
          )}
        </div>
        
        {isEditing && (
          <button
            onClick={editMode ? handleSave : () => setEditMode(true)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer"
          >
            {editMode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Edit className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {editMode ? (
        <div className="flex-1 flex flex-col space-y-2 text-xs">
          {/* Text Area */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-grow p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500 resize-none text-xs leading-relaxed text-slate-800 dark:text-slate-100"
            placeholder="Escribe tu nota aquí..."
          />
          {/* Emoji selector */}
          <div className="flex gap-1 overflow-x-auto py-1 scrollbar-thin">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`p-1 rounded text-sm transition cursor-pointer ${emoji === e ? "border" : "hover:bg-gray-100 dark:hover:bg-slate-800"}`}
                style={emoji === e ? { backgroundColor: "rgba(79, 107, 255, 0.08)", borderColor: "var(--color-role-active)" } : undefined}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-0.5 text-xs font-medium leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-200">
            {text || <span className="text-slate-500 dark:text-slate-400 italic">No hay notas guardadas. Pulsa editar para escribir tus pensamientos.</span>}
          </div>
        </div>
      )}
    </div>
  );
}
