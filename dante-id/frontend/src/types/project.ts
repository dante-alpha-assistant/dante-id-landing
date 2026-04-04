/**
 * Project Management Types
 * Dante.id - Terminal-inspired project management
 */

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  tags: string[];
  progress: number;
  deadline?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string;
  assigneeName?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
}

export interface TaskColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
}

export enum TaskStatus {
  BACKLOG = 'backlog',
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface CreateProjectInput {
  name: string;
  description: string;
  priority?: Priority;
  deadline?: string;
  tags?: string[];
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: Priority;
  deadline?: string;
  tags?: string[];
  progress?: number;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description: string;
  priority?: Priority;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
}

export interface ProjectFilters {
  status?: ProjectStatus;
  priority?: Priority;
  search?: string;
  tags?: string[];
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  search?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
}
