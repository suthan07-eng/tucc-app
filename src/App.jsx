import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './components/Home'
import Register from './components/Register'
import Availability from './components/Availability'
import Success from './components/Success'
import League from './components/League'
import Stats from './components/Stats'
import ResultsPage from './components/ResultsPage'
import FixturesPage from './components/FixturesPage'
import AdminLogin from './components/admin/AdminLogin'
import AdminDashboard from './components/admin/AdminDashboard'

function ProtectedRoute({ children }) {
  const isAdmin = sessionStorage.getItem('tucc_admin')
  return isAdmin ? children : <Navigate to="/admin/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/availability" element={<Availability />} />
      <Route path="/success" element={<Success />} />
      <Route path="/league" element={<League />} />
      <Route path="/stats" element={<Stats />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/fixtures" element={<FixturesPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
