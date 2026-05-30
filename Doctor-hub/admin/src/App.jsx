import React, { useContext, useEffect } from 'react'
import { DoctorContext } from './context/DoctorContext'
import { AdminContext } from './context/AdminContext'
import { StaffContext } from './context/StaffContext'
import { Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/Admin/Dashboard'
import AllAppointments from './pages/Admin/AllAppointments'
import AddDoctor from './pages/Admin/AddDoctor'
import DoctorsList from './pages/Admin/DoctorsList'
import Login from './pages/Login'
import DoctorAppointments from './pages/Doctor/DoctorAppointments'
import DoctorDashboard from './pages/Doctor/DoctorDashboard'
import DoctorProfile from './pages/Doctor/DoctorProfile'
import StaffDashboard from './pages/Staff/StaffDashboard'
import PaymentVerifications from './pages/Staff/PaymentVerifications'
import PatientRecords from './pages/Doctor/PatientRecords'
import MyAssistants from './pages/Doctor/MyAssistants'
import AssistantsList from './pages/Admin/AssistantsList'
import AddAssistant from './pages/Admin/AddAssistant'
import DoctorMessages from './pages/Doctor/DoctorMessages'
import VideoConsultation from './pages/Doctor/VideoConsultation'
import WhatsAppNotifications from './pages/Staff/WhatsAppNotifications'

const App = () => {
  const { dToken } = useContext(DoctorContext)
  const { aToken } = useContext(AdminContext)
  const { staffToken, staffRole } = useContext(StaffContext)
  const location = useLocation()

  if (location.pathname === '/') {
    if (aToken) return <Navigate to="/admin-dashboard" replace />
    if (staffToken && staffRole === 'doctor') return <Navigate to="/doctor-dashboard" replace />
    if (staffToken) return <Navigate to="/staff-dashboard" replace />
    if (dToken) return <Navigate to="/doctor-dashboard" replace />
  }

  if (staffToken && staffRole === 'doctor') {
    return (
      <>
        <ToastContainer />
        <DashboardLayout>
          <Routes>
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor-appointments" element={<DoctorAppointments />} />
            <Route path="/doctor-profile" element={<DoctorProfile />} />
            <Route path="/patient-records" element={<PatientRecords />} />
            <Route path="/my-assistants" element={<MyAssistants />} />
            <Route path="/messages" element={<DoctorMessages />} />
            <Route path="/video/:appointmentId" element={<VideoConsultation />} />
            <Route path="*" element={<Navigate to="/doctor-dashboard" />} />
          </Routes>
        </DashboardLayout>
      </>
    )
  }

  if (staffToken && ['admin', 'super_admin'].includes(staffRole)) {
    return (
      <>
        <ToastContainer />
        <DashboardLayout>
          <Routes>
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
            <Route path="/payment-verifications" element={<PaymentVerifications />} />
            <Route path="/assistants" element={<AssistantsList />} />
            <Route path="/add-assistant" element={<AddAssistant />} />
            <Route path="/whatsapp" element={<WhatsAppNotifications />} />
            <Route path="*" element={<Navigate to="/staff-dashboard" />} />
          </Routes>
        </DashboardLayout>
      </>
    )
  }

  if (staffToken && staffRole === 'assistant') {
    return (
      <>
        <ToastContainer />
        <DashboardLayout>
          <Routes>
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
            <Route path="/payment-verifications" element={<PaymentVerifications />} />
            <Route path="/whatsapp" element={<WhatsAppNotifications />} />
            <Route path="*" element={<Navigate to="/staff-dashboard" />} />
          </Routes>
        </DashboardLayout>
      </>
    )
  }

  // Admin layout and routes
  if (aToken) {
    return (
      <>
        <ToastContainer />
        <DashboardLayout>
          <Routes>
            <Route path="/admin-dashboard" element={<Dashboard />} />
            <Route path="/all-appointments" element={<AllAppointments />} />
            <Route path="/add-doctor" element={<AddDoctor />} />
            <Route path="/doctor-list" element={<DoctorsList />} />
            <Route path="*" element={<Navigate to="/admin-dashboard" />} />
          </Routes>
        </DashboardLayout>
      </>
    )
  }

  if (dToken) {
    return (
      <>
        <ToastContainer />
        <DashboardLayout>
          <Routes>
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor-appointments" element={<DoctorAppointments />} />
            <Route path="/doctor-profile" element={<DoctorProfile />} />
            <Route path="/my-assistants" element={<MyAssistants />} />
            <Route path="/messages" element={<DoctorMessages />} />
            <Route path="/video/:appointmentId" element={<VideoConsultation />} />
            <Route path="*" element={<Navigate to="/doctor-dashboard" />} />
          </Routes>
        </DashboardLayout>
      </>
    )
  }

  // No one is logged in
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  )
}

export default App
