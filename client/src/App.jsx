import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Dashboard_kasir from './pages/Dashboard_kasir'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard-kasir" 
          element={
            <ProtectedRoute allowedRoles={['kasir']}>
              <Dashboard_kasir />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App
