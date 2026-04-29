import { Task } from "../types";

const API_BASE = "/api/tasks";

export async function fetchTasks(userId?: string): Promise<Task[]> {
  const url = userId ? `${API_BASE}?userId=${userId}` : API_BASE;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch tasks");
  return response.json();
}

export async function addTask(task: { 
  text: string; 
  startTime?: string; 
  endTime?: string; 
  date: string; 
  assignee?: string;
  userId?: string;
}): Promise<Task> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error("Failed to add task");
  return response.json();
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update task");
  return response.json();
}

export async function deleteTask(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete task");
}
