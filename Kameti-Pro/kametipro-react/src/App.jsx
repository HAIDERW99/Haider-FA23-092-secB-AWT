import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar          from './components/Navbar';
import Footer          from './components/Footer';
import ProtectedRoute  from './components/ProtectedRoute';
import DisclaimerBanner from './components/DisclaimerBanner';
import Home            from './pages/Home';
import Login           from './pages/Login';
import Signup          from './pages/Signup';
import Dashboard       from './pages/Dashboard';
import CommitteeDetail from './pages/CommitteeDetail';
import Subscription    from './pages/Subscription';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/"              element={<Home />} />
        <Route path="/login"         element={<Login />} />
        <Route path="/signup"        element={<Signup />} />
        <Route path="/subscription"  element={<Subscription />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/committee/:id"
          element={
            <ProtectedRoute>
              <CommitteeDetail />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route
          path="*"
          element={
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
              <div style={{ fontSize: '4rem', marginBottom: 16 }}>🔍</div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Page nahi mili</h2>
              <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>
                Yeh page exist nahi karta.
              </p>
              <a href="/" className="btn btn-primary">Home par jao</a>
            </div>
          }
        />
      </Routes>
      <Footer />
      <DisclaimerBanner />
    </BrowserRouter>
  );
}
