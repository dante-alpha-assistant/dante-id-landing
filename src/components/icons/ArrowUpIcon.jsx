/**
 * Material Design 3 compliant arrow up icon
 * @param {Object} props
 * @param {number} props.size - Icon size in pixels
 * @param {string} props.color - Icon color
 * @param {string} props.className - Additional CSS classes
 */
export const ArrowUpIcon = ({ 
  size = 24, 
  color = 'currentColor', 
  className = '' 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  );
};