import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { CadastroPage } from "../../src/pages/CadastroPage";
import * as clientesService from "../../src/services/clientes.service";

vi.mock("../../src/services/clientes.service");

describe("CadastroPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a validation error for an incomplete CPF and never calls the API", async () => {
    render(
      <MemoryRouter>
        <CadastroPage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText("CPF"), "123");
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("CPF deve conter 11 dígitos")).toBeInTheDocument();
    expect(clientesService.registerCliente).not.toHaveBeenCalled();
  });

  it("shows a validation error for a CPF with an invalid check digit and never calls the API", async () => {
    render(
      <MemoryRouter>
        <CadastroPage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText("CPF"), "12345678901");
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("CPF inválido")).toBeInTheDocument();
    expect(clientesService.registerCliente).not.toHaveBeenCalled();
  });

  it("submits unmasked cpf and telefone once the form is valid", async () => {
    vi.mocked(clientesService.registerCliente).mockResolvedValue({
      id: 1,
      nome: "Maria",
      email: "maria@buffet.com",
      telefone: "11999990000",
      cpf: "12345678909",
      createdAt: new Date().toISOString(),
    });

    render(
      <MemoryRouter>
        <CadastroPage />
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText("Nome"), "Maria");
    await userEvent.type(screen.getByLabelText("E-mail"), "maria@buffet.com");
    await userEvent.type(screen.getByLabelText("Senha"), "senha123");
    await userEvent.type(screen.getByLabelText("Telefone"), "11999990000");
    await userEvent.type(screen.getByLabelText("CPF"), "12345678909");
    await userEvent.click(screen.getByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() =>
      expect(clientesService.registerCliente).toHaveBeenCalledWith(
        expect.objectContaining({ cpf: "12345678909", telefone: "11999990000" })
      )
    );
  });
});
