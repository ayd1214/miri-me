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

export type UpdateTaskInput = Partial<
  Pick<
    Task,
    "title" | "dueDate" | "submitType" | "keywords" | "summary" | "priority" | "status"
  >
>;

export type AnalyzeTaskResult = {
  title: string;
  dueDate: string;
  submitType: string;
  keywords: string[];
  summary?: string;
  priority?: TaskPriority;
};
