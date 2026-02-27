import { useState } from 'react'
import { supabase } from '../lib/supabase'
import DarkModeButton from '../components/DarkModeButton'
import DarkModeCard from '../components/DarkModeCard'
import ThemeToggle from '../components/ThemeToggle'

export default function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        alert('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center themed-surface px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold themed-text mb-2">Dark Mode Test</h1>
          <p className="themed-text-secondary">Dark mode toggle</p>
          <div className="flex justify-center mt-4">
            <ThemeToggle />
          </div>
        </div>
        
        <DarkModeCard>
          <form onSubmit={handleAuth} className="space-y-4">
            <h2 className="text-2xl font-semibold themed-text text-center mb-6">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium themed-text mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 themed-surface themed-border border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 themed-text"
                placeholder="your@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium themed-text mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 themed-surface themed-border border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 themed-text"
                placeholder="••••••••"
              />
            </div>
            
            <DarkModeButton
              type="submit"
              loading={isLoading}
              className="w-full"
            >
              {isSignUp ? 'Create Account' : 'Sign In'}
            </DarkModeButton>
            
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-center themed-accent hover:underline text-sm"
            >
              {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </form>
        </DarkModeCard>
      </div>
    </div>
  )
}