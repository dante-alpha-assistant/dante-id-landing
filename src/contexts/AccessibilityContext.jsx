import React, { createContext, useContext, useReducer, useEffect } from 'react';
// Placeholder: useAuth (auto-inlined);

// Accessibility settings context
const AccessibilityContext = createContext(null);

// Action types
const ACCESSIBILITY_ACTIONS = {
  SET_HIGH_CONTRAST: 'SET_HIGH_CONTRAST',
  SET_REDUCE_MOTION: 'SET_REDUCE_MOTION',
  SET_ANNOUNCEMENTS: 'SET_ANNOUNCEMENTS',
  SET_KEYBOARD_NAVIGATION: 'SET_KEYBOARD_NAVIGATION',
  LOAD_SETTINGS: 'LOAD_SETTINGS',
  RESET_SETTINGS: 'RESET_SETTINGS'
};

// Default accessibility settings
const defaultSettings = {
  highContrastMode: false,
  reduceMotion: false,
  screenReaderAnnouncements: true,
  keyboardNavigationEnabled: true,
  loading: false,
  error: null
};

// Accessibility settings reducer
function accessibilityReducer(state, action) {
  switch (action.type) {
    case ACCESSIBILITY_ACTIONS.SET_HIGH_CONTRAST:
      return { ...state, highContrastMode: action.payload };
    
    case ACCESSIBILITY_ACTIONS.SET_REDUCE_MOTION:
      return { ...state, reduceMotion: action.payload };
    
    case ACCESSIBILITY_ACTIONS.SET_ANNOUNCEMENTS:
      return { ...state, screenReaderAnnouncements: action.payload };
    
    case ACCESSIBILITY_ACTIONS.SET_KEYBOARD_NAVIGATION:
      return { ...state, keyboardNavigationEnabled: action.payload };
    
    case ACCESSIBILITY_ACTIONS.LOAD_SETTINGS:
      return { 
        ...state, 
        ...action.payload, 
        loading: false,
        error: null
      };
    
    case ACCESSIBILITY_ACTIONS.RESET_SETTINGS:
      return { ...defaultSettings };
    
    default:
      return state;
  }
}

/**
 * Accessibility provider component
 */
export function AccessibilityProvider({ children }) {
  const [settings, dispatch] = useReducer(accessibilityReducer, defaultSettings);
  const { user } = useAuth();

  // Load user settings on mount or user change
  useEffect(() => {
    if (user) {
      loadUserSettings();
    } else {
      // Load from localStorage for anonymous users
      loadLocalSettings();
    }
  }, [user]);

  // Apply settings to document for global accessibility features
  useEffect(() => {
    const { highContrastMode, reduceMotion } = settings;
    
    // Apply high contrast mode
    if (highContrastMode) {
      document.documentElement.setAttribute('data-accessibility-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-accessibility-contrast');
    }

    // Apply reduced motion preference
    if (reduceMotion) {
      document.documentElement.setAttribute('data-accessibility-motion', 'reduce');
    } else {
      document.documentElement.removeAttribute('data-accessibility-motion');
    }
  }, [settings.highContrastMode, settings.reduceMotion]);

  const loadUserSettings = async () => {
    try {
      const response = await fetch('/api/accessibility/config', {
        headers: {
          'Authorization': `Bearer ${user.access_token}`
        }
      });
      
      if (response.ok) {
        const { data } = await response.json();
        dispatch({
          type: ACCESSIBILITY_ACTIONS.LOAD_SETTINGS,
          payload: {
            highContrastMode: data.contrast_mode === 'high',
            reduceMotion: data.announcements?.enabled === false,
            screenReaderAnnouncements: data.announcements?.enabled ?? true,
            keyboardNavigationEnabled: data.focus_indicators ?? true
          }
        });
      } else {
        // Fallback to local settings if API fails
        loadLocalSettings();
      }
    } catch (error) {
      console.warn('Failed to load accessibility settings:', error);
      loadLocalSettings();
    }
  };

  const loadLocalSettings = () => {
    try {
      const savedSettings = localStorage.getItem('accessibility-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        dispatch({
          type: ACCESSIBILITY_ACTIONS.LOAD_SETTINGS,
          payload: { ...defaultSettings, ...parsed }
        });
      }
    } catch (error) {
      console.warn('Failed to load local accessibility settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    // Always save to localStorage
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
    } catch (error) {
      console.warn('Failed to save accessibility settings locally:', error);
    }

    // Save to API if user is authenticated
    if (user) {
      try {
        await fetch('/api/accessibility/config', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}`
          },
          body: JSON.stringify({
            high_contrast_mode: newSettings.highContrastMode,
            reduce_motion: newSettings.reduceMotion,
            screen_reader_announcements: newSettings.screenReaderAnnouncements,
            keyboard_navigation_enabled: newSettings.keyboardNavigationEnabled
          })
        });
      } catch (error) {
        console.warn('Failed to save accessibility settings to server:', error);
      }
    }
  };

  const updateSetting = (type, value) => {
    dispatch({ type, payload: value });
    
    const newSettings = {
      ...settings,
      [type.split('_')[1].toLowerCase() + type.split('_').slice(2).join('')]: value
    };
    
    saveSettings(newSettings);
  };

  const contextValue = {
    settings,
    setHighContrast: (value) => updateSetting(ACCESSIBILITY_ACTIONS.SET_HIGH_CONTRAST, value),
    setReduceMotion: (value) => updateSetting(ACCESSIBILITY_ACTIONS.SET_REDUCE_MOTION, value),
    setAnnouncements: (value) => updateSetting(ACCESSIBILITY_ACTIONS.SET_ANNOUNCEMENTS, value),
    setKeyboardNavigation: (value) => updateSetting(ACCESSIBILITY_ACTIONS.SET_KEYBOARD_NAVIGATION, value),
    resetSettings: () => {
      dispatch({ type: ACCESSIBILITY_ACTIONS.RESET_SETTINGS });
      saveSettings(defaultSettings);
    }
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
}

/**
 * Hook to use accessibility context
 */
export function useAccessibilitySettings() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilitySettings must be used within AccessibilityProvider');
  }
  return context;
}
function useAuth(props) { return <div className="p-2 border border-dashed border-gray-400 rounded text-sm text-gray-500">[useAuth]</div>; }
