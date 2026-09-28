// Histórico de versões exibido ao clicar na versão do rodapé.
// Adicione cada nova versão no topo da lista, junto com o arquivo VERSION.
export const CHANGELOG = [
  {
    version: "1.0.0",
    date: "2026-09-27",
    summary:
      "Primeira versão estável: controle de ofícios, consolidação de domínios e IPs, geração e publicação da zona RPZ no BIND, rotas discard nos roteadores e comunicados.",
    added: [
      "Ondas animadas no rodapé da tela de login e das telas internas.",
      "Histórico de versões acessível ao clicar na versão no rodapé.",
      "Arquivo .env.example com todas as variáveis de configuração documentadas.",
    ],
    changed: [
      "Rodapé passa a exibir a versão lida do arquivo VERSION (via /api/v1/health), em vez de um valor fixo no código.",
      "Adicionados .gitignore e .dockerignore para manter .env, uploads, chaves SSH e node_modules fora do repositório e das imagens.",
    ],
    fixed: ["Rodapé exibia a versão desatualizada v0.2.0."],
  },
];

export const CHANGELOG_SECTIONS = [
  { key: "added", title: "Novidades" },
  { key: "changed", title: "Alterações" },
  { key: "fixed", title: "Correções" },
];
