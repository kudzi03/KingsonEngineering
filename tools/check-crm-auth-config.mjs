// Keep private CRM registration closed without disabling existing email logins.
// --live reads public Auth settings. --probe-login additionally makes ONE
// intentionally invalid password request for a synthetic .invalid address;
// it does not create an account, request an email or use a real user's password.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
const config=await readFile(new URL('../crm-src/supabase/config.toml',import.meta.url),'utf8');
const section=name=>config.match(new RegExp(`^\\[${name.replaceAll('.', '\\.')}\\]\\s*\n([\\s\\S]*?)(?=^\\[|$(?![\\s\\S]))`,'m'))?.[1]||'';
assert.match(section('auth'),/^enable_signup\s*=\s*false\s*$/m,'Public registration must stay disabled');
assert.match(section('auth'),/^enable_anonymous_sign_ins\s*=\s*false\s*$/m,'Anonymous sign-in must stay disabled');
assert.match(section('auth.email'),/^enable_signup\s*=\s*true\s*$/m,'Email provider must stay enabled for existing users');
console.log('PASS CRM config: email provider enabled; public and anonymous registration disabled');
if(process.argv.includes('--live')||process.argv.includes('--probe-login')) {
 const {SUPABASE_URL,SUPABASE_KEY}=await import('../crm-src/core/config.js');
 const headers={apikey:SUPABASE_KEY,'Content-Type':'application/json'};
 const response=await fetch(`${SUPABASE_URL}/auth/v1/settings`,{headers,signal:AbortSignal.timeout(30000)});
 assert.equal(response.status,200);
 const settings=await response.json();
 assert.equal(settings.external.email,true,'Live email provider must be enabled');
 assert.equal(settings.disable_signup,true,'Live public registration must stay disabled');
 assert.notEqual(settings.external.anonymous_users,true,'Live anonymous sign-in must stay disabled');
 console.log('PASS live Auth settings: existing email login enabled, registration closed');
 if(process.argv.includes('--probe-login')) {
  const probe=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:'POST',headers,
   body:JSON.stringify({email:`crm-login-probe-${randomUUID()}@example.invalid`,password:randomUUID()}),signal:AbortSignal.timeout(30000)});
  const result=await probe.json();
  assert.equal(probe.status,400);
  assert.equal(result.error_code,'invalid_credentials','Password authentication must reach credential validation');
  console.log('PASS synthetic login probe: invalid_credentials, rather than email_provider_disabled');
 }
}
