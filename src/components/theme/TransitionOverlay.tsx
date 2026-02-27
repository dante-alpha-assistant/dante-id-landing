import { useEffect, useState } from 'react';

interface TransitionOverlayProps {
  isTransitioning: boolean;
  duration?: number;
  easing?: string;
}

export const TransitionOverlay = ({ 
  isTransitioning, 
  duration = 250, 
  easing = 'ease-in-out' 
}: TransitionOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isTransitioning) {
      setIsVisible(true);
      
      // Hide overlay after transition completes
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration + 50); // Add small buffer

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isTransitioning, duration]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 bg-transparent z-50 pointer-events-none"
      style={{
        transition: `opacity ${duration}ms ${easing}`,
        opacity: isTransitioning ? 0.01 : 0
      }}
    />
  );
};