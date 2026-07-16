import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "db.json");

app.use(express.json());

// Initialize Gemini SDK with telemetry header
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Simple SHA-256 hashing helper using native crypto
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Ensure DB file exists
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      users: [],
      dashboards: {}, // user_id -> Dashboard[]
      focusSessions: {}, // user_id -> FocusSession[]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.error("Error reading database file, resetting:", err);
    const defaultData = { users: [], dashboards: {}, focusSessions: {} };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
}

function writeDB(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Generate default beautiful dashboards for a user
function createDefaultDashboards(userId: string) {
  const dashboards = [
    {
      id: "personal",
      name: "Dashboard Personal",
      icon: "User",
      wallpaper: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", // Indigo/Slate dark
      wallpaperType: "gradient",
      widgets: [
        {
          id: "w-p-clock",
          type: "clock",
          title: "Mi Tiempo",
          x: 0, y: 0, w: 4, h: 4,
          color: "bg-slate-900/60 backdrop-blur-md border border-slate-700/50",
          data: {
            showAnalog: true,
            showSeconds: true,
            countdownDate: "2026-12-31T23:59:59",
            countdownLabel: "Fin de Año",
            clocks: [
              { label: "Local", timezone: "local" },
              { label: "Madrid", timezone: "Europe/Madrid" },
              { label: "New York", timezone: "America/New_York" }
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
          x: 0, y: 4, w: 4, h: 4,
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
      wallpaper: "linear-gradient(135deg, #020617 0%, #0f172a 100%)", // Dark Slate/Deep Blue
      wallpaperType: "gradient",
      widgets: [
        {
          id: "w-t-focus",
          type: "lists", // Simulates focus list
          title: "Estado de Enfoque",
          x: 0, y: 0, w: 3, h: 3,
          color: "bg-slate-900/60 backdrop-blur-md border border-blue-500/20",
          data: {
            name: "Llamadas e Interacciones",
            tasks: [
              { id: "t-f1", text: "En llamada con clientes", done: false, priority: "high" },
              { id: "t-f2", text: "Trabajando en código core", done: true, priority: "high" },
              { id: "t-f3", text: "Creatividad / Brainstorming", done: false, priority: "medium" }
            ]
          }
        },
        {
          id: "w-t-pomodoro",
          type: "pomodoro",
          title: "Temporizador de Enfoque",
          x: 3, y: 0, w: 5, h: 4,
          color: "bg-red-950/40 backdrop-blur-md border border-red-500/30",
          data: {
            workTime: 25,
            shortBreak: 5,
            longBreak: 15
          }
        },
        {
          id: "w-t-tasks",
          type: "lists",
          title: "Tareas Laborales",
          x: 8, y: 0, w: 4, h: 5,
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
          x: 0, y: 3, w: 3, h: 5,
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
          x: 3, y: 4, w: 5, h: 4,
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
      wallpaper: "linear-gradient(135deg, #020617 0%, #1e1b4b 100%)", // Dark Indigo/Slate
      wallpaperType: "gradient",
      widgets: [
        {
          id: "w-e-tasks",
          type: "google-tasks",
          title: "Plan de Estudio",
          x: 0, y: 0, w: 4, h: 8,
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
          x: 4, y: 0, w: 4, h: 4,
          color: "bg-slate-900/60 backdrop-blur-md border border-slate-700/50",
          data: {}
        },
        {
          id: "w-e-notes",
          type: "notes",
          title: "Apuntes de Clase",
          x: 8, y: 0, w: 4, h: 4,
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
      wallpaper: "linear-gradient(135deg, #180828 0%, #090212 100%)", // Purple/Violet deep dark
      wallpaperType: "gradient",
      widgets: [
        {
          id: "w-h-news",
          type: "newsfeed",
          title: "Novedades y Artículos",
          x: 0, y: 0, w: 5, h: 8,
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
          x: 5, y: 0, w: 4, h: 5,
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
          x: 9, y: 0, w: 3, h: 5,
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
      wallpaper: "linear-gradient(135deg, #0f172a 0%, #064e3b 100%)", // Emerald green dark
      wallpaperType: "gradient",
      widgets: [
        {
          id: "w-ho-tasks",
          type: "lists",
          title: "Lista de Compras y Hogar",
          x: 0, y: 0, w: 4, h: 6,
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
          x: 4, y: 0, w: 4, h: 5,
          color: "bg-slate-900/60 backdrop-blur-md border border-sky-500/20",
          data: {
            cities: ["Buenos Aires", "Madrid", "Miami"],
            activeCity: "Buenos Aires"
          }
        },
        {
          id: "w-ho-calendar",
          type: "calendar",
          title: "Agenda de Google",
          x: 8, y: 0, w: 4, h: 6,
          color: "bg-slate-900/60 backdrop-blur-md border border-slate-700/50",
          data: {
            // Embed google calendar code or placeholder layout with custom interactive schedule
            googleEmbedSrc: "https://calendar.google.com/calendar/embed?src=en.christian%23holiday%40group.v.calendar.google.com"
          }
        }
      ]
    }
  ];

  return dashboards;
}

// Generate default mock focus stats and habit histories for a beautiful reporting dashboard
function createDefaultFocusSessions(userId: string) {
  const sessions = [];
  const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const dateBase = new Date();
  dateBase.setDate(dateBase.getDate() - 7);

  // Focus activities
  const states = ["trabajando", "creativo", "reunion", "llamada", "distraido", "off"];
  const durations = [7200, 5400, 3600, 1800, 1200, 900];

  for (let i = 0; i < 35; i++) {
    const actDate = new Date(dateBase);
    actDate.setDate(actDate.getDate() + Math.floor(i / 5));
    actDate.setHours(9 + (i % 5) * 2, 0, 0);

    const state = states[i % states.length];
    const duration = durations[i % durations.length];

    sessions.push({
      id: `s-${i}`,
      startTime: actDate.toISOString(),
      endTime: new Date(actDate.getTime() + duration * 1000).toISOString(),
      activityState: state,
      durationSeconds: duration
    });
  }
  return sessions;
}

// Ensure at least one mock user exists for immediate launch
function seedDemoUser() {
  const db = readDB();
  const demoEmail = "juanferbla@gmail.com";
  let user = db.users.find((u: any) => u.email === demoEmail);
  if (!user) {
    const demoId = "user-demo-123";
    user = {
      id: demoId,
      email: demoEmail,
      username: "Juan Fernando",
      password: hashPassword("123456") // Simple password
    };
    db.users.push(user);
    db.dashboards[demoId] = createDefaultDashboards(demoId);
    db.focusSessions[demoId] = createDefaultFocusSessions(demoId);
    writeDB(db);
    console.log("Demo user seeded successfully!");
  }
}

// Ensure database is initialized with demo data on boot
readDB();
seedDemoUser();

// --- Auth Routes ---
app.post("/api/auth/signup", (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: "Por favor, completa todos los campos." });
  }

  const db = readDB();
  const exists = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Este correo ya está registrado." });
  }

  const userId = `user-${Date.now()}`;
  const newUser = {
    id: userId,
    email: email.toLowerCase(),
    username,
    password: hashPassword(password)
  };

  db.users.push(newUser);
  db.dashboards[userId] = createDefaultDashboards(userId);
  db.focusSessions[userId] = [];
  writeDB(db);

  res.json({ id: newUser.id, email: newUser.email, username: newUser.username });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Por favor, ingresa correo y contraseña." });
  }

  const db = readDB();
  const user = db.users.find(
    (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === hashPassword(password)
  );

  if (!user) {
    return res.status(401).json({ error: "Credenciales incorrectas. Intenta con juanferbla@gmail.com / 123456" });
  }

  res.json({ id: user.id, email: user.email, username: user.username });
});

// --- Dashboards & Widgets API ---
app.get("/api/dashboards", (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "No autorizado." });
  }
  const db = readDB();
  const dashboards = db.dashboards[userId] || createDefaultDashboards(userId);
  res.json(dashboards);
});

app.post("/api/dashboards", (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "No autorizado." });
  }
  const db = readDB();
  db.dashboards[userId] = req.body;
  writeDB(db);
  res.json({ success: true, message: "Dashboards guardados con éxito." });
});

// --- Focus sessions / Activity state API ---
app.get("/api/focus/sessions", (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "No autorizado." });
  }
  const db = readDB();
  const sessions = db.focusSessions[userId] || [];
  res.json(sessions);
});

