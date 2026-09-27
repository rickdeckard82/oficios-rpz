import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { deployIpRoutes, getIpConfigPreview } from "../api/ipAddresses.js";
import DownloadButton from "../components/DownloadButton.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { useToast } from "../components/Toast.jsx";

export default function IpConfigPreviewPage() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { notify } = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["ip-config-preview"],
    queryFn: getIpConfigPreview,
  });

  const deployMutation = useMutation({
    mutationFn: deployIpRoutes,
    onSuccess: (result) => {
      notify(result.message || "Rotas publicadas com sucesso.", "success");
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
        <h1>CFG IP</h1>
        <div className="actions">
          <button type="button" onClick={() => setConfirmOpen(true)}>
            Publicar nos roteadores
          </button>
          <DownloadButton path="/ip-addresses/config.txt" filename="edge-router-discard-routes.txt">
            Baixar config
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
        <pre className="zone-preview">{data || "Nenhum IP ativo no momento."}</pre>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Confirmar publicação"
        message="Publicar rotas discard nos roteadores de borda cadastrados em Parâmetros?"
        confirmLabel="Confirmar e publicar"
        busy={deployMutation.isPending}
        onConfirm={() => deployMutation.mutate()}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
