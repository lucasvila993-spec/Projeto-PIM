/*
 * NYLT - dados compartilhados entre o site dos pacientes e a recepcao (admin.html).
 * Usa as mesmas estruturas do nylt_agenda.c e grava no mesmo lugar que o admin
 * (localStorage, chave nylt_agenda_v1). As contas de acesso dos pacientes ficam
 * separadas (nylt_contas_v1) para nao mudar o formato dos arquivos .txt.
 */
const NYLT = (() => {
  const CHAVE = 'nylt_agenda_v1';
  const CHAVE_CONTAS = 'nylt_contas_v1';
  const CHAVE_SESSAO = 'nylt_sessao';

  const MAX_PACIENTES = 100, MAX_FILA = 50;
  const PROFISSIONAIS = ['Psicologia', 'Nutrição', 'Fisioterapia'];
  const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const HORARIOS = 8;          // 10h as 17h
  const PRIMEIRO_SOCIAL = 6;   // 16h e 17h sao do atendimento social
  const SITUACOES = ['Agendada', 'Confirmada', 'Compareceu', 'Faltou'];
  const AGENDADA = 0, CONFIRMADA = 1, COMPARECEU = 2, FALTOU = 3;

  const hora = h => 10 + h;
  const soDigitos = t => String(t || '').replace(/\D/g, '');
  const novaAgenda = () => PROFISSIONAIS.map(() => DIAS.map(() => Array(HORARIOS).fill(0)));

  function lerJSON(chave, padrao) {
    try { return JSON.parse(localStorage.getItem(chave)) || padrao; } catch (e) { return padrao; }
  }
  function gravarJSON(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); return true; } catch (e) { return false; }
  }

  function ler() {
    const d = lerJSON(CHAVE, {});
    return {
      pacientes: d.pacientes || [], fila: d.fila || [], agenda: d.agenda || novaAgenda(),
      presenca: d.presenca || novaAgenda(), historico: d.historico || []
    };
  }
  const gravar = d => gravarJSON(CHAVE, d);

  /* ---------- Regras (iguais ao programa em C) ---------- */
  function calcularPontuacao(renda, idade, urgencia) {
    let pontos = 0;
    if (renda <= 300) pontos += 40;
    else if (renda <= 700) pontos += 25;
    else if (renda <= 1500) pontos += 10;
    if (idade >= 60) pontos += 20;
    else if (idade < 12) pontos += 15;
    return pontos + urgencia * 10;
  }
  // bubble sort: maior pontuacao primeiro, empate mantem a ordem de chegada
  function ordenarFila(fila) {
    for (let i = 0; i < fila.length - 1; i++)
      for (let j = 0; j < fila.length - 1 - i; j++)
        if (fila[j].pontuacao < fila[j + 1].pontuacao) [fila[j], fila[j + 1]] = [fila[j + 1], fila[j]];
  }

  /* ---------- Contas e sessao ---------- */
  async function hashSenha(senha) {
    const texto = 'nylt:' + senha;
    if (window.crypto && crypto.subtle) {
      try {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
        return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {}
    }
    let h = 5381;
    for (const c of texto) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0;
    return 'djb2-' + h.toString(16);
  }

  async function cadastrar({ nome, telefone, idade, social, senha }) {
    const tel = soDigitos(telefone);
    if (tel.length < 10) throw new Error('Informe o telefone com DDD, por exemplo (11) 98765-4321.');
    if (!nome.trim()) throw new Error('Informe o seu nome completo.');
    if (!(idade >= 0 && idade <= 130)) throw new Error('Informe uma idade válida.');
    if (senha.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
    const contas = lerJSON(CHAVE_CONTAS, {});
    const d = ler();
    if (contas[tel] && d.pacientes.some(p => p.id === contas[tel].id && soDigitos(p.telefone) === tel))
      throw new Error('Já existe uma conta com esse telefone. Use "Entrar".');

    // se a recepcao ja cadastrou esse telefone, a conta passa a usar esse cadastro
    let pac = d.pacientes.find(p => soDigitos(p.telefone) === tel);
    const vinculado = !!pac;
    if (!pac) {
      if (d.pacientes.length >= MAX_PACIENTES) throw new Error('O limite de pacientes foi atingido. Fale com a recepção.');
      pac = {
        id: d.pacientes.length ? d.pacientes[d.pacientes.length - 1].id + 1 : 1,
        nome: nome.trim().replace(/;/g, ','), telefone: telefone.trim().replace(/;/g, ','),
        idade: +idade, social: social ? 1 : 0
      };
      d.pacientes.push(pac);
      gravar(d);
    }
    contas[tel] = { id: pac.id, hash: await hashSenha(senha) };
    gravarJSON(CHAVE_CONTAS, contas);
    gravarJSON(CHAVE_SESSAO, { id: pac.id, tel });
    return { paciente: pac, vinculado };
  }

  async function entrar(telefone, senha) {
    const tel = soDigitos(telefone);
    const contas = lerJSON(CHAVE_CONTAS, {});
    const conta = contas[tel];
    const erro = new Error('Telefone ou senha incorretos.');
    if (!conta) throw erro;
    const pac = ler().pacientes.find(p => p.id === conta.id && soDigitos(p.telefone) === tel);
    if (!pac) {  // o cadastro foi excluido pela recepcao
      delete contas[tel];
      gravarJSON(CHAVE_CONTAS, contas);
      throw new Error('Não encontramos o seu cadastro. Faça um novo cadastro.');
    }
    if (conta.hash !== await hashSenha(senha)) throw erro;
    gravarJSON(CHAVE_SESSAO, { id: pac.id, tel });
    return pac;
  }

  function pacienteAtual() {
    const s = lerJSON(CHAVE_SESSAO, null);
    if (!s) return null;
    const pac = ler().pacientes.find(p => p.id === s.id && soDigitos(p.telefone) === s.tel);
    if (!pac) sair();
    return pac || null;
  }
  function sair() { try { localStorage.removeItem(CHAVE_SESSAO); } catch (e) {} }

  /* ---------- Agenda ---------- */
  // horarios que o proprio paciente pode marcar: 10h as 15h (16h e 17h passam pela fila social)
  function livres(d, p) {
    const lista = [];
    for (let dia = 0; dia < DIAS.length; dia++)
      for (let h = 0; h < PRIMEIRO_SOCIAL; h++)
        if (!d.agenda[p][dia][h]) lista.push({ p, d: dia, h });
    return lista;
  }
  const proximoLivre = (d, p) => livres(d, p)[0] || null;

  function consultasDo(d, id) {
    const lista = [];
    d.agenda.forEach((dias, p) => dias.forEach((hs, dia) => hs.forEach((v, h) => {
      if (v === id) lista.push({ p, d: dia, h, situacao: d.presenca[p][dia][h] || 0 });
    })));
    return lista.sort((a, b) => a.d - b.d || a.h - b.h || a.p - b.p);
  }

  function agendar(id, p, dia, h) {
    const d = ler();
    const pac = d.pacientes.find(x => x.id === id);
    if (!pac) throw new Error('Não encontramos o seu cadastro.');
    if (h >= PRIMEIRO_SOCIAL) throw new Error('As 16h e 17h são do atendimento social e são marcadas pela fila.');
    if (d.agenda[p][dia][h]) throw new Error('Esse horário acabou de ser ocupado. Escolha outro.');
    if (consultasDo(d, id).some(c => c.d === dia && c.h === h))
      throw new Error(`Você já tem uma consulta ${DIAS[dia].toLowerCase()} às ${hora(h)}h.`);
    d.agenda[p][dia][h] = id;
    d.presenca[p][dia][h] = AGENDADA;
    gravar(d);
  }
  function mudarConsulta(id, p, dia, h, acao) {
    const d = ler();
    if (d.agenda[p][dia][h] !== id) throw new Error('Essa consulta não está mais na agenda.');
    if (acao === 'cancelar') { d.agenda[p][dia][h] = 0; d.presenca[p][dia][h] = 0; }
    else if (acao === 'confirmar') d.presenca[p][dia][h] = CONFIRMADA;
    gravar(d);
  }

  /* ---------- Fila do atendimento social ---------- */
  function posicaoNaFila(d, id) {
    const i = d.fila.findIndex(f => f.idPaciente === id);
    return i < 0 ? null : { posicao: i + 1, total: d.fila.length, item: d.fila[i] };
  }
  function pedirVagaSocial(id, renda) {
    const d = ler();
    const pac = d.pacientes.find(x => x.id === id);
    if (!pac || !pac.social) throw new Error('A fila é exclusiva para pacientes do atendimento social.');
    if (d.fila.some(f => f.idPaciente === id)) throw new Error('Você já está na fila.');
    if (d.fila.length >= MAX_FILA) throw new Error('A fila está cheia no momento. Fale com a recepção.');
    if (!(renda >= 0)) throw new Error('Informe a renda por pessoa da família.');
    // a urgencia comeca baixa (1) e e avaliada pela recepcao, que pode revisar a pontuacao
    const item = { idPaciente: id, rendaPerCapita: Math.round(renda * 100) / 100, urgencia: 1 };
    item.pontuacao = calcularPontuacao(item.rendaPerCapita, pac.idade, 1);
    d.fila.push(item);
    ordenarFila(d.fila);
    d.historico.unshift({ quando: new Date().toLocaleString('pt-BR'),
      texto: `Paciente código ${id} pediu vaga pelo site com ${item.pontuacao} pts (urgência a avaliar pela recepção).` });
    gravar(d);
    return item;
  }

  return {
    CHAVE, PROFISSIONAIS, DIAS, HORARIOS, PRIMEIRO_SOCIAL, SITUACOES, AGENDADA, CONFIRMADA, COMPARECEU, FALTOU,
    hora, soDigitos, ler, calcularPontuacao, cadastrar, entrar, pacienteAtual, sair,
    livres, proximoLivre, consultasDo, agendar, mudarConsulta, posicaoNaFila, pedirVagaSocial
  };
})();
