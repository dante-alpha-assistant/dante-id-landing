interface MobileMenuToggleProps {
  isOpen: boolean
  onToggle: () => void
}

export default function MobileMenuToggle({ isOpen, onToggle }: MobileMenuToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`md:hidden flex flex-col justify-center items-center w-8 h-8 space-y-1 ${
        isOpen ? 'hamburger-active' : ''
      }`}
      aria-label="Toggle mobile menu"
      aria-expanded={isOpen}
    >
      <div className="hamburger-line"></div>
      <div className="hamburger-line"></div>
      <div className="hamburger-line"></div>
    </button>
  )
}