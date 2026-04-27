import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/AuthContext'; // O donde tengas tu AuthProvider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './features/auth/Login';
import StudentsPage from './pages/Students';
import { DashboardLayout } from './components/Layout/DashboardLayout'; 

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/students" element={
              <DashboardLayout>
                <StudentsPage />
              </DashboardLayout>
            } />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;