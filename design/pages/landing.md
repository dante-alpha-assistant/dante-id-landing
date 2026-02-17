# dante. — Landing Page Spec

URL: `/`
Title: `dante. — Build your startup with AI`
Description: `dante. gives you a full AI team to design, build, and launch your company.`

---

## Section 1: Navbar

**Layout:** Fixed top, full-width, 64px height, glass effect (bg 80% opacity + backdrop-blur)
**Border:** 1px solid var(--color-border) on bottom

| Position | Element | Details |
|----------|---------|---------|
| Left | Logo | `combined.png` lockup, 28px height. Links to `/` |
| Center | Nav links | "How It Works" · "Features" · "Pricing" — 14px medium, text-secondary, hover: text-white |
| Right | CTA button | "Get Started" — ghost button style (border + transparent bg) |

**Mobile (< 768px):** Hamburger icon replaces center nav. Logo stays. CTA stays.

---

## Section 2: Hero

**Layout:** Split — text left (55%), visual right (45%)
**Padding:** 160px top (accounts for navbar), 96px bottom
**Max-width:** var(--container-max)

### Left Column

- **Label:** "AI STARTUP BUILDER" — section label style (uppercase, 12px, primary color, letter-spacing 2px)
- **Headline:** "Build your startup in days, not months." — 56px bold (desktop), 40px (mobile), Space Grotesk, white, max-width 500px, line-height 1.1
- **Subheadline:** "dante. gives you a full AI team — strategist, designer, developer, lawyer — that builds your business while you focus on your vision." — 18px regular, text-secondary, max-width 460px, line-height 1.6
- **CTA Group:** Email input (flex-grow) + "Join the waitlist" button (accent gradient) — inline on desktop, stacked on mobile
  - Input placeholder: "Enter your email"
  - Button: accent gradient, white text, 14px semibold
- **Microcopy:** "Free to join. No credit card required." — 13px, text-muted

### Right Column

- **Product Preview Card:** Dark elevated card (var(--color-bg-elevated)) with border
  - Header: "Your AI Team" label + green "Active" badge
  - Content: List of agent status items:
    - 🟣 "Strategy complete" — with checkmark
    - 🟣 "Brand kit generated" — with checkmark  
    - 🔵 "Website in progress" — with spinner/pulse
    - ○ "Legal docs queued" — dimmed
  - Footer: Stats row — "4 agents" | "12 hrs avg" | "24/7"
  - **Style:** Slight rotation (2deg) with hover-straighten animation. Subtle purple glow on border.

**Mobile:** Stack vertically. Text first, card below. Card centered, no rotation.

---

## Section 3: Social Proof Bar

**Layout:** Full-width strip, bg var(--color-bg-elevated), 80px height
**Content:** "Trusted by founders building with AI" centered, text-muted, 14px
**OR** if we have real logos: row of 5-6 grayscale partner/user logos, opacity 0.5, hover: opacity 1

**Note:** For MVP/waitlist, use the text version. Replace with logos when we have real users.

---

## Section 4: How It Works

**Padding:** var(--section-padding-y)
**Layout:** Centered header + 3-column grid

### Header
- Label: "HOW IT WORKS" — section label style
- Headline: "From idea to launch, end-to-end." — 40px bold, white
- Subheadline: "Your AI team works in parallel — strategy, product, and growth — while you stay in control." — 18px, text-secondary, max-width 560px, centered

### Steps (3 cards, equal width)

**Card style:** bg-card, border, card-radius, card-padding

**Step 1:**
- Number: "01" — 32px bold, primary color
- Title: "Describe your idea" — 20px semibold, white
- Description: "Tell us what you're building, who it's for, and your vision. Takes 5 minutes." — 16px, text-secondary

**Step 2:**
- Number: "02"
- Title: "Meet your AI team"
- Description: "We assemble a team of specialized agents — strategist, designer, developer, legal, growth — tailored to your startup."

**Step 3:**
- Number: "03"
- Title: "Launch your business"
- Description: "Your team builds everything: business plan, brand, website, legal docs, payment setup. You review and approve."

**Mobile:** Stack to single column with 24px gap.

---

## Section 5: Features Grid

**Padding:** var(--section-padding-y)
**Layout:** Centered header + 2x3 card grid (3 columns on desktop, 2 on tablet, 1 on mobile)

### Header
- Label: "WHAT YOU GET"
- Headline: "Everything you need to launch." — 40px bold
- Subheadline: "Six specialized AI agents, one unified team." — 18px, text-secondary

### Feature Cards

Each card: icon (24px, primary color) + title (18px semibold) + description (14px, text-secondary)

