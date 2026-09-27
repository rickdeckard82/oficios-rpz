import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createUser, listUsers, toggleUser, updateUserPassword } from "../api/users.js";
import Badge from "../components/Badge.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { useToast } from "../components/Toast.jsx";

function emptyForm() {
  return { username: "", password: "", passwordConfirm: "" };
}

function PasswordRow({ user, onSubmit, busy }) {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (!password || password !== passwordConfirm) return;
    onSubmit(password);
    setPassword("");
    setPasswordConfirm("");
  }

  return (
    <form className="inline-password-form" onSubmit={handleSubmit}>
      <input
        type="password"
        placeholder="Nova senha"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Confirmar"
        autoComplete="new-password"
        value={passwordConfirm}
        onChange={(event) => setPasswordConfirm(event.target.value)}
        required
      />
      <button className="ghost" type="submit" disabled={busy}>
        Salvar
      </button>
    </form>
  );
}

export default function UsersPage() {
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState("");
  const [userToToggle, setUserToToggle] = useState(null);
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users"],
    queryFn: listUsers,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: (user) => {
      notify(`Usuário ${user.username} criado.`, "success");
      setForm(emptyForm());
      invalidate();
    },
    onError: (err) => setFormError(err.message),
  });

  const passwordMutation = useMutation({
    mutationFn: ({ id, password }) => updateUserPassword(id, password),
    onSuccess: () => notify("Senha atualizada.", "success"),
    onError: (err) => notify(err.message, "error"),
  });

  const toggleMutation = useMutation({
    mutationFn: (user) => toggleUser(user.id),
    onSuccess: (user) => {
      notify(`Usuário ${user.username} ${user.active ? "ativado" : "desativado"}.`, "success");
      setUserToToggle(null);
      invalidate();
    },
    onError: (err) => {
      notify(err.message, "error");
      setUserToToggle(null);
    },
  });

  function handleCreate(event) {
    event.preventDefault();
    setFormError("");
    if (!form.username.trim()) {
      setFormError("Informe o usuário.");
      return;
    }
    if (!form.password) {
      setFormError("Informe a senha.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setFormError("As senhas não coincidem.");
      return;
    }
    createMutation.mutate({ username: form.username.trim(), password: form.password });
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Usuários</h1>
          <p>Cadastre os operadores do sistema e atualize as senhas de acesso.</p>
        </div>
        <div className="actions">
          <Link className="button ghost" to="/general">
            Voltar
          </Link>
        </div>
      </div>

      <form className="upload-panel office-create-form" onSubmit={handleCreate}>
        <h2>Novo usuário</h2>
        {formError && (
          <div className="messages">
            <div className="message error">{formError}</div>
          </div>
        )}
        <div className="form-grid">
          <label>
            Usuário
            <input
              autoComplete="off"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              required
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>
          <label>
            Confirmar senha
            <input
              type="password"
              autoComplete="new-password"
              value={form.passwordConfirm}
              onChange={(event) => setForm({ ...form, passwordConfirm: event.target.value })}
              required
            />
          </label>
        </div>
        <button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Criando…" : "Criar usuário"}
        </button>
      </form>

      {isError && (
        <div className="messages">
          <div className="message error">{error.message}</div>
        </div>
      )}

      {isLoading ? (
        <div className="page-loading">Carregando…</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Alterar senha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
            {data.items.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>
                  <Badge variant={user.active ? "success" : "error"}>
                    {user.active ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td>{new Date(user.created_at).toLocaleString("pt-BR")}</td>
                <td>
                  <PasswordRow
                    user={user}
                    busy={passwordMutation.isPending}
                    onSubmit={(password) => passwordMutation.mutate({ id: user.id, password })}
                  />
                </td>
                <td className="right">
                  <button className="ghost" type="button" onClick={() => setUserToToggle(user)}>
                    {user.active ? "Desativar" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ConfirmDialog
        open={Boolean(userToToggle)}
        title={userToToggle?.active ? "Desativar usuário" : "Ativar usuário"}
        message={
          userToToggle
            ? `${userToToggle.active ? "Desativar" : "Ativar"} o usuário ${userToToggle.username}?`
            : ""
        }
        confirmLabel="Confirmar"
        danger={Boolean(userToToggle?.active)}
        busy={toggleMutation.isPending}
        onConfirm={() => toggleMutation.mutate(userToToggle)}
        onCancel={() => setUserToToggle(null)}
      />
    </div>
  );
}
