import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../utils/authUtils';

/**
 * Wraps any route that requires authentication.
 * If no JWT in localStorage → redirect to /login, preserving the intended URL.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
