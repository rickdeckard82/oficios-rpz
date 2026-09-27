import React from "react";

export default function FieldArray({ title, addLabel, placeholder, values, onChange }) {
  function updateAt(index, value) {
    const next = [...values];
    next[index] = value;
    onChange(next);
  }

  function removeAt(index) {
    onChange(values.filter((_, i) => i !== index));
  }

  function add() {
    onChange([...values, ""]);
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
          <div className="dynamic-row" key={index}>
            <input
              value={value}
              placeholder={placeholder}
              autoComplete="off"
              onChange={(event) => updateAt(index, event.target.value)}
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
