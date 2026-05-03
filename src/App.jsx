import React, { useMemo, useState } from 'react';
import { Admin } from './pages/Admin.jsx';
import { Diagnostico } from './pages/Diagnostico.jsx';
import { Home } from './pages/Home.jsx';
import { Resultado } from './pages/Resultado.jsx';
import { getLeads } from './services/leads.js';

const pages = {
  home: Home,
  diagnostico: Diagnostico,
  resultado: Resultado,
  admin: Admin,
};

export default function App() {
  const [route, setRoute] = useState('home');
  const [diagnosis, setDiagnosis] = useState(null);
  const [leadCount, setLeadCount] = useState(() => getLeads().length);

  const Page = pages[route] ?? Home;

  const nav = useMemo(
    () => ({
      goHome: () => setRoute('home'),
      goDiagnostic: () => setRoute('diagnostico'),
      goAdmin: () => setRoute('admin'),
      finishDiagnostic: (result) => {
        setDiagnosis(result);
        setLeadCount(getLeads().length);
        setRoute('resultado');
      },
      refreshLeads: () => setLeadCount(getLeads().length),
    }),
    [],
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={nav.goHome}>
          <span className="brand-mark">PC</span>
          <span>
            <strong>PC Express</strong>
            <small>@pc_express_oficial25</small>
          </span>
        </button>

        <nav className="nav-actions" aria-label="Navegacao principal">
          <button type="button" onClick={nav.goDiagnostic}>
            Diagnostico
          </button>
          <button type="button" onClick={nav.goAdmin}>
            Admin
            {leadCount > 0 && <span className="badge">{leadCount}</span>}
          </button>
        </nav>
      </header>

      <Page nav={nav} diagnosis={diagnosis} />
    </main>
  );
}
