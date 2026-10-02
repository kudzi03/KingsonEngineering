// Local stand-in for Vercel: cleanUrls, 404.html, .vercelignore, vercel.json headers,
// byte ranges and Brotli/gzip.
// Dev tooling only — .claude/ is excluded from the deploy.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

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
  '.ico': 'image/x-icon', '.zip': 'application/zip',
  '.mp4': 'video/mp4', '.webm': 'video/webm'
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
  let url;
  try { url = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); return res.end(); }
  const file = path.join(root, url);
  const ok = (f) => f.startsWith(root + path.sep) && !f.includes(`${path.sep}.git`) && fs.existsSync(f) && fs.statSync(f).isFile()
    && !ignored(path.relative(root, f).split(path.sep).join('/'));
  let found = [file, `${file}.html`, path.join(file, 'index.html')].find(ok);
  if (found && url.endsWith('.html')) {
    res.writeHead(308, { Location: url.slice(0, -5) || '/' });
    return res.end();
  }
  let status = 200;
  if (!found) { status = 404; found = path.join(root, '404.html'); }
  const head = { 'Content-Type': types[path.extname(found)] || 'application/octet-stream', ...headersFor(url) };
  /* Byte ranges, as Vercel serves them. Safari will not play a <video> from a
     server that ignores Range, so without this the local check is not the
     production behaviour. */
  const size = fs.statSync(found).size;
  const range = status === 200 && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range) {
    const start = range[1] ? +range[1] : Math.max(0, size - +range[2]);
    const end = range[1] && range[2] ? Math.min(+range[2], size - 1) : size - 1;
    if (start > end || start >= size) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }); return res.end(); }
    res.writeHead(206, { ...head, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    return fs.createReadStream(found, { start, end }).pipe(res);
  }
  /* Text compressed as Vercel compresses it (Brotli, else gzip), so a page
     weight or an LCP measured here is the one a visitor gets. */
  const enc = req.headers['accept-encoding'] || '';
  if (/^(text\/|application\/(javascript|json|xml))|svg/.test(head['Content-Type']) && /\b(br|gzip)\b/.test(enc)) {
    const br = /\bbr\b/.test(enc);
    res.writeHead(status, { ...head, 'Content-Encoding': br ? 'br' : 'gzip', Vary: 'Accept-Encoding' });
    return fs.createReadStream(found).pipe(br ? zlib.createBrotliCompress() : zlib.createGzip()).pipe(res);
  }
  res.writeHead(status, { ...head, 'Accept-Ranges': 'bytes', 'Content-Length': size });
  fs.createReadStream(found).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} on http://localhost:${port}`));
