import React from "react";

// Cada onda tem dois períodos idênticos de 1440 unidades; a animação desloca
// um período inteiro para a esquerda (ou direita), então o loop não tem emenda.
function wavePath(top, bottom) {
  return (
    `M0,${top} C360,${top} 360,${bottom} 720,${bottom} C1080,${bottom} 1080,${top} 1440,${top} ` +
    `C1800,${top} 1800,${bottom} 2160,${bottom} C2520,${bottom} 2520,${top} 2880,${top} ` +
    "L2880,200 L0,200 Z"
  );
}

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <svg
        className="site-footer-waves"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path className="wave-back" d={wavePath(38, 78)} />
        <path className="wave-middle" d={wavePath(118, 88)} />
        <path className="wave-front" d={wavePath(142, 164)} />
      </svg>
      <span className="site-footer-text">© 2026 Oficios RPZ. v0.2.0</span>
    </footer>
  );
}
