export function analyzeDiagnosis(answers) {
  const slow = answers.lentoAoLigar === 'sim' || answers.travaProgramas === 'sim';
  const hasHd = answers.armazenamento === 'hd';
  const unknownStorage = answers.armazenamento === 'nao_sei';
  const virus = answers.virusPopups === 'sim';
  const needsOffice = answers.precisaOffice === 'sim';
  const basicUse = answers.uso === 'basico';
  const gaming = answers.uso === 'jogos';

  if (virus) {
    return {
      problem: 'Possivel infeccao por virus ou adware',
      recommendation: needsOffice
        ? 'Remocao de virus + formatacao preventiva + instalacao do Office'
        : 'Remocao de virus + limpeza de navegador + revisao do sistema',
      explanation:
        'Pop-ups e anuncios geralmente indicam extensoes maliciosas, adware ou sistema comprometido.',
    };
  }

  if (hasHd && slow) {
    return {
      problem: 'Lentidao causada por HD e inicializacao pesada',
      recommendation: needsOffice
        ? 'Upgrade para SSD + otimizacao + instalacao do Office'
        : 'Upgrade para SSD + otimizacao do Windows',
      explanation:
        'HD mecanico costuma ser o principal gargalo em computadores lentos, principalmente ao ligar e abrir programas.',
    };
  }

  if (unknownStorage && slow) {
    return {
      problem: 'Lentidao com causa provavel em armazenamento ou sistema',
      recommendation: 'Diagnostico presencial/remoto + otimizacao + avaliacao de SSD',
      explanation:
        'Como o tipo de armazenamento nao foi identificado, o ideal e verificar disco, inicializacao e saude do Windows.',
    };
  }

  if (basicUse && slow) {
    return {
      problem: 'Sistema lento para tarefas do dia a dia',
      recommendation: needsOffice ? 'Formatacao + otimizacao + Office' : 'Formatacao + otimizacao',
      explanation:
        'Para uso basico, limpeza de sistema, remocao de programas desnecessarios e ajustes de inicializacao costumam resolver.',
    };
  }

  if (gaming && slow) {
    return {
      problem: 'Queda de desempenho em uso pesado',
      recommendation: 'Otimizacao de drivers + limpeza do sistema + avaliacao de upgrade',
      explanation:
        'Jogos e programas pesados exigem analise de memoria, armazenamento, temperatura e drivers.',
    };
  }

  return {
    problem: 'Computador funcional com ajustes recomendados',
    recommendation: needsOffice ? 'Instalacao do Office + revisao preventiva' : 'Revisao preventiva + limpeza de sistema',
    explanation:
      'Nao ha sinais fortes de falha grave, mas uma revisao ajuda a evitar lentidao futura e deixar o sistema organizado.',
  };
}
