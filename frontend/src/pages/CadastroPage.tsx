import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { FormField } from "../components/FormField";
import { maskCpf, maskTelefone, unmask } from "../utils/masks";
import { registerCliente } from "../services/clientes.service";
import { ApiError } from "../services/api";

const cadastroSchema = z.object({
  nome: z.string().min(1, "Informe o nome"),
  email: z.string().email("Informe um e-mail válido"),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
  telefone: z
    .string()
    .transform(unmask)
    .refine((v) => v.length >= 10 && v.length <= 11, "Informe um telefone válido"),
  cpf: z
    .string()
    .transform(unmask)
    .refine((v) => /^\d{11}$/.test(v), "CPF deve conter 11 dígitos"),
});

type CadastroForm = z.infer<typeof cadastroSchema>;

export function CadastroPage() {
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CadastroForm>({ resolver: zodResolver(cadastroSchema) });

  async function onSubmit(data: CadastroForm) {
    if (submitting) return;
    setSubmitting(true);
    setApiError(null);
    try {
      await registerCliente(data);
      navigate("/login");
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Não foi possível concluir o cadastro.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <h1>Criar conta</h1>
      {apiError && <p className="toast-error">{apiError}</p>}
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Nome" maxLength={120} {...register("nome")} error={errors.nome?.message} />
        <FormField
          label="E-mail"
          type="email"
          autoComplete="email"
          {...register("email")}
          error={errors.email?.message}
        />
        <FormField
          label="Senha"
          type="password"
          autoComplete="new-password"
          {...register("senha")}
          error={errors.senha?.message}
        />
        <Controller
          control={control}
          name="telefone"
          render={({ field }) => (
            <FormField
              label="Telefone"
              id="telefone"
              name="telefone"
              inputMode="numeric"
              placeholder="(11) 99999-0000"
              value={maskTelefone(field.value ?? "")}
              onChange={(e) => field.onChange(maskTelefone(e.target.value))}
              error={errors.telefone?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="cpf"
          render={({ field }) => (
            <FormField
              label="CPF"
              id="cpf"
              name="cpf"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={maskCpf(field.value ?? "")}
              onChange={(e) => field.onChange(maskCpf(e.target.value))}
              error={errors.cpf?.message}
            />
          )}
        />
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Enviando…" : "Cadastrar"}
        </button>
      </form>
      <p>
        Já tem conta? <a href="/login">Entrar</a>
      </p>
    </main>
  );
}
