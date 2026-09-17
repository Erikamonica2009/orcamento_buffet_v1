import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useIdleLogout } from "../hooks/useIdleLogout";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

export function AppLayout() {
  const { user, logout } = useAuth();
  useIdleLogout(IDLE_TIMEOUT_MS);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <p>{user?.nome}</p>
        <nav>
          {user?.role === "cliente" && <NavLink to="/meus-orcamentos">Meus orçamentos</NavLink>}
          {user?.role === "admin" && (
            <>
              <p className="nav-group">Cadastros</p>
              <NavLink to="/admins">Administradores</NavLink>
              <NavLink to="/clientes">Clientes</NavLink>
              <NavLink to="/tipos-evento">Tipos de evento</NavLink>
              <NavLink to="/itens">Itens</NavLink>
              <p className="nav-group">Orçamentos</p>
              <NavLink to="/orcamentos">Orçamentos</NavLink>
            </>
          )}
        </nav>
        <button className="btn btn-secondary" onClick={() => logout()}>
          Sair
        </button>
      </aside>
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}
