# PC Express AI CRM

Landing page + diagnostico inteligente + mini CRM para a **PC Express**, loja de solucoes em TI focada em formatacao, otimizacao, limpeza, upgrades e atendimento rapido via WhatsApp.

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=111)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=fff)
![JavaScript](https://img.shields.io/badge/JavaScript-ESM-F7DF1E?style=for-the-badge&logo=javascript&logoColor=111)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000?style=for-the-badge&logo=vercel)

## Visao Geral

O projeto transforma a captacao manual de clientes de manutencao de computadores em uma experiencia digital simples:

- O visitante chega pela landing page.
- Ve oferta, servicos e provas sociais reais da loja.
- Faz um diagnostico guiado sobre o problema do PC.
- Recebe uma recomendacao automatica.
- E direcionado para o WhatsApp com mensagem pronta.
- O lead fica salvo no painel admin via LocalStorage.

## Demo

Deploy em producao:

[https://documenta-o-t-cnica-pc-express.vercel.app](https://documenta-o-t-cnica-pc-express.vercel.app)

## Funcionalidades

- Landing page comercial para a PC Express.
- CTA direto para WhatsApp: `(34) 98403-3975`.
- Diagnostico rule-based para problemas comuns:
  - PC lento
  - HD / SSD
  - Travamentos
  - Virus e pop-ups
  - Office
  - Uso basico, trabalho ou jogos
- Resultado com problema detectado e solucao recomendada.
- Mensagem automatica para WhatsApp.
- Painel admin com leads.
- Status do lead: `novo`, `contato`, `fechado`.
- Persistencia local com `localStorage`.
- API Vercel em `/api/leads` para sincronizar leads com Supabase, n8n, Google Sheets e WhatsApp Cloud API.
- Captura publica automatica em `/api/cron-capture`, agendada no `vercel.json`.
- Tela `Automacao` para checar integracoes e rodar captura de teste.
- Tela `Cockpit` para importar CSV de leads, montar fila de WhatsApp e controlar cadencia localmente.
- Design responsivo.
- Assets reais da loja usados como prova social.

## Automacao em producao

Configure as variaveis da `.env.example` na Vercel.

Fluxo automatico:

```txt
Diagnostico do site -> /api/leads -> Supabase / n8n / Google Sheets / WhatsApp Cloud API
Cron diario Vercel -> /api/cron-capture -> Supabase / n8n / Google Sheets
```

Teste apos deploy:

```bash
curl -X POST https://pc-express-ai-crm.vercel.app/api/leads \
  -H "content-type: application/json" \
  -d "{\"nome\":\"Teste\",\"telefone\":\"34984033975\",\"consent\":true,\"problema\":\"PC lento\",\"recomendacao\":\"Formatacao + otimizacao\"}"
```

Para Google Sheets, use o arquivo `google-apps-script-webhook.js` em uma planilha publicada como Web App e configure a URL como `GOOGLE_APPS_SCRIPT_URL`.

## Cockpit de venda

A tela `Cockpit` nao embute telefones no deploy. Importe o CSV `ataque-hoje-telefone-pronto.csv` no navegador para carregar a fila. Os dados ficam no `localStorage` do navegador, com mensagem pronta, link para WhatsApp, controle de enviado/pulado e cadencia de 6 minutos.

## Stack

- React
- Vite
- JavaScript
- CSS puro
- Lucide React
- LocalStorage
- Vercel

## Estrutura

```txt
pc-express-ai-crm/
├── src/
│   ├── assets/
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Diagnostico.jsx
│   │   ├── Resultado.jsx
│   │   └── Admin.jsx
│   ├── services/
│   │   ├── leads.js
│   │   └── whatsapp.js
│   ├── utils/
│   │   └── diagnosis.js
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
├── vercel.json
└── README.md
```

## Como Rodar

Instale as dependencias:

```bash
npm install
```

Rode o projeto:

```bash
npm run dev
```

Acesse:

```txt
http://127.0.0.1:5173
```

## Build

```bash
npm run build
```

## Deploy

O projeto esta configurado para Vercel:

```bash
npx vercel --prod
```

Configuracao usada:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

## Regra de Diagnostico

A logica principal fica em:

```txt
src/utils/diagnosis.js
```

Exemplo de decisao:

```js
if (hasHd && slow) {
  return {
    problem: 'Lentidao causada por HD e inicializacao pesada',
    recommendation: 'Upgrade para SSD + otimizacao do Windows',
  };
}
```

## Proximos Passos

- Backend com Node.js + Express.
- Banco PostgreSQL.
- Prisma ORM.
- Login no painel admin.
- Dashboard com metricas de conversao.
- Historico de atendimentos.
- Orcamento automatico.
- Integracao com OpenAI API para diagnostico em linguagem natural.

## Autor

Projeto criado para a **PC Express** como MVP comercial, portfolio e base para evolucao em CRM real.
