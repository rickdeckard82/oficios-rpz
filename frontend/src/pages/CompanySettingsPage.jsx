import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCompanySettings, updateCompanySettings } from "../api/settings.js";
import { useToast } from "../components/Toast.jsx";

const FIELDS = [
  { name: "company_name", label: "Nome da Empresa", autoComplete: "organization" },
  { name: "cnpj", label: "CNPJ" },
  { name: "asn", label: "ASN" },
  { name: "address_street", label: "Logradouro", autoComplete: "address-line1" },
  { name: "address_number", label: "Número", autoComplete: "address-line2" },
  { name: "address_complement", label: "Complemento", autoComplete: "address-line3" },
  { name: "address_neighborhood", label: "Bairro", autoComplete: "address-level3" },
  { name: "address_city", label: "Cidade", autoComplete: "address-level2" },
  { name: "address_state", label: "UF", autoComplete: "address-level1", maxLength: 2 },
  { name: "address_zip", label: "CEP", autoComplete: "postal-code" },
];

const ANATEL_FIELDS = [
  { name: "anatel_responsible_name", label: "Nome do responsável na ANATEL", autoComplete: "name" },
  { name: "anatel_responsible_phone", label: "Telefone", autoComplete: "tel" },
  { name: "anatel_responsible_email", label: "E-mail", type: "email", autoComplete: "email" },
];

const DUTY_FIELDS = [
  { name: "duty_phone", label: "Telefone do plantão", autoComplete: "tel" },
  { name: "duty_email", label: "E-mail", type: "email", autoComplete: "email" },
];

function emptyForm() {
  const form = {};
  for (const field of [...FIELDS, ...ANATEL_FIELDS, ...DUTY_FIELDS]) {
    form[field.name] = "";
  }
  return form;
}

export default function CompanySettingsPage() {
  const [form, setForm] = useState(emptyForm());
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["company-settings"],
    queryFn: getCompanySettings,
  });

  useEffect(() => {
    if (data) {
      setForm({ ...emptyForm(), ...data });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: (result) => {
      notify("Dados da empresa salvos.", "success");
      queryClient.setQueryData(["company-settings"], result);
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
          <h1>Empresa</h1>
          <p>Cadastre os dados institucionais e os contatos usados pelo sistema.</p>
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
          <h2>Dados da empresa</h2>
          <div className="form-grid">
            {FIELDS.map((field) => (
              <label key={field.name}>
                {field.label}
                <input
                  autoComplete={field.autoComplete}
                  maxLength={field.maxLength}
                  value={form[field.name] || ""}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                />
              </label>
            ))}
          </div>

          {data?.address && !data?.address_street && (
            <p className="form-note">Endereço antigo cadastrado: {data.address}</p>
          )}

          <h2>Responsável na ANATEL</h2>
          <div className="form-grid">
            {ANATEL_FIELDS.map((field) => (
              <label key={field.name}>
                {field.label}
                <input
                  type={field.type || "text"}
                  autoComplete={field.autoComplete}
                  value={form[field.name] || ""}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                />
              </label>
            ))}
          </div>

          <h2>Plantão</h2>
          <div className="form-grid">
            {DUTY_FIELDS.map((field) => (
              <label key={field.name}>
                {field.label}
                <input
                  type={field.type || "text"}
                  autoComplete={field.autoComplete}
                  value={form[field.name] || ""}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                />
              </label>
            ))}
          </div>

          <button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Salvando…" : "Salvar dados da empresa"}
          </button>
        </form>
      )}
    </div>
  );
}
