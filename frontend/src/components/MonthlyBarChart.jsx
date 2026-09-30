import React from "react";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTH_NAMES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// Arredonda o topo do eixo para 1, 2 ou 5 × 10^n, com no máximo 4 divisões.
function niceScale(max) {
  if (max <= 0) return { top: 4, step: 1 };
  const rough = max / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((factor) => factor * power).find((value) => value >= rough);
  const safeStep = Math.max(step, 1);
  return { top: Math.ceil(max / safeStep) * safeStep, step: safeStep };
}

function parseMonth(value) {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

// Gráfico de barras verticais com a quantidade de ofícios por mês.
// items: [{ month: "AAAA-MM", count }], em ordem cronológica; o último é o mês atual.
export default function MonthlyBarChart({ title, items }) {
  const max = Math.max(0, ...items.map((item) => item.count));
  const { top, step } = niceScale(max);
  const ticks = [];
  for (let value = 0; value <= top; value += step) ticks.push(value);
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <figure className="chart-card bar-chart">
      <figcaption>
        <h3>{title}</h3>
        <span className="muted">{total} nos últimos {items.length} meses</span>
      </figcaption>
      <div className="bar-chart-plot">
        <div className="bar-chart-grid" aria-hidden="true">
          {ticks.map((tick) => (
            <div key={tick} className="bar-chart-gridline" style={{ bottom: `${(tick / top) * 100}%` }}>
              <span>{tick}</span>
            </div>
          ))}
        </div>
        <ol className="bar-chart-bars">
          {items.map((item, index) => {
            const { year, month } = parseMonth(item.month);
            const current = index === items.length - 1;
            const label = `${MONTH_NAMES[month - 1]} de ${year}: ${item.count} ofício${item.count === 1 ? "" : "s"}${
              current ? " (mês em andamento)" : ""
            }`;
            return (
              <li key={item.month} className={current ? "is-current" : ""} aria-label={label}>
                <div className="bar-chart-column">
                  <div
                    className={`bar-chart-bar${item.count === 0 ? " is-empty" : ""}`}
                    style={{ height: `${(item.count / top) * 100}%` }}
                  >
                    <span className="bar-chart-tooltip" role="tooltip">
                      <strong>{item.count}</strong> {MONTHS[month - 1]}/{String(year).slice(2)}
                      {current && <em>parcial</em>}
                    </span>
                  </div>
                </div>
                <span className="bar-chart-label">
                  {MONTHS[month - 1]}
                  {(month === 1 || index === 0) && <small>{String(year).slice(2)}</small>}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </figure>
  );
}
