import { useState } from 'react'
import { supabase } from '../lib/supabase'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: ['1 startup project', 'All 7 AI deliverables', 'Landing page deployment', 'Basic analytics'],
    cta: 'Current Plan',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    period: '/month',
    features: ['Unlimited projects', 'All 7 AI deliverables', 'Custom domains', 'AI Co-founder Chat', 'Priority generation', 'Advanced analytics'],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    id: 'team',
    name: 'Team',
    price: '$79',
    period: '/month',
    features: ['Everything in Pro', 'Team collaboration', 'White-label landing pages', 'API access', 'Priority support', 'Bulk export'],
    cta: 'Upgrade to Team',
    highlight: false,
  },
]

export default function PricingPlans({ currentPlan = 'free', onManageBilling }) {
  const [loading, setLoading] = useState(null)

  const handleUpgrade = async (planId) => {
    if (planId === 'free' || planId === currentPlan) return
    setLoading(planId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan: planId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || 'Failed to create checkout')
    } catch (err) {
      console.error('Checkout error:', err)
      alert('Something went wrong')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`rounded-md-lg p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow ${
            plan.highlight
              ? 'bg-md-primary-container border-2 border-md-primary'
              : 'bg-md-surface-container border border-md-outline-variant'
          }`}
        >
          {plan.highlight && (
            <span className="rounded-full bg-md-secondary-container text-md-on-secondary-container text-xs px-2 py-0.5 self-start mb-2 font-semibold">Most Popular</span>
          )}
          <h3 className="text-xl font-bold text-md-on-surface">{plan.name}</h3>
          <div className="mt-2 mb-4">
            <span className="text-3xl font-bold text-md-on-surface">{plan.price}</span>
            <span className="text-md-on-surface-variant text-sm">{plan.period}</span>
          </div>
          <ul className="space-y-2 flex-1 mb-6">
            {plan.features.map((f) => (
              <li key={f} className="text-sm text-md-on-surface-variant flex items-start gap-2">
                <span className="text-md-primary mt-0.5">✓</span>
                {f}
              </li>
            ))}
          </ul>
          {plan.id === currentPlan ? (
            <button
              onClick={onManageBilling}
              className="w-full py-2.5 rounded-full text-sm font-medium bg-md-surface-variant text-md-on-surface-variant hover:shadow-sm transition-all"
            >
              {currentPlan === 'free' ? 'Current Plan' : 'Manage Billing'}
            </button>
          ) : (
            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={loading === plan.id}
              className={`w-full py-2.5 rounded-full text-sm font-medium transition-all ${
                plan.highlight
                  ? 'bg-md-primary hover:shadow-md text-md-on-primary'
                  : 'bg-md-secondary-container text-md-on-secondary-container hover:shadow-sm'
              } disabled:opacity-50`}
            >
              {loading === plan.id ? 'Loading...' : plan.cta}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
