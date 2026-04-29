export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'cancelled';

export interface User {
  id: string;
  name: string;
  avatarColor: string;
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  status: TaskStatus;
  progress: number;
  createdAt: string;
  date: string;
  startTime?: string;
  endTime?: string;
  assignee?: string;
  userId?: string;
}
