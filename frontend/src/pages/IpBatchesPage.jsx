import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listIpAddresses, refreshWhois, toggleIpAddress } from "../api/ipAddresses.js";
import Filters from "../components/Filters.jsx";
import Pagination from "../components/Pagination.jsx";
import Badge from "../components/Badge.jsx";
import WhoisCell from "../components/WhoisCell.jsx";
import DownloadButton from "../components/DownloadButton.jsx";
import { useToast } from "../components/Toast.jsx";

function statusToActive(status) {
  if (status === "active") return true;
  if (status === "inactive") return false;
  return undefined;
}

export default function IpBatchesPage() {
  const [qInput, setQInput] = useState("");
  const [statusInput, setStatusInput] = useState("active");
  const [filters, setFilters] = useState({ q: "", status: "active", page: 1 });
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["ip-addresses", filters],
    queryFn: () =>
      listIpAddresses({ page: filters.page, q: filters.q, active: statusToActive(filters.status) }),
    refetchInterval: (query) => {
      const items = query.state.data?.items || [];
      const hasPending = items.some(
        (item) => item.whois_job && ["pending", "running"].includes(item.whois_job.status)
      );
      return hasPending ? 4000 : false;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleIpAddress,
    onSuccess: (address) => {
      notify(`IP ${address.active ? "ativado" : "desativado"}: ${address.address}`, "success");
      queryClient.invalidateQueries({ queryKey: ["ip-addresses"] });
    },
    onError: (err) => notify(err.message, "error"),
  });

  const whoisMutation = useMutation({
    mutationFn: () => refreshWhois({ q: filters.q, active: statusToActive(filters.status) }),
    onSuccess: (result) => {
      notify(`${result.queued} IPs colocados na fila de WHOIS (${result.skipped} já em processamento).`, "success");
      queryClient.invalidateQueries({ queryKey: ["ip-addresses"] });
    },
    onError: (err) => notify(err.message, "error"),
  });

  function applyFilters() {
    setFilters({ q: qInput, status: statusInput, page: 1 });
  }

  return (
    <div>
      <div className="page-head">
        <h1>IPs</h1>
        <div className="actions">
          <DownloadButton path="/ip-addresses/config.txt" filename="edge-router-discard-routes.txt">
            Baixar config geral
          </DownloadButton>
        </div>
      </div>

      <Filters
        q={qInput}
        status={statusInput}
        onQChange={setQInput}
        onStatusChange={setStatusInput}
        onSubmit={applyFilters}
      >
        <button
          type="button"
          className="ghost"
          disabled={whoisMutation.isPending}
          onClick={() => whoisMutation.mutate()}
        >
          Enfileirar WHOIS
        </button>
      </Filters>

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
                <th>IP</th>
                <th>Versão</th>
                <th>Lotes</th>
                <th>ASN / Dono</th>
                <th>Status</th>
                <th className="right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {data.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="muted">
                    Nenhum IP encontrado.
                  </td>
                </tr>
              )}
              {data.items.map((address) => (
                <tr key={address.id}>
                  <td>{address.address}</td>
                  <td>IPv{address.version}</td>
                  <td>
                    {address.batches.length === 0
                      ? "—"
                      : address.batches.map((batch) => batch.name).join(", ")}
                  </td>
                  <td>
                    <WhoisCell whois={address.whois} whoisJob={address.whois_job} />
                  </td>
                  <td>
                    <Badge variant={address.active ? "success" : "error"}>
                      {address.active ? "ativo" : "inativo"}
                    </Badge>
                    {address.whitelisted && <Badge variant="warning">whitelist</Badge>}
                  </td>
                  <td className="right">
                    <button
                      type="button"
                      className="ghost compact"
                      disabled={toggleMutation.isPending}
                      onClick={() => toggleMutation.mutate(address.id)}
                    >
                      {address.active ? "Desativar" : "Ativar"}
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
