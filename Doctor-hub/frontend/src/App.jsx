import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Doctors from './pages/Doctors'
import Login from './pages/Login'
import About from './pages/About'
import Contact from './pages/Contact'
import MyProfile from './pages/MyProfile'
import MyAppointment from './pages/MyAppointment'
import MyHistory from './pages/MyHistory'
import PatientDashboard from './pages/PatientDashboard'
import Messages from './pages/Messages'
import SymptomChecker from './pages/SymptomChecker'
import VideoConsultation from './pages/VideoConsultation'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentUpload from './pages/PaymentUpload'
import Appointment from './Appointment'
import PatientLayout from './components/layout/PatientLayout'
import UiPreview from './pages/UiPreview'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  return (
    <>
      <ToastContainer />
      <PatientLayout>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/doctors' element={<Doctors />} />
          <Route path='/symptom-checker' element={<SymptomChecker />} />
          <Route path='/login' element={<Login />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/dashboard' element={<PatientDashboard />} />
          <Route path='/my-profile' element={<MyProfile />} />
          <Route path='/my-appointments' element={<MyAppointment />} />
          <Route path='/my-history' element={<MyHistory />} />
          <Route path='/messages' element={<Messages />} />
          <Route path='/payment/:appointmentId' element={<PaymentUpload />} />
          <Route path='/video/:appointmentId' element={<VideoConsultation />} />
          <Route path='/payment-success' element={<PaymentSuccess />} />
          <Route path='/appointment/:docId' element={<Appointment />} />
          <Route path='/ui-preview' element={<UiPreview />} />
        </Routes>
      </PatientLayout>
    </>
  )
}

export default App
