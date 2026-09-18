import { ComponentType, SVGProps, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useIdleLogout } from "../hooks/useIdleLogout";
import {
  IconAdmins,
  IconCadastros,
  IconChevron,
  IconClientes,
  IconItens,
  IconOrcamentos,
  IconTiposEvento,
} from "./icons";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem {
  to: string;
  label: string;
  icon: IconComponent;
}

interface NavGroup {
  label: string;
  icon: IconComponent;
  items: NavItem[];
}

const ADMIN_GROUPS: NavGroup[] = [
  {
    label: "Cadastros",
    icon: IconCadastros,
    items: [
      { to: "/admins", label: "Administradores", icon: IconAdmins },
      { to: "/clientes", label: "Clientes", icon: IconClientes },
      { to: "/tipos-evento", label: "Tipos de evento", icon: IconTiposEvento },
      { to: "/itens", label: "Itens", icon: IconItens },
    ],
  },
  {
    label: "Orçamentos",
    icon: IconOrcamentos,
    items: [{ to: "/orcamentos", label: "Lista de Orçamentos", icon: IconOrcamentos }],
  },
];

function navItemClassName({ isActive }: { isActive: boolean }) {
  return isActive ? "nav-item active" : "nav-item";
}

function NavItemLink({ item }: { item: NavItem }) {
  const ItemIcon = item.icon;
  return (
    <NavLink to={item.to} className={navItemClassName}>
      <ItemIcon className="nav-icon" />
      <span>{item.label}</span>
    </NavLink>
  );
}

function NavGroupSection({ group }: { group: NavGroup }) {
  const [expanded, setExpanded] = useState(true);
  const GroupIcon = group.icon;

  return (
    <div className="nav-section">
      <button
        type="button"
        className="nav-group-toggle"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <GroupIcon className="nav-icon" />
        <span>{group.label}</span>
        <IconChevron className={expanded ? "nav-chevron nav-chevron-open" : "nav-chevron"} />
      </button>
      {expanded && (
        <div className="nav-group-items">
          {group.items.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  useIdleLogout(IDLE_TIMEOUT_MS);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <img src="/img/logo.png" alt="Buffet Celebra" className="sidebar-logo" />
        <p className="sidebar-user">{user?.nome}</p>
        <nav>
          {user?.role === "cliente" && (
            <NavItemLink item={{ to: "/meus-orcamentos", label: "Meus orçamentos", icon: IconOrcamentos }} />
          )}
          {user?.role === "admin" &&
            ADMIN_GROUPS.map((group) => <NavGroupSection key={group.label} group={group} />)}
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
