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

async function generateLandingProject(content, projectDir, meta) {
  const slug = (meta.company_name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const companyName = esc(meta.company_name || content?.navbar?.logo_text || content?.meta?.title?.split(/[–—-]/)[0]?.trim() || 'Company');

  // Normalize content for both v1 and v2 schemas
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

  // Create project structure
  const dirs = ['src', 'public'];
  for (const d of dirs) {
    fs.mkdirSync(path.join(projectDir, d), { recursive: true });
  }

  // Generate OG image (SVG)
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
  <text x="80" y="240" font-family="system-ui,-apple-system,sans-serif" font-size="64" font-weight="bold" fill="white">${companyName}</text>
  <text x="80" y="320" font-family="system-ui,-apple-system,sans-serif" font-size="28" fill="#9ca3af" width="1040">${esc(headline).slice(0, 80)}</text>
  <text x="80" y="370" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="#6b7280" width="1040">${esc(subheadline).slice(0, 100)}</text>
  <rect x="80" y="430" width="200" height="48" rx="12" fill="#3b82f6"/>
  <text x="180" y="460" font-family="system-ui,-apple-system,sans-serif" font-size="18" fill="white" text-anchor="middle">${ctaPrimary}</text>
  <text x="80" y="570" font-family="system-ui,-apple-system,sans-serif" font-size="16" fill="#4b5563">Built with dante.id</text>
</svg>`;
  write(projectDir, 'public/og.svg', ogSvg);
  // Also reference SVG since we can't generate PNG without canvas deps
  // og.svg is the canonical OG image

  // package.json
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
    <title>${companyName} — ${esc(content?.meta?.description || headline)}</title>
    <meta name="description" content="${esc(content?.meta?.description || subheadline)}" />
    <meta property="og:title" content="${companyName} — ${esc(content?.meta?.title || headline)}" />
    <meta property="og:description" content="${esc(content?.meta?.description || subheadline)}" />
    <meta property="og:image" content="/og.svg" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${companyName}" />
    <meta name="twitter:description" content="${esc(subheadline)}" />
    <meta name="twitter:image" content="/og.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>\n`);

  write(projectDir, 'src/index.css', `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nhtml { scroll-behavior: smooth; }\n`);

  write(projectDir, 'src/main.jsx', `import { createRoot } from 'react-dom/client'\nimport App from './App.jsx'\nimport './index.css'\ncreateRoot(document.getElementById('root')).render(<App />)\n`);

  // FAQ component
  write(projectDir, 'src/FAQ.jsx', `import { useState } from 'react'

const faqs = ${JSON.stringify(faq)};

export default function FAQ() {
  const [open, setOpen] = useState(null);
  return (
    <div className="max-w-3xl mx-auto space-y-3">
      {faqs.map((item, i) => (
        <div key={i} className="border border-gray-800 rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left text-white hover:bg-white/5 transition-colors"
          >
            <span className="font-medium">{item.question}</span>
            <span className={\`transition-transform duration-200 \${open === i ? 'rotate-180' : ''}\`}>▾</span>
          </button>
          {open === i && (
            <div className="px-6 pb-4 text-gray-400 text-sm leading-relaxed">{item.answer}</div>
          )}
        </div>
      ))}
    </div>
  );
}\n`);

  // Build nav links JSX
  const navLinksJsx = navLinks.map(link => {
    const href = link.toLowerCase().replace(/\s+/g, '-');
    return `          <a href="#${href}" className="text-sm text-gray-400 hover:text-white transition-colors">${link}</a>`;
  }).join('\n');

  // Build pain points JSX
  const painPointsJsx = painPoints.map(p =>
    `        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-center">
          <div className="text-3xl mb-3">${p.icon}</div>
          ${p.title ? `<h4 className="font-semibold text-white mb-2">${p.title}</h4>` : ''}
          <p className="text-gray-400 text-sm">${p.description}</p>
        </div>`
  ).join('\n');

  // Build features JSX
  const featuresJsx = features.map(f =>
    `        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
          <div className="text-3xl mb-4">${f.icon}</div>
          <h3 className="text-lg font-semibold text-white mb-2">${f.title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">${f.desc}</p>
        </div>`
  ).join('\n');

  // Build steps JSX
  const stepsJsx = hiwSteps.map(s =>
    `        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">${s.step}</div>
          <h4 className="font-semibold text-white mb-2">${s.title}</h4>
          <p className="text-gray-400 text-sm">${s.desc}</p>
        </div>`
  ).join('\n');

  // Build pricing cards JSX
  const pricingJsx = plans.map(p =>
    `        <div className="${p.highlighted ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/20' : 'bg-gray-900 border-gray-800'} border rounded-2xl p-8 flex flex-col">
          ${p.highlighted ? '<div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Most Popular</div>' : ''}
          <h4 className="text-xl font-bold text-white">${p.name}</h4>
          <div className="mt-4 mb-2"><span className="text-4xl font-bold text-white">${p.price}</span><span className="text-gray-500">${p.period}</span></div>
          <p className="text-sm text-gray-400 mb-6">${p.description}</p>
          <ul className="space-y-3 mb-8 flex-1">
            ${p.features.map(f => `<li className="flex items-center gap-2 text-sm text-gray-300"><span className="text-green-400">✓</span>${f}</li>`).join('\n            ')}
          </ul>
          <a href="#get-started" className="${p.highlighted ? 'bg-blue-600 hover:bg-blue-500' : 'bg-white/10 hover:bg-white/20'} block text-center text-white py-3 rounded-xl font-medium transition-colors">${p.cta}</a>
        </div>`
  ).join('\n');

  // Build testimonials JSX
  const testimonialsJsx = testimonials.map(t =>
    `        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-300 text-sm italic mb-4">"${t.quote}"</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">${(t.author || 'A')[0]}</div>
            <div>
              <p className="text-white font-medium text-sm">${t.author}</p>
              <p className="text-gray-500 text-xs">${t.role}</p>
            </div>
          </div>
          ${t.metric ? `<div className="mt-3 text-xs text-blue-400 font-medium">${t.metric}</div>` : ''}
        </div>`
  ).join('\n');

  // Social logos JSX
  const socialLogosJsx = socialLogos.length > 0
    ? socialLogos.map(l => `          <span className="text-gray-600 font-medium">${l}</span>`).join('\n')
    : '';

  // Main App component
  write(projectDir, 'src/App.jsx', `import FAQ from './FAQ.jsx'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-gray-950/80 border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <span className="text-xl font-bold">${companyName}</span>
          <div className="hidden md:flex items-center gap-8">
${navLinksJsx}
          </div>
          <a href="#get-started" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">${ctaPrimary}</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent" />
        <div className="max-w-4xl mx-auto text-center py-24 md:py-32 px-6 relative">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent">${headline}</h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">${subheadline}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#get-started" className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-medium transition-colors">${ctaPrimary}</a>
            <a href="#how-it-works" className="px-8 py-3.5 bg-white/5 hover:bg-white/10 border border-gray-700 rounded-xl text-lg font-medium transition-colors">${ctaSecondary}</a>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="border-y border-gray-800/50 py-6">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-sm">
          <span className="text-gray-500">${socialText}</span>
${socialLogosJsx}
        </div>
      </section>

      {/* Problem */}
      ${problemHeadline ? `<section className="max-w-6xl mx-auto py-20 md:py-28 px-6" id="problem">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">${problemHeadline}</h2>
          ${problemSub ? `<p className="text-gray-400 text-lg max-w-2xl mx-auto">${problemSub}</p>` : ''}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
${painPointsJsx}
        </div>
      </section>` : ''}

      {/* Solution */}
      ${solutionHeadline ? `<section className="py-20 bg-gradient-to-b from-blue-600/5 to-transparent">
        <div className="max-w-3xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">${solutionHeadline}</h2>
          <p className="text-gray-400 text-lg leading-relaxed">${solutionDesc}</p>
        </div>
      </section>` : ''}

      {/* Features */}
      <section className="max-w-6xl mx-auto py-20 md:py-28 px-6" id="features">
        <div className="text-center mb-16">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">Features</p>
          <h2 className="text-3xl md:text-4xl font-bold">Everything you need</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
${featuresJsx}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-gray-900/30" id="how-it-works">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">How It Works</p>
            <h2 className="text-3xl md:text-4xl font-bold">${hiwHeadline}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
${stepsJsx}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto py-20 md:py-28 px-6" id="pricing">
        <div className="text-center mb-16">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">${pricingHeadline}</h2>
          ${pricingSub ? `<p className="text-gray-400 text-lg max-w-2xl mx-auto">${pricingSub}</p>` : ''}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
${pricingJsx}
        </div>
      </section>

      {/* Testimonials */}
      ${testimonials.length > 0 ? `<section className="py-20 bg-gray-900/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">What People Say</p>
            <h2 className="text-3xl md:text-4xl font-bold">Loved by early adopters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
${testimonialsJsx}
          </div>
        </div>
      </section>` : ''}

      {/* FAQ */}
      <section className="max-w-6xl mx-auto py-20 md:py-28 px-6" id="faq">
        <div className="text-center mb-16">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-3">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold">Frequently asked questions</h2>
        </div>
        <FAQ />
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-blue-600/10 to-transparent" id="get-started">
        <div className="max-w-3xl mx-auto text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">${finalHeadline}</h2>
          <p className="text-gray-400 text-lg mb-8">${finalSub}</p>
          <a href="#" className="inline-block px-10 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-lg font-medium transition-colors">${finalCtaText}</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <span className="font-bold text-lg">${companyName}</span>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-600 hover:text-white transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" className="text-gray-600 hover:text-white transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center">
            <p className="text-gray-600 text-sm">© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
`);
}

function write(base, rel, content) {
  const full = path.join(base, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content);
}

module.exports = { generateLandingProject };
