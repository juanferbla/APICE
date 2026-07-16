import React, { useState } from "react";
import { Rss, Plus, Trash2, Globe, Sparkles, RefreshCw, Check, ExternalLink, Settings } from "lucide-react";

interface NewsfeedWidgetProps {
  data: {
    feedUrl?: string;
    feedTitle?: string;
    items?: { title: string; link: string; date: string; source: string }[];
  };
  onChange: (newData: any) => void;
  isEditing: boolean;
}

const DEFAULT_FEED_ITEMS = [
  { title: "El arte de organizar tu tiempo: Guía definitiva", link: "https://example.com", date: "Hace 1 hora", source: "Productivity Pulse" },
  { title: "Por qué los micro-hábitos son más efectivos que las metas anuales", link: "https://example.com", date: "Hace 4 horas", source: "Atomic Zen" },
  { title: "React 19 lanzado oficialmente: Novedades del compilador", link: "https://example.com", date: "Ayer", source: "Dev Insider" },
  { title: "Sintetizadores analógicos en la era digital", link: "https://example.com", date: "Hace 2 días", source: "Music Waves" }
];

export default function NewsfeedWidget({ data, onChange, isEditing }: NewsfeedWidgetProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [url, setUrl] = useState(data.feedUrl || "https://news.google.com/rss");
  const [title, setTitle] = useState(data.feedTitle || "Tecnología e Inspiración");
  const [loading, setLoading] = useState(false);

  const items = data.items || DEFAULT_FEED_ITEMS;

  const handleRefresh = async () => {
    setLoading(true);
    // Simulate parsing of a custom feed securely or use the rich mockup updates
    setTimeout(() => {
      let mockItems = [...DEFAULT_FEED_ITEMS];
      // Adapt mock items title to give customized feel if they set a different URL
      if (url.toLowerCase().includes("sport") || url.toLowerCase().includes("deporte")) {
        mockItems = [
          { title: "Campeonato Mundial de Atletismo 2026: Crónica diaria", link: "https://example.com", date: "Hace 30 min", source: "Senda Sports" },
          { title: "Entrenamiento de alta intensidad para optimizar el rendimiento laboral", link: "https://example.com", date: "Hace 3 horas", source: "Fitness & Time" }
        ];
      } else if (url.toLowerCase().includes("money") || url.toLowerCase().includes("finanz")) {
        mockItems = [
          { title: "Estrategias de inversión para emprendedores en tecnología", link: "https://example.com", date: "Hace 15 min", source: "Capital Focus" },
          { title: "Cómo automatizar el pago de tus cuentas programadas", link: "https://example.com", date: "Hace 5 horas", source: "Finanzas Simples" }
        ];
      }

      onChange({
        ...data,
        items: mockItems,
        feedUrl: url,
        feedTitle: title
      });
      setLoading(false);
    }, 800);
  };

  const handleSave = () => {
    handleRefresh();
    setShowConfig(false);
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 text-[#1A1C1E]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
        <div className="flex items-center space-x-2 min-w-0">
          <Rss className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-500 font-display truncate">
            {data.feedTitle || "Noticias & Feed RSS"}
          </span>
        </div>

        <div className="flex items-center space-x-1 flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`p-1 hover:bg-gray-100 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer ${loading ? "animate-spin" : ""}`}
            title="Refrescar feed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          {isEditing && (
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="p-1 hover:bg-gray-100 rounded text-slate-400 hover:text-slate-700 transition cursor-pointer"
            >
              {showConfig ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Settings className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {showConfig ? (
        <div className="flex-1 flex flex-col justify-center space-y-2.5 text-xs py-1 text-gray-700">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Título del Feed</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-slate-900"
              placeholder="Ej: Noticias de Diseño"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Enlace del Feed RSS (URL)</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-[11px] text-slate-900"
              placeholder="Ej: https://feedburner.com/feed"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full py-1.5 bg-orange-500 hover:bg-orange-600 font-semibold rounded-lg text-white transition text-xs cursor-pointer"
          >
            Guardar & Sincronizar
          </button>
        </div>
      ) : (
        <div className="flex-grow min-h-0 overflow-y-auto pr-0.5 space-y-2 py-1">
          {items.map((it, idx) => (
            <a
              key={idx}
              href={it.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-2.5 bg-gray-50 hover:bg-gray-100/80 border border-slate-100 hover:border-orange-200 rounded-xl transition"
            >
              <div className="flex items-center justify-between text-[9px] font-bold text-orange-600 mb-1">
                <span className="uppercase truncate max-w-[120px]">{it.source}</span>
                <span className="text-slate-400 font-medium">{it.date}</span>
              </div>
              <h5 className="font-semibold text-gray-800 group-hover:text-orange-700 transition leading-snug text-[11px]">
                {it.title}
              </h5>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
