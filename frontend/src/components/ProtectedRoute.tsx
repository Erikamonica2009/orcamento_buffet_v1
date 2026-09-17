import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../services/auth.service";

interface Props {
  role: Role;
  children: ReactNode;
}

export function ProtectedRoute({ role, children }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="loading">Carregando…</p>;
  }

  if (!user || user.role !== role) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
