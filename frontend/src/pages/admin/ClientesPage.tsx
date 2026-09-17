import { useEffect, useState } from "react";
import { Cliente, listClientes } from "../../services/clientes.service";
import { sanitizeText } from "../../utils/sanitize";

export function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    listClientes()
      .then(setClientes)
      .catch(() => setApiError("Não foi possível carregar os clientes."));
  }, []);

  return (
    <div>
      <h1>Clientes</h1>
      <p className="hint">Clientes se cadastram por conta própria pela tela de cadastro.</p>
      {apiError && <p className="toast-error">{apiError}</p>}
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th>Telefone</th>
            <th>CPF</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.id}>
              <td>{sanitizeText(cliente.nome)}</td>
              <td>{cliente.email}</td>
              <td>{cliente.telefone}</td>
              <td>{cliente.cpf}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
