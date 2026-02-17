# dante. — Design System

## Color Tokens

```css
:root {
  /* Primary */
  --color-primary: #6C63FF;
  --color-primary-hover: #5B52EE;
  --color-primary-light: rgba(108, 99, 255, 0.12);

  /* Accent */
  --color-accent: #FF6584;
  --color-accent-hover: #E85570;

  /* Backgrounds */
  --color-bg: #0F0E17;
  --color-bg-elevated: #161525;
  --color-bg-card: #1A1930;
  --color-bg-card-hover: #201F3A;

  /* Text */
  --color-text: #FFFFFE;
  --color-text-secondary: #A7A9BE;
  --color-text-muted: #6B6D7B;

  /* Borders */
  --color-border: rgba(255, 255, 255, 0.08);
  --color-border-hover: rgba(255, 255, 255, 0.15);

  /* Semantic */
  --color-success: #2CB67D;
  --color-warning: #FF8906;
  --color-error: #EF4444;
}
```

## Typography

```css
/* Fonts */
--font-heading: 'Space Grotesk', sans-serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Scale */
--text-xs: 12px;     /* labels, captions */
--text-sm: 14px;     /* nav links, small body */
--text-base: 16px;   /* body text */
--text-lg: 18px;     /* large body, subheadlines */
--text-xl: 20px;     /* section subheadlines */
--text-2xl: 24px;    /* card titles */
--text-3xl: 32px;    /* section headlines */
--text-4xl: 40px;    /* page headlines */
--text-5xl: 56px;    /* hero headline */
--text-6xl: 72px;    /* hero headline (desktop) */

/* Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line heights */
--leading-tight: 1.1;    /* headlines */
--leading-snug: 1.3;     /* subheadlines */
--leading-normal: 1.6;   /* body */

/* Max widths */
--prose-max: 680px;       /* body text */
--headline-max: 560px;    /* headlines */
```

## Spacing

```css
/* Base: 4px grid */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;

/* Section spacing */
--section-padding-y: 96px;         /* vertical padding between sections */
--section-padding-y-mobile: 64px;
--container-max: 1200px;
--container-padding-x: 24px;

/* Component spacing */
--card-padding: 24px;
--card-gap: 24px;
--card-radius: 12px;
--button-radius: 8px;
--input-radius: 8px;
```

## Components

### Buttons

**Primary:**
- Background: var(--color-primary)
- Text: white, 14px semibold
- Padding: 12px 24px
- Border-radius: var(--button-radius)
- Hover: var(--color-primary-hover), slight scale(1.02)
- Transition: all 150ms ease

**Secondary/Ghost:**
- Background: transparent
- Border: 1px solid var(--color-border)
- Text: var(--color-text), 14px medium
- Hover: border-color var(--color-border-hover), bg rgba(255,255,255,0.03)

**Accent CTA (waitlist):**
- Background: gradient from var(--color-primary) to var(--color-accent)
- Text: white, 14px semibold
- Padding: 14px 28px
- Border-radius: var(--button-radius)

### Cards

- Background: var(--color-bg-card)
- Border: 1px solid var(--color-border)
- Border-radius: var(--card-radius)
- Padding: var(--card-padding)
- Hover: border-color var(--color-border-hover), bg var(--color-bg-card-hover)
- Transition: all 200ms ease

### Inputs

- Background: var(--color-bg-elevated)
- Border: 1px solid var(--color-border)
- Border-radius: var(--input-radius)
- Padding: 12px 16px
- Text: var(--color-text), 14px regular
- Placeholder: var(--color-text-muted)
- Focus: border-color var(--color-primary), box-shadow 0 0 0 3px var(--color-primary-light)

### Navbar

- Height: 64px
- Background: var(--color-bg) with backdrop-blur(12px) and 80% opacity
- Position: fixed, top, full-width, z-index 50
- Border-bottom: 1px solid var(--color-border)
- Content max-width: var(--container-max)

### Section Labels

- Text: uppercase, 12px semibold, letter-spacing 2px
- Color: var(--color-primary)
- Margin-bottom: var(--space-4)

## Breakpoints

```css
--bp-mobile: 480px;
--bp-tablet: 768px;
--bp-desktop: 1024px;
--bp-wide: 1280px;
```

## Animations

- Fade-in on scroll: opacity 0→1, translateY 20px→0, duration 500ms, ease-out
- Stagger children: 100ms delay between items
- Button hover: scale(1.02), 150ms
- Card hover: border glow, 200ms
