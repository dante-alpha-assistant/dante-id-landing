import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import PricingPlans from '../components/PricingPlans'

export default function Pricing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    if (!user) return
    loadSubscription()
  }, [user])

  const loadSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/subscription', {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      if (res.ok) setSubscription(await res.json())
    } catch (err) {
      console.error('Failed to load subscription:', err)
    }
  }

  const handleManageBilling = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      console.error('Billing portal error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-md-background text-md-on-background">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-md-on-background">Simple, transparent pricing</h1>
          <p className="text-md-on-surface-variant text-lg">Launch your startup with AI. Upgrade when you're ready to scale.</p>
        </div>

        <PricingPlans
          currentPlan={subscription?.plan || 'free'}
          onManageBilling={handleManageBilling}
        />

        {!user && (
          <p className="text-center text-md-on-surface-variant mt-8 text-sm">
            <button onClick={() => navigate('/signup')} className="text-md-primary hover:underline">
              Sign up free
            </button>{' '}
            to get started
          </p>
        )}
      </div>
    </div>
  )
}
