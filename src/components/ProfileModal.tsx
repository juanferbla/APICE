import React, { useState, useRef } from "react";
import { X, Camera, User, Mail, Save, Sparkles, Loader2, Check } from "lucide-react";
import { api } from "../utils/api";
import { User as UserType } from "../types";

interface ProfileModalProps {
  user: UserType;
  onClose: () => void;
  onUpdateUser: (updatedUser: UserType) => void;
}

export default function ProfileModal({ user, onClose, onUpdateUser }: ProfileModalProps) {
  const [username, setUsername] = useState(user.username);
  const [photoURL, setPhotoURL] = useState(user.photoURL || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("La imagen es demasiado grande. Elige una menor a 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        // Create canvas to resize/compress the image
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
          setPhotoURL(compressedBase64);
          setError(null);
        }
      };
    };
    reader.onerror = () => {
      setError("Error al leer el archivo.");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!username.trim()) {
      setError("El nombre de usuario no puede estar vacío.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (username !== user.username) {
        await api.updateUsername(username);
      }
      if (photoURL !== (user.photoURL || "")) {
        await api.uploadProfilePicture(photoURL);
      }

      onUpdateUser({
        ...user,
        username,
        photoURL,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Error al actualizar el perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="profile-modal-container" className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight font-display flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Mi Cuenta de Ommm</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Personaliza tu perfil, sube tu foto y configura los detalles de tu cuenta.
          </p>
        </div>

        {/* Profile Picture section */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center shadow-inner relative">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white font-black text-2xl font-display">
                  {username ? username.slice(0, 2).toUpperCase() : user.email.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full border border-white shadow-md transition cursor-pointer"
              title="Cambiar foto de perfil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">
            Foto de Perfil
          </span>
        </div>

        {/* Input fields */}
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 animate-pulse">
              <Check className="w-4 h-4" />
              <span>¡Perfil guardado correctamente!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Nombre de Usuario</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: Juan Fernando"
              className="w-full px-4 py-2.5 bg-gray-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-sm text-slate-900 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>Correo Electrónico (No modificable)</span>
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 outline-none cursor-not-allowed font-medium"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer text-center"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-indigo-600/15"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
