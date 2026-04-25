import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import DoctorDashboardPage from './pages/DoctorDashboardPage'
import LandingPage from './pages/LandingPage'
import PatientDashboardPage from './pages/PatientDashboardPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/doctor"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/patient"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
