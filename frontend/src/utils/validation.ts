/**
 * Form Validation Utilities
 * Validation functions for project and task forms
 */

import type { Project, Task } from '../types/project';
import type { Priority } from '../components/PrioritySelect';

export interface ProjectFormErrors {
  name?: string;
  description?: string;
  status?: string;
}

export interface TaskFormErrors {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_id?: string;
  due_date?: string;
}

interface ValidationResult<T> {
  isValid: boolean;
  errors: T;
}

/**
 * Validate project form data
 */
export function validateProjectForm(
  data: Partial<Project>
): ValidationResult<ProjectFormErrors> {
  const errors: ProjectFormErrors = {};

  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Project name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Project name must be at least 2 characters';
  } else if (data.name.trim().length > 100) {
    errors.name = 'Project name must be less than 100 characters';
  }

  // Description validation (optional)
  if (data.description && data.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  // Status validation
  const validStatuses = ['draft', 'active', 'archived'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.status = 'Invalid status selected';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate task form data
 */
export function validateTaskForm(
  data: Partial<Task>
): ValidationResult<TaskFormErrors> {
  const errors: TaskFormErrors = {};

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Task title is required';
  } else if (data.title.trim().length < 2) {
    errors.title = 'Task title must be at least 2 characters';
  } else if (data.title.trim().length > 150) {
    errors.title = 'Task title must be less than 150 characters';
  }

  // Description validation (optional)
  if (data.description && data.description.length > 1000) {
    errors.description = 'Description must be less than 1000 characters';
  }

  // Status validation
  const validStatuses = ['backlog', 'todo', 'in_progress', 'done'];
  if (data.status && !validStatuses.includes(data.status)) {
    errors.status = 'Invalid status selected';
  }

  // Priority validation
  const validPriorities: Priority[] = ['low', 'medium', 'high', 'critical'];
  if (data.priority && !validPriorities.includes(data.priority as Priority)) {
    errors.priority = 'Invalid priority selected';
  }

  // Due date validation (optional)
  if (data.due_date) {
    const dueDate = new Date(data.due_date);
    if (isNaN(dueDate.getTime())) {
      errors.due_date = 'Invalid date format';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Generic field validator
 */
export function validateField(
  value: string,
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    message?: string;
  }
): string | undefined {
  if (rules.required && (!value || value.trim().length === 0)) {
    return rules.message || 'This field is required';
  }

  if (value && rules.minLength && value.length < rules.minLength) {
    return rules.message || `Must be at least ${rules.minLength} characters`;
  }

  if (value && rules.maxLength && value.length > rules.maxLength) {
    return rules.message || `Must be less than ${rules.maxLength} characters`;
  }

  if (value && rules.pattern && !rules.pattern.test(value)) {
    return rules.message || 'Invalid format';
  }

  return undefined;
}

export default {
  validateProjectForm,
  validateTaskForm,
  validateField,
};
