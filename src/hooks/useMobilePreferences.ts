import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MobilePreferences } from '../types/mobile';
import { useAuth } from '../context/AuthContext';

export function useMobilePreferences() {
  const [preferences, setPreferences] = useState<MobilePreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('mobile_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        // Create default preferences
        const { data: newPrefs, error: createError } = await supabase
          .from('mobile_preferences')
          .insert({
            user_id: user.id,
            touch_target_size: 44,
            animation_enabled: true,
            haptic_feedback: true,
            data_saver_mode: false
          })
          .select()
          .single();

        if (createError) throw createError;
        setPreferences(newPrefs);
      } else {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching mobile preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<MobilePreferences>) => {
    if (!user || !preferences) return;

    try {
      const { data, error } = await supabase
        .from('mobile_preferences')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
    } catch (error) {
      console.error('Error updating mobile preferences:', error);
    }
  };

  return {
    preferences,
    loading,
    updatePreferences
  };
}