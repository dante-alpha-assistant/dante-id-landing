import { Link } from 'react-router-dom'

interface BrandLogoProps {
  onClick?: () => void
}

export default function BrandLogo({ onClick }: BrandLogoProps) {
  return (
    <Link 
      to="/" 
      className="flex items-center space-x-2 text-2xl font-bold text-gray-900 hover:text-md-primary transition-colors"
      onClick={onClick}
    >
      <div className="w-8 h-8 bg-md-primary rounded-md flex items-center justify-center">
        <span className="text-white font-bold text-sm">D</span>
      </div>
      <span>dante.id</span>
    </Link>
  )
}