// Placeholder: useMobilePreferences (auto-inlined);

export function useHapticFeedback() {
  const { preferences } = useMobilePreferences();

  const vibrate = (pattern?: number | number[]) => {
    if (!preferences?.haptic_feedback) return;
    
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern || 10);
    }
  };

  const lightImpact = () => vibrate(10);
  const mediumImpact = () => vibrate(50);
  const heavyImpact = () => vibrate([100, 30, 100]);
  const selection = () => vibrate([10, 10, 10]);
  const notification = () => vibrate([100, 50, 50, 50, 100]);

  return {
    vibrate,
    lightImpact,
    mediumImpact,
    heavyImpact,
    selection,
    notification
  };
}
function useMobilePreferences(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[useMobilePreferences]</div>; }
