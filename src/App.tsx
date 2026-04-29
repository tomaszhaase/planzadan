import { useState, useEffect, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, Loader2, Check, Palette, Users, UserPlus } from "lucide-react";
import { Task, User } from "./types";
import * as taskService from "./services/taskService";
import * as userService from "./services/userService";

const THEMES = {
  sophisticated: {
    name: "Sophisticated Dark",
    accent: "#C5A059",
    bgMain: "#0F0F0F",
    bgSide: "#0A0A0A",
    text: "#E0E0E0"
  },
  modern: {
    name: "Industrial Grey",
    accent: "#3B82F6",
    bgMain: "#E5E7EB",
    bgSide: "#D1D5DB",
    text: "#111827"
  },
  midnight: {
    name: "Midnight Blue",
    accent: "#60A5FA",
    bgMain: "#020617",
    bgSide: "#0F172A",
    text: "#F1F5F9"
  },
  forest: {
    name: "Forest Green",
    accent: "#10B981",
    bgMain: "#064E3B",
    bgSide: "#022C22",
    text: "#ECFDF5"
  }
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [assignee, setAssignee] = useState("");
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [addingTask, setAddingTask] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [currentTheme, setCurrentTheme] = useState<keyof typeof THEMES>("sophisticated");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchTasks();
      setAssignee(selectedUser.name);
    }
  }, [selectedUser]);

  const fetchInitialData = async () => {
    try {
      const usersData = await userService.fetchUsers();
      setUsers(usersData);
      if (usersData.length > 0) {
        setSelectedUser(usersData[0]);
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!selectedUser) return;
    try {
      const data = await taskService.fetchTasks(selectedUser.id);
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    try {
      const newUser = await userService.addUser({ name: newUserName.trim() });
      setUsers(prev => [...prev, newUser]);
      setSelectedUser(newUser);
      setNewUserName("");
      setIsAddingUser(false);
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  };

  useEffect(() => {
    const theme = THEMES[currentTheme];
    const root = document.documentElement;
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-bg-main', theme.bgMain);
    root.style.setProperty('--theme-bg-side', theme.bgSide);
    root.style.setProperty('--theme-text-main', theme.text);
    
    // Adjust overlays based on brightness
    if (currentTheme === 'modern') {
      root.style.setProperty('--theme-overlay-val', 'rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--theme-border-val', 'rgba(0, 0, 0, 0.1)');
    } else {
      root.style.setProperty('--theme-overlay-val', 'rgba(255, 255, 255, 0.05)');
      root.style.setProperty('--theme-border-val', 'rgba(255, 255, 255, 0.1)');
    }
  }, [currentTheme]);

  const addTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    setAddingTask(true);
    try {
      const newTask = await taskService.addTask({ 
        text: newTaskText.trim(),
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        date: newTaskDate,
        assignee: assignee.trim() || selectedUser?.name || undefined,
        userId: selectedUser?.id
      });
      setTasks((prev) => [...prev, newTask]);
      setNewTaskText("");
      setStartTime("");
      setEndTime("");
      setAssignee("");
      setNewTaskDate(viewDate); // Reset to current view date
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setAddingTask(false);
    }
  };

  const updateTaskProgress = async (id: string, progress: number) => {
    try {
      const status: Task["status"] = progress === 100 ? "completed" : progress > 0 ? "in_progress" : "todo";
      const updatedTask = await taskService.updateTask(id, { 
        progress, 
        status,
        completed: status === "completed"
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
    } catch (error) {
      console.error("Failed to update progress:", error);
    }
  };

  const cancelTask = async (id: string) => {
    try {
      const updatedTask = await taskService.updateTask(id, { 
        status: "cancelled",
        completed: false
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
    } catch (error) {
      console.error("Failed to cancel task:", error);
    }
  };

  const finishTask = async (id: string) => {
    try {
      const updatedTask = await taskService.updateTask(id, { 
        status: "completed",
        completed: true,
        progress: 100
      });
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
    } catch (error) {
      console.error("Failed to finish task:", error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      await taskService.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const filteredTasks = tasks.filter(t => t.date === viewDate);
  const activeTasks = filteredTasks.filter(t => t.status !== 'cancelled');
  const totalProgress = activeTasks.reduce((acc, t) => acc + (t.progress || 0), 0);
  const progress = activeTasks.length > 0 ? totalProgress / activeTasks.length : 0;
  const completedCount = filteredTasks.filter((t) => t.status === 'completed').length;
  const dashOffset = 552 - (552 * progress) / 100;

  const displayDate = new Date(viewDate);
  const day = displayDate.getDate();
  const month = displayDate.toLocaleDateString("pl-PL", { month: "long" });
  const weekday = displayDate.toLocaleDateString("pl-PL", { weekday: "long" });
  const year = displayDate.getFullYear();

  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60; // Handle overnight tasks
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m`;
  };

  return (
    <div className="flex h-screen bg-bg-main text-[var(--theme-text-main)] font-sans overflow-hidden transition-colors duration-500">
      {/* Left Sidebar: Date and Progress */}
      <aside className="w-1/3 border-r border-[var(--theme-border)] flex flex-col p-12 justify-between bg-bg-side transition-colors duration-500">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-accent opacity-80">
                <Users className="w-4 h-4" />
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Osoby</span>
              </div>
              <button 
                onClick={() => setIsAddingUser(!isAddingUser)}
                className={`p-1 hover:text-accent transition-colors ${isAddingUser ? 'text-accent opacity-100' : 'opacity-40 hover:opacity-100'}`}
                title="Dodaj osobę"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence>
              {isAddingUser && (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleCreateUser}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2 mb-2">
                    <input
                      autoFocus
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="Imię..."
                      className="flex-1 bg-[var(--theme-overlay)] border border-[var(--theme-border)] rounded-sm text-[10px] text-[var(--theme-text-main)] px-2 py-1.5 outline-none focus:border-accent/40"
                    />
                    <button 
                      type="submit"
                      disabled={!newUserName.trim()}
                      className="px-3 py-1.5 bg-accent text-bg-main text-[8px] uppercase tracking-widest font-bold hover:opacity-90 disabled:opacity-50"
                    >
                      Dodaj
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
            <div className="flex flex-wrap gap-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`px-3 py-1.5 text-[9px] uppercase tracking-widest border transition-all flex items-center gap-2 ${
                    selectedUser?.id === user.id 
                    ? "border-accent bg-accent text-bg-main" 
                    : "border-[var(--theme-border)] text-[var(--theme-text-main)] opacity-60"
                  }`}
                >
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: user.avatarColor }}
                  />
                  {user.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 pt-4 border-t border-[var(--theme-border)]">
            <p className="text-accent uppercase tracking-[0.2em] text-xs font-semibold">Dzienny Rejestr</p>
            <div className="relative group/date cursor-pointer">
              <input 
                type="date" 
                value={viewDate}
                onChange={(e) => setViewDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <h1 className="text-7xl font-serif text-[var(--theme-text-main)] tracking-tight leading-none group-hover/date:text-accent transition-colors">{day}</h1>
              <h2 className="text-3xl font-serif italic opacity-90 leading-tight capitalize group-hover/date:text-accent transition-colors">{month}</h2>
            </div>
            <p className="opacity-40 text-sm mt-2 uppercase tracking-widest font-light">{weekday} / {year}</p>
          </div>

          <div className="py-8">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="80" cy="80" r="74" stroke="currentColor" strokeWidth="2" fill="transparent" className="opacity-10" />
                <motion.circle 
                  cx="80" cy="80" r="74" 
                  stroke="currentColor" strokeWidth="3" 
                  fill="transparent" 
                  strokeDasharray="465" 
                  initial={{ strokeDashoffset: 465 }}
                  animate={{ strokeDashoffset: 465 - (465 * progress) / 100 }}
                  className="text-accent" 
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-serif text-[var(--theme-text-main)]">{Math.round(progress)}%</span>
                <span className="text-[9px] uppercase tracking-widest opacity-40 font-bold">Ukończone</span>
              </div>
            </div>
          </div>

          {/* Theme Selector */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-accent opacity-80">
              <Palette className="w-4 h-4" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Motyw</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(THEMES).map(([key, theme]) => (
                <button
                  key={key}
                  onClick={() => setCurrentTheme(key as keyof typeof THEMES)}
                  className={`px-3 py-2 text-[8px] uppercase tracking-widest border transition-all ${
                    currentTheme === key 
                    ? "border-accent bg-accent text-bg-main" 
                    : "border-[var(--theme-border)] text-[var(--theme-text-main)] opacity-40 hover:opacity-100 hover:border-accent"
                  }`}
                >
                  {theme.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            <span className="text-xs tracking-wide opacity-60">System Node.js aktywny</span>
          </div>
          <p className="text-[10px] leading-relaxed opacity-30 uppercase tracking-tighter">
            Aplikacja do monitorowania wydajności i rejestracji codziennych kamieni milowych rozwoju oprogramowania.
          </p>
        </div>
      </aside>

      {/* Main Content: Task List */}
      <main className="w-2/3 flex flex-col">
        {/* Header */}
        <header className="p-12 pb-6 border-b border-[var(--theme-border)] flex justify-between items-end">
          <div className="space-y-1">
            <h3 className="text-2xl font-serif italic text-[var(--theme-text-main)] font-medium">Harmonogram Zadań</h3>
            <p className="text-xs opacity-40 uppercase tracking-widest">
              {completedCount} z {filteredTasks.length} celów zrealizowano na ten dzień
            </p>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="date" 
              value={viewDate}
              onChange={(e) => setViewDate(e.target.value)}
              className="bg-[var(--theme-overlay)] border border-[var(--theme-border)] rounded-sm text-[10px] text-accent uppercase tracking-widest px-3 py-2 outline-none focus:border-accent/40 transition-colors cursor-pointer font-mono"
            />
            <button 
              type="button" 
              onClick={() => document.getElementById('task-input')?.focus()}
              className="px-6 py-2 border border-accent text-accent text-[10px] uppercase tracking-[0.2em] hover:bg-accent hover:text-bg-main transition-all cursor-pointer whitespace-nowrap"
            >
              Nowy Log
            </button>
          </div>
        </header>

        {/* Scrollable Task List */}
        <div className="flex-1 p-12 pt-6 space-y-px overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-24 border border-[var(--theme-border)] bg-[var(--theme-overlay)]">
              <p className="opacity-20 font-serif italic">Brak wpisów w rejestrze na ten dzień...</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredTasks
                .sort((a, b) => {
                  const statusWeight = { completed: 2, cancelled: 3, in_progress: 0, todo: 1 };
                  const weightA = statusWeight[a.status || (a.completed ? 'completed' : 'todo')] || 1;
                  const weightB = statusWeight[b.status || (b.completed ? 'completed' : 'todo')] || 1;
                  return weightA - weightB;
                })
                .map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="group flex items-center py-6 border-b border-[var(--theme-border)] transition-colors"
                  >
                    <div className="w-16 text-[10px] font-mono opacity-20 tracking-tighter leading-tight flex flex-col justify-center border-r border-[var(--theme-border)] mr-4 py-1">
                      <span className="opacity-40 mb-0.5 uppercase">Log:</span>
                      <span>{new Date(task.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    
                    <div className="flex-1 px-4">
                      <h4 
                        onClick={() => task.status !== 'cancelled' && (task.status === 'completed' ? updateTaskProgress(task.id, 0) : finishTask(task.id))}
                        className={`text-lg transition-all cursor-pointer ${
                          task.completed 
                          ? "opacity-30 line-through decoration-accent/40 decoration-1" 
                          : task.status === 'cancelled'
                          ? "opacity-20 line-through decoration-red-500/20 cursor-not-allowed"
                          : "opacity-90 hover:opacity-100"
                        }`}
                      >
                        {task.text}
                      </h4>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <p className={`text-[10px] uppercase tracking-widest italic font-bold min-w-[80px] ${
                          task.status === 'completed' ? 'text-accent/30' : 
                          task.status === 'cancelled' ? 'text-red-500/40' :
                          task.status === 'in_progress' ? 'text-blue-400/60' : 'opacity-30'
                        }`}>
                          {task.status?.toUpperCase() || (task.completed ? 'COMPLETED' : 'TODO')}
                        </p>
                        
                        {task.status !== 'cancelled' && task.status !== 'completed' && (
                          <div className="flex items-center gap-2 group/progress">
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={task.progress || 0}
                              onChange={(e) => updateTaskProgress(task.id, parseInt(e.target.value))}
                              className="w-24 h-1 bg-[var(--theme-border)] rounded-full appearance-none cursor-pointer accent-accent"
                            />
                            <span className="text-[9px] font-mono opacity-40">{task.progress || 0}%</span>
                          </div>
                        )}
                        
                        {task.assignee && (
                          <>
                            <span className="opacity-10 text-[10px] mx-1">|</span>
                            <span className="text-[10px] text-accent uppercase font-mono px-2 py-0.5 bg-accent/10 border border-accent/20 rounded">
                              {task.assignee}
                            </span>
                          </>
                        )}
                        {task.startTime && (
                          <>
                            <span className="opacity-10 text-[10px] mx-1">|</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] opacity-40 uppercase font-mono tracking-tighter">Plan:</span>
                              <span className="text-[10px] text-accent font-mono opacity-70">
                                {task.startTime} {task.endTime ? `— ${task.endTime}` : ''}
                                {task.startTime && task.endTime && (
                                  <span className="ml-2 opacity-20">({calculateDuration(task.startTime, task.endTime)})</span>
                                )}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {task.status !== 'cancelled' && !task.completed && (
                        <button
                          onClick={() => cancelTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 px-2 py-1 border border-red-500/20 text-red-500/40 text-[8px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                        >
                          Cancel
                        </button>
                      )}

                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 opacity-20 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => task.status === 'completed' ? updateTaskProgress(task.id, 0) : finishTask(task.id)}
                        className={`w-6 h-6 border transition-all flex items-center justify-center ${
                          task.completed 
                          ? "border-accent bg-accent" 
                          : "border-[var(--theme-border)] hover:border-accent"
                        }`}
                      >
                        {task.completed && <Check className="w-4 h-4 text-bg-main" strokeWidth={3} />}
                      </button>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          )}
        </div>

        {/* Quick Entry Footer */}
        <footer className="p-12 pt-0 mt-auto">
          <form onSubmit={addTask} className="bg-[var(--theme-overlay)] p-6 border-t border-[var(--theme-border)] flex flex-col gap-4 group">
            <div className="flex items-center gap-6">
              <span className="text-xs font-mono text-accent whitespace-nowrap">NODE_CMD:</span>
              <input
                id="task-input"
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Dodaj nowe zadanie do rejestru..."
                className="bg-transparent border-none outline-none flex-1 text-[var(--theme-text-main)] placeholder-[var(--theme-text-main)] placeholder-opacity-10 text-sm font-light italic"
                disabled={addingTask}
              />
              <button
                type="submit"
                disabled={addingTask || !newTaskText.trim()}
                className="px-4 py-2 border border-accent/20 text-accent text-[10px] uppercase tracking-widest hover:border-accent hover:bg-accent/10 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
              >
                {addingTask ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Commit'}
              </button>
            </div>
            
            <div className="flex items-center gap-4 pl-[88px]">
              <div className="flex items-center gap-2">
                <span className="text-[10px] opacity-20 uppercase tracking-widest font-mono">Date:</span>
                <input 
                  type="date" 
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="bg-[var(--theme-overlay)] border border-[var(--theme-border)] rounded-sm text-[10px] text-[var(--theme-text-main)] opacity-60 px-1 py-0.5 outline-none focus:border-accent/40 transition-colors cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] opacity-20 uppercase tracking-widest font-mono">Start:</span>
                <input 
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-[var(--theme-overlay)] border border-[var(--theme-border)] rounded-sm text-[10px] text-[var(--theme-text-main)] opacity-60 px-1 py-0.5 outline-none focus:border-accent/40 transition-colors cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] opacity-20 uppercase tracking-widest font-mono">End:</span>
                <input 
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-[var(--theme-overlay)] border border-[var(--theme-border)] rounded-sm text-[10px] text-[var(--theme-text-main)] opacity-60 px-1 py-0.5 outline-none focus:border-accent/40 transition-colors cursor-pointer"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] opacity-20 uppercase tracking-widest font-mono">Person:</span>
                <select 
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="bg-[var(--theme-overlay)] border border-[var(--theme-border)] rounded-sm text-[10px] text-[var(--theme-text-main)] opacity-60 px-2 py-0.5 outline-none focus:border-accent/40 transition-colors cursor-pointer"
                >
                  <option value="" className="bg-bg-side">Unassigned</option>
                  {users.map(user => (
                    <option key={user.id} value={user.name} className="bg-bg-side">
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
              {!addingTask && newTaskText.trim() && (
                <span className="text-[10px] opacity-10 uppercase tracking-widest ml-auto animate-pulse">
                  Press Enter or Click Commit
                </span>
              )}
            </div>
          </form>
        </footer>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(197, 160, 89, 0.2);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(197, 160, 89, 0.4);
        }
      `}</style>
    </div>
  );
}

