import React from "react";
import { Link } from "react-router-dom";

const CARDS = [
  {
    to: "/general/company",
    title: "Empresa",
    description: "Dados institucionais usados nas telas e comunicados.",
  },
  {
    to: "/general/users",
    title: "Usuários",
    description: "Cadastro, senhas e status dos operadores do sistema.",
  },
  {
    to: "/general/parameters",
    title: "Parâmetros",
    description: "Preferências de publicação, prazos e integrações.",
  },
  {
    to: "/general/whitelist",
    title: "Whitelist",
    description: "Domínios e IPs que nunca devem ser publicados no RPZ/roteador.",
  },
  {
    to: "/general/backup",
    title: "Backup",
    description: "Baixe uma cópia do banco de dados e dos arquivos anexados aos ofícios.",
  },
];

export default function GeneralPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Geral</h1>
          <p>Configurações gerais do sistema, acessos e parâmetros operacionais.</p>
        </div>
      </div>

      <section className="settings-grid">
        {CARDS.map((card) => (
          <Link className="settings-card settings-card-link" to={card.to} key={card.to}>
            <div>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
            </div>
            <span className="button">Abrir</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
