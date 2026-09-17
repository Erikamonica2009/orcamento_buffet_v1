import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import * as authService from "../services/auth.service";
import type { AuthUser, Role } from "../services/auth.service";
import { setUnauthorizedHandler } from "../services/api";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  loginAdmin: (email: string, senha: string) => Promise<void>;
  loginCliente: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));

    authService
      .fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    return () => setUnauthorizedHandler(null);
  }, []);

  const loginAdmin = useCallback(async (email: string, senha: string) => {
    const admin = await authService.loginAdmin(email, senha);
    setUser({ ...admin, role: "admin" as Role });
  }, []);

  const loginCliente = useCallback(async (email: string, senha: string) => {
    const cliente = await authService.loginCliente(email, senha);
    setUser({ ...cliente, role: "cliente" as Role });
  }, []);

  const logout = useCallback(async () => {
    await authService.logout().catch(() => undefined);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginAdmin, loginCliente, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return ctx;
}
