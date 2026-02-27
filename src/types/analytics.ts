export interface ThemeDetectionEvent {
  id?: string;
  detected_theme: 'light' | 'dark';
  user_agent: string;
  supports_prefers_color_scheme: boolean;
  user_id?: string | null;
  session_id?: string;
  timestamp: string;
}

export interface UserPreferences {
  user_id: string;
  theme_preference: 'light' | 'dark' | 'system';
  disable_transitions: boolean;
  system_preference_detected: boolean;
  created_at: string;
  updated_at: string;
}