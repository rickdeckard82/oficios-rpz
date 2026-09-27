import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Badge from "../../components/Badge.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import DownloadButton from "../../components/DownloadButton.jsx";
import { updateOfficeDomainsRemovalDate, updateOfficeIpsRemovalDate } from "../../api/offices.js";
import { useToast } from "../../components/Toast.jsx";
import { formatDateOnly, isDateOnlyExpired as isExpired } from "../../utils/dateOnly.js";

export default function OfficeDomainsIpsLists({
  domains,
  ipAddresses,
  officeId,
  officeNumber,
  ipBatchId,
}) {
  const [bulkDialog, setBulkDialog] = useState(null);
  const [bulkDate, setBulkDate] = useState("");
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const hasExpiredIps = ipAddresses.some((address) => isExpired(address.removal_date));
  const hasActiveExpiredIps = ipAddresses.some(
    (address) => address.active && isExpired(address.removal_date)
  );
  const showExpiredIpConfig = hasExpiredIps && !hasActiveExpiredIps;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["office", officeId] });

  const domainsRemovalMutation = useMutation({
    mutationFn: (removalDate) => updateOfficeDomainsRemovalDate(officeId, removalDate),
    onSuccess: (result) => {
      notify(`Data de remoção atualizada em ${result.updated} domínio(s).`, "success");
      setBulkDialog(null);
      invalidate();
    },
    onError: (err) => notify(err.message, "error"),
  });

  const ipsRemovalMutation = useMutation({
    mutationFn: (removalDate) => updateOfficeIpsRemovalDate(officeId, removalDate),
    onSuccess: (result) => {
      notify(`Data de remoção atualizada em ${result.updated} lote(s) de IP.`, "success");
      setBulkDialog(null);
      invalidate();
    },
    onError: (err) => notify(err.message, "error"),
  });

  function openBulkDialog(target) {
    setBulkDate("");
    setBulkDialog(target);
  }

  return (
    <div className="split-lists">
      <article>
        <div className="card-head">
          <h2>Domínios ({domains.length})</h2>
          <div className="card-head-actions">
            <button type="button" className="ghost" onClick={() => openBulkDialog("domains")}>
              Alterar data de remoção
            </button>
            <DownloadButton
              path={`/offices/${officeId}/db.rpz.zone`}
              filename={`${officeNumber}-db.rpz.zone`}
            >
              Gerar db.rpz.zone
            </DownloadButton>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Domínio</th>
              <th>Remoção</th>
              <th>Redirecionamento</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {domains.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Nenhum domínio vinculado.
                </td>
              </tr>
            )}
            {domains.map((domain) => (
              <tr key={domain.id}>
                <td>{domain.name}</td>
                <td>
                  {domain.removal_date ? (
                    <>
                      {formatDateOnly(domain.removal_date)}{" "}
                      {isExpired(domain.removal_date) && <Badge variant="error">expirado</Badge>}
                    </>
                  ) : (
                    "—"
                  )}
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <article>
        <div className="card-head">
          <h2>IPs ({ipAddresses.length})</h2>
          <div className="card-head-actions">
            <button type="button" className="ghost" onClick={() => openBulkDialog("ips")}>
              Alterar data de remoção
            </button>
            {ipBatchId && (
              <DownloadButton
                path={`/ip-batches/${ipBatchId}/config.txt`}
                filename={`${officeNumber}-config.txt`}
              >
                Baixar config IP
              </DownloadButton>
            )}
            {showExpiredIpConfig && (
              <DownloadButton
                path={`/offices/${officeId}/expired-ips-delete.txt`}
                filename={`${officeNumber}-ips-expirados-delete.txt`}
              >
                Config remover IPs expirados
              </DownloadButton>
            )}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>IP</th>
              <th>Versão</th>
              <th>Remoção</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {ipAddresses.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Nenhum IP vinculado.
                </td>
              </tr>
            )}
            {ipAddresses.map((address) => (
              <tr key={address.id}>
                <td>{address.address}</td>
                <td>IPv{address.version}</td>
                <td>
                  {address.removal_date ? (
                    <>
                      {formatDateOnly(address.removal_date)}{" "}
                      {isExpired(address.removal_date) && <Badge variant="error">expirado</Badge>}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <Badge variant={address.active ? "success" : "error"}>
                    {address.active ? "ativo" : "inativo"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <ConfirmDialog
        open={bulkDialog === "domains"}
        title="Alterar data de remoção dos domínios"
        message={`Isso substitui a data de remoção de todos os ${domains.length} domínio(s) vinculados a este ofício. Deixe em branco para remover o prazo.`}
        mode="date"
        dateValue={bulkDate}
        onDateChange={setBulkDate}
        dateLabel="Nova data de remoção"
        confirmLabel="Aplicar"
        busy={domainsRemovalMutation.isPending}
        onConfirm={() => domainsRemovalMutation.mutate(bulkDate)}
        onCancel={() => setBulkDialog(null)}
      />

      <ConfirmDialog
        open={bulkDialog === "ips"}
        title="Alterar data de remoção dos IPs"
        message="Isso substitui a data de remoção de todos os lotes de IP vinculados a este ofício. Deixe em branco para remover o prazo."
        mode="date"
        dateValue={bulkDate}
        onDateChange={setBulkDate}
        dateLabel="Nova data de remoção"
        confirmLabel="Aplicar"
        busy={ipsRemovalMutation.isPending}
        onConfirm={() => ipsRemovalMutation.mutate(bulkDate)}
        onCancel={() => setBulkDialog(null)}
      />
    </div>
  );
}
