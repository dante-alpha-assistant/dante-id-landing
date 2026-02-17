import { useState } from "react"

const steps = [
  {
    title: "Sign Up",
    description: "Share your vision and goals in minutes.",
  },
  {
    title: "Get Your AI Team",
    description: "We assemble specialists across product, design, and growth.",
  },
  {
    title: "Launch Your Startup",
    description: "Ship a validated, launch-ready business fast.",
  },
]

const features = [
  {
    title: "Business Plan",
    description: "Market research, positioning, pricing, and MVP roadmap.",
  },
  {
    title: "Branding & Design",
    description: "Name, identity, visuals, and product UX crafted by AI.",
  },
  {
    title: "Legal & Compliance",
    description: "Entity setup guidance, policy templates, and risk checks.",
  },
  {
    title: "Payments & Banking",
    description: "Payment stack selection, billing flows, and go-live setup.",
  },
  {
    title: "Website & Product",
    description: "Landing page, product experience, and technical specs.",
  },
  {
    title: "Marketing & Growth",
    description: "Launch plan, content, and growth experiments at speed.",
  },
]

const stats = [
  { value: "3.2x", label: "Faster time to launch" },
  { value: "120+", label: "AI specialists available" },
  { value: "92%", label: "Founder satisfaction" },
]

function App() {
  const [email, setEmail] = useState("")

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!email) return
    console.log("Waitlist signup:", email)
    setEmail("")
  }

  return (
    <div className="min-h-screen bg-dante-bg text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-dante-primary/20 blur-[120px]" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-dante-accent/20 blur-[120px]" />
        </div>

        <header className="relative z-10">
          <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
            <div className="flex items-center gap-3 text-lg font-semibold tracking-[0.2em]">
              <img src="/dante-id/logos/combined.png" alt="dante." className="h-8" />
            </div>
            <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
              <a href="#how" className="transition hover:text-white">
                How it Works
              </a>
              <a href="#features" className="transition hover:text-white">
                Features
              </a>
              <a href="#waitlist" className="transition hover:text-white">
                Waitlist
              </a>
            </div>
            <button className="rounded-full border border-white/20 px-4 py-2 text-sm transition hover:border-white/50">
              Request Access
            </button>
          </nav>
        </header>

        <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-20 pt-12 lg:flex-row lg:items-center lg:pb-32">
          <div className="flex-1">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/70">
              AI Startup Builder Platform
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-5xl lg:text-6xl">
              Launch Your Startup with <span className="gradient-text">AI</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-white/70 md:text-lg">
              dante. gives you a full AI team to design, build, and launch your
              company. From business plan to product, we handle the execution so
              you can focus on vision.
            </p>
            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col gap-4 sm:flex-row"
            >
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className="w-full flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-white/40 focus:border-dante-primary/60 focus:outline-none"
                required
              />
              <button
                type="submit"
                className="rounded-full bg-gradient-to-r from-dante-primary to-dante-accent px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
              >
                Join the Waitlist
              </button>
            </form>
            <p className="mt-4 text-xs text-white/50">
              Early access invites are rolling out weekly.
            </p>
          </div>
          <div className="flex-1">
            <div className="glass rounded-3xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                    Team Output
                  </p>
                  <p className="mt-2 text-2xl font-semibold">
                    Your AI workforce
                  </p>
                </div>
                <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">
                  Live
                </span>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  "Product strategy complete",
                  "Brand kit generated",
                  "Launch site in progress",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-dante-primary to-dante-accent" />
                    <span className="text-sm text-white/80">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-white/50">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-lg font-semibold text-white">12 hrs</p>
                  <p>Avg. first draft</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-lg font-semibold text-white">24/7</p>
                  <p>AI support team</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="how" className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="flex flex-col gap-4">
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            How it works
          </p>
          <h2 className="text-3xl font-semibold md:text-4xl">
            From idea to launch, end-to-end
          </h2>
          <p className="max-w-2xl text-white/70">
            Your AI team moves in parallel — strategy, product, and growth —
            while you stay in control with clear checkpoints.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="glass rounded-3xl p-6">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-lg font-semibold text-white">
                0{index + 1}
              </div>
              <h3 className="text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 text-sm text-white/70">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-black/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="flex flex-col gap-4">
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">
              Features
            </p>
            <h2 className="text-3xl font-semibold md:text-4xl">
              Everything you need to launch fast
            </h2>
            <p className="max-w-2xl text-white/70">
              dante. coordinates a full-stack AI studio so you get strategic
              guidance and execution from day one.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="glass rounded-3xl p-6">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-dante-primary/20 to-dante-accent/20 text-white">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6l4 2"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm text-white/70">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="glass rounded-3xl px-8 py-10 md:px-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                Social proof
              </p>
              <h2 className="mt-4 text-3xl font-semibold md:text-4xl">
                Built by AI agents, for human founders
              </h2>
              <p className="mt-4 max-w-2xl text-white/70">
                Join founders using dante. to accelerate validation, build a
                stronger brand, and ship products that are ready for growth.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-3xl font-semibold gradient-text">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-sm text-white/60">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="waitlist" className="bg-black/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="glass rounded-3xl px-8 py-12 md:px-12">
            <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                  Waitlist
                </p>
                <h2 className="mt-4 text-3xl font-semibold md:text-4xl">
                  Ready to build your startup with AI?
                </h2>
                <p className="mt-4 max-w-xl text-white/70">
                  Secure early access to dante. and collaborate with your AI
                  team from day one.
                </p>
              </div>
              <form
                onSubmit={handleSubmit}
                className="flex w-full max-w-md flex-col gap-4 sm:flex-row"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  className="w-full flex-1 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-white/40 focus:border-dante-primary/60 focus:outline-none"
                  required
                />
                <button
                  type="submit"
                  className="rounded-full bg-gradient-to-r from-dante-primary to-dante-accent px-6 py-3 text-sm font-semibold text-black transition hover:brightness-110"
                >
                  Join the waitlist
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-white/50">© 2026 dante. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-white/60">
            <a href="#how" className="transition hover:text-white">
              How it Works
            </a>
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#waitlist" className="transition hover:text-white">
              Waitlist
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
