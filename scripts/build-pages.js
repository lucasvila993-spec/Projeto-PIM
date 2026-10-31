// Monta o site para o GitHub Pages na pasta _site.
// O Pages publica o projeto num subendereco (https://<usuario>.github.io/<repositorio>/),
// entao cada rota vira uma pasta com index.html e os links ganham esse prefixo:
//   /home -> <BASE>/home/    /entrar -> <BASE>/entrar/    assets/... -> <BASE>/assets/...
// Uso: BASE=/Projeto-PIM node scripts/build-pages.js
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SAIDA = path.join(RAIZ, '_site');
const BASE = (process.env.BASE || '').replace(/\/+$/, '');   // ex.: /Projeto-PIM ("" num dominio proprio)

const ROTAS = { home: 'index.html', entrar: 'entrar.html', paciente: 'paciente.html', admin: 'admin.html' };

// troca as rotas limpas e os caminhos de assets pelos enderecos com o prefixo
function ajustarLinks(html) {
  return html
    .replace(/(["'])\/(home|entrar|paciente|admin)(#[^"']*)?(?=["'])/g, (_, aspa, rota, hash = '') => `${aspa}${BASE}/${rota}/${hash}`)
    .replace(/(["'(])assets\//g, `$1${BASE}/assets/`);
}

fs.rmSync(SAIDA, { recursive: true, force: true });
fs.mkdirSync(SAIDA, { recursive: true });

// pasta assets inteira (imagens, estilos e a base de dados compartilhada)
fs.cpSync(path.join(RAIZ, 'assets'), path.join(SAIDA, 'assets'), { recursive: true });

for (const [rota, arquivo] of Object.entries(ROTAS)) {
  const html = fs.readFileSync(path.join(RAIZ, arquivo), 'utf8');
  fs.mkdirSync(path.join(SAIDA, rota), { recursive: true });
  fs.writeFileSync(path.join(SAIDA, rota, 'index.html'), ajustarLinks(html));
}

// a raiz do site leva para a landing
fs.writeFileSync(path.join(SAIDA, 'index.html'), `<!doctype html><html lang="pt-BR"><meta charset="utf-8">
<title>Clínica NYLT</title><meta http-equiv="refresh" content="0; url=${BASE}/home/">
<link rel="canonical" href="${BASE}/home/"><script>location.replace('${BASE}/home/' + location.hash)</script>
<a href="${BASE}/home/">Ir para a Clínica NYLT</a></html>`);

// endereco que nao existe: pagina no visual da NYLT
fs.writeFileSync(path.join(SAIDA, '404.html'), `<!doctype html><html lang="pt-BR"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Página não encontrada · NYLT</title>
<body style="font-family:Montserrat,system-ui,sans-serif;background:#F6F5F1;color:#1B2F48;display:grid;place-items:center;min-height:100vh;margin:0">
<main style="text-align:center;padding:24px"><h1 style="margin:0 0 8px">Página não encontrada</h1>
<p style="margin:0 0 24px;color:#4A5D75">O endereço não existe no site da Clínica NYLT.</p>
<a href="${BASE}/home/" style="display:inline-block;padding:14px 26px;border-radius:99px;background:#1B2F48;color:#fff;text-decoration:none;font-weight:600">Ir para o início</a></main></body></html>`);

// sem processamento Jekyll no Pages
fs.writeFileSync(path.join(SAIDA, '.nojekyll'), '');

console.log(`Site montado em _site (prefixo: "${BASE || '/'}")`);
for (const rota of Object.keys(ROTAS)) console.log(`  ${BASE}/${rota}/`);
