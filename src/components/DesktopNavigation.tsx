// Placeholder: NavigationLink (auto-inlined)

interface NavigationItem {
  href: string
  label: string
}

interface DesktopNavigationProps {
  items: NavigationItem[]
  currentPath: string
  onItemClick: (target: string) => void
}

export default function DesktopNavigation({ items, currentPath, onItemClick }: DesktopNavigationProps) {
  return (
    <div className="hidden md:flex items-center space-x-8">
      {items.map((item) => (
        <NavigationLink 
          key={item.href}
          href={item.href}
          label={item.label}
          isActive={currentPath === item.href}
          onClick={() => onItemClick(item.label)}
        />
      ))}
    </div>
  )
}
function NavigationLink(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[NavigationLink]</div>; }
