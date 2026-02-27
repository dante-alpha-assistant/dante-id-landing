export interface Activity {
  id: string;
  user_id: string;
  project_id: string;
  event_type: string;
  description: string;
  metadata: any;
  timestamp: string;
  project_name: string;
  is_read: boolean;
  created_at: string;
}

export interface ActivityResponse {
  data: Activity[];
  pagination: {
    total: number;
    cursor: string | null;
    has_more: boolean;
  };
}

export interface ActivityCountResponse {
  count: number;
  last_activity_timestamp: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  user_id: string;
}