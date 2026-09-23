// Local stand-in for Vercel: cleanUrls, 404.html, .vercelignore, vercel.json headers.
// Dev tooling only — .claude/ is excluded from the deploy.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.argv[3]) || 8210;
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const ignore = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8')
  .split('\n').map((s) => s.trim()).filter((s) => s && !s.startsWith('#'));
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp',
  '.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain',
  '.ico': 'image/x-icon', '.zip': 'application/zip'
};
const escRe = (s) => s.replace(/[.+^${}()|[\]\\]/g, '\\$&');
const ignored = (rel) => {
  let hit = false;
  for (const p of ignore) {
    const neg = p.startsWith('!');
    const raw = neg ? p.slice(1) : p;
    const anchored = raw.startsWith('/');                 // "/x" matches at the root only
    const pat = escRe(anchored ? raw.slice(1) : raw).replace(/\\\*|\*/g, '[^/]*');
    if (new RegExp(`^${anchored ? '' : '(?:.*/)?'}${pat}(?:/.*)?$`).test(rel)) hit = !neg;
  }
  return hit;
};
const headersFor = (url) => {
  const h = {};
  for (const r of cfg.headers) {
    if (new RegExp(`^${r.source}$`).test(url)) for (const { key, value } of r.headers) h[key] = value;
  }
  return h;
};

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(root, url);
  const ok = (f) => f.startsWith(root) && fs.existsSync(f) && fs.statSync(f).isFile()
    && !ignored(path.relative(root, f).split(path.sep).join('/'));
  let found = [file, `${file}.html`, path.join(file, 'index.html')].find(ok);
  if (found && url.endsWith('.html')) {
    res.writeHead(308, { Location: url.slice(0, -5) || '/' });
    return res.end();
  }
  let status = 200;
  if (!found) { status = 404; found = path.join(root, '404.html'); }
  res.writeHead(status, {
    'Content-Type': types[path.extname(found)] || 'application/octet-stream',
    ...headersFor(url)
  });
  fs.createReadStream(found).pipe(res);
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`));
