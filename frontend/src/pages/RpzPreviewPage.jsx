import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { deployRpz, getRpzPreview } from "../api/rpz.js";
import DownloadButton from "../components/DownloadButton.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { useToast } from "../components/Toast.jsx";

export default function RpzPreviewPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { notify } = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["rpz-preview"],
    queryFn: getRpzPreview,
  });

  const deployMutation = useMutation({
    mutationFn: deployRpz,
    onSuccess: (result) => {
      notify(result.message || "RPZ publicada com sucesso.", "success");
      setConfirmOpen(false);
    },
    onError: (err) => {
      notify(err.message, "error");
      setConfirmOpen(false);
    },
  });

  return (
    <div>
      <div className="page-head">
        <h1>RPZ</h1>
        <div className="actions">
          <button type="button" onClick={() => setConfirmOpen(true)}>
            Publicar via SSH
          </button>
          <DownloadButton path="/rpz/db.rpz.zone" filename="db.rpz.zone">
            Baixar RPZ geral
          </DownloadButton>
        </div>
      </div>

      {isError && (
        <div className="messages">
          <div className="message error">{error.message}</div>
        </div>
      )}

      {isLoading ? (
        <div className="page-loading">Carregando…</div>
      ) : (
        <>
          <p>{data.domain_count} domínios ativos incluídos nesta zona.</p>
          <pre className="zone-preview">{data.zone}</pre>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar publicação"
        message="Esta ação vai substituir o arquivo remoto /var/cache/bind/db.rpz.zone e executar o reload configurado."
        confirmLabel="Confirmar e publicar"
        busy={deployMutation.isPending}
        onConfirm={() => deployMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
