import React from "react";

export default function Filters({ q, status, onQChange, onStatusChange, onSubmit, children }) {
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="filters" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Buscar…"
        value={q}
        onChange={(event) => onQChange(event.target.value)}
      />
      <select value={status} onChange={(event) => onStatusChange(event.target.value)}>
        <option value="active">Ativos</option>
        <option value="inactive">Inativos</option>
        <option value="all">Todos</option>
      </select>
      <button type="submit">Filtrar</button>
      {children}
    </form>
  );
}
