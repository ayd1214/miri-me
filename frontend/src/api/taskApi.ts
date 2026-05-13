import { API_BASE_URL } from "../constants/api";
import { getCurrentUserIdToken } from "../lib/firebase";
import { Platform } from "react-native";
import {
  AnalyzeTaskResult,
  CreateTaskInput,
  Task,
  TaskStatus,
  UpdateTaskInput,
} from "../types/task";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

const getErrorMessage = async (response: Response) => {
  const errorText = await response.text();

  if (!errorText) {
    return `Request failed: ${response.status}`;
  }

  try {
    const parsed = JSON.parse(errorText) as { detail?: unknown };

    if (typeof parsed.detail === "string") {
      return parsed.detail;
    }
  } catch {
    // Fall back to the raw response text.
  }

  return errorText;
};

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
    throw new ApiError(response.status, await getErrorMessage(response));
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

  if (Platform.OS === "web") {
    const response = await fetch(image.uri);
    const blob = await response.blob();
    const fileType = image.mimeType || blob.type || "image/jpeg";
    const file =
      blob.type === fileType ? blob : new Blob([blob], { type: fileType });

    formData.append("image", file, image.fileName || fallbackName);
  } else {
    formData.append("image", {
      uri: image.uri,
      name: image.fileName || fallbackName,
      type: image.mimeType || "image/jpeg",
    } as unknown as Blob);
  }

  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(response.status, await getErrorMessage(response));
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

export const updateTask = async (
  taskId: string,
  task: UpdateTaskInput
): Promise<Task> => {
  return request<Task>(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify(task),
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
