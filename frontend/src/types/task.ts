export type TaskPriority = "high" | "medium" | "low";

export type TaskStatus = "todo" | "done";

export type Task = {
  id: string;
  title: string;
  dueDate: string;
  submitType: string;
  keywords: string[];
  summary?: string;
  priority?: TaskPriority;
  status: TaskStatus;
  createdAt?: string;
};

export type CreateTaskInput = {
  title: string;
  dueDate: string;
  submitType: string;
  keywords: string[];
  summary?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
};

export type AnalyzeTaskResult = {
  title: string;
  dueDate: string;
  submitType: string;
  keywords: string[];
  summary?: string;
  priority?: TaskPriority;
};
