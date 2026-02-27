import { useEffect, useCallback } from 'react';

interface CSSTransitionsConfig {
  duration: number;
  enabled: boolean;
  reduceMotion: boolean;
}

export const useCSSTransitions = (config: CSSTransitionsConfig) => {
  const applyTransitionStyles = useCallback(() => {
    const duration = config.reduceMotion ? 0 : config.enabled ? config.duration : 0;
    
    const transitionStyle = `
      * {
        transition: 
          background-color ${duration}ms ease-in-out,
          color ${duration}ms ease-in-out,
          border-color ${duration}ms ease-in-out,
          box-shadow ${duration}ms ease-in-out !important;
      }
    `;

    let styleElement = document.getElementById('theme-transitions');
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'theme-transitions';
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = transitionStyle;
  }, [config]);

  const removeTransitionStyles = useCallback(() => {
    const styleElement = document.getElementById('theme-transitions');
    if (styleElement) {
      styleElement.remove();
    }
  }, []);

  useEffect(() => {
    applyTransitionStyles();
    
    return () => {
      removeTransitionStyles();
    };
  }, [applyTransitionStyles, removeTransitionStyles]);

  return {
    applyTransitionStyles,
    removeTransitionStyles
  };
};