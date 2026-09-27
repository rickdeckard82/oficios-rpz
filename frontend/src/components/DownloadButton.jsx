import React, { useState } from "react";
import { downloadFile } from "../api/client.js";
import { useToast } from "./Toast.jsx";

export default function DownloadButton({ path, filename, children, className = "button ghost" }) {
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();

  async function handleClick() {
    setBusy(true);
    try {
      await downloadFile(path, filename);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className={className} disabled={busy} onClick={handleClick}>
      {busy ? "Baixando…" : children}
    </button>
  );
}
