-- Update analytics_events table to support back-to-top button tracking
-- Add indexes for better query performance

-- Add index for event_type queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type 
ON analytics_events(event_type);

-- Add index for url-based queries  
CREATE INDEX IF NOT EXISTS idx_analytics_events_url
ON analytics_events(url);

-- Add index for session-based queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id
ON analytics_events(session_id);

-- Add index for time-based queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
ON analytics_events(created_at DESC);

-- Update RLS policy to allow users to insert their own events
DROP POLICY IF EXISTS "Users can insert analytics events" ON analytics_events;
CREATE POLICY "Users can insert analytics events"
ON analytics_events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to view their own analytics events  
DROP POLICY IF EXISTS "Users can view analytics events" ON analytics_events;
CREATE POLICY "Users can view analytics events"
ON analytics_events FOR SELECT
USING (auth.uid() IS NOT NULL);