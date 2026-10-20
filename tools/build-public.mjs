#!/usr/bin/env node
// Build-time optimization only; the website still serves committed static files.
// esbuild 0.28.2, via ESBUILD=/path/to/esbuild or an esbuild on PATH.
// --check needs only Node and verifies source + artifact hashes, not esbuild.
import { readFileSync, writeFileSync, readdirSync, existsSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const version = '0.28.2';
const inputs = ['main.js','assets/fonts.css','styles/tokens.css','styles/site.css','styles/editorial.css','styles/cinematic.css','styles/privacy.css','styles/public.css',
  'content/assets.js','content/company.js','content/crm.js','content/runtime-copy.js','tools/build-public.mjs',
  ...['interface','scenes'].flatMap(dir=>readdirSync(root+dir).filter(f=>f.endsWith('.js')).sort().map(f=>`${dir}/${f}`))];
const sha = data => createHash('sha256').update(data).digest('hex');
const sourceHash = sha(inputs.map(file=>file+'\0'+readFileSync(root+file,'utf8')).join('\0'));
const outputs = ['assets/site.min.css','assets/site.min.js'];
const manifestFile=root+'tools/public-build.json';
if(process.argv.includes('--check')) {
  const manifest=existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile,'utf8')) : {};
  if(manifest.sourceHash!==sourceHash || manifest.esbuild!==version || outputs.some(file=>!existsSync(root+file) || sha(readFileSync(root+file))!==manifest.outputs?.[file])) {
    console.error('Public assets are stale. Run node tools/build-public.mjs, then node tools/render.js.');
    process.exit(1);
  }
  console.log('Public CSS/JS artifacts match their editable sources.');
} else {
  const bin=process.env.ESBUILD || 'esbuild';
  if(execFileSync(bin,['--version'],{encoding:'utf8'}).trim()!==version) throw Error(`Use esbuild ${version} for reproducible output`);
  const bundle=(args,output)=>{
    // Write beside the destination, then replace it atomically. Windows file
    // mapping by preview/sync tools can prevent esbuild truncating an open file.
    const temporary=output.replace(/\.(css|js)$/,`.build-${process.pid}.$1`);
    execFileSync(bin,[...args,'--outfile='+temporary],{cwd:root,stdio:'inherit'});
    renameSync(root+temporary,root+output);
  };
  bundle(['main.js','--bundle','--minify','--format=esm','--target=es2020'],'assets/site.min.js');
  bundle(['styles/public.css','--bundle','--minify','--target=chrome100,safari15,firefox100','--external:*.woff2'],'assets/site.min.css');
  writeFileSync(manifestFile,JSON.stringify({esbuild:version,sourceHash,outputs:Object.fromEntries(outputs.map(file=>[file,sha(readFileSync(root+file))]))},null,2)+'\n');
}
