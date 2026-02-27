const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Get user accessibility preferences
const getAccessibilityPreferences = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { data, error } = await supabase
      .from('user_accessibility_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // Not found is OK
      console.error('Error fetching accessibility preferences:', error)
      return res.status(500).json({ error: 'Failed to fetch preferences' })
    }

    // Return default preferences if none found
    const preferences = data || {
      user_id: userId,
      reduce_motion: false,
      high_contrast: false,
      screen_reader: false,
      keyboard_navigation: true,
      focus_indicator_style: 'standard'
    }

    res.json({
      user_id: preferences.user_id,
      high_contrast: preferences.high_contrast,
      reduce_motion: preferences.reduce_motion,
      screen_reader: preferences.screen_reader,
      keyboard_navigation: preferences.keyboard_navigation,
      focus_indicator_style: preferences.focus_indicator_style
    })
  } catch (error) {
    console.error('Error in getAccessibilityPreferences:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Track accessibility analytics
const trackAccessibilityAnalytics = async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { action, page_url, component, input_method } = req.body

    if (!action || !page_url || !component || !input_method) {
      return res.status(400).json({ 
        error: 'Missing required fields: action, page_url, component, input_method' 
      })
    }

    // Validate input_method
    const validInputMethods = ['mouse', 'keyboard', 'screen_reader', 'touch']
    if (!validInputMethods.includes(input_method)) {
      return res.status(400).json({ 
        error: `Invalid input_method. Must be one of: ${validInputMethods.join(', ')}` 
      })
    }

    const { data, error } = await supabase
      .from('accessibility_analytics')
      .insert({
        user_id: userId,
        component,
        action,
        input_method,
        page_url,
        timestamp: new Date().toISOString(),
        success: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error tracking accessibility analytics:', error)
      return res.status(500).json({ error: 'Failed to track analytics' })
    }

    res.json({
      success: true,
      event_id: data.id
    })
  } catch (error) {
    console.error('Error in trackAccessibilityAnalytics:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = {
  getAccessibilityPreferences,
  trackAccessibilityAnalytics
}