import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listDomains, toggleDomain } from "../api/domains.js";
import Filters from "../components/Filters.jsx";
import Pagination from "../components/Pagination.jsx";
import Badge from "../components/Badge.jsx";
import DownloadButton from "../components/DownloadButton.jsx";
import { useToast } from "../components/Toast.jsx";

function statusToActive(status) {
  if (status === "active") return true;
  if (status === "inactive") return false;
  return undefined;
}

export default function DomainsPage() {
  const [qInput, setQInput] = useState("");
  const [statusInput, setStatusInput] = useState("active");
  const [filters, setFilters] = useState({ q: "", status: "active", page: 1 });
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["domains", filters],
    queryFn: () =>
      listDomains({ page: filters.page, q: filters.q, active: statusToActive(filters.status) }),
  });

  const toggleMutation = useMutation({
    mutationFn: toggleDomain,
    onSuccess: (domain) => {
      notify(`Domínio ${domain.active ? "ativado" : "desativado"}: ${domain.name}`, "success");
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    },
    onError: (err) => notify(err.message, "error"),
  });

  function applyFilters() {
    setFilters({ q: qInput, status: statusInput, page: 1 });
  }

  return (
    <div>
      <div className="page-head">
        <h1>Domínios</h1>
        <div className="actions">
          <DownloadButton path="/rpz/db.rpz.zone" filename="db.rpz.zone">
            Baixar RPZ geral
          </DownloadButton>
        </div>
      </div>

      <Filters
        q={qInput}
        status={statusInput}
        onQChange={setQInput}
        onStatusChange={setStatusInput}
        onSubmit={applyFilters}
      />

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
                <th>Domínio</th>
                <th>Ofícios de origem</th>
                <th>Redirecionamento</th>
                <th>Status</th>
                <th className="right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    Nenhum domínio encontrado.
                  </td>
                </tr>
              )}
              {data.items.map((domain) => (
                <tr key={domain.id}>
                  <td>{domain.name}</td>
                  <td>
                    {domain.offices.length === 0
                      ? "—"
                      : domain.offices.map((office) => office.number).join(", ")}
                  </td>
                  <td>
                    {domain.redirect_target ? (
                      <Badge variant="warning">→ {domain.redirect_target}</Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <Badge variant={domain.active ? "success" : "error"}>
                      {domain.active ? "ativo" : "inativo"}
                    </Badge>
                    {domain.whitelisted && <Badge variant="warning">whitelist</Badge>}
                  </td>
                  <td className="right">
                    <button
                      type="button"
                      className="ghost compact"
                      disabled={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate(domain.id)}
                    >
                      {domain.active ? "Desativar" : "Ativar"}
                    </button>
                  </td>
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
