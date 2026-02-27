import React, { useEffect } from 'react';
import { MobileActivityFeed } from '../components/mobile/MobileActivityFeed';
import { useMobilePreferences } from '../hooks/useMobilePreferences';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function MobileDashboard() {
  const { preferences } = useMobilePreferences();
  const { user } = useAuth();

  useEffect(() => {
    // Track mobile dashboard visit
    if (user) {
      const sessionId = crypto.randomUUID();
      
      supabase.from('mobile_analytics').insert({
        user_id: user.id,
        session_id: sessionId,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        interaction_type: 'touch',
        component_id: 'mobile_dashboard',
        performance_score: 100 // Could be calculated based on load time
      }).then(({ error }) => {
        if (error) {
          console.error('Error logging mobile analytics:', error);
        }
      });
    }
  }, [user]);

  return (
    <div 
      className="h-screen bg-gray-50 overflow-hidden"
      style={{
        fontSize: preferences?.data_saver_mode ? '14px' : '16px'
      }}
    >
      <MobileActivityFeed />
    </div>
  );
}