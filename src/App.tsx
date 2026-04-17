import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthContext'; // O donde tengas tu AuthProvider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './features/auth/Login';
import StudentsPage from './pages/Students';
import { DashboardLayout } from './components/Layout/DashboardLayout'; 

const queryClient = new QueryClient();

function App() {
  return (
    // 1. El BrowserRouter debe ser el padre más externo de todo lo que use routing
    <BrowserRouter>
      {/* 2. El AuthProvider debe estar dentro del BrowserRouter para usar useNavigate */}
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Routes>
            {/* Ruta Pública: Login */}
            <Route path="/login" element={<Login />} />

            <Route path="/students" element={
              <DashboardLayout>
                <StudentsPage />
              </DashboardLayout>
            } />

            {/* Ruta comodín para errores 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;