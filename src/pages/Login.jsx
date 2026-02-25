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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 font-mono">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-3xl font-bold text-[#33ff00]" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>dante<span className="text-[#ffb000]">.id</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-[#33ff00] mt-6" style={{ textShadow: '0 0 5px rgba(51, 255, 0, 0.5)' }}>{'>'} LOGIN</h1>
          <p className="text-[#1a6b1a] mt-2 text-sm">Authenticate to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-[#0f0f0f] border border-[#1f521f] p-8 space-y-5">
          {error && (
            <div className="bg-[#0a0a0a] border border-red-500/30 px-4 py-3 text-red-400 text-sm font-mono">
              [ERROR] {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-[#1a6b1a] mb-1.5">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#1f521f] text-[#33ff00] placeholder-[#1a6b1a] focus:outline-none focus:border-[#33ff00] transition-colors font-mono caret-[#33ff00]"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-sm text-[#1a6b1a] mb-1.5">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#1f521f] text-[#33ff00] placeholder-[#1a6b1a] focus:outline-none focus:border-[#33ff00] transition-colors font-mono caret-[#33ff00]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-transparent border border-[#33ff00] text-[#33ff00] font-mono font-medium hover:bg-[#33ff00] hover:text-[#0a0a0a] transition-colors disabled:opacity-50 uppercase"
          >
            {loading ? '[AUTHENTICATING...]' : '[ LOGIN > ]'}
          </button>
          <p className="text-center text-sm text-[#1a6b1a]">
            No account?{' '}
            <Link to="/signup" className="text-[#33ff00] hover:underline">[ REGISTER ]</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
