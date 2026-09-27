# Padrão de Código Frontend — Neolink

> Extraído da análise do projeto **oficios-rpz** (React + Vite, CSS puro).
> Objetivo: servir de base para novos projetos frontend da Neolink, garantindo consistência visual e evitando retrabalho de estilo a cada aplicação nova.

## 1. Stack de referência

- **React 18** + **Vite** (sem framework CSS, sem CSS-in-JS, sem CSS Modules)
- **Um único arquivo global**: `src/styles/global.css`
- Estilização via **classes CSS puras** (kebab-case) + **CSS Custom Properties** para tema
- Sem biblioteca de componentes (Tailwind, MUI, etc.) — componentes React finos que só aplicam `className`

Recomendação: manter essa abordagem em projetos pequenos/médios (baixa complexidade, zero dependências de build extra). Para produtos maiores, considerar Tailwind ou CSS Modules mantendo os mesmos tokens de cor/tipografia abaixo.

## 2. Tema e cores

Todo o tema é dark-only, definido em `:root` com `color-scheme: dark`. Nunca usar cores hex direto em componentes — sempre via variável.

```css
:root {
  color-scheme: dark;

  /* Superfícies */
  --bg: #0d1319;           /* fundo da página */
  --panel: #141d26;        /* cards, painéis, header */
  --field: #0f171f;        /* inputs, textareas */
  --field-hover: #1a2530;  /* hover de campos/botões ghost */
  --table-head: #1b2733;   /* cabeçalho de tabela */

  /* Texto */
  --ink: #edf4f7;          /* texto principal */
  --muted: #9eabb6;        /* texto secundário */

  /* Bordas */
  --line: #2b3947;

  /* Marca / ação primária */
  --accent: #24a085;
  --accent-strong: #1b7f6a; /* hover do accent */

  /* Estados semânticos */
  --danger: #ff6b61;
  --danger-bg: #351917;
  --danger-line: #70332d;

  --ok: #5bd38f;
  --ok-bg: #143024;

  --running-bg: #1b2733;

  --warning: #f0b429;
  --warning-bg: #332608;
}
```

### Regras de uso

| Token | Uso |
|---|---|
| `--bg` | fundo do `body` |
| `--panel` | cards (`.settings-card`, `.detail-panel`), header (`.topbar`), modais |
| `--field` / `--field-hover` | inputs e estado hover de botões `ghost` |
| `--ink` | texto principal, títulos |
| `--muted` | texto de apoio, labels secundárias, timestamps |
| `--accent` / `--accent-strong` | botão primário, links, foco de input, radio/checkbox (`accent-color`) |
| `--danger*` | erros, botão destrutivo, badge de falha |
| `--ok*` | sucesso, badge de sucesso |
| `--warning*` | alertas, badge de atenção |
| `--running-bg` | estados "em progresso" (usa `--muted` como cor de texto) |

Cada estado semântico segue o par **cor forte + fundo escuro dessaturado** (ex.: `--danger` sobre `--danger-bg`) — usado em badges e mensagens (`.badge.success`, `.message.error`, etc.).

## 3. Tipografia

- **Fonte de texto**: `Arial, Helvetica, sans-serif` (sem Google Fonts/web fonts — carregamento zero-dependência)
- **Fonte de código/saída técnica**: `Consolas, Monaco, monospace` (usada em `<code>`, textarea de saída de comandos/zonas)

| Elemento | Tamanho | Peso |
|---|---|---|
| `h1` | 32px | normal (herda) |
| `h2` | 20px (títulos de card sobem para 21px em contexto de grid) | normal |
| `h3` (ex. `.dynamic-list-head h3`) | 16px | normal |
| Corpo (`p`, `label`, `td`, `th`, `input`, `select`, `textarea`) | 14px | normal |
| Texto de apoio (`.muted`, `small`, legendas) | 12–13px | normal |
| Números de destaque (`.stats strong`) | 22px | normal |
| Botões | 14px | **700 (bold)** |
| `th` | 14px | **700 (bold)** |

