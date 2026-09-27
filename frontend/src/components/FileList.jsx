import React, { useState } from "react";
import { downloadFile, viewFile } from "../api/client.js";
import { useToast } from "./Toast.jsx";

export default function FileList({ files, viewPath, downloadPath, emptyLabel = "Nenhum arquivo." }) {
  const [busyId, setBusyId] = useState(null);
  const { notify } = useToast();

  async function handleView(file) {
    setBusyId(file.id);
    try {
      await viewFile(viewPath(file));
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDownload(file) {
    setBusyId(file.id);
    try {
      await downloadFile(downloadPath(file), file.filename);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusyId(null);
    }
  }

  if (!files || files.length === 0) {
    return <p className="muted">{emptyLabel}</p>;
  }

  return (
    <div className="files-panel">
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Arquivo</th>
            <th>Enviado em</th>
            <th className="right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => (
            <tr key={file.id}>
              <td>{file.file_type || "—"}</td>
              <td>{file.filename}</td>
              <td>{new Date(file.created_at).toLocaleString("pt-BR")}</td>
              <td className="right file-actions">
                <button
                  type="button"
                  className="ghost compact"
                  disabled={busyId === file.id}
                  onClick={() => handleView(file)}
                >
                  Abrir
                </button>{" "}
                <button
                  type="button"
                  className="ghost compact"
                  disabled={busyId === file.id}
                  onClick={() => handleDownload(file)}
                >
                  Baixar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
