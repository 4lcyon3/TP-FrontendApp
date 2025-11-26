import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import axiosClient, { tokenStorage } from "../api/axiosClient";
import { login as loginApi, getMe } from "../api/auth";
import type { Teacher } from "../types/api";

type AuthContextType = {
  user: Teacher | null;
  loading: boolean;
  error: string | null;
  setUser: (u: Teacher | null) => void;
  login: (username: string, password: string, school: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Teacher | null>(() => {
    try {
      const raw = localStorage.getItem("user");
      return raw ? (JSON.parse(raw) as Teacher) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  // ---------------------------------------------------
  // INITIALIZE (solo si existe token)
  // ---------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      const tokens = tokenStorage.get();

      if (!tokens) {
        if (mounted) setLoading(false);
        return;
      }

      axiosClient.defaults.headers.common["Authorization"] =
        `Bearer ${tokens.access}`;

      try {
        const profile = await getMe();
        if (mounted) {
          setUser(profile);
          localStorage.setItem("user", JSON.stringify(profile));
        }
      } catch {
        // Token inválido o perfil no existe
        tokenStorage.set(null);
        delete axiosClient.defaults.headers.common["Authorization"];
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (
    username: string,
    password: string,
    school: string
  ): Promise<boolean> => {
    setError(null);
    setLoading(true);

    try {
      const tokens = await loginApi(username, password, school);

      if (!tokens?.access) {
        throw new Error("No se recibieron tokens");
      }

      // guardar tokens
      tokenStorage.set(tokens);
      axiosClient.defaults.headers.common["Authorization"] =
        `Bearer ${tokens.access}`;

      // obtener perfil
      const profile = await getMe();
      if (!profile) throw new Error("No se pudo cargar el perfil");

      setUser(profile);
      localStorage.setItem("user", JSON.stringify(profile));

      navigate("/dashboard", { replace: true });
      return true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Login error:", err);

      setError("Credenciales incorrectas o colegio inválido.");
      return false;

    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------
  const logout = () => {
    tokenStorage.set(null);
    delete axiosClient.defaults.headers.common["Authorization"];
    setUser(null);
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    setUser,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* eslint-disable react-refresh/only-export-components */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};