# dante.id Design System — Terminal CLI Aesthetic

## Colors
- Background: `#0a0a0a` — deep black
- Primary: `#33ff00` — neon green (phosphor monitor)
- Secondary: `#ffb000` — amber for accents/warnings
- Error: `#ff3333` — red
- Muted: `#1a1a1a` — card backgrounds
- Border: `#1f521f` — dimmed green

## Typography
- Font: `JetBrains Mono`, `Fira Code`, monospace — EVERYTHING
- Text glow: `text-shadow: 0 0 5px rgba(51, 255, 0, 0.5)`
- Headers: ALL CAPS, typewriter animation

## Components
- Radius: `0px` — NO rounded corners anywhere
- Borders: `1px solid #1f521f`
- Buttons: `[ INITIATE ]` bracket style, inverted on hover (bg green, text black)
- Cards: Terminal windows with `+--- TITLE ---+` ASCII headers
- Inputs: Shell prompt style `user@project:~$` with blinking cursor
- Layout: tmux/vim splits, ASCII separators (`|`, `─`, `+`)

## Rules
- No drop shadows
- No rounded anything
- No pie charts
- No gradients
- Monospace everything
- ASCII art where appropriate
- Loading states: `[████████░░░░] 67%` progress bars
- Status: `[OK]`, `[FAIL]`, `[WARN]` badges
