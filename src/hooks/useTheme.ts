import { useState, useEffect } from 'react';
import { MD3Theme } from '../types/theme';

const defaultTheme: MD3Theme = {
  colors: {
    primary: 'var(--md3-sys-color-primary)',
    onPrimary: 'var(--md3-sys-color-on-primary)',
    primaryContainer: 'var(--md3-sys-color-primary-container)',
    onPrimaryContainer: 'var(--md3-sys-color-on-primary-container)',
    secondary: 'var(--md3-sys-color-secondary)',
    onSecondary: 'var(--md3-sys-color-on-secondary)',
    secondaryContainer: 'var(--md3-sys-color-secondary-container)',
    onSecondaryContainer: 'var(--md3-sys-color-on-secondary-container)',
    tertiary: 'var(--md3-sys-color-tertiary)',
    onTertiary: 'var(--md3-sys-color-on-tertiary)',
    tertiaryContainer: 'var(--md3-sys-color-tertiary-container)',
    onTertiaryContainer: 'var(--md3-sys-color-on-tertiary-container)',
    error: 'var(--md3-sys-color-error)',
    onError: 'var(--md3-sys-color-on-error)',
    errorContainer: 'var(--md3-sys-color-error-container)',
    onErrorContainer: 'var(--md3-sys-color-on-error-container)',
    background: 'var(--md3-sys-color-background)',
    onBackground: 'var(--md3-sys-color-on-background)',
    surface: 'var(--md3-sys-color-surface)',
    onSurface: 'var(--md3-sys-color-on-surface)',
    surfaceVariant: 'var(--md3-sys-color-surface-variant)',
    onSurfaceVariant: 'var(--md3-sys-color-on-surface-variant)',
    outline: 'var(--md3-sys-color-outline)',
    outlineVariant: 'var(--md3-sys-color-outline-variant)',
    shadow: 'var(--md3-sys-color-shadow)',
    scrim: 'var(--md3-sys-color-scrim)',
    inverseSurface: 'var(--md3-sys-color-inverse-surface)',
    inverseOnSurface: 'var(--md3-sys-color-inverse-on-surface)',
    inversePrimary: 'var(--md3-sys-color-inverse-primary)',
    surfaceDim: 'var(--md3-sys-color-surface-dim)',
    surfaceBright: 'var(--md3-sys-color-surface-bright)',
    surfaceContainerLowest: 'var(--md3-sys-color-surface-container-lowest)',
    surfaceContainerLow: 'var(--md3-sys-color-surface-container-low)',
    surfaceContainer: 'var(--md3-sys-color-surface-container)',
    surfaceContainerHigh: 'var(--md3-sys-color-surface-container-high)',
    surfaceContainerHighest: 'var(--md3-sys-color-surface-container-highest)'
  },
  typography: {
    displayLarge: {
      font: 'var(--md3-sys-typescale-display-large-font)',
      size: 'var(--md3-sys-typescale-display-large-size)',
      weight: 'var(--md3-sys-typescale-display-large-weight)',
      lineHeight: 'var(--md3-sys-typescale-display-large-line-height)',
      tracking: 'var(--md3-sys-typescale-display-large-tracking)'
    },
    displayMedium: {
      font: 'var(--md3-sys-typescale-display-medium-font)',
      size: 'var(--md3-sys-typescale-display-medium-size)',
      weight: 'var(--md3-sys-typescale-display-medium-weight)',
      lineHeight: 'var(--md3-sys-typescale-display-medium-line-height)',
      tracking: 'var(--md3-sys-typescale-display-medium-tracking)'
    },
    displaySmall: {
      font: 'var(--md3-sys-typescale-display-small-font)',
      size: 'var(--md3-sys-typescale-display-small-size)',
      weight: 'var(--md3-sys-typescale-display-small-weight)',
      lineHeight: 'var(--md3-sys-typescale-display-small-line-height)',
      tracking: 'var(--md3-sys-typescale-display-small-tracking)'
    },
    headlineLarge: {
      font: 'var(--md3-sys-typescale-headline-large-font)',
      size: 'var(--md3-sys-typescale-headline-large-size)',
      weight: 'var(--md3-sys-typescale-headline-large-weight)',
      lineHeight: 'var(--md3-sys-typescale-headline-large-line-height)',
      tracking: 'var(--md3-sys-typescale-headline-large-tracking)'
    },
    headlineMedium: {
      font: 'var(--md3-sys-typescale-headline-medium-font)',
      size: 'var(--md3-sys-typescale-headline-medium-size)',
      weight: 'var(--md3-sys-typescale-headline-medium-weight)',
      lineHeight: 'var(--md3-sys-typescale-headline-medium-line-height)',
      tracking: 'var(--md3-sys-typescale-headline-medium-tracking)'
    },
    headlineSmall: {
      font: 'var(--md3-sys-typescale-headline-small-font)',
      size: 'var(--md3-sys-typescale-headline-small-size)',
      weight: 'var(--md3-sys-typescale-headline-small-weight)',
      lineHeight: 'var(--md3-sys-typescale-headline-small-line-height)',
      tracking: 'var(--md3-sys-typescale-headline-small-tracking)'
    },
    titleLarge: {
      font: 'var(--md3-sys-typescale-title-large-font)',
      size: 'var(--md3-sys-typescale-title-large-size)',
      weight: 'var(--md3-sys-typescale-title-large-weight)',
      lineHeight: 'var(--md3-sys-typescale-title-large-line-height)',
      tracking: 'var(--md3-sys-typescale-title-large-tracking)'
    },
    titleMedium: {
      font: 'var(--md3-sys-typescale-title-medium-font)',
      size: 'var(--md3-sys-typescale-title-medium-size)',
      weight: 'var(--md3-sys-typescale-title-medium-weight)',
      lineHeight: 'var(--md3-sys-typescale-title-medium-line-height)',
      tracking: 'var(--md3-sys-typescale-title-medium-tracking)'
    },
    titleSmall: {
      font: 'var(--md3-sys-typescale-title-small-font)',
      size: 'var(--md3-sys-typescale-title-small-size)',
      weight: 'var(--md3-sys-typescale-title-small-weight)',
      lineHeight: 'var(--md3-sys-typescale-title-small-line-height)',
      tracking: 'var(--md3-sys-typescale-title-small-tracking)'
    },
    labelLarge: {
      font: 'var(--md3-sys-typescale-label-large-font)',
      size: 'var(--md3-sys-typescale-label-large-size)',
      weight: 'var(--md3-sys-typescale-label-large-weight)',
      lineHeight: 'var(--md3-sys-typescale-label-large-line-height)',
      tracking: 'var(--md3-sys-typescale-label-large-tracking)'
    },
    labelMedium: {
      font: 'var(--md3-sys-typescale-label-medium-font)',
      size: 'var(--md3-sys-typescale-label-medium-size)',
      weight: 'var(--md3-sys-typescale-label-medium-weight)',
      lineHeight: 'var(--md3-sys-typescale-label-medium-line-height)',
      tracking: 'var(--md3-sys-typescale-label-medium-tracking)'
    },
    labelSmall: {
      font: 'var(--md3-sys-typescale-label-small-font)',
      size: 'var(--md3-sys-typescale-label-small-size)',
      weight: 'var(--md3-sys-typescale-label-small-weight)',
      lineHeight: 'var(--md3-sys-typescale-label-small-line-height)',
      tracking: 'var(--md3-sys-typescale-label-small-tracking)'
    },
    bodyLarge: {
      font: 'var(--md3-sys-typescale-body-large-font)',
      size: 'var(--md3-sys-typescale-body-large-size)',
      weight: 'var(--md3-sys-typescale-body-large-weight)',
      lineHeight: 'var(--md3-sys-typescale-body-large-line-height)',
      tracking: 'var(--md3-sys-typescale-body-large-tracking)'
    },
    bodyMedium: {
      font: 'var(--md3-sys-typescale-body-medium-font)',
      size: 'var(--md3-sys-typescale-body-medium-size)',
      weight: 'var(--md3-sys-typescale-body-medium-weight)',
      lineHeight: 'var(--md3-sys-typescale-body-medium-line-height)',
      tracking: 'var(--md3-sys-typescale-body-medium-tracking)'
    },
    bodySmall: {
      font: 'var(--md3-sys-typescale-body-small-font)',
      size: 'var(--md3-sys-typescale-body-small-size)',
      weight: 'var(--md3-sys-typescale-body-small-weight)',
      lineHeight: 'var(--md3-sys-typescale-body-small-line-height)',
      tracking: 'var(--md3-sys-typescale-body-small-tracking)'
    }
  },
  motion: {
    duration: {
      short1: 'var(--md3-sys-motion-duration-short1)',
      short2: 'var(--md3-sys-motion-duration-short2)',
      short3: 'var(--md3-sys-motion-duration-short3)',
      short4: 'var(--md3-sys-motion-duration-short4)',
      medium1: 'var(--md3-sys-motion-duration-medium1)',
      medium2: 'var(--md3-sys-motion-duration-medium2)',
      medium3: 'var(--md3-sys-motion-duration-medium3)',
      medium4: 'var(--md3-sys-motion-duration-medium4)',
      long1: 'var(--md3-sys-motion-duration-long1)',
      long2: 'var(--md3-sys-motion-duration-long2)',
      long3: 'var(--md3-sys-motion-duration-long3)',
      long4: 'var(--md3-sys-motion-duration-long4)',
      extraLong1: 'var(--md3-sys-motion-duration-extra-long1)',
      extraLong2: 'var(--md3-sys-motion-duration-extra-long2)',
      extraLong3: 'var(--md3-sys-motion-duration-extra-long3)',
      extraLong4: 'var(--md3-sys-motion-duration-extra-long4)'
    },
    easing: {
      linear: 'var(--md3-sys-motion-easing-linear)',
      standard: 'var(--md3-sys-motion-easing-standard)',
      standardAccelerate: 'var(--md3-sys-motion-easing-standard-accelerate)',
      standardDecelerate: 'var(--md3-sys-motion-easing-standard-decelerate)',
      emphasized: 'var(--md3-sys-motion-easing-emphasized)',
      emphasizedAccelerate: 'var(--md3-sys-motion-easing-emphasized-accelerate)',
      emphasizedDecelerate: 'var(--md3-sys-motion-easing-emphasized-decelerate)'
    }
  },
  shape: {
    cornerNone: 'var(--md3-sys-shape-corner-none)',
    cornerExtraSmall: 'var(--md3-sys-shape-corner-extra-small)',
    cornerSmall: 'var(--md3-sys-shape-corner-small)',
    cornerMedium: 'var(--md3-sys-shape-corner-medium)',
    cornerLarge: 'var(--md3-sys-shape-corner-large)',
    cornerExtraLarge: 'var(--md3-sys-shape-corner-extra-large)',
    cornerFull: 'var(--md3-sys-shape-corner-full)'
  },
  elevation: {
    level0: 'var(--md3-sys-elevation-level0)',
    level1: 'var(--md3-sys-elevation-level1)',
    level2: 'var(--md3-sys-elevation-level2)',
    level3: 'var(--md3-sys-elevation-level3)',
    level4: 'var(--md3-sys-elevation-level4)',
    level5: 'var(--md3-sys-elevation-level5)'
  }
};

export const useTheme = () => {
  const [theme, setTheme] = useState<MD3Theme>(defaultTheme);

  useEffect(() => {
    // Load theme from localStorage or API if needed
    const savedTheme = localStorage.getItem('md3_theme');
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme);
        setTheme({ ...defaultTheme, ...parsedTheme });
      } catch (error) {
        console.warn('Failed to parse saved theme, using default:', error);
      }
    }
  }, []);

  const updateTheme = (newTheme: Partial<MD3Theme>) => {
    const updatedTheme = { ...theme, ...newTheme };
    setTheme(updatedTheme);
    localStorage.setItem('md3_theme', JSON.stringify(newTheme));
  };

  return {
    theme,
    updateTheme
  };
};