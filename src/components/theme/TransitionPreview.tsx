import { useState } from 'react';
// Placeholder: ToggleIcon (auto-inlined);

interface TransitionPreviewProps {
  duration: number;
  enabled: boolean;
  reduceMotion: boolean;
}

export const TransitionPreview = ({ duration, enabled, reduceMotion }: TransitionPreviewProps) => {
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const triggerPreview = () => {
    if (!enabled || reduceMotion) {
      setPreviewTheme(previewTheme === 'light' ? 'dark' : 'light');
      return;
    }

    setIsTransitioning(true);
    
    setTimeout(() => {
      setPreviewTheme(previewTheme === 'light' ? 'dark' : 'light');
    }, 50);

    setTimeout(() => {
      setIsTransitioning(false);
    }, duration + 100);
  };

  const effectiveDuration = reduceMotion ? 0 : enabled ? duration : 0;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Transition Preview</h4>
        <button
          onClick={triggerPreview}
          disabled={isTransitioning}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          Test Transition
        </button>
      </div>
      
      <div 
        className={`p-4 rounded-lg transition-colors ${previewTheme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
        style={{
          transitionDuration: `${effectiveDuration}ms`,
          transitionTimingFunction: 'ease-in-out'
        }}
      >
        <div className="flex items-center space-x-3">
          <ToggleIcon 
            theme={previewTheme} 
            isTransitioning={isTransitioning}
            size={24}
          />
          <div>
            <p className="font-medium">
              {previewTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </p>
            <p className="text-sm opacity-70">
              Duration: {effectiveDuration}ms
            </p>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-600 dark:text-gray-400">
        {!enabled && 'Transitions disabled'}
        {enabled && reduceMotion && 'Reduced motion detected'}
        {enabled && !reduceMotion && `Smooth transitions: ${duration}ms`}
      </div>
    </div>
  );
};
function ToggleIcon(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[ToggleIcon]</div>; }
