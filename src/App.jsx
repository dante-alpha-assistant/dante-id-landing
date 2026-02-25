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
import Refinery from './pages/Refinery'
import Foundry from './pages/Foundry'
import Builder from './pages/Builder'
import Inspector from './pages/Inspector'
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
          <Route path="/refinery/:project_id" element={<ProtectedRoute><Refinery /></ProtectedRoute>} />
          <Route path="/foundry/:project_id" element={<ProtectedRoute><Foundry /></ProtectedRoute>} />
          <Route path="/builder/:project_id" element={<ProtectedRoute><Builder /></ProtectedRoute>} />
          <Route path="/inspector/:project_id" element={<ProtectedRoute><Inspector /></ProtectedRoute>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/fleet/:agentId" element={<AgentProfile />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