app.post("/api/focus/session", (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const { startTime, endTime, activityState, durationSeconds } = req.body;
  if (!userId) {
    return res.status(401).json({ error: "No autorizado." });
  }

  const db = readDB();
  if (!db.focusSessions[userId]) {
    db.focusSessions[userId] = [];
  }

  const newSession = {
    id: `session-${Date.now()}`,
    startTime,
    endTime,
    activityState,
    durationSeconds
  };

  db.focusSessions[userId].push(newSession);
  writeDB(db);
  res.json(newSession);
});

function safeParseJSON(text: string | undefined): any {
  if (!text) return {};
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "");
    cleaned = cleaned.replace(/\n```$/, "");
    cleaned = cleaned.trim();
  }
  return JSON.parse(cleaned);
}

// --- Gemini AI routes ---
app.post("/api/gemini/generate-motivation", async (req, res) => {
  const { mood, activityState, focusGoal } = req.body;
  if (!ai) {
    return res.json({
      quote: "¡La constancia y el enfoque superan cualquier reto! Sigue adelante con fuerza.",
      author: "Senda Coach (Modo Local)",
      strategy: "Enfócate en completar tu temporizador pomodoro sin interrupciones."
    });
  }

  try {
    const prompt = `Dame una frase motivacional del día corta (máximo 120 caracteres) y un consejo de estrategia de 1 línea para hoy.
    Mi estado de ánimo inicial: "${mood || 'Normal'}".
    Mi actividad actual: "${activityState || 'Planificando el día'}".
    Mi objetivo o meta actual: "${focusGoal || 'Rendir mi tiempo y mejorar hábitos'}".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: {
              type: Type.STRING,
              description: "Frase inspiradora motivante corta en español"
            },
            author: {
              type: Type.STRING,
              description: "Nombre de un pensador célebre, filósofo o 'Senda Coach AI'"
            },
            strategy: {
              type: Type.STRING,
              description: "Estrategia corta práctica en español para rendir el tiempo hoy"
            }
          },
          required: ["quote", "author", "strategy"]
        }
      }
    });

    const data = safeParseJSON(response.text);
    res.json(data);
  } catch (err) {
    console.error("Gemini Motivation generation failed:", err);
    res.json({
      quote: "No te midas por lo que has logrado, sino por lo que deberías haber logrado con tu habilidad.",
      author: "John Wooden",
      strategy: "Enfócate en completar tu temporizador pomodoro sin interrupciones."
    });
  }
});

