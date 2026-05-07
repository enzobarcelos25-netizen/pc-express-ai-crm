# PC Express AI CRM

<p align="center">
  <strong>Landing page, diagnostico inteligente e mini CRM para captacao de clientes da PC Express.</strong>
</p>

<p align="center">
  <a href="https://pc-express-ai-crm.vercel.app/">Demo em producao</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-111?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7-111?style=for-the-badge&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/JavaScript-ESM-111?style=for-the-badge&logo=javascript" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Vercel-Deploy-111?style=for-the-badge&logo=vercel" alt="Vercel" />
</p>

## Visao geral

O PC Express AI CRM nasceu para resolver um problema real: transformar visitantes e contatos frios em leads organizados para uma loja de servicos de TI.

O app junta uma pagina comercial, um diagnostico guiado de problemas de computador, captura de lead, painel admin, automacoes e um cockpit de WhatsApp para trabalhar oportunidades de venda.

## Fluxo do produto

```txt
Visitante acessa a landing page
  -> responde o diagnostico
  -> recebe uma recomendacao automatica
  -> abre o WhatsApp com mensagem pronta
  -> lead fica salvo no CRM
  -> automacoes podem enviar dados para Supabase, n8n, Sheets e WhatsApp Cloud API
```

## Funcionalidades

- Landing page comercial para a PC Express.
- CTA direto para WhatsApp.
- Diagnostico rule-based para PC lento, HD/SSD, travamentos, virus, Office e uso principal.
- Resultado com problema detectado, explicacao e solucao recomendada.
- Persistencia local com `localStorage`.
- Painel admin com leads e status.
- API `/api/leads` preparada para sincronizar com servicos externos.
- API `/api/health` para checagem das integracoes configuradas.
- API `/api/cron-capture` para captacao automatica em cron da Vercel.
- Tela de automacao para testar integracoes.
- Cockpit de WhatsApp com fila, cadencia, follow-ups e status comercial.
- Assets reais da PC Express usados como prova social.

## Telas principais

| Rota | Papel |
| --- | --- |
| `/` | Landing page comercial |
| `/diagnostico` | Formulario de diagnostico do cliente |
| `/resultado` | Recomendacao gerada pelo diagnostico |
| `/admin` | Painel simples de leads |
| `/automacao` | Checagem de integracoes e captura automatica |
| `/cockpit` | Modo venda hoje com fila de WhatsApp |

## Stack

- React
- Vite
- JavaScript ESM
- CSS puro
- Lucide React
- Vercel Functions
- LocalStorage

## Estrutura

```txt
pc-express-ai-crm/
  api/
    cron-capture.js
    health.js
    leads.js
    whatsapp-webhook.js
  scripts/
  src/
    assets/
    pages/
      Admin.jsx
      Automacao.jsx
      Cockpit.jsx
      Diagnostico.jsx
      Home.jsx
      Resultado.jsx
    services/
    utils/
    App.jsx
    main.jsx
    styles.css
  vercel.json
```

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse:

```txt
http://127.0.0.1:5173
```

Build:

```bash
npm run build
```

## Automacoes e ambiente

As integracoes sao ativadas por variaveis de ambiente na Vercel. Sem essas variaveis, o app continua funcionando localmente com `localStorage`, mas as automacoes externas ficam pendentes.

Integracoes previstas:

- Supabase CRM
- n8n webhook
- Google Sheets via Apps Script
- WhatsApp Cloud API
- Cron secret para captacao automatica

## Cockpit de venda

O cockpit pode importar CSV manualmente ou consumir uma ponte local em:

```txt
http://127.0.0.1:8787/leads
```

Ele preserva status por telefone, evita retrabalho de leads ja abordados e cria follow-ups assistidos.

## Roadmap

- Login no painel admin.
- Banco de dados real para leads.
- Dashboard com metricas de conversao.
- Historico de atendimentos.
- Orcamento automatico.
- Diagnostico com IA em linguagem natural.
- Integracao completa com WhatsApp Cloud API.

## Status

MVP funcional publicado na Vercel e em evolucao para CRM real da PC Express.
