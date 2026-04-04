/**
 * useTasks Hook
 * Dante.id - Task data fetching and mutations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Task,
  TaskFilters,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
  ApiError,
} from '../types/project';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<Task | null>;
  updateTask: (id: string, input: UpdateTaskInput) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  moveTask: (id: string, newStatus: TaskStatus) => Promise<Task | null>;
}

export function useTasks(projectId?: string, filters?: TaskFilters): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const buildQueryString = (filters?: TaskFilters): string => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId);
    if (filters?.search) params.append('search', filters.search);
    return params.toString() ? `?${params.toString()}` : '';
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryString = buildQueryString(filters);
      const response = await fetch(`${API_BASE_URL}/tasks${queryString}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          code: `HTTP_${response.status}`,
          message: errorData.message || `Failed to fetch tasks: ${response.statusText}`,
          details: errorData.details,
        } as ApiError;
      }

      const data = await response.json();
      setTasks(data.tasks || []);
    } catch (err) {
      const apiError: ApiError = {
        code: err instanceof Error ? 'FETCH_ERROR' : (err as ApiError).code || 'UNKNOWN',
        message: err instanceof Error ? err.message : (err as ApiError).message || 'An unexpected error occurred',
        details: err instanceof Error ? undefined : (err as ApiError).details,
      };
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [projectId, filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (input: CreateTaskInput): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          code: `HTTP_${response.status}`,
          message: errorData.message || `Failed to create task: ${response.statusText}`,
        };
      }

      const data = await response.json();
      setTasks(prev => [data.task, ...prev]);
      return data.task;
    } catch (err) {
      const apiError: ApiError = {
        code: err instanceof Error ? 'CREATE_ERROR' : (err as ApiError).code || 'UNKNOWN',
        message: err instanceof Error ? err.message : (err as ApiError).message || 'Failed to create task',
      };
      setError(apiError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (id: string, input: UpdateTaskInput): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          code: `HTTP_${response.status}`,
          message: errorData.message || `Failed to update task: ${response.statusText}`,
        };
      }

      const data = await response.json();
      setTasks(prev => prev.map(t => t.id === id ? data.task : t));
      return data.task;
    } catch (err) {
      const apiError: ApiError = {
        code: err instanceof Error ? 'UPDATE_ERROR' : (err as ApiError).code || 'UNKNOWN',
        message: err instanceof Error ? err.message : (err as ApiError).message || 'Failed to update task',
      };
      setError(apiError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          code: `HTTP_${response.status}`,
          message: errorData.message || `Failed to delete task: ${response.statusText}`,
        };
      }

      setTasks(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (err) {
      const apiError: ApiError = {
        code: err instanceof Error ? 'DELETE_ERROR' : (err as ApiError).code || 'UNKNOWN',
        message: err instanceof Error ? err.message : (err as ApiError).message || 'Failed to delete task',
      };
      setError(apiError);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const moveTask = async (id: string, newStatus: TaskStatus): Promise<Task | null> => {
    return updateTask(id, { status: newStatus });
  };

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
  };
}
