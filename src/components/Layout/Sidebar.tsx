import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/AuthContext";

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const { logout } = useAuth();

  // Modo oscuro con persistencia
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );

  // Estado de colapso del sidebar
  const [collapsed, setCollapsed] = useState(false);

  // Aplicar modo oscuro al cargar
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const linkClasses = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all
     ${
       location.pathname === path
         ? "bg-indigo-600 text-white shadow-md"
         : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
     }
     ${collapsed ? "justify-center" : ""}`;

  return (
    <aside
      className={`h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800
      transition-all duration-300 flex flex-col
      ${collapsed ? "w-20" : "w-64"}`}
    >
      <div
        className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800`}
      >
        {!collapsed && (
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Appweb
          </h1>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        {!collapsed ? (
          <>
            <div className="mb-6">
              <h2 className="font-semibold text-lg">
                Bienvenido, {user ? `${user.first_name} ${user.last_name}` : "Cargando..."}
              </h2>
              <p className="text-sm text-gray-500">
                {user?.school?.fullname ?? "Sin escuela"}
              </p>
            </div>
          </>
        ) : (
          <div className="flex justify-center">
            <Users size={26} className="text-gray-600 dark:text-gray-300" />
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 mt-4">
        <Link to="/dashboard" className={linkClasses("/dashboard")}>
          <LayoutDashboard size={22} />
          {!collapsed && <span>Dashboard</span>}
        </Link>

        <Link to="/students" className={linkClasses("/students")}>
          <Users size={22} />
          {!collapsed && <span>Estudiantes</span>}
        </Link>

      </nav>

      <div className="p-4 flex flex-col gap-3 border-t border-gray-300 dark:border-gray-700">
        <button
          onClick={logout}
          className={`
            w-full flex items-center justify-center gap-3 text-red-600 dark:text-red-500
            hover:bg-gray-200 dark:hover:bg-gray-800
            transition px-3 py-2 rounded-md font-medium
            ${collapsed ? "justify-center" : ""}
          `}
        >
          <LogOut size={20} />
          {!collapsed && <span>Salir</span>}
        </button>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center justify-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800"
        >
          {darkMode ? <Sun size={22} /> : <Moon size={22} />}
          {!collapsed && <span>{darkMode ? "Modo Claro" : "Modo Oscuro"}</span>}
        </button>
      </div>
    </aside>
  );
}