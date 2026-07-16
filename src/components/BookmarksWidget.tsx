import React, { useState } from "react";
import { Bookmark as BookmarkIcon, Settings, Plus, Trash2, List, Grid, Cloud, Columns, Globe, Check, ExternalLink } from "lucide-react";
import { Bookmark, BookmarkStyle } from "../types";

interface BookmarksWidgetProps {
  data: {
    bookmarks?: Bookmark[];
    displayStyle?: BookmarkStyle;
  };
  onChange: (newData: any) => void;
  isEditing: boolean;
}

const DEFAULT_BOOKMARKS: Bookmark[] = [
  { id: "1", label: "Google", url: "https://google.com" },
  { id: "2", label: "YouTube", url: "https://youtube.com" },
  { id: "3", label: "GitHub", url: "https://github.com" }
];

export default function BookmarksWidget({ data, onChange, isEditing }: BookmarksWidgetProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [desc, setDesc] = useState("");

  const bookmarks = data.bookmarks || DEFAULT_BOOKMARKS;
  const style = data.displayStyle || "icons";

  const handleAddBookmark = () => {
    if (!label.trim() || !url.trim()) return;

    // Secure URL protocol
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = "https://" + formattedUrl;
    }

    const newBookmark: Bookmark = {
      id: `bm-${Date.now()}`,
      label: label.trim(),
      url: formattedUrl,
      description: desc.trim() || undefined
    };

    onChange({
      ...data,
      bookmarks: [...bookmarks, newBookmark]
    });

    setLabel("");
    setUrl("");
    setDesc("");
  };

  const handleRemoveBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onChange({
      ...data,
      bookmarks: bookmarks.filter((b) => b.id !== id)
    });
  };

  const setStyle = (s: BookmarkStyle) => {
    onChange({
      ...data,
      displayStyle: s
    });
  };

  const getFaviconUrl = (bookmarkUrl: string) => {
    try {
      const urlObj = new URL(bookmarkUrl);
      return `https://www.google.com/s2/favicons?sz=64&domain=${urlObj.hostname}`;
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="flex flex-col h-full justify-between p-4 text-[#1A1C1E]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
        <div className="flex items-center space-x-2">
          <BookmarkIcon className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-500 font-display">
            Marcadores & Enlaces
          </span>
        </div>

        <div className="flex items-center space-x-1">
          {/* Quick style switcher */}
          {!showConfig && (
            <div className="flex bg-gray-100 border border-slate-200 rounded-lg p-0.5 mr-1.5 text-gray-500">
              <button
                onClick={() => setStyle("list")}
                className={`p-1 rounded-md transition cursor-pointer ${style === "list" ? "bg-white text-gray-800 shadow-sm" : "hover:text-gray-800"}`}
                title="Lista simple"
              >
                <List className="w-3 h-3" />
              </button>
              <button
                onClick={() => setStyle("icons")}
                className={`p-1 rounded-md transition cursor-pointer ${style === "icons" ? "bg-white text-gray-800 shadow-sm" : "hover:text-gray-800"}`}
                title="Cuadrícula de iconos"
              >
                <Grid className="w-3 h-3" />
              </button>
              <button
                onClick={() => setStyle("cloud")}
                className={`p-1 rounded-md transition cursor-pointer ${style === "cloud" ? "bg-white text-gray-800 shadow-sm" : "hover:text-gray-800"}`}
                title="Nube de etiquetas"
              >
                <Cloud className="w-3 h-3" />
              </button>
              <button
                onClick={() => setStyle("detailed")}
                className={`p-1 rounded-md transition cursor-pointer ${style === "detailed" ? "bg-white text-gray-800 shadow-sm" : "hover:text-gray-800"}`}
                title="Lista detallada"
              >
                <Columns className="w-3 h-3" />
              </button>
            </div>
          )}

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
        <div className="flex-1 flex flex-col justify-center space-y-2 text-xs py-1 text-gray-700">
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Nombre</label>
              <input
                type="text"
                placeholder="Google"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Dirección (URL)</label>
              <input
                type="text"
                placeholder="google.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-slate-900"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Descripción (Opcional)</label>
            <input
              type="text"
              placeholder="Buscador global de información"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-none text-slate-900"
            />
          </div>
          <button
            onClick={handleAddBookmark}
            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 font-semibold rounded-lg text-white transition text-xs cursor-pointer"
          >
            Añadir Marcador
          </button>
        </div>
      ) : (
        <div className="flex-grow min-h-0 overflow-y-auto pr-0.5 py-1">
          {bookmarks.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[11px] text-slate-500 italic">
              No hay enlaces agregados aún.
            </div>
          ) : style === "list" ? (
            <div className="space-y-1">
              {bookmarks.map((bm) => (
                <a
                  key={bm.id}
                  href={bm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group px-2.5 py-2 bg-gray-50 border border-slate-100 hover:border-emerald-200 hover:bg-gray-100/80 rounded-xl flex items-center justify-between text-xs transition font-medium text-gray-700"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <Globe className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 transition" />
                    <span className="truncate">{bm.label}</span>
                  </div>
                  {isEditing ? (
                    <button
                      onClick={(e) => handleRemoveBookmark(bm.id, e)}
                      className="p-0.5 text-red-500 hover:text-red-700 hover:bg-gray-100 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  ) : (
                    <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                  )}
                </a>
              ))}
            </div>
          ) : style === "icons" ? (
            <div className="grid grid-cols-4 gap-2.5">
              {bookmarks.map((bm) => {
                const fav = getFaviconUrl(bm.url);
                return (
                  <a
                    key={bm.id}
                    href={bm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group p-2 bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center transition shadow-sm"
                    title={bm.label}
                  >
                    {isEditing && (
                      <button
                        onClick={(e) => handleRemoveBookmark(bm.id, e)}
                        className="absolute -top-1 -right-1 p-0.5 bg-white shadow hover:bg-red-50 border border-slate-200 rounded-full text-slate-500 hover:text-red-500 transition z-10 cursor-pointer"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                    <div className="w-9 h-9 bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 group-hover:scale-105 transition">
                      {fav ? (
                        <img
                          src={fav}
                          alt=""
                          className="w-5.5 h-5.5 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <Globe className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 mt-1.5 truncate w-full px-0.5 leading-tight">
                      {bm.label}
                    </span>
                  </a>
                );
              })}
            </div>
          ) : style === "cloud" ? (
            <div className="flex flex-wrap gap-1.5 justify-center py-1.5">
              {bookmarks.map((bm) => (
                <div key={bm.id} className="relative group">
                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-100/50 rounded-full text-[10px] font-bold text-emerald-700 tracking-tight transition inline-flex items-center space-x-1"
                  >
                    <span>{bm.label}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-emerald-600/60" />
                  </a>
                  {isEditing && (
                    <button
                      onClick={(e) => handleRemoveBookmark(bm.id, e)}
                      className="absolute -top-1 -right-1 p-0.5 bg-white shadow-sm text-red-500 hover:text-red-700 rounded-full border border-slate-200 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Detailed Layout */
            <div className="space-y-1.5">
              {bookmarks.map((bm) => (
                <a
                  key={bm.id}
                  href={bm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group p-2 bg-gray-50 border border-slate-100 hover:border-emerald-200 hover:bg-gray-100/80 rounded-xl flex items-start justify-between text-xs transition"
                >
                  <div className="min-w-0 flex-1 flex space-x-2.5">
                    <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-slate-100 mt-0.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-gray-800 group-hover:text-emerald-600 transition text-[11px] leading-snug">{bm.label}</h5>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{bm.description || bm.url}</p>
                    </div>
                  </div>
                  {isEditing ? (
                    <button
                      onClick={(e) => handleRemoveBookmark(bm.id, e)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-gray-100 rounded transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  ) : (
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition mt-1" />
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