Regra: **botões e cabeçalhos de tabela são sempre bold**; texto corrido nunca é bold além disso.

## 4. Espaçamento e forma

- **Border-radius**: `6px` (inputs, botões, fieldsets) / `8px` (cards, painéis, tabelas, modais) / `999px` (badges, pills)
- **Bordas**: `1px solid var(--line)` como padrão em quase todo componente com contorno
- **Gaps**: múltiplos de 2 — comum `8px`, `10px`, `12px`, `16px`, `18px`, `24px`
- **Padding de containers**: `24px` (cards/painéis), `28px` (layout `.container`)
- **Altura mínima de controles**: `40px` (botão padrão), `42px` (input), `32px` (compact), `28px` (ícone/txt-button)

## 5. Componentes-padrão

Nomear classes por **função**, não por página (`.button`, `.badge`, `.message`, não `.pagina-x-botao`).

- **Botão**: `<button>` nativo já estilizado globalmente. Variantes por classe adicional: `.ghost`, `.compact`, `.txt-button`, `.danger-button`, `.icon-danger`. Nunca recriar estilo de botão em outra classe.
- **Badge**: `<span className="badge {variant}">`, variantes `success | error | running | warning`. Ver [Badge.jsx](../frontend/src/components/Badge.jsx) como exemplo de componente-wrapper fino.
- **Mensagem/Toast**: `.message.success|.error` para inline; `.toast-container` para notificações flutuantes (fixed, bottom-right, com `box-shadow`).
- **Card/Painel**: `.panel`-style (`background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 20-24px`) — repetido em `.login-box`, `.upload-panel`, `.deploy-box`, `.settings-card`, `.detail-panel`.
- **Formulário**: `label` é `display: grid` com `gap: 8px`, envolvendo o texto e o input. Inputs sempre 100% de largura do contêiner.
- **Tabela**: fundo `--panel`, `border-radius: 8px` com `overflow: hidden`, cabeçalho `--table-head` bold.
- **Modal**: overlay `rgba(4,7,10,0.68)` fixed cobrindo a tela + `.modal-box` centralizado com `--panel`.

## 6. Responsividade

Dois breakpoints apenas, mobile-first via `max-width`:

- `1180px`: grids de 3 colunas específicos (ex. import) caem para 2
- `820px`: quase todos os grids (`grid-template-columns`) colapsam para `1fr`; barra de navegação e cabeçalho de página passam a `flex-direction: column`

Ou seja: **não criar breakpoints novos por página** — usar esses dois pontos de corte e ajustar apenas quais seletores entram na regra.

## 7. Convenções de nomenclatura CSS

- kebab-case sempre (`.page-head`, `.icon-danger`)
- Sufixo de variante como classe adicional, não modificador BEM (`badge success`, não `badge--success`) — mantém o HTML mais legível e reduz verbosidade
- Uma classe por responsabilidade visual; composição via múltiplas classes no `className` (ex. `"ghost compact"`)

## 8. O que evitar

- Não introduzir Tailwind, styled-components ou CSS Modules nesse padrão sem decisão explícita — quebraria a consistência do design system atual entre projetos
- Não usar cores hardcoded fora das variáveis de tema
- Não usar `font-weight: bold` fora de botões/`th`/destaques numéricos
- Não criar novos breakpoints — reutilizar `1180px` e `820px`

## 9. Como aplicar em um novo projeto

1. Copiar o bloco de variáveis da seção 2 para o `:root` do novo `global.css`
2. Copiar as regras-base de `button`, `.badge`, `.message`, tabela e formulário (seções 5 e 6 deste documento referenciam os seletores originais em [global.css](../frontend/src/styles/global.css))
3. Ajustar apenas `--accent`/`--accent-strong` caso o novo produto tenha identidade visual própria — todo o restante do tema deriva desses dois tokens
4. Manter um único arquivo CSS global até o projeto justificar modularização
