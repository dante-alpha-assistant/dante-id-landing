import { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { generateLabel, shouldHideSegment } from '../utils/labelGenerator';
import { parseRoutePath, getRouteMetadata } from '../utils/routeParser';

/**
 * Hook for generating breadcrumb navigation data
 * @param {Object} options - Configuration options
 * @returns {Object} - Breadcrumb data and utilities
 */
export function useBreadcrumbs(options = {}) {
  const {
    maxDepth = 5,
    homeRoute = '/',
    excludePatterns = [],
    enableCustomLabels = true
  } = options;
  
  const location = useLocation();
  const [customLabels, setCustomLabels] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Fetch custom labels if enabled
  useEffect(() => {
    if (!enableCustomLabels) return;
    
    const fetchCustomLabels = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/routes/metadata', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const labelMap = {};
          
          if (data.routes) {
            Object.entries(data.routes).forEach(([path, config]) => {
              if (config.customLabel) {
                labelMap[path] = config.customLabel;
              }
            });
          }
          
          setCustomLabels(labelMap);
        }
      } catch (error) {
        console.warn('Failed to fetch custom breadcrumb labels:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomLabels();
  }, [enableCustomLabels]);
  
  // Generate breadcrumb items
  const breadcrumbs = useMemo(() => {
    const segments = parseRoutePath(location.pathname, {
      excludePatterns,
      maxDepth,
      homeRoute
    });
    
    return segments
      .filter(({ segment }) => !shouldHideSegment(segment))
      .map((item, index, array) => {
        const { segment, path, isHome } = item;
        const routeMetadata = getRouteMetadata(path);
        
        // Generate label
        let label;
        if (isHome) {
          label = 'Breadcrumb Nav';
        } else if (customLabels[path]) {
          label = customLabels[path];
        } else if (routeMetadata.label) {
          label = routeMetadata.label;
        } else {
          label = generateLabel(segment, customLabels);
        }
        
        return {
          segment,
          path,
          label,
          icon: routeMetadata.icon,
          isHome,
          isActive: index === array.length - 1,
          isClickable: index < array.length - 1
        };
      })
      .filter(item => item.label); // Remove items without labels
  }, [location.pathname, customLabels, excludePatterns, maxDepth, homeRoute]);
  
  return {
    breadcrumbs,
    loading,
    currentPath: location.pathname,
    refresh: () => {
      // Force re-fetch of custom labels
      if (enableCustomLabels) {
        setCustomLabels({});
      }
    }
  };
}