app.post("/api/gemini/analyze-productivity", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const db = readDB();
  const sessions = db.focusSessions[userId] || [];
  const dashboards = db.dashboards[userId] || [];

  // Gather basic statistics to feed Gemini
  const activeHabits: string[] = [];
  dashboards.forEach((d: any) => {
    d.widgets.forEach((w: any) => {
      if (w.type === "habit-tracker" && w.data?.habits) {
        w.data.habits.forEach((h: any) => {
          activeHabits.push(`${h.name} (racha: ${h.streak})`);
        });
      }
    });
  });

  const totalFocusSeconds = sessions.reduce((acc: number, s: any) => acc + (s.durationSeconds || 0), 0);
  const totalFocusMinutes = Math.round(totalFocusSeconds / 60);

  if (!ai) {
    return res.json({
      summary: `Has acumulado ${totalFocusMinutes} minutos de enfoque registrado. Tus hábitos activos son: ${activeHabits.join(", ") || "Ninguno aún"}.`,
      tips: [
        "Establece límites claros para evitar la fatiga mental.",
        "Incrementa la duración de tus bloques creativos en horas de mayor energía.",
        "Asegúrate de registrar tus hábitos diarios para mantener las rachas activas."
      ],
      performanceRating: "Excelente Progreso"
    });
  }

  try {
    const prompt = `Analiza estos datos de productividad semanales del usuario y ofrécele un informe de alto rendimiento ejecutivo personalizado, profesional, directo y motivante en español:
    - Minutos de Enfoque Total Registrados: ${totalFocusMinutes} minutos
    - Hábitos Activos y Rachas: ${JSON.stringify(activeHabits)}
    - Historial de Estados de Enfoque (actividad/reunión/llamada/distraído): ${JSON.stringify(
      sessions.slice(-15).map((s) => ({ state: s.activityState, date: s.startTime }))
    )}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Un resumen ejecutivo de 3-4 líneas analizando sus fortalezas, hábitos y calidad de enfoque esta semana."
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de 3 consejos prácticos, uno para tiempo laboral, uno para hábitos personales y otro para la agenda."
            },
            performanceRating: {
              type: Type.STRING,
              description: "Calificación corta de rendimiento (ej: Alto Rendimiento, Construyendo Enfoque, etc.)"
            }
          },
          required: ["summary", "tips", "performanceRating"]
        }
      }
    });

    const data = safeParseJSON(response.text);
    res.json(data);
  } catch (err) {
    console.error("Gemini stats analysis failed:", err);
    res.json({
      summary: `Análisis automático no disponible temporalmente. Has registrado un total de ${totalFocusMinutes} minutos de enfoque con foco activo en tus hábitos de auto-disciplina.`,
      tips: [
        "Aprovecha las primeras horas del día para el trabajo de máxima complejidad.",
        "Divide tus grandes metas mensuales en pequeñas victorias diarias organizadas en tu plan de hoy.",
        "Evita el multitasking para mantener tu nivel de atención en niveles óptimos."
      ],
      performanceRating: "Modo Estándar Activo"
    });
  }
});

// Serve Vite dev server or static dist folder
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
