import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import ProjectList from './pages/ProjectList'
import Editor from './pages/Editor'
import Fleet from './pages/Fleet'
import AgentProfile from './pages/AgentProfile'
import Refinery from './pages/Refinery'
import Foundry from './pages/Foundry'
import Planner from './pages/Planner'
import Builder from './pages/Builder'
import Inspector from './pages/Inspector'
import Deployer from './pages/Deployer'
import Pricing from './pages/Pricing'
import AdminDashboard from './pages/AdminDashboard'
import Validator from './pages/Validator'
import Iterate from './pages/Iterate'
import Usage from './pages/Usage'
import QADashboard from './pages/QADashboard'
import Docs from './pages/Docs'
import RepoSelector from './components/RepoSelector'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><ProjectList /></ProtectedRoute>} />
          <Route path="/dashboard/:project_id" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/editor/:project_id" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
          <Route path="/refinery/:project_id" element={<ProtectedRoute><Refinery /></ProtectedRoute>} />
          <Route path="/foundry/:project_id" element={<ProtectedRoute><Foundry /></ProtectedRoute>} />
          <Route path="/planner/:project_id" element={<ProtectedRoute><Planner /></ProtectedRoute>} />
          <Route path="/builder/:project_id" element={<ProtectedRoute><Builder /></ProtectedRoute>} />
          <Route path="/inspector/:project_id" element={<ProtectedRoute><Inspector /></ProtectedRoute>} />
          <Route path="/deployer/:project_id" element={<ProtectedRoute><Deployer /></ProtectedRoute>} />
          <Route path="/validator/:project_id" element={<ProtectedRoute><Validator /></ProtectedRoute>} />
          <Route path="/iterate/:project_id" element={<ProtectedRoute><Iterate /></ProtectedRoute>} />
          <Route path="/usage/:project_id" element={<ProtectedRoute><Usage /></ProtectedRoute>} />
          <Route path="/qa/dashboard" element={<ProtectedRoute><QADashboard /></ProtectedRoute>} />
          <Route path="/qa/:project_id" element={<ProtectedRoute><QADashboard /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/docs" element={<Docs />} />
<Route path="/github/repos" element={<ProtectedRoute><RepoSelector /></ProtectedRoute>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/fleet/:agentId" element={<AgentProfile />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
