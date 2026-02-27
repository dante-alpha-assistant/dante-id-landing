import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSignUp = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-md-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Check your email</h2>
            <p className="text-gray-600 mb-6">We've sent you a confirmation link to complete your registration.</p>
            <Link to="/" className="text-md-primary hover:text-md-primary/90 font-medium">
              Return to home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-md-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center space-x-2 text-3xl font-bold text-gray-900 mb-2">
            <div className="w-10 h-10 bg-md-primary rounded-md flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <span>Navigation Bar</span>
          </Link>
          <p className="text-gray-600">Create your account</p>
        </div>
        
        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-lg" onSubmit={handleSignUp}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-md-primary focus:border-md-primary"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-md-primary focus:border-md-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-pill shadow-sm text-sm font-medium text-white bg-md-primary hover:bg-md-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-md-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-md-primary hover:text-md-primary/90">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}