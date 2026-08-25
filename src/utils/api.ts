import { Dashboard, FocusSession, User } from "../types";
import { auth, db } from "../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";

// Recursive deep sanitizer to strip undefined values so Firestore setDoc/addDoc never rejects data
function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as any;
  }
  if (data === null || typeof data !== "object") {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as any;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      cleaned[key] = sanitizeForFirestore(value);
    }
  }
  return cleaned as T;
}

const getUserId = () => {
  return auth.currentUser?.uid || localStorage.getItem("ommm_user_id") || localStorage.getItem("senda_user_id");
};

// Default dashboards builder on the client side
function createDefaultDashboards(userId: string): Dashboard[] {
  return [
    {
      id: "personal",
      name: "Dashboard Personal",
      icon: "User",
      wallpaper: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
      wallpaperType: "gradient",
      widgets: [
        {
          id: "w-p-timemachine",
          type: "time-machine",
          title: "Máquina del Tiempo",
          x: 0, y: 0, w: 4, h: 5,
          color: "bg-slate-900/60 backdrop-blur-md border border-slate-700/50",
          data: {
            activeTab: "pomodoro",
            workTime: 25,
            shortBreak: 5,
            longBreak: 15,
            showSeconds: true,
            is24Hour: true,
            musicPresetId: "lofi",
            youtubeVideoId: "jfKfPfyJRdk",
            clocks: [
              { label: "Local", timezone: "local" },
              { label: "Madrid", timezone: "Europe/Madrid" },
              { label: "New York", timezone: "America/New_York" }
            ],
            countdowns: [
              { id: "cd-p1", label: "Fin de Año 2026", date: "2026-12-31T23:59:59", icon: "✨" },
              { id: "cd-p2", label: "Próxima Meta Personal", date: "2026-09-30T18:00:00", icon: "🎯" }
            ]
          }
        },
        {
          id: "w-p-planner",
          type: "daily-planner",
          title: "Planificador del Día",
          x: 4, y: 0, w: 5, h: 8,
          color: "bg-slate-900/60 backdrop-blur-md border border-indigo-500/20",
          data: {
            motivation: "¡Hoy es una excelente oportunidad para avanzar en tus metas y construir mejores hábitos!",
            planItems: [
              { id: "p1", text: "Meditación de la mañana (10 min)", checked: true },
              { id: "p2", text: "Revisar agenda de trabajo y prioridades", checked: false },
              { id: "p3", text: "Leer 20 páginas de mi libro actual", checked: false },
              { id: "p4", text: "Estirar el cuerpo / Caminar al aire libre", checked: false }
            ],
            debioHacerHoy: "Escribir en el journal al finalizar el día.",
            training: "Rutina de cardio + estiramientos ligeros",
            moodAm: "Energetico",
            moodPm: "",
            journal: "",
            visionBoard: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60",
            reading: { book: "Hábitos Atómicos", progress: 65 },
            unpaidBills: [
              { id: "b1", title: "Suscripción Cloud", amount: 15, dueDate: "2026-07-20", paid: false },
              { id: "b2", title: "Internet Hogar", amount: 45, dueDate: "2026-07-28", paid: false }
            ]
          }
        },
        {
          id: "w-p-habits",
          type: "habit-tracker",
          title: "Habit Loop",
          x: 9, y: 0, w: 3, h: 4,
          color: "bg-slate-900/60 backdrop-blur-md border border-emerald-500/20",
          data: {
            habits: [
              { id: "h1", name: "Meditación 10m", completedDays: ["2026-07-13", "2026-07-14", "2026-07-15"], color: "#10b981", streak: 3 },
              { id: "h2", name: "Tomar 2.5L Agua", completedDays: ["2026-07-14", "2026-07-15"], color: "#3b82f6", streak: 2 },
              { id: "h3", name: "Leer 20 mins", completedDays: ["2026-07-12", "2026-07-14", "2026-07-15"], color: "#f59e0b", streak: 2 },
              { id: "h4", name: "Dormir 8 Horas", completedDays: ["2026-07-15"], color: "#8b5cf6", streak: 1 }
            ]
          }
        },
        {
          id: "w-p-bookmarks",
          type: "bookmarks",
          title: "Mis Enlaces Rápidos",
          x: 0, y: 5, w: 4, h: 4,
          color: "bg-slate-900/60 backdrop-blur-md border border-slate-700/50",
          data: {
            displayStyle: "icons",
            bookmarks: [
              { id: "bm1", label: "Gmail", url: "https://mail.google.com", icon: "Mail" },
              { id: "bm2", label: "YouTube", url: "https://youtube.com", icon: "Youtube" },
              { id: "bm3", label: "Google Drive", url: "https://drive.google.com", icon: "HardDrive" },
              { id: "bm4", label: "Twitter / X", url: "https://twitter.com", icon: "Twitter" },
              { id: "bm5", label: "GitHub", url: "https://github.com", icon: "Github" },
              { id: "bm6", label: "Calendario", url: "https://calendar.google.com", icon: "Calendar" }
            ]
          }
        },
        {
          id: "w-p-notes",
          type: "notes",
          title: "Notas Rápidas",
          x: 9, y: 4, w: 3, h: 4,
          color: "bg-amber-500/10 backdrop-blur-md border border-amber-500/30 text-amber-100",
          data: {
            title: "Ideas Creativas",
            text: "Investigar sobre la integración de widgets RSS personalizados y optimización del tiempo. ¡El hábito hace al maestro!",
            emojiIcon: "💡"
          }
        }
      ]
    },
    {
      id: "trabajo",
      name: "Trabajo",
      icon: "Briefcase",
      wallpaper: "linear-gradient(135deg, #020617 0%, #0f172a 100%)",
      wallpaperType: "gradient",
      widgets: [
        {
          id: "w-t-timemachine",
          type: "time-machine",
          title: "Máquina del Tiempo",
          x: 0, y: 0, w: 4, h: 5,
          color: "bg-slate-900/60 backdrop-blur-md border border-blue-500/30",
          data: {
            activeTab: "pomodoro",
            workTime: 45,
            shortBreak: 10,
            longBreak: 20,
            showSeconds: true,
            is24Hour: true,
            musicPresetId: "synth",
            youtubeVideoId: "4xDzrJKXOOY",
            clocks: [
              { label: "Local", timezone: "local" },
              { label: "Madrid", timezone: "Europe/Madrid" },
              { label: "New York", timezone: "America/New_York" }
            ],
            countdowns: [
              { id: "cd-t1", label: "Entrega de Proyecto", date: "2026-09-15T17:00:00", icon: "💼" }
            ]
          }
        },
        {
          id: "w-t-tasks",
          type: "lists",
          title: "Tareas Laborales",
          x: 4, y: 0, w: 4, h: 5,
          color: "bg-slate-900/60 backdrop-blur-md border border-slate-700/50",
          data: {
            name: "Pendientes Savora",
            tasks: [
              { id: "t1", text: "Subir archivo plano Palermo", done: true, priority: "high" },
              { id: "t2", text: "Crear agente con Knowledge base Palermo", done: false, priority: "high" },
              { id: "t3", text: "Crear whatsapp para Palermo", done: false, priority: "medium" },
              { id: "t4", text: "Preguntar quien maneja redes sociales", done: false, priority: "low" },
              { id: "t5", text: "Cobrar saldo Palermo", done: false, priority: "high" }
            ]
          }
        },
        {
          id: "w-t-bookmarks",
          type: "bookmarks",
          title: "Links de Trabajo",
          x: 8, y: 0, w: 4, h: 5,
          color: "bg-slate-900/60 backdrop-blur-md border border-slate-700/50",
          data: {
            displayStyle: "detailed",
            bookmarks: [
              { id: "l1", label: "Confluence", url: "https://atlassian.com", description: "Documentación interna" },
              { id: "l2", label: "Office 365", url: "https://office.com", description: "Correo y planillas corporativas" },
              { id: "l3", label: "Restaurante Palermo", url: "https://restaurantepalermo.com", description: "Sitio del cliente principal" },
              { id: "l4", label: "WhatsApp Web", url: "https://web.whatsapp.com", description: "Chat de soporte" }
            ]
          }
        },
        {
          id: "w-t-currency",
          type: "currency",
          title: "Conversor de Monedas",
          x: 0, y: 5, w: 4, h: 4,
          color: "bg-slate-900/60 backdrop-blur-md border border-emerald-500/20",
          data: {
            fromCurrency: "USD",
            toCurrency: "ARS",
            amount: 100
          }
        }
      ]
    },
    {
      id: "estudio",
      name: "Estudio",
      icon: "GraduationCap",
      wallpaper: "linear-gradient(135deg, #020617 0%, #1e1b4b 100%)",
      wallpaperType: "gradient",
      widgets: [
        {
          id: "w-e-timemachine",
          type: "time-machine",
          title: "Máquina del Tiempo",
          x: 0, y: 0, w: 4, h: 5,
          color: "bg-slate-900/60 backdrop-blur-md border border-violet-500/30",
          data: {
            activeTab: "pomodoro",
            workTime: 30,
            shortBreak: 5,
            longBreak: 15,
            showSeconds: true,
            is24Hour: true,
            musicPresetId: "piano",
            youtubeVideoId: "Dx5qFedd3Y4",
            clocks: [
              { label: "Local", timezone: "local" },
              { label: "Londres", timezone: "Europe/London" }
            ],
            countdowns: [
              { id: "cd-e1", label: "Examen Final / Certificación", date: "2026-10-15T09:00:00", icon: "🎓" }
            ]
          }
        },
        {
          id: "w-e-tasks",
          type: "google-tasks",
          title: "Plan de Estudio",
          x: 4, y: 0, w: 4, h: 8,
          color: "bg-slate-900/60 backdrop-blur-md border border-violet-500/20",
          data: {
            taskLists: [
              {
                id: "l-react",
                name: "Curso de React Avanzado",
                tasks: [
                  { id: "rt1", text: "Sección 12: Custom Hooks y Rendimiento", done: true, priority: "high" },
                  { id: "rt2", text: "Implementar optimizaciones con useMemo", done: false, priority: "medium" },
                  { id: "rt3", text: "Resolver el desafío práctico de Zustand", done: false, priority: "high" }
                ]
              },
              {
                id: "l-english",
                name: "Inglés de Negocios",
                tasks: [
                  { id: "en1", text: "Práctica de Speaking interactiva", done: false, priority: "medium" },
                  { id: "en2", text: "Aprender 10 nuevos verbos compuestos", done: true, priority: "low" }
                ]
              }
            ]
          }
        },
        {
          id: "w-e-calc",
          type: "calculator",
          title: "Calculadora de Operaciones",
          x: 8, y: 0, w: 4, h: 4,
          color: "bg-slate-900/60 backdrop-blur-md border border-slate-700/50",
          data: {}
        },
        {
          id: "w-e-notes",
          type: "notes",
          title: "Apuntes de Clase",
          x: 8, y: 4, w: 4, h: 4,
          color: "bg-slate-900/60 backdrop-blur-md border border-slate-700/50",
          data: {
            title: "Concepto Clave",
            text: "En React 19, las acciones simplifican la gestión del estado pendiente, errores y reintentos al enviar formularios. ¡No olvides usarlos!",
            emojiIcon: "⚛️"
          }
        }
      ]
    },
    {
      id: "hobbies",
      name: "Hobbies",
      icon: "Gamepad2",
      wallpaper: "linear-gradient(135deg, #180828 0%, #090212 100%)",
      wallpaperType: "gradient",
      widgets: [
        {
          id: "w-h-timemachine",
          type: "time-machine",
          title: "Máquina del Tiempo",
          x: 0, y: 0, w: 4, h: 5,
          color: "bg-slate-900/60 backdrop-blur-md border border-purple-500/30",
          data: {
            activeTab: "music",
            workTime: 25,
            shortBreak: 5,
            longBreak: 15,
            showSeconds: true,
            is24Hour: true,
            musicPresetId: "jazz",
            youtubeVideoId: "5wSBy6Yq_A8",
            clocks: [
              { label: "Local", timezone: "local" },
              { label: "Tokio", timezone: "Asia/Tokyo" }
            ],
            countdowns: [
              { id: "cd-h1", label: "Lanzamiento Nuevo Juego / Álbum", date: "2026-11-20T00:00:00", icon: "🎮" }
            ]
          }
        },
        {
          id: "w-h-news",
          type: "newsfeed",
          title: "Novedades y Artículos",
          x: 4, y: 0, w: 5, h: 8,
          color: "bg-slate-900/60 backdrop-blur-md border border-purple-500/20",
          data: {
            feedUrl: "https://news.google.com/rss",
            feedTitle: "Tecnología e Inspiración",
            items: [
              { title: "Tendencias de desarrollo web para el 2026", link: "https://example.com", date: "Hace 2 horas", source: "Tech Radar" },
              { title: "El resurgimiento de los sintetizadores analógicos en el audio", link: "https://example.com", date: "Ayer", source: "Music Maker" },
              { title: "Cómo diseñar dashboards minimalistas que aumentan la retención", link: "https://example.com", date: "Hace 3 días", source: "Design Weekly" }
            ]
          }
        },
        {
          id: "w-h-image",
          type: "image",
          title: "Inspiración Visual",
          x: 9, y: 0, w: 3, h: 4,
          color: "bg-slate-900/60 backdrop-blur-md border border-pink-500/20",
          data: {
            imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=60",
            frameStyle: "polaroid",
            caption: "Configuración ideal de setup para el enfoque y la paz mental"
          }
        },
        {
          id: "w-h-bookmarks",
          type: "bookmarks",
          title: "Inspiración",
          x: 9, y: 4, w: 3, h: 4,
          color: "bg-slate-900/60 backdrop-blur-md border border-slate-700/50",
          data: {
            displayStyle: "cloud",
            bookmarks: [
              { id: "hbm1", label: "Pinterest", url: "https://pinterest.com" },
              { id: "hbm2", label: "Behance", url: "https://behance.net" },
              { id: "hbm3", label: "Spotify", url: "https://spotify.com" },
              { id: "hbm4", label: "Reddit/r/webdev", url: "https://reddit.com/r/webdev" },
              { id: "hbm5", label: "Dribbble", url: "https://dribbble.com" }
            ]
          }
        }
      ]
    },
    {
      id: "hogar",
      name: "Hogar",
      icon: "Home",
      wallpaper: "linear-gradient(135deg, #0f172a 0%, #064e3b 100%)",
      wallpaperType: "gradient",
      widgets: [
        {
          id: "w-ho-timemachine",
          type: "time-machine",
          title: "Máquina del Tiempo",
          x: 0, y: 0, w: 4, h: 5,
          color: "bg-slate-900/60 backdrop-blur-md border border-emerald-500/30",
          data: {
            activeTab: "clock",
            workTime: 20,
            shortBreak: 5,
            longBreak: 15,
            showSeconds: true,
            is24Hour: true,
            musicPresetId: "nature",
            youtubeVideoId: "M0AWBn_bS0U",
            clocks: [
              { label: "Local", timezone: "local" },
              { label: "Buenos Aires", timezone: "America/Argentina/Buenos_Aires" }
            ],
            countdowns: [
              { id: "cd-ho1", label: "Vacaciones en Familia", date: "2026-12-15T00:00:00", icon: "🌴" }
            ]
          }
        },
        {
          id: "w-ho-tasks",
          type: "lists",
          title: "Lista de Compras y Hogar",
          x: 4, y: 0, w: 4, h: 6,
          color: "bg-slate-900/60 backdrop-blur-md border border-emerald-500/20",
          data: {
            name: "Supermercado Semanal",
            tasks: [
              { id: "ho1", text: "Frutas: bananas, manzanas, palta", done: false, priority: "high" },
              { id: "ho2", text: "Café de grano premium", done: true, priority: "high" },
              { id: "ho3", text: "Leche vegetal / avena", done: false, priority: "medium" },
              { id: "ho4", text: "Limpiador multiusos ecológico", done: false, priority: "low" }
            ]
          }
        },
        {
          id: "w-ho-weather",
          type: "weather",
          title: "Clima Comparativo",
          x: 8, y: 0, w: 4, h: 5,
          color: "bg-slate-900/60 backdrop-blur-md border border-sky-500/20",
          data: {
            cities: ["Buenos Aires", "Madrid", "Miami"],
            activeCity: "Buenos Aires"
          }
        }
      ]
    }
  ];
}

