// Public pages share an origin with the CRM. Allow only our scripts and consent-gated GA.
// Inline scripts are authorized by their exact content, never by unsafe-inline.
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
export function updateSecurityHeaders(check=false) {
  const config=JSON.parse(readFileSync(root+'vercel.json','utf8'));
  const hashes=new Set();
  for(const file of readdirSync(root).filter(f=>f.endsWith('.html'))) {
    const html=readFileSync(root+file,'utf8');
    for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if(!/\bsrc=/.test(match[1]) && match[2].trim()) hashes.add("'sha256-"+createHash('sha256').update(match[2]).digest('base64')+"'");
    }
  }
  const csp=["default-src 'self'","script-src 'self' https://www.googletagmanager.com "+[...hashes].sort().join(' '),
    "style-src 'self' 'unsafe-inline'","font-src 'self'","img-src 'self' data: https://*.google-analytics.com https://*.analytics.google.com",
    "media-src 'self'","frame-src https://www.google.com","frame-ancestors 'self'","form-action 'self'","base-uri 'self'","object-src 'none'",
    "connect-src 'self' https://fgzwcxwmaohowryzdgui.supabase.co https://*.google-analytics.com https://*.analytics.google.com"].join('; ');
  for(const entry of config.headers) {
    if(entry.source==='/(.*)' && !entry.has) entry.headers.find(h=>h.key==='Content-Security-Policy').value=csp;
    if(entry.source==='/crm' || entry.source==='/crm/(.*)') {
      entry.headers.find(h=>h.key==='Cache-Control').value='no-store';
      if(!entry.headers.some(h=>h.key==='X-Frame-Options')) entry.headers.push({key:'X-Frame-Options',value:'DENY'});
    }
  }
  const output=JSON.stringify(config,null,2)+'\n';
  if(check) {
    if(output!==readFileSync(root+'vercel.json','utf8')) throw new Error('Run node tools/security-headers.mjs after rendering HTML.');
  } else writeFileSync(root+'vercel.json',output);
}
if(process.argv[1]?.replace(/\\/g,'/').endsWith('/security-headers.mjs')) updateSecurityHeaders(process.argv.includes('--check'));
