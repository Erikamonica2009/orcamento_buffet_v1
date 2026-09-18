import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { FormField } from "../components/FormField";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../services/api";
import type { Role } from "../services/auth.service";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  senha: z.string().min(1, "Informe a senha"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [role, setRole] = useState<Role>("cliente");
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user, loginAdmin, loginCliente } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === "admin" ? "/orcamentos" : "/meus-orcamentos", { replace: true });
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginForm) {
    if (submitting) return;
    setSubmitting(true);
    setApiError(null);
    try {
      if (role === "admin") {
        await loginAdmin(data.email, data.senha);
        navigate("/orcamentos");
      } else {
        await loginCliente(data.email, data.senha);
        navigate("/meus-orcamentos");
      }
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Não foi possível entrar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="auth-page">
        <img src="/img/logo.png" alt="Buffet Celebra" className="auth-logo" />
        <h1>Entrar</h1>
        <div className="role-toggle">
          <button
            type="button"
            className={role === "cliente" ? "btn" : "btn btn-secondary"}
            onClick={() => setRole("cliente")}
          >
            Sou cliente
          </button>
          <button
            type="button"
            className={role === "admin" ? "btn" : "btn btn-secondary"}
            onClick={() => setRole("admin")}
          >
            Sou administrador
          </button>
        </div>

        {apiError && <p className="toast-error">{apiError}</p>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <FormField
            label="E-mail"
            type="email"
            autoComplete="username"
            {...register("email")}
            error={errors.email?.message}
          />
          <FormField
            label="Senha"
            type="password"
            autoComplete="current-password"
            {...register("senha")}
            error={errors.senha?.message}
          />
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>

        <p>
          Ainda não tem conta? <a href="/cadastro">Cadastre-se</a>
        </p>
      </div>
    </main>
  );
}
