// Local helper for the maker: serves game/ and lets the page in the browser hand back its canvas
// as screenshots/<name> (POST /__save?name=1-start.jpg). Not part of the game and never shipped in game/.
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const port = Number(process.env.PORT ?? 8090);

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/__save') {
    const name = (url.searchParams.get('name') ?? '').replace(/[^\w.\-]/g, '');
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      mkdirSync(join(root, 'screenshots'), { recursive: true });
      const body = Buffer.concat(chunks);
      writeFileSync(join(root, 'screenshots', name), body);
      res.end(`saved ${name} ${body.length}`);
    });
    return;
  }
  const rel = url.pathname === '/' ? '/game/index.html' : url.pathname;
  const file = normalize(join(root, rel));
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    res.statusCode = 404;
    res.end('not found');
    return;
  }
  res.setHeader('content-type', types[extname(file)] ?? 'application/octet-stream');
  res.end(readFileSync(file));
}).listen(port, () => console.log(`http://localhost:${port}/`));
