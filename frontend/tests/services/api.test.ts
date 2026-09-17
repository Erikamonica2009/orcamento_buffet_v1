import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { api, ApiError, setUnauthorizedHandler } from "../../src/services/api";

describe("api client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends credentials and a JSON content-type, and returns the parsed body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await api.get<{ status: string }>("/health");

    expect(result).toEqual({ status: "ok" });
    const [, options] = fetchMock.mock.calls[0];
    expect(options.credentials).toBe("include");
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  it("returns undefined for a 204 response instead of parsing a body", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    const result = await api.post<void>("/auth/logout");

    expect(result).toBeUndefined();
  });

  it("throws ApiError with the backend's safe message on a 4xx/5xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "Credenciais inválidas" }), { status: 401 })
      )
    );

    await expect(api.post("/auth/admin/login", { email: "x", senha: "y" })).rejects.toMatchObject({
      status: 401,
      message: "Credenciais inválidas",
    });
  });

  it("carries Zod validation details when the backend includes them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ error: "Dados inválidos", detalhes: ["CPF deve conter 11 dígitos numéricos"] }),
          { status: 400 }
        )
      )
    );

    try {
      await api.post("/clientes", {});
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).detalhes).toEqual(["CPF deve conter 11 dígitos numéricos"]);
    }
  });

  it("invokes the registered unauthorized handler on any 401 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Sessão inválida ou expirada" }), {
        status: 401,
      }))
    );

    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    await expect(api.get("/orcamentos")).rejects.toBeInstanceOf(ApiError);
    expect(handler).toHaveBeenCalledOnce();

    setUnauthorizedHandler(null);
  });
});
