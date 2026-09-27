import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getParameterSettings, updateParameterSettings } from "../api/settings.js";
import FieldArray from "../components/FieldArray.jsx";
import RouterFieldArray from "../components/RouterFieldArray.jsx";
import { useToast } from "../components/Toast.jsx";

const DEFAULT_ROUTER_COMMAND_IPV4 =
  "set routing-instances BLOQUEADOS routing-options static route {address} discard";
const DEFAULT_ROUTER_COMMAND_IPV6 =
  "set routing-instances BLOQUEADOS routing-options rib BLOQUEADOS.inet6.0 static route {address} discard";

function emptyForm() {
  return {
    dns_primary: "",
    dns_secondary: "",
    extra_dns_servers: [],
    publish_routers: [],
    router_command_ipv4: DEFAULT_ROUTER_COMMAND_IPV4,
    router_command_ipv6: DEFAULT_ROUTER_COMMAND_IPV6,
  };
}

export default function ParameterSettingsPage() {
  const [form, setForm] = useState(emptyForm());
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["parameter-settings"],
    queryFn: getParameterSettings,
  });

  useEffect(() => {
    if (data) {
      setForm({ ...emptyForm(), ...data });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateParameterSettings,
    onSuccess: (result) => {
      notify("Parâmetros salvos.", "success");
      queryClient.setQueryData(["parameter-settings"], result);
    },
    onError: (err) => notify(err.message, "error"),
  });

  function handleChange(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    saveMutation.mutate(form);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Parâmetros</h1>
          <p>Cadastre os servidores DNS e os roteadores usados nas publicações de bloqueio.</p>
        </div>
        <div className="actions">
          <Link className="button ghost" to="/general">
            Voltar
          </Link>
        </div>
      </div>

      {isError && (
        <div className="messages">
          <div className="message error">{error.message}</div>
        </div>
      )}

      {isLoading ? (
        <div className="page-loading">Carregando…</div>
      ) : (
        <form className="upload-panel company-form" onSubmit={handleSubmit}>
          <h2>Servidores DNS</h2>
          <div className="form-grid">
            <label>
              DNS primário
              <input
                autoComplete="off"
                value={form.dns_primary}
                onChange={(event) => handleChange("dns_primary", event.target.value)}
              />
            </label>
            <label>
              DNS secundário
              <input
                autoComplete="off"
                value={form.dns_secondary}
                onChange={(event) => handleChange("dns_secondary", event.target.value)}
              />
            </label>
          </div>

          <FieldArray
            title="DNS adicionais"
            addLabel="Adicionar DNS"
            placeholder="Servidor DNS"
            values={form.extra_dns_servers}
            onChange={(values) => handleChange("extra_dns_servers", values)}
          />

          <h2>Publicação de bloqueios (SSH)</h2>
          <p>
            Roteadores para os quais as rotas discard são publicadas ao bloquear/desbloquear IPs. As
            credenciais SSH continuam configuradas no arquivo .env (ROUTER_SSH_USER,
            ROUTER_SSH_PASSWORD/ROUTER_SSH_KEY_PATH) e são usadas para todos os roteadores desta lista.
            O nome do primeiro roteador da lista é usado no texto de comunicado como "Roteador de Borda".
          </p>

          <RouterFieldArray
            title="Roteadores de publicação"
            addLabel="Adicionar roteador"
            values={form.publish_routers}
            onChange={(values) => handleChange("publish_routers", values)}
          />

          <div className="form-grid">
            <label>
              Comando IPv4 (use {"{address}"} no lugar do IP/prefixo)
              <input
                autoComplete="off"
                value={form.router_command_ipv4}
                onChange={(event) => handleChange("router_command_ipv4", event.target.value)}
              />
            </label>
            <label>
              Comando IPv6 (use {"{address}"} no lugar do IP/prefixo)
              <input
                autoComplete="off"
                value={form.router_command_ipv6}
                onChange={(event) => handleChange("router_command_ipv6", event.target.value)}
              />
            </label>
          </div>
          <p>O comando de remoção é gerado automaticamente trocando "set" por "delete" no início do comando acima.</p>

          <button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvando…" : "Salvar parâmetros"}
          </button>
        </form>
      )}
    </div>
  );
}
