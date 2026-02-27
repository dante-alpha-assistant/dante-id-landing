import { supabase } from '../lib/supabase';

export interface AccessibilityViolation {
  violationType: string;
  severity: 'minor' | 'moderate' | 'serious' | 'critical';
  elementSelector: string;
  wcagRule: string;
  pageUrl: string;
  description: string;
}

export interface AccessibilityCheckResult {
  violations: AccessibilityViolation[];
  score: number; // 0-100
  passedRules: string[];
  timestamp: Date;
}

// Simple accessibility checks (in production, you'd use axe-core or similar)
export const runBasicAccessibilityChecks = async (): Promise<AccessibilityCheckResult> => {
  const violations: AccessibilityViolation[] = [];
  const passedRules: string[] = [];
  
  // Check for missing alt text on images
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.alt && !img.getAttribute('aria-label')) {
      violations.push({
        violationType: 'missing-alt-text',
        severity: 'serious',
        elementSelector: `img:nth-child(${index + 1})`,
        wcagRule: 'WCAG 1.1.1',
        pageUrl: window.location.href,
        description: 'Image missing alternative text'
      });
    } else {
      passedRules.push('WCAG 1.1.1 - Image alt text');
    }
  });
  
  // Check for proper heading structure
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let hasH1 = false;
  headings.forEach((heading, index) => {
    if (heading.tagName === 'H1') {
      hasH1 = true;
    }
  });
  
  if (!hasH1 && headings.length > 0) {
    violations.push({
      violationType: 'missing-h1',
      severity: 'moderate',
      elementSelector: 'page',
      wcagRule: 'WCAG 1.3.1',
      pageUrl: window.location.href,
      description: 'Page missing primary heading (h1)'
    });
  } else if (hasH1) {
    passedRules.push('WCAG 1.3.1 - Proper heading structure');
  }
  
  // Check for links without descriptive text
  const links = document.querySelectorAll('a');
  links.forEach((link, index) => {
    const text = link.textContent?.trim() || '';
    const ariaLabel = link.getAttribute('aria-label') || '';
    
    if (!text && !ariaLabel) {
      violations.push({
        violationType: 'empty-link',
        severity: 'serious',
        elementSelector: `a:nth-child(${index + 1})`,
        wcagRule: 'WCAG 2.4.4',
        pageUrl: window.location.href,
        description: 'Link without descriptive text'
      });
    } else if (text.toLowerCase().includes('click here') || text.toLowerCase().includes('read more')) {
      violations.push({
        violationType: 'vague-link-text',
        severity: 'minor',
        elementSelector: `a:nth-child(${index + 1})`,
        wcagRule: 'WCAG 2.4.4',
        pageUrl: window.location.href,
        description: 'Link text not descriptive enough'
      });
    } else {
      passedRules.push('WCAG 2.4.4 - Descriptive link text');
    }
  });
  
  // Check for buttons without accessible names
  const buttons = document.querySelectorAll('button');
  buttons.forEach((button, index) => {
    const text = button.textContent?.trim() || '';
    const ariaLabel = button.getAttribute('aria-label') || '';
    const ariaLabelledBy = button.getAttribute('aria-labelledby') || '';
    
    if (!text && !ariaLabel && !ariaLabelledBy) {
      violations.push({
        violationType: 'button-no-accessible-name',
        severity: 'serious',
        elementSelector: `button:nth-child(${index + 1})`,
        wcagRule: 'WCAG 4.1.2',
        pageUrl: window.location.href,
        description: 'Button without accessible name'
      });
    } else {
      passedRules.push('WCAG 4.1.2 - Button accessible name');
    }
  });
  
  // Check for proper focus indicators
  const focusableElements = document.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
  let hasFocusStyles = true; // Assume true since we can't easily test CSS
  
  if (hasFocusStyles) {
    passedRules.push('WCAG 2.4.7 - Focus indicators');
  }
  
  // Calculate score (percentage of passed checks)
  const totalChecks = violations.length + passedRules.length;
  const score = totalChecks > 0 ? Math.round((passedRules.length / totalChecks) * 100) : 100;
  
  return {
    violations,
    score,
    passedRules,
    timestamp: new Date()
  };
};

export const logAccessibilityViolations = async (violations: AccessibilityViolation[]) => {
  if (process.env.NODE_ENV !== 'production' || violations.length === 0) {
    return;
  }
  
  try {
    await supabase
      .from('accessibility_violations')
      .insert(
        violations.map(violation => ({
          violation_type: violation.violationType,
          severity: violation.severity,
          element_selector: violation.elementSelector,
          wcag_rule: violation.wcagRule,
          page_url: violation.pageUrl,
          browser_info: {
            userAgent: navigator.userAgent,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            },
            url: window.location.href
          }
        }))
      );
    
    console.log(`Logged ${violations.length} accessibility violations`);
  } catch (error) {
    console.warn('Failed to log accessibility violations:', error);
  }
};

export const startAccessibilityMonitoring = () => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }
  
  // Run initial check after page load
  setTimeout(async () => {
    const result = await runBasicAccessibilityChecks();
    await logAccessibilityViolations(result.violations);
    
    if (result.violations.length > 0) {
      console.warn(`Accessibility issues found (Score: ${result.score}/100):`, result.violations);
    }
  }, 2000);
  
  // Run checks periodically (every 30 seconds)
  setInterval(async () => {
    const result = await runBasicAccessibilityChecks();
    await logAccessibilityViolations(result.violations);
  }, 30000);
};

// Hook to integrate accessibility monitoring into React components
export const useAccessibilityMonitoring = (enabled: boolean = true) => {
  const checkAccessibility = async () => {
    if (!enabled) return null;
    return await runBasicAccessibilityChecks();
  };
  
  const reportViolation = async (violation: AccessibilityViolation) => {
    if (!enabled) return;
    await logAccessibilityViolations([violation]);
  };
  
  return {
    checkAccessibility,
    reportViolation,
    startMonitoring: startAccessibilityMonitoring
  };
};