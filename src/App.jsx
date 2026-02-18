import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import Fleet from './pages/Fleet'
import AgentProfile from './pages/AgentProfile'
import Pricing from './pages/Pricing'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/editor/:project_id" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/fleet/:agentId" element={<AgentProfile />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
