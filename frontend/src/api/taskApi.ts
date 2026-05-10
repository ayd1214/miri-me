import { API_BASE_URL } from "../constants/api";
import { getCurrentUserIdToken } from "../lib/firebase";
import {
  AnalyzeTaskResult,
  CreateTaskInput,
  Task,
  TaskStatus,
} from "../types/task";

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const token = await getCurrentUserIdToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
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

type AnalyzeImageInput = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export const analyzeImage = async (
  image: AnalyzeImageInput
): Promise<AnalyzeTaskResult> => {
  const token = await getCurrentUserIdToken();
  const formData = new FormData();
  const fallbackName = image.uri.split("/").pop() || "assignment.jpg";

  formData.append("image", {
    uri: image.uri,
    name: image.fileName || fallbackName,
    type: image.mimeType || "image/jpeg",
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<AnalyzeTaskResult>;
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
  await request<void>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
};

export const registerPushToken = async (token: string): Promise<void> => {
  await request<void>("/push-token", {
    method: "POST",
    body: JSON.stringify({ pushToken: token }),
  });
};
