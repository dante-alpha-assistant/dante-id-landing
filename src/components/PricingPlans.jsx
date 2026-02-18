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
          className={`rounded-2xl border p-6 flex flex-col ${
            plan.highlight
              ? 'border-blue-500 bg-blue-950/20 shadow-lg shadow-blue-500/10'
              : 'border-[#333] bg-[#111]'
          }`}
        >
          {plan.highlight && (
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Most Popular</span>
          )}
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          <div className="mt-2 mb-4">
            <span className="text-3xl font-bold text-white">{plan.price}</span>
            <span className="text-gray-400 text-sm">{plan.period}</span>
          </div>
          <ul className="space-y-2 flex-1 mb-6">
            {plan.features.map((f) => (
              <li key={f} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                {f}
              </li>
            ))}
          </ul>
          {plan.id === currentPlan ? (
            <button
              onClick={onManageBilling}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-[#222] text-gray-400 border border-[#333] hover:bg-[#333] transition-colors"
            >
              {currentPlan === 'free' ? 'Current Plan' : 'Manage Billing'}
            </button>
          ) : (
            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={loading === plan.id}
              className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                plan.highlight
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
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
