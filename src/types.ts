/**
 * Types for Dashboard de Productividad y Enlaces
 */

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface Bookmark {
  id: string;
  label: string;
  url: string;
  icon?: string;
  description?: string;
}

export type BookmarkStyle = 'list' | 'icons' | 'cloud' | 'detailed';

export interface TaskItem {
  id: string;
  text: string;
  done: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface TaskList {
  id: string;
  name: string;
  tasks: TaskItem[];
}

export interface BillItem {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  paid: boolean;
}

export interface Habit {
  id: string;
  name: string;
  completedDays: string[]; // Dates in YYYY-MM-DD format
  color: string;
  streak: number;
}

export interface FocusSession {
  id: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  activityState: string; // 'llamada' | 'reunion' | 'trabajando' | 'creativo' | 'distraido' | 'off'
  durationSeconds?: number;
}

export interface Widget {
  id: string;
  type: 'clock' | 'pomodoro' | 'weather' | 'calendar' | 'lists' | 'currency' | 'calculator' | 'notes' | 'image' | 'bookmarks' | 'newsfeed' | 'embed' | 'google-tasks' | 'habit-tracker' | 'daily-planner';
  title: string;
  x: number; // Column position (0 to 11)
  y: number; // Row position
  w: number; // Width (1 to 12)
  h: number; // Height
  color: string; // Tailwind bg or hex
  textColor?: string;
  data: any; // Custom properties for each widget type
}

export interface Dashboard {
  id: string; // 'personal' | 'trabajo' | 'estudio' | 'hobbies' | 'hogar' | custom
  name: string;
  icon: string; // Lucide icon name
  wallpaper: string; // CSS style or tailwind class for background
  wallpaperType: 'color' | 'gradient' | 'image' | 'pattern';
  widgets: Widget[];
}

export interface ProductivityStats {
  weeklyCompletion: { day: string; tasks: number; habits: number; focusMinutes: number }[];
  focusStateDistribution: { name: string; value: number; color: string }[];
  streakData: { name: string; current: number; max: number }[];
}
