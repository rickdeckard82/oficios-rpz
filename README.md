# Ofícios RPZ

Sistema web para controlar ofícios de bloqueio e desbloqueio, consolidar domínios e IPs, gerar zonas RPZ para BIND e publicar configurações operacionais via SSH.

## Arquitetura

O sistema é dividido em containers independentes:

- **`frontend`**: SPA em React (Vite), única interface de usuário. Serve os arquivos estáticos via nginx e faz proxy de `/api/` para o container `api`.
- **`api`**: backend Flask, expõe só a API JSON em `/api/v1` (ver seção [API](#api)). Não renderiza HTML.
- **`db`**: MySQL 8.4.
- **`whois-worker`**: processo em background que consulta WHOIS/RDAP dos IPs importados.

Em produção, o Nginx Proxy Manager (externo a este `docker-compose.yml`) encaminha o domínio público para o alias de rede do `frontend` (`NPM_FRONTEND_ALIAS`). O container `api` não precisa ficar exposto diretamente — só é acessado pelo `frontend` e por integrações internas via `X-API-Key`.

## O que o sistema faz

- Cria e consulta ofícios por número, processo, SEI e data de expedição.
- Anexa arquivos de domínios e IPs em PDF, XLS, XLSX ou XLSM.
- Permite inclusão manual de domínios e IPs.
- Normaliza domínios antes de salvar, removendo protocolo, `www`, caminhos e variações comuns.
- Deduplica domínios e IPs, mantendo o vínculo com os ofícios em que cada item apareceu.
- Controla data de remoção e destaca itens expirados.
- Gera `db.rpz.zone` geral ou por ofício.
- Publica a RPZ em servidor BIND via SSH.
- Gera configuração de rotas discard para IPs e publica nos roteadores cadastrados via SSH.
- Gera texto de comunicado de bloqueio ou desbloqueio com os dados da empresa.
- Mantém histórico de publicações e status por operador.

## Fluxo de uso

1. Acesse o sistema e entre com o usuário administrador.
2. Em **Geral > Empresa**, cadastre os dados institucionais, contatos e plantão.
3. Em **Geral > Usuários**, ajuste os operadores que podem acessar o sistema.
4. Em **Ofícios**, crie o ofício com número, processo, SEI, data de expedição e intimação, quando houver.
5. Abra o ofício criado e anexe listas de domínios e/ou IPs, ou informe itens manualmente.
6. Informe a data de remoção quando o bloqueio tiver prazo.
7. Valide os itens importados na tela do ofício, em **Domínios** ou nos lotes de IP.
8. Publique:
   - **RPZ** para enviar todos os domínios ativos ao BIND.
   - **Roteador** para aplicar rotas discard dos IPs ativos.
   - **Ofício específico** quando quiser gerar ou publicar apenas os itens daquele ofício.
9. Use **Comunicados** para gerar o texto de retorno conforme a operação realizada.

## Como subir em desenvolvimento

```bash
cp .env.example .env
docker compose up --build
```

O `frontend` não expõe porta diretamente neste `docker-compose.yml` (só via `npm_proxy`); para acessar localmente sem um NPM configurado, publique a porta do serviço `frontend` (ex.: `docker compose run --service-ports frontend` ou um `docker-compose.override.yml` local com `ports: ["8080:80"]`).

Credenciais iniciais, caso não altere o `.env`:

- Usuário: `admin`
- Senha: `admin`

Altere `SECRET_KEY`, `ADMIN_PASSWORD`, `MYSQL_PASSWORD` e `MYSQL_ROOT_PASSWORD` antes de usar fora do ambiente local.

## Configuração principal

Exemplo de variáveis esperadas no `.env`:

```env
SECRET_KEY=troque-por-uma-chave-grande-e-aleatoria
ADMIN_USERNAME=admin
ADMIN_PASSWORD=troque-por-uma-senha-forte

MYSQL_DATABASE=oficios_rpz
MYSQL_USER=oficios_rpz
MYSQL_PASSWORD=troque-por-uma-senha-forte
MYSQL_ROOT_PASSWORD=troque-por-uma-senha-root-forte

HOST_UPLOAD_PATH=/app/oficios-rpz/upload
HOST_SSH_KEY_PATH=/app/oficios-rpz/ssh/id_rsa

NPM_NETWORK_NAME=proxy
NPM_FRONTEND_ALIAS=oficios-frontend
```

Se o ambiente veio de uma instalação antiga, mantenha os nomes atuais do banco no `.env` até fazer uma migração planejada do schema/usuário MySQL. Trocar `MYSQL_DATABASE` ou `MYSQL_USER` sem migrar o banco pode fazer a aplicação iniciar vazia ou perder acesso aos dados existentes.

## API

O `frontend` (SPA) consome exclusivamente esta API. Ela também pode ser usada diretamente por integrações/automações externas.

### Autenticação

Duas formas, aceitas nas mesmas rotas:

1. **`X-API-Key`** — chave única de serviço, para integrações/automações. Comparada com a variável `API_KEY` do `.env`. Se `API_KEY` estiver vazia, a API responde `503`.

   ```env
   API_KEY=troque-por-uma-chave-de-api-forte
   ```

2. **`Authorization: Bearer <token>`** — token pessoal por usuário, obtido via login (é assim que o `frontend` se autentica). Preserva atribuição individual (quem criou o ofício, quem disparou o deploy). O token é válido até um novo login (gera outro) ou um logout explícito.

Fluxo de login:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"username": "seu-usuario", "password": "sua-senha"}' \
  "http://localhost:8000/api/v1/auth/login"
# -> {"token": "...", "user": {"id": 1, "username": "seu-usuario"}}
```

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | não | Login por usuário; retorna um token pessoal |
| POST | `/api/v1/auth/logout` | sim (token) | Invalida o token do usuário autenticado |
| GET | `/api/v1/auth/me` | sim | Informa se a chamada está autenticada como usuário ou como serviço |

Endpoints disponíveis:

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| GET | `/api/v1/health` | não | Verificação de disponibilidade e versão do software (lida do arquivo `VERSION` na raiz do projeto) |
| GET | `/api/v1/offices` | sim | Lista ofícios, com paginação (`page`, `per_page`) e busca (`q`) |
| GET | `/api/v1/offices/<id>` | sim | Detalhe agregado do ofício: arquivos, domínios, lotes e IPs vinculados, estatísticas |
| POST | `/api/v1/offices` | sim | Cria ofício. JSON (`office_number`, `process_number`, `sei_numbers`, `expedition_date`) ou `multipart/form-data` com `intimation_pdf` (extrai automaticamente número/SEI/data quando não informados) — se autenticado por usuário, grava o criador |
| PATCH | `/api/v1/offices/<id>` | sim | Altera o número do ofício (`office_number`) |
| DELETE | `/api/v1/offices/<id>` | sim | **Exclui o ofício** e dados associados (ver aviso abaixo) |
| POST | `/api/v1/offices/<id>/domains/files` | sim | Anexa domínios extraídos de arquivos (`multipart/form-data`, campo `domain_files`, PDF/ODS/XLS/XLSX/XLSM) |
| POST | `/api/v1/offices/<id>/domains/manual` | sim | Anexa domínios informados manualmente (JSON `domains`: string com um domínio por linha, ou lista) |
| POST | `/api/v1/offices/<id>/ips/files` | sim | Anexa IPs extraídos de arquivos (`multipart/form-data`, campo `ip_files`, PDF/XLS/XLSX/XLSM) |
| POST | `/api/v1/offices/<id>/ips/manual` | sim | Anexa IPs informados manualmente (JSON `ips`: string ou lista) |
| GET | `/api/v1/offices/<id>/bind.txt` | sim | Download da zona BIND só com os domínios ativos deste ofício |
| GET | `/api/v1/offices/<id>/db.rpz.zone` | sim | Mesmo conteúdo acima, nome de arquivo `db.rpz.zone` |
| GET | `/api/v1/offices/<id>/expired-ips-delete.txt` | sim | Download da config de remoção de rotas para IPs expirados deste ofício |
| POST | `/api/v1/offices/<id>/deploy-ips` | sim | **Publica rotas discard dos IPs ativos deste ofício no roteador** (assíncrono, ver aviso abaixo) |
| POST | `/api/v1/offices/<id>/deploy-expired-ips-delete` | sim | **Remove do roteador as rotas dos IPs expirados deste ofício** (assíncrono, ver aviso abaixo) |
| POST | `/api/v1/offices/<id>/disable-domains` | sim | Alterna domínios do ofício: reativa todos se nenhum estiver ativo; senão desativa só os exclusivos (preserva os compartilhados com outros ofícios) |
| POST | `/api/v1/offices/<id>/toggle-ips` | sim | Mesma lógica acima, para os IPs do ofício |
| GET | `/api/v1/offices/<id>/files/<file_id>` | sim | Visualiza um arquivo anexado ao ofício (inline) |
| GET | `/api/v1/offices/<id>/files/<file_id>/download` | sim | Baixa o mesmo arquivo (forçando download) |
| GET | `/api/v1/domains` | sim | Lista domínios (`page`, `per_page`, `q`, `active`), com os ofícios de origem de cada um |
| POST | `/api/v1/domains/<id>/toggle` | sim | Ativa/desativa um domínio individualmente |
| GET | `/api/v1/rpz` | sim | Prévia da zona RPZ geral (todos os domínios ativos) e a contagem, sem baixar arquivo |
| GET | `/api/v1/rpz/db.rpz.zone` | sim | Download da zona RPZ geral completa |
| GET | `/api/v1/ip-addresses` | sim | Lista IPs (`page`, `per_page`, `q`, `active`), com lotes de origem e status de WHOIS de cada um |
| POST | `/api/v1/ip-addresses/<id>/toggle` | sim | Ativa/desativa um IP individualmente |
| POST | `/api/v1/ip-addresses/whois-refresh` | sim | Enfileira consulta WHOIS/RDAP (`ip_ids` explícito, ou filtro `q`/`active` igual à listagem) |
| GET | `/api/v1/ip-addresses/config.txt` | sim | Download da config de rotas discard de **todos** os IPs ativos do sistema |
| GET | `/api/v1/ip-batches/<id>` | sim | Detalhe de um lote de IPs: arquivos e endereços importados juntos |
| GET | `/api/v1/ip-batches/<id>/config.txt` | sim | Config de rotas discard só dos IPs ativos daquele lote |
| GET | `/api/v1/ip-batches/<id>/files/<file_id>` | sim | Visualiza um arquivo anexado ao lote (inline) |
| GET | `/api/v1/ip-batches/<id>/files/<file_id>/download` | sim | Baixa o mesmo arquivo |
| GET | `/api/v1/deployments` | sim | Histórico de publicações (`page`, `per_page`, `deployment_type`, `status`) |
| GET | `/api/v1/deployments/<id>` | sim | Consulta uma publicação específica (use para acompanhar deploys assíncronos) |
| POST | `/api/v1/deploy/rpz` | sim | **Publica a RPZ real no BIND via SSH** com os domínios ativos |
| POST | `/api/v1/deploy/ip-routes` | sim | **Publica no roteador as rotas discard de todos os IPs ativos do sistema** |
| GET | `/api/v1/users` | sim | Lista usuários do sistema |
| POST | `/api/v1/users` | sim | Cria usuário (`username`, `password`) |
| POST | `/api/v1/users/<id>/password` | sim | Troca a senha de um usuário (`password`) |
| POST | `/api/v1/users/<id>/toggle` | sim | Ativa/desativa um usuário — bloqueia desativar a si mesmo ou o último usuário ativo |
| GET | `/api/v1/company-settings` | sim | Dados institucionais da empresa (cria o registro único na primeira chamada, se não existir) |
| PUT | `/api/v1/company-settings` | sim | Atualiza os dados institucionais (mesmos campos da tela **Geral > Empresa**) |
| GET | `/api/v1/parameter-settings` | sim | Parâmetros de rede (DNS, roteadores de publicação de bloqueios) |
| PUT | `/api/v1/parameter-settings` | sim | Atualiza os parâmetros de rede (`extra_dns_servers` e `publish_routers` como listas; `publish_routers` é uma lista de `{name, host}`) — responde `400` se `router_command_ipv4`/`router_command_ipv6` não contiverem o marcador `{address}` |
| GET | `/api/v1/dashboard` | sim | Métricas agregadas: contagens de domínios/IPs (total, ativos, removíveis, IPv4/IPv6), últimos 10 ofícios e últimos 5 deployments |
| GET | `/api/v1/communications-config` | sim | Dados formatados para montar texto de comunicado de bloqueio/desbloqueio (mesma fonte usada na tela **Comunicados**) |
| GET | `/api/v1/backup/database` | sim | Dump do banco de dados (`mysqldump --single-transaction`) em `.sql` |
| GET | `/api/v1/backup/files` | sim | `.zip` com todos os arquivos anexados aos ofícios (pasta `UPLOAD_FOLDER`) |
| POST | `/api/v1/backup/database/restore` | sim | **Restaura o banco a partir de um `.sql`** (apaga e recria todas as tabelas — ver aviso abaixo) |
| POST | `/api/v1/backup/files/restore` | sim | **Restaura os arquivos a partir de um `.zip`** (apaga `UPLOAD_FOLDER` e extrai o zip no lugar — espelho exato do backup) |

⚠️ Trocar a senha de um usuário **não revoga** o token de API dele. Se precisar revogar acesso imediatamente, desative o usuário — isso invalida o token na próxima chamada.

⚠️ **Ações reais de publicação** (`POST /api/v1/deploy/rpz`, `POST /api/v1/deploy/ip-routes`, `POST /api/v1/offices/<id>/deploy-ips`, `POST /api/v1/offices/<id>/deploy-expired-ips-delete`) exigem `{"confirm": true}` no corpo da requisição — sem isso, respondem `400` sem publicar nada. Todas respeitam o mesmo lock de publicação global (`PUBLISH_LOCK_TIMEOUT_MINUTES`): se já houver uma publicação em andamento, respondem `409`.

⚠️ `deploy-ips` e `deploy-expired-ips-delete` (por ofício) são **assíncronos**: a resposta (`202`) retorna imediatamente com `deployment_id` e `status: "running"` — o resultado final (sucesso ou erro) só fica disponível depois, consultando `GET /api/v1/deployments/<id>` (o `frontend` faz polling automático). Já `deploy/rpz` e `deploy/ip-routes` (gerais) são **síncronos**: só respondem quando o SSH terminar.

⚠️ `DELETE /api/v1/offices/<id>` é **irreversível**: domínios e IPs exclusivos deste ofício são apagados; os que também pertencem a outros ofícios são preservados (apenas desvinculados). Por segurança, exige `{"confirm_office_number": "<número exato do ofício>"}` no corpo da requisição — sem isso, ou com o número errado, responde `400` sem excluir nada.

⚠️ `POST /api/v1/backup/database/restore` e `POST /api/v1/backup/files/restore` são **irreversíveis** e substituem completamente o estado atual pelo do arquivo enviado (`multipart/form-data`, campo `file`). Exigem `confirm_phrase=RESTAURAR` no corpo — sem isso, ou com o texto errado, respondem `400` sem restaurar nada. Usam o mesmo lock global de publicação (`PUBLISH_LOCK_TIMEOUT_MINUTES`): se já houver uma publicação/restauração em andamento, respondem `409`.

Exemplo (criar ofício):

```bash
curl -X POST -H "X-API-Key: sua-chave" -H "Content-Type: application/json" \
  -d '{"office_number": "OF-002", "process_number": "53500.099328/2024-86"}' \
  "http://localhost:8000/api/v1/offices"
```

Exemplo (alterar número do ofício):

```bash
curl -X PATCH -H "X-API-Key: sua-chave" -H "Content-Type: application/json" \
  -d '{"office_number": "OF-002-B"}' \
  "http://localhost:8000/api/v1/offices/1"
```

Exemplo (excluir ofício):

```bash
curl -X DELETE -H "X-API-Key: sua-chave" -H "Content-Type: application/json" \
  -d '{"confirm_office_number": "OF-002-B"}' \
  "http://localhost:8000/api/v1/offices/1"
```

Exemplo (publicar RPZ):

```bash
curl -X POST -H "X-API-Key: sua-chave" -H "Content-Type: application/json" \
  -d '{"confirm": true}' \
  "http://localhost:8000/api/v1/deploy/rpz"
```

Exemplo (consulta):

```bash
curl -H "X-API-Key: sua-chave" "http://localhost:8000/api/v1/offices?q=53500&page=1"
```

Novos endpoints devem seguir o mesmo padrão: blueprint em `app/api/routes.py`, protegidos por `@require_auth` (`app/api/auth.py`).

## Publicação RPZ via SSH

Preencha no `.env` os dados do servidor BIND:

```env
SSH_HOST=10.0.0.10
SSH_PORT=22
SSH_USER=usuario
SSH_PASSWORD=
SSH_KEY_PATH=/run/secrets/bind_ssh_key
SSH_KEY_PASSPHRASE=
SSH_STRICT_HOST_KEY_CHECKING=false
SUDO_PASSWORD=
RPZ_REMOTE_PATH=/var/cache/bind/db.rpz.zone
RPZ_RELOAD_COMMAND=sudo service bind9 reload
RPZ_TEST_RESOLVER=127.0.0.1
```

O usuário SSH precisa conseguir atualizar o arquivo da zona e recarregar o BIND. O comando exato é configurado por `RPZ_RELOAD_COMMAND`.

## Publicação de IPs no(s) roteador(es)

As credenciais SSH (compartilhadas por todos os roteadores) ficam no `.env`:

```env
ROUTER_SSH_PORT=22
ROUTER_SSH_USER=usuario
ROUTER_SSH_PASSWORD=
ROUTER_SSH_KEY_PATH=/run/secrets/bind_ssh_key
ROUTER_SSH_KEY_PASSPHRASE=
```

A lista de roteadores (nome + IP) e os comandos IPv4/IPv6 usados para publicar as rotas discard são cadastrados em **Geral > Parâmetros**, na seção "Publicação de bloqueios (SSH)". Por padrão o comando é:

```text
set routing-instances BLOQUEADOS routing-options static route {address} discard
set routing-instances BLOQUEADOS routing-options rib BLOQUEADOS.inet6.0 static route {address} discard
```

O comando de remoção é gerado automaticamente trocando `set` por `delete`. Se nenhum roteador for cadastrado em Parâmetros, o sistema usa `ROUTER_SSH_HOST` do `.env` como roteador único (comportamento legado).

O sistema gera a configuração de rotas discard para os IPs ativos e publica em todos os roteadores cadastrados, registrando o resultado (por roteador) no histórico de publicações. O nome do primeiro roteador da lista também é usado como "Roteador de Borda" no texto gerado em **Comunicados**.

## Volumes Docker

O volume do MySQL é nomeado explicitamente para não depender do nome da pasta do projeto:

```yaml
volumes:
  mysql_data:
    external: true
    name: oficios-rpz_mysql_data
```

Em produção, antes de trocar o nome de um volume com dados, pare a stack e copie o volume antigo para o novo:

```bash
docker compose down
docker run --rm -v volume_antigo:/from:ro -v oficios-rpz_mysql_data:/to mysql:8.4 sh -c "cp -a /from/. /to/"
docker compose up -d
```

Mantenha o volume antigo por alguns dias como rollback. Para remover depois, faça isso apenas após validar que o sistema subiu e os dados estão corretos.

## Backup recomendado

Em **Geral > Backup**, qualquer usuário autenticado pode baixar pelo navegador:

- um dump do banco (`mysqldump --single-transaction`, schema + dados) em `.sql`;
- um `.zip` com todos os arquivos anexados aos ofícios (intimações e listas importadas).

Essa mesma função está disponível via API (`GET /api/v1/backup/database` e `GET /api/v1/backup/files`, ver tabela de endpoints), útil para automatizar backups periódicos fora do container. O timeout do dump é configurável via `DB_BACKUP_TIMEOUT_SECONDS` (padrão 300s).

Na mesma tela, também é possível **restaurar** um backup anterior:

- **Restaurar banco**: envia um `.sql` (o mesmo formato gerado pelo backup); apaga e recria todas as tabelas com o conteúdo do arquivo, substituindo os dados atuais.
- **Restaurar arquivos**: envia um `.zip` (o mesmo formato gerado pelo backup); apaga a pasta de uploads atual e extrai o zip no lugar — é um espelho exato do backup, então arquivos anexados depois do backup são perdidos.

Ambas exigem digitar "RESTAURAR" para confirmar, são irreversíveis e ficam registradas no histórico de publicações (**Log**) como `restore-database`/`restore-files`.

Antes de alterações em produção, também é possível gerar o dump diretamente no container do banco:

```bash
docker compose exec db mysqldump -u root -p --all-databases > backup.sql
```

Também mantenha backup dos diretórios configurados em `HOST_UPLOAD_PATH` e `HOST_SSH_KEY_PATH`.

## Observações

- PDFs digitalizados como imagem exigem OCR; o parser depende de texto pesquisável ou de planilhas estruturadas.
- A RPZ publicada inclui o domínio direto e o wildcard `*.dominio`.
- A publicação RPZ envia apenas domínios ativos e sem duplicidade.
- A publicação de IPs usa apenas IPs ativos.
- Itens com data de remoção vencida aparecem como expirados para orientar desbloqueio/remoção.
- Exclusões de ofício exigem confirmação digitando o número do ofício.
