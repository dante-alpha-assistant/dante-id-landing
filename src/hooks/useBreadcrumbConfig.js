import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_CONFIG = {
  home_route: '/dashboard',
  home_label: 'Dashboard',
  home_icon: 'home',
  max_depth: 5,
  show_icons: true,
  separator_type: 'chevron'
};

export const useBreadcrumbConfig = () => {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchConfig = async () => {
    if (!user) {
      setConfig(DEFAULT_CONFIG);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/breadcrumb/config', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig({ ...DEFAULT_CONFIG, ...data });
      } else {
        setConfig(DEFAULT_CONFIG);
      }
    } catch (err) {
      console.error('Failed to fetch breadcrumb config:', err);
      setConfig(DEFAULT_CONFIG);
      setError('Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (newConfig) => {
    if (!user) return false;

    try {
      const response = await fetch('/api/breadcrumb/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.access_token}`
        },
        body: JSON.stringify(newConfig)
      });
      
      if (response.ok) {
        const data = await response.json();
        setConfig({ ...DEFAULT_CONFIG, ...data.config });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update breadcrumb config:', err);
      setError('Failed to save configuration');
      return false;
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [user]);

  return {
    config,
    isLoading,
    error,
    updateConfig,
    refreshConfig: fetchConfig
  };
};