export const api = {
  getUserId,

  setUserId(id: string) {
    if (id) {
      localStorage.setItem("ommm_user_id", id);
    } else {
      localStorage.removeItem("ommm_user_id");
      localStorage.removeItem("senda_user_id");
    }
  },

  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if email verification is completed
      if (!user.emailVerified) {
        // Sign out right away to prevent unauthorized access
        await firebaseSignOut(auth);
        throw new Error("EMAIL_NOT_VERIFIED");
      }

      // Fetch user profile from Firestore
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      let username = user.displayName || "Usuario";
      let photoURL = user.photoURL || "";

      if (docSnap.exists()) {
        const data = docSnap.data();
        username = data.username || username;
        photoURL = data.photoURL || photoURL;
      }

      return {
        id: user.uid,
        email: user.email || "",
        username,
        photoURL,
      };
    } catch (err: any) {
      if (err.message === "EMAIL_NOT_VERIFIED") {
        throw new Error("Por favor verifica tu correo. Revisa tu bandeja de entrada para activar tu cuenta.");
      }
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        throw new Error("Credenciales incorrectas. Verifica tu correo y contraseña.");
      }
      throw new Error(err.message || "Error al iniciar sesión.");
    }
  },

  async resendVerification(email: string, password: string) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    if (!user.emailVerified) {
      await sendEmailVerification(user);
    }
    await firebaseSignOut(auth);
  },

  async signup(email: string, username: string, password: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Set auth display name
      await updateProfile(user, { displayName: username });

      // Send verification email
      await sendEmailVerification(user);

      // Initialize Firestore document for the user
      const defaultDashboards = sanitizeForFirestore(createDefaultDashboards(user.uid));
      await setDoc(doc(db, "users", user.uid), {
        email: email.toLowerCase(),
        username,
        photoURL: "",
        createdAt: new Date().toISOString(),
        dashboards: defaultDashboards,
      });

      // Sign out immediately because they must verify email first
      await firebaseSignOut(auth);

      return {
        id: user.uid,
        email: user.email || "",
        username,
        photoURL: "",
      };
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        throw new Error("Este correo ya está registrado.");
      }
      if (err.code === "auth/weak-password") {
        throw new Error("La contraseña es muy débil. Usa al menos 6 caracteres.");
      }
      throw new Error(err.message || "Error al registrarse.");
    }
  },

  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      const user = res.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      let username = user.displayName || "Usuario Google";
      let photoURL = user.photoURL || "";

      if (!docSnap.exists()) {
        const defaultDashboards = sanitizeForFirestore(createDefaultDashboards(user.uid));
        await setDoc(docRef, {
          email: user.email?.toLowerCase() || "",
          username,
          photoURL,
          createdAt: new Date().toISOString(),
          dashboards: defaultDashboards,
        });
      } else {
        const data = docSnap.data();
        username = data.username || username;
        photoURL = data.photoURL || photoURL;
      }

      return {
        id: user.uid,
        email: user.email || "",
        username,
        photoURL,
      };
    } catch (err: any) {
      throw new Error(err.message || "Error al iniciar sesión con Google.");
    }
  },

  async logout() {
    await firebaseSignOut(auth);
    localStorage.removeItem("ommm_user_id");
    localStorage.removeItem("senda_user_id");
  },

  async getDashboards(): Promise<Dashboard[]> {
    const userId = getUserId();
    if (!userId) return [];
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.dashboards || [];
    }
    return [];
  },

  async saveDashboards(dashboards: Dashboard[]) {
    const userId = getUserId();
    if (!userId) return;
    const docRef = doc(db, "users", userId);
    const sanitizedDashboards = sanitizeForFirestore(dashboards);
    await setDoc(docRef, { dashboards: sanitizedDashboards }, { merge: true });
  },

  async getFocusSessions(): Promise<FocusSession[]> {
    const userId = getUserId();
    if (!userId) return [];
    const sessionsCol = collection(db, "users", userId, "sessions");
    const querySnapshot = await getDocs(sessionsCol);
    const sessions: FocusSession[] = [];
    querySnapshot.forEach((docSnap) => {
      sessions.push({ id: docSnap.id, ...docSnap.data() } as FocusSession);
    });
    // Sort sessions by startTime ascending
    return sessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  },

  async saveFocusSession(session: Omit<FocusSession, "id">): Promise<FocusSession> {
    const userId = getUserId();
    if (!userId) throw new Error("No autorizado");
    const sessionsCol = collection(db, "users", userId, "sessions");
    const sanitizedSession = sanitizeForFirestore(session);
    const docRef = await addDoc(sessionsCol, sanitizedSession);
    return { id: docRef.id, ...sanitizedSession } as FocusSession;
  },

  async uploadProfilePicture(base64Image: string): Promise<string> {
    const userId = getUserId();
    if (!userId) throw new Error("No autorizado");
    const docRef = doc(db, "users", userId);
    await setDoc(docRef, { photoURL: base64Image }, { merge: true });
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { photoURL: base64Image });
    }
    return base64Image;
  },

  async updateUsername(username: string): Promise<string> {
    const userId = getUserId();
    if (!userId) throw new Error("No autorizado");
    const docRef = doc(db, "users", userId);
    await setDoc(docRef, { username }, { merge: true });
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: username });
    }
    return username;
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

  async analyzeProductivity(dashboards?: Dashboard[], sessions?: FocusSession[]): Promise<{ summary: string; tips: string[]; performanceRating: string }> {
    const userId = getUserId();
    if (!userId) throw new Error("No autorizado");

    const finalDashboards = dashboards || await this.getDashboards();
    const finalSessions = sessions || await this.getFocusSessions();

    const res = await fetch("/api/gemini/analyze-productivity", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-user-id": userId 
      },
      body: JSON.stringify({ dashboards: finalDashboards, sessions: finalSessions }),
    });
    if (!res.ok) throw new Error("Error al analizar estadísticas.");
    return res.json();
  },
};
