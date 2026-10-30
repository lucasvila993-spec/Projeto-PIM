// Servidor local que roda o nylt_agenda (C) e mostra o terminal no navegador.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3000;
const EXE = path.join(__dirname, 'nylt_agenda_web.exe');
const ROOT = path.join(__dirname, '..'); // arquivos .txt ficam ao lado do .c
const sessions = new Map();

function start(id) {
  const proc = spawn(EXE, [], { cwd: ROOT });
  const s = { proc, clients: new Set(), log: '' };
  const send = (type, data) => {
    const msg = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
    s.clients.forEach(res => res.write(msg));
  };
  proc.stdout.on('data', d => { const t = d.toString('latin1'); s.log += t; send('out', t); });
  proc.stderr.on('data', d => { const t = d.toString('latin1'); s.log += t; send('out', t); });
  proc.on('exit', () => { send('exit', 'Programa encerrado.'); sessions.delete(id); });
  sessions.set(id, s);
  return s;
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const id = url.searchParams.get('id');

  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return fs.createReadStream(path.join(__dirname, 'index.html')).pipe(res);
  }
  if (url.pathname === '/stream' && id) {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    const s = sessions.get(id) || start(id);
    if (s.log) res.write(`event: out\ndata: ${JSON.stringify(s.log)}\n\n`);
    s.clients.add(res);
    req.on('close', () => s.clients.delete(res));
    return;
  }
  if (url.pathname === '/input' && req.method === 'POST' && id) {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const s = sessions.get(id);
      if (s) { s.log += body + '\n'; s.proc.stdin.write(Buffer.from(body + '\n', 'latin1')); }
      res.writeHead(s ? 204 : 410); res.end();
    });
    return;
  }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log(`NYLT Agenda em http://localhost:${PORT}`));
