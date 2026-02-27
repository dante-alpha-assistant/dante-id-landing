import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { TubesBackground } from "../components/TubesBackground"

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
  { value: "10x", label: "Faster than traditional setup" },
  { value: "$50K", label: "Average savings vs agencies" },
  { value: "24/7", label: "Your team never sleeps" },
]

const faqItems = [
  {
    question: "What is dante.id?",
    answer:
      "dante.id is an AI-powered startup builder. You describe your idea, and a team of AI agents builds your brand identity, landing page, business plan, and growth strategy — in minutes.",
  },
  {
    question: "How is this different from ChatGPT?",
    answer:
      "ChatGPT gives you text. dante.id gives you a team that produces real deliverables — actual business plans, actual logos, actual deployed websites. It's the difference between advice and execution.",
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
      "No. dante.id works for any type of startup — e-commerce, services, SaaS, agencies, local businesses, and more.",
  },
]

export default function Landing() {
  const { user } = useAuth()
  const ctaLink = user ? "/dashboard" : "/signup"
  const [heroEmail, setHeroEmail] = useState("")
  const [ctaEmail, setCtaEmail] = useState("")
  const [openIndex, setOpenIndex] = useState(null)
  const [mobileNav, setMobileNav] = useState(false)

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
    <div className="bg-md-background text-md-on-background font-sans min-h-screen">
      {/* Navbar */}
      <header className="bg-md-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-md-border/20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold text-md-primary">
            dante<span className="text-md-tertiary">.id</span>
          </a>
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-sm text-md-on-surface-variant hover:text-md-primary transition-colors duration-300 ease-md-standard">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-md-on-background p-2 rounded-full hover:bg-md-surface-variant transition-colors duration-300 ease-md-standard"
              onClick={() => setMobileNav(!mobileNav)}
              aria-label="Toggle navigation"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm text-md-on-surface-variant hover:text-md-primary transition-colors hidden md:inline">
                  Dashboard
                </Link>
                <Link to="/dashboard" className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 text-sm font-medium active:scale-95 transition-all duration-300 ease-md-standard hover:shadow-md">
                  My Projects
                </Link>
              </>
            ) : (
              <Link to={ctaLink} className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 text-sm font-medium active:scale-95 transition-all duration-300 ease-md-standard hover:shadow-md">
                Get Started
              </Link>
            )}
          </div>
        </div>
        {mobileNav && (
          <div className="md:hidden border-t border-md-border/20 px-6 py-4 space-y-3 bg-md-background">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="block text-sm text-md-on-surface-variant hover:text-md-primary py-2" onClick={() => setMobileNav(false)}>
                {link.label}
              </a>
            ))}
          </div>
        )}
      </header>

      <main>
        {/* Hero - Simplified with 3D Tubes Background */}
        <section className="relative h-[90vh] min-h-[600px] overflow-hidden" id="top">
          <TubesBackground className="absolute inset-0 bg-md-background">
            <div className="flex flex-col items-center justify-center w-full h-full px-4 sm:px-6">
              <div className="max-w-4xl mx-auto text-center pointer-events-auto">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-white drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] reveal">
                  Build your startup<br />
                  <span className="text-md-primary">in days, not months.</span>
                </h1>
                <p className="text-white/90 mt-6 sm:mt-8 text-lg sm:text-xl leading-relaxed max-w-2xl mx-auto reveal drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]" style={{ "--delay": "100ms" }}>
                  dante.id gives you a full AI team that builds your business while you focus on your vision.
                </p>
                <div className="mt-8 sm:mt-10 reveal" style={{ "--delay": "200ms" }}>
                  <Link
                    to={ctaLink}
                    className="inline-flex items-center gap-2 rounded-full bg-md-primary text-md-on-primary px-8 py-4 text-lg font-medium active:scale-95 transition-all duration-300 ease-md-standard hover:shadow-lg hover:shadow-md-primary/50 pointer-events-auto"
                  >
                    Start Building
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </Link>
                </div>
                <p className="text-white/70 text-sm mt-4 reveal" style={{ "--delay": "300ms" }}>
                  Free to join. No credit card required.
                </p>
              </div>
            </div>
          </TubesBackground>
        </section>

        {/* Social proof */}
        <section className="py-4 border-y border-md-border/10">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-md-on-surface-variant reveal">
            Trusted by founders building with AI
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-24 px-4 sm:px-6" id="how-it-works">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs font-medium px-4 py-1.5 mb-4 reveal">How It Works</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-md-on-background reveal" style={{ "--delay": "100ms" }}>
                From idea to launch, end-to-end.
              </h2>
              <p className="text-md-on-surface-variant mt-4 reveal" style={{ "--delay": "200ms" }}>
                Your AI team works in parallel — strategy, product, and growth — while you stay in control.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((step, index) => (
                <div key={step.title} className="bg-md-surface-container rounded-md-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300 ease-md-standard reveal" style={{ "--delay": `${index * 100}ms` }}>
                  <div className="text-3xl font-bold text-md-primary">{step.number}</div>
                  <h3 className="text-lg font-bold mt-4 text-md-on-background">{step.title}</h3>
                  <p className="text-md-on-surface-variant text-sm mt-3">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6" id="features">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs font-medium px-4 py-1.5 mb-4 reveal">What You Get</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-md-on-background reveal" style={{ "--delay": "100ms" }}>
                Everything you need to launch.
              </h2>
              <p className="text-md-on-surface-variant mt-4 reveal" style={{ "--delay": "200ms" }}>
                Five AI agents build your startup. One more coming soon.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`bg-md-surface-container rounded-md-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300 ease-md-standard reveal ${feature.coming ? 'opacity-60' : ''}`}
                  style={{ "--delay": `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-md-primary">▸</span>
                    {feature.coming && (
                      <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs px-3 py-0.5">Coming Soon</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-md-on-background">{feature.title}</h3>
                  <p className="text-md-on-surface-variant text-sm mt-3">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs font-medium px-4 py-1.5 mb-4 reveal">See It In Action</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-md-on-background mb-8 reveal" style={{ "--delay": "100ms" }}>
              Watch your team build.
            </h2>
            <div className="bg-md-surface-container rounded-md-lg p-6 text-left space-y-4 shadow-sm reveal" style={{ "--delay": "200ms" }}>
              <div className="text-sm text-md-on-surface-variant">
                <span className="inline-block rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs px-2.5 py-0.5 mr-2">strategy</span>
                Market analysis shows strong demand in creator tools. Drafting business plan now.
              </div>
              <div className="text-sm text-md-on-surface-variant">
                <span className="inline-block rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs px-2.5 py-0.5 mr-2">design</span>
                Brand kit ready — logo concepts and primary palette attached.
              </div>
              <div className="text-sm text-md-on-background font-medium">
                <span className="inline-block rounded-full bg-md-primary text-md-on-primary text-xs px-2.5 py-0.5 mr-2">founder</span>
                Prioritize a clean homepage with onboarding flow.
              </div>
              <div className="text-sm text-md-on-surface-variant">
                <span className="inline-block rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs px-2.5 py-0.5 mr-2">dev</span>
                Website build in progress. ETA 6 hours for first draft.
              </div>
            </div>
            <p className="text-md-on-surface-variant text-xs mt-4">Real output from a dante.id agent team.</p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-24 px-6" id="pricing">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <span className="inline-block rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs font-medium px-4 py-1.5 mb-4 reveal">Built Different</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-md-on-background reveal" style={{ "--delay": "100ms" }}>
                Built by AI agents, for human founders.
              </h2>
              <p className="text-md-on-surface-variant mt-4 reveal" style={{ "--delay": "200ms" }}>
                Traditional startup setup costs $10K–$50K and takes months. dante.id does it in days for a fraction of the cost.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center reveal" style={{ "--delay": `${index * 100}ms` }}>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-md-primary">{stat.value}</div>
                  <div className="text-md-on-surface-variant text-xs mt-2">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 px-6" id="faq">
          <div style={{ backgroundColor: '#FAFAFA', borderRadius: '16px', padding: '32px', maxWidth: '800px', margin: '0 auto 80px' }}>
            <div className="text-center mb-10">
              <span className="inline-block rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs font-medium px-4 py-1.5 mb-4 reveal">FAQ</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-md-on-background reveal" style={{ "--delay": "100ms" }}>
                Questions?
              </h2>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', overflow: 'hidden' }}>
              {faqItems.map((item, index) => {
                const isOpen = openIndex === index
                const isLast = index === faqItems.length - 1
                return (
                  <div key={item.question} className="reveal" style={{ "--delay": `${index * 50}ms`, borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.06)' }}>
                    <button
                      className="w-full flex justify-between items-center p-5 text-left text-md-on-background hover:bg-gray-50 transition-all duration-200 ease-md-standard"
                      style={{ backgroundColor: isOpen ? '#FAFAFA' : '#FFFFFF' }}
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      aria-expanded={isOpen}
                    >
                      <span className="text-sm font-medium pr-4">{item.question}</span>
                      <span
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-md-on-surface-variant text-lg ml-2 transition-all duration-200"
                        style={{ backgroundColor: isOpen ? '#E8E0EB' : '#F5F5F5', transform: isOpen ? 'rotate(0deg)' : 'rotate(0deg)' }}
                      >
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5" style={{ backgroundColor: '#FAFAFA' }}>
                        <p className="text-md-on-surface-variant text-sm leading-relaxed">{item.answer}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section
          className="relative py-24 sm:py-32 px-6 overflow-hidden"
          id="waitlist"
          style={{
            background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)'
          }}
        >
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }}
          />
          {/* Gradient orbs */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '-100px',
              left: '-100px',
              width: '300px',
              height: '300px',
              background: '#7C3AED',
              opacity: 0.2,
              filter: 'blur(100px)',
              borderRadius: '50%'
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: '-50px',
              right: '-50px',
              width: '300px',
              height: '300px',
              background: '#EC4899',
              opacity: 0.15,
              filter: 'blur(100px)',
              borderRadius: '50%'
            }}
          />
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2
              className="reveal"
              style={{
                fontSize: 'clamp(36px, 5vw, 56px)',
                fontWeight: 800,
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                marginBottom: '16px',
                lineHeight: 1.1
              }}
            >
              Ready to build?
            </h2>
            <p
              className="reveal"
              style={{
                "--delay": "100ms",
                fontSize: '20px',
                color: 'rgba(255,255,255,0.7)',
                maxWidth: '500px',
                margin: '0 auto 48px',
                lineHeight: 1.5
              }}
            >
              Join the waitlist and get early access to your AI startup team.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-3 justify-center reveal"
              style={{ "--delay": "200ms" }}
              onSubmit={(event) => handleSubmit(event, "cta")}
            >
              <input
                type="email"
                placeholder="user@email.com"
                value={ctaEmail}
                onChange={(event) => setCtaEmail(event.target.value)}
                required
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  fontSize: '16px',
                  color: '#FFFFFF',
                  width: '100%',
                  maxWidth: '400px',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#7C3AED';
                  e.target.style.background = 'rgba(255,255,255,0.12)';
                  e.target.style.boxShadow = '0 0 0 4px rgba(124,58,237,0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                  e.target.style.background = 'rgba(255,255,255,0.08)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 700,
                  padding: '20px 40px',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 8px 24px rgba(124,58,237,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
                onMouseDown={(e) => {
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Join Waitlist
              </button>
            </form>
            <p
              className="reveal"
              style={{
                "--delay": "300ms",
                fontSize: '14px',
                color: 'rgba(255,255,255,0.5)',
                marginTop: '16px'
              }}
            >
              Free to join. No credit card required.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          background: '#0A0A0A',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '80px 24px 40px'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
              gap: '64px'
            }}
          >
            {/* Brand column */}
            <div>
              {/* Brand mark - stylized "d" monogram */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="40" height="40" rx="10" fill="#7C3AED"/>
                  <path d="M14 12C14 10.8954 14.8954 10 16 10H20C24.4183 10 28 13.5817 28 18V22C28 26.4183 24.4183 30 20 30H16C14.8954 30 14 29.1046 14 28V12Z" fill="white"/>
                  <path d="M20 16H18V24H20C22.2091 24 24 22.2091 24 20C24 17.7909 22.2091 16 20 16Z" fill="#7C3AED"/>
                </svg>
                <span style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: '-0.01em'
                }}>
                  dante.id
                </span>
              </div>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.5)',
                marginTop: '8px'
              }}>
                Build with AI.
              </p>
            </div>

            {/* Product column */}
            <div>
              <h4 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '24px'
              }}>
                Product
              </h4>
              <div>
                <a href="#how-it-works" style={{
                  display: 'block',
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  marginBottom: '12px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.6)'}
                >
                  How It Works
                </a>
                <a href="#features" style={{
                  display: 'block',
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  marginBottom: '12px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.6)'}
                >
                  Features
                </a>
                <a href="#pricing" style={{
                  display: 'block',
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.6)',
                  textDecoration: 'none',
                  marginBottom: '12px',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.6)'}
                >
                  Pricing
                </a>
              </div>
            </div>

            {/* Company column */}
            <div>
              <h4 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '24px'
              }}>
                Company
              </h4>
              <div>
                <span style={{
                  display: 'block',
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '12px'
                }}>About</span>
                <span style={{
                  display: 'block',
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '12px'
                }}>Blog</span>
                <span style={{
                  display: 'block',
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '12px'
                }}>Contact</span>
              </div>
            </div>

            {/* Legal column */}
            <div>
              <h4 style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#FFFFFF',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '24px'
              }}>
                Legal
              </h4>
              <div>
                <span style={{
                  display: 'block',
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '12px'
                }}>Privacy Policy</span>
                <span style={{
                  display: 'block',
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '12px'
                }}>Terms of Service</span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            marginTop: '64px',
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.4)'
          }}>
            <span>© 2026 dante.id</span>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="https://x.com" style={{
                color: 'rgba(255,255,255,0.4)',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
              aria-label="Twitter/X"
              >
                𝕏
              </a>
              <a href="https://discord.com" style={{
                color: 'rgba(255,255,255,0.4)',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
              aria-label="Discord"
              >
                Discord
              </a>
              <a href="https://github.com" style={{
                color: 'rgba(255,255,255,0.4)',
                textDecoration: 'none',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = '#FFFFFF'}
              onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.4)'}
              aria-label="GitHub"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
