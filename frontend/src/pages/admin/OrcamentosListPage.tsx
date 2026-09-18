import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Orcamento,
  OrcamentoStatus,
  STATUS_LABELS,
  listOrcamentos,
} from "../../services/orcamentos.service";
import { formatDataEvento } from "../../utils/date";

const STATUS_OPTIONS: OrcamentoStatus[] = ["PENDENTE", "EM_ANALISE", "APROVADO", "RECUSADO"];

export function OrcamentosListPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [status, setStatus] = useState<OrcamentoStatus | "">("");
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    listOrcamentos(status || undefined)
      .then(setOrcamentos)
      .catch(() => setApiError("Não foi possível carregar os orçamentos."));
  }, [status]);

  return (
    <div>
      <h1>Orçamentos</h1>
      {apiError && <p className="toast-error">{apiError}</p>}

      <div className="form-field">
        <label htmlFor="status-filter">Filtrar por status</label>
        <select
          id="status-filter"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrcamentoStatus | "")}
        >
          <option value="">Todos</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {STATUS_LABELS[option]}
            </option>
          ))}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Evento</th>
            <th>Data</th>
            <th>Status</th>
            <th>Valor</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orcamentos.map((orcamento) => (
            <tr key={orcamento.id}>
              <td>{orcamento.cliente.nome}</td>
              <td>{orcamento.tipoEvento.nome}</td>
              <td>{formatDataEvento(orcamento.dataEvento)}</td>
              <td>{STATUS_LABELS[orcamento.status]}</td>
              <td>{orcamento.valorTotal ? `R$ ${orcamento.valorTotal}` : "—"}</td>
              <td>
                <Link to={`/orcamentos/${orcamento.id}`}>Ver detalhes</Link>
              </td>
            </tr>
          ))}
          {orcamentos.length === 0 && (
            <tr>
              <td colSpan={6}>Nenhum orçamento encontrado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
