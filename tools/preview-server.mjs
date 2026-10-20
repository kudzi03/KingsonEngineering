#!/usr/bin/env node
// Local review only. No database proxy, credentials or deployment action.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.mjs':'text/javascript', '.css':'text/css', '.webp':'image/webp', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml', '.woff2':'font/woff2', '.xml':'application/xml', '.txt':'text/plain', '.vtt':'text/vtt', '.mp4':'video/mp4', '.webm':'video/webm' };
createServer(async (req,res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path.startsWith('/_vercel/')) { res.writeHead(200, {'Content-Type':'text/javascript'}).end(''); return; }
    if (/^\/(?:\.git|\.claude|tools|crm-src)(?:\/|$)/.test(path) || path.endsWith('.md')) { res.writeHead(404).end(); return; }
    let file = resolve(root, '.' + path);
    if (file !== resolve(root) && !file.startsWith(resolve(root) + sep)) { res.writeHead(403).end(); return; }
    if (path === '/') file = resolve(root, 'index.html');
    else if (!extname(path)) file += '.html';
    let code = 200;
    try { if (!(await stat(file)).isFile()) throw Error(); }
    catch { file=resolve(root, '404.html'); code=404; }
    const type = types[extname(file)] || 'application/octet-stream';
    if (/^video\//.test(type)) {
      const {size} = await stat(file);
      const range = req.headers.range;
      const match = range?.match(/^bytes=(\d*)-(\d*)$/);
      let start = 0, end = size - 1;
      if (range) {
        if (!match || (!match[1] && !match[2])) { res.writeHead(416, {'Content-Range':`bytes */${size}`}).end(); return; }
        start = match[1] ? Number(match[1]) : Math.max(0,size-Number(match[2]));
        end = match[1] && match[2] ? Math.min(size-1,Number(match[2])) : size-1;
        if (start > end || start >= size) { res.writeHead(416, {'Content-Range':`bytes */${size}`}).end(); return; }
      }
      res.writeHead(range ? 206 : code, {'Content-Type':type,'Accept-Ranges':'bytes','Content-Length':end-start+1,'Cache-Control':'no-store',...(range ? {'Content-Range':`bytes ${start}-${end}/${size}`} : {})});
      if (req.method === 'HEAD') res.end();
      else createReadStream(file,{start,end}).pipe(res);
      return;
    }
    const content = await readFile(file);
    const compressed = /gzip/.test(req.headers['accept-encoding'] || '') && /text|javascript|xml/.test(type);
    res.writeHead(code, {'Content-Type':type, 'Cache-Control':'no-store', ...(compressed ? {'Content-Encoding':'gzip',Vary:'Accept-Encoding'} : {})});
    res.end(compressed ? gzipSync(content) : content);
  } catch { res.writeHead(400).end(); }
}).listen(port, '127.0.0.1', () => console.log(`Kingson preview: http://127.0.0.1:${port}`));
