import React from "react";

export default function RouterFieldArray({ title, addLabel, values, onChange }) {
  function updateAt(index, key, value) {
    const next = [...values];
    next[index] = { ...next[index], [key]: value };
    onChange(next);
  }

  function removeAt(index) {
    onChange(values.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...values, { name: "", host: "" }]);
  }

  return (
    <div className="dynamic-list">
      <div className="dynamic-list-head">
        <h3>{title}</h3>
        <button className="ghost" type="button" onClick={add}>
          {addLabel}
        </button>
      </div>
      <div className="dynamic-list-items">
        {values.map((value, index) => (
          <div className="dynamic-row publish-router-row" key={index}>
            <input
              value={value.name}
              placeholder="Nome"
              autoComplete="off"
              onChange={(event) => updateAt(index, "name", event.target.value)}
            />
            <input
              value={value.host}
              placeholder="IP/host"
              autoComplete="off"
              onChange={(event) => updateAt(index, "host", event.target.value)}
            />
            <button className="ghost" type="button" onClick={() => removeAt(index)}>
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
