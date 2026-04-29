import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import db, { initDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize DB
  initDb();

  app.use(express.json());

  // API Routes
  app.get("/api/users", (req, res) => {
    const users = db.prepare('SELECT * FROM users').all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { name, avatarColor } = req.body;
    const id = Math.random().toString(36).substring(2, 9);
    const color = avatarColor || "#" + Math.floor(Math.random()*16777215).toString(16);
    
    db.prepare('INSERT INTO users (id, name, avatarColor) VALUES (?, ?, ?)')
      .run(id, name, color);
    
    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    res.status(201).json(newUser);
  });

  app.get("/api/tasks", (req, res) => {
    const { userId } = req.query;
    let tasks;
    if (userId) {
      tasks = db.prepare('SELECT * FROM tasks WHERE userId = ?').all(userId);
    } else {
      tasks = db.prepare('SELECT * FROM tasks').all();
    }
    // Map SQLite boolean (0/1) back to JS boolean
    res.json(tasks.map((t: any) => ({ ...t, completed: !!t.completed })));
  });

  app.post("/api/tasks", (req, res) => {
    const { text, startTime, endTime, date, assignee, userId } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const id = Math.random().toString(36).substring(2, 9);
    const createdAt = new Date().toISOString();
    const taskDate = date || new Date().toISOString().split('T')[0];

    db.prepare(`
      INSERT INTO tasks (id, text, status, progress, completed, createdAt, date, startTime, endTime, assignee, userId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, text, 'todo', 0, 0, createdAt, taskDate, startTime || null, endTime || null, assignee || null, userId || null);

    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    res.status(201).json({ ...newTask, completed: !!newTask.completed });
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const { completed, text, startTime, endTime, date, assignee, status, progress, userId } = req.body;
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (completed !== undefined) { updates.push('completed = ?'); params.push(completed ? 1 : 0); }
    if (text !== undefined) { updates.push('text = ?'); params.push(text); }
    if (startTime !== undefined) { updates.push('startTime = ?'); params.push(startTime); }
    if (endTime !== undefined) { updates.push('endTime = ?'); params.push(endTime); }
    if (date !== undefined) { updates.push('date = ?'); params.push(date); }
    if (assignee !== undefined) { updates.push('assignee = ?'); params.push(assignee); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (progress !== undefined) { updates.push('progress = ?'); params.push(progress); }
    if (userId !== undefined) { updates.push('userId = ?'); params.push(userId); }

    if (updates.length > 0) {
      params.push(id);
      db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    res.json({ ...updatedTask, completed: !!updatedTask.completed });
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.status(204).send();
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
