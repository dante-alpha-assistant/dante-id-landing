interface NavigationAnalyticsEvent {
  eventType: string;
  elementId: string;
  pagePath: string;
  deviceType: string;
  userAgent?: string;
  sessionId?: string;
}

const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
};

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('navigation_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('navigation_session_id', sessionId);
  }
  return sessionId;
};

export const trackNavigationEvent = async (eventType: string, elementId: string): Promise<void> => {
  try {
    const event: NavigationAnalyticsEvent = {
      eventType,
      elementId,
      pagePath: window.location.pathname,
      deviceType: getDeviceType(),
      userAgent: navigator.userAgent,
      sessionId: getSessionId()
    };

    // Send to analytics service (can be replaced with actual analytics provider)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventType, {
        custom_parameter_1: elementId,
        custom_parameter_2: event.deviceType,
        page_path: event.pagePath
      });
    }

    // For development/demo, log to console
    console.log('Navigation Analytics Event:', event);
    
    // Could also send to Supabase or other analytics backend
    // await supabase.from('navigation_analytics').insert([event]);
  } catch (error) {
    console.warn('Failed to track navigation event:', error);
  }
};

export const trackCTAClick = (ctaType: 'login' | 'signup'): void => {
  trackNavigationEvent('cta_click', `nav_${ctaType}_button`);
};

export const trackNavLinkClick = (linkLabel: string): void => {
  trackNavigationEvent('nav_link_click', `nav_link_${linkLabel.toLowerCase().replace(/\s+/g, '_')}`);
};

export const trackMobileMenuToggle = (action: 'open' | 'close'): void => {
  trackNavigationEvent('mobile_menu_toggle', `mobile_menu_${action}`);
};

export const trackScrollShadow = (isVisible: boolean): void => {
  trackNavigationEvent('scroll_shadow', `shadow_${isVisible ? 'visible' : 'hidden'}`);
};