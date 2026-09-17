import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { CadastroPage } from "./pages/CadastroPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { MeusOrcamentosPage } from "./pages/cliente/MeusOrcamentosPage";
import { AdminsPage } from "./pages/admin/AdminsPage";
import { ClientesPage } from "./pages/admin/ClientesPage";
import { TiposEventoPage } from "./pages/admin/TiposEventoPage";
import { ItensPage } from "./pages/admin/ItensPage";
import { OrcamentosListPage } from "./pages/admin/OrcamentosListPage";
import { OrcamentoDetailPage } from "./pages/admin/OrcamentoDetailPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />

      <Route
        element={
          <ProtectedRoute role="cliente">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/meus-orcamentos" element={<MeusOrcamentosPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute role="admin">
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admins" element={<AdminsPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/tipos-evento" element={<TiposEventoPage />} />
        <Route path="/itens" element={<ItensPage />} />
        <Route path="/orcamentos" element={<OrcamentosListPage />} />
        <Route path="/orcamentos/:id" element={<OrcamentoDetailPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
