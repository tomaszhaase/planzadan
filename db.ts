import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'database.sqlite'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatarColor TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      status TEXT DEFAULT 'todo',
      progress INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT 0,
      createdAt TEXT NOT NULL,
      date TEXT NOT NULL,
      startTime TEXT,
      endTime TEXT,
      assignee TEXT,
      userId TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Initial data if empty
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    const insertUser = db.prepare('INSERT INTO users (id, name, avatarColor) VALUES (?, ?, ?)');
    insertUser.run('u1', 'Tomek', '#C5A059');
    insertUser.run('u2', 'Ania', '#3B82F6');

    const insertTask = db.prepare(`
      INSERT INTO tasks (id, text, status, progress, completed, createdAt, date, userId) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    const today = new Date().toISOString().split('T')[0];
    insertTask.run('1', 'Zaplanować tydzień', 'todo', 0, 0, now, today, 'u1');
    insertTask.run('2', 'Nauczyć się czegoś nowego o Node.js', 'completed', 100, 1, now, today, 'u1');
  }
}

export default db;
