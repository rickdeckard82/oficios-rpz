import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listDeployments } from "../api/deployments.js";
import Badge from "../components/Badge.jsx";
import Pagination from "../components/Pagination.jsx";
import { DEPLOYMENT_LABELS, DEPLOYMENT_STATUS_OPTIONS, DEPLOYMENT_TYPE_OPTIONS } from "../constants/deployments.js";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

function statusVariant(status) {
  if (status === "success") return "success";
  if (status === "error") return "error";
  return "running";
}

export default function LogPage() {
  const [statusInput, setStatusInput] = useState("");
  const [typeInput, setTypeInput] = useState("");
  const [filters, setFilters] = useState({ status: "", deploymentType: "", page: 1 });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["deployments-log", filters],
    queryFn: () =>
      listDeployments({ page: filters.page, status: filters.status, deploymentType: filters.deploymentType }),
    refetchInterval: (query) => {
      const items = query.state.data?.items || [];
      return items.some((item) => item.status === "running") ? 4000 : false;
    },
  });

  function applyFilters(event) {
    event.preventDefault();
    setFilters({ status: statusInput, deploymentType: typeInput, page: 1 });
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Log</h1>
          <p>Histórico de publicações no BIND e no roteador, com o resultado de cada tentativa.</p>
        </div>
      </div>

      <form className="filters" onSubmit={applyFilters}>
        <select value={typeInput} onChange={(event) => setTypeInput(event.target.value)}>
          {DEPLOYMENT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select value={statusInput} onChange={(event) => setStatusInput(event.target.value)}>
          {DEPLOYMENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="submit">Filtrar</button>
      </form>

      {isError && (
        <div className="messages">
          <div className="message error">{error.message}</div>
        </div>
      )}

      {isLoading ? (
        <div className="page-loading">Carregando…</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Status</th>
                <th>Domínios</th>
                <th>IPs</th>
                <th>Usuário</th>
                <th>Mensagem</th>
                <th>Quando</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={7} className="muted">
                    Nenhuma publicação encontrada.
                  </td>
                </tr>
              )}
              {data.items.map((deployment) => (
                <tr key={deployment.id}>
                  <td>{DEPLOYMENT_LABELS[deployment.deployment_type] || deployment.deployment_type}</td>
                  <td>
                    <Badge variant={statusVariant(deployment.status)}>{deployment.status}</Badge>
                  </td>
                  <td>{deployment.domain_count}</td>
                  <td>{deployment.ip_count}</td>
                  <td>{deployment.created_by_username || "—"}</td>
                  <td>{deployment.message || "—"}</td>
                  <td>{formatDate(deployment.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination
            page={data.page}
            pages={data.pages}
            onChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        </>
      )}
    </div>
  );
}
