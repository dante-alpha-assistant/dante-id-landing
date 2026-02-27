import { useLocation, useParams } from 'react-router-dom'
import { useMemo } from 'react'

const useBreadcrumb = ({ maxDepth = 5, homeRoute = '/dashboard', homeLabel = 'Breadcrumb Nav' } = {}) => {
  const location = useLocation()
  const params = useParams()
  
  const breadcrumbItems = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean)
    const items = []
    
    // Add home item
    items.push({
      label: homeLabel,
      path: homeRoute,
      isActive: location.pathname === homeRoute
    })
    
    // Build breadcrumb trail from segments
    let currentPath = ''
    for (let i = 0; i < segments.length && items.length < maxDepth; i++) {
      const segment = segments[i]
      currentPath += `/${segment}`
      
      // Skip dynamic parameters (UUIDs, numbers)
      if (isDynamicParam(segment, params)) {
        continue
      }
      
      const label = formatLabel(segment)
      const isActive = currentPath === location.pathname
      
      items.push({
        label,
        path: currentPath,
        isActive
      })
    }
    
    return items
  }, [location.pathname, maxDepth, homeRoute, homeLabel, params])
  
  return { breadcrumbItems }
}

// Check if segment is a dynamic parameter
const isDynamicParam = (segment, params) => {
  // Check if it's a UUID pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidPattern.test(segment)) return true
  
  // Check if it's a number
  if (/^\d+$/.test(segment)) return true
  
  // Check if it's one of the route params
  return Object.values(params).includes(segment)
}

// Convert segment to human-readable label
const formatLabel = (segment) => {
  // Convert kebab-case and snake_case to Title Case
  return segment
    .replace(/[-_]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default useBreadcrumb