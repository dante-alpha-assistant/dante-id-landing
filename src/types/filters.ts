export interface FilterState {
  projectIds: string[];
  eventTypes: string[];
  searchQuery: string;
}

export interface ProjectOption {
  id: string;
  name: string;
  activity_count: number;
}

export interface EventTypeOption {
  type: string;
  label: string;
  icon: string;
  count: number;
}

export interface FilterPreferences {
  user_id: string;
  filter_type: 'activity_feed';
  preferences: FilterState;
  session_id?: string;
  expires_at?: string;
}