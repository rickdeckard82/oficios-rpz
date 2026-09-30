import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDashboard } from "../api/dashboard.js";
import Badge from "../components/Badge.jsx";
import DonutChart from "../components/DonutChart.jsx";
import MonthlyBarChart from "../components/MonthlyBarChart.jsx";
import { DEPLOYMENT_LABELS } from "../constants/deployments.js";

function statusSlices(total, active, removable) {
  return [
    { key: "active", label: "Em prazo", value: Math.max(active - removable, 0), className: "is-active" },
    { key: "removable", label: "Removíveis", value: removable, className: "is-removable" },
    { key: "inactive", label: "Inativos", value: Math.max(total - active, 0), className: "is-inactive" },
  ];
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR");
}

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    refetchInterval: (query) => {
      const deployments = query.state.data?.recent_deployments || [];
      return deployments.some((d) => d.status === "running") ? 4000 : false;
    },
  });

  if (isLoading) {
    return <div className="page-loading">Carregando painel…</div>;
  }

  if (isError) {
    return <div className="messages"><div className="message error">{error.message}</div></div>;
  }

  return (
    <div>
      <div className="page-head">
        <h1>Painel</h1>
        <div className="actions">
          <Link className="button" to="/offices">
            Novo ofício
          </Link>
        </div>
      </div>

      <div className="stats">
        <article>
          <span>Domínios ativos</span>
          <strong>{data.active_domains}</strong>
        </article>
        <article>
          <span>Domínios (total)</span>
          <strong>{data.total_domains}</strong>
        </article>
        <article>
          <span>Domínios removíveis</span>
          <strong>{data.removable_domains}</strong>
        </article>
        <article>
          <span>IPs ativos</span>
          <strong>{data.active_ips}</strong>
        </article>
        <article>
          <span>IPs (total)</span>
          <strong>{data.total_ips}</strong>
        </article>
        <article>
          <span>IPs removíveis</span>
          <strong>{data.removable_ips}</strong>
        </article>
        <article>
          <span>IPv4</span>
          <strong>{data.ipv4_count}</strong>
        </article>
        <article>
          <span>IPv6</span>
          <strong>{data.ipv6_count}</strong>
        </article>
      </div>

      <div className="grid-two dashboard-grid">
        <div>
          <h2>Ofícios recentes</h2>
          <table>
            <thead>
              <tr>
                <th>Ofício</th>
                <th>Processo</th>
                <th>Domínios</th>
                <th>IPs</th>
                <th>Status</th>
                <th>Criado por</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_offices.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    Nenhum ofício cadastrado.
                  </td>
                </tr>
              )}
              {data.recent_offices.map((office) => (
                <tr key={office.id}>
                  <td>
                    <Link className="office-link" to={`/offices/${office.id}`}>
                      {office.office_number}
                    </Link>
                  </td>
                  <td>{office.process_number || "—"}</td>
                  <td>{office.total_found}</td>
                  <td>{office.ip_count}</td>
                  <td>
                    <Badge variant={office.has_expired_items ? "error" : "success"}>
                      {office.has_expired_items ? "expirado" : "em prazo"}
                    </Badge>
                  </td>
                  <td>{office.created_by_username || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2>Publicações recentes</h2>
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Status</th>
                <th>Quando</th>
              </tr>
            </thead>
            <tbody>
              {data.recent_deployments.length === 0 && (
                <tr>
                  <td colSpan={3} className="muted">
                    Nenhuma publicação registrada.
                  </td>
                </tr>
              )}
              {data.recent_deployments.map((deployment) => (
                <tr key={deployment.id}>
                  <td>{DEPLOYMENT_LABELS[deployment.deployment_type] || deployment.deployment_type}</td>
                  <td>
                    <Badge
                      variant={
                        deployment.status === "success"
                          ? "success"
                          : deployment.status === "error"
                          ? "error"
                          : "running"
                      }
                    >
                      {deployment.status}
                    </Badge>
                  </td>
                  <td>{formatDate(deployment.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="dashboard-charts">
            <DonutChart
              title="Domínios"
              slices={statusSlices(data.total_domains, data.active_domains, data.removable_domains)}
            />
            <DonutChart title="IPs" slices={statusSlices(data.total_ips, data.active_ips, data.removable_ips)} />
            {data.offices_by_month && (
              <MonthlyBarChart title="Ofícios por mês" items={data.offices_by_month} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
