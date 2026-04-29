import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory Task Store
  let users = [
    { id: "u1", name: "Tomek", avatarColor: "#C5A059" },
    { id: "u2", name: "Ania", avatarColor: "#3B82F6" },
  ];

  let tasks = [
    { id: "1", text: "Zaplanować tydzień", completed: false, status: "todo", progress: 0, createdAt: new Date(), date: new Date().toISOString().split('T')[0], userId: "u1" },
    { id: "2", text: "Nauczyć się czegoś nowego o Node.js", completed: true, status: "completed", progress: 100, createdAt: new Date(), date: new Date().toISOString().split('T')[0], userId: "u1" },
  ];

  // API Routes
  app.get("/api/users", (req, res) => {
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { name, avatarColor } = req.body;
    const newUser = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      avatarColor: avatarColor || "#" + Math.floor(Math.random()*16777215).toString(16)
    };
    users.push(newUser);
    res.status(201).json(newUser);
  });

  app.get("/api/tasks", (req, res) => {
    const { userId } = req.query;
    if (userId) {
      return res.json(tasks.filter(t => t.userId === userId));
    }
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const { text, startTime, endTime, date, assignee, userId } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const newTask = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      completed: false,
      status: "todo",
      progress: 0,
      createdAt: new Date(),
      date: date || new Date().toISOString().split('T')[0],
      startTime,
      endTime,
      assignee,
      userId,
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const { completed, text, startTime, endTime, date, assignee, status, progress, userId } = req.body;
    const taskIndex = tasks.findIndex((t) => t.id === id);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    if (completed !== undefined) tasks[taskIndex].completed = completed;
    if (text !== undefined) tasks[taskIndex].text = text;
    if (startTime !== undefined) (tasks[taskIndex] as any).startTime = startTime;
    if (endTime !== undefined) (tasks[taskIndex] as any).endTime = endTime;
    if (date !== undefined) (tasks[taskIndex] as any).date = date;
    if (assignee !== undefined) (tasks[taskIndex] as any).assignee = assignee;
    if (status !== undefined) (tasks[taskIndex] as any).status = status;
    if (progress !== undefined) (tasks[taskIndex] as any).progress = progress;
    if (userId !== undefined) (tasks[taskIndex] as any).userId = userId;

    res.json(tasks[taskIndex]);
  });

  app.delete("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    tasks = tasks.filter((t) => t.id !== id);
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
