import React from 'react';
import { ArrowLeft, MessageCircle, Sparkles } from 'lucide-react';
import { createWhatsAppUrl } from '../services/whatsapp.js';

export function Resultado({ nav, diagnosis }) {
  if (!diagnosis) {
    return (
      <section className="empty-state">
        <h1>Nenhum diagnostico gerado ainda</h1>
        <button className="primary-button" type="button" onClick={nav.goDiagnostic}>
          Fazer diagnostico
        </button>
      </section>
    );
  }

  const message = [
    'Ola! Fiz o diagnostico no site da PC Express.',
    `Problema detectado: ${diagnosis.problem}.`,
    `Solucao recomendada: ${diagnosis.recommendation}.`,
    'Gostaria de resolver meu problema.',
  ].join(' ');

  return (
    <section className="result-layout">
      <div className="result-card">
        <Sparkles size={32} />
        <p className="eyebrow">Resultado do diagnostico</p>
        <h1>{diagnosis.problem}</h1>
        <p>{diagnosis.explanation}</p>

        <div className="recommendation-box">
          <span>Solucao recomendada</span>
          <strong>{diagnosis.recommendation}</strong>
        </div>

        <div className="hero-actions">
          <a className="primary-button" href={createWhatsAppUrl(message)} target="_blank" rel="noreferrer">
            <MessageCircle size={18} />
            Chamar no WhatsApp
          </a>
          <button className="secondary-button" type="button" onClick={nav.goDiagnostic}>
            <ArrowLeft size={18} />
            Refazer
          </button>
        </div>
      </div>
    </section>
  );
}
