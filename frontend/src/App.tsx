import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { CadastroPage } from "./pages/CadastroPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { MeusOrcamentosPage } from "./pages/cliente/MeusOrcamentosPage";

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
        <Route path="/admins" element={<p>Administradores</p>} />
        <Route path="/clientes" element={<p>Clientes</p>} />
        <Route path="/tipos-evento" element={<p>Tipos de evento</p>} />
        <Route path="/itens" element={<p>Itens</p>} />
        <Route path="/orcamentos" element={<p>Orçamentos</p>} />
        <Route path="/orcamentos/:id" element={<p>Detalhe do orçamento</p>} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
