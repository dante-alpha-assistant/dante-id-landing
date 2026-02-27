import { useEffect } from 'react';
import { useMotionPreference } from '../../hooks/useMotionPreference';

interface MotionPreferenceDetectorProps {
  onPreferenceDetected: (prefersReducedMotion: boolean) => void;
  fallbackValue?: boolean;
}

export const MotionPreferenceDetector = ({ 
  onPreferenceDetected, 
  fallbackValue = false 
}: MotionPreferenceDetectorProps) => {
  const prefersReducedMotion = useMotionPreference(fallbackValue);

  useEffect(() => {
    onPreferenceDetected(prefersReducedMotion);
  }, [prefersReducedMotion, onPreferenceDetected]);

  return null;
};