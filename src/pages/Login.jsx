import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-md-background flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-bold text-md-primary">dante<span className="text-md-tertiary">.id</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-md-on-background mt-6">Welcome back</h1>
          <p className="text-md-on-surface-variant mt-2 text-sm">Sign in to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-md-surface-container rounded-md-lg p-8 space-y-5 shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md-sm px-4 py-3 text-red-600 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-md-on-surface-variant mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 h-14 bg-md-surface-variant rounded-t-lg rounded-b-none border-b-2 border-md-border text-md-on-background placeholder-md-on-surface-variant focus:outline-none focus:border-md-primary transition-colors duration-300 ease-md-standard"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-md-on-surface-variant mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 h-14 bg-md-surface-variant rounded-t-lg rounded-b-none border-b-2 border-md-border text-md-on-background placeholder-md-on-surface-variant focus:outline-none focus:border-md-primary transition-colors duration-300 ease-md-standard"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-md-primary text-md-on-primary py-2.5 font-medium active:scale-95 transition-all duration-300 ease-md-standard hover:shadow-md disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-center text-sm text-md-on-surface-variant">
            No account?{' '}
            <Link to="/signup" className="text-md-primary font-medium hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
