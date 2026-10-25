// Portable equivalent of build-crm.sh. Source stays in crm-src; only crm/ ships.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(root+p,'utf8');
mkdirSync(root+'crm',{recursive:true});
execFileSync(process.env.ESBUILD||'esbuild',['crm-src/app.js','--bundle','--format=esm','--minify','--target=es2020','--outfile=crm/app.js'],{cwd:root,stdio:'inherit'});
writeFileSync(root+'crm/app.css',read('crm-src/styles/tokens.css')+read('crm-src/styles/app.css'));
writeFileSync(root+'crm/fonts.css',read('crm-src/fonts.css'));
const version=createHash('sha256').update(read('crm/app.js')+read('crm/app.css')+read('crm/fonts.css')).digest('hex').slice(0,10);
writeFileSync(root+'crm/index.html',read('crm-src/index.html')
  .replace('<link rel="stylesheet" href="styles/tokens.css">','')
  .replace('href="styles/app.css"',`href="/crm/app.css?v=${version}"`)
  .replace('href="fonts.css"',`href="/crm/fonts.css?v=${version}"`)
  .replace('src="app.js"',`src="/crm/app.js?v=${version}"`));
console.log('Built CRM '+version);
