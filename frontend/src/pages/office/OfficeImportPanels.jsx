import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addOfficeDomainFiles,
  addOfficeIpFiles,
  addOfficeManualDomains,
  addOfficeManualIps,
} from "../../api/offices.js";
import { useToast } from "../../components/Toast.jsx";

function useImportMutation(officeId, mutationFn, successLabel) {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      notify(`${successLabel}: ${result.added} novos, ${result.existing} já existentes.`, "success");
      queryClient.invalidateQueries({ queryKey: ["office", officeId] });
    },
    onError: (err) => notify(err.message, "error"),
  });
}

export default function OfficeImportPanels({ officeId }) {
  const [domainFiles, setDomainFiles] = useState([]);
  const [domainFilesRemoval, setDomainFilesRemoval] = useState("");
  const [domainFilesRedirectTarget, setDomainFilesRedirectTarget] = useState("");
  const [ipFiles, setIpFiles] = useState([]);
  const [ipFilesRemoval, setIpFilesRemoval] = useState("");
  const [manualDomains, setManualDomains] = useState("");
  const [manualDomainsRemoval, setManualDomainsRemoval] = useState("");
  const [manualDomainsRedirectTarget, setManualDomainsRedirectTarget] = useState("");
  const [manualIps, setManualIps] = useState("");
  const [manualIpsRemoval, setManualIpsRemoval] = useState("");

  const domainFilesMutation = useImportMutation(
    officeId,
    () => addOfficeDomainFiles(officeId, domainFiles, domainFilesRemoval, domainFilesRedirectTarget),
    "Domínios anexados"
  );
  const ipFilesMutation = useImportMutation(
    officeId,
    () => addOfficeIpFiles(officeId, ipFiles, ipFilesRemoval),
    "IPs anexados"
  );
  const manualDomainsMutation = useImportMutation(
    officeId,
    () =>
      addOfficeManualDomains(
        officeId,
        manualDomains,
        manualDomainsRemoval,
        manualDomainsRedirectTarget
      ),
    "Domínios anexados"
  );
  const manualIpsMutation = useImportMutation(
    officeId,
    () => addOfficeManualIps(officeId, manualIps, manualIpsRemoval),
    "IPs anexados"
  );

  return (
    <div className="office-import-grid import-grid">
      <div className="upload-panel">
        <h2>Anexar domínios (arquivo)</h2>
        <label>
          Arquivos (PDF, ODS, XLS, XLSX, XLSM)
          <input
            type="file"
            multiple
            accept=".pdf,.ods,.xls,.xlsx,.xlsm"
            onChange={(event) => setDomainFiles(Array.from(event.target.files))}
          />
        </label>
        {domainFiles.length > 0 && (
          <ul className="selected-files">
            {domainFiles.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        )}
        <label>
          Data de remoção (opcional)
          <input
            type="date"
            value={domainFilesRemoval}
            onChange={(event) => setDomainFilesRemoval(event.target.value)}
          />
        </label>
        <label>
          Redirecionar para (opcional)
          <input
            type="text"
            placeholder="dominio-destino.com.br"
            value={domainFilesRedirectTarget}
            onChange={(event) => setDomainFilesRedirectTarget(event.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={domainFiles.length === 0 || domainFilesMutation.isPending}
          onClick={() => domainFilesMutation.mutate()}
        >
          {domainFilesMutation.isPending ? "Enviando…" : "Anexar domínios"}
        </button>
      </div>

      <div className="upload-panel">
        <h2>Anexar IPs (arquivo)</h2>
        <label>
          Arquivos (PDF, XLS, XLSX, XLSM)
          <input
            type="file"
            multiple
            accept=".pdf,.xls,.xlsx,.xlsm"
            onChange={(event) => setIpFiles(Array.from(event.target.files))}
          />
        </label>
        {ipFiles.length > 0 && (
          <ul className="selected-files">
            {ipFiles.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        )}
        <label>
          Data de remoção (opcional)
          <input
            type="date"
            value={ipFilesRemoval}
            onChange={(event) => setIpFilesRemoval(event.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={ipFiles.length === 0 || ipFilesMutation.isPending}
          onClick={() => ipFilesMutation.mutate()}
        >
          {ipFilesMutation.isPending ? "Enviando…" : "Anexar IPs"}
        </button>
      </div>

      <div className="upload-panel">
        <h2>Domínios manuais</h2>
        <label>
          Um domínio por linha
          <textarea
            value={manualDomains}
            onChange={(event) => setManualDomains(event.target.value)}
          />
        </label>
        <label>
          Data de remoção (opcional)
          <input
            type="date"
            value={manualDomainsRemoval}
            onChange={(event) => setManualDomainsRemoval(event.target.value)}
          />
        </label>
        <label>
          Redirecionar para (opcional)
          <input
            type="text"
            placeholder="dominio-destino.com.br"
            value={manualDomainsRedirectTarget}
            onChange={(event) => setManualDomainsRedirectTarget(event.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={!manualDomains.trim() || manualDomainsMutation.isPending}
          onClick={() => manualDomainsMutation.mutate()}
        >
          {manualDomainsMutation.isPending ? "Enviando…" : "Adicionar domínios"}
        </button>
      </div>

      <div className="upload-panel">
        <h2>IPs manuais</h2>
        <label>
          Um IP/CIDR por linha (ou separados por vírgula/espaço)
          <textarea value={manualIps} onChange={(event) => setManualIps(event.target.value)} />
        </label>
        <label>
          Data de remoção (opcional)
          <input
            type="date"
            value={manualIpsRemoval}
            onChange={(event) => setManualIpsRemoval(event.target.value)}
          />
        </label>
        <button
          type="button"
          disabled={!manualIps.trim() || manualIpsMutation.isPending}
          onClick={() => manualIpsMutation.mutate()}
        >
          {manualIpsMutation.isPending ? "Enviando…" : "Adicionar IPs"}
        </button>
      </div>
    </div>
  );
}
