import React, { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

const rootElement = document.getElementById('root');

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: 'Arial, sans-serif', color: '#16201b' }}>
          <h1>Erro ao carregar o PC Express AI CRM</h1>
          <p>Recarregue a pagina ou reinicie o servidor com npm run dev.</p>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: 16, border: '1px solid #ddd' }}>
            {String(this.state.error?.message ?? this.state.error)}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  createRoot(rootElement).render(
    <StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </StrictMode>,
  );
} catch (error) {
  rootElement.innerHTML = `
    <div style="padding: 32px; font-family: Arial, sans-serif; color: #16201b;">
      <h1>Erro ao carregar o PC Express AI CRM</h1>
      <p>Recarregue a pagina ou reinicie o servidor com npm run dev.</p>
      <pre style="white-space: pre-wrap; background: #fff; padding: 16px; border: 1px solid #ddd;">${String(
        error?.message ?? error,
      )}</pre>
    </div>
  `;
}
