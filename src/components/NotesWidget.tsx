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
    <div className="flex flex-col h-full justify-between p-4 text-[#1A1C1E]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="text-sm">{emoji}</span>
          {editMode ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-transparent border-b border-slate-200 font-bold text-xs text-slate-800 focus:outline-none focus:border-indigo-500 max-w-[120px]"
            />
          ) : (
            <span className="text-xs font-bold truncate text-slate-500 font-display">
              {title}
            </span>
          )}
        </div>
        
        {isEditing && (
          <button
            onClick={editMode ? handleSave : () => setEditMode(true)}
            className="p-1 hover:bg-gray-100 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
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
            className="flex-grow p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 resize-none text-[11px] leading-relaxed text-slate-800"
            placeholder="Escribe tu nota aquí..."
          />
          {/* Emoji selector */}
          <div className="flex gap-1 overflow-x-auto py-1 scrollbar-thin">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`p-1 rounded text-sm transition cursor-pointer ${emoji === e ? "bg-indigo-50 border border-indigo-200" : "hover:bg-gray-100"}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-grow flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-0.5 text-xs font-medium leading-relaxed whitespace-pre-wrap text-gray-700">
            {text || <span className="text-slate-400 italic">No hay notas guardadas. Pulsa editar para escribir tus pensamientos.</span>}
          </div>
        </div>
      )}
    </div>
  );
}
