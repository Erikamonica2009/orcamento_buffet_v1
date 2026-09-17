import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Erro não tratado na interface:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-page">
          <h1>Algo deu errado</h1>
          <p>Ocorreu um erro inesperado. Tente recarregar a página.</p>
          <a href="/">Voltar ao início</a>
        </main>
      );
    }
    return this.props.children;
  }
}
