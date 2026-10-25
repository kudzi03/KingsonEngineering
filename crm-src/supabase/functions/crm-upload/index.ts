import { validateFile } from '../../../core/file-validation.js';

const url = Deno.env.get('SUPABASE_URL')!;
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const allowed = new Set(['https://www.kingsonengineering.co.zw', 'http://127.0.0.1:4173', 'http://127.0.0.1:4174']);
async function boundedForm(req:Request) {
  if (!req.body) throw new Error('Choose a file');
  const reader=req.body.getReader(), chunks:Uint8Array[]=[];
  let size=0;
  for (;;) {
    const {value,done}=await reader.read();
    if(done) break;
    size+=value.length;
    if(size>26*1024*1024) {await reader.cancel();throw new Error('Upload exceeds 25 MB plus form overhead');}
    chunks.push(value);
  }
  const bytes=new Uint8Array(size);let offset=0;
  for(const chunk of chunks) {bytes.set(chunk,offset);offset+=chunk.length;}
  return new Response(bytes,{headers:{'Content-Type':req.headers.get('Content-Type')||''}}).formData();
}
Deno.serve(async (req) => {
  const origin = req.headers.get('Origin') || '';
  const headers = { 'Content-Type':'application/json', 'Vary':'Origin',
    ...(allowed.has(origin) ? { 'Access-Control-Allow-Origin':origin } : {}),
    'Access-Control-Allow-Headers':'authorization,apikey,content-type', 'Access-Control-Allow-Methods':'POST,OPTIONS' };
  const reply = (data:unknown,status=200) => new Response(JSON.stringify(data), {status,headers});
  if (!allowed.has(origin)) return reply({error:'Origin not allowed'},403);
  if (req.method==='OPTIONS') return new Response(null,{status:204,headers});
  if (req.method!=='POST') return reply({error:'POST only'},405);
  const auth = req.headers.get('Authorization') || '';
  const staff = await fetch(url+'/rest/v1/rpc/is_staff',{method:'POST',
    headers:{apikey:Deno.env.get('SUPABASE_ANON_KEY')!,Authorization:auth,'Content-Type':'application/json'},body:'{}'});
  if (!staff.ok || await staff.json()!==true) return reply({error:'Active staff and two-step sign-in required'},403);
  if (Number(req.headers.get('Content-Length')||0)>26*1024*1024) return reply({error:'File too large'},413);
  try {
    const form = await boundedForm(req);
    const file = form.get('file');
    if (!(file instanceof File)) return reply({error:'Choose a file'},400);
    const column=String(form.get('link_type')), id=String(form.get('link_id'));
    const tables:Record<string,string>={opportunity_id:'opportunities',project_id:'projects',contact_id:'contacts'};
    if (!tables[column] || !/^[0-9a-f-]{36}$/i.test(id)) return reply({error:'Invalid record link'},400);
    const parent=await fetch(url+'/rest/v1/'+tables[column]+'?select=id&id=eq.'+encodeURIComponent(id),
      {headers:{apikey:Deno.env.get('SUPABASE_ANON_KEY')!,Authorization:auth}});
    if (!parent.ok || !(await parent.json()).length) return reply({error:'Record not accessible'},403);
    const checked=await validateFile(file);
    const userResponse=await fetch(url+'/auth/v1/user',{headers:{apikey:Deno.env.get('SUPABASE_ANON_KEY')!,Authorization:auth}});
    if(!userResponse.ok) return reply({error:'Session could not be verified'},403);
    const user=await userResponse.json();
    if(!user.id) return reply({error:'Session could not be verified'},403);
    const filename=checked.name.replace(/[^\w.\-]+/g,'_').slice(-80);
    const path=column.replace('_id','')+'/'+id+'/'+crypto.randomUUID()+'-'+filename;
    const service={apikey:key,Authorization:'Bearer '+key};
    const uploaded=await fetch(url+'/storage/v1/object/kingson-files/'+path,{method:'POST',
      headers:{...service,'Content-Type':checked.mime,'x-upsert':'false'},body:checked.bytes});
    if (!uploaded.ok) return reply({error:'Upload could not be saved'},502);
    // Index as the caller; RLS, FK and auditing remain authoritative.
    const indexed=await fetch(url+'/rest/v1/files',{method:'POST',headers:{apikey:Deno.env.get('SUPABASE_ANON_KEY')!,
      Authorization:auth,'Content-Type':'application/json',Prefer:'return=representation'},
      body:JSON.stringify({bucket:'kingson-files',path,name:checked.name,mime:checked.mime,
        size_bytes:file.size,uploaded_by:user.id,[column]:id})});
    if (!indexed.ok) {
      await fetch(url+'/storage/v1/object/kingson-files',{method:'DELETE',headers:{...service,'Content-Type':'application/json'},body:JSON.stringify({prefixes:[path]})});
      return reply({error:'File record could not be saved'},502);
    }
    return reply((await indexed.json())[0]);
  } catch (e) { return reply({error:e instanceof Error ? e.message : 'Upload rejected'},400); }
});
