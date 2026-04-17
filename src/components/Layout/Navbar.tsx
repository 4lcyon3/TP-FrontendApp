import React from 'react';
import { useAuth } from "@/hooks/AuthContext";
import { LogOut, School, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md border-b border-indigo-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 text-white p-2 rounded-lg">
              <School size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-indigo-900">LecturaActiva</h1>
              <p className="text-xs text-slate-500 font-medium">Gestión de Comprensión Lectora</p>
            </div>
          </div>

          {/* Info Usuario */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User size={16} />
                {user ? `${user.first_name} ${user.last_name}` : "Cargando..."}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <School size={12} />
                {user?.school?.fullname ?? "Sin escuela"}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};