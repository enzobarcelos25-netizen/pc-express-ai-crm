import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Cpu,
  Gauge,
  HardDrive,
  MessageCircle,
  MonitorCog,
  ShieldCheck,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import feedbackImage from '../assets/pc-express-feedback.webp';
import flyerPromo from '../assets/pc-express-flyer-promo.jpeg';
import saleImage from '../assets/pc-express-venda-rx580.jpeg';
import setupImage from '../assets/pc-express-setup-roxo.webp';
import { createWhatsAppUrl } from '../services/whatsapp.js';

const services = [
  ['Formatacao completa', 'Sistema limpo, drivers, programas essenciais e otimizacao fina.', MonitorCog],
  ['PC lento', 'Diagnostico de boot, HD/SSD, memoria, inicializacao e travamentos.', Gauge],
  ['Virus e seguranca', 'Remocao de ameacas, pop-ups, extensoes suspeitas e revisao geral.', ShieldCheck],
  ['SSD e memoria', 'Upgrade para mais velocidade no boot, programas e multitarefa.', HardDrive],
  ['Setup gamer', 'Limpeza, airflow, organizacao visual, RGB e temperatura sob controle.', Cpu],
  ['Pecas e instalacao', 'Venda, instalacao e teste de placa de video, SSD e upgrades.', Wrench],
];

const proof = [
  {
    title: 'Setup entregue',
    text: 'Montagem gamer real com RGB roxo e acabamento limpo.',
    image: setupImage,
    label: 'resultado',
  },
  {
    title: 'Feedback no WhatsApp',
    text: '"slk que diferenca" e "Show de bola garoto".',
    image: feedbackImage,
    label: 'cliente',
  },
  {
    title: 'Venda + instalacao',
    text: 'RX 580 8GB instalada, testada e entregue.',
    image: saleImage,
    label: 'upgrade',
  },
];

export function Home({ nav }) {
  const whatsappUrl = createWhatsAppUrl(
    'Ola! Vim pelo site da PC Express e quero deixar meu PC rapido.',
  );

  return (
    <section className="pro-home">
      <div className="pro-hero">
        <div className="pro-hero-copy">
          <p className="pro-kicker">PC Express | Solucoes em TI</p>
          <h1>Seu PC rapido, limpo e pronto pra render.</h1>
          <p>
            Formatacao, limpeza, otimizacao, remocao de virus e upgrades com
            atendimento direto no WhatsApp. Do PC travando ao setup com cara de vitrine.
          </p>

          <div className="pro-hero-actions">
            <a className="pro-primary" href={whatsappUrl} target="_blank" rel="noreferrer">
              Chamar no WhatsApp
              <MessageCircle size={19} />
            </a>
            <button className="pro-secondary" type="button" onClick={nav.goDiagnostic}>
              Fazer diagnostico
              <Zap size={18} />
            </button>
          </div>

          <div className="pro-trust">
            <span>Atendimento rapido</span>
            <span>Servico com garantia</span>
            <span>(34) 98403-3975</span>
          </div>
        </div>

        <div className="pro-hero-media">
          <img src={setupImage} alt="Setup gamer PC Express com RGB roxo" />
          <div className="pro-media-card">
            <strong>Setup real da PC Express</strong>
            <span>Limpeza, organizacao e acabamento que vende no visual.</span>
          </div>
        </div>
      </div>

      <div className="pro-offer">
        <div className="pro-offer-copy">
          <p className="pro-kicker">Promocao da semana</p>
          <h2>Formatacao completa com limpeza e otimizacao.</h2>
          <div className="pro-price">
            <span>por apenas</span>
            <strong>R$ 80,00</strong>
          </div>
          <p>
            Ideal para PC lento, travando, com virus ou precisando ficar pronto
            para estudo, trabalho e jogos.
          </p>
          <a className="pro-primary" href={whatsappUrl} target="_blank" rel="noreferrer">
            Quero aproveitar
            <ArrowRight size={18} />
          </a>
        </div>
        <img src={flyerPromo} alt="Promocao PC Express formatacao completa R$80" />
      </div>

      <div className="pro-services">
        <div className="pro-section-heading">
          <p className="pro-kicker">Servicos principais</p>
          <h2>Uma loja pequena com apresentacao de produto grande.</h2>
        </div>

        <div className="pro-service-grid">
          {services.map(([title, text, Icon]) => (
            <article className="pro-service" key={title}>
              <Icon size={24} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="pro-proof">
        <div className="pro-section-heading">
          <p className="pro-kicker">Prova social real</p>
          <h2>Foto, feedback e venda. O cliente ve que acontece de verdade.</h2>
        </div>

        <div className="pro-proof-grid">
          {proof.map((item) => (
            <article className="pro-proof-card" key={item.title}>
              <img src={item.image} alt={`${item.title} PC Express`} />
              <div>
                <span>{item.label}</span>
                <strong>{item.title}</strong>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="pro-diagnostic">
        <div>
          <Sparkles size={26} />
          <p className="pro-kicker">Diagnostico inteligente</p>
          <h2>Transforme visitante em lead antes mesmo de chamar.</h2>
          <p>
            O cliente responde perguntas simples, recebe uma recomendacao e ja
            cai no WhatsApp com a mensagem pronta.
          </p>
        </div>
        <button className="pro-primary" type="button" onClick={nav.goDiagnostic}>
          Iniciar diagnostico
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="pro-footer-cta">
        <div>
          <h2>PC lento hoje, cliente chamando agora.</h2>
          <p>Fale com a PC Express pelo WhatsApp: (34) 98403-3975.</p>
        </div>
        <a className="pro-primary" href={whatsappUrl} target="_blank" rel="noreferrer">
          Abrir WhatsApp
          <CheckCircle2 size={18} />
        </a>
      </div>
    </section>
  );
}
