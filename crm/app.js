var Ya=Object.defineProperty;var O=(t,e)=>()=>(t&&(e=t(t=0)),e);var Z=(t,e)=>{for(var n in e)Ya(t,n,{get:e[n],enumerable:!0})};var le,ke,ce,kt,de=O(()=>{le="https://fgzwcxwmaohowryzdgui.supabase.co",ke="sb_publishable_QYbHrEJ06GpGDMlIqf5tzw_ijJpdtTV",ce="kingson-files",kt="Africa/Harare"});function Un(){try{let t=localStorage.getItem(nn);G=t?JSON.parse(t):null}catch{G=null}return G}function sn(){return G}function Ct(t){G=t;try{t?localStorage.setItem(nn,JSON.stringify(t)):localStorage.removeItem(nn)}catch{}return t}function pe(t,e){let n=e?.code||"",a=e?.message||e?.error_description||e?.msg||"";return n==="23505"?/contacts_email_key/.test(a)?"A contact with that email address already exists.":/companies_name_key/.test(a)?"A company with that name already exists.":"That record already exists.":n==="23514"?/lost_has_reason/.test(a)?"A lost opportunity needs a reason.":/quotes_sent_has_date/.test(a)?"A quotation marked sent needs the date it went out.":/contacts_reachable/.test(a)?"A contact needs a phone number, a WhatsApp number or an email address.":/amount_sane|value_sane/.test(a)?"That amount cannot be negative.":"That value is not allowed here.":n==="23503"?"That record is still attached to something else.":t===401?"Your session has expired. Sign in again.":t===403||n==="42501"?"You do not have permission to do that.":t===404?"That record no longer exists.":t===0?"No connection. Check the network and try again.":a||`Request failed (${t}).`}async function rn(t,{method:e="POST",body:n,token:a}={}){let s;try{s=await fetch(`${le}/auth/v1${t}`,{method:e,headers:{apikey:ke,"Content-Type":"application/json",...a?{Authorization:`Bearer ${a}`}:{}},body:n?JSON.stringify(n):void 0})}catch{throw new ht(pe(0),{status:0})}let i=await s.text(),r=i?JSON.parse(i):null;if(!s.ok)throw new ht(pe(s.status,r),{status:s.status,code:r?.code||""});return r}async function Fn(t,e){let n=await rn("/token?grant_type=password",{body:{email:t.trim(),password:e}});return Ct(In(n))}async function Wn(){let t=G;if(Ct(null),t?.access_token)try{await rn("/logout",{token:t.access_token})}catch{}}async function an(){if(!G?.refresh_token)throw new ht("Your session has expired. Sign in again.",{status:401});return Se||(Se=rn("/token?grant_type=refresh_token",{body:{refresh_token:G.refresh_token}}).then(t=>Ct(In(t))).catch(t=>{throw Ct(null),t}).finally(()=>{Se=null})),Se}function to(t,e){return Te.set(t,{at:Date.now(),promise:e}),e.catch(()=>Te.delete(t)),e}async function Bt(t,{method:e="GET",body:n,headers:a={},retry:s=!0}={}){if(Pn(e,a)){let i=Te.get(t);if(i&&Date.now()-i.at<Xa)return i.promise}else Te.clear();return Pn(e,a)?to(t,on(t,{method:e,headers:a,retry:s})):on(t,{method:e,body:n,headers:a,retry:s})}async function on(t,{method:e="GET",body:n,headers:a={},retry:s=!0}={}){if(G&&Bn())try{await an()}catch{}let i;try{i=await fetch(`${le}${t}`,{method:e,headers:{apikey:ke,"Content-Type":"application/json",...G?.access_token?{Authorization:`Bearer ${G.access_token}`}:{},...a},body:n===void 0?void 0:JSON.stringify(n)})}catch{throw new ht(pe(0),{status:0})}if(i.status===401&&s&&G?.refresh_token)try{return await an(),on(t,{method:e,body:n,headers:a,retry:!1})}catch{}let r=await i.text(),c=null;try{c=r?JSON.parse(r):null}catch{c=r}if(!i.ok)throw new ht(pe(i.status,c),{status:i.status,code:c?.code||"",details:c?.details||"",hint:c?.hint||""});return c}var nn,G,Se,In,Bn,ht,Xa,Te,Pn,f,qe,Hn,M,J,ln=O(()=>{de();nn="kingson-crm/session/v1",G=null,Se=null;In=t=>({access_token:t.access_token,refresh_token:t.refresh_token,expires_at:Date.now()+((t.expires_in||3600)-60)*1e3,user:t.user||null}),Bn=()=>!G||!G.expires_at||Date.now()>=G.expires_at,ht=class extends Error{constructor(e,{status:n=0,code:a="",details:s="",hint:i=""}={}){super(e),this.name="ApiError",this.status=n,this.code=a,this.details=s,this.hint=i}};Xa=2e3,Te=new Map,Pn=(t,e)=>t==="GET"&&!e.Prefer;f={select:(t,e="")=>Bt(`/rest/v1/${t}${e?"?"+e:""}`),insert:(t,e,n="")=>Bt(`/rest/v1/${t}${n?"?"+n:""}`,{method:"POST",body:e,headers:{Prefer:"return=representation"}}),update:async(t,e,n)=>{let a=await Bt(`/rest/v1/${t}?${e}`,{method:"PATCH",body:n,headers:{Prefer:"return=representation"}});if(Array.isArray(a)&&!a.length)throw new ht("Not saved \u2014 you may not have permission to change this, or it no longer exists.",{status:403});return a},rpc:(t,e={})=>Bt(`/rest/v1/rpc/${t}`,{method:"POST",body:e})},qe={async upload(t,e,n){if(G&&Bn())try{await an()}catch{}let a;try{a=await fetch(`${le}/storage/v1/object/${t}/${encodeURI(e)}`,{method:"POST",headers:{apikey:ke,Authorization:`Bearer ${G?.access_token||""}`,"x-upsert":"false",...n.type?{"Content-Type":n.type}:{}},body:n})}catch{throw new ht(pe(0),{status:0})}if(!a.ok){let s=null;try{s=await a.json()}catch{}throw new ht(a.status===413?"That file is larger than the 25 MB limit.":s?.message||`Upload failed (${a.status}).`,{status:a.status})}return e},async signedUrl(t,e,n=120){let a=await Bt(`/storage/v1/object/sign/${t}/${encodeURI(e)}`,{method:"POST",body:{expiresIn:n}});return`${le}/storage/v1${a.signedURL||a.signedUrl}`},async remove(t,e){return Bt(`/storage/v1/object/${t}`,{method:"DELETE",body:{prefixes:e}})}},Hn=t=>{let e=String(t??"");return/[,.()"\\\s]/.test(e)?`"${e.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`:e},M=(t,e)=>`${t}=eq.${encodeURIComponent(e)}`,J=(t,e="asc",n=!0)=>`order=${t}.${e}${n?".nullslast":""}`});function Y(){return new Intl.DateTimeFormat("en-CA",{timeZone:kt}).format(new Date)}function q(t){if(!t)return null;let e=Date.parse(Y()+"T00:00:00Z"),n=Date.parse(String(t).slice(0,10)+"T00:00:00Z");return Number.isNaN(n)?null:Math.round((n-e)/864e5)}function Ee(t,e){let n=new Date(Date.parse(String(t).slice(0,10)+"T00:00:00Z"));return n.setUTCDate(n.getUTCDate()+e),n.toISOString().slice(0,10)}function Ae(t=Y(),e=1){let n=Ee(t,e);return new Date(n+"T00:00:00Z").getUTCDay()===0&&(n=Ee(n,1)),n}function lt(t){return!wt(t)||!t.next_action_due?!1:q(t.next_action_due)<0}function Ne(t){return!wt(t)||!t.next_action_due?!1:q(t.next_action_due)===0}function ct(t){if(!wt(t))return{level:"closed",label:nt[t.stage]?.name||"\u2014",sort:0};if(t.stage==="on_hold"&&t.hold_review_on&&q(t.hold_review_on)>0)return{level:"held",label:`On hold \xB7 review ${eo(t.hold_review_on)}`,sort:50};if(Wt(t))return{level:"unbooked",label:"No next action",sort:900};let e=q(t.next_action_due);if(e<0){let n=Math.abs(e);return{level:"overdue",label:n===1?"1 day overdue":`${n} days overdue`,sort:1e3+n}}return e===0?{level:"today",label:"Due today",sort:800}:e<=7?{level:"soon",label:e===1?"Due tomorrow":`Due in ${e} days`,sort:700-e}:{level:"clear",label:`Due in ${e} days`,sort:100-Math.min(e,99)}}function Oe(t){return!wt(t)||!Number(t.live_quotes||0)?!1:!t.next_action_due||q(t.next_action_due)<0}function tt(t){return t?t.stage==="won"&&t.won_value!=null?{amount:Number(t.won_value),currency:t.currency||"USD",kind:"won"}:t.quoted_value!=null?{amount:Number(t.quoted_value),currency:t.quote_currency||t.currency||"USD",kind:t.quote_status==="draft"?"draft":"quoted"}:{amount:null,currency:t.currency||"USD",kind:"none"}:{amount:null,currency:"USD",kind:"none"}}function At(t,e=tt){let n={},a=0;for(let s of t){let i=e(s);i.amount!=null&&(n[i.currency]=(n[i.currency]||0)+i.amount,a++)}return{by:n,valued:a,unvalued:t.length-a}}async function Zn(t){let e;try{e=await t.rpc("enum_values",{enum_name:"opp_stage"})}catch{return{ok:!0,skipped:!0}}let n=new Set((e||[]).map(r=>typeof r=="string"?r:r.value)),a=new Set(ft.map(r=>r.id)),s=[...n].filter(r=>!a.has(r)),i=[...a].filter(r=>!n.has(r));return(s.length||i.length)&&console.error("[kingson] pipeline stages disagree with the database",{missingFromApp:s,notInDatabase:i}),{ok:!s.length&&!i.length,missing:s,extra:i}}var ft,nt,Vn,ue,De,Lt,Qn,Ce,Gn,cn,zn,Ft,Le,Kn,wt,Wt,eo,dn,W=O(()=>{de();ft=[{id:"new",name:"New enquiry",short:"New",open:!0,group:"intake"},{id:"contacted",name:"Contacted",short:"Contacted",open:!0,group:"intake"},{id:"requirements",name:"Requirements / site visit",short:"Requirements",open:!0,group:"survey"},{id:"quoting",name:"Quote / BOQ preparing",short:"Quoting",open:!0,group:"quote"},{id:"quote_sent",name:"Quote sent",short:"Quote sent",open:!0,group:"quote"},{id:"followup",name:"Follow-up / awaiting decision",short:"Follow-up",open:!0,group:"chase"},{id:"on_hold",name:"On hold",short:"On hold",open:!0,group:"hold"},{id:"won",name:"Won",short:"Won",open:!1,group:"won"},{id:"lost",name:"Lost",short:"Lost",open:!1,group:"lost"}],nt=Object.fromEntries(ft.map(t=>[t.id,t])),Vn=ft.filter(t=>t.open).map(t=>t.id),ue=["low","normal","high","urgent"],De=["website","whatsapp","phone","email","referral","walk_in","other"],Lt={website:"Website",whatsapp:"WhatsApp",phone:"Phone",email:"Email",referral:"Referral",walk_in:"Walk-in",other:"Other"},Qn=["draft","sent","discussed","accepted","rejected","superseded","expired"],Ce={draft:"Draft",sent:"Sent",discussed:"Customer responded",accepted:"Accepted",rejected:"Not accepted",superseded:"Superseded",expired:"Expired"},Gn=[["price","Price"],["competitor","Went with a competitor"],["timing","Timing"],["project_cancelled","Project cancelled"],["scope_changed","Scope changed"],["no_response","No response"],["other","Other"]],cn=[["email","Email"],["whatsapp","WhatsApp"],["phone","Phone"],["meeting","Meeting"],["other","Other"]],zn=["planning","in_progress","on_hold","complete","cancelled"],Ft={planning:"Planning",in_progress:"In progress",on_hold:"On hold",complete:"Complete",cancelled:"Cancelled"},Le={enquiry:"Enquiry",note:"Note",call:"Call",whatsapp:"WhatsApp",email:"Email",meeting:"Meeting",site_visit:"Site visit",quote:"Quotation",stage_change:"Stage change",task:"Task",file:"File",won:"Won",lost:"Lost",reply:"Customer reply",on_hold:"On hold",system:"System"},Kn=["call","whatsapp","email","meeting","note"];wt=t=>!!(t&&nt[t.stage]?.open);Wt=t=>wt(t)&&!t.next_action_due;eo=t=>new Date(String(t).slice(0,10)+"T12:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"short",timeZone:"UTC"});dn=(t,e)=>t.reduce((n,a)=>n+(Number(e(a))||0),0)});function Nt(){try{return localStorage.getItem(un)==="1"}catch{return!1}}function na(t){try{t?localStorage.setItem(un,"1"):localStorage.removeItem(un)}catch{}}var un,oo,dt,Me=O(()=>{un="kingson.showDemo";oo=()=>Nt()?"":"is_demo=eq.false",dt=t=>{let e=oo();return e?t?`${t}&${e}`:e:t}});var mn,aa,so,d,H=O(()=>{ln();de();W();Me();mn="*",aa=J("next_action_due","asc"),so=`stage=in.(${Vn.join(",")})`,d={profiles:()=>f.select("profiles",`select=*&${J("full_name")}`),me:t=>f.select("profiles",`select=*&${M("id",t)}`).then(e=>e[0]||null),opportunities:(t="")=>f.select("v_opportunity_state",dt(`select=${mn}${/(^|&)order=/.test(t)?"":"&"+aa}${t?"&"+t:""}`)),openOpportunities:()=>f.select("v_opportunity_state",dt(`select=${mn}&${so}&${aa}`)),opportunity:t=>f.select("v_opportunity_state",`select=${mn}&${M("id",t)}`).then(e=>e[0]||null),createOpportunity:t=>f.insert("opportunities",t).then(e=>e[0]),updateOpportunity:(t,e)=>f.update("opportunities",M("id",t),e).then(n=>n[0]),setStage:(t,e)=>d.updateOpportunity(t,{stage:e}),recordQuote:(t,{amount:e,currency:n,preparedOn:a,validUntil:s,notes:i,reference:r,documentRef:c})=>f.rpc("record_quote",{p_opportunity_id:t,p_amount:e,p_currency:n||"USD",p_prepared_on:a||null,p_valid_until:s||null,p_notes:i||null,p_reference:r||null,p_document_ref:c||null}),markQuoteSent:(t,{sentAt:e,followUpOn:n,channel:a,notes:s})=>f.rpc("mark_quote_sent",{p_quote_id:t,p_sent_at:e||null,p_follow_up_on:n||null,p_channel:a||"email",p_notes:s||null}),logFollowUp:(t,{channel:e,notes:n,at:a,nextAction:s,nextDue:i})=>f.rpc("log_follow_up",{p_opportunity_id:t,p_channel:e,p_notes:n,p_at:a||null,p_next_action:s||null,p_next_due:i||null}),customerReplied:(t,{channel:e,notes:n,at:a})=>f.rpc("mark_customer_replied",{p_opportunity_id:t,p_channel:e,p_notes:n||null,p_at:a||null}),decide:(t,e,{on:n,value:a,reason:s,notes:i,reviewOn:r}={})=>f.rpc("decide_opportunity",{p_opportunity_id:t,p_outcome:e,p_on:n||null,p_value:a??null,p_reason:s||null,p_notes:i||null,p_review_on:r||null}),addWorkingDays:(t,e)=>f.rpc("add_working_days",{d:t,n:e}),settings:()=>f.select("crm_settings","select=*&limit=1").then(t=>t[0]||null),updateSettings:t=>f.update("crm_settings","id=eq.true",t).then(e=>e[0]),contacts:(t="")=>{let e=dt(`select=*,companies(id,name)&${J("full_name")}`);if(t){let n=encodeURIComponent(Hn(`%${t}%`));e+=`&or=(full_name.ilike.${n},email.ilike.${n},phone.ilike.${n},whatsapp.ilike.${n})`}return f.select("contacts",e)},contact:t=>f.select("contacts",`select=*,companies(id,name,kind,town)&${M("id",t)}`).then(e=>e[0]||null),createContact:t=>f.insert("contacts",t).then(e=>e[0]),updateContact:(t,e)=>f.update("contacts",M("id",t),e).then(n=>n[0]),companies:()=>f.select("companies",dt(`select=*&${J("name")}`)),company:t=>f.select("companies",`select=*&${M("id",t)}`).then(e=>e[0]||null),createCompany:t=>f.insert("companies",t).then(e=>e[0]),updateCompany:(t,e)=>f.update("companies",M("id",t),e).then(n=>n[0]),async findOrCreateCompany(t){let e=(t||"").trim();if(!e)return null;let n=await f.select("companies",`select=id,name&name=ilike.${encodeURIComponent(e)}&limit=1`);return n[0]?n[0]:d.createCompany({name:e})},activityFor:t=>f.select("activities",`select=*,profiles(full_name,initials)&${M("opportunity_id",t)}&${J("occurred_at","desc")}`),activityForContact:t=>f.select("activities",`select=*,profiles(full_name,initials),opportunities(id,ref,title)&${M("contact_id",t)}&${J("occurred_at","desc")}`),activityForProject:t=>f.select("activities",`select=*,profiles(full_name,initials)&${M("project_id",t)}&${J("occurred_at","desc")}`),recentActivity:(t=12)=>f.select("activities",dt(`select=*,profiles(full_name,initials),opportunities(id,ref,title)&${J("occurred_at","desc")}&limit=${t}`)),logActivity:t=>f.insert("activities",t).then(e=>e[0]),tasks:(t="")=>f.select("tasks",dt(`select=*,profiles!tasks_owner_id_fkey(full_name,initials),opportunities(id,ref,title,stage),contacts(id,full_name,phone,whatsapp,email)&${J("due_date")}${t?"&"+t:""}`)),openTasks:()=>d.tasks("status=eq.open"),tasksFor:t=>d.tasks(M("opportunity_id",t)),createTask:t=>f.insert("tasks",t).then(e=>e[0]),updateTask:(t,e)=>f.update("tasks",M("id",t),e).then(n=>n[0]),completeTask:t=>d.updateTask(t,{status:"done"}),visits:(t="")=>f.select("site_visits",dt(`select=*,profiles(full_name,initials),opportunities(id,ref,title,company_id,companies(name))&${J("scheduled_at")}${t?"&"+t:""}`)),upcomingVisits:()=>d.visits(`status=eq.scheduled&scheduled_at=gte.${new Date(Date.now()-864e5).toISOString()}`),visitsFor:t=>d.visits(M("opportunity_id",t)),createVisit:t=>f.insert("site_visits",t).then(e=>e[0]),updateVisit:(t,e)=>f.update("site_visits",M("id",t),e).then(n=>n[0]),quotes:(t="")=>f.select("quotes",dt(`select=*,profiles:sent_by(full_name,initials),opportunities(id,ref,title,stage,next_action_due,company_id,companies(name))&order=prepared_on.desc,version.desc${t?"&"+t:""}`)),liveQuotes:()=>d.quotes("status=in.(sent,discussed)"),quotesFor:t=>d.quotes(M("opportunity_id",t)),createQuote:t=>f.insert("quotes",t).then(e=>e[0]),updateQuote:(t,e)=>f.update("quotes",M("id",t),e).then(n=>n[0]),projects:(t="")=>f.select("projects",dt(`select=*,companies(id,name),contacts(id,full_name,phone,email),profiles(full_name,initials),opportunities(id,ref)&${J("created_at","desc")}${t?"&"+t:""}`)),project:t=>f.select("projects",`select=*,companies(id,name),contacts(id,full_name,phone,email,whatsapp),profiles(full_name,initials),opportunities(id,ref,title)&${M("id",t)}`).then(e=>e[0]||null),updateProject:(t,e)=>f.update("projects",M("id",t),e).then(n=>n[0]),convertToProject:(t,{name:e,startDate:n,targetDate:a}={})=>f.rpc("convert_to_project",{p_opportunity_id:t,p_name:e||null,p_start_date:n||null,p_target_date:a||null}),projectForOpportunity:t=>f.select("projects",`select=id,name,status&${M("opportunity_id",t)}`).then(e=>e[0]||null),enquiries:(t=50)=>f.select("enquiries",dt(`select=*&${J("created_at","desc")}&limit=${t}`)),filesFor:(t,e)=>f.select("files",`select=*,profiles(full_name,initials)&${M(t,e)}&${J("created_at","desc")}`),async uploadFile(t,e,n){let a=t.name.replace(/[^\w.\-]+/g,"_").slice(-80),s=`${Object.keys(e)[0].replace("_id","")}/${Object.values(e)[0]}/${Date.now()}-${a}`;await qe.upload(ce,s,t);try{return await f.insert("files",{bucket:ce,path:s,name:t.name,mime:t.type||null,size_bytes:t.size,uploaded_by:n||null,...e}).then(i=>i[0])}catch(i){try{await qe.remove(ce,[s])}catch{}throw i}},downloadUrl:t=>qe.signedUrl(ce,t,120),metrics:()=>f.rpc("dashboard_metrics",{p_include_demo:Nt()}),async dashboard(){let[t,e,n,a,s,i]=await Promise.all([d.metrics(),d.openOpportunities(),d.liveQuotes(),d.openTasks(),d.upcomingVisits(),d.recentActivity(10)]);return{metrics:t,open:e,liveQuotes:n,tasks:a,visits:s,recent:i}}}});function at(t,{empty:e="\u2014"}={}){let n=Object.entries(t||{}).filter(([,a])=>a!=null);return n.length?n.map(([a,s])=>L(s,a)).join(" \xB7 "):e}function oa(t){let e=Number(t);if(!Number.isFinite(e)||e===0)return t===0?"$0":"\u2014";let n=Math.abs(e);return n>=1e6?"$"+(e/1e6).toFixed(n%1e6?1:0)+"m":n>=1e3?"$"+(e/1e3).toFixed(n%1e3&&n<1e4?1:0)+"k":"$"+Math.round(e)}function Re(t){let e=Object.entries(t||{}).filter(([,n])=>n!=null);return e.length?e.map(([n,a])=>n==="USD"?oa(a):`${n} ${oa(a).slice(1)}`).join(" \xB7 "):""}function Tt(t){if(!t)return"";let e=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:kt,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:!1}).formatToParts(new Date(t)).map(n=>[n.type,n.value]));return`${e.year}-${e.month}-${e.day}T${e.hour}:${e.minute}`}function me(t){return t?new Date(t+":00+02:00").toISOString():null}function A(t){if(!t)return"\u2014";let e=q(St(t));return e===null?"\u2014":e===0?"today":e===1?"tomorrow":e===-1?"yesterday":e>0?`in ${e} days`:`${-e} days ago`}function Pe(t){let e=q(St(t));if(e===null||e>=0)return"";let n=Math.abs(e);return n===1?"1 day overdue":`${n} days overdue`}function ra(t,e=""){let n=String(t||"").replace(/\D/g,"");return n.length<9?"":`https://wa.me/${n}${e?"?text="+encodeURIComponent(e):""}`}var io,L,ro,lo,co,sa,j,Ht,ot,St,ia,v,o,$t,qt,I=O(()=>{de();W();io=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}),L=(t,e="USD")=>{if(t==null||t==="")return"\u2014";let n=Number(t);return Number.isFinite(n)?e==="USD"?io.format(n):`${e} ${n.toLocaleString("en-US",{maximumFractionDigits:0})}`:"\u2014"};ro=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",timeZone:kt}),lo=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:kt}),co=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hour12:!1,timeZone:kt}),sa=t=>typeof t=="string"&&t.length===10?new Date(t+"T12:00:00Z"):new Date(t),j=t=>t?ro.format(sa(t)):"\u2014",Ht=t=>t?lo.format(sa(t)):"\u2014",ot=t=>t?co.format(new Date(t)):"\u2014",St=t=>t?typeof t=="string"&&t.length===10?t:new Intl.DateTimeFormat("en-CA",{timeZone:kt}).format(new Date(t)):"";ia=t=>String(t||"").split(/[\s.]+/).filter(Boolean).map(e=>e[0]).slice(0,2).join("").toUpperCase()||"?",v=(t,e,n)=>`${t} ${t===1?e:n||e+"s"}`,o=t=>String(t??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),$t=t=>"tel:"+String(t||"").replace(/[^\d+]/g,"");qt=(t,e="",n="")=>{if(!t)return"";let a=[];return e&&a.push("subject="+encodeURIComponent(e)),n&&a.push("body="+encodeURIComponent(n)),`mailto:${t}${a.length?"?"+a.join("&"):""}`}});var S,l,Ws,Hs,z=O(()=>{S=(t,e=16)=>`<svg width="${e}" height="${e}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true" focusable="false">${t}</svg>`,l={dashboard:t=>S('<rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',t),pipeline:t=>S('<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="11" rx="1.5"/><rect x="16" y="4" width="5" height="7" rx="1.5"/>',t),bell:t=>S('<path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',t),alert:t=>S('<path d="M12 3.5 2.6 19.2a1.4 1.4 0 0 0 1.2 2.1h16.4a1.4 1.4 0 0 0 1.2-2.1L12 3.5z"/><path d="M12 9.5v4.2"/><path d="M12 17.4h.01"/>',t),clock:t=>S('<circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.1 1.9"/>',t),check:t=>S('<path d="M20 6.5 9.4 17.1 4 11.7"/>',t),cross:t=>S('<path d="M18 6 6 18M6 6l12 12"/>',t),phone:t=>S('<path d="M21.5 16.9v2.6a1.8 1.8 0 0 1-2 1.8 17.8 17.8 0 0 1-7.7-2.8 17.5 17.5 0 0 1-5.4-5.4A17.8 17.8 0 0 1 3.6 5.4a1.8 1.8 0 0 1 1.8-2h2.6a1.8 1.8 0 0 1 1.8 1.5c.1.9.3 1.7.5 2.5a1.8 1.8 0 0 1-.4 1.9L8.8 10.4a14 14 0 0 0 5.2 5.2l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.2 1.6.4 2.5.5a1.8 1.8 0 0 1 1.5 1.8z"/>',t),whatsapp:t=>S('<path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.6-4.5a8.4 8.4 0 1 1 15.4-4.4z"/><path d="M9 9.3c.3-.5.6-.5.9-.5h.5c.2 0 .4.1.6.5l.6 1.4c.1.2 0 .4-.1.6l-.5.6a7 7 0 0 0 3 3l.6-.5c.2-.2.4-.2.6-.1l1.4.6c.4.2.5.4.5.6v.5c0 .3 0 .6-.5.9a2.5 2.5 0 0 1-2.4.2 11.6 11.6 0 0 1-4.6-4.6A2.5 2.5 0 0 1 9 9.3z"/>',t),mail:t=>S('<rect x="2.8" y="4.8" width="18.4" height="14.4" rx="2"/><path d="m3.4 6.4 8.6 6 8.6-6"/>',t),globe:t=>S('<circle cx="12" cy="12" r="8.8"/><path d="M3.4 12h17.2"/><path d="M12 3.2a13 13 0 0 1 0 17.6 13 13 0 0 1 0-17.6z"/>',t),users:t=>S('<path d="M16.5 20v-1.8a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.2V20"/><circle cx="9.8" cy="7.6" r="3.6"/><path d="M21 20v-1.8a3.6 3.6 0 0 0-2.7-3.5"/><path d="M15.4 4.2a3.6 3.6 0 0 1 0 7"/>',t),pin:t=>S('<path d="M20 10.4c0 5.5-8 11.2-8 11.2s-8-5.7-8-11.2a8 8 0 0 1 16 0z"/><circle cx="12" cy="10.2" r="2.8"/>',t),doc:t=>S('<path d="M14 2.8H7.2a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2V7.8z"/><path d="M14 2.8v5h4.8"/><path d="M8.8 13h6.4M8.8 16.6h4.4"/>',t),calendar:t=>S('<rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M16 3v4M8 3v4M3.4 10.2h17.2"/>',t),note:t=>S('<path d="M4.4 4.6h15.2v10.2l-4.8 4.6H4.4z"/><path d="M19.6 14.8h-4.8v4.6"/>',t),arrowRight:t=>S('<path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5"/>',t),chevron:t=>S('<path d="m9 5.5 6.5 6.5L9 18.5"/>',t),plus:t=>S('<path d="M12 5.5v13M5.5 12h13"/>',t),refresh:t=>S('<path d="M20.5 11a8.5 8.5 0 1 0-.6 5"/><path d="M20.5 4.8V11h-6.2"/>',t),menu:t=>S('<path d="M4 7h16M4 12h16M4 17h16"/>',t),move:t=>S('<path d="M9 6.5 12 3.5l3 3M15 17.5 12 20.5l-3-3M6.5 9 3.5 12l3 3M17.5 9l3 3-3 3"/>',t),briefcase:t=>S('<rect x="2.8" y="7" width="18.4" height="13.5" rx="2"/><path d="M8.5 7V5.2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7"/><path d="M2.8 12.5h18.4"/>',t),file:t=>S('<path d="M14 2.8H7.2a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2V7.8z"/><path d="M14 2.8v5h4.8"/>',t),upload:t=>S('<path d="M21 15.5v3.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.2"/><path d="M7.5 8.5 12 4l4.5 4.5"/><path d="M12 4v12"/>',t),download:t=>S('<path d="M21 15.5v3.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.2"/><path d="M7.5 11.5 12 16l4.5-4.5"/><path d="M12 16V4"/>',t),search:t=>S('<circle cx="10.8" cy="10.8" r="7"/><path d="m20.5 20.5-4.7-4.7"/>',t),logout:t=>S('<path d="M9.5 20.5H5.4a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2h4.1"/><path d="m15.5 16.5 4.5-4.5-4.5-4.5"/><path d="M20 12H9.5"/>',t),shield:t=>S('<path d="M12 21.3s7.5-3.6 7.5-9.3V5.6L12 2.8 4.5 5.6v6.4c0 5.7 7.5 9.3 7.5 9.3z"/><path d="m9 12 2.2 2.2L15.4 10"/>',t),edit:t=>S('<path d="M16.5 3.9a2.1 2.1 0 0 1 3 3L8.2 18.2l-4 1 1-4z"/>',t),filter:t=>S('<path d="M3.5 5.5h17l-6.6 7.8v5.4l-3.8 2v-7.4z"/>',t),building:t=>S('<path d="M4 20.5V5.2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v15.3"/><path d="M15 10.5h3a2 2 0 0 1 2 2v8"/><path d="M2.6 20.5h18.8"/><path d="M7.5 7.5h4M7.5 11h4M7.5 14.5h4"/>',t),task:t=>S('<rect x="3.4" y="4.5" width="17.2" height="16" rx="2"/><path d="M8 3v3M16 3v3"/><path d="m8.6 13.2 2.2 2.2 4.6-4.6"/>',t),trend:t=>S('<path d="M3.5 16.5 9 11l4 4 7.5-7.5"/><path d="M14.5 7.5h6v6"/>',t)},Ws={Phone:l.phone,WhatsApp:l.whatsapp,Email:l.mail,Website:l.globe,Referral:l.users},Hs={enquiry:l.bell,call:l.phone,whatsapp:l.whatsapp,email:l.mail,visit:l.pin,quote:l.doc,stage:l.move,note:l.note,task:l.clock}});function Ot(t){let e=ct(t);if(e.level==="closed")return uo(t.stage);if(e.level==="clear")return`<span class="pill pill-quiet">${o(e.label)}</span>`;let n={overdue:l.alert(13),unbooked:l.alert(13),today:l.clock(13),soon:l.clock(13),held:l.clock(13)}[e.level];return`<span class="pill pill-${o(e.level)}">${n}${o(e.label)}</span>`}function yt(t,{text:e="",size:n="sm"}={}){if(!t)return"";let a=[];t.phone&&a.push(`<a class="btn-ghost btn-${n}" href="${o($t(t.phone))}">${l.phone(14)}<span>Call</span></a>`);let s=ra(t.whatsapp||t.phone,e);return s&&a.push(`<a class="btn-ghost btn-${n}" href="${o(s)}" target="_blank" rel="noopener">${l.whatsapp(14)}<span>WhatsApp</span></a>`),t.email&&a.push(`<a class="btn-ghost btn-${n}" href="${o(qt(t.email))}">${l.mail(14)}<span>Email</span></a>`),a.join("")}function da(t,{showStage:e=!0}={}){return`
    <li class="att">
      <a class="att-link" href="#/opportunity/${o(t.id)}">
        <span class="att-head">
          <span class="att-title">${o(t.title)}</span>
          ${Ot(t)}
          ${Mt(t.priority)}
        </span>
        <span class="att-meta">
          ${o(t.company_name||t.contact_name||"No company")} \xB7 ${o(t.ref)}
          ${(()=>{let n=tt(t);return n.amount==null?' \xB7 <span class="dim">not quoted yet</span>':` \xB7 <span class="num">${o(L(n.amount,n.currency))}</span>`})()}
          ${e?` \xB7 ${o(nt[t.stage]?.name||t.stage)}`:""}
        </span>
        <span class="att-action">
          ${t.next_action?`${l.arrowRight(14)}<span>${o(t.next_action)}</span>${t.next_action_due?`<span class="att-when">${o(j(t.next_action_due))}</span>`:""}`:`${l.alert(14)}<span>Nobody has booked a next action</span>`}
        </span>
      </a>
      <span class="att-owner">${E(t.owner_name?{full_name:t.owner_name,initials:t.owner_initials}:null,28)}</span>
    </li>`}var $,he,x,ca,fn,pt,uo,jt,mo,Vt,Qt,Mt,E,pa,ua,Gt,Ie,K=O(()=>{I();W();z();$=(t,e,{note:n="",action:a="",tight:s=!1,id:i=""}={})=>`
  <section class="card${s?" card-tight":""}"${i?` id="${o(i)}"`:""}>
    ${t?`<header class="card-head">
      <h2 class="card-title">${o(t)}</h2>
      ${n?`<p class="card-note">${o(n)}</p>`:""}
      ${a}
    </header>`:""}
    ${e}
  </section>`,he=({label:t,value:e,unit:n="",foot:a="",tone:s="",href:i=""})=>{let r=`
    <p class="stat-label">${o(t)}</p>
    <p class="stat-value num">${o(e)}${n?`<span class="stat-unit">${o(n)}</span>`:""}</p>
    ${a?`<p class="stat-foot">${a}</p>`:""}`;return i?`<a class="stat${s?" stat-"+s:""}" href="${o(i)}">${r}
         <span class="stat-go" aria-hidden="true">${l.arrowRight(15)}</span></a>`:`<div class="stat${s?" stat-"+s:""}">${r}</div>`},x=(t,e="",{tone:n="ok"}={})=>`
  <div class="empty">
    <span class="empty-mark empty-${o(n)}" aria-hidden="true">${n==="ok"?l.check(20):l.note(20)}</span>
    <p class="empty-text">${o(t)}</p>
    ${e?`<p class="empty-sub">${o(e)}</p>`:""}
  </div>`,ca=(t=3)=>`
  <div class="skel" role="status" aria-live="polite">
    <span class="sr-only">Loading\u2026</span>
    ${Array.from({length:t},()=>'<span class="skel-row"></span>').join("")}
  </div>`,fn=(t,{retry:e=!0}={})=>`
  <div class="err" role="alert">
    <span class="err-mark" aria-hidden="true">${l.alert(20)}</span>
    <p class="err-text">${o(t)}</p>
    ${e?'<button type="button" class="btn-ghost btn-sm" data-retry>Try again</button>':""}
  </div>`,pt=t=>`<div class="tbl-wrap">${t}</div>`;uo=t=>t==="won"?`<span class="pill pill-won">${l.check(13)}Won</span>`:t==="lost"?`<span class="pill pill-lost">${l.cross(13)}Lost</span>`:`<span class="pill pill-quiet">${o(nt[t]?.name||t)}</span>`,jt=t=>`<span class="src">${(l[mo[t]]||l.globe)(13)}${o(Lt[t]||t)}</span>`,mo={website:"globe",whatsapp:"whatsapp",phone:"phone",email:"mail",referral:"users",walk_in:"pin",other:"note"},Vt=t=>{let e=t==="accepted"?"won":t==="rejected"||t==="expired"||t==="superseded"?"lost":t==="draft"?"today":"quiet",n=t==="accepted"?l.check(13):t==="rejected"||t==="expired"||t==="superseded"?l.cross(13):l.doc(13);return`<span class="pill pill-${e}">${n}${o(Ce[t]||t)}</span>`},Qt=t=>`<span class="pill pill-${t==="complete"?"won":t==="cancelled"?"lost":t==="on_hold"?"today":"quiet"}">${o(Ft[t]||t)}</span>`,Mt=t=>t==="urgent"?`<span class="pill pill-overdue">${l.alert(13)}Urgent</span>`:t==="high"?'<span class="pill pill-today">High</span>':t==="low"?'<span class="pill pill-quiet">Low</span>':"",E=(t,e=26)=>t?`<span class="avatar" role="img" style="--s:${e}px" title="${o(t.full_name||"")}" aria-label="${o(t.full_name||"Assigned")}">${o(t.initials||ia(t.full_name))}</span>`:`<span class="avatar avatar-none" role="img" style="--s:${e}px" title="Unassigned" aria-label="Unassigned">?</span>`;pa=t=>`
  <li class="feed-row">
    <span class="feed-ic">${(l[ua[t.kind]]||l.note)(14)}</span>
    <span class="feed-body">
      ${t.opportunities?`<a class="feed-link" href="#/opportunity/${o(t.opportunities.id)}">${o(t.opportunities.title)}</a>`:""}
      <span class="feed-text">${o(t.body)}</span>
    </span>
    <span class="feed-when">${o(t.profiles?.initials||"\u2014")} \xB7 ${o(A(t.occurred_at))}</span>
  </li>`,ua={enquiry:"bell",note:"note",call:"phone",whatsapp:"whatsapp",email:"mail",meeting:"users",site_visit:"pin",quote:"doc",stage_change:"move",task:"clock",file:"file",won:"check",lost:"cross",system:"refresh",reply:"mail",on_hold:"clock"},Gt=t=>t.length?`
  <ol class="timeline">
    ${t.map(e=>`
      <li class="tl">
        <span class="tl-ic tl-${o(e.kind)}">${(l[ua[e.kind]]||l.note)(14)}</span>
        <span class="tl-body">
          <span class="tl-kind">${o(Le[e.kind]||e.kind)}</span>
          <span class="tl-text">${o(e.body)}</span>
          ${e.opportunities?`<a class="tl-ref" href="#/opportunity/${o(e.opportunities.id)}">${o(e.opportunities.ref)} \xB7 ${o(e.opportunities.title)}</a>`:""}
        </span>
        <span class="tl-when">
          <span class="tl-date num">${o(j(e.occurred_at))}</span>
          <span class="tl-rel">${o(A(e.occurred_at))}${e.profiles?.initials?" \xB7 "+o(e.profiles.initials):""}</span>
        </span>
      </li>`).join("")}
  </ol>`:x("Nothing logged yet.","Calls, visits and quotations appear here as they happen.",{tone:"quiet"}),Ie=t=>{if(!t)return'<span class="fu-date fu-none">\u2014</span><span class="fu-rel is-late">not booked</span>';let e=Pe(t);return`<span class="fu-date num">${o(j(t))}</span>
          <span class="fu-rel${e?" is-late":""}">${o(e||A(t))}</span>`}});function ho(t){let e={};for(let n of t.querySelectorAll("input, select, textarea"))n.name&&(e[n.name]=n.type==="checkbox"?n.checked:n.value.trim());return e}function fo(t,e,n){let a=t.querySelector(`[data-err-for="${e}"]`),s=t.querySelector("#"+CSS.escape(e));a&&(a.textContent=n||"",a.hidden=!n),s&&(s.classList.toggle("is-bad",!!n),n?s.setAttribute("aria-invalid","true"):s.removeAttribute("aria-invalid"))}function $o(t){t.querySelectorAll("[data-err-for]").forEach(e=>{e.textContent="",e.hidden=!0}),t.querySelectorAll(".is-bad").forEach(e=>{e.classList.remove("is-bad"),e.removeAttribute("aria-invalid")})}function b(t,e="ok"){zt||(zt=document.createElement("div"),zt.className="toasts",zt.setAttribute("aria-live","polite"),document.body.appendChild(zt));let n=document.createElement("p");n.className=`toast toast-${e}`,n.innerHTML=`${e==="bad"?l.alert(15):l.check(15)}<span>${o(t)}</span>`,zt.appendChild(n),setTimeout(()=>{n.classList.add("is-out"),setTimeout(()=>n.remove(),260)},e==="bad"?5200:2800)}function F({title:t,sub:e="",body:n,submitLabel:a="Save",onSubmit:s,width:i=520}){Be&&Be();let r=document.activeElement,c=document.createElement("div");c.className="modal",c.innerHTML=`
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="dlg-h" style="--w:${i}px">
      <form novalidate>
        <h2 class="modal-title display" id="dlg-h">${o(t)}</h2>
        ${e?`<p class="modal-sub">${o(e)}</p>`:""}
        <div class="modal-body">${n}</div>
        <p class="modal-err" role="alert" hidden></p>
        <div class="modal-foot">
          <button type="button" class="btn-ghost btn-sm" data-cancel>Cancel</button>
          <button type="submit" class="btn btn-sm" data-save>${o(a)}</button>
        </div>
      </form>
    </div>`,document.body.appendChild(c),document.body.classList.add("is-modal");let w=c.querySelector("form"),g=c.querySelector(".modal-err"),k=c.querySelector("[data-save]");(c.querySelector("input:not([type=hidden]), select, textarea")||k).focus();let rt=Q=>{if(Q.key==="Escape"){Q.preventDefault(),U();return}if(Q.key!=="Tab")return;let mt=[...c.querySelectorAll("input, select, textarea, button, [href]")].filter(Ut=>!Ut.disabled&&Ut.offsetParent!==null);if(!mt.length)return;let[X,Pt]=[mt[0],mt[mt.length-1]];Q.shiftKey&&document.activeElement===X?(Q.preventDefault(),Pt.focus()):!Q.shiftKey&&document.activeElement===Pt&&(Q.preventDefault(),X.focus())};function U(){document.removeEventListener("keydown",rt,!0),c.remove(),document.body.classList.remove("is-modal"),Be=null,r&&document.contains(r)&&r.focus()}return document.addEventListener("keydown",rt,!0),c.querySelector("[data-cancel]").addEventListener("click",U),c.addEventListener("mousedown",Q=>{Q.target===c&&U()}),w.addEventListener("submit",async Q=>{Q.preventDefault(),$o(c),g.hidden=!0,k.disabled=!0;let mt=k.textContent;k.textContent="Saving\u2026";try{await s(ho(w),c),U()}catch(X){X?.field?(fo(c,X.field,X.message),c.querySelector("#"+CSS.escape(X.field))?.focus()):(g.textContent=X?.message||"That could not be saved.",g.hidden=!1),k.disabled=!1,k.textContent=mt}}),Be=U,U}function P(t,...e){typeof t=="function"&&setTimeout(()=>{Promise.resolve(t(...e)).catch(n=>console.error("[kingson] refresh after save failed",n))},0)}var u,D,B,Kt,V,Rt,N,h,Zt,zt,Be,C,ut=O(()=>{I();z();u=(t,e,n,{hint:a="",wide:s=!1}={})=>`
  <div class="field${s?" field-wide":""}">
    <label for="${o(t)}">${o(e)}</label>
    ${n}
    ${a?`<p class="field-hint">${o(a)}</p>`:""}
    <p class="field-err" data-err-for="${o(t)}" hidden></p>
  </div>`,D=(t,e="",n="")=>`<input class="inp" id="${o(t)}" name="${o(t)}" type="text" value="${o(e)}" ${n}>`,B=(t,e="",n=3,a="")=>`<textarea class="inp" id="${o(t)}" name="${o(t)}" rows="${n}" ${a}>${o(e)}</textarea>`,Kt=(t,e="",n="")=>`<input class="inp" id="${o(t)}" name="${o(t)}" type="number" inputmode="decimal" value="${e??""}" ${n}>`,V=(t,e="",n="")=>`<input class="inp" id="${o(t)}" name="${o(t)}" type="date" value="${o(e)}" ${n}>`,Rt=(t,e="",n="")=>`<input class="inp" id="${o(t)}" name="${o(t)}" type="datetime-local" value="${o(e)}" ${n}>`,N=(t,e,n="",a="")=>`
  <select class="sel" id="${o(t)}" name="${o(t)}" ${a}>
    ${e.map(s=>{let[i,r]=Array.isArray(s)?s:[s,s];return`<option value="${o(i)}"${String(i)===String(n??"")?" selected":""}>${o(r)}</option>`}).join("")}
  </select>`;h=t=>t===""||t===void 0?null:t,Zt=t=>t===""||t===null||t===void 0?null:Number(t);zt=null;Be=null;C=(t,e)=>Object.assign(new Error(e),{field:t})});var ma={};Z(ma,{render:()=>go,sub:()=>bo,title:()=>yo});async function go(){let{metrics:t,open:e,liveQuotes:n,tasks:a,visits:s,recent:i}=await d.dashboard(),r=e.filter(lt),c=e.filter(Ne),w=e.filter(Wt),g=e.filter(m=>m.stage==="new"),k=e.filter(Oe),xt=t.won_count+t.lost_count,rt=xt?Math.round(t.won_count/xt*100):null,U=a.filter(m=>m.due_date&&q(m.due_date)<=0),Q=s.filter(m=>{let R=q(m.scheduled_at);return R!==null&&R>=0&&R<=7}),mt=`
    <div class="stats">
      ${he({label:"Open opportunities",value:String(t.open_count),foot:t.quoted_pipeline_count?`<span class="num">${o(at(t.quoted_pipeline))}</span> quoted and awaiting a decision`:'<span class="dim">No quotation out</span>',href:"#/pipeline"})}
      ${he({label:"Not quoted yet",value:String(t.unquoted_count),tone:t.unquoted_count?"warn":"",foot:t.unquoted_count?"Open, with no quotation recorded":t.open_count?"Every open job has a quotation":"No open jobs",href:"#/pipeline"})}
      ${he({label:"Follow-ups due",value:String(t.follow_ups_due_count),tone:t.overdue_count?"danger":"",foot:t.overdue_count?`${o(v(t.overdue_count,"overdue"))}${t.overdue_quoted_count?` \xB7 <span class="num">${o(at(t.overdue_quoted_value))}</span> quoted value overdue`:""}`:t.follow_ups_due_count?"Due today, none overdue":"Nothing past its date",href:"#/followups"})}
      ${he({label:"Quotes awaiting a decision",value:String(t.awaiting_decision_count),foot:t.quoted_pipeline_count?`<span class="num">${o(at(t.quoted_pipeline))}</span> out`:"None out at the moment",href:"#/quotes"})}
    </div>`,X=[...r,...w,...c,...g].filter((m,R,Dt)=>Dt.findIndex(en=>en.id===m.id)===R).sort((m,R)=>ct(R).sort-ct(m).sort).slice(0,12),Pt=$("Needs attention",X.length?`<ul class="att-list">${X.map(m=>da(m)).join("")}</ul>`:x("Nothing is overdue and nothing is unbooked.","Every open opportunity has a next action with a date on it."),{note:"Overdue, unbooked, due today or unanswered \u2014 in any stage",tight:!0}),Ut=$("Today and the week ahead",`
    <div class="two-up">
      <div>
        <p class="sub-h">${l.pin(14)} Site visits</p>
        ${Q.length?`<ul class="mini">${Q.slice(0,5).map(m=>`
          <li><a href="#/opportunity/${o(m.opportunities?.id||"")}">
            <span class="mini-main">${o(m.opportunities?.title||"Visit")}</span>
            <span class="mini-sub">${o(ot(m.scheduled_at))}${m.location?" \xB7 "+o(m.location):""}</span>
          </a><span class="mini-side">${E(m.profiles,24)}</span></li>`).join("")}</ul>`:'<p class="mini-none">No visits booked in the next seven days.</p>'}
      </div>
      <div>
        <p class="sub-h">${l.clock(14)} Calls and follow-ups due</p>
        ${U.length?`<ul class="mini">${U.slice(0,5).map(m=>`
          <li><a href="${m.opportunities?"#/opportunity/"+o(m.opportunities.id):"#/tasks"}">
            <span class="mini-main">${o(m.title)}</span>
            <span class="mini-sub${q(m.due_date)<0?" is-late":""}">${o(A(m.due_date))}${m.channel?" \xB7 "+o(m.channel):""}</span>
          </a><span class="mini-side">${E(m.profiles,24)}</span></li>`).join("")}</ul>`:'<p class="mini-none">Nothing due today.</p>'}
      </div>
    </div>`,{note:`${v(Q.length,"visit")} \xB7 ${v(U.length,"task")}`}),ve=ft.filter(m=>m.open).map(m=>{let R=e.filter(en=>en.stage===m.id),Dt=At(R);return{s:m,n:R.length,value:Dt.by.USD||0,label:Re(Dt.by)}}),Ye=Math.max(1,...ve.map(m=>m.value)),xe=$("Pipeline by stage",`
    <ul class="funnel">
      ${ve.map(m=>`
        <li class="funnel-row${m.n?"":" is-empty"}">
          <a class="funnel-label" href="#/pipeline">${o(m.s.name)}</a>
          <span class="funnel-track"><span class="funnel-bar" style="--w:${(m.value/Ye*100).toFixed(1)}%"></span></span>
          <span class="funnel-n num">${m.n||"\u2014"}</span>
          <span class="funnel-v num">${m.label?o(m.label):"\u2014"}</span>
        </li>`).join("")}
    </ul>
    <p class="funnel-key">Bar length is quoted value (USD). The number beside it is the count, quoted or not.</p>`,{note:"Open stages only"}),Xe=$("Decided",`
    <div class="won-lost">
      <div><p class="wl-n num">${t.won_count}</p><p class="wl-l">${l.check(13)} Won</p>
        <p class="wl-v num">${o(at(t.won_value))}</p></div>
      <div><p class="wl-n num">${t.lost_count}</p><p class="wl-l">${l.cross(13)} Lost</p>
        <p class="wl-v">&nbsp;</p></div>
      <div><p class="wl-n num">${rt===null?"\u2014":rt+"%"}</p><p class="wl-l">Win rate</p>
        <p class="wl-v">of ${xt} decided</p></div>
    </div>
    <p class="funnel-key">Won this month: <span class="num">${o(at(t.won_value_this_month,{empty:"nothing yet"}))}</span>${t.on_hold_count?` \xB7 ${o(v(t.on_hold_count,"job"))} on hold`:""}</p>`,{note:"Accepted values, as recorded when each job was won"}),tn=$("Quotations awaiting a decision",n.length?pt(`
    <table class="tbl">
      <thead><tr>
        <th scope="col">Quotation</th><th scope="col">Opportunity</th>
        <th scope="col" class="ta-r">Amount</th><th scope="col">Sent</th><th scope="col">Chase</th>
      </tr></thead>
      <tbody>
        ${n.map(m=>{let R=m.opportunities,Dt=R&&!R.next_action_due;return`<tr${Dt?' class="tr-risk"':""}>
            <td><a class="lnk" href="#/opportunity/${o(R?.id||"")}">${o(m.reference)}${m.version>1?` <span class="rev">rev ${m.version}</span>`:""}</a></td>
            <td><span class="td-main">${o(R?.title||"\u2014")}</span><span class="td-sub">${o(R?.companies?.name||"")}</span></td>
            <td class="ta-r num">${o(L(m.amount,m.currency))}</td>
            <td><span class="td-main num">${o(j(m.sent_on))}</span><span class="td-sub">${o(A(m.sent_on))}</span></td>
            <td>${Dt?`<span class="pill pill-overdue">${l.alert(13)}No chase booked</span>`:q(R?.next_action_due)<0?`<span class="pill pill-overdue">${l.alert(13)}${o(j(R?.next_action_due))}</span>`:`<span class="pill pill-quiet">${o(j(R?.next_action_due))}</span>`}</td>
          </tr>`}).join("")}
      </tbody>
    </table>`):x("No quotations are out."),{note:k.length?`${v(k.length,"quotation")} overdue for a follow-up`:"Every one has a follow-up booked"}),It={};for(let m of e)It[m.source]=(It[m.source]||0)+1;let y=$("Where enquiries arrive",Object.keys(It).length?`
    <ul class="srcs">
      ${Object.entries(It).sort((m,R)=>R[1]-m[1]).map(([m,R])=>`<li class="srcs-row">${jt(m)}<span class="srcs-n num">${R}</span></li>`).join("")}
    </ul>
    <p class="funnel-key">Open opportunities only. The website writes straight into this pipeline.</p>`:x("No open enquiries yet.","",{tone:"quiet"})),Ja=$("Recent activity",i.length?`<ul class="feed">${i.map(pa).join("")}</ul>`:x("Nothing logged yet.","",{tone:"quiet"}),{tight:!0});return`
    ${mt}
    <div class="grid grid-main">
      <div class="col-wide">${Pt}${Ut}${tn}</div>
      <div class="col-side">${xe}${Xe}${y}${Ja}</div>
    </div>`}function bo(){return`<span class="sub-quiet">${o(j(Y()))}</span>`}var yo,ha=O(()=>{H();W();I();K();z();yo="Dashboard"});async function fa(t=Y()){try{let e=await d.settings();return await d.addWorkingDays(t,e?.quote_followup_working_days??3)}catch{return""}}function $a({opp:t,quotes:e=[],onDone:n}){let a=(e.reduce((i,r)=>Math.max(i,r.version||0),0)||0)+1,s=e.find(i=>i.version===a-1);F({title:a>1?`Record revision ${a}`:"Record the quotation",sub:`${t.ref} \u2014 ${t.title}`,width:580,submitLabel:"Record quotation",body:`
      <div class="field-row">
        ${u("amount","Quoted amount",Kt("amount",s?.amount??"",'required min="0" step="0.01"'),{hint:"The figure on the quotation you are sending \u2014 not an estimate."})}
        ${u("currency","Currency",N("currency",wo,s?.currency||t.currency||"USD"))}
      </div>
      <div class="field-row">
        ${u("reference","Quotation number",D("reference","",`placeholder="Leave blank for Q-${o(String(t.ref).replace(/\D/g,""))}-${a}"`),{hint:"Only if your quotation already carries its own number."})}
        ${u("prepared_on","Date on the quotation",V("prepared_on",Y()))}
      </div>
      <div class="field-row">
        ${u("valid_until","Valid until",V("valid_until",""))}
        ${u("document_ref","Document / where it is filed",D("document_ref","",'placeholder="Q-2445-1.pdf in Quotes 2026"'))}
      </div>
      ${u("notes",a>1?"What changed in this revision":"Notes",B("notes","",2,a>1?'placeholder="Roof sheeting changed to IBR 0.47"':""),{wide:!0})}
      <p class="modal-message">Recorded as a draft. Use <strong>Mark as sent</strong> once it has
        actually gone to the customer \u2014 that is what starts the follow-up clock.</p>`,onSubmit:async i=>{let r=Zt(i.amount);if(r===null||Number.isNaN(r))throw C("amount","Enter the quoted amount.");if(r<0)throw C("amount","That cannot be negative.");let c=await d.recordQuote(t.id,{amount:r,currency:i.currency,preparedOn:h(i.prepared_on),validUntil:h(i.valid_until),notes:h(i.notes),reference:h(i.reference),documentRef:h(i.document_ref)});b(`Quotation ${c?.reference||""} recorded.`),P(n,c)}})}async function Fe({opp:t,quote:e,onDone:n}){let a=await fa(),s=Tt(new Date);F({title:`Mark ${e.reference} as sent`,sub:`${L(e.amount,e.currency)} \xB7 ${t.title}`,width:540,submitLabel:"Mark as sent",body:`
      <div class="field-row">
        ${u("sent_at","Sent",Rt("sent_at",s,"required"))}
        ${u("channel","How",N("channel",[["email","Email"],["whatsapp","WhatsApp"],["hand","By hand"],["meeting","At a meeting"],["other","Other"]],"email"))}
      </div>
      ${u("follow_up_on","Follow up on",V("follow_up_on",a,"required"),{hint:"Worked out from the working-day rule in Settings. Change it if the customer gave you a date."})}
      ${u("notes","Notes",B("notes","",2,'placeholder="Sent to Tendai and copied to accounts"'),{wide:!0})}
      ${_o}`,onSubmit:async i=>{if(!i.sent_at)throw C("sent_at","When did it go?");let r=$n(i.sent_at,s);if(r&&Date.parse(r)>Date.now()+5*6e4)throw C("sent_at","That is in the future.");await d.markQuoteSent(e.id,{sentAt:r,followUpOn:h(i.follow_up_on),channel:i.channel,notes:h(i.notes)}),b(`${e.reference} marked sent. Follow-up booked.`),P(n)}})}function We({opp:t,quote:e,onDone:n}){let a=e.status==="draft";F({title:`Quotation ${e.reference}`,sub:`${t?.title||""}${e.version>1?` \xB7 revision ${e.version}`:""}`,width:540,submitLabel:"Save",body:`
      <dl class="kv">
        <div><dt>Amount</dt><dd class="num">${o(L(e.amount,e.currency))}</dd></div>
        <div><dt>Prepared</dt><dd>${o(Ht(e.prepared_on))}</dd></div>
        <div><dt>Sent</dt><dd>${e.sent_at?o(new Date(e.sent_at).toLocaleString("en-GB",{timeZone:"Africa/Harare",dateStyle:"medium",timeStyle:"short"}))+(e.profiles?.full_name?" \xB7 "+o(e.profiles.full_name):""):"Not sent"}</dd></div>
        <div><dt>Follow up</dt><dd>${o(Ht(e.follow_up_on))}</dd></div>
      </dl>
      ${a?u("amount","Correct the amount",Kt("amount",e.amount,'min="0" step="0.01"'),{hint:"Only while it is a draft. Once sent, a change is a new revision."}):""}
      <div class="field-row">
        ${u("valid_until","Valid until",V("valid_until",e.valid_until||""))}
        ${u("document_ref","Document / where it is filed",D("document_ref",e.document_ref||""))}
      </div>
      ${u("notes","Notes",B("notes",e.notes||"",3),{wide:!0})}`,onSubmit:async s=>{let i={valid_until:h(s.valid_until),document_ref:h(s.document_ref),notes:h(s.notes)};if(a){let r=Zt(s.amount);if(r===null||Number.isNaN(r)||r<0)throw C("amount","Enter a valid amount.");i.amount=r}await d.updateQuote(e.id,i),b("Quotation saved."),P(n)}})}async function He({opp:t,onDone:e}){let n=await fa(),a=Tt(new Date);F({title:"Log a follow-up",sub:`${t.ref} \u2014 ${t.title}`,width:560,submitLabel:"Log follow-up",body:`
      <div class="field-row">
        ${u("channel","How",N("channel",cn,"phone"))}
        ${u("at","When",Rt("at",a))}
      </div>
      ${u("notes","What happened",B("notes","",3,'required placeholder="Spoke to Tendai. Board meets Thursday."'),{wide:!0})}
      <div class="field-row">
        ${u("next_action","Next action",D("next_action",t.next_action||"",'placeholder="Follow up quotation"'))}
        ${u("next_due","Next follow-up",V("next_due",n,"required"))}
      </div>
      <p class="modal-message">If the customer answered, use <strong>Customer replied</strong>
        instead \u2014 that stops the chase and puts the next move on us.</p>`,onSubmit:async s=>{if(!s.notes)throw C("notes","Say what happened.");if(!s.next_due)throw C("next_due","Give the next date.");await d.logFollowUp(t.id,{channel:s.channel,notes:s.notes,at:$n(s.at,a),nextAction:h(s.next_action),nextDue:s.next_due}),b("Follow-up logged."),P(e)}})}function ya({opp:t,onDone:e}){let n=Tt(new Date);F({title:"Customer replied",sub:`${t.ref} \u2014 ${t.title}`,width:520,submitLabel:"Record reply",body:`
      <div class="field-row">
        ${u("channel","How",N("channel",cn,"whatsapp"))}
        ${u("at","When",Rt("at",n))}
      </div>
      ${u("notes","What they said",B("notes","",3,'placeholder="Happy with the scope, asking about payment terms"'),{wide:!0})}
      <p class="modal-message">Recorded by hand \u2014 the CRM cannot see Kingson's inbox. The
        chase stops and the next action becomes "Respond to customer reply", due today.</p>`,onSubmit:async a=>{await d.customerReplied(t.id,{channel:a.channel,notes:h(a.notes),at:$n(a.at,n)}),b("Reply recorded."),P(e)}})}function yn({opp:t,onDone:e,onCancel:n}){let a=tt(t);F({title:"Mark as won",sub:`${t.ref} \u2014 ${t.title}`,width:500,submitLabel:"Mark won",body:`
      <div class="field-row">
        ${u("value",`Accepted value (${o(a.currency)})`,Kt("value",a.amount??"",'required min="0" step="0.01"'),{hint:a.amount!=null?"Prefilled from the latest quotation. Change it if the customer accepted a different figure.":"No quotation is recorded. Enter the value the customer accepted."})}
        ${u("on","Decided on",V("on",Y()))}
      </div>
      ${u("notes","Notes",B("notes","",2,'placeholder="Order number, deposit terms"'),{wide:!0})}
      <p class="modal-message">Follow-ups stop. The latest quotation is marked accepted.</p>`,onSubmit:async s=>{let i=Zt(s.value);if(i===null||Number.isNaN(i))throw C("value","Enter the accepted value.");if(i<0)throw C("value","That cannot be negative.");await d.decide(t.id,"won",{value:i,on:h(s.on),notes:h(s.notes)}),b("Marked won."),P(e)}}),wn(n)}function gn({opp:t,onDone:e,onCancel:n}){F({title:"Mark as lost",sub:`${t.ref} \u2014 ${t.title}`,width:500,submitLabel:"Mark lost",body:`
      <div class="field-row">
        ${u("reason","Why",N("reason",[["","Choose\u2026"],...Gn],""))}
        ${u("on","Decided on",V("on",Y()))}
      </div>
      ${u("notes","Notes",B("notes","",3,'placeholder="Competitor came in 14% lower"'),{wide:!0,hint:'Required for "Other". This is what somebody reads back in six months.'})}
      <p class="modal-message">Follow-ups stop and open tasks on this job are cancelled.</p>`,onSubmit:async a=>{if(!a.reason)throw C("reason","Choose a reason.");if(a.reason==="other"&&!a.notes)throw C("notes","Say why.");await d.decide(t.id,"lost",{reason:a.reason,on:h(a.on),notes:h(a.notes)}),b("Marked lost."),P(e)}}),wn(n)}function bn({opp:t,onDone:e,onCancel:n}){F({title:"Put on hold",sub:`${t.ref} \u2014 ${t.title}`,width:500,submitLabel:"Put on hold",body:`
      ${u("reason","Why",D("reason","",'required placeholder="Waiting for funding approval"'),{wide:!0})}
      ${u("review_on","Review on",V("review_on","","required"),{hint:"It comes back onto the follow-up list on this date."})}
      ${u("notes","Notes",B("notes","",2),{wide:!0})}
      <p class="modal-message">Everything on the record is kept. Nothing is chased until the review date.</p>`,onSubmit:async a=>{if(!a.reason)throw C("reason","Give a reason.");if(!a.review_on)throw C("review_on","Choose a review date.");if(a.review_on<Y())throw C("review_on","That date has passed.");await d.decide(t.id,"on_hold",{reason:a.reason,reviewOn:a.review_on,notes:h(a.notes)}),b("On hold."),P(e)}}),wn(n)}function Ve(t,{opp:e,onDone:n,onCancel:a}){return t==="won"?(yn({opp:e,onDone:n,onCancel:a}),!0):t==="lost"?(gn({opp:e,onDone:n,onCancel:a}),!0):t==="on_hold"?(bn({opp:e,onDone:n,onCancel:a}),!0):!1}function wn(t){if(typeof t!="function")return;let e=document.querySelector(".modal");if(!e)return;let n=new MutationObserver(()=>{document.body.contains(e)||(n.disconnect(),t())});n.observe(document.body,{childList:!0})}var wo,$n,_o,fe=O(()=>{H();W();I();ut();wo=["USD","ZWG","ZAR"];$n=(t,e)=>t===e?null:me(t),_o=`
  <p class="modal-message">The CRM does not send email. Send the quotation from your own
    mailbox or WhatsApp as usual, then record it here. The time, the value and your name are
    stamped on the record.</p>`});var ga={};Z(ga,{actions:()=>qo,mount:()=>So,render:()=>xo,sub:()=>To,title:()=>vo});async function xo(){let[t,e]=await Promise.all([d.openOpportunities(),d.opportunities("stage=in.(won,lost)&order=decided_at.desc&limit=40")]);Jt=[...t,...e];let n=Jt;return n.length?`
  <div class="board" role="list">
    ${ft.map(a=>{let s=n.filter(c=>c.stage===a.id),i=Re(At(s).by),r=s.filter(lt).length;return`
      <section class="col" data-group="${o(a.group)}" data-stage="${o(a.id)}" role="listitem">
        <header class="col-head">
          <span class="col-name">${o(a.name)}</span>
          <span class="col-n num">${s.length}</span>
          <span class="col-v num">${o(i)}</span>
          ${r?`<span class="col-alarm" title="${o(v(r,"overdue follow-up"))}">${l.alert(12)}${r}</span>`:""}
        </header>
        <div class="col-body" data-drop="${o(a.id)}">
          ${s.length?s.sort((c,w)=>ct(w).sort-ct(c).sort).map(ko).join(""):'<p class="col-empty">Nothing here</p>'}
        </div>
      </section>`}).join("")}
  </div>`:x("No opportunities yet.","An enquiry from the website appears here automatically. You can also add one by hand.",{tone:"quiet"})}function ko(t){let e=ct(t);return`
  <article class="deal${e.level==="overdue"||e.level==="unbooked"?" deal-alarm":""}" draggable="true" data-deal="${o(t.id)}">
    <a class="deal-hit" href="#/opportunity/${o(t.id)}">
      <span class="deal-co">${o(t.company_name||t.contact_name||"No company")}</span>
      <span class="deal-title">${o(t.title)}</span>
    </a>
    <div class="deal-meta">
      <span class="deal-value num">${(()=>{let a=tt(t);return a.amount==null?'<span class="dim">Not quoted yet</span>':o(L(a.amount,a.currency))+(a.kind==="draft"?' <span class="dim">draft</span>':"")})()}</span>
      ${jt(t.source)}
    </div>
    ${Number(t.live_quotes)?`<p class="deal-quote">${l.doc(12)}${o(v(Number(t.live_quotes),"quotation"))} out${t.last_quote_sent?" \xB7 "+o(A(t.last_quote_sent)):""}</p>`:""}
    <div class="deal-foot">
      ${Ot(t)}
      ${Mt(t.priority)}
      <span class="deal-right">
        ${E(t.owner_name?{full_name:t.owner_name,initials:t.owner_initials}:null,22)}
        <span class="deal-move">
          <label class="sr-only" for="mv-${o(t.id)}">Move ${o(t.title)} to another stage</label>
          <select class="deal-select" id="mv-${o(t.id)}" data-move="${o(t.id)}">
            ${ft.map(a=>`<option value="${o(a.id)}"${a.id===t.stage?" selected":""}>${o(a.short)}</option>`).join("")}
          </select>
          <span class="deal-move-ic" aria-hidden="true">${l.chevron(12)}</span>
        </span>
      </span>
    </div>
  </article>`}function So(t,e){async function n(s,i,r){let c=Jt.find(g=>g.id===s)||{id:s,title:"this opportunity",stage:r};if(c.stage===i)return;let w=t.querySelector(`[data-move="${CSS.escape(s)}"]`);if(!Ve(i,{opp:c,onDone:e,onCancel:()=>{w&&document.contains(w)&&r&&(w.value=r)}}))try{await d.setStage(s,i),b(`Moved to ${nt[i].name}.`),await e()}catch(g){b(g.message||"That move could not be saved.","bad");let k=t.querySelector(`[data-move="${CSS.escape(s)}"]`);k&&r&&(k.value=r)}}t.addEventListener("change",s=>{let i=s.target.closest("[data-move]");if(!i)return;let r=i.dataset.move,c=Jt.find(w=>w.id===r)?.stage;n(r,i.value,c)});let a=null;t.addEventListener("dragstart",s=>{let i=s.target.closest("[data-deal]");if(i){a=i.dataset.deal,i.classList.add("is-dragging"),s.dataTransfer.effectAllowed="move";try{s.dataTransfer.setData("text/plain",a)}catch{}}}),t.addEventListener("dragend",s=>{s.target.closest("[data-deal]")?.classList.remove("is-dragging"),t.querySelectorAll(".is-over").forEach(i=>i.classList.remove("is-over")),a=null}),t.addEventListener("dragover",s=>{let i=s.target.closest("[data-drop]");!i||!a||(s.preventDefault(),s.dataTransfer.dropEffect="move",i.classList.contains("is-over")||(t.querySelectorAll(".is-over").forEach(r=>r.classList.remove("is-over")),i.classList.add("is-over")))}),t.addEventListener("drop",s=>{let i=s.target.closest("[data-drop]");if(!i||!a)return;s.preventDefault();let r=a;a=null,n(r,i.dataset.drop,Jt.find(c=>c.id===r)?.stage)})}function To(){let t=Jt.filter(n=>nt[n.stage]?.open),e=At(t);return`${o(v(t.length,"open opportunity","open opportunities"))} \xB7 <span class="num">${o(at(e.by,{empty:"nothing quoted"}))}</span>${e.unvalued?` \xB7 ${e.unvalued} not quoted yet`:""}`}var vo,Jt,qo,ba=O(()=>{H();W();I();K();z();ut();fe();vo="Pipeline",Jt=[];qo=()=>`<button type="button" class="btn btn-sm" data-new-opp>${l.plus(14)}<span>New opportunity</span></button>`});var wa={};Z(wa,{mount:()=>Co,render:()=>Do,sub:()=>Lo,title:()=>Eo});function Qe(t){let e=At(t);return e.valued?at(e.by)+" quoted"+(e.unvalued?` \xB7 ${e.unvalued} unquoted`:""):t.length?"not quoted yet":""}async function Do(t,{me:e}){Et=await d.openOpportunities();let n=Et.filter(lt).sort((c,w)=>q(c.next_action_due)-q(w.next_action_due)),a=Et.filter(Wt).sort((c,w)=>new Date(c.created_at)-new Date(w.created_at)),s=Et.filter(Ne),i=Et.filter(c=>{let w=q(c.next_action_due);return w!==null&&w>0&&w<=14}).sort((c,w)=>q(c.next_action_due)-q(w.next_action_due));return`
    ${`
    <div class="fu-summary">
      <span class="fu-sum fu-sum-danger">
        ${l.alert(16)}<b class="num">${n.length}</b><span>overdue</span>
        <em class="num">${o(Qe(n))}</em>
      </span>
      <span class="fu-sum${a.length?" fu-sum-danger":""}">
        ${l.alert(16)}<b class="num">${a.length}</b><span>nothing booked</span>
        <em class="num">${o(Qe(a))}</em>
      </span>
      <span class="fu-sum">
        ${l.clock(16)}<b class="num">${s.length}</b><span>due today</span>
        <em class="num">${o(Qe(s))}</em>
      </span>
      <span class="fu-sum">
        ${l.calendar(16)}<b class="num">${i.length}</b><span>next 14 days</span>
        <em class="num">${o(Qe(i))}</em>
      </span>
    </div>`}
    ${Ge("Overdue",n,"Past the date somebody committed to. Every one of these is a customer waiting.")}
    ${Ge("Open, with nothing booked",a,"These appear on no list and are on nobody\u2019s day. This is where enquiries are lost.")}
    ${Ge("Due today",s,"Booked for today.")}
    ${Ge("Next fourteen days",i,"Booked and not yet due.")}`}function Ge(t,e,n){return e.length?$(t,`
    <ul class="fu-list">
      ${e.map(a=>`
        <li class="fu">
          <span class="fu-when">${Ie(a.next_action_due)}</span>
          <a class="fu-main" href="#/opportunity/${o(a.id)}">
            <span class="fu-title">${o(a.title)}</span>
            <span class="fu-sub">${o(a.company_name||a.contact_name||"\u2014")} \xB7 ${o(a.ref)}${(()=>{let s=tt(a);return s.amount==null?" \xB7 not quoted yet":` \xB7 <span class="num">${o(L(s.amount,s.currency))}</span>`})()}</span>
            <span class="fu-action">${a.next_action?`${l.arrowRight(13)}${o(a.next_action)}`:`${l.alert(13)}No next action recorded`}</span>
            ${Number(a.live_quotes)?`<span class="fu-quote">${l.doc(12)}${o(v(Number(a.live_quotes),"quotation"))} out${a.last_quote_sent?" \xB7 "+o(A(a.last_quote_sent)):""}</span>`:""}
          </a>
          <span class="fu-stage">${Ot(a)}</span>
          <span class="fu-owner">${E(a.owner_name?{full_name:a.owner_name,initials:a.owner_initials}:null,26)}</span>
          <span class="fu-do">
            ${yt({phone:a.contact_phone,whatsapp:a.contact_whatsapp,email:a.contact_email},{text:`Good day, Kingson Engineering here regarding ${a.title}.`,size:"xs"})}
            <button type="button" class="btn-ghost btn-xs" data-chase="${o(a.id)}">${l.check(13)}<span>Log follow-up</span></button>
          </span>
        </li>`).join("")}
    </ul>`,{note:n,tight:!0}):$(t,x(t==="Overdue"||t.startsWith("Open,")?"Nothing in this group. Good.":"Nothing booked in this window."),{note:n,tight:!0})}function Co(t,e){t.addEventListener("click",n=>{let a=n.target.closest("[data-chase]");if(!a)return;let s=Et.find(i=>i.id===a.dataset.chase);s&&He({opp:s,onDone:e})})}function Lo(){let t=Et.filter(lt).length,e=Et.filter(Wt).length,n=[];return t&&n.push(`${t} overdue`),e&&n.push(`${e} with nothing booked`),n.length?`<span class="sub-alarm">${l.alert(14)}${o(n.join(" \xB7 "))}</span>`:"Nothing is late"}var Eo,Et,_a=O(()=>{H();W();I();K();z();ut();fe();Eo="Follow-ups";Et=[]});var ze={};Z(ze,{bookFollowUp:()=>kn,contactDialog:()=>Sn,convertDialog:()=>Tn,logActivity:()=>xn,newOpportunity:()=>vn,projectDialog:()=>qn,taskDialog:()=>ye,visitDialog:()=>Yt});async function vn({me:t,contact:e=null,onDone:n}){let a=await d.profiles();F({title:"New opportunity",sub:e?`For ${e.full_name}`:"A job somebody has asked about",width:620,submitLabel:"Create",body:`
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
        ${u("service","Service",N("service",["","Structural steelwork","Roof steelwork and trusses","Fiber laser cutting","Balustrades and gates","Stainless fabrication","Mobile cranage","Other"]))}
        ${u("source","How did it come in?",N("source",De.map(s=>[s,Lt[s]]),"phone"))}
      </div>
      ${u("location","Site",D("location","",'placeholder="Msasa, Harare"'),{wide:!0})}
      <div class="field-row">
        ${u("owner_id","Owner",N("owner_id",$e(a),t?.id||""))}
        ${u("priority","Priority",N("priority",ue.map(s=>[s,_n(s)]),"normal"))}
      </div>
      <div class="field-row">
        ${u("next_action","Next action",D("next_action","Call and qualify the enquiry","required"))}
        ${u("next_action_due","Due",V("next_action_due",Ae(),"required"))}
      </div>
      ${u("description","What do they want?",B("description","",3),{wide:!0})}`,onSubmit:async s=>{if(!s.title)throw C("title","Give the job a name.");if(!e&&!s.contact_name)throw C("contact_name","Who is asking?");if(!s.phone&&!s.email&&!e)throw C("phone","A phone number or an email address is needed.");let i=e?.id||null,r=null;s.company&&(r=(await d.findOrCreateCompany(s.company))?.id||null),i?r&&await d.updateContact(i,{company_id:r}):i=(await d.createContact({full_name:s.contact_name,company_id:r,email:h(s.email)&&s.email.toLowerCase(),phone:h(s.phone),whatsapp:h(s.phone),preferred_channel:s.email?"Email":"Phone"})).id;let c=await d.createOpportunity({title:s.title,company_id:r,contact_id:i,owner_id:h(s.owner_id),stage:"new",priority:s.priority,source:s.source,service:h(s.service),description:h(s.description),location:h(s.location),next_action:s.next_action,next_action_due:h(s.next_action_due)});await d.logActivity({opportunity_id:c.id,contact_id:i,kind:"enquiry",body:`Enquiry logged by hand (${Lt[s.source]||s.source}).`+(s.description?" \u2014 "+s.description:""),actor_id:t?.id||null}),b(`${c.ref} created.`),n?P(n,c):location.hash=`#/opportunity/${c.id}`}})}function xn({opportunityId:t,contactId:e,me:n,onDone:a}){F({title:"Log an interaction",sub:"Goes on the timeline exactly as written",width:520,submitLabel:"Log it",body:`
      ${u("kind","What happened?",N("kind",Kn.map(s=>[s,Le[s]]),"call"))}
      ${u("body","Notes",B("body","",4,'required placeholder="Spoke to Tendai. Wants the quotation by Friday."'),{wide:!0})}
      ${u("occurred_at","When",Rt("occurred_at",Tt(new Date)),{hint:"Change this if you are catching up on something from earlier."})}`,onSubmit:async s=>{if(!s.body)throw C("body","Write what happened.");await d.logActivity({opportunity_id:t||null,contact_id:e||null,kind:s.kind,body:s.body,actor_id:n?.id||null,occurred_at:me(s.occurred_at)||new Date().toISOString()}),b("Logged."),P(a)}})}async function kn({opp:t,me:e,onDone:n}){let a=await d.profiles();F({title:t.next_action_due?"Change the next action":"Book the next action",sub:"Every open opportunity should have one. This is what puts it on the follow-up list.",width:540,submitLabel:"Save",body:`
      ${u("next_action","What needs to happen",D("next_action",t.next_action||"",'required placeholder="Chase the quotation"'),{wide:!0})}
      <div class="field-row">
        ${u("next_action_due","When",V("next_action_due",St(t.next_action_due)||Ae(),"required"))}
        ${u("owner_id","Owner",N("owner_id",$e(a),t.owner_id||e?.id||""))}
      </div>
      ${u("channel","How",N("channel",["Phone","WhatsApp","Email","Site visit","In person"],"Phone"))}
      ${u("also_task","Also add it to the task list",'<label class="check"><input type="checkbox" id="also_task" name="also_task" checked> <span>Create a task as well</span></label>',{wide:!0})}`,onSubmit:async s=>{if(!s.next_action)throw C("next_action","Say what needs to happen.");if(!s.next_action_due)throw C("next_action_due","Give it a date.");await d.updateOpportunity(t.id,{next_action:s.next_action,next_action_due:s.next_action_due,owner_id:h(s.owner_id)}),s.also_task&&await d.createTask({title:s.next_action,opportunity_id:t.id,contact_id:t.contact_id,owner_id:h(s.owner_id),due_date:s.next_action_due,channel:s.channel,priority:t.priority}),await d.logActivity({opportunity_id:t.id,contact_id:t.contact_id,kind:"task",body:`Next action booked for ${s.next_action_due}: ${s.next_action} (${s.channel})`,actor_id:e?.id||null}),b("Booked."),P(n)}})}async function Yt({opp:t,visit:e=null,me:n,onDone:a}){let s=await d.profiles(),i=!!e;F({title:i?"Site visit":"Book a site visit",sub:t?.title||"",width:560,submitLabel:i?"Save":"Book",body:`
      <div class="field-row">
        ${u("scheduled_at","When",Rt("scheduled_at",Tt(e?.scheduled_at)||Tt(new Date(Date.now()+864e5)),"required"))}
        ${u("owner_id","Who is going",N("owner_id",$e(s),e?.owner_id||n?.id||""))}
      </div>
      ${u("location","Where",D("location",e?.location||t?.location||"",'placeholder="Msasa, Harare"'),{wide:!0})}
      ${u("purpose","Purpose",D("purpose",e?.purpose||"Measure up and assess access",""),{wide:!0})}
      ${i?`
        ${u("status","Status",N("status",["scheduled","completed","cancelled"].map(r=>[r,_n(r)]),e.status))}
        ${u("outcome","Outcome",B("outcome",e.outcome||"",3,'placeholder="Existing purlins sound. Access good from the north gate."'),{wide:!0})}`:""}
      ${u("notes","Notes",B("notes",e?.notes||"",2),{wide:!0})}`,onSubmit:async r=>{if(!r.scheduled_at)throw C("scheduled_at","Give a date and time.");let c={scheduled_at:me(r.scheduled_at),owner_id:h(r.owner_id),location:h(r.location),purpose:h(r.purpose),notes:h(r.notes)};if(i)c.status=r.status,c.outcome=h(r.outcome),await d.updateVisit(e.id,c);else if(await d.createVisit({...c,opportunity_id:t.id,status:"scheduled"}),["new","contacted"].includes(t.stage))try{await d.updateOpportunity(t.id,{stage:"requirements"})}catch(w){b(`Visit booked. The stage was not moved: ${w.message}`,"bad"),P(a);return}b(i?"Visit saved.":"Visit booked."),P(a)}})}async function ye({task:t=null,opp:e=null,me:n,onDone:a}){let s=await d.profiles(),i=!!t;F({title:i?"Task":"New task",sub:e?.title||t?.opportunities?.title||"",width:520,submitLabel:i?"Save":"Create",body:`
      ${u("title","What needs doing",D("title",t?.title||"","required"),{wide:!0})}
      <div class="field-row">
        ${u("due_date","Due",V("due_date",St(t?.due_date)||Ae()))}
        ${u("owner_id","Owner",N("owner_id",$e(s),t?.owner_id||n?.id||""))}
      </div>
      <div class="field-row">
        ${u("priority","Priority",N("priority",ue.map(r=>[r,_n(r)]),t?.priority||"normal"))}
        ${u("channel","How",N("channel",["","Phone","WhatsApp","Email","Site visit","In person"],t?.channel||""))}
      </div>
      ${u("notes","Notes",B("notes",t?.notes||"",2),{wide:!0})}`,onSubmit:async r=>{if(!r.title)throw C("title","Say what needs doing.");let c={title:r.title,due_date:h(r.due_date),owner_id:h(r.owner_id),priority:r.priority,channel:h(r.channel),notes:h(r.notes)};i?await d.updateTask(t.id,c):await d.createTask({...c,opportunity_id:e?.id||null,contact_id:e?.contact_id||null}),b(i?"Task saved.":"Task created."),P(a)}})}function Sn({contact:t=null,onDone:e}){let n=!!t;F({title:n?"Edit contact":"New contact",width:560,submitLabel:n?"Save":"Create",body:`
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
      ${u("preferred_channel","Prefers",N("preferred_channel",["","Phone","WhatsApp","Email"],t?.preferred_channel||""))}
      ${u("notes","Notes",B("notes",t?.notes||"",2),{wide:!0})}`,onSubmit:async a=>{if(!a.full_name)throw C("full_name","A name is needed.");if(!a.phone&&!a.whatsapp&&!a.email)throw C("phone","A phone number, a WhatsApp number or an email address is needed.");let s=a.company&&(await d.findOrCreateCompany(a.company))?.id||null,i={full_name:a.full_name,job_title:h(a.job_title),phone:h(a.phone),whatsapp:h(a.whatsapp),email:h(a.email)&&a.email.toLowerCase(),preferred_channel:h(a.preferred_channel),notes:h(a.notes)};s&&(i.company_id=s);let r=n?await d.updateContact(t.id,i):await d.createContact(i);b(n?"Contact saved.":"Contact created."),P(e,r)}})}function Tn({opp:t,onDone:e}){F({title:"Open a project",sub:`${t.ref} \u2014 ${t.title}`,width:520,submitLabel:"Open project",body:`
      ${u("name","Project name",D("name",t.title,"required"),{wide:!0})}
      <div class="field-row">
        ${u("start_date","Start",V("start_date",Y()))}
        ${u("target_date","Target completion",V("target_date",Ee(Y(),56)))}
      </div>
      <p class="modal-message">The client, contact, value and description come across from the
        opportunity. The opportunity stays on record and links to the project.</p>`,onSubmit:async n=>{let a=await d.convertToProject(t.id,{name:n.name,startDate:h(n.start_date),targetDate:h(n.target_date)});b("Project opened."),e?P(e,a):location.hash=`#/project/${a}`}})}async function qn({project:t,me:e,onDone:n}){let a=await d.profiles();F({title:"Edit project",sub:t.name,width:560,submitLabel:"Save",body:`
      ${u("name","Name",D("name",t.name,"required"),{wide:!0})}
      <div class="field-row">
        ${u("status","Status",N("status",zn.map(s=>[s,Ft[s]]),t.status))}
        ${u("owner_id","Responsible",N("owner_id",$e(a),t.owner_id||""))}
      </div>
      <div class="field-row">
        ${u("start_date","Start",V("start_date",St(t.start_date)))}
        ${u("target_date","Target",V("target_date",St(t.target_date)))}
      </div>
      <div class="field-row">
        ${u("value","Value (USD)",Kt("value",t.value??"",'min="0" step="100"'))}
        ${u("completed_on","Completed",V("completed_on",St(t.completed_on)))}
      </div>
      ${u("description","Description",B("description",t.description||"",3),{wide:!0})}
      ${u("notes","Notes",B("notes",t.notes||"",2),{wide:!0})}`,onSubmit:async s=>{if(!s.name)throw C("name","A project needs a name.");await d.updateProject(t.id,{name:s.name,status:s.status,owner_id:h(s.owner_id),start_date:h(s.start_date),target_date:h(s.target_date),completed_on:h(s.completed_on),value:Zt(s.value),description:h(s.description),notes:h(s.notes)}),b("Project saved."),P(n)}})}var _n,$e,gt=O(()=>{H();W();I();ut();_n=t=>t.charAt(0).toUpperCase()+t.slice(1),$e=(t,e=!0)=>(e?[["","Unassigned"]]:[]).concat(t.map(n=>[n.id,n.full_name]))});var ka={};Z(ka,{actions:()=>Ro,mount:()=>jo,render:()=>No,sub:()=>Mo,title:()=>Ao});async function No(t,{me:e}){return[Ke,va]=await Promise.all([d.tasks(),d.profiles()]),xa(e)}function xa(t){let e=Ke.filter(s=>(st.status==="all"||s.status===st.status)&&(st.owner==="all"||(st.owner==="mine"?s.owner_id===t?.id:s.owner_id===st.owner))),n=`
    <div class="filters">
      <label class="sr-only" for="f-status">Status</label>
      <select class="sel sel-inline" id="f-status" data-f="status">
        ${[["open","Open"],["done","Completed"],["all","All"]].map(([s,i])=>`<option value="${s}"${st.status===s?" selected":""}>${i}</option>`).join("")}
      </select>
      <label class="sr-only" for="f-owner">Owner</label>
      <select class="sel sel-inline" id="f-owner" data-f="owner">
        <option value="all"${st.owner==="all"?" selected":""}>Everyone</option>
        <option value="mine"${st.owner==="mine"?" selected":""}>Mine</option>
        ${va.map(s=>`<option value="${o(s.id)}"${st.owner===s.id?" selected":""}>${o(s.full_name)}</option>`).join("")}
      </select>
      <span class="filters-n">${o(v(e.length,"task"))}</span>
    </div>`,a=e.length?`
    <ul class="fu-list">
      ${e.sort(Oo).map(s=>`
        <li class="fu${s.status==="done"?" is-done":""}">
          <span class="fu-when">${Ie(s.due_date)}</span>
          <div class="fu-main">
            <span class="fu-title">${o(s.title)}</span>
            <span class="fu-sub">
              ${s.opportunities?`<a class="lnk" href="#/opportunity/${o(s.opportunities.id)}">${o(s.opportunities.ref)} \xB7 ${o(s.opportunities.title)}</a>`:'<span class="dim">Not linked to an opportunity</span>'}
              ${s.channel?" \xB7 "+o(s.channel):""}
            </span>
            ${s.notes?`<span class="fu-action">${o(s.notes)}</span>`:""}
          </div>
          <span class="fu-stage">${Mt(s.priority)}</span>
          <span class="fu-owner">${E(s.profiles,26)}</span>
          <span class="fu-do">
            <button type="button" class="btn-ghost btn-xs" data-edit="${o(s.id)}">${l.edit(13)}<span>Edit</span></button>
            ${s.status==="open"?`<button type="button" class="btn-ghost btn-xs" data-done="${o(s.id)}">${l.check(13)}<span>Done</span></button>`:`<button type="button" class="btn-ghost btn-xs" data-reopen="${o(s.id)}">${l.refresh(13)}<span>Reopen</span></button>`}
          </span>
        </li>`).join("")}
    </ul>`:x(st.status==="open"?"Nothing outstanding.":"No tasks match that filter.",st.status==="open"?"Every task on this filter is done.":"",{tone:"ok"});return n+$("",a,{tight:!0})}function jo(t,e,{me:n}){t.addEventListener("change",a=>{let s=a.target.closest("[data-f]");if(!s)return;st[s.dataset.f]=s.value;let i=document.getElementById("view");i.innerHTML=xa(n)}),t.addEventListener("click",async a=>{let s=a.target.closest("[data-done]"),i=a.target.closest("[data-reopen]"),r=a.target.closest("[data-edit]");try{if(s)return await d.completeTask(s.dataset.done),b("Completed."),e();if(i)return await d.updateTask(i.dataset.reopen,{status:"open"}),b("Reopened."),e();if(r){let c=Ke.find(w=>w.id===r.dataset.edit);if(c)return ye({task:c,me:n,onDone:e})}}catch(c){b(c.message||"That could not be saved.","bad")}})}function Mo(){let t=Ke.filter(n=>n.status==="open"),e=t.filter(n=>n.due_date&&q(n.due_date)<0).length;return e?`<span class="sub-alarm">${l.alert(14)}${o(v(e,"task"))} overdue</span>`:`${o(v(t.length,"open task"))}`}var Ao,Ke,st,va,Oo,Ro,Sa=O(()=>{H();W();I();K();z();ut();gt();Ao="Tasks",Ke=[],st={status:"open",owner:"all"},va=[];Oo=(t,e)=>t.due_date?e.due_date?t.due_date<e.due_date?-1:t.due_date>e.due_date?1:0:-1:1;Ro=()=>`<button type="button" class="btn btn-sm" data-new-task-global>${l.plus(14)}<span>New task</span></button>`});var qa={};Z(qa,{actions:()=>Fo,mount:()=>Io,render:()=>Uo,sub:()=>Bo,title:()=>Po});async function Uo(){return Xt=await d.contacts(),`
    <div class="filters">
      <div class="search">
        ${l.search(15)}
        <label class="sr-only" for="c-search">Search contacts</label>
        <input class="inp" id="c-search" type="search" placeholder="Name, company, phone or email"
               value="${o(En)}" autocomplete="off">
      </div>
      <span class="filters-n" data-count>${o(v(Xt.length,"contact"))}</span>
    </div>
    <div data-list>${Ta(Xt)}</div>`}function Ta(t){return t.length?$("",pt(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Name</th><th scope="col">Company</th>
        <th scope="col">Phone</th><th scope="col">Email</th><th scope="col"></th>
      </tr></thead>
      <tbody>
        ${t.map(e=>`<tr>
          <td><a class="lnk lnk-strong" href="#/contact/${o(e.id)}">
            ${E({full_name:e.full_name},24)}<span>${o(e.full_name)}</span></a>
            ${e.job_title?`<span class="td-sub">${o(e.job_title)}</span>`:""}</td>
          <td>${o(e.companies?.name||"\u2014")}</td>
          <td class="num">${e.phone?`<a class="lnk" href="${o($t(e.phone))}">${o(e.phone)}</a>`:"\u2014"}</td>
          <td>${o(e.email||"\u2014")}</td>
          <td class="ta-r">${yt(e,{size:"xs"})}</td>
        </tr>`).join("")}
      </tbody>
    </table>`),{tight:!0}):$("",x("No contacts match that.","Try part of a name, a company or a number.",{tone:"quiet"}),{tight:!0})}function Io(t){let e=t.querySelector("#c-search"),n=t.querySelector("[data-list]"),a=t.querySelector("[data-count]"),s=null;e?.addEventListener("input",()=>{En=e.value.trim(),clearTimeout(s),s=setTimeout(()=>{let i=En.toLowerCase(),r=i?Xt.filter(c=>[c.full_name,c.companies?.name,c.phone,c.whatsapp,c.email,c.job_title].some(w=>String(w||"").toLowerCase().includes(i))):Xt;n.innerHTML=Ta(r),a.textContent=v(r.length,"contact")},120)})}var Po,Xt,En,Bo,Fo,Ea=O(()=>{H();I();K();z();gt();Po="Contacts",Xt=[],En="";Bo=()=>v(Xt.length,"contact"),Fo=()=>`<button type="button" class="btn btn-sm" data-new-contact>${l.plus(14)}<span>New contact</span></button>`});function ee(t,e,n,a){t.addEventListener("change",async s=>{let i=s.target.closest("[data-upload]");if(!i||!i.files?.length)return;let r=i.files[0];if(i.value="",r.size>Wo){b(`${r.name} is ${Da(r.size)}. The limit is 25 MB \u2014 send larger drawing sets by transfer link.`,"bad");return}let c=t.querySelector(".file-pick span"),w=c?.textContent;c&&(c.textContent="Uploading\u2026");try{let g=await d.uploadFile(r,e,n?.id);await d.logActivity({opportunity_id:e.opportunity_id||null,project_id:e.project_id||null,contact_id:e.contact_id||null,kind:"file",body:`File added: ${r.name}`,actor_id:n?.id||null}),b("Uploaded."),P(a)}catch(g){b(g.message||"That file could not be uploaded.","bad"),c&&(c.textContent=w)}}),t.addEventListener("click",async s=>{let i=s.target.closest("[data-file]");if(!i)return;let r=i.dataset.name||"file",c=i.parentElement?.querySelector(".mini-side"),w=c?.innerHTML;c&&(c.textContent="\u2026");try{let g=await d.downloadUrl(i.dataset.file),k=await fetch(g);if(!k.ok)throw new Error(`That file could not be fetched (${k.status}).`);let xt=await k.blob(),rt=URL.createObjectURL(xt),U=document.createElement("a");U.href=rt,U.download=r,U.rel="noopener",document.body.appendChild(U),U.click(),U.remove(),setTimeout(()=>URL.revokeObjectURL(rt),3e4)}catch(g){b(g.message||"That file could not be opened.","bad")}finally{c&&w!==void 0&&(c.innerHTML=w)}})}var Wo,Da,te,Ze=O(()=>{H();I();K();z();ut();Wo=25*1024*1024,Da=t=>!t&&t!==0?"":t>=1048576?(t/1048576).toFixed(1)+" MB":t>=1024?Math.round(t/1024)+" KB":t+" B",te=t=>$("Files",t.length?`
  <ul class="mini files">
    ${t.map(e=>`<li>
      <button type="button" class="mini-btn" data-file="${o(e.path)}" data-name="${o(e.name)}">
        <span class="mini-main">${l.file(13)}${o(e.name)}</span>
        <span class="mini-sub">${o(Da(e.size_bytes))} \xB7 ${o(j(e.created_at))}${e.profiles?.initials?" \xB7 "+o(e.profiles.initials):""}</span>
      </button>
      <span class="mini-side">${l.download(15)}</span>
    </li>`).join("")}
  </ul>`:x("No files yet.","Drawings, BOQs and quotation PDFs go here.",{tone:"quiet"}),{tight:!0,action:`<label class="btn-ghost btn-xs file-pick">
      ${l.upload(13)}<span>Upload</span>
      <input type="file" data-upload hidden
             accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.dwg,.dxf,.xlsx,.xls,.docx,.doc,.zip,.csv,.txt">
    </label>`})});var Ca={};Z(Ca,{mount:()=>Qo,render:()=>Vo,sub:()=>Go,title:()=>Ho});async function Vo(t,{me:e}){if(T=await d.contact(t),!T)return x("That contact no longer exists.","",{tone:"quiet"});let[n,a,s]=await Promise.all([d.opportunities(`contact_id=eq.${t}`),d.activityForContact(t),d.filesFor("contact_id",t)]),i=n.length?await d.quotes(`opportunity_id=in.(${n.map(g=>g.id).join(",")})`):[],r=$("Details",`
    <div class="contact">
      ${E({full_name:T.full_name},40)}
      <div class="contact-body">
        <p class="contact-name">${o(T.full_name)}</p>
        ${T.job_title?`<p class="contact-role">${o(T.job_title)}</p>`:""}
        ${T.companies?`<p class="contact-role">${o(T.companies.name)}${T.companies.town?" \xB7 "+o(T.companies.town):""}</p>`:""}
        <div class="contact-lines">
          ${T.phone?`<a class="lnk" href="${o($t(T.phone))}">${l.phone(13)}${o(T.phone)}</a>`:""}
          ${T.whatsapp&&T.whatsapp!==T.phone?`<span class="lnk-plain">${l.whatsapp(13)}${o(T.whatsapp)}</span>`:""}
          ${T.email?`<a class="lnk" href="${o(qt(T.email))}">${l.mail(13)}${o(T.email)}</a>`:""}
        </div>
        ${T.preferred_channel?`<p class="contact-pref">Prefers ${o(T.preferred_channel)}</p>`:""}
      </div>
    </div>
    <div class="contact-acts">${yt(T,{text:`Good day ${T.full_name.split(" ")[0]}, Kingson Engineering here.`})}</div>
    ${T.notes?`<p class="scope">${o(T.notes)}</p>`:""}`,{action:`<button type="button" class="btn-ghost btn-xs" data-edit-contact>${l.edit(13)}<span>Edit</span></button>`}),c=$("Enquiries",n.length?`
    <ul class="mini">
      ${n.map(g=>`<li>
        <a href="#/opportunity/${o(g.id)}">
          <span class="mini-main">${o(g.title)} ${Ot(g)}</span>
          <span class="mini-sub">${o(g.ref)} \xB7 ${o(g.stage_name)}${(()=>{let k=tt(g);return k.amount==null?" \xB7 not quoted yet":" \xB7 "+o(L(k.amount,k.currency))})()}</span>
        </a>
        <span class="mini-side">${E(g.owner_name?{full_name:g.owner_name,initials:g.owner_initials}:null,24)}</span>
      </li>`).join("")}
    </ul>`:x("No enquiries recorded.","",{tone:"quiet"}),{tight:!0,note:v(n.length,"enquiry","enquiries"),action:`<button type="button" class="btn-ghost btn-xs" data-new-opp-for>${l.plus(13)}<span>New</span></button>`}),w=$("Quotations",i.length?`
    <ul class="quotes">
      ${i.map(g=>`<li class="quote">
        <a class="quote-btn" href="#/opportunity/${o(g.opportunities?.id||"")}">
          <span class="quote-ref">${o(g.reference)}</span>
          <span class="quote-val num">${o(L(g.amount,g.currency))}</span>
          <span class="quote-status">${Vt(g.status)}</span>
          <span class="quote-when">${g.sent_on?"sent "+o(j(g.sent_on)):"not issued"}</span>
        </a>
      </li>`).join("")}
    </ul>`:x("No quotations yet.","",{tone:"quiet"}),{tight:!0});return`
    <a class="back lnk" href="#/contacts">${l.chevron(13)}<span>Back to contacts</span></a>
    <div class="grid grid-opp">
      <div class="col-wide">${$("History",Gt(a),{tight:!0,note:v(a.length,"entry","entries")})}</div>
      <div class="col-side">${r}${c}${w}${te(s)}</div>
    </div>`}function Qo(t,e,{me:n}){t.addEventListener("click",a=>{if(a.target.closest("[data-edit-contact]"))return Sn({contact:T,onDone:e});if(a.target.closest("[data-new-opp-for]"))return vn({me:n,contact:T,onDone:e})}),ee(t,{contact_id:T.id},n,e)}function Go(){return T?[T.companies?.name,T.job_title].filter(Boolean).map(o).join(" \xB7 "):""}var Ho,T,La=O(()=>{H();W();I();K();z();gt();Ze();Ho=()=>T?.full_name||"Contact",T=null});var Aa={};Z(Aa,{editOpportunity:()=>Ko});async function Ko({opp:t,me:e,onDone:n}){let a=await d.profiles();F({title:"Edit opportunity",sub:t.ref,width:620,submitLabel:"Save",body:`
      ${u("title","What is the job?",D("title",t.title,"required"),{wide:!0})}
      <div class="field-row">
        ${u("service","Service",N("service",["","Structural steelwork","Roof steelwork and trusses","Fiber laser cutting","Balustrades and gates","Stainless fabrication","Mobile cranage","Other"],t.service||""))}
        ${u("source","Source",N("source",De.map(s=>[s,Lt[s]]),t.source))}
      </div>
      ${u("location","Site",D("location",t.location||""),{wide:!0})}
      <div class="field-row">
        ${u("owner_id","Owner",N("owner_id",[["","Unassigned"]].concat(a.map(s=>[s.id,s.full_name])),t.owner_id||""))}
        ${u("priority","Priority",N("priority",ue.map(s=>[s,zo(s)]),t.priority))}
      </div>
      ${u("site_visit_required","Site visit",`<label class="check"><input type="checkbox" id="site_visit_required" name="site_visit_required"
           ${t.site_visit_required?"checked":""}> <span>A site visit is needed before this can be priced</span></label>`,{wide:!0})}
      ${u("description","What do they want?",B("description",t.description||"",4),{wide:!0})}`,onSubmit:async s=>{if(!s.title)throw C("title","Give the job a name.");await d.updateOpportunity(t.id,{title:s.title,service:h(s.service),source:s.source,location:h(s.location),owner_id:h(s.owner_id),priority:s.priority,site_visit_required:!!s.site_visit_required,description:h(s.description)}),b("Saved."),P(n)}})}var zo,Na=O(()=>{H();W();I();ut();zo=t=>t.charAt(0).toUpperCase()+t.slice(1)});var Oa={};Z(Oa,{mount:()=>Yo,render:()=>Jo,sub:()=>Xo,title:()=>Zo});async function Jo(t,{me:e}){if(p=await d.opportunity(t),!p)return x("That opportunity no longer exists.","It may have been deleted.",{tone:"quiet"});let[n,a,s,i,r,c]=await Promise.all([d.activityFor(t),d.quotesFor(t),d.visitsFor(t),d.tasksFor(t),d.filesFor("opportunity_id",t),d.projectForOpportunity(t)]);ne={activity:n,quotes:a,visits:s,tasks:i,files:r,project:c,me:e};let w=ct(p),g=tt(p),k=a.find(y=>y.status==="draft"),xt=a.some(y=>y.sent_on),rt=wt(p),U=w.level==="overdue"||w.level==="unbooked",Q={full_name:p.contact_name,phone:p.contact_phone,whatsapp:p.contact_whatsapp,email:p.contact_email},mt=`
  <section class="opp-head${U?" opp-head-alarm":""}">
    <div class="opp-head-top">
      <div class="opp-stage-set">
        <span class="opp-ref num">${o(p.ref)}</span>
        <label class="sr-only" for="opp-stage">Stage</label>
        <select class="sel sel-inline" id="opp-stage" data-stage>
          ${ft.map(y=>`<option value="${o(y.id)}"${y.id===p.stage?" selected":""}>${o(y.name)}</option>`).join("")}
        </select>
        ${Mt(p.priority)}
        ${jt(p.source)}
      </div>
      <dl class="opp-figs">
        <div><dt>${g.kind==="won"?"Won value":g.kind==="draft"?"Draft quotation":"Quoted"}</dt>
          <dd class="num">${g.amount==null?'<span class="dim">Not quoted yet</span>':o(L(g.amount,g.currency))}</dd></div>
        <div><dt>Enquiry</dt><dd>${o(j(p.created_at))} <span class="dim">(${o(A(p.created_at))})</span></dd></div>
        <div><dt>Last contact</dt><dd>${o(A(p.last_activity_at))}</dd></div>
        <div><dt>Owner</dt><dd class="opp-owner">
          ${E(p.owner_name?{full_name:p.owner_name,initials:p.owner_initials}:null,24)}
          ${o(p.owner_name||"Unassigned")}</dd></div>
      </dl>
    </div>

    <div class="opp-next${U?" is-alarm":""}">
      <span class="opp-next-ic">${U?l.alert(18):l.arrowRight(18)}</span>
      <div class="opp-next-body">
        <p class="opp-next-label">Next action</p>
        ${p.next_action||p.next_action_due?`
          <p class="opp-next-text">${o(p.next_action||"Follow up")}</p>
          <p class="opp-next-meta">
            ${o(p.owner_name||"Unassigned")} \xB7
            ${o(Ht(p.next_action_due))} \xB7
            <strong>${o(w.level==="held"?"on hold":lt(p)?Pe(p.next_action_due):A(p.next_action_due))}</strong>
          </p>
          ${p.stage==="on_hold"&&p.hold_reason?`<p class="opp-next-meta">On hold: ${o(p.hold_reason)}</p>`:""}
          ${p.customer_replied_at?`<p class="opp-next-meta">Customer replied ${o(A(p.customer_replied_at))} \xB7 ${o(ot(p.customer_replied_at))}</p>`:""}`:wt(p)?`
          <p class="opp-next-text">Nobody has booked a next action on this opportunity.</p>
          <p class="opp-next-meta">It is open and it is on nobody's list.</p>`:`<p class="opp-next-text">${o(nt[p.stage].name)}${p.decided_at?" on "+o(Ht(p.decided_at)):""}.</p>
           ${p.lost_reason?`<p class="opp-next-meta">${o(p.lost_reason)}</p>`:""}
           ${p.stage==="won"&&p.won_value!=null?`<p class="opp-next-meta">Accepted value ${o(L(p.won_value,p.currency))}</p>`:""}`}
      </div>
      ${wt(p)?`<button type="button" class="btn btn-sm" data-followup>
        ${l.calendar(14)}<span>${p.next_action_due?"Change":"Book a follow-up"}</span></button>`:""}
    </div>

    ${rt?`<div class="opp-acts" role="group" aria-label="Move this job on">
      ${k?`<button type="button" class="btn btn-sm" data-mark-sent="${o(k.id)}">${l.doc(14)}<span>Mark ${o(k.reference)} as sent</span></button>`:`<button type="button" class="btn btn-sm" data-record-quote>${l.doc(14)}<span>${a.length?"Record a revision":"Record quotation"}</span></button>`}
      <button type="button" class="btn-ghost btn-sm" data-log-followup>${l.phone(14)}<span>Log follow-up</span></button>
      ${xt?`<button type="button" class="btn-ghost btn-sm" data-replied>${l.note(14)}<span>Customer replied</span></button>`:""}
      <span class="opp-acts-gap" aria-hidden="true"></span>
      <button type="button" class="btn-ghost btn-sm" data-won>${l.check(14)}<span>Won</span></button>
      <button type="button" class="btn-ghost btn-sm" data-lost>${l.cross(14)}<span>Lost</span></button>
      ${p.stage!=="on_hold"?`<button type="button" class="btn-ghost btn-sm" data-hold>${l.clock(14)}<span>On hold</span></button>`:""}
    </div>`:""}
  </section>`,X=p.is_demo?`<p class="demo-strip" role="note">${l.alert(14)}
    <span><strong>Demonstration record.</strong> Not counted in any total or report.</span></p>`:"",Pt=$("The job",`
    ${p.description?`<p class="scope">${o(p.description)}</p>`:'<p class="scope dim">No description recorded.</p>'}
    <dl class="kv">
      <div><dt>Service</dt><dd>${o(p.service||"\u2014")}</dd></div>
      <div><dt>Location</dt><dd>${p.location?l.pin(13)+o(p.location):"\u2014"}</dd></div>
      <div><dt>Site visit</dt><dd>${p.site_visit_required?`<span class="warn-inline">${l.alert(13)}Needed</span>`:"Not required"}</dd></div>
      <div><dt>Came in by</dt><dd>${jt(p.source)}</dd></div>
      ${p.lost_reason?`<div class="kv-wide"><dt>Reason lost</dt><dd>${o(p.lost_reason)}</dd></div>`:""}
    </dl>`,{action:`<button type="button" class="btn-ghost btn-xs" data-edit-opp>${l.edit(13)}<span>Edit</span></button>`}),Ut=$("Customer",p.contact_name?`
    <p class="co-name">${o(p.company_name||"\u2014")}</p>
    <div class="contact">
      ${E({full_name:p.contact_name},34)}
      <div class="contact-body">
        <p class="contact-name">${o(p.contact_name)}</p>
        <div class="contact-lines">
          ${p.contact_phone?`<a class="lnk" href="${o($t(p.contact_phone))}">${l.phone(13)}${o(p.contact_phone)}</a>`:""}
          ${p.contact_email?`<a class="lnk" href="${o(qt(p.contact_email))}">${l.mail(13)}${o(p.contact_email)}</a>`:""}
        </div>
      </div>
    </div>
    <div class="contact-acts">${yt(Q,{text:`Good day ${p.contact_name.split(" ")[0]}, Kingson Engineering here regarding ${p.title}.`})}</div>
    ${p.contact_id?`<p class="co-also"><a class="lnk" href="#/contact/${o(p.contact_id)}">
      ${l.users(13)}Full history for this contact</a></p>`:""}`:x("No contact on this opportunity.","",{tone:"quiet"}),{tight:!1}),ve=$("Site visits",s.length?`
    <ul class="mini">
      ${s.map(y=>`<li>
        <button type="button" class="mini-btn" data-visit="${o(y.id)}">
          <span class="mini-main">${o(ot(y.scheduled_at))}
            <span class="pill pill-${y.status==="completed"?"won":y.status==="cancelled"?"lost":"quiet"}">${o(y.status)}</span></span>
          <span class="mini-sub">${o(y.purpose||"Site visit")}${y.location?" \xB7 "+o(y.location):""}</span>
          ${y.outcome?`<span class="mini-sub">${o(y.outcome)}</span>`:""}
        </button>
        <span class="mini-side">${E(y.profiles,24)}</span>
      </li>`).join("")}
    </ul>`:x("No site visit booked.",p.site_visit_required?"This job cannot be priced properly until somebody has been out.":"",{tone:p.site_visit_required?"quiet":"ok"}),{tight:!0,action:`<button type="button" class="btn-ghost btn-xs" data-new-visit>${l.plus(13)}<span>Book</span></button>`}),Ye=$("Quotations",a.length?`
    <ul class="quotes">
      ${a.map(y=>`<li class="quote">
        <button type="button" class="quote-btn" data-quote="${o(y.id)}">
          <span class="quote-ref">${o(y.reference)}${y.version>1?` <span class="rev">rev ${y.version}</span>`:""}</span>
          <span class="quote-val num">${o(L(y.amount,y.currency))}</span>
          <span class="quote-status">${Vt(y.status)}</span>
          <span class="quote-when">${y.sent_at?"sent "+o(ot(y.sent_at))+" \xB7 "+o(A(y.sent_at)):y.sent_on?"sent "+o(j(y.sent_on))+" \xB7 "+o(A(y.sent_on)):"not sent yet"}</span>
        </button>
      </li>`).join("")}
    </ul>
    ${Oe(p)?`<p class="risk">${l.alert(14)}
      <span><strong>A quotation is out with no chase booked.</strong>
      A quotation nobody is following up is the most expensive thing in this pipeline.</span></p>`:""}`:x("Not quoted yet.","The value of this job is the quotation. Record it when it is ready.",{tone:"quiet"}),{tight:!0,action:rt?`<button type="button" class="btn-ghost btn-xs" data-record-quote>${l.plus(13)}<span>${a.length?"Revision":"Record"}</span></button>`:""}),xe=i.filter(y=>y.status==="open"),Xe=$("Tasks",xe.length?`
    <ul class="mini">
      ${xe.map(y=>`<li>
        <span class="mini-main">${o(y.title)}</span>
        <span class="mini-sub${y.due_date&&new Date(y.due_date)<new Date?" is-late":""}">
          ${o(j(y.due_date))} \xB7 ${o(A(y.due_date))}${y.channel?" \xB7 "+o(y.channel):""}</span>
        <span class="mini-side">
          ${E(y.profiles,24)}
          <button type="button" class="btn-ghost btn-xs" data-done="${o(y.id)}">${l.check(13)}<span>Done</span></button>
        </span>
      </li>`).join("")}
    </ul>`:x("No open tasks.","",{tone:"ok"}),{tight:!0,action:`<button type="button" class="btn-ghost btn-xs" data-new-task>${l.plus(13)}<span>Add</span></button>`}),tn=p.stage!=="won"?"":$("Project",c?`<p class="co-name"><a class="lnk" href="#/project/${o(c.id)}">${o(c.name)}</a></p>
       <p class="co-kind">${Qt(c.status)}</p>`:`<p class="modal-message">This opportunity is won and has no project yet.</p>
       <button type="button" class="btn btn-sm" data-convert>${l.briefcase(14)}<span>Open a project</span></button>`),It=$("Activity",`
    <div class="log-add">
      <button type="button" class="btn-ghost btn-sm" data-log>${l.note(14)}<span>Log a call, message or note</span></button>
    </div>
    ${Gt(n)}`,{note:v(n.length,"entry","entries"),tight:!0});return`
    <a class="back lnk" href="#/pipeline">${l.chevron(13)}<span>Back to the pipeline</span></a>
    ${X}
    ${mt}
    <div class="grid grid-opp">
      <div class="col-wide">${Pt}${It}</div>
      <div class="col-side">${Ut}${tn}${ve}${Ye}${Xe}${te(ne.files)}</div>
    </div>`}function Yo(t,e,{me:n}){let a=()=>e();t.addEventListener("change",async s=>{let i=s.target.closest("[data-stage]");if(!i)return;let r=i.value;if(r!==p.stage&&!Ve(r,{opp:p,onDone:a,onCancel:()=>{i.value=p.stage}}))try{await d.setStage(p.id,r),b(`Moved to ${nt[r].name}.`),await a()}catch(c){b(c.message||"That could not be saved.","bad"),i.value=p.stage}}),t.addEventListener("click",async s=>{let i=k=>s.target.closest(k);if(i("[data-followup]"))return kn({opp:p,me:n,onDone:a});if(i("[data-log]"))return xn({opportunityId:p.id,contactId:p.contact_id,me:n,onDone:a});if(i("[data-record-quote]"))return $a({opp:p,quotes:ne.quotes,onDone:a});if(i("[data-log-followup]"))return He({opp:p,onDone:a});if(i("[data-replied]"))return ya({opp:p,onDone:a});if(i("[data-won]"))return yn({opp:p,onDone:a});if(i("[data-lost]"))return gn({opp:p,onDone:a});if(i("[data-hold]"))return bn({opp:p,onDone:a});let r=i("[data-mark-sent]");if(r)return Fe({opp:p,quote:ne.quotes.find(k=>k.id===r.dataset.markSent),onDone:a});if(i("[data-new-visit]"))return Yt({opp:p,me:n,onDone:a});if(i("[data-new-task]"))return ye({opp:p,me:n,onDone:a});if(i("[data-convert]"))return Tn({opp:p});let c=i("[data-quote]");if(c)return We({opp:p,quote:ne.quotes.find(k=>k.id===c.dataset.quote),onDone:a});let w=i("[data-visit]");if(w)return Yt({opp:p,visit:ne.visits.find(k=>k.id===w.dataset.visit),me:n,onDone:a});let g=i("[data-done]");if(g){try{await d.completeTask(g.dataset.done),b("Task completed."),await a()}catch(k){b(k.message,"bad")}return}if(i("[data-edit-opp]")){let{editOpportunity:k}=await Promise.resolve().then(()=>(Na(),Aa));return k({opp:p,me:n,onDone:a})}}),ee(t,{opportunity_id:p.id},n,a)}function Xo(){return p?`${o(p.company_name||p.contact_name||"")} \xB7 ${o(p.service||nt[p.stage].name)}`:""}var p,ne,Zo,ja=O(()=>{H();W();I();K();z();ut();gt();fe();Ze();p=null,ne={},Zo=()=>p?.title||"Opportunity"});var Pa={};Z(Pa,{mount:()=>ns,render:()=>es,sub:()=>as,title:()=>ts});async function es(t,{me:e}){return ae=await d.quotes(),Ra()}function Ra(){let t=_t==="all"?ae:_t==="live"?ae.filter(a=>a.status==="sent"||a.status==="discussed"):ae.filter(a=>a.status===_t),e=`
    <div class="filters">
      <label class="sr-only" for="q-filter">Show</label>
      <select class="sel sel-inline" id="q-filter" data-f>
        <option value="live"${_t==="live"?" selected":""}>Awaiting a decision</option>
        <option value="all"${_t==="all"?" selected":""}>All quotations</option>
        ${Qn.map(a=>`<option value="${a}"${_t===a?" selected":""}>${o(Ce[a])}</option>`).join("")}
      </select>
      <span class="filters-n">${o(v(t.length,"quotation"))} \xB7 <span class="num">${o(Ma(t))}</span></span>
    </div>`,n=t.length?pt(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Reference</th><th scope="col">Opportunity</th>
        <th scope="col" class="ta-r">Amount</th><th scope="col">Status</th>
        <th scope="col">Sent</th><th scope="col">Chase</th><th scope="col"></th>
      </tr></thead>
      <tbody>
        ${t.map(a=>{let s=a.opportunities,i=a.status==="sent"||a.status==="discussed",r=i&&s&&!s.next_action_due;return`<tr${r?' class="tr-risk"':""}>
            <td><span class="td-main num">${o(a.reference)}</span>${a.version>1?`<span class="td-sub">revision ${a.version}</span>`:""}</td>
            <td><a class="lnk" href="#/opportunity/${o(s?.id||"")}">${o(s?.title||"\u2014")}</a>
                <span class="td-sub">${o(s?.companies?.name||"")}</span></td>
            <td class="ta-r num">${o(L(a.amount,a.currency))}</td>
            <td>${Vt(a.status)}</td>
            <td><span class="td-main num">${o(a.sent_at?ot(a.sent_at):j(a.sent_on))}</span><span class="td-sub">${a.sent_on?o(A(a.sent_on))+(a.profiles?.initials?" \xB7 "+o(a.profiles.initials):""):""}</span></td>
            <td>${r?`<span class="pill pill-overdue">${l.alert(13)}No chase booked</span>`:i?`<span class="pill pill-quiet">${o(j(s?.next_action_due))}</span>`:'<span class="dim">\u2014</span>'}</td>
            <td class="ta-r">${a.status==="draft"?`<button type="button" class="btn-ghost btn-xs" data-send="${o(a.id)}">${l.doc(13)}<span>Mark sent</span></button>`:""}
              <button type="button" class="btn-ghost btn-xs" data-edit="${o(a.id)}">${l.edit(13)}<span>Details</span></button></td>
          </tr>`}).join("")}
      </tbody>
    </table>`):x(_t==="live"?"No quotations are out.":"Nothing matches that filter.",_t==="live"?"Everything issued has been decided.":"",{tone:"ok"});return e+$("",n,{tight:!0})}function ns(t,e,{me:n}){t.addEventListener("change",a=>{a.target.closest("[data-f]")&&(_t=a.target.value,document.getElementById("view").innerHTML=Ra())}),t.addEventListener("click",async a=>{let s=a.target.closest("[data-edit], [data-send]");if(!s)return;let i=ae.find(c=>c.id===(s.dataset.edit||s.dataset.send));if(!i)return;let r=await d.opportunity(i.opportunity_id);s.dataset.send?Fe({opp:r,quote:i,onDone:e}):We({opp:r,quote:i,onDone:e})})}function as(){let t=ae.filter(e=>e.status==="sent"||e.status==="discussed");return`${o(v(t.length,"quotation"))} awaiting a decision \xB7 <span class="num">${o(Ma(t))}</span>`}var Ma,ts,ae,_t,Ua=O(()=>{H();W();I();K();z();fe();Ma=t=>{let e={};for(let n of t)e[n.currency]=(e[n.currency]||0)+Number(n.amount||0);return at(e,{empty:"\u2014"})},ts="Quotations",ae=[],_t="live"});var Ia={};Z(Ia,{mount:()=>is,render:()=>ss,sub:()=>rs,title:()=>os});async function ss(t,{me:e}){oe=await d.visits();let n=oe.filter(i=>i.status==="scheduled"&&q(i.scheduled_at)>=0).sort((i,r)=>new Date(i.scheduled_at)-new Date(r.scheduled_at)),a=oe.filter(i=>i.status==="scheduled"&&q(i.scheduled_at)<0).sort((i,r)=>new Date(r.scheduled_at)-new Date(i.scheduled_at)),s=oe.filter(i=>i.status!=="scheduled").sort((i,r)=>new Date(r.scheduled_at)-new Date(i.scheduled_at)).slice(0,30);return`
    ${Dn("Booked",n,"Scheduled and still to happen.")}
    ${a.length?Dn("Past their date and still open",a,"These were booked and never closed off. Either it happened and needs writing up, or it did not.",!0):""}
    ${Dn("Completed and cancelled",s,"The last thirty.")}`}function Dn(t,e,n,a=!1){return e.length?$(t,`
    <ul class="fu-list">
      ${e.map(s=>{let i=s.status==="scheduled"&&q(s.scheduled_at)<0;return`
        <li class="fu">
          <span class="fu-when">
            <span class="fu-date num">${o(ot(s.scheduled_at))}</span>
            <span class="fu-rel${i?" is-late":""}">${o(A(s.scheduled_at))}</span>
          </span>
          <div class="fu-main">
            <span class="fu-title">${o(s.opportunities?.title||"Site visit")}</span>
            <span class="fu-sub">${o(s.opportunities?.companies?.name||"")}${s.location?" \xB7 "+l.pin(12)+o(s.location):""}</span>
            <span class="fu-action">${o(s.purpose||"")}</span>
            ${s.outcome?`<span class="fu-action">${l.check(12)}${o(s.outcome)}</span>`:""}
          </div>
          <span class="fu-stage"><span class="pill pill-${s.status==="completed"?"won":s.status==="cancelled"?"lost":i?"overdue":"quiet"}">${o(s.status)}</span></span>
          <span class="fu-owner">${E(s.profiles,26)}</span>
          <span class="fu-do">
            ${s.opportunities?`<a class="btn-ghost btn-xs" href="#/opportunity/${o(s.opportunities.id)}">${l.arrowRight(13)}<span>Open</span></a>`:""}
            <button type="button" class="btn-ghost btn-xs" data-visit="${o(s.id)}">${l.edit(13)}<span>Edit</span></button>
          </span>
        </li>`}).join("")}
    </ul>`,{note:n,tight:!0}):$(t,x("Nothing here.","",{tone:"ok"}),{note:n,tight:!0})}function is(t,e,{me:n}){t.addEventListener("click",async a=>{let s=a.target.closest("[data-visit]");if(!s)return;let i=oe.find(c=>c.id===s.dataset.visit);if(!i)return;let r=await d.opportunity(i.opportunity_id);Yt({opp:r,visit:i,me:n,onDone:e})})}function rs(){let t=oe.filter(e=>e.status==="scheduled"&&q(e.scheduled_at)>=0).length;return`${o(v(t,"visit"))} booked`}var os,oe,Ba=O(()=>{H();W();I();K();z();gt();os="Site visits",oe=[]});var Wa={};Z(Wa,{render:()=>cs,sub:()=>ds,title:()=>ls});async function cs(){if(ge=await d.projects(),!ge.length)return $("",x("No projects yet.","When an opportunity is marked won, open a project from it and it appears here.",{tone:"quiet"}),{tight:!0});let t=ge.filter(n=>["planning","in_progress","on_hold"].includes(n.status)),e=ge.filter(n=>!["planning","in_progress","on_hold"].includes(n.status));return Fa("Active",t)+Fa("Finished",e)}function Fa(t,e){return e.length?$(t,pt(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Project</th><th scope="col">Client</th>
        <th scope="col" class="ta-r">Value</th><th scope="col">Status</th>
        <th scope="col">Target</th><th scope="col">Responsible</th>
      </tr></thead>
      <tbody>
        ${e.map(n=>{let a=n.target_date&&q(n.target_date)<0&&n.status!=="complete";return`<tr${a?' class="tr-risk"':""}>
            <td><a class="lnk lnk-strong" href="#/project/${o(n.id)}">${o(n.name)}</a>
                ${n.opportunities?`<span class="td-sub">from ${o(n.opportunities.ref)}</span>`:""}</td>
            <td>${o(n.companies?.name||n.contacts?.full_name||"\u2014")}</td>
            <td class="ta-r num">${o(L(n.value,n.currency))}</td>
            <td>${Qt(n.status)}</td>
            <td><span class="td-main num">${o(j(n.target_date))}</span>
                <span class="td-sub${a?" is-late":""}">${n.target_date?o(A(n.target_date)):""}</span></td>
            <td>${E(n.profiles,24)}</td>
          </tr>`}).join("")}
      </tbody>
    </table>`),{tight:!0,note:`${v(e.length,"project")} \xB7 ${L(dn(e,n=>n.value))}`}):$(t,x("Nothing here.","",{tone:"quiet"}),{tight:!0})}function ds(){let t=ge.filter(e=>["planning","in_progress","on_hold"].includes(e.status));return`${o(v(t.length,"active project"))} \xB7 <span class="num">${o(L(dn(t,e=>e.value)))}</span>`}var ls,ge,Ha=O(()=>{H();W();I();K();z();ls="Projects",ge=[]});var Va={};Z(Va,{mount:()=>ms,render:()=>us,sub:()=>hs,title:()=>ps});async function us(t,{me:e}){if(_=await d.project(t),!_)return x("That project no longer exists.","",{tone:"quiet"});let[n,a]=await Promise.all([d.activityForProject(t),d.filesFor("project_id",t)]),i=`
    <section class="opp-head${_.target_date&&q(_.target_date)<0&&_.status!=="complete"?" opp-head-alarm":""}">
      <div class="opp-head-top">
        <div class="opp-stage-set">
          ${Qt(_.status)}
          ${_.opportunities?`<a class="lnk" href="#/opportunity/${o(_.opportunities.id)}">from ${o(_.opportunities.ref)}</a>`:""}
        </div>
        <dl class="opp-figs">
          <div><dt>Value</dt><dd class="num">${o(L(_.value,_.currency))}</dd></div>
          <div><dt>Start</dt><dd>${o(j(_.start_date))}</dd></div>
          <div><dt>Target</dt><dd>${o(j(_.target_date))}
            ${_.target_date?`<span class="dim">(${o(A(_.target_date))})</span>`:""}</dd></div>
          <div><dt>Responsible</dt><dd class="opp-owner">${E(_.profiles,24)}${o(_.profiles?.full_name||"Unassigned")}</dd></div>
        </dl>
      </div>
    </section>`,r=$("The job",`
    ${_.description?`<p class="scope">${o(_.description)}</p>`:'<p class="scope dim">No description.</p>'}
    ${_.notes?`<dl class="kv"><div class="kv-wide"><dt>Notes</dt><dd>${o(_.notes)}</dd></div></dl>`:""}`,{action:`<button type="button" class="btn-ghost btn-xs" data-edit-project>${l.edit(13)}<span>Edit</span></button>`}),c=$("Client",`
    <p class="co-name">${o(_.companies?.name||"\u2014")}</p>
    ${_.contacts?`
      <div class="contact">
        ${E({full_name:_.contacts.full_name},34)}
        <div class="contact-body">
          <p class="contact-name"><a class="lnk" href="#/contact/${o(_.contacts.id)}">${o(_.contacts.full_name)}</a></p>
          <div class="contact-lines">
            ${_.contacts.phone?`<a class="lnk" href="${o($t(_.contacts.phone))}">${l.phone(13)}${o(_.contacts.phone)}</a>`:""}
            ${_.contacts.email?`<a class="lnk" href="${o(qt(_.contacts.email))}">${l.mail(13)}${o(_.contacts.email)}</a>`:""}
          </div>
        </div>
      </div>
      <div class="contact-acts">${yt(_.contacts,{text:`Good day, Kingson Engineering here regarding ${_.name}.`})}</div>`:'<p class="dim">No contact linked.</p>'}`);return`
    <a class="back lnk" href="#/projects">${l.chevron(13)}<span>Back to projects</span></a>
    ${i}
    <div class="grid grid-opp">
      <div class="col-wide">${r}${$("Activity",Gt(n),{tight:!0,note:v(n.length,"entry","entries")})}</div>
      <div class="col-side">${c}${te(a)}</div>
    </div>`}function ms(t,e,{me:n}){t.addEventListener("click",a=>{if(a.target.closest("[data-edit-project]"))return qn({project:_,me:n,onDone:e})}),ee(t,{project_id:_.id},n,e)}function hs(){return _?[_.companies?.name,Ft[_.status]].filter(Boolean).map(o).join(" \xB7 "):""}var ps,_,Qa=O(()=>{H();W();I();K();z();gt();Ze();ps=()=>_?.name||"Project",_=null});var za={};Z(za,{mount:()=>ws,render:()=>gs,sub:()=>_s,title:()=>ys});async function gs(t,{me:e}){vt=await d.settings().catch(()=>null);let n=bs(e);if(e?.role!=="admin")return`${Ga()}${n}`;[Cn,Je]=await Promise.all([d.profiles(),d.enquiries(60)]);let a=$("People",pt(`
    <table class="tbl tbl-rows">
      <thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col"></th></tr></thead>
      <tbody>
        ${Cn.map(r=>`<tr>
          <td><span class="lnk-strong">${E(r,24)}<span>${o(r.full_name)}</span></span></td>
          <td>
            <label class="sr-only" for="r-${o(r.id)}">Role for ${o(r.full_name)}</label>
            <select class="sel sel-inline" id="r-${o(r.id)}" data-role="${o(r.id)}"${r.id===e.id?' disabled title="You cannot change your own role"':""}>
              <option value="staff"${r.role==="staff"?" selected":""}>Staff</option>
              <option value="admin"${r.role==="admin"?" selected":""}>Administrator</option>
            </select>
          </td>
          <td>${r.active?'<span class="pill pill-won">Active</span>':'<span class="pill pill-lost">Deactivated</span>'}</td>
          <td class="ta-r">${r.id===e.id?'<span class="dim">you</span>':`<button type="button" class="btn-ghost btn-xs" data-active="${o(r.id)}" data-to="${r.active?"false":"true"}">
                 ${r.active?"Deactivate":"Reactivate"}</button>`}</td>
        </tr>`).join("")}
      </tbody>
    </table>`),{tight:!0,note:"Staff run the pipeline. Administrators can also change roles, deactivate people and set how email is sent."}),s=$("Adding somebody",`
    <p class="scope">New accounts are created in the Supabase dashboard under
      <strong>Authentication \u2192 Users</strong>. A profile row appears here automatically the
      moment the account is created, as Staff. Change the role above if they need it.</p>
    <p class="scope">Deactivating somebody keeps everything they did \u2014 their calls, their
      quotations, their site visits \u2014 and stops them signing in. Deleting the account would
      take the history with it, which is why this screen does not offer it.</p>`),i=$("Website enquiry log",Je.length?pt(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Received</th><th scope="col">From</th><th scope="col">Contact</th>
        <th scope="col">Needs</th><th scope="col">Became</th>
      </tr></thead>
      <tbody>
        ${Je.map(r=>`<tr${r.spam?' class="is-done"':""}>
          <td><span class="td-main num">${o(ot(r.created_at))}</span></td>
          <td><span class="td-main">${o(r.name)}</span><span class="td-sub">${o(r.company||"")}</span></td>
          <td><span class="td-sub">${o(r.contact)}</span></td>
          <td><span class="td-sub">${o(r.service||"\u2014")}${r.location?" \xB7 "+o(r.location):""}</span></td>
          <td>${r.spam?'<span class="pill pill-lost">Blocked as spam</span>':r.opportunity_id?`<a class="lnk" href="#/opportunity/${o(r.opportunity_id)}">opportunity</a>`:'<span class="pill pill-overdue">not converted</span>'}</td>
        </tr>`).join("")}
      </tbody>
    </table>`):x("No website enquiries yet.","Everything submitted on kingson-engineering.vercel.app lands here and in the pipeline.",{tone:"quiet"}),{tight:!0,note:`${v(Je.length,"submission")} \xB7 the last sixty`});return`${Ga()}${n}${a}${s}${i}`}function bs(t){if(!vt)return $("Working rules",x("The settings could not be read.","",{tone:"quiet"}));let e=t?.role==="admin",n=(vt.working_weekdays||[]).map(a=>fs[a]).join(", ");return $("Working rules",`
    <div class="settings-grid">
      <div class="field">
        <label for="fu-days">Follow up a sent quotation after</label>
        <select class="sel" id="fu-days" data-fu-days ${e?"":"disabled"}>
          ${[1,2,3,4,5,7,10].map(a=>`<option value="${a}"${a===vt.quote_followup_working_days?" selected":""}>${a} working day${a===1?"":"s"}</option>`).join("")}
        </select>
        <p class="field-hint">Working days: ${o(n)}. Applied when a quotation is marked sent.</p>
      </div>
      <div class="field">
        <label for="mail-mode">Email</label>
        <select class="sel" id="mail-mode" data-mail-mode ${e?"":"disabled"}>
          <option value="manual"${vt.email_mode==="manual"?" selected":""}>Manual</option>
          <option value="test"${vt.email_mode==="test"?" selected":""}>Test mailbox only</option>
          <option value="connected" disabled>Connected mailbox \u2014 needs Kingson\u2019s credentials</option>
        </select>
        <p class="field-hint">${o($s[vt.email_mode]||"")}</p>
      </div>
      ${vt.email_mode==="test"||e?`<div class="field">
        <label for="test-box">Test mailbox</label>
        <input class="inp" id="test-box" type="email" data-test-box value="${o(vt.test_mailbox||"")}"
          placeholder="a mailbox you control" ${e?"":"disabled"}>
        <p class="field-hint">Used only in test mode. Never a customer.</p>
      </div>`:""}
    </div>
    <p class="field-hint">Customer replies are recorded by hand with \u201CCustomer replied\u201D. The CRM cannot
      see any inbox, and does not claim to.</p>`,{note:e?"Administrators can change these":"Set by an administrator"})}function ws(t,e,{me:n}){t.addEventListener("change",async a=>{if(a.target.closest("[data-demo]")){na(a.target.checked),location.reload();return}let s=a.target.closest("[data-fu-days]")?{quote_followup_working_days:Number(a.target.value)}:a.target.closest("[data-mail-mode]")?{email_mode:a.target.value}:a.target.closest("[data-test-box]")?{test_mailbox:a.target.value.trim()||null}:null;if(s)try{await d.updateSettings({...s,updated_by:n?.id||null,updated_at:new Date().toISOString()}),b("Saved."),await e()}catch(i){b(i.message||"That could not be saved.","bad"),await e()}}),t.addEventListener("change",async a=>{let s=a.target.closest("[data-role]");if(s)try{await f.update("profiles",M("id",s.dataset.role),{role:s.value}),b("Role updated."),await e()}catch(i){b(i.message||"That could not be changed.","bad"),await e()}}),t.addEventListener("click",async a=>{let s=a.target.closest("[data-active]");if(s)try{await f.update("profiles",M("id",s.dataset.active),{active:s.dataset.to==="true"}),b(s.dataset.to==="true"?"Reactivated.":"Deactivated."),await e()}catch(i){b(i.message||"That could not be changed.","bad")}})}function _s(){return`${o(v(Cn.length,"person","people"))}`}var fs,$s,ys,Cn,Je,vt,Ga,Ka=O(()=>{H();I();K();z();ut();Me();fs=["","Mon","Tue","Wed","Thu","Fri","Sat","Sun"],$s={manual:"Manual \u2014 nothing is sent from the CRM. Staff send from their own mailbox or WhatsApp and record it here.",test:"Test \u2014 the send function may only deliver to the test mailbox below, whatever address is asked for.",connected:"Connected \u2014 Kingson\u2019s own mailbox. Not available until the mailbox credentials exist."},ys="Settings",Cn=[],Je=[],vt=null,Ga=()=>$("Demonstration records",`
  <p class="scope">Sample jobs and test submissions are flagged as demonstration data. They are
    left out of every list, count and total unless you switch them on here \u2014 and then only in
    this browser, with a warning strip across the top of every screen.</p>
  <label class="check"><input type="checkbox" data-demo ${Nt()?"checked":""}>
    <span>Show demonstration records in this browser</span></label>`)});ln();W();var et=null,no=new Set,je=()=>et;var Jn=()=>!!(sn()?.access_token&&et);var pn=()=>no.forEach(t=>t(et));function ao(t){try{let e=t.split(".")[1],n=atob(e.replace(/-/g,"+").replace(/_/g,"/"));return JSON.parse(n).sub||null}catch{return null}}async function Yn(){let t=sn(),e=t?.access_token?ao(t.access_token):null;if(!e)return et=null,null;let a=(await f.select("profiles",`select=*&id=eq.${e}`))[0]||null;if(!a)throw et=null,Ct(null),new Error("This account has no profile in the CRM. Ask an administrator to set one up.");if(!a.active)throw et=null,Ct(null),new Error("This account has been deactivated.");return et=a,et}async function Xn(){if(!Un())return et=null,null;try{await Yn()}catch{et=null}return pn(),et}async function ta(t,e){return await Fn(t,e),await Yn(),pn(),Zn(f).catch(()=>{}),et}async function ea(){await Wn(),et=null,pn()}H();W();Me();I();z();var po=[{key:"dashboard",href:"#/",label:"Dashboard",ic:"dashboard"},{key:"pipeline",href:"#/pipeline",label:"Pipeline",ic:"pipeline"},{key:"followups",href:"#/followups",label:"Follow-ups",ic:"bell",badge:!0},{key:"tasks",href:"#/tasks",label:"Tasks",ic:"task"},{key:"contacts",href:"#/contacts",label:"Contacts",ic:"users"},{key:"quotes",href:"#/quotes",label:"Quotations",ic:"doc"},{key:"visits",href:"#/visits",label:"Site visits",ic:"pin"},{key:"projects",href:"#/projects",label:"Projects",ic:"briefcase"},{key:"settings",href:"#/settings",label:"Settings",ic:"shield"}];function hn(t,e,{overdue:n=0}={}){return`
  <div class="rail-top">
    <a class="mark" href="#/">
      <span class="mark-name display">KINGSON</span>
      <span class="mark-sub">Enquiries &amp; Projects</span>
    </a>
  </div>

  <nav class="rail-nav" aria-label="Sections">${po.filter(s=>!s.admin||e?.role==="admin").map(s=>`
      <a class="rail-link${t===s.key?" is-active":""}" href="${s.href}"
         ${t===s.key?'aria-current="page"':""}>
        ${l[s.ic](17)}<span>${o(s.label)}</span>
        ${s.badge&&n?`<span class="rail-count" title="${o(n)} overdue">${o(n)}</span>`:""}
      </a>`).join("")}</nav>

  <div class="rail-foot">
    <div class="rail-me">
      <span class="avatar" style="--s:30px">${o(e?.initials||"?")}</span>
      <span class="rail-me-body">
        <span class="rail-me-name">${o(e?.full_name||"")}</span>
        <span class="rail-me-role">${o(e?.role==="admin"?"Administrator":"Staff")}</span>
      </span>
    </div>
    <button type="button" class="rail-signout" data-signout>${l.logout(14)}<span>Sign out</span></button>
  </div>`}var Ue=(t,e="",n="")=>`
  <div class="topbar-in">
    <button type="button" class="topbar-menu" data-rail-open aria-expanded="false" aria-controls="rail">
      ${l.menu(18)}<span class="sr-only">Open navigation</span>
    </button>
    <div class="topbar-titles">
      <h1 class="topbar-title display">${o(t)}</h1>
      ${e?`<p class="topbar-sub">${e}</p>`:""}
    </div>
    ${n?`<div class="topbar-actions">${n}</div>`:""}
  </div>`,la=(t="")=>`
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

      <p class="signin-err" role="alert" ${t?"":"hidden"}>${o(t)}</p>
      <button type="submit" class="btn" data-signin>Sign in</button>
      <p class="signin-foot">Kingson Engineering internal system. Access is by account only.</p>
    </form>
  </div>`;K();ut();I();var re=document.getElementById("app"),Ln=document.getElementById("rail"),ie=document.getElementById("topbar"),bt=document.getElementById("view"),jn=document.getElementById("scrim"),se=document.getElementById("gate");if(Nt()){let t=document.createElement("p");t.className="demo-banner",t.setAttribute("role","note"),t.innerHTML="<strong>Demonstration records are showing.</strong>&nbsp;Totals include sample data. Switch off in Settings.",ie.before(t)}var An={dashboard:()=>Promise.resolve().then(()=>(ha(),ma)),pipeline:()=>Promise.resolve().then(()=>(ba(),ga)),followups:()=>Promise.resolve().then(()=>(_a(),wa)),tasks:()=>Promise.resolve().then(()=>(Sa(),ka)),contacts:()=>Promise.resolve().then(()=>(Ea(),qa)),contact:()=>Promise.resolve().then(()=>(La(),Ca)),opportunity:()=>Promise.resolve().then(()=>(ja(),Oa)),quotes:()=>Promise.resolve().then(()=>(Ua(),Pa)),visits:()=>Promise.resolve().then(()=>(Ba(),Ia)),projects:()=>Promise.resolve().then(()=>(Ha(),Wa)),project:()=>Promise.resolve().then(()=>(Qa(),Va)),settings:()=>Promise.resolve().then(()=>(Ka(),za))},vs={opportunity:"pipeline",contact:"contacts",project:"projects"},it=Za(),Nn=0;function Za(){let t=(location.hash||"#/").replace(/^#\/?/,""),[e,n]=t.split("/");return e?An[e]?{key:e,arg:n||null}:{key:"dashboard",arg:null}:{key:"dashboard",arg:null}}async function Mn(){try{Nn=(await d.openOpportunities()).filter(lt).length}catch{}}var be=0;function xs(){let t=bt.cloneNode(!1);return delete t.dataset.view,bt.replaceWith(t),bt=t,t}async function _e(){if(!Jn())return we();let t=++be,e=je(),n=vs[it.key]||it.key;Ln.innerHTML=hn(n,e,{overdue:Nn}),Rn();let a;try{a=await(An[it.key]||An.dashboard)()}catch{ie.innerHTML=Ue("Kingson"),bt.innerHTML=fn("That screen could not be loaded. Check the connection and try again.");return}if(t===be){ie.innerHTML=Ue(typeof a.title=="function"?a.title(it.arg):a.title,""),xs(),bt.innerHTML=ca(4),bt.dataset.view=it.key;try{let s=await a.render(it.arg,{me:e,rerender:On});if(t!==be)return;bt.innerHTML=s,ie.innerHTML=Ue(typeof a.title=="function"?a.title(it.arg):a.title,typeof a.sub=="function"?await a.sub(it.arg):a.sub||"",typeof a.actions=="function"?a.actions(it.arg,e):""),a.mount?.(bt,On,{me:e,arg:it.arg})}catch(s){if(t!==be)return;console.error("[kingson] view failed",it.key,s),bt.innerHTML=fn(s?.message||"That screen could not be loaded.")}Mn().then(()=>{t===be&&(Ln.innerHTML=hn(n,je(),{overdue:Nn}))})}}async function On(){let t=window.scrollY;await _e(),window.scrollTo(0,t)}function we(t=""){re.hidden=!0,se.hidden=!1,se.innerHTML=la(t);let e=se.querySelector("#signin-form"),n=e.querySelector("[data-signin]"),a=e.querySelector(".signin-err");e.querySelector("#si-email").focus(),e.addEventListener("submit",async s=>{s.preventDefault();let i=e.querySelector("#si-email").value.trim(),r=e.querySelector("#si-password").value;if(a.hidden=!0,!i||!r){a.textContent="Enter your email address and password.",a.hidden=!1;return}n.disabled=!0,n.textContent="Signing in\u2026";try{await ta(i,r),se.hidden=!0,se.innerHTML="",re.hidden=!1,await Mn(),await _e()}catch(c){a.textContent=c?.status===400?"That email address and password do not match an account.":c?.message||"Sign-in failed.",a.hidden=!1,n.disabled=!1,n.textContent="Sign in",e.querySelector("#si-password").select()}})}var ks=()=>{re.classList.add("rail-open"),jn.hidden=!1,Ln.querySelector(".rail-link")?.focus(),ie.querySelector("[data-rail-open]")?.setAttribute("aria-expanded","true")},Rn=()=>{re.classList.remove("rail-open"),jn.hidden=!0,ie.querySelector("[data-rail-open]")?.setAttribute("aria-expanded","false")};document.addEventListener("click",async t=>{if(t.target.closest("[data-rail-open]"))return ks();if(t.target===jn||t.target.closest(".rail-link"))return Rn();if(t.target.closest("[data-signout]")){await ea(),location.hash="#/",we();return}if(t.target.closest("[data-retry]"))return _e();let e=je();if(t.target.closest("[data-new-opp]")){let{newOpportunity:n}=await Promise.resolve().then(()=>(gt(),ze));return n({me:e})}if(t.target.closest("[data-new-contact]")){let{contactDialog:n}=await Promise.resolve().then(()=>(gt(),ze));return n({onDone:a=>{location.hash=`#/contact/${a.id}`}})}if(t.target.closest("[data-new-task-global]")){let{taskDialog:n}=await Promise.resolve().then(()=>(gt(),ze));return n({me:e,onDone:On})}});document.addEventListener("keydown",t=>{t.key==="Escape"&&re.classList.contains("rail-open")&&Rn()});addEventListener("hashchange",()=>{it=Za(),_e().then(()=>{bt.focus({preventScroll:!0}),scrollTo(0,0)})});addEventListener("storage",t=>{t.key==="kingson-crm/session/v1"&&!t.newValue&&we("Signed out in another tab.")});(async function(){if(document.getElementById("boot")?.remove(),!await Xn())return we();se.hidden=!0,re.hidden=!1,await Mn(),await _e()})().catch(t=>{console.error("[kingson] boot failed",t),we("Something went wrong starting the application. Reload the page.")});export{o as esc,On as softRender,b as toast};
