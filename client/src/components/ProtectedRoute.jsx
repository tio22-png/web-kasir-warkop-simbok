import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  if (!userStr || !token) {
    return <Navigate to="/login" replace />;
  }

  const user = JSON.parse(userStr);
  
  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/dashboard" replace />;
    } else if (user.role === 'kasir') {
      return <Navigate to="/dashboard-kasir" replace />;
    }
    // If role is not recognized, redirect to login
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
