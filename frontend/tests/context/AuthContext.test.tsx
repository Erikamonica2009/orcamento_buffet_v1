import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../../src/context/AuthContext";

function Probe() {
  const { user, loading, loginAdmin, logout } = useAuth();
  if (loading) return <p>carregando</p>;
  return (
    <div>
      <p>{user ? `logado:${user.nome}:${user.role}` : "deslogado"}</p>
      <button onClick={() => loginAdmin("admin@buffet.com", "Admin@123")}>entrar</button>
      <button onClick={() => logout()}>sair</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts deslogado when GET /auth/me returns 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401 }))
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("deslogado")).toBeInTheDocument());
  });

  it("logs in and exposes the user with its role", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401 }))
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 1, nome: "Administrador", email: "admin@buffet.com" }), {
            status: 200,
          })
        )
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("deslogado")).toBeInTheDocument());
    await userEvent.click(screen.getByText("entrar"));

    await waitFor(() => expect(screen.getByText("logado:Administrador:admin")).toBeInTheDocument());
  });

  it("clears the user on logout", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ id: 2, nome: "Cliente Teste", email: "c@buffet.com", role: "cliente" }), {
            status: 200,
          })
        )
        .mockResolvedValueOnce(new Response(null, { status: 204 }))
    );

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByText("logado:Cliente Teste:cliente")).toBeInTheDocument());
    await userEvent.click(screen.getByText("sair"));

    await waitFor(() => expect(screen.getByText("deslogado")).toBeInTheDocument());
  });
});
