import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children, roles, permission }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (permission) {
    const isSuperAdmin = user.email === 'rkdnmadu1993@gmail.com' || user.isSuperAdmin;
    if (!isSuperAdmin) {
      if (!user.permissions || user.permissions[permission] !== true) {
        // Redirect to a default dashboard if they don't have access
        return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
