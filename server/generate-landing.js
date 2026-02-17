const fs = require('fs');
const path = require('path');

function escapeJsx(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function esc(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

async function generateLandingProject(content, projectDir, meta) {
  const slug = (meta.company_name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const companyName = esc(meta.company_name || 'Company');
  const headline = esc(content.headline || '');
  const subheadline = esc(content.subheadline || '');
  const cta = esc(content.cta || 'Get Started');
  const features = content.features || [];

  const dirs = ['src'];
  for (const d of dirs) {
    fs.mkdirSync(path.join(projectDir, d), { recursive: true });
  }

  // package.json
  const pkg = {
    name: `${slug}-landing`,
    private: true,
    version: "0.0.0",
    type: "module",
    scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
    dependencies: { "react": "^19.0.0", "react-dom": "^19.0.0" },
    devDependencies: { "@vitejs/plugin-react": "^4.3.0", "vite": "^6.0.0", "tailwindcss": "^3.4.0", "autoprefixer": "^10.4.0", "postcss": "^8.4.0" }
  };
  write(projectDir, 'package.json', JSON.stringify(pkg, null, 2));

  // vite.config.js
  write(projectDir, 'vite.config.js', `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`);

  // tailwind.config.js
  write(projectDir, 'tailwind.config.js', `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
}
`);

  // postcss.config.js
  write(projectDir, 'postcss.config.js', `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`);

  // index.html
  write(projectDir, 'index.html', `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${companyName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

  // src/index.css
  write(projectDir, 'src/index.css', `@tailwind base;
@tailwind components;
@tailwind utilities;
`);

  // src/main.jsx
  write(projectDir, 'src/main.jsx', `import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(<App />)
`);

  // Build static feature cards
  const featureCards = features.map((f) => {
    const t = esc(f.title || '');
    const d = esc(f.desc || '');
    return `        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-2">${t}</h3>
          <p className="text-gray-400 text-sm">${d}</p>
        </div>`;
  }).join('\n');

  // src/App.jsx
  write(projectDir, 'src/App.jsx', `export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <span className="text-xl font-bold">${companyName}</span>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium">${cta}</button>
      </nav>

      <section className="max-w-4xl mx-auto text-center py-24 px-6">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">${headline}</h1>
        <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">${subheadline}</p>
        <button className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-lg font-medium">${cta}</button>
      </section>

      <section className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 px-6 py-16">
${featureCards}
      </section>

      <section className="text-center py-20 px-6">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <button className="px-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-lg font-medium">${cta}</button>
      </section>

      <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
        © ${new Date().getFullYear()} ${companyName}. All rights reserved.
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

if (require.main === module) {
  const testDir = '/tmp/test-landing-' + Date.now();
  generateLandingProject(
    { headline: 'Build Better Products', subheadline: 'AI-powered tools for modern teams', features: [{title: 'Fast', desc: 'Ship in days'}, {title: 'Smart', desc: 'AI-first'}, {title: 'Simple', desc: 'No code needed'}], cta: 'Start Free' },
    testDir,
    { company_name: 'TestCo', full_name: 'Test User' }
  ).then(() => console.log('Test project at:', testDir));
}
