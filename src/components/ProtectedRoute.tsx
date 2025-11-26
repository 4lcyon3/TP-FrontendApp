import { Navigate} from 'react-router-dom';
import { useAuth } from '../hooks/AuthContext';
import type { JSX } from 'react';

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();
    if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-gray-700 dark:text-gray-300">
        Cargando...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}