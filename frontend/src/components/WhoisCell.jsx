import React from "react";
import Badge from "./Badge.jsx";

export default function WhoisCell({ whois, whoisJob }) {
  if (whoisJob && ["pending", "running"].includes(whoisJob.status)) {
    return (
      <div className="whois-cell">
        <Badge variant="running">{whoisJob.status === "running" ? "Consultando…" : "Na fila"}</Badge>
      </div>
    );
  }

  if (whois && whois.error) {
    return (
      <div className="whois-cell">
        <span className="error-text">{whois.error}</span>
      </div>
    );
  }

  if (whois && (whois.asn || whois.as_name || whois.rdap_name)) {
    return (
      <div className="whois-cell">
        {whois.asn && <strong>AS{whois.asn}</strong>}
        {(whois.as_name || whois.rdap_name) && <span>{whois.as_name || whois.rdap_name}</span>}
        <small>
          {[whois.registry, whois.country || whois.rdap_country].filter(Boolean).join(" · ")}
        </small>
      </div>
    );
  }

  if (whoisJob && whoisJob.status === "error") {
    return (
      <div className="whois-cell">
        <span className="error-text">{whoisJob.error || "Falha na consulta"}</span>
      </div>
    );
  }

  return (
    <div className="whois-cell">
      <span className="muted">Sem dados</span>
    </div>
  );
}