1. **Strategy & Planning** — "Market research, business model, competitive analysis, and a pitch-ready business plan."
2. **Brand & Design** — "Logo, color palette, typography, brand guidelines, and a complete visual identity."
3. **Website & Product** — "Landing page, product UI, deployment, and domain setup — all built for you."
4. **Legal & Compliance** — "Terms of service, privacy policy, entity guidance, and contractor agreements."
5. **Payments & Finance** — "Stripe integration, pricing strategy, invoicing setup, and basic bookkeeping."
6. **Growth & Launch** — "Launch strategy, social media presence, SEO fundamentals, and a content calendar."

**Hover:** Card border brightens, subtle translateY(-2px) lift.

---

## Section 6: Product Demo

**Padding:** var(--section-padding-y)
**Layout:** Full-width dark section with centered content
**Background:** Subtle gradient from bg to bg-elevated

### Content
- Label: "SEE IT IN ACTION"
- Headline: "Watch your team build." — 40px bold
- **Demo element:** Large rounded card (max-width 900px, centered) showing a simulated agent conversation or dashboard
  - For MVP: screenshot of the actual agent team working (from our Discord or a mocked chat UI)
  - Future: embedded interactive demo or video
- Caption below: "Real output from a dante. agent team." — 14px, text-muted, centered

---

## Section 7: Social Proof / Stats

**Padding:** var(--section-padding-y)
**Layout:** Split — text left, stats right
**Background:** var(--color-bg-card) full-width section

### Left
- Label: "BUILT DIFFERENT"
- Headline: "Built by AI agents, for human founders." — 36px bold
- Description: "Traditional startup setup costs $10K–$50K and takes months. dante. does it in days for a fraction of the cost." — 16px, text-secondary

### Right (3 stats in a row)
- "10x" — "Faster than traditional setup" — number in 48px bold primary, label in 14px text-secondary
- "$50K" — "Average savings vs agencies"
- "24/7" — "Your team never sleeps"

**Mobile:** Stack, stats below text, stats in 3-column mini grid.

---

## Section 8: FAQ

**Padding:** var(--section-padding-y)
**Layout:** Centered, max-width 680px

### Header
- Label: "FAQ"
- Headline: "Questions?" — 40px bold

### Questions (accordion, click to expand)

1. **"What is dante.?"** — "dante. is an AI-powered startup builder. You describe your idea, and a team of specialized AI agents builds your business — strategy, branding, website, legal, payments, and growth."

2. **"How is this different from ChatGPT?"** — "ChatGPT gives you text. dante. gives you a team that produces real deliverables — actual business plans, actual logos, actual deployed websites. It's the difference between advice and execution."

3. **"How much does it cost?"** — "We're in early access. Join the waitlist for free and be first in line when we launch."

4. **"How long does it take?"** — "Most startups go from idea to launch-ready in 3-5 days. Your AI team works 24/7 in parallel."

5. **"Can I customize what the agents build?"** — "Absolutely. You review every deliverable and can request iterations. The agents work for you, not the other way around."

6. **"Is this just for tech startups?"** — "No. dante. works for any type of startup — e-commerce, services, SaaS, agencies, local businesses, and more."

**Style:** Each item: question in 16px semibold, answer in 16px regular text-secondary. Border-bottom separator. Plus/minus toggle icon on right.

---

## Section 9: Final CTA

**Padding:** var(--section-padding-y) 
**Layout:** Centered text block
**Background:** Subtle radial gradient glow from primary color at center (very subtle, 5% opacity)

- Headline: "Ready to build?" — 48px bold, white
- Subheadline: "Join the waitlist and get early access to your AI startup team." — 18px, text-secondary, max-width 480px
- CTA: Same email + button combo from hero
- Microcopy: "Free to join. No credit card required."

---

## Section 10: Footer

**Padding:** 48px vertical
**Border-top:** 1px solid var(--color-border)
**Layout:** 4 columns on desktop, stacked on mobile

| Column 1 | Column 2 | Column 3 | Column 4 |
|-----------|----------|----------|----------|
| dante. logo (small) | **Product** | **Company** | **Legal** |
| Tagline: "Build with AI." | How It Works | About | Privacy Policy |
| | Features | Blog | Terms of Service |
| | Pricing | Contact | |

**Bottom row:** "© 2026 dante." left, social icons (Twitter/X, Discord, GitHub) right — 14px, text-muted

---

## Global Notes

- All scroll-triggered animations: fade-in + translateY(20px→0), 500ms, stagger 100ms between siblings
- Smooth scroll for anchor links (nav → sections)
- Page background: var(--color-bg) solid
- All images: lazy loaded
- Focus states: all interactive elements get visible focus ring (primary color, 3px offset)
