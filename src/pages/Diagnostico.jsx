import { ClipboardCheck, Send } from 'lucide-react';
import React, { useState } from 'react';
import { analyzeDiagnosis } from '../utils/diagnosis.js';
import { saveLead } from '../services/leads.js';

const initialForm = {
  nome: '',
  telefone: '',
  lentoAoLigar: 'sim',
  travaProgramas: 'sim',
  armazenamento: 'hd',
  virusPopups: 'nao',
  precisaOffice: 'nao',
  uso: 'basico',
  consent: false,
};

export function Diagnostico({ nav }) {
  const [form, setForm] = useState(initialForm);

  function updateField(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  function submit(event) {
    event.preventDefault();
    const result = analyzeDiagnosis(form);
    const lead = saveLead({
      nome: form.nome.trim() || 'Cliente sem nome',
      telefone: form.telefone.trim(),
      problema: result.problem,
      recomendacao: result.recommendation,
      explicacao: result.explanation,
      status: 'novo',
      consent: form.consent,
      answers: form,
    });

    nav.finishDiagnostic({ ...result, lead });
  }

  return (
    <section className="diagnostic-layout">
      <div className="section-heading">
        <ClipboardCheck size={28} />
        <div>
          <p className="eyebrow">Diagnostico inteligente</p>
          <h1>Responda em menos de um minuto</h1>
        </div>
      </div>

      <form className="diagnostic-form" onSubmit={submit}>
        <label>
          Nome
          <input name="nome" value={form.nome} onChange={updateField} placeholder="Ex.: Ana Silva" />
        </label>

        <label>
          WhatsApp
          <input
            name="telefone"
            value={form.telefone}
            onChange={updateField}
            placeholder="Ex.: (34) 99999-9999"
          />
        </label>

        <Question
          label="PC demora pra ligar?"
          name="lentoAoLigar"
          value={form.lentoAoLigar}
          onChange={updateField}
          options={[
            ['sim', 'Sim'],
            ['nao', 'Nao'],
          ]}
        />

        <Question
          label="Trava ao abrir programas?"
          name="travaProgramas"
          value={form.travaProgramas}
          onChange={updateField}
          options={[
            ['sim', 'Sim'],
            ['nao', 'Nao'],
          ]}
        />

        <Question
          label="Usa HD ou SSD?"
          name="armazenamento"
          value={form.armazenamento}
          onChange={updateField}
          options={[
            ['hd', 'HD'],
            ['ssd', 'SSD'],
            ['nao_sei', 'Nao sei'],
          ]}
        />

        <Question
          label="Tem virus, anuncios ou pop-ups?"
          name="virusPopups"
          value={form.virusPopups}
          onChange={updateField}
          options={[
            ['sim', 'Sim'],
            ['nao', 'Nao'],
          ]}
        />

        <Question
          label="Precisa instalar ou ativar Office?"
          name="precisaOffice"
          value={form.precisaOffice}
          onChange={updateField}
          options={[
            ['sim', 'Sim'],
            ['nao', 'Nao'],
          ]}
        />

        <Question
          label="Uso principal"
          name="uso"
          value={form.uso}
          onChange={updateField}
          options={[
            ['basico', 'Basico'],
            ['trabalho', 'Trabalho'],
            ['jogos', 'Jogos'],
          ]}
        />

        <label
          style={{
            alignItems: 'flex-start',
            background: 'rgba(124, 255, 107, 0.08)',
            border: '1px solid rgba(124, 255, 107, 0.2)',
            borderRadius: 8,
            display: 'flex',
            gap: 10,
            gridColumn: '1 / -1',
            padding: 12,
          }}
        >
          <input name="consent" type="checkbox" checked={form.consent} onChange={updateField} />
          <span>Aceito receber contato da PC Express pelo WhatsApp sobre este diagnostico.</span>
        </label>

        <button className="primary-button form-submit" type="submit">
          Gerar resultado
          <Send size={18} />
        </button>
      </form>
    </section>
  );
}

function Question({ label, name, value, onChange, options }) {
  return (
    <fieldset className="question">
      <legend>{label}</legend>
      <div className="segmented">
        {options.map(([optionValue, text]) => (
          <label className={value === optionValue ? 'selected' : ''} key={optionValue}>
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={value === optionValue}
              onChange={onChange}
            />
            {text}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
