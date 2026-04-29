import { User } from "../types";

const API_BASE = "/api/users";

export async function fetchUsers(): Promise<User[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
}

export async function addUser(user: { name: string; avatarColor?: string }): Promise<User> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!response.ok) throw new Error("Failed to add user");
  return response.json();
}
