import React from 'react';

/**
 * Circular progress indicator showing scroll percentage
 * @param {Object} props
 * @param {boolean} props.visible - Whether indicator is visible
 * @param {number} props.strokeWidth - SVG stroke width (default: 2)
 * @param {number} props.size - Circle size in pixels (default: 48)
 * @param {number} props.progress - Progress percentage (0-100)
 */
function ScrollProgressIndicator({ 
  visible = true, 
  strokeWidth = 2, 
  size = 48, 
  progress = 0 
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  if (!visible) return null;

  return (
    <svg
      className="absolute inset-0"
      width={size}
      height={size}
      style={{ transform: 'rotate(-90deg)' }}
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#33ff0033"
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#33ff00"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-150 ease-out"
      />
    </svg>
  );
}

export default ScrollProgressIndicator;