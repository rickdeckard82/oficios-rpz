import React, { useEffect } from "react";
import { CHANGELOG, CHANGELOG_SECTIONS } from "../constants/changelog.js";
import { formatDateOnly } from "../utils/dateOnly.js";

export default function ChangelogDialog({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;
    function handleKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box changelog-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="changelog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="changelog-title">Histórico de versões</h2>
        <div className="changelog-list">
          {CHANGELOG.map((release) => (
            <section key={release.version} className="changelog-release">
              <h3>
                v{release.version}
                <span className="changelog-date">{formatDateOnly(release.date)}</span>
              </h3>
              {release.summary && <p>{release.summary}</p>}
              {CHANGELOG_SECTIONS.filter(({ key }) => release[key]?.length).map(({ key, title }) => (
                <div key={key} className="changelog-section">
                  <h4>{title}</h4>
                  <ul>
                    {release[key].map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>
        <div className="actions">
          <button type="button" onClick={onClose} autoFocus>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
