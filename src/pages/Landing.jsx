import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

const navLinks = [
  { label: "HOW IT WORKS", href: "#how-it-works" },
  { label: "FEATURES", href: "#features" },
  { label: "PRICING", href: "#pricing" },
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

  const glowStyle = { textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }

  return (
    <div className="bg-[#0a0a0a] text-[#33ff00] font-mono min-h-screen">
      {/* Navbar */}
      <header className="border-b border-[#1f521f] bg-[#0a0a0a] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold" style={glowStyle}>
            <span className="text-[#33ff00]">dante</span><span className="text-[#ffb000]">.id</span>
          </a>
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-sm text-[#22aa00] hover:text-[#33ff00] transition-colors">
                [ {link.label} ]
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-[#33ff00] border border-[#1f521f] px-2 py-1"
              onClick={() => setMobileNav(!mobileNav)}
              aria-label="Toggle navigation"
            >
              [≡]
            </button>
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm text-[#22aa00] hover:text-[#33ff00] transition-colors hidden md:inline">
                  [ DASHBOARD ]
                </Link>
                <Link to="/dashboard" className="text-sm border border-[#33ff00] text-[#33ff00] px-4 py-2 hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors">
                  [ MY PROJECTS ]
                </Link>
              </>
            ) : (
              <Link to={ctaLink} className="text-sm border border-[#33ff00] text-[#33ff00] px-4 py-2 hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors">
                [ GET STARTED ]
              </Link>
            )}
          </div>
        </div>
        {mobileNav && (
          <div className="md:hidden border-t border-[#1f521f] px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="block text-sm text-[#22aa00] hover:text-[#33ff00]" onClick={() => setMobileNav(false)}>
                [ {link.label} ]
              </a>
            ))}
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="py-12 sm:py-24 px-4 sm:px-6" id="top">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <p className="text-xs text-[#1a6b1a] mb-4 reveal" style={{ "--delay": "0ms" }}>
                // AI STARTUP BUILDER
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold leading-tight reveal" style={{ ...glowStyle, "--delay": "100ms" }}>
                Build your startup in days, not months.
              </h1>
              <p className="text-[#22aa00] mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed reveal" style={{ "--delay": "200ms" }}>
                dante.id gives you a full AI team — strategist, designer, developer, lawyer — that builds your business while you focus on your vision.
              </p>
              <form
                className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8 reveal"
                style={{ "--delay": "300ms" }}
                onSubmit={(event) => handleSubmit(event, "hero")}
              >
                <input
                  className="flex-1 px-4 py-3 bg-[#0a0a0a] border border-[#1f521f] text-[#33ff00] placeholder-[#1a6b1a] focus:outline-none focus:border-[#33ff00] font-mono caret-[#33ff00] min-w-0"
                  type="email"
                  placeholder="user@email.com"
                  value={heroEmail}
                  onChange={(event) => setHeroEmail(event.target.value)}
                  required
                />
                <button className="px-6 py-3 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] font-mono transition-colors whitespace-nowrap" type="submit">
                  [ START BUILDING &gt; ]
                </button>
              </form>
              {waitlistStatus === "success" && (
                <p className="text-[#33ff00] text-sm mt-3">[OK] You're on the list.</p>
              )}
              {waitlistStatus === "error" && (
                <p className="text-red-400 text-sm mt-3">[ERROR] Something went wrong. Try again.</p>
              )}
              <p className="text-[#1a6b1a] text-xs mt-3 reveal" style={{ "--delay": "400ms" }}>
                Free to join. No credit card required.
              </p>
            </div>
            <div className="reveal" style={{ "--delay": "200ms" }}>
              <div className="border border-[#1f521f] bg-[#0f0f0f] p-6">
                <div className="text-xs text-[#1a6b1a] mb-4">┌── AGENT_STATUS ──┐</div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold" style={glowStyle}>YOUR AI TEAM</h3>
                  <span className="text-xs border border-[#33ff00] px-2 py-0.5 text-[#33ff00]">[ACTIVE]</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#22aa00]">Strategy agent</span>
                    <span className="text-[#33ff00]">✓ Complete</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#22aa00]">Brand agent</span>
                    <span className="text-[#33ff00]">✓ Complete</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#22aa00]">Dev agent</span>
                    <span className="text-[#ffb000]">→ In Progress</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#1a6b1a]">Legal agent</span>
                    <span className="text-[#1a6b1a]">Queued...</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-[#1f521f] text-center text-sm">
                  <div><div className="text-[#33ff00]">4</div><div className="text-[#1a6b1a] text-xs">agents</div></div>
                  <div><div className="text-[#33ff00]">12hrs</div><div className="text-[#1a6b1a] text-xs">avg</div></div>
                  <div><div className="text-[#33ff00]">24/7</div><div className="text-[#1a6b1a] text-xs">uptime</div></div>
                </div>
                <div className="text-xs text-[#1a6b1a] mt-4">└──────────────────┘</div>
              </div>
            </div>
          </div>
        </section>

        {/* Social proof */}
        <section className="border-y border-[#1f521f] py-4">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-[#1a6b1a] reveal">
            // Trusted by founders building with AI
          </div>
        </section>

        {/* How it works */}
        <section className="py-12 sm:py-24 px-4 sm:px-6" id="how-it-works">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-xs text-[#1a6b1a] mb-2 reveal">// HOW IT WORKS</p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold reveal" style={{ ...glowStyle, "--delay": "100ms" }}>
                From idea to launch, end-to-end.
              </h2>
              <p className="text-[#22aa00] mt-4 reveal" style={{ "--delay": "200ms" }}>
                Your AI team works in parallel — strategy, product, and growth — while you stay in control.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((step, index) => (
                <div key={step.title} className="border border-[#1f521f] bg-[#0f0f0f] p-6 reveal" style={{ "--delay": `${index * 100}ms` }}>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#33ff00]" style={glowStyle}>{step.number}</div>
                  <h3 className="text-lg font-bold mt-4 text-[#33ff00]">{step.title}</h3>
                  <p className="text-[#22aa00] text-sm mt-3">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-6 border-t border-[#1f521f]" id="features">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-xs text-[#1a6b1a] mb-2 reveal">// WHAT YOU GET</p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold reveal" style={{ ...glowStyle, "--delay": "100ms" }}>
                Everything you need to launch.
              </h2>
              <p className="text-[#22aa00] mt-4 reveal" style={{ "--delay": "200ms" }}>
                Five AI agents build your startup. One more coming soon.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={`border border-[#1f521f] bg-[#0f0f0f] p-6 reveal ${feature.coming ? 'opacity-50' : ''}`}
                  style={{ "--delay": `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[#33ff00]">▸</span>
                    {feature.coming && (
                      <span className="text-xs border border-[#1f521f] px-2 py-0.5 text-[#1a6b1a]">[COMING SOON]</span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-[#33ff00]">{feature.title}</h3>
                  <p className="text-[#22aa00] text-sm mt-3">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo */}
        <section className="py-24 px-6 border-t border-[#1f521f]">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-xs text-[#1a6b1a] mb-2 reveal">// SEE IT IN ACTION</p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 reveal" style={{ ...glowStyle, "--delay": "100ms" }}>
              Watch your team build.
            </h2>
            <div className="border border-[#1f521f] bg-[#0f0f0f] p-6 text-left space-y-4 reveal" style={{ "--delay": "200ms" }}>
              <div className="text-xs text-[#1a6b1a] mb-2">┌── AGENT_LOG ──┐</div>
              <div className="text-sm text-[#22aa00]">
                <span className="text-[#1a6b1a]">[strategy]</span> Market analysis shows strong demand in creator tools. Drafting business plan now.
              </div>
              <div className="text-sm text-[#22aa00]">
                <span className="text-[#1a6b1a]">[design]</span> Brand kit ready — logo concepts and primary palette attached.
              </div>
              <div className="text-sm text-[#33ff00]">
                <span className="text-[#ffb000]">[founder]</span> Prioritize a clean homepage with onboarding flow.
              </div>
              <div className="text-sm text-[#22aa00]">
                <span className="text-[#1a6b1a]">[dev]</span> Website build in progress. ETA 6 hours for first draft.
              </div>
              <div className="text-xs text-[#1a6b1a] mt-2">└──────────────┘</div>
            </div>
            <p className="text-[#1a6b1a] text-xs mt-4">// Real output from a dante.id agent team.</p>
          </div>
        </section>

        {/* Stats */}
        <section className="py-24 px-6 border-t border-[#1f521f]" id="pricing">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            <div>
              <p className="text-xs text-[#1a6b1a] mb-2 reveal">// BUILT DIFFERENT</p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold reveal" style={{ ...glowStyle, "--delay": "100ms" }}>
                Built by AI agents, for human founders.
              </h2>
              <p className="text-[#22aa00] mt-4 reveal" style={{ "--delay": "200ms" }}>
                Traditional startup setup costs $10K–$50K and takes months. dante.id does it in days for a fraction of the cost.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat, index) => (
                <div key={stat.label} className="text-center reveal" style={{ "--delay": `${index * 100}ms` }}>
                  <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#33ff00]" style={glowStyle}>{stat.value}</div>
                  <div className="text-[#22aa00] text-xs mt-2">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24 px-6 border-t border-[#1f521f]" id="faq">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs text-[#1a6b1a] mb-2 reveal">// FAQ</p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold reveal" style={{ ...glowStyle, "--delay": "100ms" }}>
                Questions?
              </h2>
            </div>
            {faqItems.map((item, index) => {
              const isOpen = openIndex === index
              return (
                <div key={item.question} className="border-b border-[#1f521f] reveal" style={{ "--delay": `${index * 50}ms` }}>
                  <button
                    className="w-full flex justify-between items-center py-4 text-left text-[#33ff00] hover:text-[#33ff00] transition-colors"
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm">{item.question}</span>
                    <span className="text-[#1a6b1a]">{isOpen ? "[-]" : "[+]"}</span>
                  </button>
                  {isOpen && <p className="text-[#22aa00] text-sm pb-4">{item.answer}</p>}
                </div>
              )
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 border-t border-[#1f521f]" id="waitlist">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold reveal" style={glowStyle}>
              Ready to build?
            </h2>
            <p className="text-[#22aa00] mt-4 reveal" style={{ "--delay": "100ms" }}>
              Join the waitlist and get early access to your AI startup team.
            </p>
            <form
              className="flex gap-3 mt-8 justify-center reveal"
              style={{ "--delay": "200ms" }}
              onSubmit={(event) => handleSubmit(event, "cta")}
            >
              <input
                className="flex-1 max-w-sm px-4 py-3 bg-[#0a0a0a] border border-[#1f521f] text-[#33ff00] placeholder-[#1a6b1a] focus:outline-none focus:border-[#33ff00] font-mono caret-[#33ff00]"
                type="email"
                placeholder="user@email.com"
                value={ctaEmail}
                onChange={(event) => setCtaEmail(event.target.value)}
                required
              />
              <button className="px-6 py-3 border border-[#33ff00] text-[#33ff00] hover:bg-[#33ff00] hover:text-[#0a0a0a] font-mono transition-colors whitespace-nowrap" type="submit">
                [ JOIN WAITLIST ]
              </button>
            </form>
            <p className="text-[#1a6b1a] text-xs mt-3 reveal" style={{ "--delay": "300ms" }}>
              Free to join. No credit card required.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1f521f] py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <span className="text-xl font-bold" style={glowStyle}>dante<span className="text-[#ffb000]">.id</span></span>
              <p className="text-[#1a6b1a] text-sm mt-3">Build with AI.</p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#33ff00] mb-3">PRODUCT</h4>
              <div className="space-y-2">
                <a href="#how-it-works" className="block text-sm text-[#22aa00] hover:text-[#33ff00]">How It Works</a>
                <a href="#features" className="block text-sm text-[#22aa00] hover:text-[#33ff00]">Features</a>
                <a href="#pricing" className="block text-sm text-[#22aa00] hover:text-[#33ff00]">Pricing</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#33ff00] mb-3">COMPANY</h4>
              <div className="space-y-2">
                <span className="block text-sm text-[#1a6b1a]">About</span>
                <span className="block text-sm text-[#1a6b1a]">Blog</span>
                <span className="block text-sm text-[#1a6b1a]">Contact</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#33ff00] mb-3">LEGAL</h4>
              <div className="space-y-2">
                <span className="block text-sm text-[#1a6b1a]">Privacy Policy</span>
                <span className="block text-sm text-[#1a6b1a]">Terms of Service</span>
              </div>
            </div>
          </div>
          <div className="border-t border-[#1f521f] pt-6 flex justify-between items-center text-xs text-[#1a6b1a]">
            <span>© 2026 dante.id</span>
            <div className="flex gap-4">
              <a href="https://x.com" className="text-[#1a6b1a] hover:text-[#33ff00]" aria-label="Twitter/X">[X]</a>
              <a href="https://discord.com" className="text-[#1a6b1a] hover:text-[#33ff00]" aria-label="Discord">[DISCORD]</a>
              <a href="https://github.com" className="text-[#1a6b1a] hover:text-[#33ff00]" aria-label="GitHub">[GITHUB]</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
