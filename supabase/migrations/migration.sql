-- Navigation Analytics Table
CREATE TABLE navigation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  element_clicked VARCHAR(100) NOT NULL,
  page_path VARCHAR(255) NOT NULL,
  device_type VARCHAR(20) NOT NULL,
  user_agent TEXT,
  session_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Navigation Configuration Table
CREATE TABLE navigation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_name VARCHAR(50) UNIQUE NOT NULL,
  navigation_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE navigation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can read navigation config" ON navigation_config
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can insert analytics" ON navigation_analytics
  FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_nav_analytics_timestamp ON navigation_analytics(timestamp);
CREATE INDEX idx_nav_analytics_page_path ON navigation_analytics(page_path);
CREATE INDEX idx_nav_analytics_event_type ON navigation_analytics(event_type);
CREATE INDEX idx_nav_config_active ON navigation_config(is_active) WHERE is_active = true;

-- Insert default navigation config
INSERT INTO navigation_config (config_name, navigation_data, is_active) VALUES (
  'default',
  '{
    "features": {
      "shadowEffects": true,
      "stickyBehavior": true
    },
    "navigation": {
      "logo": {
        "alt": "Navigation Bar",
        "src": "/logo.svg",
        "href": "/"
      },
      "links": [
        { "href": "/", "label": "Home", "active": false },
        { "href": "/how-it-works", "label": "How It Works", "active": false },
        { "href": "/pricing", "label": "Pricing", "active": false },
        { "href": "/docs", "label": "Docs", "active": false }
      ],
      "ctas": [
        { "href": "/login", "label": "Log In", "variant": "secondary" },
        { "href": "/signup", "label": "Sign Up", "variant": "primary" }
      ]
    }
  }',
  true
);