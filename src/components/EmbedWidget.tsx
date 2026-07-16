import React, { useState } from "react";
import { Code, Settings, Check, RefreshCw } from "lucide-react";

interface EmbedWidgetProps {
  data: {
    embedHtml?: string;
  };
  onChange: (newData: any) => void;
  isEditing: boolean;
}

const DEFAULT_EMBED = `<iframe src="https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0" width="100%" height="150" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;

export default function EmbedWidget({ data, onChange, isEditing }: EmbedWidgetProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [html, setHtml] = useState(data.embedHtml || DEFAULT_EMBED);

  const handleSave = () => {
    onChange({
      embedHtml: html.trim()
    });
    setShowConfig(false);
  };

  return (
    <div className="flex flex-col h-full justify-between p-3 text-[#1A1C1E]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2 flex-shrink-0">
        <div className="flex items-center space-x-1.5">
          <Code className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-500 font-display">
            Componente Embebido (HTML)
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
            <label className="block text-[10px] font-bold text-slate-400 mb-1">Código HTML o Iframe</label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="w-full h-24 p-2 bg-white border border-slate-200 rounded-lg outline-none font-mono text-[10px] resize-none text-slate-800"
              placeholder="Pega un iframe de Spotify, YouTube, Google Maps o Calendario aquí..."
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg text-white transition text-[11px] cursor-pointer"
          >
            Actualizar Widget Embebido
          </button>
        </div>
      ) : (
        <div className="flex-grow flex flex-col justify-center min-h-0 bg-gray-50 rounded-xl p-1 overflow-hidden border border-slate-100">
          {data.embedHtml ? (
            <div
              className="w-full h-full overflow-hidden flex items-center justify-center"
              dangerouslySetInnerHTML={{ __html: data.embedHtml }}
            />
          ) : (
            <div className="text-center py-6 text-xs text-slate-400 italic">
              Sin contenido para mostrar. Pulsa configurar para pegar un iframe.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
