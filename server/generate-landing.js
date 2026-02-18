const fs = require('fs');
const path = require('path');

function esc(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function safeEmoji(str, fallback = '✨') {
  // If it's a single emoji (1-2 codepoints), keep it. Otherwise use fallback.
  const s = (str || '').trim();
  const chars = [...s];
  return chars.length <= 2 && /\p{Emoji}/u.test(s) ? s : fallback;
}

function getTemplateConfig(template = 'saas') {
  const key = ['saas', 'marketplace', 'mobile'].includes(template) ? template : 'saas';
  const themes = {
    saas: {
      key: 'saas',
      page: 'bg-gray-950 text-white',
      nav: 'bg-gray-950/80',
      navBorder: 'border-gray-800/50',
      muted: 'text-gray-400',
      subtle: 'text-gray-500',
      heading: 'text-white',
      accentText: 'text-blue-400',
      accentBg: 'bg-blue-600',
      accentHover: 'hover:bg-blue-500',
      accentBorder: 'border-blue-500/50',
      ring: 'ring-blue-500/20',
      card: 'bg-gray-900',
      cardBorder: 'border-gray-800',
      cardSoft: 'bg-gray-900/50',
      sectionAlt: 'bg-gray-900/30',
      secondaryButton: 'bg-white/5 hover:bg-white/10 border border-gray-700',
      footerBorder: 'border-gray-800',
      iconBg: 'bg-gradient-to-br from-blue-500 to-purple-500',
      heroGlow: 'from-blue-600/5',
      pill: 'text-blue-400'
    },
    marketplace: {
      key: 'marketplace',
      page: 'bg-white text-gray-900',
      nav: 'bg-white/80',
      navBorder: 'border-orange-100',
      muted: 'text-gray-600',
      subtle: 'text-gray-500',
      heading: 'text-gray-900',
      accentText: 'text-orange-600',
      accentBg: 'bg-orange-500',
      accentHover: 'hover:bg-orange-400',
      accentBorder: 'border-orange-400/50',
      ring: 'ring-orange-300/30',
      card: 'bg-white',
      cardBorder: 'border-orange-100',
      cardSoft: 'bg-orange-50/60',
      sectionAlt: 'bg-orange-50/60',
      secondaryButton: 'bg-white border border-orange-200 hover:bg-orange-50 text-orange-700',
      footerBorder: 'border-orange-100',
      iconBg: 'bg-gradient-to-br from-orange-500 to-amber-400',
      heroGlow: 'from-orange-200/40',
      pill: 'text-orange-600'
    },
    mobile: {
      key: 'mobile',
      page: 'bg-gradient-to-br from-indigo-900 to-purple-900 text-white',
      nav: 'bg-black/30',
      navBorder: 'border-white/10',
      muted: 'text-indigo-100/70',
      subtle: 'text-indigo-100/60',
      heading: 'text-white',
      accentText: 'text-pink-300',
      accentBg: 'bg-pink-500',
      accentHover: 'hover:bg-pink-400',
      accentBorder: 'border-pink-400/50',
      ring: 'ring-pink-400/20',
      card: 'bg-white/5',
      cardBorder: 'border-white/10',
      cardSoft: 'bg-white/5',
      sectionAlt: 'bg-white/5',
      secondaryButton: 'bg-white/10 hover:bg-white/15 border border-white/20',
      footerBorder: 'border-white/10',
      iconBg: 'bg-gradient-to-br from-pink-500 to-purple-500',
      heroGlow: 'from-pink-500/10',
      pill: 'text-pink-300'
    }
  };

  return themes[key];
}

function getLandingData(content = {}, meta = {}) {
  const companyName = esc(meta.company_name || content?.navbar?.logo_text || content?.meta?.title?.split(/[–—-]/)[0]?.trim() || 'Company');

  const hero = content.hero || {};
  const headline = esc(hero.headline || content.headline || '');
  const subheadline = esc(hero.subheadline || content.subheadline || '');
  const ctaPrimary = esc(hero.cta_text || content.cta || 'Get Started');
  const ctaSecondary = esc(hero.cta_secondary || 'Learn More');

  const navbar = content.navbar || {};
  const navLinks = (navbar.links || ['Features', 'Pricing', 'FAQ']).map(l => esc(l));

  const socialBar = content.social_proof_bar || {};
  const socialText = esc(socialBar.text || 'Trusted by innovative teams worldwide');
  const socialLogos = (socialBar.logos || []).map(l => esc(l));

  const problem = content.problem || {};
  const problemHeadline = esc(problem.headline || '');
  const problemSub = esc(problem.subheadline || '');
  const painPoints = (problem.pain_points || []).map(p =>
    typeof p === 'string' ? { icon: '😤', title: '', description: p } : { icon: safeEmoji(p.icon, '😤'), title: esc(p.title || ''), description: esc(p.description || '') }
  );

  const solution = content.solution || {};
  const solutionHeadline = esc(solution.headline || '');
  const solutionDesc = esc(solution.description || '');

  const features = (content.features || []).map(f => ({
    icon: safeEmoji(f.icon, '✦'),
    title: esc(f.headline || f.title || ''),
    desc: esc(f.description || f.desc || '')
  }));

  const howItWorks = content.how_it_works || {};
  const hiwHeadline = esc(howItWorks.headline || 'How It Works');
  const hiwSteps = (howItWorks.steps || []).map(s => ({
    step: s.step || 1,
    title: esc(s.title || ''),
    desc: esc(s.description || '')
  }));

  const pricing = content.pricing || {};
  const pricingHeadline = esc(pricing.headline || 'Simple Pricing');
  const pricingSub = esc(pricing.subheadline || '');
  const plans = (pricing.plans || []).map(p => ({
    name: esc(p.name || ''),
    price: esc(p.price || ''),
    period: esc(p.period || '/mo'),
    description: esc(p.description || ''),
    features: (p.features || []).map(f => esc(f)),
    cta: esc(p.cta || 'Get Started'),
    highlighted: !!p.highlighted
  }));

  const testimonials = (content.testimonials || []).map(t => ({
    quote: esc(t.quote || ''),
    author: esc(t.author || ''),
    role: esc(t.role || ''),
    metric: esc(t.metric || '')
  }));

  const faq = (content.faq || []).map(f => ({
    question: esc(f.question || ''),
    answer: esc(f.answer || '')
  }));

  const finalCta = content.final_cta || {};
  const finalHeadline = esc(finalCta.headline || 'Ready to get started?');
  const finalSub = esc(finalCta.subheadline || '');
  const finalCtaText = esc(finalCta.cta_text || ctaPrimary);

  return {
    companyName,
    headline,
    subheadline,
    ctaPrimary,
    ctaSecondary,
    navLinks,
    socialText,
    socialLogos,
    problemHeadline,
    problemSub,
    painPoints,
    solutionHeadline,
    solutionDesc,
    features,
    hiwHeadline,
    hiwSteps,
    pricingHeadline,
    pricingSub,
    plans,
    testimonials,
    faq,
    finalHeadline,
    finalSub,
    finalCtaText
  };
}

function buildLandingMarkup(data, theme, { classAttr = 'className', faqMarkup = '' } = {}) {
  const attr = classAttr;
  const navLinksMarkup = data.navLinks.map(link => {
    const href = link.toLowerCase().replace(/\s+/g, '-');
    return `          <a href="#${href}" ${attr}="text-sm ${theme.muted} hover:${theme.heading} transition-colors">${link}</a>`;
  }).join('\n');

  const painPointsMarkup = data.painPoints.map(p =>
    `        <div ${attr}="${theme.cardSoft} border ${theme.cardBorder} rounded-xl p-6 text-center">
          <div ${attr}="text-3xl mb-3">${p.icon}</div>
          ${p.title ? `<h4 ${attr}="font-semibold ${theme.heading} mb-2">${p.title}</h4>` : ''}
          <p ${attr}="${theme.muted} text-sm">${p.description}</p>
        </div>`
  ).join('\n');

  const featuresMarkup = data.features.map(f =>
    `        <div ${attr}="${theme.card} border ${theme.cardBorder} rounded-xl p-6 hover:border-opacity-80 transition-colors">
          <div ${attr}="text-3xl mb-4">${f.icon}</div>
          <h3 ${attr}="text-lg font-semibold ${theme.heading} mb-2">${f.title}</h3>
          <p ${attr}="${theme.muted} text-sm leading-relaxed">${f.desc}</p>
        </div>`
  ).join('\n');

  const stepsMarkup = data.hiwSteps.map(s =>
    `        <div ${attr}="text-center">
          <div ${attr}="w-12 h-12 rounded-full ${theme.accentBg} text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">${s.step}</div>
          <h4 ${attr}="font-semibold ${theme.heading} mb-2">${s.title}</h4>
          <p ${attr}="${theme.muted} text-sm">${s.desc}</p>
        </div>`
  ).join('\n');

  const pricingMarkup = data.plans.map(p =>
    `        <div ${attr}="${p.highlighted ? `${theme.card} border ${theme.accentBorder} ring-1 ${theme.ring}` : `${theme.card} border ${theme.cardBorder}`} rounded-2xl p-8 flex flex-col">
          ${p.highlighted ? `<div ${attr}="text-xs font-semibold ${theme.accentText} uppercase tracking-wider mb-2">Most Popular</div>` : ''}
          <h4 ${attr}="text-xl font-bold ${theme.heading}">${p.name}</h4>
          <div ${attr}="mt-4 mb-2"><span ${attr}="text-4xl font-bold ${theme.heading}">${p.price}</span><span ${attr}="${theme.subtle}">${p.period}</span></div>
          <p ${attr}="text-sm ${theme.muted} mb-6">${p.description}</p>
          <ul ${attr}="space-y-3 mb-8 flex-1">
            ${p.features.map(f => `<li ${attr}="flex items-center gap-2 text-sm ${theme.muted}"><span ${attr}="${theme.accentText}">✓</span>${f}</li>`).join('\n            ')}
          </ul>
          <a href="#get-started" ${attr}="${p.highlighted ? `${theme.accentBg} ${theme.accentHover}` : 'bg-white/10 hover:bg-white/20'} block text-center text-white py-3 rounded-xl font-medium transition-colors">${p.cta}</a>
        </div>`
  ).join('\n');

  const testimonialsMarkup = data.testimonials.map(t =>
    `        <div ${attr}="${theme.card} border ${theme.cardBorder} rounded-xl p-6">
          <p ${attr}="${theme.muted} text-sm italic mb-4">"${t.quote}"</p>
          <div ${attr}="flex items-center gap-3">
            <div ${attr}="w-10 h-10 rounded-full ${theme.iconBg} flex items-center justify-center text-white font-bold text-sm">${(t.author || 'A')[0]}</div>
            <div>
              <p ${attr}="${theme.heading} font-medium text-sm">${t.author}</p>
              <p ${attr}="${theme.subtle} text-xs">${t.role}</p>
            </div>
          </div>
          ${t.metric ? `<div ${attr}="mt-3 text-xs ${theme.accentText} font-medium">${t.metric}</div>` : ''}
        </div>`
  ).join('\n');

  const socialLogosMarkup = data.socialLogos.length > 0
    ? data.socialLogos.map(l => `          <span ${attr}="${theme.subtle} font-medium">${l}</span>`).join('\n')
    : '';

  return `    <div ${attr}="min-h-screen ${theme.page}">
      <nav ${attr}="sticky top-0 z-50 backdrop-blur-lg ${theme.nav} border-b ${theme.navBorder}" id="navbar">
        <div ${attr}="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <span ${attr}="text-xl font-bold ${theme.heading}">${data.companyName}</span>
          <div ${attr}="hidden md:flex items-center gap-8">
${navLinksMarkup}
          </div>
          <a href="#get-started" ${attr}="px-5 py-2 ${theme.accentBg} ${theme.accentHover} rounded-lg text-sm font-medium text-white transition-colors">${data.ctaPrimary}</a>
        </div>
      </nav>

      <section ${attr}="relative overflow-hidden" id="hero">
        <div ${attr}="absolute inset-0 bg-gradient-to-b ${theme.heroGlow} to-transparent"></div>
        <div ${attr}="max-w-4xl mx-auto text-center py-24 md:py-32 px-6 relative">
          <h1 ${attr}="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight ${theme.heading}">${data.headline}</h1>
          <p ${attr}="text-lg md:text-xl ${theme.muted} mb-10 max-w-2xl mx-auto leading-relaxed">${data.subheadline}</p>
          <div ${attr}="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#get-started" ${attr}="px-8 py-3.5 ${theme.accentBg} ${theme.accentHover} rounded-xl text-lg font-medium text-white transition-colors">${data.ctaPrimary}</a>
            <a href="#how-it-works" ${attr}="px-8 py-3.5 ${theme.secondaryButton} rounded-xl text-lg font-medium transition-colors">${data.ctaSecondary}</a>
          </div>
        </div>
      </section>

      <section ${attr}="border-y ${theme.navBorder} py-6" id="social-proof">
        <div ${attr}="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-sm">
          <span ${attr}="${theme.subtle}">${data.socialText}</span>
${socialLogosMarkup}
        </div>
      </section>

      ${data.problemHeadline ? `<section ${attr}="max-w-6xl mx-auto py-20 md:py-28 px-6" id="problem">
        <div ${attr}="text-center mb-16">
          <h2 ${attr}="text-3xl md:text-4xl font-bold mb-4 ${theme.heading}">${data.problemHeadline}</h2>
          ${data.problemSub ? `<p ${attr}="${theme.muted} text-lg max-w-2xl mx-auto">${data.problemSub}</p>` : ''}
        </div>
        <div ${attr}="grid grid-cols-1 md:grid-cols-3 gap-6">
${painPointsMarkup}
        </div>
      </section>` : ''}

      ${data.solutionHeadline ? `<section ${attr}="py-20 ${theme.sectionAlt}" id="solution">
        <div ${attr}="max-w-3xl mx-auto text-center px-6">
          <h2 ${attr}="text-3xl md:text-4xl font-bold mb-6 ${theme.heading}">${data.solutionHeadline}</h2>
          <p ${attr}="${theme.muted} text-lg leading-relaxed">${data.solutionDesc}</p>
        </div>
      </section>` : ''}

      <section ${attr}="max-w-6xl mx-auto py-20 md:py-28 px-6" id="features">
        <div ${attr}="text-center mb-16">
          <p ${attr}="${theme.accentText} text-sm font-semibold uppercase tracking-wider mb-3">Features</p>
          <h2 ${attr}="text-3xl md:text-4xl font-bold ${theme.heading}">Everything you need</h2>
        </div>
        <div ${attr}="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
${featuresMarkup}
        </div>
      </section>

      <section ${attr}="py-20 md:py-28 ${theme.sectionAlt}" id="how-it-works">
        <div ${attr}="max-w-5xl mx-auto px-6">
          <div ${attr}="text-center mb-16">
            <p ${attr}="${theme.accentText} text-sm font-semibold uppercase tracking-wider mb-3">How It Works</p>
            <h2 ${attr}="text-3xl md:text-4xl font-bold ${theme.heading}">${data.hiwHeadline}</h2>
          </div>
          <div ${attr}="grid grid-cols-1 md:grid-cols-3 gap-12">
${stepsMarkup}
          </div>
        </div>
      </section>

      <section ${attr}="max-w-6xl mx-auto py-20 md:py-28 px-6" id="pricing">
        <div ${attr}="text-center mb-16">
          <p ${attr}="${theme.accentText} text-sm font-semibold uppercase tracking-wider mb-3">Pricing</p>
          <h2 ${attr}="text-3xl md:text-4xl font-bold mb-4 ${theme.heading}">${data.pricingHeadline}</h2>
          ${data.pricingSub ? `<p ${attr}="${theme.muted} text-lg max-w-2xl mx-auto">${data.pricingSub}</p>` : ''}
        </div>
        <div ${attr}="grid grid-cols-1 md:grid-cols-3 gap-8">
${pricingMarkup}
        </div>
      </section>

      ${data.testimonials.length > 0 ? `<section ${attr}="py-20 ${theme.sectionAlt}" id="testimonials">
        <div ${attr}="max-w-6xl mx-auto px-6">
          <div ${attr}="text-center mb-16">
            <p ${attr}="${theme.accentText} text-sm font-semibold uppercase tracking-wider mb-3">What People Say</p>
            <h2 ${attr}="text-3xl md:text-4xl font-bold ${theme.heading}">Loved by early adopters</h2>
          </div>
          <div ${attr}="grid grid-cols-1 md:grid-cols-3 gap-6">
${testimonialsMarkup}
          </div>
        </div>
      </section>` : ''}

      <section ${attr}="max-w-6xl mx-auto py-20 md:py-28 px-6" id="faq">
        <div ${attr}="text-center mb-16">
          <p ${attr}="${theme.accentText} text-sm font-semibold uppercase tracking-wider mb-3">FAQ</p>
          <h2 ${attr}="text-3xl md:text-4xl font-bold ${theme.heading}">Frequently asked questions</h2>
        </div>
        ${faqMarkup}
      </section>

      <section ${attr}="py-20 md:py-28 ${theme.sectionAlt}" id="get-started">
        <div ${attr}="max-w-3xl mx-auto text-center px-6">
          <h2 ${attr}="text-3xl md:text-4xl font-bold mb-4 ${theme.heading}">${data.finalHeadline}</h2>
          <p ${attr}="${theme.muted} text-lg mb-8">${data.finalSub}</p>
          <a href="#" ${attr}="inline-block px-10 py-4 ${theme.accentBg} ${theme.accentHover} rounded-xl text-lg font-medium text-white transition-colors">${data.finalCtaText}</a>
        </div>
      </section>

      <footer ${attr}="border-t ${theme.footerBorder} py-12" id="footer">
        <div ${attr}="max-w-6xl mx-auto px-6">
          <div ${attr}="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <span ${attr}="font-bold text-lg ${theme.heading}">${data.companyName}</span>
            <div ${attr}="flex items-center gap-6 text-sm ${theme.subtle}">
              <a href="#features" ${attr}="hover:${theme.heading} transition-colors">Features</a>
              <a href="#pricing" ${attr}="hover:${theme.heading} transition-colors">Pricing</a>
              <a href="#faq" ${attr}="hover:${theme.heading} transition-colors">FAQ</a>
              <a href="#" ${attr}="hover:${theme.heading} transition-colors">Privacy Policy</a>
              <a href="#" ${attr}="hover:${theme.heading} transition-colors">Terms of Service</a>
            </div>
            <div ${attr}="flex items-center gap-4">
              <a href="#" ${attr}="${theme.subtle} hover:${theme.heading} transition-colors" aria-label="Twitter">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" ${attr}="${theme.subtle} hover:${theme.heading} transition-colors" aria-label="LinkedIn">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
          <div ${attr}="border-t ${theme.footerBorder} pt-6 text-center">
            <p ${attr}="${theme.subtle} text-sm">© ${new Date().getFullYear()} ${data.companyName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>`;
}

function buildFaqHtml(data, theme) {
  if (!data.faq.length) return `<div class="text-center ${theme.muted}">No FAQs yet.</div>`;
  return `<div class="max-w-3xl mx-auto space-y-3">
${data.faq.map((item, i) => `  <details class="border ${theme.cardBorder} rounded-xl overflow-hidden ${theme.card}">
    <summary class="w-full flex items-center justify-between px-6 py-4 text-left ${theme.heading} cursor-pointer">
      <span class="font-medium">${item.question}</span>
      <span class="transition-transform duration-200">▾</span>
    </summary>
    <div class="px-6 pb-4 ${theme.muted} text-sm leading-relaxed">${item.answer}</div>
  </details>`).join('\n')}
</div>`;
}

async function generateLandingProject(content, projectDir, meta = {}, template) {
  const slug = (meta.company_name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const theme = getTemplateConfig(template || content?.template || 'saas');
  const data = getLandingData(content, meta);

  const dirs = ['src', 'public'];
  for (const d of dirs) {
    fs.mkdirSync(path.join(projectDir, d), { recursive: true });
  }

  const ogSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1a1a2e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="4" fill="url(#accent)"/>
  <text x="80" y="240" font-family="system-ui,-apple-system,sans-serif" font-size="64" font-weight="bold" fill="white">${data.companyName}</text>
  <text x="80" y="320" font-family="system-ui,-apple-system,sans-serif" font-size="28" fill="#9ca3af" width="1040">${esc(data.headline).slice(0, 80)}</text>
  <text x="80" y="370" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="#6b7280" width="1040">${esc(data.subheadline).slice(0, 100)}</text>
  <rect x="80" y="430" width="200" height="48" rx="12" fill="#3b82f6"/>
  <text x="180" y="460" font-family="system-ui,-apple-system,sans-serif" font-size="18" fill="white" text-anchor="middle">${data.ctaPrimary}</text>
  <text x="80" y="570" font-family="system-ui,-apple-system,sans-serif" font-size="16" fill="#4b5563">Built with dante.id</text>
</svg>`;
  write(projectDir, 'public/og.svg', ogSvg);

  write(projectDir, 'package.json', JSON.stringify({
    name: `${slug}-landing`,
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
    dependencies: { "react": "^19.0.0", "react-dom": "^19.0.0" },
    devDependencies: { "@vitejs/plugin-react": "^4.3.0", "vite": "^6.0.0", "tailwindcss": "^3.4.0", "autoprefixer": "^10.4.0", "postcss": "^8.4.0" }
  }, null, 2));

  write(projectDir, 'vite.config.js', `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })\n`);

  write(projectDir, 'tailwind.config.js', `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ["./index.html", "./src/**/*.{js,jsx}"],\n  theme: { extend: {} },\n  plugins: [],\n}\n`);

  write(projectDir, 'postcss.config.js', `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }\n`);

  write(projectDir, 'index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${data.companyName} — ${esc(content?.meta?.description || data.headline)}</title>
    <meta name="description" content="${esc(content?.meta?.description || data.subheadline)}" />
    <meta property="og:title" content="${data.companyName} — ${esc(content?.meta?.title || data.headline)}" />
    <meta property="og:description" content="${esc(content?.meta?.description || data.subheadline)}" />
    <meta property="og:image" content="/og.svg" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${data.companyName}" />
    <meta name="twitter:description" content="${esc(data.subheadline)}" />
    <meta name="twitter:image" content="/og.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>\n`);

  write(projectDir, 'src/index.css', `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nhtml { scroll-behavior: smooth; }\n`);

  write(projectDir, 'src/main.jsx', `import { createRoot } from 'react-dom/client'\nimport App from './App.jsx'\nimport './index.css'\ncreateRoot(document.getElementById('root')).render(<App />)\n`);

  write(projectDir, 'src/FAQ.jsx', `import { useState } from 'react'\n\nconst faqs = ${JSON.stringify(data.faq)};\n\nexport default function FAQ() {\n  const [open, setOpen] = useState(null);\n  return (\n    <div className="max-w-3xl mx-auto space-y-3">\n      {faqs.map((item, i) => (\n        <div key={i} className="border ${theme.cardBorder} rounded-xl overflow-hidden ${theme.card}">\n          <button\n            onClick={() => setOpen(open === i ? null : i)}\n            className="w-full flex items-center justify-between px-6 py-4 text-left ${theme.heading} hover:bg-white/5 transition-colors"\n          >\n            <span className="font-medium">{item.question}</span>\n            <span className={\`transition-transform duration-200 \${open === i ? 'rotate-180' : ''}\`}>▾</span>\n          </button>\n          {open === i && (\n            <div className="px-6 pb-4 ${theme.muted} text-sm leading-relaxed">{item.answer}</div>\n          )}\n        </div>\n      ))}\n    </div>\n  );\n}\n`);

  const appMarkup = buildLandingMarkup(data, theme, { classAttr: 'className', faqMarkup: '<FAQ />' });

  write(projectDir, 'src/App.jsx', `import FAQ from './FAQ.jsx'\n\nexport default function App() {\n  return (\n${appMarkup}\n  );\n}\n`);
}

function renderLandingHTML(content = {}, template = 'saas', meta = {}) {
  const theme = getTemplateConfig(template || content?.template || 'saas');
  const data = getLandingData(content, meta);
  const faqHtml = buildFaqHtml(data, theme);
  const bodyMarkup = buildLandingMarkup(data, theme, { classAttr: 'class', faqMarkup: faqHtml });

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${data.companyName} — ${esc(content?.meta?.description || data.headline)}</title>
    <meta name="description" content="${esc(content?.meta?.description || data.subheadline)}" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html { scroll-behavior: smooth; }
      summary::-webkit-details-marker { display: none; }
    </style>
  </head>
  <body class="antialiased">
${bodyMarkup}
    <script>
      window.addEventListener('message', (event) => {
        const data = event.data || {};
        if (data.type === 'scrollToSection' && data.section) {
          const el = document.getElementById(data.section);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    </script>
  </body>
</html>`;
}

function write(base, rel, content) {
  const full = path.join(base, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

module.exports = { generateLandingProject, renderLandingHTML };
