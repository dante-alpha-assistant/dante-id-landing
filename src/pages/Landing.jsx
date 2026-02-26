import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

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
        {/* Hero */}
        <section className="relative py-16 sm:py-28 px-4 sm:px-6 overflow-hidden" id="top">
          {/* Blur shapes */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-md-primary/20 blur-3xl rounded-full" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-md-secondary-container/40 blur-3xl rounded-full" />
          <div className="absolute top-40 right-1/4 w-64 h-64 bg-md-tertiary/10 blur-3xl rounded-full" />

          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-16 items-center relative z-10">
            <div>
              <span className="inline-block rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs font-medium px-4 py-1.5 mb-6 reveal" style={{ "--delay": "0ms" }}>
                AI Startup Builder
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-md-on-background reveal" style={{ "--delay": "100ms" }}>
                Build your startup in days, not months.
              </h1>
              <p className="text-md-on-surface-variant mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed reveal" style={{ "--delay": "200ms" }}>
                dante.id gives you a full AI team — strategist, designer, developer, lawyer — that builds your business while you focus on your vision.
              </p>
              <form
                className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8 reveal"
                style={{ "--delay": "300ms" }}
                onSubmit={(event) => handleSubmit(event, "hero")}
              >
                <input
                  className="flex-1 px-4 h-14 bg-md-surface-variant rounded-t-lg rounded-b-none border-b-2 border-md-border text-md-on-background placeholder-md-on-surface-variant focus:outline-none focus:border-md-primary transition-colors duration-300 ease-md-standard min-w-0"
                  type="email"
                  placeholder="user@email.com"
                  value={heroEmail}
                  onChange={(event) => setHeroEmail(event.target.value)}
                  required
                />
                <button className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 font-medium active:scale-95 transition-all duration-300 ease-md-standard hover:shadow-md whitespace-nowrap" type="submit">
                  Start Building
                </button>
              </form>
              {waitlistStatus === "success" && (
                <p className="text-md-primary text-sm mt-3">You're on the list! ✓</p>
              )}
              {waitlistStatus === "error" && (
                <p className="text-red-500 text-sm mt-3">Something went wrong. Try again.</p>
              )}
              <p className="text-md-on-surface-variant text-xs mt-3 reveal" style={{ "--delay": "400ms" }}>
                Free to join. No credit card required.
              </p>
            </div>
            <div className="reveal" style={{ "--delay": "200ms" }}>
              <div className="bg-md-surface-container rounded-md-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300 ease-md-standard">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg font-bold text-md-on-background">Your AI Team</h3>
                  <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs font-medium px-3 py-1">Active</span>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-md-on-surface-variant">Strategy agent</span>
                    <span className="text-md-primary font-medium">✓ Complete</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-md-on-surface-variant">Brand agent</span>
                    <span className="text-md-primary font-medium">✓ Complete</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-md-on-surface-variant">Dev agent</span>
                    <span className="text-md-tertiary font-medium">→ In Progress</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-md-on-surface-variant/60">Legal agent</span>
                    <span className="text-md-on-surface-variant/60">Queued...</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-md-border/20 text-center text-sm">
                  <div><div className="text-md-primary font-bold">4</div><div className="text-md-on-surface-variant text-xs">agents</div></div>
                  <div><div className="text-md-primary font-bold">12hrs</div><div className="text-md-on-surface-variant text-xs">avg</div></div>
                  <div><div className="text-md-primary font-bold">24/7</div><div className="text-md-on-surface-variant text-xs">uptime</div></div>
                </div>
              </div>
            </div>
          </div>
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
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs font-medium px-4 py-1.5 mb-4 reveal">FAQ</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-md-on-background reveal" style={{ "--delay": "100ms" }}>
                Questions?
              </h2>
            </div>
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index
              return (
                <div key={item.question} className="border-b border-md-border/20 reveal" style={{ "--delay": `${index * 50}ms` }}>
                  <button
                    className="w-full flex justify-between items-center py-4 text-left text-md-on-background hover:text-md-primary transition-colors duration-300 ease-md-standard"
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-medium">{item.question}</span>
                    <span className="text-md-on-surface-variant text-lg ml-4">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && <p className="text-md-on-surface-variant text-sm pb-4">{item.answer}</p>}
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="relative py-24 px-6 overflow-hidden" id="waitlist">
          <div className="absolute top-0 left-1/3 w-80 h-80 bg-md-primary/15 blur-3xl rounded-full" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-md-secondary-container/30 blur-3xl rounded-full" />
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-md-on-background reveal">
              Ready to build?
            </h2>
            <p className="text-md-on-surface-variant mt-4 reveal" style={{ "--delay": "100ms" }}>
              Join the waitlist and get early access to your AI startup team.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-3 mt-8 justify-center reveal"
              style={{ "--delay": "200ms" }}
              onSubmit={(event) => handleSubmit(event, "cta")}
            >
              <input
                className="flex-1 max-w-sm px-4 h-14 bg-md-surface-variant rounded-t-lg rounded-b-none border-b-2 border-md-border text-md-on-background placeholder-md-on-surface-variant focus:outline-none focus:border-md-primary transition-colors duration-300 ease-md-standard"
                type="email"
                placeholder="user@email.com"
                value={ctaEmail}
                onChange={(event) => setCtaEmail(event.target.value)}
                required
              />
              <button className="rounded-full bg-md-primary text-md-on-primary px-6 py-2.5 font-medium active:scale-95 transition-all duration-300 ease-md-standard hover:shadow-md whitespace-nowrap" type="submit">
                Join Waitlist
              </button>
            </form>
            <p className="text-md-on-surface-variant text-xs mt-3 reveal" style={{ "--delay": "300ms" }}>
              Free to join. No credit card required.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-md-border/10 py-12 px-6 bg-md-surface-container">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <span className="text-xl font-bold text-md-primary">dante<span className="text-md-tertiary">.id</span></span>
              <p className="text-md-on-surface-variant text-sm mt-3">Build with AI.</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-md-on-background mb-3">Product</h4>
              <div className="space-y-2">
                <a href="#how-it-works" className="block text-sm text-md-on-surface-variant hover:text-md-primary transition-colors duration-300">How It Works</a>
                <a href="#features" className="block text-sm text-md-on-surface-variant hover:text-md-primary transition-colors duration-300">Features</a>
                <a href="#pricing" className="block text-sm text-md-on-surface-variant hover:text-md-primary transition-colors duration-300">Pricing</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-md-on-background mb-3">Company</h4>
              <div className="space-y-2">
                <span className="block text-sm text-md-on-surface-variant">About</span>
                <span className="block text-sm text-md-on-surface-variant">Blog</span>
                <span className="block text-sm text-md-on-surface-variant">Contact</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-md-on-background mb-3">Legal</h4>
              <div className="space-y-2">
                <span className="block text-sm text-md-on-surface-variant">Privacy Policy</span>
                <span className="block text-sm text-md-on-surface-variant">Terms of Service</span>
              </div>
            </div>
          </div>
          <div className="border-t border-md-border/10 pt-6 flex justify-between items-center text-xs text-md-on-surface-variant">
            <span>© 2026 dante.id</span>
            <div className="flex gap-4">
              <a href="https://x.com" className="text-md-on-surface-variant hover:text-md-primary transition-colors duration-300" aria-label="Twitter/X">𝕏</a>
              <a href="https://discord.com" className="text-md-on-surface-variant hover:text-md-primary transition-colors duration-300" aria-label="Discord">Discord</a>
              <a href="https://github.com" className="text-md-on-surface-variant hover:text-md-primary transition-colors duration-300" aria-label="GitHub">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
