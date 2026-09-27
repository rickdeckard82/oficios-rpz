import React from "react";
import { NavLink } from "react-router-dom";

const LINKS = [
  { to: "/dashboard", label: "Painel" },
  { to: "/comunicados", label: "Comunicados" },
  { to: "/offices", label: "Ofícios" },
  { to: "/domains", label: "Domínios" },
  { to: "/ip-blocks", label: "IPs" },
  { to: "/ip-blocks/preview", label: "CFG IP" },
  { to: "/rpz", label: "RPZ" },
  { to: "/general", label: "Geral" },
  { to: "/log", label: "Log" },
];

export default function Nav() {
  return (
    <nav>
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) => (isActive ? "active" : undefined)}
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
