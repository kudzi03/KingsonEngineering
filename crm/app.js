var En=Object.defineProperty;var j=(t,e,a)=>()=>{if(a)throw a[0];try{return t&&(e=t(t=0)),e}catch(o){throw a=[o],o}};var Q=(t,e)=>{for(var a in e)En(t,a,{get:e[a],enumerable:!0})};var te,$e,ee,vt,ae=j(()=>{te="https://fgzwcxwmaohowryzdgui.supabase.co",$e="sb_publishable_QYbHrEJ06GpGDMlIqf5tzw_ijJpdtTV",ee="kingson-files",vt="Africa/Harare"});function ua(){try{let t=localStorage.getItem(Re);R=t?JSON.parse(t):null}catch{R=null}return R}function Fe(){return R}function Ct(t){R=t;try{t?localStorage.setItem(Re,JSON.stringify(t)):localStorage.removeItem(Re)}catch{}return t}function ne(t,e){let a=e?.code||"",o=e?.message||e?.error_description||e?.msg||"";return a==="23505"?/contacts_email_key/.test(o)?"A contact with that email address already exists.":/companies_name_key/.test(o)?"A company with that name already exists.":"That record already exists.":a==="23514"?/lost_has_reason/.test(o)?"A lost opportunity needs a reason.":/quotes_sent_has_date/.test(o)?"A quotation marked sent needs the date it went out.":/contacts_reachable/.test(o)?"A contact needs a phone number, a WhatsApp number or an email address.":/amount_sane|value_sane/.test(o)?"That amount cannot be negative.":"That value is not allowed here.":a==="23503"?"That record is still attached to something else.":t===401?"Your session has expired. Sign in again.":t===403||a==="42501"?"You do not have permission to do that.":t===404?"That record no longer exists.":t===0?"No connection. Check the network and try again.":o||`Request failed (${t}).`}async function We(t,{method:e="POST",body:a,token:o}={}){let s;try{s=await fetch(`${te}/auth/v1${t}`,{method:e,headers:{apikey:$e,"Content-Type":"application/json",...o?{Authorization:`Bearer ${o}`}:{}},body:a?JSON.stringify(a):void 0})}catch{throw new _t(ne(0),{status:0})}let i=await s.text(),r=i?JSON.parse(i):null;if(!s.ok)throw new _t(ne(s.status,r),{status:s.status,code:r?.code||""});return r}async function fa(t,e){let a=await We("/token?grant_type=password",{body:{email:t.trim(),password:e}});return Ct(ma(a))}async function $a(){let t=R;if(Ct(null),t?.access_token)try{await We("/logout",{token:t.access_token})}catch{}}async function Be(){if(!R?.refresh_token)throw new _t("Your session has expired. Sign in again.",{status:401});return ye||(ye=We("/token?grant_type=refresh_token",{body:{refresh_token:R.refresh_token}}).then(t=>Ct(ma(t))).catch(t=>{throw Ct(null),t}).finally(()=>{ye=null})),ye}async function gt(t,{method:e="GET",body:a,headers:o={},retry:s=!0}={}){if(R&&ha())try{await Be()}catch{}let i;try{i=await fetch(`${te}${t}`,{method:e,headers:{apikey:$e,"Content-Type":"application/json",...R?.access_token?{Authorization:`Bearer ${R.access_token}`}:{},...o},body:a===void 0?void 0:JSON.stringify(a)})}catch{throw new _t(ne(0),{status:0})}if(i.status===401&&s&&R?.refresh_token)try{return await Be(),gt(t,{method:e,body:a,headers:o,retry:!1})}catch{}let r=await i.text(),l=null;try{l=r?JSON.parse(r):null}catch{l=r}if(!i.ok)throw new _t(ne(i.status,l),{status:i.status,code:l?.code||"",details:l?.details||"",hint:l?.hint||""});return l}var Re,R,ye,ma,ha,_t,$,ge,C,H,He=j(()=>{ae();Re="kingson-crm/session/v1",R=null,ye=null;ma=t=>({access_token:t.access_token,refresh_token:t.refresh_token,expires_at:Date.now()+((t.expires_in||3600)-60)*1e3,user:t.user||null}),ha=()=>!R||!R.expires_at||Date.now()>=R.expires_at,_t=class extends Error{constructor(e,{status:a=0,code:o="",details:s="",hint:i=""}={}){super(e),this.name="ApiError",this.status=a,this.code=o,this.details=s,this.hint=i}};$={select:(t,e="")=>gt(`/rest/v1/${t}${e?"?"+e:""}`),count:async(t,e="")=>{let a=await gt(`/rest/v1/${t}?select=id&limit=1${e?"&"+e:""}`,{headers:{Prefer:"count=exact"}});return Array.isArray(a)?a.length:0},insert:(t,e,a="")=>gt(`/rest/v1/${t}${a?"?"+a:""}`,{method:"POST",body:e,headers:{Prefer:"return=representation"}}),update:(t,e,a)=>gt(`/rest/v1/${t}?${e}`,{method:"PATCH",body:a,headers:{Prefer:"return=representation"}}),remove:(t,e)=>gt(`/rest/v1/${t}?${e}`,{method:"DELETE",headers:{Prefer:"return=representation"}}),rpc:(t,e={})=>gt(`/rest/v1/rpc/${t}`,{method:"POST",body:e})},ge={async upload(t,e,a){if(R&&ha())try{await Be()}catch{}let o;try{o=await fetch(`${te}/storage/v1/object/${t}/${encodeURI(e)}`,{method:"POST",headers:{apikey:$e,Authorization:`Bearer ${R?.access_token||""}`,"x-upsert":"false",...a.type?{"Content-Type":a.type}:{}},body:a})}catch{throw new _t(ne(0),{status:0})}if(!o.ok){let s=null;try{s=await o.json()}catch{}throw new _t(o.status===413?"That file is larger than the 25 MB limit.":s?.message||`Upload failed (${o.status}).`,{status:o.status})}return e},async signedUrl(t,e,a=120){let o=await gt(`/storage/v1/object/sign/${t}/${encodeURI(e)}`,{method:"POST",body:{expiresIn:a}});return`${te}/storage/v1${o.signedURL||o.signedUrl}`},async remove(t,e){return gt(`/storage/v1/object/${t}`,{method:"DELETE",body:{prefixes:e}})}},C=(t,e)=>`${t}=eq.${encodeURIComponent(e)}`,H=(t,e="asc",a=!0)=>`order=${t}.${e}${a?".nullslast":""}`});function ht(){return new Intl.DateTimeFormat("en-CA",{timeZone:vt}).format(new Date)}function q(t){if(!t)return null;let e=Date.parse(ht()+"T00:00:00Z"),a=Date.parse(String(t).slice(0,10)+"T00:00:00Z");return Number.isNaN(a)?null:Math.round((a-e)/864e5)}function _e(t,e){let a=new Date(Date.parse(String(t).slice(0,10)+"T00:00:00Z"));return a.setUTCDate(a.getUTCDate()+e),a.toISOString().slice(0,10)}function xe(t=ht(),e=1){let a=_e(t,e);return new Date(a+"T00:00:00Z").getUTCDay()===0&&(a=_e(a,1)),a}function rt(t){return!xt(t)||!t.next_action_due?!1:q(t.next_action_due)<0}function ke(t){return!xt(t)||!t.next_action_due?!1:q(t.next_action_due)===0}function lt(t){if(!xt(t))return{level:"closed",label:at[t.stage]?.name||"\u2014",sort:0};if(Ut(t))return{level:"unbooked",label:"No next action",sort:900};let e=q(t.next_action_due);if(e<0){let a=Math.abs(e);return{level:"overdue",label:a===1?"1 day overdue":`${a} days overdue`,sort:1e3+a}}return e===0?{level:"today",label:"Due today",sort:800}:e<=7?{level:"soon",label:e===1?"Due tomorrow":`Due in ${e} days`,sort:700-e}:{level:"clear",label:`Due in ${e} days`,sort:100-Math.min(e,99)}}function Se(t){return!xt(t)||!Number(t.live_quotes||0)?!1:!t.next_action_due||q(t.next_action_due)<0}async function ba(t){let e;try{e=await t.rpc("enum_values",{enum_name:"opp_stage"})}catch{return{ok:!0,skipped:!0}}let a=new Set((e||[]).map(r=>typeof r=="string"?r:r.value)),o=new Set(mt.map(r=>r.id)),s=[...a].filter(r=>!o.has(r)),i=[...o].filter(r=>!a.has(r));return(s.length||i.length)&&console.error("[kingson] pipeline stages disagree with the database",{missingFromApp:s,notInDatabase:i}),{ok:!s.length&&!i.length,missing:s,extra:i}}var mt,at,ya,se,be,Lt,we,Mt,ga,Pt,ve,_a,xt,Ut,M,B=j(()=>{ae();mt=[{id:"new",name:"New enquiry",short:"New",open:!0,group:"intake"},{id:"contacted",name:"Contacted",short:"Contacted",open:!0,group:"intake"},{id:"requirements",name:"Requirements / site visit",short:"Requirements",open:!0,group:"survey"},{id:"quoting",name:"Quote / BOQ preparing",short:"Quoting",open:!0,group:"quote"},{id:"quote_sent",name:"Quote sent",short:"Quote sent",open:!0,group:"quote"},{id:"followup",name:"Follow-up due",short:"Follow-up",open:!0,group:"chase"},{id:"won",name:"Won",short:"Won",open:!1,group:"won"},{id:"lost",name:"Lost",short:"Lost",open:!1,group:"lost"}],at=Object.fromEntries(mt.map(t=>[t.id,t])),ya=mt.filter(t=>t.open).map(t=>t.id),se=["low","normal","high","urgent"],be=["website","whatsapp","phone","email","referral","walk_in","other"],Lt={website:"Website",whatsapp:"WhatsApp",phone:"Phone",email:"Email",referral:"Referral",walk_in:"Walk-in",other:"Other"},we=["draft","sent","discussed","accepted","rejected","expired"],Mt={draft:"Draft",sent:"Sent",discussed:"Discussed",accepted:"Accepted",rejected:"Rejected",expired:"Expired"},ga=["planning","in_progress","on_hold","complete","cancelled"],Pt={planning:"Planning",in_progress:"In progress",on_hold:"On hold",complete:"Complete",cancelled:"Cancelled"},ve={enquiry:"Enquiry",note:"Note",call:"Call",whatsapp:"WhatsApp",email:"Email",meeting:"Meeting",site_visit:"Site visit",quote:"Quotation",stage_change:"Stage change",task:"Task",file:"File",won:"Won",lost:"Lost",system:"System"},_a=["call","whatsapp","email","meeting","note"];xt=t=>!!(t&&at[t.stage]?.open);Ut=t=>xt(t)&&!t.next_action_due;M=(t,e)=>t.reduce((a,o)=>a+(Number(e(o))||0),0)});var Qe,Ea,An,d,F=j(()=>{He();ae();B();Qe="*",Ea=H("next_action_due","asc"),An=`stage=in.(${ya.join(",")})`,d={profiles:()=>$.select("profiles",`select=*&${H("full_name")}`),me:t=>$.select("profiles",`select=*&${C("id",t)}`).then(e=>e[0]||null),opportunities:(t="")=>$.select("v_opportunity_state",`select=${Qe}&${Ea}${t?"&"+t:""}`),openOpportunities:()=>$.select("v_opportunity_state",`select=${Qe}&${An}&${Ea}`),opportunity:t=>$.select("v_opportunity_state",`select=${Qe}&${C("id",t)}`).then(e=>e[0]||null),createOpportunity:t=>$.insert("opportunities",t).then(e=>e[0]),updateOpportunity:(t,e)=>$.update("opportunities",C("id",t),e).then(a=>a[0]),async setStage(t,e,{lostReason:a}={}){let o={stage:e};return e==="lost"&&(o.lost_reason=(a||"").trim()||"No reason recorded"),d.updateOpportunity(t,o)},contacts:(t="")=>{let e=`select=*,companies(id,name)&${H("full_name")}`;if(t){let a=encodeURIComponent(`%${t}%`);e+=`&or=(full_name.ilike.${a},email.ilike.${a},phone.ilike.${a},whatsapp.ilike.${a})`}return $.select("contacts",e)},contact:t=>$.select("contacts",`select=*,companies(id,name,kind,town)&${C("id",t)}`).then(e=>e[0]||null),createContact:t=>$.insert("contacts",t).then(e=>e[0]),updateContact:(t,e)=>$.update("contacts",C("id",t),e).then(a=>a[0]),companies:()=>$.select("companies",`select=*&${H("name")}`),company:t=>$.select("companies",`select=*&${C("id",t)}`).then(e=>e[0]||null),createCompany:t=>$.insert("companies",t).then(e=>e[0]),updateCompany:(t,e)=>$.update("companies",C("id",t),e).then(a=>a[0]),async findOrCreateCompany(t){let e=(t||"").trim();if(!e)return null;let a=await $.select("companies",`select=id,name&name=ilike.${encodeURIComponent(e)}&limit=1`);return a[0]?a[0]:d.createCompany({name:e})},activityFor:t=>$.select("activities",`select=*,profiles(full_name,initials)&${C("opportunity_id",t)}&${H("occurred_at","desc")}`),activityForContact:t=>$.select("activities",`select=*,profiles(full_name,initials),opportunities(id,ref,title)&${C("contact_id",t)}&${H("occurred_at","desc")}`),activityForProject:t=>$.select("activities",`select=*,profiles(full_name,initials)&${C("project_id",t)}&${H("occurred_at","desc")}`),recentActivity:(t=12)=>$.select("activities",`select=*,profiles(full_name,initials),opportunities(id,ref,title)&${H("occurred_at","desc")}&limit=${t}`),logActivity:t=>$.insert("activities",t).then(e=>e[0]),tasks:(t="")=>$.select("tasks",`select=*,profiles!tasks_owner_id_fkey(full_name,initials),opportunities(id,ref,title,stage),contacts(id,full_name,phone,whatsapp,email)&${H("due_date")}${t?"&"+t:""}`),openTasks:()=>d.tasks("status=eq.open"),tasksFor:t=>d.tasks(C("opportunity_id",t)),createTask:t=>$.insert("tasks",t).then(e=>e[0]),updateTask:(t,e)=>$.update("tasks",C("id",t),e).then(a=>a[0]),completeTask:t=>d.updateTask(t,{status:"done"}),visits:(t="")=>$.select("site_visits",`select=*,profiles(full_name,initials),opportunities(id,ref,title,company_id,companies(name))&${H("scheduled_at")}${t?"&"+t:""}`),upcomingVisits:()=>d.visits(`status=eq.scheduled&scheduled_at=gte.${new Date(Date.now()-864e5).toISOString()}`),visitsFor:t=>d.visits(C("opportunity_id",t)),createVisit:t=>$.insert("site_visits",t).then(e=>e[0]),updateVisit:(t,e)=>$.update("site_visits",C("id",t),e).then(a=>a[0]),quotes:(t="")=>$.select("quotes",`select=*,opportunities(id,ref,title,stage,next_action_due,company_id,companies(name))&${H("prepared_on","desc")}${t?"&"+t:""}`),liveQuotes:()=>d.quotes("status=in.(sent,discussed)"),quotesFor:t=>d.quotes(C("opportunity_id",t)),createQuote:t=>$.insert("quotes",t).then(e=>e[0]),updateQuote:(t,e)=>$.update("quotes",C("id",t),e).then(a=>a[0]),projects:(t="")=>$.select("projects",`select=*,companies(id,name),contacts(id,full_name,phone,email),profiles(full_name,initials),opportunities(id,ref)&${H("created_at","desc")}${t?"&"+t:""}`),project:t=>$.select("projects",`select=*,companies(id,name),contacts(id,full_name,phone,email,whatsapp),profiles(full_name,initials),opportunities(id,ref,title)&${C("id",t)}`).then(e=>e[0]||null),updateProject:(t,e)=>$.update("projects",C("id",t),e).then(a=>a[0]),convertToProject:(t,{name:e,startDate:a,targetDate:o}={})=>$.rpc("convert_to_project",{p_opportunity_id:t,p_name:e||null,p_start_date:a||null,p_target_date:o||null}),projectForOpportunity:t=>$.select("projects",`select=id,name,status&${C("opportunity_id",t)}`).then(e=>e[0]||null),enquiries:(t=50)=>$.select("enquiries",`select=*&${H("created_at","desc")}&limit=${t}`),filesFor:(t,e)=>$.select("files",`select=*,profiles(full_name,initials)&${C(t,e)}&${H("created_at","desc")}`),async uploadFile(t,e,a){let o=t.name.replace(/[^\w.\-]+/g,"_").slice(-80),s=`${Object.keys(e)[0].replace("_id","")}/${Object.values(e)[0]}/${Date.now()}-${o}`;await ge.upload(ee,s,t);try{return await $.insert("files",{bucket:ee,path:s,name:t.name,mime:t.type||null,size_bytes:t.size,uploaded_by:a||null,...e}).then(i=>i[0])}catch(i){try{await ge.remove(ee,[s])}catch{}throw i}},downloadUrl:t=>ge.signedUrl(ee,t,120),async dashboard(){let[t,e,a,o,s,i]=await Promise.all([d.openOpportunities(),d.liveQuotes(),d.openTasks(),d.upcomingVisits(),d.recentActivity(10),$.select("v_opportunity_state",`select=id,stage,estimated_value,decided_at&stage=in.(won,lost)&${H("decided_at","desc")}&limit=200`)]);return{open:t,liveQuotes:e,tasks:a,visits:o,recent:s,decided:i}}}});function Te(t){let e=Number(t);if(!Number.isFinite(e)||e===0)return t===0?"$0":"\u2014";let a=Math.abs(e);return a>=1e6?"$"+(e/1e6).toFixed(a%1e6?1:0)+"m":a>=1e3?"$"+(e/1e3).toFixed(a%1e3&&a<1e4?1:0)+"k":"$"+Math.round(e)}function qe(t){if(!t)return"";let e=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:vt,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:!1}).formatToParts(new Date(t)).map(a=>[a.type,a.value]));return`${e.year}-${e.month}-${e.day}T${e.hour}:${e.minute}`}function ze(t){return t?new Date(t+":00+02:00").toISOString():null}function A(t){if(!t)return"\u2014";let e=q(nt(t));return e===null?"\u2014":e===0?"today":e===1?"tomorrow":e===-1?"yesterday":e>0?`in ${e} days`:`${-e} days ago`}function Ae(t){let e=q(nt(t));if(e===null||e>=0)return"";let a=Math.abs(e);return a===1?"1 day overdue":`${a} days overdue`}function Aa(t,e=""){let a=String(t||"").replace(/\D/g,"");return a.length<9?"":`https://wa.me/${a}${e?"?text="+encodeURIComponent(e):""}`}var Cn,k,Ln,Dn,jn,Ta,L,Ve,kt,nt,qa,x,n,ft,St,P=j(()=>{ae();B();Cn=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}),k=(t,e="USD")=>{if(t==null||t==="")return"\u2014";let a=Number(t);return Number.isFinite(a)?e==="USD"?Cn.format(a):`${e} ${a.toLocaleString("en-US",{maximumFractionDigits:0})}`:"\u2014"};Ln=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",timeZone:vt}),Dn=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:vt}),jn=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hour12:!1,timeZone:vt}),Ta=t=>typeof t=="string"&&t.length===10?new Date(t+"T12:00:00Z"):new Date(t),L=t=>t?Ln.format(Ta(t)):"\u2014",Ve=t=>t?Dn.format(Ta(t)):"\u2014",kt=t=>t?jn.format(new Date(t)):"\u2014",nt=t=>t?typeof t=="string"&&t.length===10?t:new Intl.DateTimeFormat("en-CA",{timeZone:vt}).format(new Date(t)):"";qa=t=>String(t||"").split(/[\s.]+/).filter(Boolean).map(e=>e[0]).slice(0,2).join("").toUpperCase()||"?",x=(t,e,a)=>`${t} ${t===1?e:a||e+"s"}`,n=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),ft=t=>"tel:"+String(t||"").replace(/[^\d+]/g,"");St=(t,e="",a="")=>{if(!t)return"";let o=[];return e&&o.push("subject="+encodeURIComponent(e)),a&&o.push("body="+encodeURIComponent(a)),`mailto:${t}${o.length?"?"+o.join("&"):""}`}});var S,c,io,ro,W=j(()=>{S=(t,e=16)=>`<svg width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true" focusable="false">${t}</svg>`,c={dashboard:t=>S('<rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',t),pipeline:t=>S('<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="11" rx="1.5"/><rect x="16" y="4" width="5" height="7" rx="1.5"/>',t),bell:t=>S('<path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',t),alert:t=>S('<path d="M12 3.5 2.6 19.2a1.4 1.4 0 0 0 1.2 2.1h16.4a1.4 1.4 0 0 0 1.2-2.1L12 3.5z"/><path d="M12 9.5v4.2"/><path d="M12 17.4h.01"/>',t),clock:t=>S('<circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.1 1.9"/>',t),check:t=>S('<path d="M20 6.5 9.4 17.1 4 11.7"/>',t),cross:t=>S('<path d="M18 6 6 18M6 6l12 12"/>',t),phone:t=>S('<path d="M21.5 16.9v2.6a1.8 1.8 0 0 1-2 1.8 17.8 17.8 0 0 1-7.7-2.8 17.5 17.5 0 0 1-5.4-5.4A17.8 17.8 0 0 1 3.6 5.4a1.8 1.8 0 0 1 1.8-2h2.6a1.8 1.8 0 0 1 1.8 1.5c.1.9.3 1.7.5 2.5a1.8 1.8 0 0 1-.4 1.9L8.8 10.4a14 14 0 0 0 5.2 5.2l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.2 1.6.4 2.5.5a1.8 1.8 0 0 1 1.5 1.8z"/>',t),whatsapp:t=>S('<path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.6-4.5a8.4 8.4 0 1 1 15.4-4.4z"/><path d="M9 9.3c.3-.5.6-.5.9-.5h.5c.2 0 .4.1.6.5l.6 1.4c.1.2 0 .4-.1.6l-.5.6a7 7 0 0 0 3 3l.6-.5c.2-.2.4-.2.6-.1l1.4.6c.4.2.5.4.5.6v.5c0 .3 0 .6-.5.9a2.5 2.5 0 0 1-2.4.2 11.6 11.6 0 0 1-4.6-4.6A2.5 2.5 0 0 1 9 9.3z"/>',t),mail:t=>S('<rect x="2.8" y="4.8" width="18.4" height="14.4" rx="2"/><path d="m3.4 6.4 8.6 6 8.6-6"/>',t),globe:t=>S('<circle cx="12" cy="12" r="8.8"/><path d="M3.4 12h17.2"/><path d="M12 3.2a13 13 0 0 1 0 17.6 13 13 0 0 1 0-17.6z"/>',t),users:t=>S('<path d="M16.5 20v-1.8a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.2V20"/><circle cx="9.8" cy="7.6" r="3.6"/><path d="M21 20v-1.8a3.6 3.6 0 0 0-2.7-3.5"/><path d="M15.4 4.2a3.6 3.6 0 0 1 0 7"/>',t),pin:t=>S('<path d="M20 10.4c0 5.5-8 11.2-8 11.2s-8-5.7-8-11.2a8 8 0 0 1 16 0z"/><circle cx="12" cy="10.2" r="2.8"/>',t),doc:t=>S('<path d="M14 2.8H7.2a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2V7.8z"/><path d="M14 2.8v5h4.8"/><path d="M8.8 13h6.4M8.8 16.6h4.4"/>',t),calendar:t=>S('<rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M16 3v4M8 3v4M3.4 10.2h17.2"/>',t),note:t=>S('<path d="M4.4 4.6h15.2v10.2l-4.8 4.6H4.4z"/><path d="M19.6 14.8h-4.8v4.6"/>',t),arrowRight:t=>S('<path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5"/>',t),chevron:t=>S('<path d="m9 5.5 6.5 6.5L9 18.5"/>',t),plus:t=>S('<path d="M12 5.5v13M5.5 12h13"/>',t),refresh:t=>S('<path d="M20.5 11a8.5 8.5 0 1 0-.6 5"/><path d="M20.5 4.8V11h-6.2"/>',t),menu:t=>S('<path d="M4 7h16M4 12h16M4 17h16"/>',t),move:t=>S('<path d="M9 6.5 12 3.5l3 3M15 17.5 12 20.5l-3-3M6.5 9 3.5 12l3 3M17.5 9l3 3-3 3"/>',t),briefcase:t=>S('<rect x="2.8" y="7" width="18.4" height="13.5" rx="2"/><path d="M8.5 7V5.2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7"/><path d="M2.8 12.5h18.4"/>',t),file:t=>S('<path d="M14 2.8H7.2a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2V7.8z"/><path d="M14 2.8v5h4.8"/>',t),upload:t=>S('<path d="M21 15.5v3.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.2"/><path d="M7.5 8.5 12 4l4.5 4.5"/><path d="M12 4v12"/>',t),download:t=>S('<path d="M21 15.5v3.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.2"/><path d="M7.5 11.5 12 16l4.5-4.5"/><path d="M12 16V4"/>',t),search:t=>S('<circle cx="10.8" cy="10.8" r="7"/><path d="m20.5 20.5-4.7-4.7"/>',t),logout:t=>S('<path d="M9.5 20.5H5.4a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2h4.1"/><path d="m15.5 16.5 4.5-4.5-4.5-4.5"/><path d="M20 12H9.5"/>',t),shield:t=>S('<path d="M12 21.3s7.5-3.6 7.5-9.3V5.6L12 2.8 4.5 5.6v6.4c0 5.7 7.5 9.3 7.5 9.3z"/><path d="m9 12 2.2 2.2L15.4 10"/>',t),edit:t=>S('<path d="M16.5 3.9a2.1 2.1 0 0 1 3 3L8.2 18.2l-4 1 1-4z"/>',t),filter:t=>S('<path d="M3.5 5.5h17l-6.6 7.8v5.4l-3.8 2v-7.4z"/>',t),building:t=>S('<path d="M4 20.5V5.2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v15.3"/><path d="M15 10.5h3a2 2 0 0 1 2 2v8"/><path d="M2.6 20.5h18.8"/><path d="M7.5 7.5h4M7.5 11h4M7.5 14.5h4"/>',t),task:t=>S('<rect x="3.4" y="4.5" width="17.2" height="16" rx="2"/><path d="M8 3v3M16 3v3"/><path d="m8.6 13.2 2.2 2.2 4.6-4.6"/>',t),trend:t=>S('<path d="M3.5 16.5 9 11l4 4 7.5-7.5"/><path d="M14.5 7.5h6v6"/>',t)},io={Phone:c.phone,WhatsApp:c.whatsapp,Email:c.mail,Website:c.globe,Referral:c.users},ro={enquiry:c.bell,call:c.phone,whatsapp:c.whatsapp,email:c.mail,visit:c.pin,quote:c.doc,stage:c.move,note:c.note,task:c.clock}});function Dt(t){let e=lt(t);if(e.level==="closed")return Nn(t.stage);if(e.level==="clear")return`<span class="pill pill-quiet">${n(e.label)}</span>`;let a={overdue:c.alert(13),unbooked:c.alert(13),today:c.clock(13),soon:c.clock(13)}[e.level];return`<span class="pill pill-${n(e.level)}">${a}${n(e.label)}</span>`}function $t(t,{text:e="",size:a="sm"}={}){if(!t)return"";let o=[];t.phone&&o.push(`<a class="btn-ghost btn-${a}" href="${n(ft(t.phone))}">${c.phone(14)}<span>Call</span></a>`);let s=Aa(t.whatsapp||t.phone,e);return s&&o.push(`<a class="btn-ghost btn-${a}" href="${n(s)}" target="_blank" rel="noopener">${c.whatsapp(14)}<span>WhatsApp</span></a>`),t.email&&o.push(`<a class="btn-ghost btn-${a}" href="${n(St(t.email))}">${c.mail(14)}<span>Email</span></a>`),o.join("")}function Da(t,{showStage:e=!0}={}){return`
    <li class="att">
      <a class="att-link" href="#/opportunity/${n(t.id)}">
        <span class="att-head">
          <span class="att-title">${n(t.title)}</span>
          ${Dt(t)}
          ${Ot(t.priority)}
        </span>
        <span class="att-meta">
          ${n(t.company_name||t.contact_name||"No company")} \xB7 ${n(t.ref)}
          ${t.estimated_value?` \xB7 <span class="num">${n(k(t.estimated_value,t.currency))}</span>`:""}
          ${e?` \xB7 ${n(at[t.stage]?.name||t.stage)}`:""}
        </span>
        <span class="att-action">
          ${t.next_action?`${c.arrowRight(14)}<span>${n(t.next_action)}</span>${t.next_action_due?`<span class="att-when">${n(L(t.next_action_due))}</span>`:""}`:`${c.alert(14)}<span>Nobody has booked a next action</span>`}
        </span>
      </a>
      <span class="att-owner">${T(t.owner_name?{full_name:t.owner_name,initials:t.owner_initials}:null,28)}</span>
    </li>`}var f,oe,w,La,Je,ct,Nn,jt,Mn,It,Rt,Ot,T,ja,Oa,Bt,Le,V=j(()=>{P();B();W();f=(t,e,{note:a="",action:o="",tight:s=!1,id:i=""}={})=>`
  <section class="card${s?" card-tight":""}"${i?` id="${n(i)}"`:""}>
    ${t?`<header class="card-head">
      <h2 class="card-title">${n(t)}</h2>
      ${a?`<p class="card-note">${n(a)}</p>`:""}
      ${o}
    </header>`:""}
    ${e}
  </section>`,oe=({label:t,value:e,unit:a="",foot:o="",tone:s="",href:i=""})=>{let r=`
    <p class="stat-label">${n(t)}</p>
    <p class="stat-value num">${n(e)}${a?`<span class="stat-unit">${n(a)}</span>`:""}</p>
    ${o?`<p class="stat-foot">${o}</p>`:""}`;return i?`<a class="stat${s?" stat-"+s:""}" href="${n(i)}">${r}
         <span class="stat-go" aria-hidden="true">${c.arrowRight(15)}</span></a>`:`<div class="stat${s?" stat-"+s:""}">${r}</div>`},w=(t,e="",{tone:a="ok"}={})=>`
  <div class="empty">
    <span class="empty-mark empty-${n(a)}" aria-hidden="true">${a==="ok"?c.check(20):c.note(20)}</span>
    <p class="empty-text">${n(t)}</p>
    ${e?`<p class="empty-sub">${n(e)}</p>`:""}
  </div>`,La=(t=3)=>`
  <div class="skel" role="status" aria-live="polite">
    <span class="sr-only">Loading\u2026</span>
    ${Array.from({length:t},()=>'<span class="skel-row"></span>').join("")}
  </div>`,Je=(t,{retry:e=!0}={})=>`
  <div class="err" role="alert">
    <span class="err-mark" aria-hidden="true">${c.alert(20)}</span>
    <p class="err-text">${n(t)}</p>
    ${e?'<button type="button" class="btn-ghost btn-sm" data-retry>Try again</button>':""}
  </div>`,ct=t=>`<div class="tbl-wrap">${t}</div>`;Nn=t=>t==="won"?`<span class="pill pill-won">${c.check(13)}Won</span>`:t==="lost"?`<span class="pill pill-lost">${c.cross(13)}Lost</span>`:`<span class="pill pill-quiet">${n(at[t]?.name||t)}</span>`,jt=t=>`<span class="src">${(c[Mn[t]]||c.globe)(13)}${n(Lt[t]||t)}</span>`,Mn={website:"globe",whatsapp:"whatsapp",phone:"phone",email:"mail",referral:"users",walk_in:"pin",other:"note"},It=t=>{let e=t==="accepted"?"won":t==="rejected"||t==="expired"?"lost":"quiet",a=t==="accepted"?c.check(13):t==="rejected"||t==="expired"?c.cross(13):c.doc(13);return`<span class="pill pill-${e}">${a}${n(Mt[t]||t)}</span>`},Rt=t=>`<span class="pill pill-${t==="complete"?"won":t==="cancelled"?"lost":t==="on_hold"?"today":"quiet"}">${n(Pt[t]||t)}</span>`,Ot=t=>t==="urgent"?`<span class="pill pill-overdue">${c.alert(13)}Urgent</span>`:t==="high"?'<span class="pill pill-today">High</span>':t==="low"?'<span class="pill pill-quiet">Low</span>':"",T=(t,e=26)=>t?`<span class="avatar" style="--s:${e}px" title="${n(t.full_name||"")}">${n(t.initials||qa(t.full_name))}</span>`:`<span class="avatar avatar-none" style="--s:${e}px" title="Unassigned">?</span>`;ja=t=>`
  <li class="feed-row">
    <span class="feed-ic">${(c[Oa[t.kind]]||c.note)(14)}</span>
    <span class="feed-body">
      ${t.opportunities?`<a class="feed-link" href="#/opportunity/${n(t.opportunities.id)}">${n(t.opportunities.title)}</a>`:""}
      <span class="feed-text">${n(t.body)}</span>
    </span>
    <span class="feed-when">${n(t.profiles?.initials||"\u2014")} \xB7 ${n(A(t.occurred_at))}</span>
  </li>`,Oa={enquiry:"bell",note:"note",call:"phone",whatsapp:"whatsapp",email:"mail",meeting:"users",site_visit:"pin",quote:"doc",stage_change:"move",task:"clock",file:"file",won:"check",lost:"cross",system:"refresh"},Bt=t=>t.length?`
  <ol class="timeline">
    ${t.map(e=>`
      <li class="tl">
        <span class="tl-ic tl-${n(e.kind)}">${(c[Oa[e.kind]]||c.note)(14)}</span>
        <span class="tl-body">
          <span class="tl-kind">${n(ve[e.kind]||e.kind)}</span>
          <span class="tl-text">${n(e.body)}</span>
          ${e.opportunities?`<a class="tl-ref" href="#/opportunity/${n(e.opportunities.id)}">${n(e.opportunities.ref)} \xB7 ${n(e.opportunities.title)}</a>`:""}
        </span>
        <span class="tl-when">
          <span class="tl-date num">${n(L(e.occurred_at))}</span>
          <span class="tl-rel">${n(A(e.occurred_at))}${e.profiles?.initials?" \xB7 "+n(e.profiles.initials):""}</span>
        </span>
      </li>`).join("")}
  </ol>`:w("Nothing logged yet.","Calls, visits and quotations appear here as they happen.",{tone:"quiet"}),Le=t=>{if(!t)return'<span class="fu-date fu-none">\u2014</span><span class="fu-rel is-late">not booked</span>';let e=Ae(t);return`<span class="fu-date num">${n(L(t))}</span>
          <span class="fu-rel${e?" is-late":""}">${n(e||A(t))}</span>`}});var Ua={};Q(Ua,{after:()=>K,clearErrors:()=>Pa,closeDialog:()=>Pn,confirmDialog:()=>Un,dateInput:()=>J,dateTimeInput:()=>De,dialog:()=>G,field:()=>u,fieldError:()=>U,nul:()=>y,num:()=>Tt,number:()=>Et,readForm:()=>Na,select:()=>O,setFieldError:()=>Ma,text:()=>D,textarea:()=>z,toast:()=>v});function Na(t){let e={};for(let a of t.querySelectorAll("input, select, textarea"))a.name&&(e[a.name]=a.type==="checkbox"?a.checked:a.value.trim());return e}function Ma(t,e,a){let o=t.querySelector(`[data-err-for="${e}"]`),s=t.querySelector("#"+CSS.escape(e));o&&(o.textContent=a||"",o.hidden=!a),s&&(s.classList.toggle("is-bad",!!a),a?s.setAttribute("aria-invalid","true"):s.removeAttribute("aria-invalid"))}function Pa(t){t.querySelectorAll("[data-err-for]").forEach(e=>{e.textContent="",e.hidden=!0}),t.querySelectorAll(".is-bad").forEach(e=>{e.classList.remove("is-bad"),e.removeAttribute("aria-invalid")})}function v(t,e="ok"){Ft||(Ft=document.createElement("div"),Ft.className="toasts",Ft.setAttribute("aria-live","polite"),document.body.appendChild(Ft));let a=document.createElement("p");a.className=`toast toast-${e}`,a.innerHTML=`${e==="bad"?c.alert(15):c.check(15)}<span>${n(t)}</span>`,Ft.appendChild(a),setTimeout(()=>{a.classList.add("is-out"),setTimeout(()=>a.remove(),260)},e==="bad"?5200:2800)}function G({title:t,sub:e="",body:a,submitLabel:o="Save",onSubmit:s,width:i=520}){Wt&&Wt();let r=document.activeElement,l=document.createElement("div");l.className="modal",l.innerHTML=`
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="dlg-h" style="--w:${i}px">
      <form novalidate>
        <h2 class="modal-title display" id="dlg-h">${n(t)}</h2>
        ${e?`<p class="modal-sub">${n(e)}</p>`:""}
        <div class="modal-body">${a}</div>
        <p class="modal-err" role="alert" hidden></p>
        <div class="modal-foot">
          <button type="button" class="btn-ghost btn-sm" data-cancel>Cancel</button>
          <button type="submit" class="btn btn-sm" data-save>${n(o)}</button>
        </div>
      </form>
    </div>`,document.body.appendChild(l),document.body.classList.add("is-modal");let g=l.querySelector("form"),h=l.querySelector(".modal-err"),Y=l.querySelector("[data-save]");(l.querySelector("input:not([type=hidden]), select, textarea")||Y).focus();let pt=I=>{if(I.key==="Escape"){I.preventDefault(),ut();return}if(I.key!=="Tab")return;let et=[...l.querySelectorAll("input, select, textarea, button, [href]")].filter(Nt=>!Nt.disabled&&Nt.offsetParent!==null);if(!et.length)return;let[Z,At]=[et[0],et[et.length-1]];I.shiftKey&&document.activeElement===Z?(I.preventDefault(),At.focus()):!I.shiftKey&&document.activeElement===At&&(I.preventDefault(),Z.focus())};function ut(){document.removeEventListener("keydown",pt,!0),l.remove(),document.body.classList.remove("is-modal"),Wt=null,r&&document.contains(r)&&r.focus()}return document.addEventListener("keydown",pt,!0),l.querySelector("[data-cancel]").addEventListener("click",ut),l.addEventListener("mousedown",I=>{I.target===l&&ut()}),g.addEventListener("submit",async I=>{I.preventDefault(),Pa(l),h.hidden=!0,Y.disabled=!0;let et=Y.textContent;Y.textContent="Saving\u2026";try{await s(Na(g),l),ut()}catch(Z){Z?.field?(Ma(l,Z.field,Z.message),l.querySelector("#"+CSS.escape(Z.field))?.focus()):(h.textContent=Z?.message||"That could not be saved.",h.hidden=!1),Y.disabled=!1,Y.textContent=et}}),Wt=ut,ut}function Pn(){Wt&&Wt()}function K(t,...e){typeof t=="function"&&setTimeout(()=>{Promise.resolve(t(...e)).catch(a=>console.error("[kingson] refresh after save failed",a))},0)}function Un({title:t,message:e,confirmLabel:a="Confirm",tone:o="danger"}){return new Promise(s=>{let i=G({title:t,body:`<p class="modal-message">${n(e)}</p>`,submitLabel:a,width:420,onSubmit:async()=>{s(!0)}}),r=document.querySelector(".modal");r?.addEventListener("click",h=>{h.target.closest("[data-cancel]")&&s(!1)});let l=r?.querySelector("[data-save]");l&&o==="danger"&&l.classList.add("btn-danger");let g=new MutationObserver(()=>{document.body.contains(r)||(s(!1),g.disconnect())});g.observe(document.body,{childList:!0})})}var u,D,z,Et,J,De,O,y,Tt,Ft,Wt,U,dt=j(()=>{P();W();u=(t,e,a,{hint:o="",wide:s=!1}={})=>`
  <div class="field${s?" field-wide":""}">
    <label for="${n(t)}">${n(e)}</label>
    ${a}
    ${o?`<p class="field-hint">${n(o)}</p>`:""}
    <p class="field-err" data-err-for="${n(t)}" hidden></p>
  </div>`,D=(t,e="",a="")=>`<input class="inp" id="${n(t)}" name="${n(t)}" type="text" value="${n(e)}" ${a}>`,z=(t,e="",a=3,o="")=>`<textarea class="inp" id="${n(t)}" name="${n(t)}" rows="${a}" ${o}>${n(e)}</textarea>`,Et=(t,e="",a="")=>`<input class="inp" id="${n(t)}" name="${n(t)}" type="number" inputmode="decimal" value="${e??""}" ${a}>`,J=(t,e="",a="")=>`<input class="inp" id="${n(t)}" name="${n(t)}" type="date" value="${n(e)}" ${a}>`,De=(t,e="",a="")=>`<input class="inp" id="${n(t)}" name="${n(t)}" type="datetime-local" value="${n(e)}" ${a}>`,O=(t,e,a="",o="")=>`
  <select class="sel" id="${n(t)}" name="${n(t)}" ${o}>
    ${e.map(s=>{let[i,r]=Array.isArray(s)?s:[s,s];return`<option value="${n(i)}"${String(i)===String(a??"")?" selected":""}>${n(r)}</option>`}).join("")}
  </select>`;y=t=>t===""||t===void 0?null:t,Tt=t=>t===""||t===null||t===void 0?null:Number(t);Ft=null;Wt=null;U=(t,e)=>Object.assign(new Error(e),{field:t})});var Ia={};Q(Ia,{render:()=>Rn,sub:()=>Bn,title:()=>In});async function Rn(){let{open:t,liveQuotes:e,tasks:a,visits:o,recent:s,decided:i}=await d.dashboard(),r=t.filter(rt),l=t.filter(ke),g=t.filter(Ut),h=t.filter(m=>m.stage==="new"),Y=t.filter(Se),tt=i.filter(m=>m.stage==="won"),pt=i.filter(m=>m.stage==="lost"),ut=tt.length+pt.length?Math.round(tt.length/(tt.length+pt.length)*100):0,I=a.filter(m=>m.due_date&&q(m.due_date)<=0),et=o.filter(m=>{let N=q(m.scheduled_at);return N!==null&&N>=0&&N<=7}),Z=`
    <div class="stats">
      ${oe({label:"Open opportunities",value:String(t.length),foot:`<span class="num">${n(k(M(t,m=>m.estimated_value)))}</span> in the pipeline`,href:"#/pipeline"})}
      ${oe({label:"New enquiries",value:String(h.length),tone:h.length?"warn":"",foot:h.length?"Not yet responded to":"All answered",href:"#/pipeline"})}
      ${oe({label:"Overdue follow-ups",value:String(r.length),tone:r.length?"danger":"",foot:r.length?`<span class="num">${n(k(M(r,m=>m.estimated_value)))}</span> at risk of going quiet`:"Nothing past its date",href:"#/followups"})}
      ${oe({label:"Quotes awaiting a decision",value:String(e.length),foot:e.length?`<span class="num">${n(k(M(e,m=>m.amount)))}</span> out`:"None out at the moment",href:"#/quotes"})}
    </div>`,At=[...r,...g,...l,...h].filter((m,N,wt)=>wt.findIndex(Sn=>Sn.id===m.id)===N).sort((m,N)=>lt(N).sort-lt(m).sort).slice(0,12),Nt=f("Needs attention",At.length?`<ul class="att-list">${At.map(m=>Da(m)).join("")}</ul>`:w("Nothing is overdue and nothing is unbooked.","Every open opportunity has a next action with a date on it."),{note:"Overdue, unbooked, due today or unanswered \u2014 in any stage",tight:!0}),Ie=f("Today and the week ahead",`
    <div class="two-up">
      <div>
        <p class="sub-h">${c.pin(14)} Site visits</p>
        ${et.length?`<ul class="mini">${et.slice(0,5).map(m=>`
          <li><a href="#/opportunity/${n(m.opportunities?.id||"")}">
            <span class="mini-main">${n(m.opportunities?.title||"Visit")}</span>
            <span class="mini-sub">${n(kt(m.scheduled_at))}${m.location?" \xB7 "+n(m.location):""}</span>
          </a><span class="mini-side">${T(m.profiles,24)}</span></li>`).join("")}</ul>`:'<p class="mini-none">No visits booked in the next seven days.</p>'}
      </div>
      <div>
        <p class="sub-h">${c.clock(14)} Calls and follow-ups due</p>
        ${I.length?`<ul class="mini">${I.slice(0,5).map(m=>`
          <li><a href="${m.opportunities?"#/opportunity/"+n(m.opportunities.id):"#/tasks"}">
            <span class="mini-main">${n(m.title)}</span>
            <span class="mini-sub${q(m.due_date)<0?" is-late":""}">${n(A(m.due_date))}${m.channel?" \xB7 "+n(m.channel):""}</span>
          </a><span class="mini-side">${T(m.profiles,24)}</span></li>`).join("")}</ul>`:'<p class="mini-none">Nothing due today.</p>'}
      </div>
    </div>`,{note:`${x(et.length,"visit")} \xB7 ${x(I.length,"task")}`}),_=mt.filter(m=>m.open).map(m=>{let N=t.filter(wt=>wt.stage===m.id);return{s:m,n:N.length,value:M(N,wt=>wt.estimated_value)}}),_n=Math.max(1,..._.map(m=>m.value)),bn=f("Pipeline by stage",`
    <ul class="funnel">
      ${_.map(m=>`
        <li class="funnel-row${m.n?"":" is-empty"}">
          <a class="funnel-label" href="#/pipeline">${n(m.s.name)}</a>
          <span class="funnel-track"><span class="funnel-bar" style="--w:${(m.value/_n*100).toFixed(1)}%"></span></span>
          <span class="funnel-n num">${m.n||"\u2014"}</span>
          <span class="funnel-v num">${m.value?n(Te(m.value)):"\u2014"}</span>
        </li>`).join("")}
    </ul>
    <p class="funnel-key">Bar length is value. The number beside it is the count.</p>`,{note:"Open stages only"}),wn=f("Decided",`
    <div class="won-lost">
      <div><p class="wl-n num">${tt.length}</p><p class="wl-l">${c.check(13)} Won</p>
        <p class="wl-v num">${n(k(M(tt,m=>m.estimated_value)))}</p></div>
      <div><p class="wl-n num">${pt.length}</p><p class="wl-l">${c.cross(13)} Lost</p>
        <p class="wl-v num">${n(k(M(pt,m=>m.estimated_value)))}</p></div>
      <div><p class="wl-n num">${ut}%</p><p class="wl-l">Win rate</p>
        <p class="wl-v">of ${tt.length+pt.length} decided</p></div>
    </div>`,{note:"Every decided opportunity on record"}),vn=f("Quotations awaiting a decision",e.length?ct(`
    <table class="tbl">
      <thead><tr>
        <th scope="col">Quotation</th><th scope="col">Opportunity</th>
        <th scope="col" class="ta-r">Amount</th><th scope="col">Sent</th><th scope="col">Chase</th>
      </tr></thead>
      <tbody>
        ${e.map(m=>{let N=m.opportunities,wt=N&&!N.next_action_due;return`<tr${wt?' class="tr-risk"':""}>
            <td><a class="lnk" href="#/opportunity/${n(N?.id||"")}">${n(m.reference)}${m.version>1?` <span class="rev">rev ${m.version}</span>`:""}</a></td>
            <td><span class="td-main">${n(N?.title||"\u2014")}</span><span class="td-sub">${n(N?.companies?.name||"")}</span></td>
            <td class="ta-r num">${n(k(m.amount,m.currency))}</td>
            <td><span class="td-main num">${n(L(m.sent_on))}</span><span class="td-sub">${n(A(m.sent_on))}</span></td>
            <td>${wt?`<span class="pill pill-overdue">${c.alert(13)}No chase booked</span>`:`<span class="pill pill-quiet">${n(L(N?.next_action_due))}</span>`}</td>
          </tr>`}).join("")}
      </tbody>
    </table>`):w("No quotations are out."),{note:Y.length?`${x(Y.length,"quotation")} with no follow-up booked`:"All of them have a chase date"}),fe={};for(let m of t)fe[m.source]=(fe[m.source]||0)+1;let xn=f("Where enquiries arrive",Object.keys(fe).length?`
    <ul class="srcs">
      ${Object.entries(fe).sort((m,N)=>N[1]-m[1]).map(([m,N])=>`<li class="srcs-row">${jt(m)}<span class="srcs-n num">${N}</span></li>`).join("")}
    </ul>
    <p class="funnel-key">Open opportunities only. The website writes straight into this pipeline.</p>`:w("No open enquiries yet.","",{tone:"quiet"}),{tight:!0}),kn=f("Recent activity",s.length?`<ul class="feed">${s.map(ja).join("")}</ul>`:w("Nothing logged yet.","",{tone:"quiet"}),{tight:!0});return`
    ${Z}
    <div class="grid grid-main">
      <div class="col-wide">${Nt}${Ie}${vn}</div>
      <div class="col-side">${bn}${wn}${xn}${kn}</div>
    </div>`}function Bn(){return`<span class="sub-quiet">${n(L(ht()))}</span>`}var In,Ra=j(()=>{F();B();P();V();W();In="Dashboard"});var Ba={};Q(Ba,{actions:()=>zn,mount:()=>Gn,render:()=>Wn,sub:()=>Vn,title:()=>Fn});async function Wn(){Ht=await d.openOpportunities();let t=await d.opportunities("stage=in.(won,lost)&order=decided_at.desc&limit=40"),e=[...Ht,...t];return e.length?`
  <div class="board" role="list">
    ${mt.map(a=>{let o=e.filter(r=>r.stage===a.id),s=M(o,r=>r.estimated_value),i=o.filter(rt).length;return`
      <section class="col" data-group="${n(a.group)}" data-stage="${n(a.id)}" role="listitem">
        <header class="col-head">
          <span class="col-name">${n(a.name)}</span>
          <span class="col-n num">${o.length}</span>
          <span class="col-v num">${s?n(Te(s)):""}</span>
          ${i?`<span class="col-alarm" title="${n(x(i,"overdue follow-up"))}">${c.alert(12)}${i}</span>`:""}
        </header>
        <div class="col-body" data-drop="${n(a.id)}">
          ${o.length?o.sort((r,l)=>lt(l).sort-lt(r).sort).map(Hn).join(""):'<p class="col-empty">Nothing here</p>'}
        </div>
      </section>`}).join("")}
  </div>`:w("No opportunities yet.","An enquiry from the website appears here automatically. You can also add one by hand.",{tone:"quiet"})}function Hn(t){let e=lt(t);return`
  <article class="deal${e.level==="overdue"||e.level==="unbooked"?" deal-alarm":""}" draggable="true" data-deal="${n(t.id)}">
    <a class="deal-hit" href="#/opportunity/${n(t.id)}">
      <span class="deal-co">${n(t.company_name||t.contact_name||"No company")}</span>
      <span class="deal-title">${n(t.title)}</span>
    </a>
    <div class="deal-meta">
      <span class="deal-value num">${t.estimated_value?n(k(t.estimated_value,t.currency)):'<span class="dim">no value</span>'}</span>
      ${jt(t.source)}
    </div>
    ${Number(t.live_quotes)?`<p class="deal-quote">${c.doc(12)}${n(x(Number(t.live_quotes),"quotation"))} out${t.last_quote_sent?" \xB7 "+n(A(t.last_quote_sent)):""}</p>`:""}
    <div class="deal-foot">
      ${Dt(t)}
      ${Ot(t.priority)}
      <span class="deal-right">
        ${T(t.owner_name?{full_name:t.owner_name,initials:t.owner_initials}:null,22)}
        <span class="deal-move">
          <label class="sr-only" for="mv-${n(t.id)}">Move ${n(t.title)} to another stage</label>
          <select class="deal-select" id="mv-${n(t.id)}" data-move="${n(t.id)}">
            ${mt.map(o=>`<option value="${n(o.id)}"${o.id===t.stage?" selected":""}>${n(o.short)}</option>`).join("")}
          </select>
          <span class="deal-move-ic" aria-hidden="true">${c.chevron(12)}</span>
        </span>
      </span>
    </div>
  </article>`}function Gn(t,e){async function a(s,i,r){let l=Ht.find(g=>g.id===s)||{id:s,title:"this opportunity",stage:r};if(l.stage!==i){if(i==="lost")return Qn(s,l,e,r,t);try{await d.setStage(s,i),v(`Moved to ${at[i].name}.`),await e()}catch(g){v(g.message||"That move could not be saved.","bad");let h=t.querySelector(`[data-move="${CSS.escape(s)}"]`);h&&r&&(h.value=r)}}}t.addEventListener("change",s=>{let i=s.target.closest("[data-move]");if(!i)return;let r=i.dataset.move,l=Ht.find(g=>g.id===r)?.stage;a(r,i.value,l)});let o=null;t.addEventListener("dragstart",s=>{let i=s.target.closest("[data-deal]");if(i){o=i.dataset.deal,i.classList.add("is-dragging"),s.dataTransfer.effectAllowed="move";try{s.dataTransfer.setData("text/plain",o)}catch{}}}),t.addEventListener("dragend",s=>{s.target.closest("[data-deal]")?.classList.remove("is-dragging"),t.querySelectorAll(".is-over").forEach(i=>i.classList.remove("is-over")),o=null}),t.addEventListener("dragover",s=>{let i=s.target.closest("[data-drop]");!i||!o||(s.preventDefault(),s.dataTransfer.dropEffect="move",i.classList.contains("is-over")||(t.querySelectorAll(".is-over").forEach(r=>r.classList.remove("is-over")),i.classList.add("is-over")))}),t.addEventListener("drop",s=>{let i=s.target.closest("[data-drop]");if(!i||!o)return;s.preventDefault();let r=o;o=null,a(r,i.dataset.drop,Ht.find(l=>l.id===r)?.stage)})}function Qn(t,e,a,o,s){G({title:"Mark as lost",sub:e.title,width:460,submitLabel:"Mark lost",body:u("lost_reason","Why was it lost?",z("lost_reason","",3,'required placeholder="Price \u2014 a competitor came in 14% below"'),{hint:"Recorded on the timeline. This is the part somebody reads back in six months."}),onSubmit:async l=>{if(!l.lost_reason)throw Object.assign(new Error("Give a reason."),{field:"lost_reason"});await d.setStage(t,"lost",{lostReason:l.lost_reason}),v("Marked lost."),await a()}});let i=s.querySelector(`[data-move="${CSS.escape(t)}"]`),r=new MutationObserver(()=>{document.querySelector(".modal")||(i&&document.contains(i)&&o&&(i.value=o),r.disconnect())});r.observe(document.body,{childList:!0})}function Vn(){let t=Ht.filter(e=>at[e.stage]?.open);return`${n(x(t.length,"open opportunity","open opportunities"))} \xB7 <span class="num">${n(k(M(t,e=>e.estimated_value)))}</span>`}var Fn,Ht,zn,Fa=j(()=>{F();B();P();V();W();dt();Fn="Pipeline",Ht=[];zn=()=>`<button type="button" class="btn btn-sm" data-new-opp>${c.plus(14)}<span>New opportunity</span></button>`});var je={};Q(je,{bookFollowUp:()=>le,contactDialog:()=>Xe,convertDialog:()=>ta,logActivity:()=>re,newOpportunity:()=>Ze,projectDialog:()=>ea,quoteDialog:()=>Gt,taskDialog:()=>ce,visitDialog:()=>Qt});async function Ze({me:t,contact:e=null,onDone:a}){let o=await d.profiles();G({title:"New opportunity",sub:e?`For ${e.full_name}`:"A job somebody has asked about",width:620,submitLabel:"Create",body:`
      <div class="field-row">
        ${u("title","What is the job?",D("title","",'required placeholder="Warehouse extension \u2014 3 bays"'),{wide:!0})}
      </div>
      <div class="field-row">
        ${u("contact_name","Contact",D("contact_name",e?.full_name||"",e?"readonly":'placeholder="Tendai Moyo"'))}
        ${u("company","Company",D("company","",'placeholder="Msasa Park Logistics"'))}
      </div>
      <div class="field-row">
        ${u("phone","Phone / WhatsApp",D("phone",e?.phone||"",'placeholder="+263 77 000 0000"'))}
        ${u("email","Email",D("email",e?.email||"",'type="email" placeholder="name@company.co.zw"'))}
      </div>
      <div class="field-row">
        ${u("service","Service",O("service",["","Structural steelwork","Roof steelwork and trusses","Fiber laser cutting","Balustrades and gates","Stainless fabrication","Mobile cranage","Other"]))}
        ${u("source","How did it come in?",O("source",be.map(s=>[s,Lt[s]]),"phone"))}
      </div>
      <div class="field-row">
        ${u("location","Site",D("location","",'placeholder="Msasa, Harare"'))}
        ${u("estimated_value","Estimated value (USD)",Et("estimated_value","",'min="0" step="100"'))}
      </div>
      <div class="field-row">
        ${u("owner_id","Owner",O("owner_id",ie(o),t?.id||""))}
        ${u("priority","Priority",O("priority",se.map(s=>[s,Ye(s)]),"normal"))}
      </div>
      <div class="field-row">
        ${u("next_action","Next action",D("next_action","Call and qualify the enquiry","required"))}
        ${u("next_action_due","Due",J("next_action_due",xe(),"required"))}
      </div>
      ${u("description","What do they want?",z("description","",3),{wide:!0})}`,onSubmit:async s=>{if(!s.title)throw U("title","Give the job a name.");if(!e&&!s.contact_name)throw U("contact_name","Who is asking?");if(!s.phone&&!s.email&&!e)throw U("phone","A phone number or an email address is needed.");let i=e?.id||null,r=null;s.company&&(r=(await d.findOrCreateCompany(s.company))?.id||null),i?r&&await d.updateContact(i,{company_id:r}):i=(await d.createContact({full_name:s.contact_name,company_id:r,email:y(s.email)&&s.email.toLowerCase(),phone:y(s.phone),whatsapp:y(s.phone),preferred_channel:s.email?"Email":"Phone"})).id;let l=await d.createOpportunity({title:s.title,company_id:r,contact_id:i,owner_id:y(s.owner_id),stage:"new",priority:s.priority,source:s.source,service:y(s.service),description:y(s.description),location:y(s.location),estimated_value:Tt(s.estimated_value),next_action:s.next_action,next_action_due:y(s.next_action_due)});await d.logActivity({opportunity_id:l.id,contact_id:i,kind:"enquiry",body:`Enquiry logged by hand (${Lt[s.source]||s.source}).`+(s.description?" \u2014 "+s.description:""),actor_id:t?.id||null}),v(`${l.ref} created.`),a?K(a,l):location.hash=`#/opportunity/${l.id}`}})}function re({opportunityId:t,contactId:e,me:a,onDone:o}){G({title:"Log an interaction",sub:"Goes on the timeline exactly as written",width:520,submitLabel:"Log it",body:`
      ${u("kind","What happened?",O("kind",_a.map(s=>[s,ve[s]]),"call"))}
      ${u("body","Notes",z("body","",4,'required placeholder="Spoke to Tendai. Wants the quotation by Friday."'),{wide:!0})}
      ${u("occurred_at","When",De("occurred_at",qe(new Date)),{hint:"Change this if you are catching up on something from earlier."})}`,onSubmit:async s=>{if(!s.body)throw U("body","Write what happened.");await d.logActivity({opportunity_id:t||null,contact_id:e||null,kind:s.kind,body:s.body,actor_id:a?.id||null,occurred_at:ze(s.occurred_at)||new Date().toISOString()}),v("Logged."),K(o)}})}async function le({opp:t,me:e,onDone:a}){let o=await d.profiles();G({title:t.next_action_due?"Change the next action":"Book the next action",sub:"Every open opportunity should have one. This is what puts it on the follow-up list.",width:540,submitLabel:"Save",body:`
      ${u("next_action","What needs to happen",D("next_action",t.next_action||"",'required placeholder="Chase the quotation"'),{wide:!0})}
      <div class="field-row">
        ${u("next_action_due","When",J("next_action_due",nt(t.next_action_due)||xe(),"required"))}
        ${u("owner_id","Owner",O("owner_id",ie(o),t.owner_id||e?.id||""))}
      </div>
      ${u("channel","How",O("channel",["Phone","WhatsApp","Email","Site visit","In person"],"Phone"))}
      ${u("also_task","Also add it to the task list",'<label class="check"><input type="checkbox" id="also_task" name="also_task" checked> <span>Create a task as well</span></label>',{wide:!0})}`,onSubmit:async s=>{if(!s.next_action)throw U("next_action","Say what needs to happen.");if(!s.next_action_due)throw U("next_action_due","Give it a date.");await d.updateOpportunity(t.id,{next_action:s.next_action,next_action_due:s.next_action_due,owner_id:y(s.owner_id)}),s.also_task&&await d.createTask({title:s.next_action,opportunity_id:t.id,contact_id:t.contact_id,owner_id:y(s.owner_id),due_date:s.next_action_due,channel:s.channel,priority:t.priority}),await d.logActivity({opportunity_id:t.id,contact_id:t.contact_id,kind:"task",body:`Next action booked for ${s.next_action_due}: ${s.next_action} (${s.channel})`,actor_id:e?.id||null}),v("Booked."),K(a)}})}function Gt({opp:t,quote:e=null,me:a,onDone:o}){let s=!!e;G({title:s?`Quotation ${e.reference}`:"New quotation",sub:t.title,width:560,submitLabel:s?"Save":"Create",body:`
      <div class="field-row">
        ${u("amount","Amount (USD)",Et("amount",e?.amount??"",'required min="0" step="1"'))}
        ${u("version","Revision",Et("version",e?.version??1,'min="1" step="1"'))}
      </div>
      <div class="field-row">
        ${u("status","Status",O("status",we.map(i=>[i,Mt[i]]),e?.status||"draft"))}
        ${u("prepared_on","Prepared",J("prepared_on",nt(e?.prepared_on)||ht()))}
      </div>
      <div class="field-row">
        ${u("sent_on","Sent",J("sent_on",nt(e?.sent_on)),{hint:"Required once the status is anything past draft."})}
        ${u("follow_up_on","Chase on",J("follow_up_on",nt(e?.follow_up_on)))}
      </div>
      ${u("valid_until","Valid until",J("valid_until",nt(e?.valid_until)))}
      ${u("notes","Notes",z("notes",e?.notes||"",2),{wide:!0})}`,onSubmit:async i=>{let r=Tt(i.amount);if(r===null||Number.isNaN(r))throw U("amount","Give the amount.");if(r<0)throw U("amount","That cannot be negative.");if(i.status!=="draft"&&i.status!=="expired"&&!i.sent_on)throw U("sent_on","A quotation past draft needs the date it went out.");let g={amount:r,version:Tt(i.version)||1,status:i.status,prepared_on:y(i.prepared_on)||ht(),sent_on:y(i.sent_on),valid_until:y(i.valid_until),follow_up_on:y(i.follow_up_on),notes:y(i.notes)};s?await d.updateQuote(e.id,g):await d.createQuote({...g,opportunity_id:t.id}),v(s?"Quotation saved.":"Quotation created."),K(o)}})}async function Qt({opp:t,visit:e=null,me:a,onDone:o}){let s=await d.profiles(),i=!!e;G({title:i?"Site visit":"Book a site visit",sub:t?.title||"",width:560,submitLabel:i?"Save":"Book",body:`
      <div class="field-row">
        ${u("scheduled_at","When",De("scheduled_at",qe(e?.scheduled_at)||qe(new Date(Date.now()+864e5)),"required"))}
        ${u("owner_id","Who is going",O("owner_id",ie(s),e?.owner_id||a?.id||""))}
      </div>
      ${u("location","Where",D("location",e?.location||t?.location||"",'placeholder="Msasa, Harare"'),{wide:!0})}
      ${u("purpose","Purpose",D("purpose",e?.purpose||"Measure up and assess access",""),{wide:!0})}
      ${i?`
        ${u("status","Status",O("status",["scheduled","completed","cancelled"].map(r=>[r,Ye(r)]),e.status))}
        ${u("outcome","Outcome",z("outcome",e.outcome||"",3,'placeholder="Existing purlins sound. Access good from the north gate."'),{wide:!0})}`:""}
      ${u("notes","Notes",z("notes",e?.notes||"",2),{wide:!0})}`,onSubmit:async r=>{if(!r.scheduled_at)throw U("scheduled_at","Give a date and time.");let l={scheduled_at:ze(r.scheduled_at),owner_id:y(r.owner_id),location:y(r.location),purpose:y(r.purpose),notes:y(r.notes)};i?(l.status=r.status,l.outcome=y(r.outcome),await d.updateVisit(e.id,l)):(await d.createVisit({...l,opportunity_id:t.id,status:"scheduled"}),["new","contacted"].includes(t.stage)&&await d.updateOpportunity(t.id,{stage:"requirements"})),v(i?"Visit saved.":"Visit booked."),K(o)}})}async function ce({task:t=null,opp:e=null,me:a,onDone:o}){let s=await d.profiles(),i=!!t;G({title:i?"Task":"New task",sub:e?.title||t?.opportunities?.title||"",width:520,submitLabel:i?"Save":"Create",body:`
      ${u("title","What needs doing",D("title",t?.title||"","required"),{wide:!0})}
      <div class="field-row">
        ${u("due_date","Due",J("due_date",nt(t?.due_date)||xe()))}
        ${u("owner_id","Owner",O("owner_id",ie(s),t?.owner_id||a?.id||""))}
      </div>
      <div class="field-row">
        ${u("priority","Priority",O("priority",se.map(r=>[r,Ye(r)]),t?.priority||"normal"))}
        ${u("channel","How",O("channel",["","Phone","WhatsApp","Email","Site visit","In person"],t?.channel||""))}
      </div>
      ${u("notes","Notes",z("notes",t?.notes||"",2),{wide:!0})}`,onSubmit:async r=>{if(!r.title)throw U("title","Say what needs doing.");let l={title:r.title,due_date:y(r.due_date),owner_id:y(r.owner_id),priority:r.priority,channel:y(r.channel),notes:y(r.notes)};i?await d.updateTask(t.id,l):await d.createTask({...l,opportunity_id:e?.id||null,contact_id:e?.contact_id||null}),v(i?"Task saved.":"Task created."),K(o)}})}function Xe({contact:t=null,onDone:e}){let a=!!t;G({title:a?"Edit contact":"New contact",width:560,submitLabel:a?"Save":"Create",body:`
      <div class="field-row">
        ${u("full_name","Name",D("full_name",t?.full_name||"","required"))}
        ${u("job_title","Role",D("job_title",t?.job_title||"",'placeholder="Operations Manager"'))}
      </div>
      ${u("company","Company",D("company",t?.companies?.name||"",'placeholder="Msasa Park Logistics"'),{wide:!0})}
      <div class="field-row">
        ${u("phone","Phone",D("phone",t?.phone||"",'placeholder="+263 77 000 0000"'))}
        ${u("whatsapp","WhatsApp",D("whatsapp",t?.whatsapp||"",'placeholder="+263 77 000 0000"'),{hint:"Often not the same as the office line."})}
      </div>
      ${u("email","Email",D("email",t?.email||"",'type="email"'),{wide:!0})}
      ${u("preferred_channel","Prefers",O("preferred_channel",["","Phone","WhatsApp","Email"],t?.preferred_channel||""))}
      ${u("notes","Notes",z("notes",t?.notes||"",2),{wide:!0})}`,onSubmit:async o=>{if(!o.full_name)throw U("full_name","A name is needed.");if(!o.phone&&!o.whatsapp&&!o.email)throw U("phone","A phone number, a WhatsApp number or an email address is needed.");let s=o.company&&(await d.findOrCreateCompany(o.company))?.id||null,i={full_name:o.full_name,job_title:y(o.job_title),phone:y(o.phone),whatsapp:y(o.whatsapp),email:y(o.email)&&o.email.toLowerCase(),preferred_channel:y(o.preferred_channel),notes:y(o.notes)};s&&(i.company_id=s);let r=a?await d.updateContact(t.id,i):await d.createContact(i);v(a?"Contact saved.":"Contact created."),K(e,r)}})}function ta({opp:t,onDone:e}){G({title:"Open a project",sub:`${t.ref} \u2014 ${t.title}`,width:520,submitLabel:"Open project",body:`
      ${u("name","Project name",D("name",t.title,"required"),{wide:!0})}
      <div class="field-row">
        ${u("start_date","Start",J("start_date",ht()))}
        ${u("target_date","Target completion",J("target_date",_e(ht(),56)))}
      </div>
      <p class="modal-message">The client, contact, value and description come across from the
        opportunity. The opportunity stays on record and links to the project.</p>`,onSubmit:async a=>{let o=await d.convertToProject(t.id,{name:a.name,startDate:y(a.start_date),targetDate:y(a.target_date)});v("Project opened."),e?K(e,o):location.hash=`#/project/${o}`}})}async function ea({project:t,me:e,onDone:a}){let o=await d.profiles();G({title:"Edit project",sub:t.name,width:560,submitLabel:"Save",body:`
      ${u("name","Name",D("name",t.name,"required"),{wide:!0})}
      <div class="field-row">
        ${u("status","Status",O("status",ga.map(s=>[s,Pt[s]]),t.status))}
        ${u("owner_id","Responsible",O("owner_id",ie(o),t.owner_id||""))}
      </div>
      <div class="field-row">
        ${u("start_date","Start",J("start_date",nt(t.start_date)))}
        ${u("target_date","Target",J("target_date",nt(t.target_date)))}
      </div>
      <div class="field-row">
        ${u("value","Value (USD)",Et("value",t.value??"",'min="0" step="100"'))}
        ${u("completed_on","Completed",J("completed_on",nt(t.completed_on)))}
      </div>
      ${u("description","Description",z("description",t.description||"",3),{wide:!0})}
      ${u("notes","Notes",z("notes",t.notes||"",2),{wide:!0})}`,onSubmit:async s=>{if(!s.name)throw U("name","A project needs a name.");await d.updateProject(t.id,{name:s.name,status:s.status,owner_id:y(s.owner_id),start_date:y(s.start_date),target_date:y(s.target_date),completed_on:y(s.completed_on),value:Tt(s.value),description:y(s.description),notes:y(s.notes)}),v("Project saved."),K(a)}})}var Ye,ie,st=j(()=>{F();B();P();dt();Ye=t=>t.charAt(0).toUpperCase()+t.slice(1),ie=(t,e=!0)=>(e?[["","Unassigned"]]:[]).concat(t.map(a=>[a.id,a.full_name]))});var Wa={};Q(Wa,{mount:()=>Yn,render:()=>Jn,sub:()=>Xn,title:()=>Kn});async function Jn(t,{me:e}){qt=await d.openOpportunities();let a=qt.filter(rt).sort((l,g)=>q(l.next_action_due)-q(g.next_action_due)),o=qt.filter(Ut).sort((l,g)=>new Date(l.created_at)-new Date(g.created_at)),s=qt.filter(ke),i=qt.filter(l=>{let g=q(l.next_action_due);return g!==null&&g>0&&g<=14}).sort((l,g)=>q(l.next_action_due)-q(g.next_action_due));return`
    ${`
    <div class="fu-summary">
      <span class="fu-sum fu-sum-danger">
        ${c.alert(16)}<b class="num">${a.length}</b><span>overdue</span>
        <em class="num">${n(k(M(a,l=>l.estimated_value)))}</em>
      </span>
      <span class="fu-sum${o.length?" fu-sum-danger":""}">
        ${c.alert(16)}<b class="num">${o.length}</b><span>nothing booked</span>
        <em class="num">${n(k(M(o,l=>l.estimated_value)))}</em>
      </span>
      <span class="fu-sum">
        ${c.clock(16)}<b class="num">${s.length}</b><span>due today</span>
        <em class="num">${n(k(M(s,l=>l.estimated_value)))}</em>
      </span>
      <span class="fu-sum">
        ${c.calendar(16)}<b class="num">${i.length}</b><span>next 14 days</span>
        <em class="num">${n(k(M(i,l=>l.estimated_value)))}</em>
      </span>
    </div>`}
    ${Oe("Overdue",a,"Past the date somebody committed to. Every one of these is a customer waiting.")}
    ${Oe("Open, with nothing booked",o,"These appear on no list and are on nobody\u2019s day. This is where enquiries are lost.")}
    ${Oe("Due today",s,"Booked for today.")}
    ${Oe("Next fourteen days",i,"Booked and not yet due.")}`}function Oe(t,e,a){return e.length?f(t,`
    <ul class="fu-list">
      ${e.map(o=>`
        <li class="fu">
          <span class="fu-when">${Le(o.next_action_due)}</span>
          <a class="fu-main" href="#/opportunity/${n(o.id)}">
            <span class="fu-title">${n(o.title)}</span>
            <span class="fu-sub">${n(o.company_name||o.contact_name||"\u2014")} \xB7 ${n(o.ref)}${o.estimated_value?` \xB7 <span class="num">${n(k(o.estimated_value,o.currency))}</span>`:""}</span>
            <span class="fu-action">${o.next_action?`${c.arrowRight(13)}${n(o.next_action)}`:`${c.alert(13)}No next action recorded`}</span>
            ${Number(o.live_quotes)?`<span class="fu-quote">${c.doc(12)}${n(x(Number(o.live_quotes),"quotation"))} out${o.last_quote_sent?" \xB7 "+n(A(o.last_quote_sent)):""}</span>`:""}
          </a>
          <span class="fu-stage">${Dt(o)}</span>
          <span class="fu-owner">${T(o.owner_name?{full_name:o.owner_name,initials:o.owner_initials}:null,26)}</span>
          <span class="fu-do">
            ${$t({phone:o.contact_phone,whatsapp:o.contact_whatsapp,email:o.contact_email},{text:`Good day, Kingson Engineering here regarding ${o.title}.`,size:"xs"})}
            <button type="button" class="btn-ghost btn-xs" data-chase="${n(o.id)}">${c.check(13)}<span>Log a chase</span></button>
          </span>
        </li>`).join("")}
    </ul>`,{note:a,tight:!0}):f(t,w(t==="Overdue"||t.startsWith("Open,")?"Nothing in this group. Good.":"Nothing booked in this window."),{note:a,tight:!0})}function Yn(t,e,{me:a}){t.addEventListener("click",async o=>{let s=o.target.closest("[data-chase]");if(!s)return;let i=qt.find(r=>r.id===s.dataset.chase);i&&re({opportunityId:i.id,contactId:i.contact_id,me:a,onDone:async()=>{await Zn(i,a,e)}})})}async function Zn(t,e,a){await a();let o=await d.opportunity(t.id);o&&le({opp:o,me:e,onDone:a})}function Xn(){let t=qt.filter(rt).length,e=qt.filter(Ut).length,a=[];return t&&a.push(`${t} overdue`),e&&a.push(`${e} with nothing booked`),a.length?`<span class="sub-alarm">${c.alert(14)}${n(a.join(" \xB7 "))}</span>`:"Nothing is late"}var Kn,qt,Ha=j(()=>{F();B();P();V();W();dt();st();Kn="Follow-ups",qt=[]});var Va={};Q(Va,{actions:()=>os,mount:()=>ns,render:()=>es,sub:()=>ss,title:()=>ts});async function es(t,{me:e}){return[Ne,Ga]=await Promise.all([d.tasks(),d.profiles()]),Qa(e)}function Qa(t){let e=Ne.filter(s=>(ot.status==="all"||s.status===ot.status)&&(ot.owner==="all"||(ot.owner==="mine"?s.owner_id===t?.id:s.owner_id===ot.owner))),a=`
    <div class="filters">
      <label class="sr-only" for="f-status">Status</label>
      <select class="sel sel-inline" id="f-status" data-f="status">
        ${[["open","Open"],["done","Completed"],["all","All"]].map(([s,i])=>`<option value="${s}"${ot.status===s?" selected":""}>${i}</option>`).join("")}
      </select>
      <label class="sr-only" for="f-owner">Owner</label>
      <select class="sel sel-inline" id="f-owner" data-f="owner">
        <option value="all"${ot.owner==="all"?" selected":""}>Everyone</option>
        <option value="mine"${ot.owner==="mine"?" selected":""}>Mine</option>
        ${Ga.map(s=>`<option value="${n(s.id)}"${ot.owner===s.id?" selected":""}>${n(s.full_name)}</option>`).join("")}
      </select>
      <span class="filters-n">${n(x(e.length,"task"))}</span>
    </div>`,o=e.length?`
    <ul class="fu-list">
      ${e.sort(as).map(s=>`
        <li class="fu${s.status==="done"?" is-done":""}">
          <span class="fu-when">${Le(s.due_date)}</span>
          <div class="fu-main">
            <span class="fu-title">${n(s.title)}</span>
            <span class="fu-sub">
              ${s.opportunities?`<a class="lnk" href="#/opportunity/${n(s.opportunities.id)}">${n(s.opportunities.ref)} \xB7 ${n(s.opportunities.title)}</a>`:'<span class="dim">Not linked to an opportunity</span>'}
              ${s.channel?" \xB7 "+n(s.channel):""}
            </span>
            ${s.notes?`<span class="fu-action">${n(s.notes)}</span>`:""}
          </div>
          <span class="fu-stage">${Ot(s.priority)}</span>
          <span class="fu-owner">${T(s.profiles,26)}</span>
          <span class="fu-do">
            <button type="button" class="btn-ghost btn-xs" data-edit="${n(s.id)}">${c.edit(13)}<span>Edit</span></button>
            ${s.status==="open"?`<button type="button" class="btn-ghost btn-xs" data-done="${n(s.id)}">${c.check(13)}<span>Done</span></button>`:`<button type="button" class="btn-ghost btn-xs" data-reopen="${n(s.id)}">${c.refresh(13)}<span>Reopen</span></button>`}
          </span>
        </li>`).join("")}
    </ul>`:w(ot.status==="open"?"Nothing outstanding.":"No tasks match that filter.",ot.status==="open"?"Every task on this filter is done.":"",{tone:"ok"});return a+f("",o,{tight:!0})}function ns(t,e,{me:a}){t.addEventListener("change",o=>{let s=o.target.closest("[data-f]");if(!s)return;ot[s.dataset.f]=s.value;let i=document.getElementById("view");i.innerHTML=Qa(a)}),t.addEventListener("click",async o=>{let s=o.target.closest("[data-done]"),i=o.target.closest("[data-reopen]"),r=o.target.closest("[data-edit]");try{if(s)return await d.completeTask(s.dataset.done),v("Completed."),e();if(i)return await d.updateTask(i.dataset.reopen,{status:"open"}),v("Reopened."),e();if(r){let l=Ne.find(g=>g.id===r.dataset.edit);if(l)return ce({task:l,me:a,onDone:e})}}catch(l){v(l.message||"That could not be saved.","bad")}})}function ss(){let t=Ne.filter(a=>a.status==="open"),e=t.filter(a=>a.due_date&&q(a.due_date)<0).length;return e?`<span class="sub-alarm">${c.alert(14)}${n(x(e,"task"))} overdue</span>`:`${n(x(t.length,"open task"))}`}var ts,Ne,ot,Ga,as,os,za=j(()=>{F();B();P();V();W();dt();st();ts="Tasks",Ne=[],ot={status:"open",owner:"all"},Ga=[];as=(t,e)=>t.due_date?e.due_date?t.due_date<e.due_date?-1:t.due_date>e.due_date?1:0:-1:1;os=()=>`<button type="button" class="btn btn-sm" data-new-task-global>${c.plus(14)}<span>New task</span></button>`});var Ja={};Q(Ja,{actions:()=>ds,mount:()=>ls,render:()=>rs,sub:()=>cs,title:()=>is});async function rs(){return Vt=await d.contacts(),`
    <div class="filters">
      <div class="search">
        ${c.search(15)}
        <label class="sr-only" for="c-search">Search contacts</label>
        <input class="inp" id="c-search" type="search" placeholder="Name, company, phone or email"
               value="${n(aa)}" autocomplete="off">
      </div>
      <span class="filters-n" data-count>${n(x(Vt.length,"contact"))}</span>
    </div>
    <div data-list>${Ka(Vt)}</div>`}function Ka(t){return t.length?f("",ct(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Name</th><th scope="col">Company</th>
        <th scope="col">Phone</th><th scope="col">Email</th><th scope="col"></th>
      </tr></thead>
      <tbody>
        ${t.map(e=>`<tr>
          <td><a class="lnk lnk-strong" href="#/contact/${n(e.id)}">
            ${T({full_name:e.full_name},24)}<span>${n(e.full_name)}</span></a>
            ${e.job_title?`<span class="td-sub">${n(e.job_title)}</span>`:""}</td>
          <td>${n(e.companies?.name||"\u2014")}</td>
          <td class="num">${e.phone?`<a class="lnk" href="${n(ft(e.phone))}">${n(e.phone)}</a>`:"\u2014"}</td>
          <td>${n(e.email||"\u2014")}</td>
          <td class="ta-r">${$t(e,{size:"xs"})}</td>
        </tr>`).join("")}
      </tbody>
    </table>`),{tight:!0}):f("",w("No contacts match that.","Try part of a name, a company or a number.",{tone:"quiet"}),{tight:!0})}function ls(t){let e=t.querySelector("#c-search"),a=t.querySelector("[data-list]"),o=t.querySelector("[data-count]"),s=null;e?.addEventListener("input",()=>{aa=e.value.trim(),clearTimeout(s),s=setTimeout(()=>{let i=aa.toLowerCase(),r=i?Vt.filter(l=>[l.full_name,l.companies?.name,l.phone,l.whatsapp,l.email,l.job_title].some(g=>String(g||"").toLowerCase().includes(i))):Vt;a.innerHTML=Ka(r),o.textContent=x(r.length,"contact")},120)})}var is,Vt,aa,cs,ds,Ya=j(()=>{F();P();V();W();st();is="Contacts",Vt=[],aa="";cs=()=>x(Vt.length,"contact"),ds=()=>`<button type="button" class="btn btn-sm" data-new-contact>${c.plus(14)}<span>New contact</span></button>`});function Kt(t,e,a,o){t.addEventListener("change",async s=>{let i=s.target.closest("[data-upload]");if(!i||!i.files?.length)return;let r=i.files[0];if(i.value="",r.size>ps){v(`${r.name} is ${Za(r.size)}. The limit is 25 MB \u2014 send larger drawing sets by transfer link.`,"bad");return}let l=t.querySelector(".file-pick span"),g=l?.textContent;l&&(l.textContent="Uploading\u2026");try{let h=await d.uploadFile(r,e,a?.id);await d.logActivity({opportunity_id:e.opportunity_id||null,project_id:e.project_id||null,contact_id:e.contact_id||null,kind:"file",body:`File added: ${r.name}`,actor_id:a?.id||null}),v("Uploaded."),K(o)}catch(h){v(h.message||"That file could not be uploaded.","bad"),l&&(l.textContent=g)}}),t.addEventListener("click",async s=>{let i=s.target.closest("[data-file]");if(i)try{let r=await d.downloadUrl(i.dataset.file),l=document.createElement("a");l.href=r,l.download=i.dataset.name||"",l.rel="noopener",document.body.appendChild(l),l.click(),l.remove()}catch(r){v(r.message||"That file could not be opened.","bad")}})}var ps,Za,zt,Me=j(()=>{F();P();V();W();dt();ps=25*1024*1024,Za=t=>!t&&t!==0?"":t>=1048576?(t/1048576).toFixed(1)+" MB":t>=1024?Math.round(t/1024)+" KB":t+" B",zt=t=>f("Files",t.length?`
  <ul class="mini files">
    ${t.map(e=>`<li>
      <button type="button" class="mini-btn" data-file="${n(e.path)}" data-name="${n(e.name)}">
        <span class="mini-main">${c.file(13)}${n(e.name)}</span>
        <span class="mini-sub">${n(Za(e.size_bytes))} \xB7 ${n(L(e.created_at))}${e.profiles?.initials?" \xB7 "+n(e.profiles.initials):""}</span>
      </button>
      <span class="mini-side">${c.download(15)}</span>
    </li>`).join("")}
  </ul>`:w("No files yet.","Drawings, BOQs and quotation PDFs go here.",{tone:"quiet"}),{tight:!0,action:`<label class="btn-ghost btn-xs file-pick">
      ${c.upload(13)}<span>Upload</span>
      <input type="file" data-upload hidden
             accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.dwg,.dxf,.xlsx,.xls,.docx,.doc,.zip,.csv,.txt">
    </label>`})});var Xa={};Q(Xa,{mount:()=>hs,render:()=>ms,sub:()=>fs,title:()=>us});async function ms(t,{me:e}){if(E=await d.contact(t),!E)return w("That contact no longer exists.","",{tone:"quiet"});let[a,o,s]=await Promise.all([d.opportunities(`contact_id=eq.${t}`),d.activityForContact(t),d.filesFor("contact_id",t)]),i=a.length?await d.quotes(`opportunity_id=in.(${a.map(h=>h.id).join(",")})`):[],r=f("Details",`
    <div class="contact">
      ${T({full_name:E.full_name},40)}
      <div class="contact-body">
        <p class="contact-name">${n(E.full_name)}</p>
        ${E.job_title?`<p class="contact-role">${n(E.job_title)}</p>`:""}
        ${E.companies?`<p class="contact-role">${n(E.companies.name)}${E.companies.town?" \xB7 "+n(E.companies.town):""}</p>`:""}
        <div class="contact-lines">
          ${E.phone?`<a class="lnk" href="${n(ft(E.phone))}">${c.phone(13)}${n(E.phone)}</a>`:""}
          ${E.whatsapp&&E.whatsapp!==E.phone?`<span class="lnk-plain">${c.whatsapp(13)}${n(E.whatsapp)}</span>`:""}
          ${E.email?`<a class="lnk" href="${n(St(E.email))}">${c.mail(13)}${n(E.email)}</a>`:""}
        </div>
        ${E.preferred_channel?`<p class="contact-pref">Prefers ${n(E.preferred_channel)}</p>`:""}
      </div>
    </div>
    <div class="contact-acts">${$t(E,{text:`Good day ${E.full_name.split(" ")[0]}, Kingson Engineering here.`})}</div>
    ${E.notes?`<p class="scope">${n(E.notes)}</p>`:""}`,{action:`<button type="button" class="btn-ghost btn-xs" data-edit-contact>${c.edit(13)}<span>Edit</span></button>`}),l=f("Enquiries",a.length?`
    <ul class="mini">
      ${a.map(h=>`<li>
        <a href="#/opportunity/${n(h.id)}">
          <span class="mini-main">${n(h.title)} ${Dt(h)}</span>
          <span class="mini-sub">${n(h.ref)} \xB7 ${n(h.stage_name)}${h.estimated_value?" \xB7 "+n(k(h.estimated_value,h.currency)):""}</span>
        </a>
        <span class="mini-side">${T(h.owner_name?{full_name:h.owner_name,initials:h.owner_initials}:null,24)}</span>
      </li>`).join("")}
    </ul>`:w("No enquiries recorded.","",{tone:"quiet"}),{tight:!0,note:x(a.length,"enquiry","enquiries"),action:`<button type="button" class="btn-ghost btn-xs" data-new-opp-for>${c.plus(13)}<span>New</span></button>`}),g=f("Quotations",i.length?`
    <ul class="quotes">
      ${i.map(h=>`<li class="quote">
        <a class="quote-btn" href="#/opportunity/${n(h.opportunities?.id||"")}">
          <span class="quote-ref">${n(h.reference)}</span>
          <span class="quote-val num">${n(k(h.amount,h.currency))}</span>
          <span class="quote-status">${It(h.status)}</span>
          <span class="quote-when">${h.sent_on?"sent "+n(L(h.sent_on)):"not issued"}</span>
        </a>
      </li>`).join("")}
    </ul>`:w("No quotations yet.","",{tone:"quiet"}),{tight:!0});return`
    <a class="back lnk" href="#/contacts">${c.chevron(13)}<span>Back to contacts</span></a>
    <div class="grid grid-opp">
      <div class="col-wide">${f("History",Bt(o),{tight:!0,note:x(o.length,"entry","entries")})}</div>
      <div class="col-side">${r}${l}${g}${zt(s)}</div>
    </div>`}function hs(t,e,{me:a}){t.addEventListener("click",o=>{if(o.target.closest("[data-edit-contact]"))return Xe({contact:E,onDone:e});if(o.target.closest("[data-new-opp-for]"))return Ze({me:a,contact:E,onDone:e})}),Kt(t,{contact_id:E.id},a,e)}function fs(){return E?[E.companies?.name,E.job_title].filter(Boolean).map(n).join(" \xB7 "):""}var us,E,tn=j(()=>{F();P();V();W();st();Me();us=()=>E?.full_name||"Contact",E=null});var en={};Q(en,{editOpportunity:()=>ys});async function ys({opp:t,me:e,onDone:a}){let o=await d.profiles();G({title:"Edit opportunity",sub:t.ref,width:620,submitLabel:"Save",body:`
      ${u("title","What is the job?",D("title",t.title,"required"),{wide:!0})}
      <div class="field-row">
        ${u("service","Service",O("service",["","Structural steelwork","Roof steelwork and trusses","Fiber laser cutting","Balustrades and gates","Stainless fabrication","Mobile cranage","Other"],t.service||""))}
        ${u("source","Source",O("source",be.map(s=>[s,Lt[s]]),t.source))}
      </div>
      <div class="field-row">
        ${u("location","Site",D("location",t.location||""))}
        ${u("estimated_value","Estimated value (USD)",Et("estimated_value",t.estimated_value??"",'min="0" step="100"'))}
      </div>
      <div class="field-row">
        ${u("owner_id","Owner",O("owner_id",[["","Unassigned"]].concat(o.map(s=>[s.id,s.full_name])),t.owner_id||""))}
        ${u("priority","Priority",O("priority",se.map(s=>[s,$s(s)]),t.priority))}
      </div>
      ${u("site_visit_required","Site visit",`<label class="check"><input type="checkbox" id="site_visit_required" name="site_visit_required"
           ${t.site_visit_required?"checked":""}> <span>A site visit is needed before this can be priced</span></label>`,{wide:!0})}
      ${u("description","What do they want?",z("description",t.description||"",4),{wide:!0})}`,onSubmit:async s=>{if(!s.title)throw U("title","Give the job a name.");await d.updateOpportunity(t.id,{title:s.title,service:y(s.service),source:s.source,location:y(s.location),estimated_value:Tt(s.estimated_value),owner_id:y(s.owner_id),priority:s.priority,site_visit_required:!!s.site_visit_required,description:y(s.description)}),v("Saved."),K(a)}})}var $s,an=j(()=>{F();B();P();dt();$s=t=>t.charAt(0).toUpperCase()+t.slice(1)});var nn={};Q(nn,{mount:()=>bs,render:()=>_s,sub:()=>ws,title:()=>gs});async function _s(t,{me:e}){if(p=await d.opportunity(t),!p)return w("That opportunity no longer exists.","It may have been deleted.",{tone:"quiet"});let[a,o,s,i,r,l]=await Promise.all([d.activityFor(t),d.quotesFor(t),d.visitsFor(t),d.tasksFor(t),d.filesFor("opportunity_id",t),d.projectForOpportunity(t)]);Pe={activity:a,quotes:o,visits:s,tasks:i,files:r,project:l,me:e};let g=lt(p),h=g.level==="overdue"||g.level==="unbooked",Y={full_name:p.contact_name,phone:p.contact_phone,whatsapp:p.contact_whatsapp,email:p.contact_email},tt=`
  <section class="opp-head${h?" opp-head-alarm":""}">
    <div class="opp-head-top">
      <div class="opp-stage-set">
        <span class="opp-ref num">${n(p.ref)}</span>
        <label class="sr-only" for="opp-stage">Stage</label>
        <select class="sel sel-inline" id="opp-stage" data-stage>
          ${mt.map(_=>`<option value="${n(_.id)}"${_.id===p.stage?" selected":""}>${n(_.name)}</option>`).join("")}
        </select>
        ${Ot(p.priority)}
        ${jt(p.source)}
      </div>
      <dl class="opp-figs">
        <div><dt>Value</dt><dd class="num">${n(k(p.estimated_value,p.currency))}</dd></div>
        <div><dt>Enquiry</dt><dd>${n(L(p.created_at))} <span class="dim">(${n(A(p.created_at))})</span></dd></div>
        <div><dt>Last contact</dt><dd>${n(A(p.last_activity_at))}</dd></div>
        <div><dt>Owner</dt><dd class="opp-owner">
          ${T(p.owner_name?{full_name:p.owner_name,initials:p.owner_initials}:null,24)}
          ${n(p.owner_name||"Unassigned")}</dd></div>
      </dl>
    </div>

    <div class="opp-next${h?" is-alarm":""}">
      <span class="opp-next-ic">${h?c.alert(18):c.arrowRight(18)}</span>
      <div class="opp-next-body">
        <p class="opp-next-label">Next action</p>
        ${p.next_action||p.next_action_due?`
          <p class="opp-next-text">${n(p.next_action||"Follow up")}</p>
          <p class="opp-next-meta">
            ${n(p.owner_name||"Unassigned")} \xB7
            ${n(Ve(p.next_action_due))} \xB7
            <strong>${n(rt(p)?Ae(p.next_action_due):A(p.next_action_due))}</strong>
          </p>`:xt(p)?`
          <p class="opp-next-text">Nobody has booked a next action on this opportunity.</p>
          <p class="opp-next-meta">It is open, it has a value on it, and it is on nobody's list.</p>`:`<p class="opp-next-text">${n(at[p.stage].name)}${p.decided_at?" on "+n(Ve(p.decided_at)):""}.</p>
           ${p.lost_reason?`<p class="opp-next-meta">${n(p.lost_reason)}</p>`:""}`}
      </div>
      ${xt(p)?`<button type="button" class="btn btn-sm" data-followup>
        ${c.calendar(14)}<span>${p.next_action_due?"Change":"Book a follow-up"}</span></button>`:""}
    </div>
  </section>`,pt=f("The job",`
    ${p.description?`<p class="scope">${n(p.description)}</p>`:'<p class="scope dim">No description recorded.</p>'}
    <dl class="kv">
      <div><dt>Service</dt><dd>${n(p.service||"\u2014")}</dd></div>
      <div><dt>Location</dt><dd>${p.location?c.pin(13)+n(p.location):"\u2014"}</dd></div>
      <div><dt>Site visit</dt><dd>${p.site_visit_required?`<span class="warn-inline">${c.alert(13)}Needed</span>`:"Not required"}</dd></div>
      <div><dt>Came in by</dt><dd>${jt(p.source)}</dd></div>
      ${p.lost_reason?`<div class="kv-wide"><dt>Reason lost</dt><dd>${n(p.lost_reason)}</dd></div>`:""}
    </dl>`,{action:`<button type="button" class="btn-ghost btn-xs" data-edit-opp>${c.edit(13)}<span>Edit</span></button>`}),ut=f("Customer",p.contact_name?`
    <p class="co-name">${n(p.company_name||"\u2014")}</p>
    <div class="contact">
      ${T({full_name:p.contact_name},34)}
      <div class="contact-body">
        <p class="contact-name">${n(p.contact_name)}</p>
        <div class="contact-lines">
          ${p.contact_phone?`<a class="lnk" href="${n(ft(p.contact_phone))}">${c.phone(13)}${n(p.contact_phone)}</a>`:""}
          ${p.contact_email?`<a class="lnk" href="${n(St(p.contact_email))}">${c.mail(13)}${n(p.contact_email)}</a>`:""}
        </div>
      </div>
    </div>
    <div class="contact-acts">${$t(Y,{text:`Good day ${p.contact_name.split(" ")[0]}, Kingson Engineering here regarding ${p.title}.`})}</div>
    ${p.contact_id?`<p class="co-also"><a class="lnk" href="#/contact/${n(p.contact_id)}">
      ${c.users(13)}Full history for this contact</a></p>`:""}`:w("No contact on this opportunity.","",{tone:"quiet"}),{tight:!1}),I=f("Site visits",s.length?`
    <ul class="mini">
      ${s.map(_=>`<li>
        <button type="button" class="mini-btn" data-visit="${n(_.id)}">
          <span class="mini-main">${n(kt(_.scheduled_at))}
            <span class="pill pill-${_.status==="completed"?"won":_.status==="cancelled"?"lost":"quiet"}">${n(_.status)}</span></span>
          <span class="mini-sub">${n(_.purpose||"Site visit")}${_.location?" \xB7 "+n(_.location):""}</span>
          ${_.outcome?`<span class="mini-sub">${n(_.outcome)}</span>`:""}
        </button>
        <span class="mini-side">${T(_.profiles,24)}</span>
      </li>`).join("")}
    </ul>`:w("No site visit booked.",p.site_visit_required?"This job cannot be priced properly until somebody has been out.":"",{tone:p.site_visit_required?"quiet":"ok"}),{tight:!0,action:`<button type="button" class="btn-ghost btn-xs" data-new-visit>${c.plus(13)}<span>Book</span></button>`}),et=f("Quotations",o.length?`
    <ul class="quotes">
      ${o.map(_=>`<li class="quote">
        <button type="button" class="quote-btn" data-quote="${n(_.id)}">
          <span class="quote-ref">${n(_.reference)}${_.version>1?` <span class="rev">rev ${_.version}</span>`:""}</span>
          <span class="quote-val num">${n(k(_.amount,_.currency))}</span>
          <span class="quote-status">${It(_.status)}</span>
          <span class="quote-when">${_.sent_on?"sent "+n(L(_.sent_on))+" \xB7 "+n(A(_.sent_on)):"not issued"}</span>
        </button>
      </li>`).join("")}
    </ul>
    ${Se(p)?`<p class="risk">${c.alert(14)}
      <span><strong>A quotation is out with no chase booked.</strong>
      A quotation nobody is following up is the most expensive thing in this pipeline.</span></p>`:""}`:w("No quotation yet.","Nothing has been issued on this opportunity.",{tone:"quiet"}),{tight:!0,action:`<button type="button" class="btn-ghost btn-xs" data-new-quote>${c.plus(13)}<span>New</span></button>`}),Z=i.filter(_=>_.status==="open"),At=f("Tasks",Z.length?`
    <ul class="mini">
      ${Z.map(_=>`<li>
        <span class="mini-main">${n(_.title)}</span>
        <span class="mini-sub${_.due_date&&new Date(_.due_date)<new Date?" is-late":""}">
          ${n(L(_.due_date))} \xB7 ${n(A(_.due_date))}${_.channel?" \xB7 "+n(_.channel):""}</span>
        <span class="mini-side">
          ${T(_.profiles,24)}
          <button type="button" class="btn-ghost btn-xs" data-done="${n(_.id)}">${c.check(13)}<span>Done</span></button>
        </span>
      </li>`).join("")}
    </ul>`:w("No open tasks.","",{tone:"ok"}),{tight:!0,action:`<button type="button" class="btn-ghost btn-xs" data-new-task>${c.plus(13)}<span>Add</span></button>`}),Nt=p.stage!=="won"?"":f("Project",l?`<p class="co-name"><a class="lnk" href="#/project/${n(l.id)}">${n(l.name)}</a></p>
       <p class="co-kind">${Rt(l.status)}</p>`:`<p class="modal-message">This opportunity is won and has no project yet.</p>
       <button type="button" class="btn btn-sm" data-convert>${c.briefcase(14)}<span>Open a project</span></button>`),Ie=f("Activity",`
    <div class="log-add">
      <button type="button" class="btn-ghost btn-sm" data-log>${c.note(14)}<span>Log a call, message or note</span></button>
    </div>
    ${Bt(a)}`,{note:x(a.length,"entry","entries"),tight:!0});return`
    <a class="back lnk" href="#/pipeline">${c.chevron(13)}<span>Back to the pipeline</span></a>
    ${tt}
    <div class="grid grid-opp">
      <div class="col-wide">${pt}${Ie}</div>
      <div class="col-side">${ut}${Nt}${I}${et}${At}${zt(Pe.files)}</div>
    </div>`}function bs(t,e,{me:a}){let o=()=>e();t.addEventListener("change",async s=>{let i=s.target.closest("[data-stage]");if(!i)return;let r=i.value;if(r!==p.stage){if(r==="lost"){let{dialog:l,field:g,textarea:h,fieldError:Y}=await Promise.resolve().then(()=>(dt(),Ua));l({title:"Mark as lost",sub:p.title,submitLabel:"Mark lost",width:460,body:g("lost_reason","Why was it lost?",h("lost_reason","",3,"required")),onSubmit:async tt=>{if(!tt.lost_reason)throw Y("lost_reason","Give a reason.");await d.setStage(p.id,"lost",{lostReason:tt.lost_reason}),v("Marked lost."),await o()}}),i.value=p.stage;return}try{await d.setStage(p.id,r),v(`Moved to ${at[r].name}.`),await o()}catch(l){v(l.message||"That could not be saved.","bad"),i.value=p.stage}}}),t.addEventListener("click",async s=>{let i=h=>s.target.closest(h);if(i("[data-followup]"))return le({opp:p,me:a,onDone:o});if(i("[data-log]"))return re({opportunityId:p.id,contactId:p.contact_id,me:a,onDone:o});if(i("[data-new-quote]"))return Gt({opp:p,me:a,onDone:o});if(i("[data-new-visit]"))return Qt({opp:p,me:a,onDone:o});if(i("[data-new-task]"))return ce({opp:p,me:a,onDone:o});if(i("[data-convert]"))return ta({opp:p});let r=i("[data-quote]");if(r)return Gt({opp:p,quote:Pe.quotes.find(h=>h.id===r.dataset.quote),me:a,onDone:o});let l=i("[data-visit]");if(l)return Qt({opp:p,visit:Pe.visits.find(h=>h.id===l.dataset.visit),me:a,onDone:o});let g=i("[data-done]");if(g){try{await d.completeTask(g.dataset.done),v("Task completed."),await o()}catch(h){v(h.message,"bad")}return}if(i("[data-edit-opp]")){let{editOpportunity:h}=await Promise.resolve().then(()=>(an(),en));return h({opp:p,me:a,onDone:o})}}),Kt(t,{opportunity_id:p.id},a,o)}function ws(){return p?`${n(p.company_name||p.contact_name||"")} \xB7 ${n(p.service||at[p.stage].name)}`:""}var p,Pe,gs,sn=j(()=>{F();B();P();V();W();dt();st();Me();p=null,Pe={},gs=()=>p?.title||"Opportunity"});var rn={};Q(rn,{mount:()=>ks,render:()=>xs,sub:()=>Ss,title:()=>vs});async function xs(t,{me:e}){return Jt=await d.quotes(),on()}function on(){let t=bt==="all"?Jt:bt==="live"?Jt.filter(o=>o.status==="sent"||o.status==="discussed"):Jt.filter(o=>o.status===bt),e=`
    <div class="filters">
      <label class="sr-only" for="q-filter">Show</label>
      <select class="sel sel-inline" id="q-filter" data-f>
        <option value="live"${bt==="live"?" selected":""}>Awaiting a decision</option>
        <option value="all"${bt==="all"?" selected":""}>All quotations</option>
        ${we.map(o=>`<option value="${o}"${bt===o?" selected":""}>${n(Mt[o])}</option>`).join("")}
      </select>
      <span class="filters-n">${n(x(t.length,"quotation"))} \xB7 <span class="num">${n(k(M(t,o=>o.amount)))}</span></span>
    </div>`,a=t.length?ct(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Reference</th><th scope="col">Opportunity</th>
        <th scope="col" class="ta-r">Amount</th><th scope="col">Status</th>
        <th scope="col">Sent</th><th scope="col">Chase</th><th scope="col"></th>
      </tr></thead>
      <tbody>
        ${t.map(o=>{let s=o.opportunities,i=o.status==="sent"||o.status==="discussed",r=i&&s&&!s.next_action_due;return`<tr${r?' class="tr-risk"':""}>
            <td><span class="td-main num">${n(o.reference)}</span>${o.version>1?`<span class="td-sub">revision ${o.version}</span>`:""}</td>
            <td><a class="lnk" href="#/opportunity/${n(s?.id||"")}">${n(s?.title||"\u2014")}</a>
                <span class="td-sub">${n(s?.companies?.name||"")}</span></td>
            <td class="ta-r num">${n(k(o.amount,o.currency))}</td>
            <td>${It(o.status)}</td>
            <td><span class="td-main num">${n(L(o.sent_on))}</span><span class="td-sub">${o.sent_on?n(A(o.sent_on)):""}</span></td>
            <td>${r?`<span class="pill pill-overdue">${c.alert(13)}No chase booked</span>`:i?`<span class="pill pill-quiet">${n(L(s?.next_action_due))}</span>`:'<span class="dim">\u2014</span>'}</td>
            <td class="ta-r"><button type="button" class="btn-ghost btn-xs" data-edit="${n(o.id)}">${c.edit(13)}<span>Edit</span></button></td>
          </tr>`}).join("")}
      </tbody>
    </table>`):w(bt==="live"?"No quotations are out.":"Nothing matches that filter.",bt==="live"?"Everything issued has been decided.":"",{tone:"ok"});return e+f("",a,{tight:!0})}function ks(t,e,{me:a}){t.addEventListener("change",o=>{o.target.closest("[data-f]")&&(bt=o.target.value,document.getElementById("view").innerHTML=on())}),t.addEventListener("click",async o=>{let s=o.target.closest("[data-edit]");if(!s)return;let i=Jt.find(l=>l.id===s.dataset.edit);if(!i)return;let r=await d.opportunity(i.opportunity_id);Gt({opp:r,quote:i,me:a,onDone:e})})}function Ss(){let t=Jt.filter(e=>e.status==="sent"||e.status==="discussed");return`${n(x(t.length,"quotation"))} awaiting a decision \xB7 <span class="num">${n(k(M(t,e=>e.amount)))}</span>`}var vs,Jt,bt,ln=j(()=>{F();B();P();V();W();st();vs="Quotations",Jt=[],bt="live"});var cn={};Q(cn,{mount:()=>qs,render:()=>Ts,sub:()=>As,title:()=>Es});async function Ts(t,{me:e}){Yt=await d.visits();let a=Yt.filter(i=>i.status==="scheduled"&&q(i.scheduled_at)>=0).sort((i,r)=>new Date(i.scheduled_at)-new Date(r.scheduled_at)),o=Yt.filter(i=>i.status==="scheduled"&&q(i.scheduled_at)<0).sort((i,r)=>new Date(r.scheduled_at)-new Date(i.scheduled_at)),s=Yt.filter(i=>i.status!=="scheduled").sort((i,r)=>new Date(r.scheduled_at)-new Date(i.scheduled_at)).slice(0,30);return`
    ${na("Booked",a,"Scheduled and still to happen.")}
    ${o.length?na("Past their date and still open",o,"These were booked and never closed off. Either it happened and needs writing up, or it did not.",!0):""}
    ${na("Completed and cancelled",s,"The last thirty.")}`}function na(t,e,a,o=!1){return e.length?f(t,`
    <ul class="fu-list">
      ${e.map(s=>{let i=s.status==="scheduled"&&q(s.scheduled_at)<0;return`
        <li class="fu">
          <span class="fu-when">
            <span class="fu-date num">${n(kt(s.scheduled_at))}</span>
            <span class="fu-rel${i?" is-late":""}">${n(A(s.scheduled_at))}</span>
          </span>
          <div class="fu-main">
            <span class="fu-title">${n(s.opportunities?.title||"Site visit")}</span>
            <span class="fu-sub">${n(s.opportunities?.companies?.name||"")}${s.location?" \xB7 "+c.pin(12)+n(s.location):""}</span>
            <span class="fu-action">${n(s.purpose||"")}</span>
            ${s.outcome?`<span class="fu-action">${c.check(12)}${n(s.outcome)}</span>`:""}
          </div>
          <span class="fu-stage"><span class="pill pill-${s.status==="completed"?"won":s.status==="cancelled"?"lost":i?"overdue":"quiet"}">${n(s.status)}</span></span>
          <span class="fu-owner">${T(s.profiles,26)}</span>
          <span class="fu-do">
            ${s.opportunities?`<a class="btn-ghost btn-xs" href="#/opportunity/${n(s.opportunities.id)}">${c.arrowRight(13)}<span>Open</span></a>`:""}
            <button type="button" class="btn-ghost btn-xs" data-visit="${n(s.id)}">${c.edit(13)}<span>Edit</span></button>
          </span>
        </li>`}).join("")}
    </ul>`,{note:a,tight:!0}):f(t,w("Nothing here.","",{tone:"ok"}),{note:a,tight:!0})}function qs(t,e,{me:a}){t.addEventListener("click",async o=>{let s=o.target.closest("[data-visit]");if(!s)return;let i=Yt.find(l=>l.id===s.dataset.visit);if(!i)return;let r=await d.opportunity(i.opportunity_id);Qt({opp:r,visit:i,me:a,onDone:e})})}function As(){let t=Yt.filter(e=>e.status==="scheduled"&&q(e.scheduled_at)>=0).length;return`${n(x(t,"visit"))} booked`}var Es,Yt,dn=j(()=>{F();B();P();V();W();st();Es="Site visits",Yt=[]});var un={};Q(un,{render:()=>Ls,sub:()=>Ds,title:()=>Cs});async function Ls(){if(de=await d.projects(),!de.length)return f("",w("No projects yet.","When an opportunity is marked won, open a project from it and it appears here.",{tone:"quiet"}),{tight:!0});let t=de.filter(a=>["planning","in_progress","on_hold"].includes(a.status)),e=de.filter(a=>!["planning","in_progress","on_hold"].includes(a.status));return pn("Active",t)+pn("Finished",e)}function pn(t,e){return e.length?f(t,ct(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Project</th><th scope="col">Client</th>
        <th scope="col" class="ta-r">Value</th><th scope="col">Status</th>
        <th scope="col">Target</th><th scope="col">Responsible</th>
      </tr></thead>
      <tbody>
        ${e.map(a=>{let o=a.target_date&&q(a.target_date)<0&&a.status!=="complete";return`<tr${o?' class="tr-risk"':""}>
            <td><a class="lnk lnk-strong" href="#/project/${n(a.id)}">${n(a.name)}</a>
                ${a.opportunities?`<span class="td-sub">from ${n(a.opportunities.ref)}</span>`:""}</td>
            <td>${n(a.companies?.name||a.contacts?.full_name||"\u2014")}</td>
            <td class="ta-r num">${n(k(a.value,a.currency))}</td>
            <td>${Rt(a.status)}</td>
            <td><span class="td-main num">${n(L(a.target_date))}</span>
                <span class="td-sub${o?" is-late":""}">${a.target_date?n(A(a.target_date)):""}</span></td>
            <td>${T(a.profiles,24)}</td>
          </tr>`}).join("")}
      </tbody>
    </table>`),{tight:!0,note:`${x(e.length,"project")} \xB7 ${k(M(e,a=>a.value))}`}):f(t,w("Nothing here.","",{tone:"quiet"}),{tight:!0})}function Ds(){let t=de.filter(e=>["planning","in_progress","on_hold"].includes(e.status));return`${n(x(t.length,"active project"))} \xB7 <span class="num">${n(k(M(t,e=>e.value)))}</span>`}var Cs,de,mn=j(()=>{F();B();P();V();W();Cs="Projects",de=[]});var hn={};Q(hn,{mount:()=>Ns,render:()=>Os,sub:()=>Ms,title:()=>js});async function Os(t,{me:e}){if(b=await d.project(t),!b)return w("That project no longer exists.","",{tone:"quiet"});let[a,o]=await Promise.all([d.activityForProject(t),d.filesFor("project_id",t)]),i=`
    <section class="opp-head${b.target_date&&q(b.target_date)<0&&b.status!=="complete"?" opp-head-alarm":""}">
      <div class="opp-head-top">
        <div class="opp-stage-set">
          ${Rt(b.status)}
          ${b.opportunities?`<a class="lnk" href="#/opportunity/${n(b.opportunities.id)}">from ${n(b.opportunities.ref)}</a>`:""}
        </div>
        <dl class="opp-figs">
          <div><dt>Value</dt><dd class="num">${n(k(b.value,b.currency))}</dd></div>
          <div><dt>Start</dt><dd>${n(L(b.start_date))}</dd></div>
          <div><dt>Target</dt><dd>${n(L(b.target_date))}
            ${b.target_date?`<span class="dim">(${n(A(b.target_date))})</span>`:""}</dd></div>
          <div><dt>Responsible</dt><dd class="opp-owner">${T(b.profiles,24)}${n(b.profiles?.full_name||"Unassigned")}</dd></div>
        </dl>
      </div>
    </section>`,r=f("The job",`
    ${b.description?`<p class="scope">${n(b.description)}</p>`:'<p class="scope dim">No description.</p>'}
    ${b.notes?`<dl class="kv"><div class="kv-wide"><dt>Notes</dt><dd>${n(b.notes)}</dd></div></dl>`:""}`,{action:`<button type="button" class="btn-ghost btn-xs" data-edit-project>${c.edit(13)}<span>Edit</span></button>`}),l=f("Client",`
    <p class="co-name">${n(b.companies?.name||"\u2014")}</p>
    ${b.contacts?`
      <div class="contact">
        ${T({full_name:b.contacts.full_name},34)}
        <div class="contact-body">
          <p class="contact-name"><a class="lnk" href="#/contact/${n(b.contacts.id)}">${n(b.contacts.full_name)}</a></p>
          <div class="contact-lines">
            ${b.contacts.phone?`<a class="lnk" href="${n(ft(b.contacts.phone))}">${c.phone(13)}${n(b.contacts.phone)}</a>`:""}
            ${b.contacts.email?`<a class="lnk" href="${n(St(b.contacts.email))}">${c.mail(13)}${n(b.contacts.email)}</a>`:""}
          </div>
        </div>
      </div>
      <div class="contact-acts">${$t(b.contacts,{text:`Good day, Kingson Engineering here regarding ${b.name}.`})}</div>`:'<p class="dim">No contact linked.</p>'}`);return`
    <a class="back lnk" href="#/projects">${c.chevron(13)}<span>Back to projects</span></a>
    ${i}
    <div class="grid grid-opp">
      <div class="col-wide">${r}${f("Activity",Bt(a),{tight:!0,note:x(a.length,"entry","entries")})}</div>
      <div class="col-side">${l}${zt(o)}</div>
    </div>`}function Ns(t,e,{me:a}){t.addEventListener("click",o=>{if(o.target.closest("[data-edit-project]"))return ea({project:b,me:a,onDone:e})}),Kt(t,{project_id:b.id},a,e)}function Ms(){return b?[b.companies?.name,Pt[b.status]].filter(Boolean).map(n).join(" \xB7 "):""}var js,b,fn=j(()=>{F();B();P();V();W();st();Me();js=()=>b?.name||"Project",b=null});var $n={};Q($n,{mount:()=>Is,render:()=>Us,sub:()=>Rs,title:()=>Ps});async function Us(t,{me:e}){if(e?.role!=="admin")return f("",w("This screen is for administrators.","Ask Mr Murandu if you need access to it.",{tone:"quiet"}),{tight:!0});[sa,Ue]=await Promise.all([d.profiles(),d.enquiries(60)]);let a=f("People",ct(`
    <table class="tbl tbl-rows">
      <thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col"></th></tr></thead>
      <tbody>
        ${sa.map(i=>`<tr>
          <td><span class="lnk-strong">${T(i,24)}<span>${n(i.full_name)}</span></span></td>
          <td>
            <label class="sr-only" for="r-${n(i.id)}">Role for ${n(i.full_name)}</label>
            <select class="sel sel-inline" id="r-${n(i.id)}" data-role="${n(i.id)}"${i.id===e.id?' disabled title="You cannot change your own role"':""}>
              <option value="staff"${i.role==="staff"?" selected":""}>Staff</option>
              <option value="admin"${i.role==="admin"?" selected":""}>Administrator</option>
            </select>
          </td>
          <td>${i.active?'<span class="pill pill-won">Active</span>':'<span class="pill pill-lost">Deactivated</span>'}</td>
          <td class="ta-r">${i.id===e.id?'<span class="dim">you</span>':`<button type="button" class="btn-ghost btn-xs" data-active="${n(i.id)}" data-to="${i.active?"false":"true"}">
                 ${i.active?"Deactivate":"Reactivate"}</button>`}</td>
        </tr>`).join("")}
      </tbody>
    </table>`),{tight:!0,note:"Staff run the pipeline. Administrators can also delete records and change roles."}),o=f("Adding somebody",`
    <p class="scope">New accounts are created in the Supabase dashboard under
      <strong>Authentication \u2192 Users</strong>. A profile row appears here automatically the
      moment the account is created, as Staff. Change the role above if they need it.</p>
    <p class="scope">Deactivating somebody keeps everything they did \u2014 their calls, their
      quotations, their site visits \u2014 and stops them signing in. Deleting the account would
      take the history with it, which is why this screen does not offer it.</p>`),s=f("Website enquiry log",Ue.length?ct(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Received</th><th scope="col">From</th><th scope="col">Contact</th>
        <th scope="col">Needs</th><th scope="col">Became</th>
      </tr></thead>
      <tbody>
        ${Ue.map(i=>`<tr${i.spam?' class="is-done"':""}>
          <td><span class="td-main num">${n(kt(i.created_at))}</span></td>
          <td><span class="td-main">${n(i.name)}</span><span class="td-sub">${n(i.company||"")}</span></td>
          <td><span class="td-sub">${n(i.contact)}</span></td>
          <td><span class="td-sub">${n(i.service||"\u2014")}${i.location?" \xB7 "+n(i.location):""}</span></td>
          <td>${i.spam?'<span class="pill pill-lost">Blocked as spam</span>':i.opportunity_id?`<a class="lnk" href="#/opportunity/${n(i.opportunity_id)}">opportunity</a>`:'<span class="pill pill-overdue">not converted</span>'}</td>
        </tr>`).join("")}
      </tbody>
    </table>`):w("No website enquiries yet.","Everything submitted on kingson-engineering.vercel.app lands here and in the pipeline.",{tone:"quiet"}),{tight:!0,note:`${x(Ue.length,"submission")} \xB7 the last sixty`});return`${a}${o}${s}`}function Is(t,e,{me:a}){t.addEventListener("change",async o=>{let s=o.target.closest("[data-role]");if(s)try{await $.update("profiles",C("id",s.dataset.role),{role:s.value}),v("Role updated."),await e()}catch(i){v(i.message||"That could not be changed.","bad"),await e()}}),t.addEventListener("click",async o=>{let s=o.target.closest("[data-active]");if(s)try{await $.update("profiles",C("id",s.dataset.active),{active:s.dataset.to==="true"}),v(s.dataset.to==="true"?"Reactivated.":"Deactivated."),await e()}catch(i){v(i.message||"That could not be changed.","bad")}})}function Rs(){return`${n(x(sa.length,"person","people"))}`}var Ps,sa,Ue,yn=j(()=>{F();P();V();W();dt();Ps="Settings",sa=[],Ue=[]});He();B();var X=null,Tn=new Set,Ee=()=>X;var wa=()=>!!(Fe()?.access_token&&X);var Ge=()=>Tn.forEach(t=>t(X));function qn(t){try{let e=t.split(".")[1],a=atob(e.replace(/-/g,"+").replace(/_/g,"/"));return JSON.parse(a).sub||null}catch{return null}}async function va(){let t=Fe(),e=t?.access_token?qn(t.access_token):null;if(!e)return X=null,null;let o=(await $.select("profiles",`select=*&id=eq.${e}`))[0]||null;if(!o)throw X=null,Ct(null),new Error("This account has no profile in the CRM. Ask an administrator to set one up.");if(!o.active)throw X=null,Ct(null),new Error("This account has been deactivated.");return X=o,X}async function xa(){if(!ua())return X=null,null;try{await va()}catch{X=null}return Ge(),X}async function ka(t,e){return await fa(t,e),await va(),Ge(),ba($).catch(()=>{}),X}async function Sa(){await $a(),X=null,Ge()}F();B();P();W();var On=[{key:"dashboard",href:"#/",label:"Dashboard",ic:"dashboard"},{key:"pipeline",href:"#/pipeline",label:"Pipeline",ic:"pipeline"},{key:"followups",href:"#/followups",label:"Follow-ups",ic:"bell",badge:!0},{key:"tasks",href:"#/tasks",label:"Tasks",ic:"task"},{key:"contacts",href:"#/contacts",label:"Contacts",ic:"users"},{key:"quotes",href:"#/quotes",label:"Quotations",ic:"doc"},{key:"visits",href:"#/visits",label:"Site visits",ic:"pin"},{key:"projects",href:"#/projects",label:"Projects",ic:"briefcase"},{key:"settings",href:"#/settings",label:"Settings",ic:"shield",admin:!0}];function Ke(t,e,{overdue:a=0}={}){return`
  <div class="rail-top">
    <a class="mark" href="#/">
      <span class="mark-name display">KINGSON</span>
      <span class="mark-sub">Enquiries &amp; Projects</span>
    </a>
  </div>

  <nav class="rail-nav" aria-label="Sections">${On.filter(s=>!s.admin||e?.role==="admin").map(s=>`
      <a class="rail-link${t===s.key?" is-active":""}" href="${s.href}"
         ${t===s.key?'aria-current="page"':""}>
        ${c[s.ic](17)}<span>${n(s.label)}</span>
        ${s.badge&&a?`<span class="rail-count" title="${n(a)} overdue">${n(a)}</span>`:""}
      </a>`).join("")}</nav>

  <div class="rail-foot">
    <div class="rail-me">
      <span class="avatar" style="--s:30px">${n(e?.initials||"?")}</span>
      <span class="rail-me-body">
        <span class="rail-me-name">${n(e?.full_name||"")}</span>
        <span class="rail-me-role">${n(e?.role==="admin"?"Administrator":"Staff")}</span>
      </span>
    </div>
    <button type="button" class="rail-signout" data-signout>${c.logout(14)}<span>Sign out</span></button>
  </div>`}var Ce=(t,e="",a="")=>`
  <div class="topbar-in">
    <button type="button" class="topbar-menu" data-rail-open aria-expanded="false" aria-controls="rail">
      ${c.menu(18)}<span class="sr-only">Open navigation</span>
    </button>
    <div class="topbar-titles">
      <h1 class="topbar-title display">${n(t)}</h1>
      ${e?`<p class="topbar-sub">${e}</p>`:""}
    </div>
    ${a?`<div class="topbar-actions">${a}</div>`:""}
  </div>`,Ca=(t="")=>`
  <div class="signin">
    <form class="signin-card" id="signin-form" novalidate>
      <p class="signin-mark display">KINGSON</p>
      <p class="signin-sub">Enquiries &amp; Projects</p>
      <h1 class="signin-title">Sign in</h1>

      <div class="field">
        <label for="si-email">Email</label>
        <input class="inp" id="si-email" name="email" type="email" autocomplete="username"
               inputmode="email" autocapitalize="none" spellcheck="false" required>
      </div>
      <div class="field">
        <label for="si-password">Password</label>
        <input class="inp" id="si-password" name="password" type="password"
               autocomplete="current-password" required>
      </div>

      <p class="signin-err" role="alert" ${t?"":"hidden"}>${n(t)}</p>
      <button type="submit" class="btn" data-signin>Sign in</button>
      <p class="signin-foot">Kingson Engineering internal system. Access is by account only.</p>
    </form>
  </div>`;V();dt();P();var Xt=document.getElementById("app"),oa=document.getElementById("rail"),ue=document.getElementById("topbar"),yt=document.getElementById("view"),ca=document.getElementById("scrim"),Zt=document.getElementById("gate"),ia={dashboard:()=>Promise.resolve().then(()=>(Ra(),Ia)),pipeline:()=>Promise.resolve().then(()=>(Fa(),Ba)),followups:()=>Promise.resolve().then(()=>(Ha(),Wa)),tasks:()=>Promise.resolve().then(()=>(za(),Va)),contacts:()=>Promise.resolve().then(()=>(Ya(),Ja)),contact:()=>Promise.resolve().then(()=>(tn(),Xa)),opportunity:()=>Promise.resolve().then(()=>(sn(),nn)),quotes:()=>Promise.resolve().then(()=>(ln(),rn)),visits:()=>Promise.resolve().then(()=>(dn(),cn)),projects:()=>Promise.resolve().then(()=>(mn(),un)),project:()=>Promise.resolve().then(()=>(fn(),hn)),settings:()=>Promise.resolve().then(()=>(yn(),$n))},Bs={opportunity:"pipeline",contact:"contacts",project:"projects"},it=gn(),ra=0;function gn(){let t=(location.hash||"#/").replace(/^#\/?/,""),[e,a]=t.split("/");return e?ia[e]?{key:e,arg:a||null}:{key:"dashboard",arg:null}:{key:"dashboard",arg:null}}async function da(){try{ra=(await d.openOpportunities()).filter(rt).length}catch{}}var pe=0;function Fs(){let t=yt.cloneNode(!1);return delete t.dataset.view,yt.replaceWith(t),yt=t,t}async function he(){if(!wa())return me();let t=++pe,e=Ee(),a=Bs[it.key]||it.key;oa.innerHTML=Ke(a,e,{overdue:ra}),pa();let o;try{o=await(ia[it.key]||ia.dashboard)()}catch{ue.innerHTML=Ce("Kingson"),yt.innerHTML=Je("That screen could not be loaded. Check the connection and try again.");return}if(t===pe){ue.innerHTML=Ce(typeof o.title=="function"?o.title(it.arg):o.title,""),Fs(),yt.innerHTML=La(4),yt.dataset.view=it.key;try{let s=await o.render(it.arg,{me:e,rerender:la});if(t!==pe)return;yt.innerHTML=s,ue.innerHTML=Ce(typeof o.title=="function"?o.title(it.arg):o.title,typeof o.sub=="function"?await o.sub(it.arg):o.sub||"",typeof o.actions=="function"?o.actions(it.arg,e):""),o.mount?.(yt,la,{me:e,arg:it.arg})}catch(s){if(t!==pe)return;console.error("[kingson] view failed",it.key,s),yt.innerHTML=Je(s?.message||"That screen could not be loaded.")}da().then(()=>{t===pe&&(oa.innerHTML=Ke(a,Ee(),{overdue:ra}))})}}async function la(){let t=window.scrollY;await he(),window.scrollTo(0,t)}function me(t=""){Xt.hidden=!0,Zt.hidden=!1,Zt.innerHTML=Ca(t);let e=Zt.querySelector("#signin-form"),a=e.querySelector("[data-signin]"),o=e.querySelector(".signin-err");e.querySelector("#si-email").focus(),e.addEventListener("submit",async s=>{s.preventDefault();let i=e.querySelector("#si-email").value.trim(),r=e.querySelector("#si-password").value;if(o.hidden=!0,!i||!r){o.textContent="Enter your email address and password.",o.hidden=!1;return}a.disabled=!0,a.textContent="Signing in\u2026";try{await ka(i,r),Zt.hidden=!0,Zt.innerHTML="",Xt.hidden=!1,await da(),await he()}catch(l){o.textContent=l?.status===400?"That email address and password do not match an account.":l?.message||"Sign-in failed.",o.hidden=!1,a.disabled=!1,a.textContent="Sign in",e.querySelector("#si-password").select()}})}var Ws=()=>{Xt.classList.add("rail-open"),ca.hidden=!1,oa.querySelector(".rail-link")?.focus(),ue.querySelector("[data-rail-open]")?.setAttribute("aria-expanded","true")},pa=()=>{Xt.classList.remove("rail-open"),ca.hidden=!0,ue.querySelector("[data-rail-open]")?.setAttribute("aria-expanded","false")};document.addEventListener("click",async t=>{if(t.target.closest("[data-rail-open]"))return Ws();if(t.target===ca||t.target.closest(".rail-link"))return pa();if(t.target.closest("[data-signout]")){await Sa(),location.hash="#/",me();return}if(t.target.closest("[data-retry]"))return he();let e=Ee();if(t.target.closest("[data-new-opp]")){let{newOpportunity:a}=await Promise.resolve().then(()=>(st(),je));return a({me:e})}if(t.target.closest("[data-new-contact]")){let{contactDialog:a}=await Promise.resolve().then(()=>(st(),je));return a({onDone:o=>{location.hash=`#/contact/${o.id}`}})}if(t.target.closest("[data-new-task-global]")){let{taskDialog:a}=await Promise.resolve().then(()=>(st(),je));return a({me:e,onDone:la})}});document.addEventListener("keydown",t=>{t.key==="Escape"&&Xt.classList.contains("rail-open")&&pa()});addEventListener("hashchange",()=>{it=gn(),he().then(()=>{yt.focus({preventScroll:!0}),scrollTo(0,0)})});addEventListener("storage",t=>{t.key==="kingson-crm/session/v1"&&!t.newValue&&me("Signed out in another tab.")});(async function(){if(document.getElementById("boot")?.remove(),!await xa())return me();Zt.hidden=!0,Xt.hidden=!1,await da(),await he()})().catch(t=>{console.error("[kingson] boot failed",t),me("Something went wrong starting the application. Reload the page.")});export{n as esc,la as softRender,v as toast};
