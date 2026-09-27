import React, { useState } from "react";

/**
 * Modal de confirmação com três modos:
 * - simples: `mode="confirm"` — só um botão de confirmar.
 * - por digitação: `mode="type"` com `expectedText` — usuário precisa digitar o
 *   texto exato (ex.: número do ofício) antes de habilitar o botão de confirmar.
 * - por data: `mode="date"` com `dateValue`/`onDateChange` — usuário escolhe uma
 *   data (ou deixa em branco para limpar) antes de confirmar.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  mode = "confirm",
  expectedText = "",
  dateValue = "",
  onDateChange,
  dateLabel = "Nova data",
  confirmLabel = "Confirmar",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  const [typed, setTyped] = useState("");

  if (!open) {
    return null;
  }

  const canConfirm = mode !== "type" || typed.trim() === expectedText;

  function handleConfirm() {
    if (!canConfirm || busy) return;
    onConfirm();
  }

  function handleClose() {
    setTyped("");
    onCancel();
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-box" onClick={(event) => event.stopPropagation()}>
        <h2>{title}</h2>
        <p>{message}</p>
        {mode === "type" && (
          <label>
            Digite "{expectedText}" para confirmar
            <input
              type="text"
              value={typed}
              autoFocus
              onChange={(event) => setTyped(event.target.value)}
            />
          </label>
        )}
        {mode === "date" && (
          <label>
            {dateLabel}
            <input
              type="date"
              value={dateValue}
              autoFocus
              onChange={(event) => onDateChange(event.target.value)}
            />
          </label>
        )}
        <div className="actions">
          <button type="button" className="ghost" onClick={handleClose} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className={danger ? "danger-button" : undefined}
            disabled={!canConfirm || busy}
            onClick={handleConfirm}
          >
            {busy ? "Aguarde…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
