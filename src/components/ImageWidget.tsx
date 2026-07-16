import React, { useState } from "react";
import { Image, Settings, Check, ExternalLink } from "lucide-react";

interface ImageWidgetProps {
  data: {
    imageUrl?: string;
    frameStyle?: "modern" | "polaroid" | "vintage" | "stamp";
    caption?: string;
  };
  onChange: (newData: any) => void;
  isEditing: boolean;
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=800&auto=format&fit=crop&q=60";

export default function ImageWidget({ data, onChange, isEditing }: ImageWidgetProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [url, setUrl] = useState(data.imageUrl || DEFAULT_IMAGE);
  const [frame, setFrame] = useState(data.frameStyle || "modern");
  const [caption, setCaption] = useState(data.caption || "");

  const handleSave = () => {
    onChange({
      imageUrl: url.trim() || DEFAULT_IMAGE,
      frameStyle: frame,
      caption: caption.trim()
    });
    setShowConfig(false);
  };

  const getFrameClasses = () => {
    if (frame === "polaroid") {
      return "bg-white p-3 pb-8 text-slate-800 shadow-xl rounded-sm border border-slate-200/50";
    }
    if (frame === "vintage") {
      return "bg-amber-100/10 p-2.5 rounded-xl border-2 border-amber-900/10 shadow-md";
    }
    if (frame === "stamp") {
      return "bg-gray-50 p-2 border-4 border-dashed border-slate-300 rounded-none shadow-sm";
    }
    // Modern simple
    return "rounded-2xl overflow-hidden border border-slate-200/50 shadow-sm";
  };

  return (
    <div className="flex flex-col h-full justify-between p-3 text-[#1A1C1E]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2 flex-shrink-0">
        <div className="flex items-center space-x-1.5">
          <Image className="w-3.5 h-3.5 text-pink-500" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-500 font-display">
            Foto Decorativa
          </span>
        </div>
        
        {isEditing && (
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1 hover:bg-gray-100 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            {showConfig ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Settings className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {showConfig ? (
        <div className="flex-1 flex flex-col justify-center space-y-2 text-xs text-gray-700 py-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">URL de Imagen</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-pink-500 text-[11px] text-slate-900"
              placeholder="Pegar enlace de Unsplash, Pinterest, etc."
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Estilo de Marco</label>
            <select
              value={frame}
              onChange={(e: any) => setFrame(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg outline-none text-[11px] px-1 py-1.5 text-slate-800"
            >
              <option value="modern">Moderno (Redondeado)</option>
              <option value="polaroid">Polaroid Retro (Blanco)</option>
              <option value="vintage">Rústico Cálido</option>
              <option value="stamp">Sello Postal (Bordes Dentados)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Subtítulo / Mensaje</label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-pink-500 text-[11px] text-slate-900"
              placeholder="Ej: Recuerdos del campamento"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full py-1.5 bg-pink-600 hover:bg-pink-700 font-semibold rounded-lg text-white transition text-[11px] cursor-pointer mt-1"
          >
            Guardar Imagen
          </button>
        </div>
      ) : (
        <div className="flex-grow flex flex-col justify-center min-h-0">
          <div className={`relative ${getFrameClasses()} flex-grow flex flex-col overflow-hidden`}>
            <div className="flex-grow relative overflow-hidden rounded-md min-h-0 bg-gray-100">
              <img
                src={data.imageUrl || DEFAULT_IMAGE}
                alt="Custom decorator"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                }}
              />
            </div>
            
            {/* Caption rendering */}
            {(data.caption || frame === "polaroid") && (
              <div className={`mt-2 text-center text-xs tracking-tight ${frame === "polaroid" ? "text-slate-700 font-serif font-semibold italic" : "text-slate-500 font-medium truncate px-1"}`}>
                {data.caption || (frame === "polaroid" && "Mis Momentos")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
