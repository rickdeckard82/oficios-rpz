import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCommunicationsConfig } from "../api/settings.js";

const DEFAULT_HELP = 'Selecione Bloqueio/Desbloqueio, marque DNS/IP e clique em "Gerar texto".';

function todayFormatted() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${today.getFullYear()}`;
}

function formatDate(value) {
  const clean = value.trim();
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  return clean;
}

function formatList(values) {
  const cleanValues = values.filter((value) => value && value.trim());
  if (cleanValues.length <= 1) {
    return cleanValues.join("");
  }
  if (cleanValues.length === 2) {
    return `${cleanValues[0]} e ${cleanValues[1]}`;
  }
  return `${cleanValues.slice(0, -1).join(", ")} e ${cleanValues[cleanValues.length - 1]}`;
}

function companyShortName(config) {
  return (config.companyName || "").trim().split(/\s+/)[0] || "Neolink";
}

function contactText(config) {
  const lines = [
    "Contatos:",
    "",
    "Gerente de NOC:",
    config.contactName || "",
    config.contactPhone || "",
    "",
    `Plantão NOC ${companyShortName(config)} 24x7`,
    config.dutyPhone || "",
  ];

  if (config.dutyEmail) {
    lines.push(config.dutyEmail);
  }

  if (config.companyName || config.companyAddressLines.length) {
    lines.push("", config.companyName || "");
    lines.push(...config.companyAddressLines);
  }

  return lines.join("\n").trimEnd();
}

function communicationText(config, fields) {
  const dateValue = formatDate(fields.date);
  const processNumber = fields.processNumber.trim();
  const officeNumber = fields.officeNumber.trim();
  const fragments = [];

  if (fields.applyDns) {
    const dnsAction = fields.operation === "block" ? "bloqueadas" : "desbloqueadas";
    const dnsServers = formatList(config.dnsServers);
    fragments.push(`as URLs foram ${dnsAction} nos servidores ${dnsServers || "DNS cadastrados"}`);
  }

  if (fields.applyIp) {
    const ipAction = fields.operation === "block" ? "adicionados" : "removidos";
    const borderRouter = config.borderRouter ? ` ${config.borderRouter}` : "";
    fragments.push(
      `os IPs foram ${ipAction} para o redirecionamento de destinos inacessíveis pelo Roteador de Borda${borderRouter}`
    );
  }

  const actionText = fragments.length ? fragments.join(" e ") : "nenhuma operação foi selecionada";

  return `Prezados,

Informamos que ${actionText} no dia ${dateValue}.

Conforme orientação do Processo ${processNumber} (Ofício ${officeNumber}).

${contactText(config)}`;
}

function emptyFields() {
  return {
    date: todayFormatted(),
    processNumber: "",
    officeNumber: "",
    operation: "block",
    applyDns: true,
    applyIp: true,
  };
}

export default function CommunicationsPage() {
  const [fields, setFields] = useState(emptyFields());
  const [output, setOutput] = useState("");
  const [help, setHelp] = useState(DEFAULT_HELP);

  const { data: config, isLoading, isError, error } = useQuery({
    queryKey: ["communications-config"],
    queryFn: getCommunicationsConfig,
  });

  useEffect(() => {
    if (config) {
      setOutput(communicationText(config, fields));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  function updateField(name, value) {
    setFields((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setOutput(communicationText(config, fields));
    setHelp("Texto pronto para copiar.");
  }

  function handleClear() {
    setFields(emptyFields());
    setOutput("");
    setHelp(DEFAULT_HELP);
  }

  async function handleCopy() {
    if (!output.trim()) {
      setHelp("Gere o texto antes de copiar.");
      return;
    }
    await navigator.clipboard.writeText(output);
    setHelp("Texto copiado.");
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Comunicados</h1>
          <p>Gere o texto de retorno para enviar à ANATEL.</p>
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
        <section className="comms-shell">
          <form className="upload-panel" onSubmit={handleSubmit}>
            <h2>Dados do comunicado</h2>
            <div className="comms-form-grid">
              <label>
                Data
                <input
                  inputMode="numeric"
                  required
                  value={fields.date}
                  placeholder="DD/MM/AAAA"
                  onChange={(event) => updateField("date", event.target.value)}
                />
                <small>Formato: DD/MM/AAAA</small>
              </label>

              <label>
                Número do processo
                <input
                  required
                  value={fields.processNumber}
                  placeholder="53500.099328/2024-86"
                  onChange={(event) => updateField("processNumber", event.target.value)}
                />
              </label>

              <label>
                Número do ofício
                <input
                  required
                  value={fields.officeNumber}
                  placeholder="234"
                  onChange={(event) => updateField("officeNumber", event.target.value)}
                />
              </label>
            </div>

            <div className="comms-options">
              <fieldset>
                <legend>Tipo de operação</legend>
                <label className="pill-radio">
                  <input
                    type="radio"
                    name="operation"
                    value="block"
                    checked={fields.operation === "block"}
                    onChange={() => updateField("operation", "block")}
                  />
                  Bloqueio
                </label>
                <label className="pill-radio">
                  <input
                    type="radio"
                    name="operation"
                    value="unblock"
                    checked={fields.operation === "unblock"}
                    onChange={() => updateField("operation", "unblock")}
                  />
                  Desbloqueio
                </label>
              </fieldset>

              <fieldset>
                <legend>Aplicar em</legend>
                <label className="pill-radio">
                  <input
                    type="checkbox"
                    checked={fields.applyDns}
                    onChange={(event) => updateField("applyDns", event.target.checked)}
                  />
                  DNS
                </label>
                <label className="pill-radio">
                  <input
                    type="checkbox"
                    checked={fields.applyIp}
                    onChange={(event) => updateField("applyIp", event.target.checked)}
                  />
                  IP
                </label>
              </fieldset>
            </div>

            <div className="comms-actions">
              <button type="submit">Gerar texto</button>
              <button className="ghost" type="button" onClick={handleClear}>
                Limpar
              </button>
              <button className="ghost" type="button" onClick={handleCopy}>
                Copiar texto
              </button>
            </div>
          </form>

          <section className="upload-panel">
            <div className="comms-output-head">
              <h2>Texto gerado</h2>
              <span>{help}</span>
            </div>
            <textarea spellCheck={false} value={output} onChange={(event) => setOutput(event.target.value)} />
          </section>
        </section>
      )}
    </div>
  );
}
