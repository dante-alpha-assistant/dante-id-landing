/**
 * Lightweight analytics tracking for dante.id landing pages
 * Plausible-compatible API format
 */

// Analytics tracking script to be injected into landing pages
const ANALYTICS_SCRIPT = `
<script>
(function() {
  const PROJECT_ID = '{{PROJECT_ID}}';
  const ANALYTICS_HOST = 'https://dante.id';
  
  // Generate session ID
  const getSessionId = () => {
    let sid = localStorage.getItem('dante_sid');
    if (!sid) {
      sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('dante_sid', sid);
    }
    return sid;
  };
  
  // Track page view
  const track = (event, props = {}) => {
    const data = {
      p: PROJECT_ID,
      e: event,
      u: window.location.href,
      r: document.referrer || null,
      s: getSessionId(),
      t: Date.now(),
      ...props
    };
    
    // Send via beacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ANALYTICS_HOST + '/api/analytics/track', JSON.stringify(data));
    } else {
      fetch(ANALYTICS_HOST + '/api/analytics/track', {
        method: 'POST',
        body: JSON.stringify(data),
        keepalive: true,
        headers: { 'Content-Type': 'application/json' }
      }).catch(() => {});
    }
  };
  
  // Track pageview on load
  track('pageview');
  
  // Track CTA clicks
  document.querySelectorAll('a[href^="#"], button, .cta').forEach(el => {
    el.addEventListener('click', () => {
      track('cta_click', { 
        btn: el.textContent?.substring(0, 50) || 'unknown',
        href: el.href || null 
      });
    });
  });
  
  // Track scroll depth (25%, 50%, 75%, 100%)
  let scrolled25, scrolled50, scrolled75, scrolled100;
  window.addEventListener('scroll', () => {
    const pct = (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100;
    if (!scrolled25 && pct >= 25) { scrolled25 = true; track('scroll', { d: 25 }); }
    if (!scrolled50 && pct >= 50) { scrolled50 = true; track('scroll', { d: 50 }); }
    if (!scrolled75 && pct >= 75) { scrolled75 = true; track('scroll', { d: 75 }); }
    if (!scrolled100 && pct >= 98) { scrolled100 = true; track('scroll', { d: 100 }); }
  }, { passive: true });
})();
</script>
`;

function injectAnalytics(htmlContent, projectId) {
  const script = ANALYTICS_SCRIPT.replace('{{PROJECT_ID}}', projectId);
  
  // Insert before closing </head> or </body>
  if (htmlContent.includes('</head>')) {
    return htmlContent.replace('</head>', script + '\n</head>');
  }
  if (htmlContent.includes('</body>')) {
    return htmlContent.replace('</body>', script + '\n</body>');
  }
  // Fallback: append to end
  return htmlContent + script;
}

module.exports = { ANALYTICS_SCRIPT, injectAnalytics };
