-- Webhook Events Table
-- Stores incoming webhook events from GitHub for processing

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('github', 'stripe')),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at DESC);

-- Row Level Security (service role only for writes, no user reads)
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can insert webhook events
CREATE POLICY "Service role can insert webhook events"
  ON webhook_events FOR INSERT
  WITH CHECK (true);

-- Only service role can read webhook events  
CREATE POLICY "Service role can read webhook events"
  ON webhook_events FOR SELECT
  USING (true);

-- Only service role can update webhook events
CREATE POLICY "Service role can update webhook events"
  ON webhook_events FOR UPDATE
  USING (true);
