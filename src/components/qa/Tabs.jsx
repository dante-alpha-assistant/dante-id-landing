import { createContext, useContext, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

const TabsContext = createContext()

export function Tabs({ defaultTab = 'overview', children }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [active, setActive] = useState(searchParams.get('tab') || defaultTab)

  useEffect(() => {
    const t = searchParams.get('tab')
    if (t && t !== active) setActive(t)
  }, [searchParams])

  const select = (tab) => {
    setActive(tab)
    setSearchParams({ tab })
  }

  return (
    <TabsContext.Provider value={{ active, select }}>
      {children}
    </TabsContext.Provider>
  )
}

export function TabList({ children }) {
  return (
    <div className="flex items-center gap-6 border-b border-md-outline-variant h-12 mb-6">
      {children}
    </div>
  )
}

export function Tab({ value, children }) {
  const { active, select } = useContext(TabsContext)
  const isActive = active === value
  return (
    <button
      onClick={() => select(value)}
      className={`h-full px-1 text-sm transition-colors ${
        isActive
          ? 'text-purple-600 border-b-2 border-purple-600 font-bold'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

export function TabPanel({ value, children }) {
  const { active } = useContext(TabsContext)
  if (active !== value) return null
  return <div className="pt-6">{children}</div>
}
