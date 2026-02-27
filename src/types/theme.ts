export interface MD3ColorScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
}

export interface MD3TypographyScale {
  displayLarge: MD3Typography;
  displayMedium: MD3Typography;
  displaySmall: MD3Typography;
  headlineLarge: MD3Typography;
  headlineMedium: MD3Typography;
  headlineSmall: MD3Typography;
  titleLarge: MD3Typography;
  titleMedium: MD3Typography;
  titleSmall: MD3Typography;
  labelLarge: MD3Typography;
  labelMedium: MD3Typography;
  labelSmall: MD3Typography;
  bodyLarge: MD3Typography;
  bodyMedium: MD3Typography;
  bodySmall: MD3Typography;
}

export interface MD3Typography {
  font: string;
  size: string;
  weight: string;
  lineHeight: string;
  tracking: string;
}

export interface MD3MotionTokens {
  duration: {
    short1: string;
    short2: string;
    short3: string;
    short4: string;
    medium1: string;
    medium2: string;
    medium3: string;
    medium4: string;
    long1: string;
    long2: string;
    long3: string;
    long4: string;
    extraLong1: string;
    extraLong2: string;
    extraLong3: string;
    extraLong4: string;
  };
  easing: {
    linear: string;
    standard: string;
    standardAccelerate: string;
    standardDecelerate: string;
    emphasized: string;
    emphasizedAccelerate: string;
    emphasizedDecelerate: string;
  };
}

export interface MD3ShapeTokens {
  cornerNone: string;
  cornerExtraSmall: string;
  cornerSmall: string;
  cornerMedium: string;
  cornerLarge: string;
  cornerExtraLarge: string;
  cornerFull: string;
}

export interface MD3ElevationTokens {
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
  level5: string;
}

export interface MD3Theme {
  colors: MD3ColorScheme;
  typography: MD3TypographyScale;
  motion: MD3MotionTokens;
  shape: MD3ShapeTokens;
  elevation: MD3ElevationTokens;
}

export type MD3ButtonVariant = 'elevated' | 'filled' | 'filled-tonal' | 'outlined' | 'text';
export type MD3ButtonSize = 'small' | 'medium' | 'large';

export interface MD3ButtonProps {
  variant?: MD3ButtonVariant;
  size?: MD3ButtonSize;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
  fullWidth?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}