import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import SiteFooter from "../components/SiteFooter.jsx";

export default function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") {
    const redirectTo = location.state?.from?.pathname || "/dashboard";
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(username, password);
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Usuário ou senha inválidos.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="container">
        <div className="login-shell">
          <div className="login-box">
            <div className="login-title">
              <img src="/logo.png" alt="Ofícios RPZ" />
              <h1>Ofícios RPZ</h1>
            </div>
            {error && (
              <div className="messages">
                <div className="message error">{error}</div>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <label>
                Usuário
                <input
                  type="text"
                  autoFocus
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <button type="submit" disabled={submitting}>
                {submitting ? "Entrando…" : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
