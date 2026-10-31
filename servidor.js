// Servidor local do site da Clinica NYLT (sem dependencias: so o Node.js).
// Rotas:  /home  landing page      /entrar    login e cadastro
//         /admin recepcao          /paciente  area do paciente
// Uso:    node servidor.js   e acesse http://localhost:8080/home
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORTA = Number(process.env.PORT) || 8080;
const RAIZ = __dirname;

// cada rota limpa aponta para a sua pagina
const ROTAS = {
  '/home': 'index.html',
  '/entrar': 'entrar.html',
  '/paciente': 'paciente.html',
  '/admin': 'admin.html',
};
// enderecos antigos (.html) levam para a rota nova
const ANTIGOS = {
  '/index.html': '/home',
  '/entrar.html': '/entrar',
  '/paciente.html': '/paciente',
  '/admin.html': '/admin',
  '/nylt_agenda.html': '/admin',
};

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function enviarArquivo(res, arquivo, status = 200) {
  fs.readFile(arquivo, (erro, dados) => {
    if (erro) return naoEncontrado(res);
    res.writeHead(status, {
      'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream',
      // as paginas mudam durante o desenvolvimento: sempre a versao atual
      'Cache-Control': 'no-cache',
    });
    res.end(dados);
  });
}

function naoEncontrado(res) {
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Página não encontrada · NYLT</title>
<body style="font-family:Montserrat,system-ui,sans-serif;background:#F6F5F1;color:#1B2F48;display:grid;place-items:center;min-height:100vh;margin:0">
<main style="text-align:center"><h1 style="margin:0 0 8px">Página não encontrada</h1>
<p style="margin:0 0 24px;color:#4A5D75">O endereço não existe no site da Clínica NYLT.</p>
<a href="/home" style="display:inline-block;padding:14px 26px;border-radius:99px;background:#1B2F48;color:#fff;text-decoration:none;font-weight:600">Ir para o início</a></main></body></html>`);
}

function redirecionar(res, destino) {
  res.writeHead(301, { Location: destino });
  res.end();
}

http.createServer((req, res) => {
  let caminho;
  try { caminho = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { return naoEncontrado(res); }
  if (caminho.length > 1) caminho = caminho.replace(/\/+$/, '');   // /home/ vira /home

  if (caminho === '/' ) return redirecionar(res, '/home');
  if (ANTIGOS[caminho]) return redirecionar(res, ANTIGOS[caminho]);
  if (ROTAS[caminho]) return enviarArquivo(res, path.join(RAIZ, ROTAS[caminho]));

  // arquivos da pasta assets (imagens, estilos, scripts); nada fora dela
  if (caminho.startsWith('/assets/')) {
    const arquivo = path.normalize(path.join(RAIZ, caminho));
    if (!arquivo.startsWith(path.join(RAIZ, 'assets') + path.sep)) return naoEncontrado(res);
    return enviarArquivo(res, arquivo);
  }
  naoEncontrado(res);
}).listen(PORTA, () => {
  console.log('Clínica NYLT rodando:');
  console.log(`  Landing page   http://localhost:${PORTA}/home`);
  console.log(`  Recepção       http://localhost:${PORTA}/admin`);
  console.log(`  Entrar         http://localhost:${PORTA}/entrar`);
  console.log(`  Área paciente  http://localhost:${PORTA}/paciente`);
});
