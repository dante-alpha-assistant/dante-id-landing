import { useState, useEffect, useCallback } from 'react';
import { FilterState } from '../types/filters';

const DEFAULT_FILTERS: FilterState = {
  projectIds: [],
  eventTypes: [],
  searchQuery: ''
};

const STORAGE_KEY = 'recent_activity_filters';

export function useFilterState() {
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_FILTERS;
    } catch {
      return DEFAULT_FILTERS;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // Ignore storage errors
    }
  }, [filters]);

  const updateFilter = useCallback((key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = filters.projectIds.length > 0 || 
    filters.eventTypes.length > 0 || 
    filters.searchQuery.length > 0;

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters
  };
}