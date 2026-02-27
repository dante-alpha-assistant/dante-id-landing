export interface MobilePreferences {
  user_id: string;
  touch_target_size: number;
  animation_enabled: boolean;
  haptic_feedback: boolean;
  data_saver_mode: boolean;
  created_at: string;
  updated_at: string;
}

export interface MobileAnalytics {
  id: string;
  user_id: string;
  session_id: string;
  viewport_width: number;
  viewport_height: number;
  interaction_type: 'touch' | 'scroll' | 'swipe' | 'pinch';
  component_id: string;
  performance_score: number;
  timestamp: string;
}

export interface MobileOptimizedActivity {
  id: string;
  icon: string;
  project: {
    id: string;
    name: string;
    short_name: string;
  };
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  event_type: string;
  description: string;
  touch_priority: number;
  compressed_description?: string;
}

export interface ViewportConfig {
  item_height: number;
  visible_items: number;
  touch_target_size: number;
}

export interface TouchEvent {
  type: string;
  target: HTMLElement;
  touches: TouchList;
  preventDefault: () => void;
}