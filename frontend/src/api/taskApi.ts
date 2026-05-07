import { CreateTaskInput, Task, TaskStatus } from "../types/task";

const BASE_URL = "http://172.30.1.83:8000";

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  return response.json();
};

export const getTasks = async (): Promise<Task[]> => {
  return request<Task[]>("/tasks");
};

export const getTask = async (taskId: string): Promise<Task> => {
  return request<Task>(`/tasks/${taskId}`);
};

export const createTask = async (task: CreateTaskInput): Promise<Task> => {
  return request<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(task),
  });
};

export const updateTaskStatus = async (
  taskId: string,
  status: TaskStatus
): Promise<Task> => {
  return request<Task>(`/tasks/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const response = await fetch(`${BASE_URL}/tasks/${taskId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Delete failed: ${response.status}`);
  }
};