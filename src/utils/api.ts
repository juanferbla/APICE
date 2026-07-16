import { Dashboard, FocusSession, ProductivityStats } from "../types";

const getUserId = () => localStorage.getItem("senda_user_id");

export const api = {
  getUserId,

  setUserId(id: string) {
    if (id) localStorage.setItem("senda_user_id", id);
    else localStorage.removeItem("senda_user_id");
  },

  async login(email: string, password: string) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al iniciar sesión.");
    }
    return res.json();
  },

  async signup(email: string, username: string, password: string) {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al registrarse.");
    }
    return res.json();
  },

  async getDashboards(): Promise<Dashboard[]> {
    const userId = getUserId();
    if (!userId) return [];
    const res = await fetch("/api/dashboards", {
      headers: { "x-user-id": userId },
    });
    if (!res.ok) throw new Error("No se pudieron cargar los tableros.");
    return res.json();
  },

  async saveDashboards(dashboards: Dashboard[]) {
    const userId = getUserId();
    if (!userId) return;
    const res = await fetch("/api/dashboards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify(dashboards),
    });
    if (!res.ok) throw new Error("No se pudieron guardar los tableros.");
    return res.json();
  },

  async getFocusSessions(): Promise<FocusSession[]> {
    const userId = getUserId();
    if (!userId) return [];
    const res = await fetch("/api/focus/sessions", {
      headers: { "x-user-id": userId },
    });
    if (!res.ok) throw new Error("No se pudieron cargar las sesiones.");
    return res.json();
  },

  async saveFocusSession(session: Omit<FocusSession, "id">): Promise<FocusSession> {
    const userId = getUserId();
    if (!userId) throw new Error("No autorizado");
    const res = await fetch("/api/focus/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify(session),
    });
    if (!res.ok) throw new Error("No se pudo guardar la sesión de enfoque.");
    return res.json();
  },

  async generateMotivation(mood: string, activityState: string, focusGoal: string) {
    const res = await fetch("/api/gemini/generate-motivation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood, activityState, focusGoal }),
    });
    if (!res.ok) return null;
    return res.json();
  },

  async analyzeProductivity(): Promise<{ summary: string; tips: string[]; performanceRating: string }> {
    const userId = getUserId();
    if (!userId) throw new Error("No autorizado");
    const res = await fetch("/api/gemini/analyze-productivity", {
      method: "POST",
      headers: { "x-user-id": userId },
    });
    if (!res.ok) throw new Error("Error al analizar estadísticas.");
    return res.json();
  },
};
