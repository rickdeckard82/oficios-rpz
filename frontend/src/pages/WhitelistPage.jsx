import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createWhitelistDomain,
  createWhitelistIp,
  deleteWhitelistDomain,
  deleteWhitelistIp,
  listWhitelistDomains,
  listWhitelistIps,
} from "../api/whitelist.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { useToast } from "../components/Toast.jsx";

function WhitelistSection({
  title,
  valueLabel,
  valuePlaceholder,
  queryKey,
  listFn,
  createFn,
  deleteFn,
  formatCreated,
}) {
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");
  const [entryToDelete, setEntryToDelete] = useState(null);
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data, isLoading, isError, error } = useQuery({ queryKey, queryFn: listFn });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createMutation = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      notify(`${title}: entrada adicionada à whitelist.`, "success");
      setValue("");
      setReason("");
      invalidate();
    },
    onError: (err) => setFormError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      notify(`${title}: entrada removida da whitelist.`, "success");
      setEntryToDelete(null);
      invalidate();
    },
    onError: (err) => {
      notify(err.message, "error");
      setEntryToDelete(null);
    },
  });

  function handleCreate(event) {
    event.preventDefault();
    setFormError("");
    if (!value.trim()) {
      setFormError(`Informe ${valueLabel.toLowerCase()}.`);
      return;
    }
    createMutation.mutate({ value: value.trim(), reason: reason.trim() });
  }

  return (
    <section className="upload-panel office-create-form">
      <h2>{title}</h2>

      <form onSubmit={handleCreate}>
        {formError && (
          <div className="messages">
            <div className="message error">{formError}</div>
          </div>
        )}
        <div className="form-grid">
          <label>
            {valueLabel}
            <input
              autoComplete="off"
              placeholder={valuePlaceholder}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              required
            />
          </label>
          <label>
            Motivo (opcional)
            <input
              autoComplete="off"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </label>
        </div>
        <button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Adicionando…" : "Adicionar à whitelist"}
        </button>
      </form>

      {isError && (
        <div className="messages">
          <div className="message error">{error.message}</div>
        </div>
      )}

      {isLoading ? (
        <div className="page-loading">Carregando…</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>{valueLabel}</th>
              <th>Motivo</th>
              <th>Adicionado em</th>
              <th className="right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Nenhuma entrada cadastrada.
                </td>
              </tr>
            )}
            {data.items.map((entry) => (
              <tr key={entry.id}>
                <td>{formatCreated ? formatCreated(entry) : entry.name || entry.address}</td>
                <td>{entry.reason || "—"}</td>
                <td>{new Date(entry.created_at).toLocaleString("pt-BR")}</td>
                <td className="right">
                  <button
                    type="button"
                    className="ghost compact"
                    onClick={() => setEntryToDelete(entry)}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={Boolean(entryToDelete)}
        title="Remover da whitelist"
        message={
          entryToDelete
            ? `Remover ${entryToDelete.name || entryToDelete.address} da whitelist? Ele voltará a ser publicado se estiver ativo em algum ofício.`
            : ""
        }
        confirmLabel="Remover"
        danger
        busy={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(entryToDelete.id)}
        onCancel={() => setEntryToDelete(null)}
      />
    </section>
  );
}

export default function WhitelistPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Whitelist</h1>
          <p>
            Domínios e IPs cadastrados aqui nunca são publicados no RPZ (BIND) nem nas rotas do
            roteador, mesmo que apareçam como ativos em algum ofício.
          </p>
        </div>
        <div className="actions">
          <Link className="button ghost" to="/general">
            Voltar
          </Link>
        </div>
      </div>

      <WhitelistSection
        title="Domínios"
        valueLabel="Domínio"
        valuePlaceholder="exemplo.com.br"
        queryKey={["whitelist-domains"]}
        listFn={listWhitelistDomains}
        createFn={({ value, reason }) => createWhitelistDomain({ name: value, reason })}
        deleteFn={deleteWhitelistDomain}
      />

      <WhitelistSection
        title="IPs"
        valueLabel="IP"
        valuePlaceholder="203.0.113.10"
        queryKey={["whitelist-ips"]}
        listFn={listWhitelistIps}
        createFn={({ value, reason }) => createWhitelistIp({ address: value, reason })}
        deleteFn={deleteWhitelistIp}
        formatCreated={(entry) => entry.address}
      />
    </div>
  );
}
