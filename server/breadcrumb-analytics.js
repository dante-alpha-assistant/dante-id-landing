import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Track breadcrumb click analytics
export const trackBreadcrumbClick = async (req, res) => {
  try {
    const { 
      breadcrumbPath,
      clickedSegment, 
      sourceRoute, 
      targetRoute 
    } = req.body;
    
    const userId = req.user?.id;

    const { error } = await supabase
      .from('breadcrumb_analytics')
      .insert({
        user_id: userId,
        breadcrumb_path: breadcrumbPath,
        clicked_segment: clickedSegment,
        source_route: sourceRoute,
        target_route: targetRoute
      });

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Breadcrumb analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to track breadcrumb analytics',
      details: error.message 
    });
  }
};

// Get breadcrumb usage analytics
export const getBreadcrumbAnalytics = async (req, res) => {
  try {
    const { timeRange = '7d' } = req.query;
    const userId = req.user?.id;

    let dateFilter = new Date();
    if (timeRange === '7d') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (timeRange === '30d') {
      dateFilter.setDate(dateFilter.getDate() - 30);
    } else if (timeRange === '90d') {
      dateFilter.setDate(dateFilter.getDate() - 90);
    }

    // Most clicked segments
    const { data: segmentStats, error: segmentError } = await supabase
      .from('breadcrumb_analytics')
      .select('clicked_segment')
      .eq('user_id', userId)
      .gte('timestamp', dateFilter.toISOString())
      .order('timestamp', { ascending: false });

    if (segmentError) throw segmentError;

    // Most common navigation paths
    const { data: pathStats, error: pathError } = await supabase
      .from('breadcrumb_analytics')
      .select('source_route, target_route')
      .eq('user_id', userId)
      .gte('timestamp', dateFilter.toISOString())
      .order('timestamp', { ascending: false })
      .limit(100);

    if (pathError) throw pathError;

    // Process segment clicks
    const segmentCounts = segmentStats.reduce((acc, { clicked_segment }) => {
      acc[clicked_segment] = (acc[clicked_segment] || 0) + 1;
      return acc;
    }, {});

    // Process navigation patterns
    const pathCounts = pathStats.reduce((acc, { source_route, target_route }) => {
      const path = `${source_route} → ${target_route}`;
      acc[path] = (acc[path] || 0) + 1;
      return acc;
    }, {});

    res.json({
      timeRange,
      totalClicks: segmentStats.length,
      topSegments: Object.entries(segmentCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([segment, count]) => ({ segment, count })),
      topPaths: Object.entries(pathCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([path, count]) => ({ path, count }))
    });
  } catch (error) {
    console.error('Get breadcrumb analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to get breadcrumb analytics',
      details: error.message 
    });
  }
};