import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import Nav from "./Nav.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-page">
      <header className="topbar">
        <Link className="brand" to="/dashboard">
          <img src="/logo.png" alt="Ofícios RPZ" />
          Ofícios RPZ.
        </Link>
        <Nav />
        <div className="user-menu">
          {user && <span>{user.username}</span>}
          <button type="button" className="ghost compact" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>
      <div className="container">
        <Outlet />
      </div>
      <footer className="site-footer">© 2026 Oficios RPZ. v0.2.0</footer>
    </div>
  );
}
