import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
// Placeholder: TransitionPreview (auto-inlined);
import { useThemeTransition } from '../../contexts/ThemeTransitionContext';
import { useMotionPreference } from '../../hooks/useMotionPreference';

interface ThemePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: {
    transitionEnabled: boolean;
    duration: number;
    reduceMotion: boolean;
  };
  onSave: (settings: any) => void;
}

export const ThemePreferencesModal = ({ 
  isOpen, 
  onClose, 
  currentSettings, 
  onSave 
}: ThemePreferencesModalProps) => {
  const [settings, setSettings] = useState(currentSettings);
  const [isSaving, setIsSaving] = useState(false);
  const systemReduceMotion = useMotionPreference();
  const { setTransitionEnabled, setDuration, setReduceMotion } = useThemeTransition();

  useEffect(() => {
    setSettings(currentSettings);
  }, [currentSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('user_preferences')
          .upsert({
            user_id: user.id,
            transition_enabled: settings.transitionEnabled,
            transition_duration: settings.duration,
            reduce_motion: settings.reduceMotion
          });
      }

      // Update local storage
      localStorage.setItem('theme-transition-preferences', JSON.stringify(settings));
      
      // Update context
      setTransitionEnabled(settings.transitionEnabled);
      setDuration(settings.duration);
      setReduceMotion(settings.reduceMotion);
      
      onSave(settings);
      onClose();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Theme Transition Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Enable Transitions */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Enable Transitions</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Smooth animations when switching themes
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.transitionEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, transitionEnabled: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            {/* Transition Duration */}
            <div className="space-y-2">
              <label className="font-medium">Transition Duration</label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="100"
                  max="500"
                  step="50"
                  value={settings.duration}
                  onChange={(e) => setSettings(prev => ({ ...prev, duration: Number(e.target.value) }))}
                  disabled={!settings.transitionEnabled}
                  className="flex-1"
                />
                <span className="text-sm w-12">{settings.duration}ms</span>
              </div>
            </div>

            {/* Reduce Motion */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium">Reduce Motion</label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Disable animations for accessibility
                  {systemReduceMotion && ' (detected from system)'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.reduceMotion || systemReduceMotion}
                onChange={(e) => setSettings(prev => ({ ...prev, reduceMotion: e.target.checked }))}
                disabled={systemReduceMotion}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Preview */}
          <TransitionPreview 
            duration={settings.duration}
            enabled={settings.transitionEnabled}
            reduceMotion={settings.reduceMotion || systemReduceMotion}
          />

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
function TransitionPreview(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[TransitionPreview]</div>; }
