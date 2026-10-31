/*
 * NYLT - dados compartilhados entre o site dos pacientes e a recepcao (admin.html).
 * Os dados ficam no banco do Supabase (projeto nylt-agenda), nas tabelas pacientes, consultas,
 * fila_social, historico e contas, com as mesmas estruturas do nylt_agenda.c.
 * O site nao le as tabelas direto: chama as funcoes do banco (RPC), que conferem a sessao.
 * Para nao reescrever as paginas, este modulo guarda uma copia dos dados no mesmo formato de
 * antes ({pacientes, fila, agenda, presenca, historico}); ler() devolve essa copia e
 * carregar() busca de novo no banco.
 */
const NYLT = (() => {
  // endereco do projeto e chave publica (feita para ficar no navegador; o acesso e controlado pelas funcoes)
  const SUPABASE_URL = 'https://hfeppfkzegclsnxfsczv.supabase.co';
  const SUPABASE_CHAVE = 'sb_publishable_JXosdkJL2xkzSpnpGpce6g_j85yYLBf';
  const CHAVE_SESSAO = 'nylt_sessao';

  const PROFISSIONAIS = ['Psicologia', 'Nutrição', 'Fisioterapia'];
  const DIAS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  const HORARIOS = 8;          // 10h as 17h
  const PRIMEIRO_SOCIAL = 6;   // 16h e 17h sao do atendimento social
  const SITUACOES = ['Agendada', 'Confirmada', 'Compareceu', 'Faltou'];
  const AGENDADA = 0, CONFIRMADA = 1, COMPARECEU = 2, FALTOU = 3;

  const hora = h => 10 + h;
  const soDigitos = t => String(t || '').replace(/\D/g, '');
  const novaAgenda = () => PROFISSIONAIS.map(() => DIAS.map(() => Array(HORARIOS).fill(0)));
  const vazio = () => ({ pacientes: [], fila: [], agenda: novaAgenda(), presenca: novaAgenda(), historico: [] });

  let dados = vazio();     // copia local do que veio do banco
  let paciente = null;     // paciente logado (ou null)

  /* ---------- Chamada a uma funcao do banco ---------- */
  async function rpc(nome, parametros = {}) {
    let resposta;
    try {
      resposta = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nome}`, {
        method: 'POST',
        headers: { apikey: SUPABASE_CHAVE, 'Content-Type': 'application/json' },
        body: JSON.stringify(parametros)
      });
    } catch (e) {
      throw new Error('Sem conexão com o servidor. Confira a internet e tente de novo.');
    }
    const texto = await resposta.text();
    let corpo = null;
    try { corpo = texto ? JSON.parse(texto) : null; } catch (e) {}
    if (!resposta.ok) throw new Error((corpo && corpo.message) || 'Não foi possível concluir. Tente de novo.');
    return corpo;
  }

  const token = () => { try { return (JSON.parse(localStorage.getItem(CHAVE_SESSAO)) || {}).token || null; } catch (e) { return null; } };
  const guardarToken = t => { try { localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ token: t })); } catch (e) {} };
  const esquecerToken = () => { try { localStorage.removeItem(CHAVE_SESSAO); } catch (e) {} };

  // busca os dados no banco: os do paciente logado, ou so a ocupacao da semana para quem nao entrou
  async function carregar() {
    const t = token();
    if (t) {
      const r = await rpc('paciente_estado', { p_token: t });
      if (r) { dados = r.estado; paciente = r.paciente; return dados; }
      esquecerToken();   // a sessao acabou ou o cadastro foi excluido
    }
    paciente = null;
    dados = await rpc('estado_publico');
    return dados;
  }
  const ler = () => dados;

  // atualiza a pagina quando a agenda muda em outro lugar (outro paciente ou a recepcao)
  function aoMudar(callback, segundos = 20) {
    const atualizar = () => carregar().then(callback).catch(() => {});
    setInterval(() => { if (!document.hidden) atualizar(); }, segundos * 1000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) atualizar(); });
  }

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

  /* ---------- Contas e sessao ---------- */
  async function cadastrar({ nome, telefone, idade, social, senha }) {
    // as mesmas conferencias sao feitas no banco; aqui so para responder na hora
    if (soDigitos(telefone).length < 10) throw new Error('Informe o telefone com DDD, por exemplo (11) 98765-4321.');
    if (!nome.trim()) throw new Error('Informe o seu nome completo.');
    if (!(idade >= 0 && idade <= 130)) throw new Error('Informe uma idade válida.');
    if (senha.length < 6) throw new Error('A senha precisa ter pelo menos 6 caracteres.');
    const r = await rpc('paciente_cadastrar', { p_nome: nome, p_telefone: telefone, p_idade: idade, p_social: !!social, p_senha: senha });
    guardarToken(r.token);
    paciente = r.paciente;
    return { paciente: r.paciente, vinculado: r.vinculado };
  }

  async function entrar(telefone, senha) {
    const r = await rpc('paciente_entrar', { p_telefone: telefone, p_senha: senha });
    guardarToken(r.token);
    paciente = r.paciente;
    return r.paciente;
  }

  const pacienteAtual = () => paciente;
  function sair() {
    const t = token();
    esquecerToken();
    paciente = null;
    if (t) rpc('paciente_sair', { p_token: t }).catch(() => {});
  }

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

  async function agendar(id, p, dia, h) {
    try { await rpc('paciente_agendar', { p_token: token(), p_prof: p, p_dia: dia, p_horario: h }); }
    finally { await carregar().catch(() => {}); }
  }
  async function mudarConsulta(id, p, dia, h, acao) {
    try { await rpc('paciente_mudar_consulta', { p_token: token(), p_prof: p, p_dia: dia, p_horario: h, p_acao: acao }); }
    finally { await carregar().catch(() => {}); }
  }

  /* ---------- Fila do atendimento social ---------- */
  function posicaoNaFila(d, id) {
    const i = d.fila.findIndex(f => f.idPaciente === id);
    return i < 0 ? null : { posicao: i + 1, total: d.fila.length, item: d.fila[i] };
  }
  async function pedirVagaSocial(id, renda) {
    if (!(renda >= 0)) throw new Error('Informe a renda por pessoa da família.');
    try { return await rpc('paciente_pedir_social', { p_token: token(), p_renda: renda }); }
    finally { await carregar().catch(() => {}); }
  }

  return {
    SUPABASE_URL, SUPABASE_CHAVE, PROFISSIONAIS, DIAS, HORARIOS, PRIMEIRO_SOCIAL, SITUACOES, AGENDADA, CONFIRMADA, COMPARECEU, FALTOU,
    rpc, hora, soDigitos, carregar, ler, aoMudar, calcularPontuacao, cadastrar, entrar, pacienteAtual, sair,
    livres, proximoLivre, consultasDo, agendar, mudarConsulta, posicaoNaFila, pedirVagaSocial
  };
})();
