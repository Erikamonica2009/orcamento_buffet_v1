import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../../src/components/ProtectedRoute";
import { AuthProvider } from "../../src/context/AuthContext";

function renderProtected(meResponse: Response, role: "admin" | "cliente") {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(meResponse));

  return render(
    <MemoryRouter initialEntries={["/protegido"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<p>tela de login</p>} />
          <Route
            path="/protegido"
            element={
              <ProtectedRoute role={role}>
                <p>conteúdo protegido</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it("redirects to /login when there is no session", async () => {
    renderProtected(new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401 }), "admin");
    await waitFor(() => expect(screen.getByText("tela de login")).toBeInTheDocument());
  });

  it("redirects to /login when the role does not match", async () => {
    renderProtected(
      new Response(JSON.stringify({ id: 1, nome: "Cliente", email: "c@buffet.com", role: "cliente" }), {
        status: 200,
      }),
      "admin"
    );
    await waitFor(() => expect(screen.getByText("tela de login")).toBeInTheDocument());
  });

  it("renders the protected content when authenticated with the right role", async () => {
    renderProtected(
      new Response(JSON.stringify({ id: 1, nome: "Admin", email: "a@buffet.com", role: "admin" }), {
        status: 200,
      }),
      "admin"
    );
    await waitFor(() => expect(screen.getByText("conteúdo protegido")).toBeInTheDocument());
  });
});
