import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
]

const steps = [
  {
    number: "01",
    title: "Describe your idea",
    description:
      "Tell us what you're building, who it's for, and your vision. Takes 5 minutes.",
  },
  {
    number: "02",
    title: "Meet your AI team",
    description:
      "We assemble a team of AI agents — brand strategist, copywriter, business planner, and growth advisor — tailored to your startup.",
  },
  {
    number: "03",
    title: "Launch your business",
    description:
      "Your team builds everything: business plan, brand, website, legal docs, payment setup. You review and approve.",
  },
]

const features = [
  {
    title: "Brand Identity",
    description:
      "Name suggestions, color palette, typography, taglines, and a complete brand voice guide.",
  },
  {
    title: "Landing Page",
    description:
      "AI-generated, conversion-optimized landing page — built, deployed, and live on its own URL.",
  },
  {
    title: "Business Plan",
    description:
      "Executive summary, market analysis, revenue model, competitive landscape, and quarterly milestones.",
  },
  {
    title: "Growth Strategy",
    description:
      "90-day tactical playbook with channel strategy, budget allocation, and weekly action items.",
  },
  {
    title: "Personal Brand Kit",
    description:
      "Twitter/X launch thread, LinkedIn post, Product Hunt copy, founder bio, and elevator pitch — ready to post.",
  },
  {
    title: "Legal & Compliance",
    description:
      "Terms of service, privacy policy, entity guidance, and contractor agreements.",
    coming: true,
  },
]

const stats = [
  {
    value: "10x",
    label: "Faster than traditional setup",
  },
  {
    value: "$50K",
    label: "Average savings vs agencies",
  },
  {
    value: "24/7",
    label: "Your team never sleeps",
  },
]

const faqItems = [
  {
    question: "What is dante.?",
    answer:
      "dante. is an AI-powered startup builder. You describe your idea, and a team of AI agents builds your brand identity, landing page, business plan, and growth strategy — in minutes.",
  },
  {
    question: "How is this different from ChatGPT?",
    answer:
      "ChatGPT gives you text. dante. gives you a team that produces real deliverables — actual business plans, actual logos, actual deployed websites. It's the difference between advice and execution.",
  },
  {
    question: "How much does it cost?",
    answer:
      "We're in early access. Join the waitlist for free and be first in line when we launch.",
  },
  {
    question: "How long does it take?",
    answer:
      "Most startups go from idea to launch-ready in 3-5 days. Your AI team works 24/7 in parallel.",
  },
  {
    question: "Can I customize what the agents build?",
    answer:
      "Absolutely. You review every deliverable and can request iterations. The agents work for you, not the other way around.",
  },
  {
    question: "Is this just for tech startups?",
    answer:
      "No. dante. works for any type of startup — e-commerce, services, SaaS, agencies, local businesses, and more.",
  },
]

