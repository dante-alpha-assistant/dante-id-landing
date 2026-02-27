import React, { createContext, useContext, useState } from 'react'

const BreadcrumbContext = createContext()

export const BreadcrumbProvider = ({ children, config = {} }) => {
  const [breadcrumbConfig, setBreadcrumbConfig] = useState({
    maxDepth: 5,
    homeRoute: '/dashboard',
    homeLabel: 'Breadcrumb Nav',
    separator: '/',
    showHome: true,
    routeMappings: {
      dashboard: 'Dashboard',
      users: 'User Management',
      settings: 'Settings',
      profile: 'Profile',
      refinery: 'Refinery',
      foundry: 'Foundry',
      planner: 'Planner',
      builder: 'Builder',
      inspector: 'Inspector',
      deployer: 'Deployer',
      validator: 'Validator',
      iterate: 'Iterate',
      usage: 'Usage',
      github: 'GitHub',
      repos: 'Repositories'
    },
    excludePatterns: [
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUIDs
      /^\d+$/, // Numbers
      /^edit$/,
      /^new$/
    ],
    ...config
  })

  const updateConfig = (newConfig) => {
    setBreadcrumbConfig(prev => ({ ...prev, ...newConfig }))
  }

  const getDisplayLabel = (segment) => {
    const mappings = breadcrumbConfig.routeMappings
    return mappings[segment] || formatSegment(segment)
  }

  const formatSegment = (segment) => {
    return segment
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const value = {
    config: breadcrumbConfig,
    updateConfig,
    getDisplayLabel
  }

  return (
    <BreadcrumbContext.Provider value={value}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export const useBreadcrumbContext = () => {
  const context = useContext(BreadcrumbContext)
  if (!context) {
    throw new Error('useBreadcrumbContext must be used within BreadcrumbProvider')
  }
  return context
}