import { supabase } from '../lib/supabase';
import { ThemeDetectionEvent } from '../types/analytics';

export async function trackThemeDetection(event: Omit<ThemeDetectionEvent, 'id' | 'user_id' | 'session_id'>): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const eventData = {
      ...event,
      user_id: user?.id || null,
      session_id: generateSessionId()
    };
    
    const { error } = await supabase
      .from('theme_detection_events')
      .insert([eventData]);
    
    if (error) {
      console.error('Failed to track theme detection event:', error);
    }
  } catch (error) {
    console.error('Error tracking theme detection:', error);
  }
}

export async function getUserThemePreferences(): Promise<any> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return null;
    }
    
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Failed to get theme preferences:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting theme preferences:', error);
    return null;
  }
}

export async function saveUserThemePreferences(preferences: {
  theme_preference: string;
  disable_transitions?: boolean;
  system_preference_detected?: boolean;
}): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return;
    }
    
    const { error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Failed to save theme preferences:', error);
    }
  } catch (error) {
    console.error('Error saving theme preferences:', error);
  }
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}