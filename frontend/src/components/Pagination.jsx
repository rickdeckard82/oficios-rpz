import React from "react";

export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) {
    return null;
  }

  return (
    <div className="pagination">
      <button
        type="button"
        className="ghost compact"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        Anterior
      </button>
      <span>
        Página {page} de {pages}
      </span>
      <button
        type="button"
        className="ghost compact"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        Próxima
      </button>
    </div>
  );
}