export default function Landing() {
  const [heroEmail, setHeroEmail] = useState("")
  const [ctaEmail, setCtaEmail] = useState("")
  const [openIndex, setOpenIndex] = useState(null)

  useEffect(() => {
    const elements = document.querySelectorAll(".reveal")
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -20px 0px" }
    )

    // Small delay to ensure layout is ready before observing
    requestAnimationFrame(() => {
      elements.forEach((el) => observer.observe(el))
    })

    return () => observer.disconnect()
  }, [])

  const [waitlistStatus, setWaitlistStatus] = useState(null)

  const handleSubmit = async (event, source) => {
    event.preventDefault()
    const email = source === "hero" ? heroEmail : ctaEmail
    if (!email) return
    setWaitlistStatus("sending")
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source })
      })
      if (res.ok) {
        setWaitlistStatus("success")
        if (source === "hero") setHeroEmail("")
        if (source === "cta") setCtaEmail("")
      } else {
        setWaitlistStatus("error")
      }
    } catch {
      setWaitlistStatus("error")
    }
    setTimeout(() => setWaitlistStatus(null), 4000)
  }

  return (
    <div>
      <header className="navbar">
        <div className="container navbar-inner">
          <a href="/" className="logo-lockup" aria-label="dante. home">
            <span className="logo-d">d</span>
            <span className="logo-text">dante<span className="logo-dot">.</span></span>
          </a>
          <nav className="nav-links" aria-label="Primary">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button className="hamburger" aria-label="Open navigation">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <Link to="/signup" className="btn btn-ghost">Get Started</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="container hero-grid">
            <div>
              <p className="section-label reveal" style={{ "--delay": "0ms" }}>
                AI STARTUP BUILDER
              </p>
              <h1 className="hero-title reveal" style={{ "--delay": "100ms" }}>
                Build your startup in days, not months.
              </h1>
              <p className="hero-subtitle reveal" style={{ "--delay": "200ms" }}>
                dante. gives you a full AI team — strategist, designer, developer, lawyer — that builds your business while you focus on your vision.
              </p>
              <form
                className="hero-cta reveal"
                style={{ "--delay": "300ms" }}
                onSubmit={(event) => handleSubmit(event, "hero")}
              >
                <input
                  className="input"
                  type="email"
                  placeholder="Enter your email"
                  value={heroEmail}
                  onChange={(event) => setHeroEmail(event.target.value)}
                  required
                />
                <button className="btn btn-primary" type="submit">
                  Join the waitlist
                </button>
              </form>
              <p className="text-muted reveal" style={{ fontSize: "13px", marginTop: "12px", "--delay": "400ms" }}>
                Free to join. No credit card required.
              </p>
            </div>
            <div className="reveal" style={{ "--delay": "200ms" }}>
              <div className="hero-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3 className="heading-md" style={{ margin: 0 }}>
                    Your AI Team
                  </h3>
                  <span className="status-badge">Active</span>
                </div>
                <div className="status-list">
                  <div className="status-item">
                    <span>🟣</span>
                    <span>Strategy complete</span>
                    <span style={{ marginLeft: "auto", color: "var(--color-success)" }}>✓</span>
                  </div>
                  <div className="status-item">
                    <span>🟣</span>
                    <span>Brand kit generated</span>
                    <span style={{ marginLeft: "auto", color: "var(--color-success)" }}>✓</span>
                  </div>
                  <div className="status-item">
                    <span>🔵</span>
                    <span>Website in progress</span>
                    <span style={{ marginLeft: "auto" }} className="spinner" />
                  </div>
                  <div className="status-item muted">
                    <span>○</span>
                    <span>Legal docs queued</span>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                    marginTop: "20px",
                    fontSize: "12px",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <div style={{ fontSize: "14px", color: "var(--color-text)" }}>4 agents</div>
                  <div style={{ fontSize: "14px", color: "var(--color-text)" }}>12 hrs avg</div>
                  <div style={{ fontSize: "14px", color: "var(--color-text)" }}>24/7</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="social-proof">
          <div className="container reveal">Trusted by founders building with AI</div>
        </section>

        <section className="section" id="how-it-works">
          <div className="container">
            <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
              <p className="section-label reveal">HOW IT WORKS</p>
              <h2 className="heading-xl reveal" style={{ marginBottom: "16px", "--delay": "100ms" }}>
                From idea to launch, end-to-end.
              </h2>
              <p className="text-secondary reveal" style={{ fontSize: "18px", "--delay": "200ms" }}>
                Your AI team works in parallel — strategy, product, and growth — while you stay in control.
              </p>
            </div>
            <div className="grid-3" style={{ marginTop: "48px" }}>
              {steps.map((step, index) => (
                <div key={step.title} className="card reveal" style={{ "--delay": `${index * 100}ms` }}>
                  <div style={{ fontSize: "32px", fontWeight: 700, color: "var(--color-primary)" }}>{step.number}</div>
                  <h3 className="heading-md" style={{ marginTop: "16px" }}>
                    {step.title}
                  </h3>
                  <p className="text-secondary" style={{ marginTop: "12px" }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="features">
          <div className="container">
            <div style={{ textAlign: "center", maxWidth: "700px", margin: "0 auto" }}>
              <p className="section-label reveal">WHAT YOU GET</p>
              <h2 className="heading-xl reveal" style={{ marginBottom: "16px", "--delay": "100ms" }}>
                Everything you need to launch.
              </h2>
              <p className="text-secondary reveal" style={{ fontSize: "18px", "--delay": "200ms" }}>
                Five AI agents build your startup. One more coming soon.
              </p>
            </div>
            <div className="grid-2x3" style={{ marginTop: "48px" }}>
              {features.map((feature, index) => (
                <div key={feature.title} className="card card-lift reveal" style={{ "--delay": `${index * 100}ms`, opacity: feature.coming ? 0.5 : 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div className="card-icon">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                      </svg>
                    </div>
                    {feature.coming && (
                      <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "12px", background: "rgba(255,255,255,0.1)", color: "var(--color-text-muted)" }}>Coming soon</span>
                    )}
                  </div>
                  <h3 className="heading-md" style={{ fontSize: "18px" }}>
                    {feature.title}
                  </h3>
                  <p className="text-secondary" style={{ fontSize: "14px", marginTop: "12px" }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section demo-section">
          <div className="container" style={{ textAlign: "center" }}>
            <p className="section-label reveal">SEE IT IN ACTION</p>
            <h2 className="heading-xl reveal" style={{ marginBottom: "16px", "--delay": "100ms" }}>
              Watch your team build.
            </h2>
            <div className="demo-card reveal" style={{ "--delay": "200ms" }}>
              <div className="chat-row">
                <div className="chat-bubble agent">
                  Strategy agent: Market analysis shows strong demand in creator tools. Drafting your business plan now.
                </div>
                <div className="chat-bubble agent">
                  Design agent: Brand kit is ready — logo concepts and primary palette attached.
                </div>
                <div className="chat-bubble user">
                  Founder: Prioritize a clean homepage with onboarding flow.
                </div>
                <div className="chat-bubble agent">
                  Dev agent: Website build in progress. ETA 6 hours for first draft.
                </div>
              </div>
            </div>
            <p className="text-muted" style={{ fontSize: "14px", marginTop: "16px" }}>
              Real output from a dante. agent team.
            </p>
          </div>
        </section>

        <section className="section stats-section" id="pricing">
          <div className="container">
            <div className="stats-layout">
              <div>
                <p className="section-label reveal">BUILT DIFFERENT</p>
                <h2 className="heading-lg reveal" style={{ marginBottom: "16px", fontSize: "36px", "--delay": "100ms" }}>
                  Built by AI agents, for human founders.
                </h2>
                <p className="text-secondary reveal" style={{ "--delay": "200ms" }}>
                  Traditional startup setup costs $10K–$50K and takes months. dante. does it in days for a fraction of the cost.
                </p>
              </div>
              <div className="stats-grid">
                {stats.map((stat, index) => (
                  <div key={stat.label} className="reveal" style={{ "--delay": `${index * 100}ms` }}>
                    <div className="stat-value">{stat.value}</div>
                    <div className="text-secondary" style={{ fontSize: "14px" }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="faq">
          <div className="container faq">
            <div style={{ textAlign: "center" }}>
              <p className="section-label reveal">FAQ</p>
              <h2 className="heading-xl reveal" style={{ marginBottom: "32px", "--delay": "100ms" }}>
                Questions?
              </h2>
            </div>
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index
              return (
                <div key={item.question} className="faq-item reveal" style={{ "--delay": `${index * 100}ms` }}>
                  <button
                    className="faq-question"
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>
                    <span>{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && <p className="faq-answer">{item.answer}</p>}
                </div>
              )
            })}
          </div>
        </section>

        <section className="section cta-section" id="waitlist">
          <div className="container" style={{ textAlign: "center", maxWidth: "720px" }}>
            <h2 className="heading-xl reveal" style={{ fontSize: "48px" }}>
              Ready to build?
            </h2>
            <p
              className="text-secondary reveal"
              style={{ fontSize: "18px", marginTop: "16px", maxWidth: "480px", marginInline: "auto", "--delay": "100ms" }}
            >
              Join the waitlist and get early access to your AI startup team.
            </p>
            <form
              className="hero-cta reveal"
              style={{ justifyContent: "center", marginTop: "32px", "--delay": "200ms" }}
              onSubmit={(event) => handleSubmit(event, "cta")}
            >
              <input
                className="input"
                type="email"
                placeholder="Enter your email"
                value={ctaEmail}
                onChange={(event) => setCtaEmail(event.target.value)}
                required
              />
              <button className="btn btn-primary" type="submit">
                Join the waitlist
              </button>
            </form>
            <p className="text-muted reveal" style={{ fontSize: "13px", marginTop: "12px", "--delay": "300ms" }}>
              Free to join. No credit card required.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="logo-lockup logo-sm">
                <span className="logo-d">d</span>
                <span className="logo-text">dante<span className="logo-dot">.</span></span>
              </div>
              <p className="text-secondary" style={{ marginTop: "12px", fontSize: "14px" }}>
                Build with AI.
              </p>
            </div>
            <div>
              <h4 className="heading-md" style={{ fontSize: "16px", marginBottom: "12px" }}>
                Product
              </h4>
              <div className="footer-links">
                <a href="#how-it-works">How It Works</a>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
              </div>
            </div>
            <div>
              <h4 className="heading-md" style={{ fontSize: "16px", marginBottom: "12px" }}>
                Company
              </h4>
              <div className="footer-links">
                <span>About</span>
                <span>Blog</span>
                <span>Contact</span>
              </div>
            </div>
            <div>
              <h4 className="heading-md" style={{ fontSize: "16px", marginBottom: "12px" }}>
                Legal
              </h4>
              <div className="footer-links">
                <span>Privacy Policy</span>
                <span>Terms of Service</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 dante.</span>
            <div className="footer-socials">
              <a href="https://x.com" aria-label="Twitter/X">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4l16 16M20 4L4 20" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a href="https://discord.com" aria-label="Discord">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M7 18c3 2 7 2 10 0" strokeLinecap="round" />
                  <circle cx="9" cy="12" r="1" />
                  <circle cx="15" cy="12" r="1" />
                </svg>
              </a>
              <a href="https://github.com" aria-label="GitHub">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path
                    d="M12 2a10 10 0 00-3 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.1-1.2-1.4-1.2-1.4-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1 1.6-.8 1.6-.8.2-.7.6-1.1 1-1.3-2.2-.3-4.6-1.1-4.6-5a3.9 3.9 0 011-2.7 3.6 3.6 0 01.1-2.7s.8-.3 2.8 1a9.7 9.7 0 015.1 0c2-1.3 2.8-1 2.8-1a3.6 3.6 0 01.1 2.7 3.9 3.9 0 011 2.7c0 3.9-2.4 4.7-4.6 5 .6.5 1.1 1.2 1.1 2.5v2.2c0 .3.2.6.7.5A10 10 0 0012 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
