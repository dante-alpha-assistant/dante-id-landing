/**
 * useProjects Hook
 * Dante.id - Project data fetching and mutations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Project,
  ProjectFilters,
  CreateProjectInput,
  UpdateProjectInput,
  ApiResponse,
  ApiError,
} from '../types/project';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface UseProjectsReturn {
  projects: Project[];
  loading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<Project | null>;
  updateProject: (id: string, input: UpdateProjectInput) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  archiveProject: (id: string) => Promise<boolean>;
}

export function useProjects(filters?: ProjectFilters): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const buildQueryString = (filters?: ProjectFilters): string => {
    if (!filters) return '';
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    if (filters.tags) filters.tags.forEach(tag => params.append('tag', tag));
    return params.toString() ? `?${params.toString()}` : '';
  };

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryString = buildQueryString(filters);
      const response = await fetch(`${API_BASE_URL}/projects${queryString}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          code: `HTTP_${response.status}`,
          message: errorData.message || `Failed to fetch projects: ${response.statusText}`,
          details: errorData.details,
        } as ApiError;
      }

      const data = await response.json();
      setProjects(data.projects || []);
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
  }, [filters]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (input: CreateProjectInput): Promise<Project | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
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
          message: errorData.message || `Failed to create project: ${response.statusText}`,
        };
      }

      const data = await response.json();
      setProjects(prev => [data.project, ...prev]);
      return data.project;
    } catch (err) {
      const apiError: ApiError = {
        code: err instanceof Error ? 'CREATE_ERROR' : (err as ApiError).code || 'UNKNOWN',
        message: err instanceof Error ? err.message : (err as ApiError).message || 'Failed to create project',
      };
      setError(apiError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id: string, input: UpdateProjectInput): Promise<Project | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
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
          message: errorData.message || `Failed to update project: ${response.statusText}`,
        };
      }

      const data = await response.json();
      setProjects(prev => prev.map(p => p.id === id ? data.project : p));
      return data.project;
    } catch (err) {
      const apiError: ApiError = {
        code: err instanceof Error ? 'UPDATE_ERROR' : (err as ApiError).code || 'UNKNOWN',
        message: err instanceof Error ? err.message : (err as ApiError).message || 'Failed to update project',
      };
      setError(apiError);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
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
          message: errorData.message || `Failed to delete project: ${response.statusText}`,
        };
      }

      setProjects(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      const apiError: ApiError = {
        code: err instanceof Error ? 'DELETE_ERROR' : (err as ApiError).code || 'UNKNOWN',
        message: err instanceof Error ? err.message : (err as ApiError).message || 'Failed to delete project',
      };
      setError(apiError);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const archiveProject = async (id: string): Promise<boolean> => {
    return updateProject(id, { status: 'archived' as any }).then(p => !!p);
  };

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
  };
}

export function useProject(projectId: string): ApiResponse<Project> & { refetch: () => Promise<void> } {
  const [data, setData] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchProject = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          code: `HTTP_${response.status}`,
          message: errorData.message || `Failed to fetch project: ${response.statusText}`,
        };
      }

      const result = await response.json();
      setData(result.project);
    } catch (err) {
      const apiError: ApiError = {
        code: err instanceof Error ? 'FETCH_ERROR' : (err as ApiError).code || 'UNKNOWN',
        message: err instanceof Error ? err.message : (err as ApiError).message || 'An unexpected error occurred',
      };
      setError(apiError);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return { data, loading, error, refetch: fetchProject };
}
