import React, { useState } from "react";

const SIZE = 120;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// Espaço (em unidades do viewBox) entre fatias vizinhas.
const GAP = 2.5;

const numberFormat = new Intl.NumberFormat("pt-BR");
const compactFormat = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const percentFormat = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

// Gráfico de rosca em SVG puro. Cada fatia: { key, label, value, className }.
// A cor vem da classe CSS (.donut-slice.<className>), nunca de hex no componente.
export default function DonutChart({ title, slices }) {
  const [hovered, setHovered] = useState(null);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const visible = slices.filter((slice) => slice.value > 0);
  const gap = visible.length > 1 ? GAP : 0;
  const focused = slices.find((slice) => slice.key === hovered);

  let offset = 0;
  const arcs = visible.map((slice) => {
    const length = (slice.value / total) * CIRCUMFERENCE;
    const dash = Math.max(length - gap, 0.8);
    const arc = (
      <circle
        key={slice.key}
        className={`donut-slice ${slice.className}${hovered && hovered !== slice.key ? " is-dimmed" : ""}`}
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        strokeWidth={STROKE}
        strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
        strokeDashoffset={-offset}
        onMouseEnter={() => setHovered(slice.key)}
        onMouseLeave={() => setHovered(null)}
      />
    );
    offset += length;
    return arc;
  });

  return (
    <figure className="chart-card donut-chart">
      <figcaption>
        <h3>{title}</h3>
      </figcaption>
      <div className="donut-chart-body">
        <div className="donut-chart-ring">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={title}>
            <circle className="donut-track" cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
            <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>{arcs}</g>
          </svg>
          <div className="donut-chart-center">
            <strong title={numberFormat.format(focused ? focused.value : total)}>
              {focused
                ? total > 0
                  ? percentFormat.format(focused.value / total)
                  : "—"
                : compactFormat.format(total)}
            </strong>
            <span>{focused ? focused.label : "total"}</span>
          </div>
        </div>
        <ul className="chart-legend">
          {slices.map((slice) => (
            <li
              key={slice.key}
              className={hovered && hovered !== slice.key ? "is-dimmed" : ""}
              onMouseEnter={() => setHovered(slice.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className={`chart-swatch ${slice.className}`} aria-hidden="true" />
              <span className="chart-legend-label">{slice.label}</span>
              <strong>{numberFormat.format(slice.value)}</strong>
              <span className="chart-legend-share">{total > 0 ? percentFormat.format(slice.value / total) : "—"}</span>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  );
}
