var _o=Object.defineProperty;var O=(e,t,n)=>()=>{if(n)throw n[0];try{return e&&(t=e(e=0)),t}catch(a){throw n=[a],a}};var ee=(e,t)=>{for(var n in t)_o(e,n,{get:t[n],enumerable:!0})};var at,qt,Ht,Me,st=O(()=>{at="https://fgzwcxwmaohowryzdgui.supabase.co",qt="sb_publishable_QYbHrEJ06GpGDMlIqf5tzw_ijJpdtTV",Ht="kingson-files",Me="Africa/Harare"});var Pn={};ee(Pn,{ApiError:()=>le,IDLE_MS:()=>Na,authUser:()=>Ln,checkCurrentPassword:()=>Mn,db:()=>y,enrollTotp:()=>Nn,eq:()=>F,getSession:()=>Ve,loadSession:()=>Ma,order:()=>ie,q:()=>Un,recordActivity:()=>Qt,removeFactor:()=>jn,requestPasswordReset:()=>Jt,resetRedirect:()=>Ra,sessionTimedOut:()=>Tt,setSession:()=>ue,signIn:()=>An,signOut:()=>zt,storage:()=>Lt,takeRecoveryFromUrl:()=>Dt,updatePassword:()=>At,uploadCheckedFile:()=>Rn,verifyTotp:()=>On});function Ma(){try{localStorage.removeItem(Vt);let e=sessionStorage.getItem(Vt);L=e?JSON.parse(e):null,L&&(!L.started_at||Date.now()-L.started_at>=ja)&&ue(null)}catch{L=null}return L}function Ve(){return L}function ue(e){rt.clear(),L=e;try{e?sessionStorage.setItem(Vt,JSON.stringify(e)):sessionStorage.removeItem(Vt)}catch{}return e}function Et(e,t){let n=String(t?.error_code||t?.code||""),a=t?.message||t?.error_description||t?.msg||"";return n==="weak_password"||/password should be|weak password/i.test(a)?"That password is too weak. Use at least 14 characters and avoid reused or compromised passwords.":n==="same_password"?"That is the password you already have. Choose a different one.":n==="over_email_send_rate_limit"||e===429?"Too many attempts. Wait a few minutes and try again.":n==="23505"&&a&&!/_key"?$/.test(a)&&!/duplicate key/i.test(a)||n==="23514"&&a&&!/violates check constraint/i.test(a)?a:n==="23505"?/contacts_email_key/.test(a)?"A contact with that email address already exists.":/companies_name_key/.test(a)?"A company with that name already exists.":"That record already exists.":n==="23514"?/lost_has_reason/.test(a)?"A lost enquiry needs a reason.":/quotes_sent_has_date/.test(a)?"A quotation marked sent needs the date it went out.":/contacts_reachable/.test(a)?"A contact needs a phone number, a WhatsApp number or an email address.":/amount_sane|value_sane/.test(a)?"That amount cannot be negative.":"That value is not allowed here.":n==="23503"?"That record is still attached to something else.":e===401?"Your session has expired. Sign in again.":e===403||n==="42501"?"You do not have permission to do that.":e===404?"That record no longer exists.":e===0?"No connection. Check the network and try again.":a||`Request failed (${e}).`}async function ye(e,{method:t="POST",body:n,token:a}={}){let s;try{s=await fetch(`${at}/auth/v1${e}`,{method:t,signal:AbortSignal.timeout(15e3),headers:{apikey:qt,"Content-Type":"application/json",...a?{Authorization:`Bearer ${a}`}:{}},body:n?JSON.stringify(n):void 0})}catch{throw new le(Et(0),{status:0})}let i=await s.text(),r=i?JSON.parse(i):null;if(!s.ok)throw new le(Et(s.status,r),{status:s.status,code:r?.code||""});return r}async function An(e,t){ue(null);let n=await ye("/token?grant_type=password",{body:{email:e.trim(),password:t}});return Qt(),ue(Kt(n))}async function zt(){let e=L;if(ue(null),Dn?.postMessage("signed-out"),e?.access_token)try{await ye("/logout",{token:e.access_token})}catch{}}async function Jt(e){return ye(`/recover?redirect_to=${encodeURIComponent(Ra())}`,{body:{email:e.trim()}})}function Dt(){let e=new URLSearchParams((location.hash||"").replace(/^#/,""));if(!e.get("type")&&!e.get("error")&&!e.get("error_code"))return null;let t=()=>history.replaceState(null,"",location.pathname);return e.get("error")||e.get("error_code")?(t(),{error:e.get("error_code")||e.get("error"),description:e.get("error_description")||""}):e.get("type")!=="recovery"||!e.get("access_token")?null:(ue(Kt({access_token:e.get("access_token"),refresh_token:e.get("refresh_token"),expires_in:Number(e.get("expires_in"))||3600,user:null})),t(),{recovery:!0})}async function At(e,t){if(L&&Ct())try{await it()}catch{}let n=await ye("/user",{method:"PUT",token:L?.access_token,body:{password:e,...t?{current_password:t}:{}}});return await ye("/logout?scope=others",{token:L?.access_token}),n}async function Ln(){return L&&Ct()&&await it(),ye("/user",{method:"GET",token:L?.access_token})}async function On(e,t){let n=`/factors/${encodeURIComponent(e)}`,a=await ye(`${n}/challenge`,{token:L?.access_token,body:{}}),s=await ye(`${n}/verify`,{token:L?.access_token,body:{challenge_id:a.id,code:t}});return ue(Kt(s))}async function Rn(e,t){if(Tt())throw new le("Session ended. Sign in again.",{status:401});Ct()&&await it();let n=new FormData;n.append("file",e),n.append("link_type",Object.keys(t)[0]),n.append("link_id",Object.values(t)[0]);let a=await fetch(`${at}/functions/v1/crm-upload`,{method:"POST",headers:{apikey:qt,Authorization:`Bearer ${L.access_token}`},body:n}),s=await a.json().catch(()=>({}));if(!a.ok)throw new le(s.error||"The file could not be uploaded.",{status:a.status});return rt.clear(),s}async function it(){if(!L?.refresh_token)throw new le("Your session has expired. Sign in again.",{status:401});return Gt||(Gt=ye("/token?grant_type=refresh_token",{body:{refresh_token:L.refresh_token}}).then(e=>ue(Kt(e))).catch(e=>{throw ue(null),e}).finally(()=>{Gt=null})),Gt}function xo(e,t){return rt.set(e,{at:Date.now(),promise:t}),t.catch(()=>rt.delete(e)),t}async function ot(e,{method:t="GET",body:n,headers:a={},retry:s=!0}={}){if(La(t,a)){let i=rt.get(e);if(i&&Date.now()-i.at<vo)return i.promise}else rt.clear();return La(t,a)?xo(e,Cn(e,{method:t,headers:a,retry:s})):Cn(e,{method:t,body:n,headers:a,retry:s})}async function Cn(e,{method:t="GET",body:n,headers:a={},retry:s=!0}={}){if(Tt())throw await zt(),dispatchEvent(new Event("crm-session-ended")),new le("Session ended after inactivity. Sign in again.",{status:401});if(L&&Ct())try{await it()}catch{}let i;try{i=await fetch(`${at}${e}`,{method:t,signal:AbortSignal.timeout(15e3),headers:{apikey:qt,"Content-Type":"application/json",...L?.access_token?{Authorization:`Bearer ${L.access_token}`}:{},...a},body:n===void 0?void 0:JSON.stringify(n)})}catch{throw new le(Et(0),{status:0})}if(i.status===401&&s&&L?.refresh_token)try{return await it(),Cn(e,{method:t,body:n,headers:a,retry:!1})}catch{}let r=await i.text(),l=null;try{l=r?JSON.parse(r):null}catch{l=r}if(!i.ok)throw new le(Et(i.status,l),{status:i.status,code:l?.code||"",details:l?.details||"",hint:l?.hint||""});return l}var Vt,Na,ja,Oa,Dn,Qt,Tt,L,Gt,Kt,Ct,le,Ra,Nn,jn,Mn,vo,rt,La,y,Lt,Un,F,ie,De=O(()=>{st();Vt="kingson-crm/session/v1",Na=1800*1e3,ja=480*60*1e3,Oa=Date.now(),Dn=typeof BroadcastChannel=="function"?new BroadcastChannel("kingson-crm/signout"):null;Dn?.unref?.();Dn?.addEventListener("message",()=>{ue(null),dispatchEvent(new Event("crm-session-ended"))});Qt=()=>{Oa=Date.now()},Tt=()=>!!(L&&(Date.now()-Oa>=Na||Date.now()-L.started_at>=ja)),L=null,Gt=null;Kt=e=>({access_token:e.access_token,refresh_token:e.refresh_token,expires_at:Date.now()+((e.expires_in||3600)-60)*1e3,user:e.user||null,started_at:L?.started_at||Date.now()}),Ct=()=>!L||!L.expires_at||Date.now()>=L.expires_at,le=class extends Error{constructor(t,{status:n=0,code:a="",details:s="",hint:i=""}={}){super(t),this.name="ApiError",this.status=n,this.code=a,this.details=s,this.hint=i}};Ra=()=>`${location.origin}${location.pathname.replace(/\/index\.html$/,"").replace(/\/$/,"")||"/crm"}?reset=1`;Nn=()=>ye("/factors",{token:L?.access_token,body:{factor_type:"totp",friendly_name:"Kingson authenticator"}}),jn=e=>ye(`/factors/${encodeURIComponent(e)}`,{method:"DELETE",token:L?.access_token});Mn=(e,t)=>ye("/token?grant_type=password",{body:{email:e,password:t}});vo=2e3,rt=new Map,La=(e,t)=>e==="GET"&&!t.Prefer;y={select:(e,t="")=>ot(`/rest/v1/${e}${t?"?"+t:""}`),insert:(e,t,n="")=>ot(`/rest/v1/${e}${n?"?"+n:""}`,{method:"POST",body:t,headers:{Prefer:"return=representation"}}),update:async(e,t,n)=>{let a=await ot(`/rest/v1/${e}?${t}`,{method:"PATCH",body:n,headers:{Prefer:"return=representation"}});if(Array.isArray(a)&&!a.length)throw new le("Not saved \u2014 you may not have permission to change this, or it no longer exists.",{status:403});return a},rpc:(e,t={})=>ot(`/rest/v1/rpc/${e}`,{method:"POST",body:t})},Lt={async upload(e,t,n){if(L&&Ct())try{await it()}catch{}let a;try{a=await fetch(`${at}/storage/v1/object/${e}/${encodeURI(t)}`,{method:"POST",headers:{apikey:qt,Authorization:`Bearer ${L?.access_token||""}`,"x-upsert":"false",...n.type?{"Content-Type":n.type}:{}},body:n})}catch{throw new le(Et(0),{status:0})}if(!a.ok){let s=null;try{s=await a.json()}catch{}throw new le(a.status===413?"That file is larger than the 25 MB limit.":s?.message||`Upload failed (${a.status}).`,{status:a.status})}return t},async signedUrl(e,t,n=120){let a=await ot(`/storage/v1/object/sign/${e}/${t.split("/").map(encodeURIComponent).join("/")}`,{method:"POST",body:{expiresIn:n}});return`${at}/storage/v1${a.signedURL||a.signedUrl}`},async remove(e,t){return ot(`/storage/v1/object/${e}`,{method:"DELETE",body:{prefixes:t}})}},Un=e=>{let t=String(e??"");return/[,.()"\\\s]/.test(t)?`"${t.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`:t},F=(e,t)=>`${e}=eq.${encodeURIComponent(t)}`,ie=(e,t="asc",n=!0)=>`order=${e}.${t}${n?".nullslast":""}`});function Fa(e){let t=String(e||"").replace(/\D+/g,"");return t?(t.startsWith("00")&&(t=t.slice(2)),t.length===10&&t.startsWith("0")?t="263"+t.slice(1):t.length===9&&/^[1-9]/.test(t)&&(t="263"+t),t.length>=7?t:""):""}function te(){return new Intl.DateTimeFormat("en-CA",{timeZone:Me}).format(new Date)}function M(e){if(!e)return null;let t=Date.parse(te()+"T00:00:00Z"),n=Date.parse(String(e).slice(0,10)+"T00:00:00Z");return Number.isNaN(n)?null:Math.round((n-t)/864e5)}function ct(e,t){let n=new Date(Date.parse(String(e).slice(0,10)+"T00:00:00Z"));return n.setUTCDate(n.getUTCDate()+t),n.toISOString().slice(0,10)}function nn(e=te(),t=1){let n=e,a=Math.max(0,Math.trunc(Number(t)||0));for(;a>0;){n=ct(n,1);let s=new Date(n+"T00:00:00Z").getUTCDay();s!==0&&s!==6&&a--}return n}function ve(e){return!Ae(e)||!e.next_action_due?!1:M(e.next_action_due)<0}function an(e){return!Ae(e)||!e.next_action_due?!1:M(e.next_action_due)===0}function xe(e){if(!Ae(e))return{level:"closed",label:re[e.stage]?.name||"\u2014",sort:0};if(e.stage==="on_hold"&&e.hold_review_on&&M(e.hold_review_on)>0)return{level:"held",label:`On hold \xB7 review ${ko(e.hold_review_on)}`,sort:50};if(dt(e))return{level:"unbooked",label:"No next action",sort:900};let t=M(e.next_action_due);if(t<0){let n=Math.abs(t);return{level:"overdue",label:n===1?"1 day overdue":`${n} days overdue`,sort:1e3+n}}return t===0?{level:"today",label:"Due today",sort:800}:t<=7?{level:"soon",label:t===1?"Due tomorrow":`Due in ${t} days`,sort:700-t}:{level:"clear",label:`Due in ${t} days`,sort:100-Math.min(t,99)}}function sn(e){return!Ae(e)||!Number(e.live_quotes||0)?!1:!e.next_action_due||M(e.next_action_due)<0}function pe(e){return e?e.stage==="won"&&e.won_value!=null?{amount:Number(e.won_value),currency:e.currency||"USD",kind:"won"}:e.quoted_value!=null?{amount:Number(e.quoted_value),currency:e.quote_currency||e.currency||"USD",kind:e.quote_status==="draft"?"draft":"quoted"}:{amount:null,currency:e.currency||"USD",kind:"none"}:{amount:null,currency:"USD",kind:"none"}}function Qe(e,t=pe){let n={},a=0;for(let s of e){let i=t(s);i.amount!=null&&(n[i.currency]=(n[i.currency]||0)+i.amount,a++)}return{by:n,valued:a,unvalued:e.length-a}}async function Va(e){let t;try{t=await e.rpc("enum_values",{enum_name:"opp_stage"})}catch{return{ok:!0,skipped:!0}}let n=new Set((t||[]).map(r=>typeof r=="string"?r:r.value)),a=new Set(qe.map(r=>r.id)),s=[...n].filter(r=>!a.has(r)),i=[...a].filter(r=>!n.has(r));return(s.length||i.length)&&console.error("[kingson] pipeline stages disagree with the database",{missingFromApp:s,notInDatabase:i}),{ok:!s.length&&!i.length,missing:s,extra:i}}var qe,re,Ua,Yt,Nt,Zt,Re,Pa,Ia,Ba,In,Wa,Xt,en,Bn,Ha,lt,tn,Ga,Ae,dt,ko,Fn,K=O(()=>{st();qe=[{id:"new",name:"New enquiry",short:"New",open:!0,group:"intake"},{id:"contacted",name:"Contacted",short:"Contacted",open:!0,group:"intake"},{id:"requirements",name:"Requirements / site visit",short:"Requirements",open:!0,group:"survey"},{id:"quoting",name:"Quote / BOQ preparing",short:"Quoting",open:!0,group:"quote"},{id:"quote_sent",name:"Quote sent",short:"Quote sent",open:!0,group:"quote"},{id:"followup",name:"Follow-up / awaiting decision",short:"Follow-up",open:!0,group:"chase"},{id:"on_hold",name:"On hold",short:"On hold",open:!0,group:"hold"},{id:"won",name:"Won",short:"Won",open:!1,group:"won"},{id:"lost",name:"Lost",short:"Lost",open:!1,group:"lost"}],re=Object.fromEntries(qe.map(e=>[e.id,e])),Ua=qe.filter(e=>e.open).map(e=>e.id),Yt=["low","normal","high","urgent"],Nt=["Structural steelwork","Roof steelwork and trusses","Fibre laser cutting","Balustrades and roller shutter doors","General metal fabrication","Mobile cranage","Other"],Zt=["phone","whatsapp","email","walk_in","referral","existing_customer","social_media","website","other"],Re={website:"Website",whatsapp:"WhatsApp",phone:"Phone",email:"Email",referral:"Referral",walk_in:"Walk-in",existing_customer:"Existing customer",social_media:"Social media",other:"Other"},Pa=[["unknown","Not asked yet"],["yes","Yes"],["no","No"]],Ia=[["","No preference"],["Phone","Phone"],["WhatsApp","WhatsApp"],["Email","Email"]],Ba=[["general","General"],["enquiry_response","Respond to enquiry"],["quote_followup","Quotation follow-up"],["customer_reply","Respond to customer"],["site_visit","Site visit"]];In=e=>{let t=String(e||"").trim().toLowerCase();return/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)?t:""},Wa=["draft","sent","discussed","accepted","rejected","superseded","expired"],Xt={draft:"Draft",sent:"Sent",discussed:"Customer responded",accepted:"Accepted",rejected:"Not accepted",superseded:"Superseded",expired:"Expired"},en=[["price","Price"],["competitor","Went with a competitor"],["timing","Timing"],["project_cancelled","Project cancelled"],["scope_changed","Scope changed"],["no_response","No response"],["other","Other"]],Bn=[["email","Email"],["whatsapp","WhatsApp"],["phone","Phone"],["meeting","Meeting"],["other","Other"]],Ha=["planning","in_progress","on_hold","complete","cancelled"],lt={planning:"Planning",in_progress:"In progress",on_hold:"On hold",complete:"Complete",cancelled:"Cancelled"},tn={enquiry:"Enquiry",note:"Note",call:"Call",whatsapp:"WhatsApp",email:"Email",meeting:"Meeting",site_visit:"Site visit",quote:"Quotation",stage_change:"Stage change",task:"Task",file:"File",won:"Won",lost:"Lost",reply:"Customer reply",on_hold:"On hold",system:"System"},Ga=["call","whatsapp","email","meeting","note"];Ae=e=>!!(e&&re[e.stage]?.open);dt=e=>Ae(e)&&!e.next_action_due;ko=e=>new Date(String(e).slice(0,10)+"T12:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"short",timeZone:"UTC"});Fn=(e,t)=>e.reduce((n,a)=>n+(Number(t(a))||0),0)});function qo(e){try{let t=e.split(".")[1],n=atob(t.replace(/-/g,"+").replace(/_/g,"/"));return JSON.parse(n).sub||null}catch{return null}}async function Eo(){let e=Ve(),t=e?.access_token?qo(e.access_token):null;if(!t)return ke=null,null;let a=(await y.select("profiles",`select=*&id=eq.${t}`))[0]||null;if(!a)throw ke=null,ue(null),new Error("This account has no profile in the CRM. Ask an administrator to set one up.");if(!a.active)throw ke=null,ue(null),new Error("This account has been deactivated.");return ke=a,ke}async function Ka(e,t){return ke=null,await An(e,t),null}async function za(){return await y.rpc("touch_crm_session"),await Eo(),Qa(),Va(y).catch(()=>{}),ke}async function pt(){await zt(),ke=null,Qa()}async function Ja(e,t){let n=Hn();if(!n)throw new Error("Sign out and back in, then try again.");try{await Mn(n,e)}catch(a){throw a?.status===400?Object.assign(new Error("Your current password is not right."),{field:"pw-current"}):a}await At(t,e)}var ke,So,ut,Wn,Qa,Hn,on=O(()=>{De();K();ke=null,So=new Set,ut=()=>ke,Wn=()=>!!(Ve()?.access_token&&ke),Qa=()=>So.forEach(e=>e(ke));Hn=()=>Ve()?.user?.email||""});function ce(e,{empty:t="\u2014"}={}){let n=Object.entries(e||{}).filter(([,a])=>a!=null);return n.length?n.map(([a,s])=>I(s,a)).join(" \xB7 "):t}function Ya(e){let t=Number(e);if(!Number.isFinite(t)||t===0)return e===0?"$0":"\u2014";let n=Math.abs(t);return n>=1e6?"$"+(t/1e6).toFixed(n%1e6?1:0)+"m":n>=1e3?"$"+(t/1e3).toFixed(n%1e3&&n<1e4?1:0)+"k":"$"+Math.round(t)}function rn(e){let t=Object.entries(e||{}).filter(([,n])=>n!=null);return t.length?t.map(([n,a])=>n==="USD"?Ya(a):`${n} ${Ya(a).slice(1)}`).join(" \xB7 "):""}function Pe(e){if(!e)return"";let t=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:Me,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:!1}).formatToParts(new Date(e)).map(n=>[n.type,n.value]));return`${t.year}-${t.month}-${t.day}T${t.hour}:${t.minute}`}function jt(e){return e?new Date(e+":00+02:00").toISOString():null}function B(e){if(!e)return"\u2014";let t=M(Ue(e));return t===null?"\u2014":t===0?"today":t===1?"tomorrow":t===-1?"yesterday":t>0?`in ${t} days`:`${-t} days ago`}function ln(e){let t=M(Ue(e));if(t===null||t>=0)return"";let n=Math.abs(t);return n===1?"1 day overdue":`${n} days overdue`}function es(e,t=""){let n=String(e||"").replace(/\D/g,"");return n.length<9?"":`https://wa.me/${n}${t?"?text="+encodeURIComponent(t):""}`}var To,I,Co,Do,Ao,Za,W,mt,ae,Ue,Xa,C,o,Ee,Ie,H=O(()=>{st();K();To=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}),I=(e,t="USD")=>{if(e==null||e==="")return"\u2014";let n=Number(e);return Number.isFinite(n)?t==="USD"?To.format(n):`${t} ${n.toLocaleString("en-US",{maximumFractionDigits:0})}`:"\u2014"};Co=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",timeZone:Me}),Do=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:Me}),Ao=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hour12:!1,timeZone:Me}),Za=e=>typeof e=="string"&&e.length===10?new Date(e+"T12:00:00Z"):new Date(e),W=e=>e?Co.format(Za(e)):"\u2014",mt=e=>e?Do.format(Za(e)):"\u2014",ae=e=>e?Ao.format(new Date(e)):"\u2014",Ue=e=>e?typeof e=="string"&&e.length===10?e:new Intl.DateTimeFormat("en-CA",{timeZone:Me}).format(new Date(e)):"";Xa=e=>String(e||"").split(/[\s.]+/).filter(Boolean).map(t=>t[0]).slice(0,2).join("").toUpperCase()||"?",C=(e,t,n)=>`${e} ${e===1?t:n||t+"s"}`,o=e=>String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),Ee=e=>"tel:"+String(e||"").replace(/[^\d+]/g,"");Ie=(e,t="",n="")=>{if(!e)return"";let a=[];return t&&a.push("subject="+encodeURIComponent(t)),n&&a.push("body="+encodeURIComponent(n)),`mailto:${e}${a.length?"?"+a.join("&"):""}`}});function Le(){try{return localStorage.getItem(Gn)==="1"}catch{return!1}}function ns(e){try{e?localStorage.setItem(Gn,"1"):localStorage.removeItem(Gn)}catch{}}var Gn,Lo,ge,cn=O(()=>{Gn="kingson.showDemo";Lo=()=>Le()?"":"is_demo=eq.false",ge=e=>{let t=Lo();return t?e?`${e}&${t}`:t:e}});async function as(e){let t=e.name.normalize("NFKC");if(!e.size||e.size>26214400)throw new Error("Choose a non-empty file no larger than 25 MB.");if(/[\x00-\x1f\x7f/\\]/.test(t)||t.length>180)throw new Error("Use a shorter filename without path or control characters.");let n=t.split(".").pop().toLowerCase(),a=new Uint8Array(await e.arrayBuffer()),s=(...p)=>p.every((d,f)=>a[f]===d),i=new TextDecoder().decode(a.subarray(0,1024)),r={pdf:"application/pdf",jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",webp:"image/webp",heic:"image/heic",dwg:"application/acad",dxf:"application/dxf",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xls:"application/vnd.ms-excel",doc:"application/msword",zip:"application/zip",txt:"text/plain",csv:"text/csv"},l=!1;if(n==="pdf"&&(l=i.startsWith("%PDF-")),(n==="jpg"||n==="jpeg")&&(l=s(255,216,255)),n==="png"&&(l=s(137,80,78,71,13,10,26,10)),n==="webp"&&(l=i.startsWith("RIFF")&&i.slice(8,12)==="WEBP"),n==="heic"&&(l=i.slice(4,8)==="ftyp"&&/heic|heix|mif1/.test(i.slice(8,32))),n==="dwg"&&(l=/^AC10\d\d/.test(i)),(n==="doc"||n==="xls")&&(l=s(208,207,17,224,161,177,26,225)),["txt","csv","dxf"].includes(n)){try{let p=new TextDecoder("utf-8",{fatal:!0}).decode(a);l=!p.includes("\0")&&(n!=="dxf"||/SECTION[\r\n]/.test(p))}catch{l=!1}n==="dxf"&&i.startsWith("AutoCAD Binary DXF")&&(l=!0)}if(["zip","docx","xlsx"].includes(n)&&s(80,75,3,4)){let p=new DataView(a.buffer),d=[],f=0;for(let _=0;_+46<=a.length;_++){if(p.getUint32(_,!0)!==33639248)continue;let T=p.getUint16(_+28,!0),q=p.getUint16(_+30,!0),A=p.getUint16(_+32,!0);if(_+46+T+q+A>a.length)throw new Error("The archive is damaged.");if(p.getUint16(_+8,!0)&1)throw new Error("Password-protected archives cannot be checked. Send individual documents.");let Q=new TextDecoder().decode(a.subarray(_+46,_+46+T));if(/(^|[\\/])\.\.([\\/]|$)|^[\\/]|^[a-z]:|\x00/i.test(Q)||/\.(exe|com|scr|msi|bat|cmd|ps1|vbs|js|jse|html?|svg|lnk|dll|hta|jar|zip|7z|rar)$/i.test(Q)||/vbaProject\.bin$/i.test(Q))throw new Error("Executable content, macros and nested archives are not accepted.");if(d.push(Q),f+=p.getUint32(_+24,!0),d.length>500||f>100*1024*1024)throw new Error("The archive expands beyond the safe limit.");_+=45+T+q+A}l=d.length>0&&(n==="zip"||d.includes("[Content_Types].xml")&&d.some(_=>_.startsWith(n==="docx"?"word/":"xl/")))}if(!r[n]||!l)throw new Error("The file contents do not match a supported drawing, document or image format.");return{name:t,mime:r[n],bytes:a}}var ss=O(()=>{});var Vn,os,No,u,Y=O(()=>{De();st();K();cn();De();ss();Vn="*",os=ie("next_action_due","asc"),No=`stage=in.(${Ua.join(",")})`,u={profiles:()=>y.select("profiles",`select=*&${ie("full_name")}`),me:e=>y.select("profiles",`select=*&${F("id",e)}`).then(t=>t[0]||null),opportunities:(e="")=>y.select("v_opportunity_state",ge(`select=${Vn}${/(^|&)order=/.test(e)?"":"&"+os}${e?"&"+e:""}`)),openOpportunities:()=>y.select("v_opportunity_state",ge(`select=${Vn}&${No}&${os}`)),opportunity:e=>y.select("v_opportunity_state",`select=${Vn}&${F("id",e)}`).then(t=>t[0]||null),createOpportunity:e=>y.insert("opportunities",e).then(t=>t[0]),findMatches:({phone:e,email:t,name:n,company:a})=>y.rpc("find_contact_matches",{p_phone:e||null,p_email:t||null,p_name:n||null,p_company:a||null}),createEnquiry:e=>y.rpc("create_enquiry",{p_full_name:e.fullName||null,p_phone:e.phone||null,p_email:e.email||null,p_description:e.description||null,p_title:e.title||null,p_company:e.company||null,p_contact_id:e.contactId||null,p_service:e.service||null,p_location:e.location||null,p_source:e.source||"phone",p_preferred_channel:e.preferredChannel||null,p_drawings:e.drawings||"unknown",p_owner_id:e.ownerId||null,p_next_action:e.nextAction||null,p_next_due:e.nextDue||null,p_force_new:!!e.forceNew}).then(t=>Array.isArray(t)?t[0]:t),search:(e,t=8)=>y.rpc("global_search",{p_q:e,p_include_demo:Le(),p_limit:t}),managementSummary:(e,t)=>y.rpc("management_summary",{p_from:e,p_to:t,p_include_demo:Le()}),closedPage:(e=0,t=40)=>y.select("v_opportunity_state",ge(`select=*&stage=in.(won,lost)&order=decided_at.desc.nullslast&limit=${t}&offset=${e}`)),outbox:(e=20)=>y.select("notification_outbox",`select=*&order=created_at.desc&limit=${e}`),updateOpportunity:(e,t)=>y.update("opportunities",F("id",e),t).then(n=>n[0]),setStage:(e,t)=>u.updateOpportunity(e,{stage:t}),recordQuote:(e,{amount:t,currency:n,preparedOn:a,validUntil:s,notes:i,reference:r,documentRef:l})=>y.rpc("record_quote",{p_opportunity_id:e,p_amount:t,p_currency:n||"USD",p_prepared_on:a||null,p_valid_until:s||null,p_notes:i||null,p_reference:r||null,p_document_ref:l||null}),markQuoteSent:(e,{sentAt:t,followUpOn:n,channel:a,notes:s})=>y.rpc("mark_quote_sent",{p_quote_id:e,p_sent_at:t||null,p_follow_up_on:n||null,p_channel:a||"email",p_notes:s||null}),logFollowUp:(e,{channel:t,notes:n,at:a,nextAction:s,nextDue:i})=>y.rpc("log_follow_up",{p_opportunity_id:e,p_channel:t,p_notes:n,p_at:a||null,p_next_action:s||null,p_next_due:i||null}),customerReplied:(e,{channel:t,notes:n,at:a})=>y.rpc("mark_customer_replied",{p_opportunity_id:e,p_channel:t,p_notes:n||null,p_at:a||null}),decide:(e,t,{on:n,value:a,reason:s,notes:i,reviewOn:r}={})=>y.rpc("decide_opportunity",{p_opportunity_id:e,p_outcome:t,p_on:n||null,p_value:a??null,p_reason:s||null,p_notes:i||null,p_review_on:r||null}),addWorkingDays:(e,t)=>y.rpc("add_working_days",{d:e,n:t}),settings:()=>y.select("crm_settings","select=*&limit=1").then(e=>e[0]||null),updateSettings:e=>y.update("crm_settings","id=eq.true",e).then(t=>t[0]),contacts:(e="",{offset:t=0,limit:n=50}={})=>{let a=ge(`select=*,companies(id,name)&${ie("full_name")}&limit=${n}&offset=${t}`);if(e){let s=encodeURIComponent(Un(`%${e}%`)),i=e.replace(/\D+/g,"").replace(/^(00)?263/,"").replace(/^0+/,""),r=i.length>=5?`,phone_norm.like.${encodeURIComponent(`*${i}*`)},whatsapp_norm.like.${encodeURIComponent(`*${i}*`)}`:"";a+=`&or=(full_name.ilike.${s},email.ilike.${s},phone.ilike.${s},whatsapp.ilike.${s},job_title.ilike.${s}${r})`}return y.select("contacts",a)},contact:e=>y.select("contacts",`select=*,companies(id,name,kind,town)&${F("id",e)}`).then(t=>t[0]||null),createContact:e=>y.insert("contacts",e).then(t=>t[0]),updateContact:(e,t)=>y.update("contacts",F("id",e),t).then(n=>n[0]),companies:()=>y.select("companies",ge(`select=*&${ie("name")}`)),company:e=>y.select("companies",`select=*&${F("id",e)}`).then(t=>t[0]||null),createCompany:e=>y.insert("companies",e).then(t=>t[0]),updateCompany:(e,t)=>y.update("companies",F("id",e),t).then(n=>n[0]),async findOrCreateCompany(e){let t=(e||"").trim();if(!t)return null;let n=await y.select("companies",`select=id,name&name=ilike.${encodeURIComponent(t)}&limit=1`);return n[0]?n[0]:u.createCompany({name:t})},activityFor:e=>y.select("activities",`select=*,profiles(full_name,initials)&${F("opportunity_id",e)}&${ie("occurred_at","desc")}`),activityForContact:e=>y.select("activities",`select=*,profiles(full_name,initials),opportunities(id,ref,title)&${F("contact_id",e)}&${ie("occurred_at","desc")}`),activityForProject:e=>y.select("activities",`select=*,profiles(full_name,initials)&${F("project_id",e)}&${ie("occurred_at","desc")}`),recentActivity:(e=12)=>y.select("activities",ge(`select=*,profiles(full_name,initials),opportunities(id,ref,title)&${ie("occurred_at","desc")}&limit=${e}`)),logActivity:e=>y.insert("activities",e).then(t=>t[0]),tasks:(e="")=>y.select("tasks",ge(`select=*,profiles!tasks_owner_id_fkey(full_name,initials),opportunities(id,ref,title,stage),contacts(id,full_name,phone,whatsapp,email)&${ie("due_date")}${e?"&"+e:""}`)),openTasks:()=>u.tasks("status=eq.open"),tasksFor:e=>u.tasks(F("opportunity_id",e)),createTask:e=>y.insert("tasks",e).then(t=>t[0]),updateTask:(e,t)=>y.update("tasks",F("id",e),t).then(n=>n[0]),completeTask:e=>u.updateTask(e,{status:"done"}),visits:(e="")=>y.select("site_visits",ge(`select=*,profiles(full_name,initials),opportunities(id,ref,title,company_id,companies(name))&${ie("scheduled_at")}${e?"&"+e:""}`)),upcomingVisits:()=>u.visits(`status=eq.scheduled&scheduled_at=gte.${new Date(Date.now()-864e5).toISOString()}`),visitsFor:e=>u.visits(F("opportunity_id",e)),createVisit:e=>y.insert("site_visits",e).then(t=>t[0]),updateVisit:(e,t)=>y.update("site_visits",F("id",e),t).then(n=>n[0]),quotes:(e="",{offset:t=0,limit:n=200}={})=>y.select("quotes",ge(`select=*,profiles:sent_by(full_name,initials),opportunities(id,ref,title,stage,next_action_due,company_id,companies(name))&order=prepared_on.desc,version.desc&limit=${n}&offset=${t}${e?"&"+e:""}`)),liveQuotes:()=>u.quotes("status=in.(sent,discussed)"),quotesFor:e=>u.quotes(F("opportunity_id",e)),createQuote:e=>y.insert("quotes",e).then(t=>t[0]),updateQuote:(e,t)=>y.update("quotes",F("id",e),t).then(n=>n[0]),projects:(e="")=>y.select("projects",ge(`select=*,companies(id,name),contacts(id,full_name,phone,email),profiles(full_name,initials),opportunities(id,ref)&${ie("created_at","desc")}${e?"&"+e:""}`)),project:e=>y.select("projects",`select=*,companies(id,name),contacts(id,full_name,phone,email,whatsapp),profiles(full_name,initials),opportunities(id,ref,title)&${F("id",e)}`).then(t=>t[0]||null),updateProject:(e,t)=>y.update("projects",F("id",e),t).then(n=>n[0]),convertToProject:(e,{name:t,startDate:n,targetDate:a}={})=>y.rpc("convert_to_project",{p_opportunity_id:e,p_name:t||null,p_start_date:n||null,p_target_date:a||null}),projectForOpportunity:e=>y.select("projects",`select=id,name,status&${F("opportunity_id",e)}`).then(t=>t[0]||null),enquiries:(e=50)=>y.select("enquiries",ge(`select=*&${ie("created_at","desc")}&limit=${e}`)),filesFor:(e,t)=>y.select("files",`select=*,profiles(full_name,initials)&${F(e,t)}&${ie("created_at","desc")}`),linkFileToQuote:(e,t)=>y.update("files",F("id",e),{quote_id:t}).then(n=>n[0]),async uploadFile(e,t){return await as(e),Rn(e,t)},downloadUrl:e=>Lt.signedUrl(Ht,e,120),metrics:()=>y.rpc("dashboard_metrics",{p_include_demo:Le()}),async dashboard(){let[e,t,n,a,s,i]=await Promise.all([u.metrics(),u.openOpportunities(),u.liveQuotes(),u.openTasks(),u.upcomingVisits(),u.recentActivity(10)]);return{metrics:e,open:t,liveQuotes:n,tasks:a,visits:s,recent:i}}}});var D,c,Lr,Nr,Z=O(()=>{D=(e,t=16)=>`<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true" focusable="false">${e}</svg>`,c={dashboard:e=>D('<rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',e),pipeline:e=>D('<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="11" rx="1.5"/><rect x="16" y="4" width="5" height="7" rx="1.5"/>',e),bell:e=>D('<path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',e),alert:e=>D('<path d="M12 3.5 2.6 19.2a1.4 1.4 0 0 0 1.2 2.1h16.4a1.4 1.4 0 0 0 1.2-2.1L12 3.5z"/><path d="M12 9.5v4.2"/><path d="M12 17.4h.01"/>',e),clock:e=>D('<circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.1 1.9"/>',e),check:e=>D('<path d="M20 6.5 9.4 17.1 4 11.7"/>',e),cross:e=>D('<path d="M18 6 6 18M6 6l12 12"/>',e),phone:e=>D('<path d="M21.5 16.9v2.6a1.8 1.8 0 0 1-2 1.8 17.8 17.8 0 0 1-7.7-2.8 17.5 17.5 0 0 1-5.4-5.4A17.8 17.8 0 0 1 3.6 5.4a1.8 1.8 0 0 1 1.8-2h2.6a1.8 1.8 0 0 1 1.8 1.5c.1.9.3 1.7.5 2.5a1.8 1.8 0 0 1-.4 1.9L8.8 10.4a14 14 0 0 0 5.2 5.2l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.2 1.6.4 2.5.5a1.8 1.8 0 0 1 1.5 1.8z"/>',e),whatsapp:e=>D('<path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.6-4.5a8.4 8.4 0 1 1 15.4-4.4z"/><path d="M9 9.3c.3-.5.6-.5.9-.5h.5c.2 0 .4.1.6.5l.6 1.4c.1.2 0 .4-.1.6l-.5.6a7 7 0 0 0 3 3l.6-.5c.2-.2.4-.2.6-.1l1.4.6c.4.2.5.4.5.6v.5c0 .3 0 .6-.5.9a2.5 2.5 0 0 1-2.4.2 11.6 11.6 0 0 1-4.6-4.6A2.5 2.5 0 0 1 9 9.3z"/>',e),mail:e=>D('<rect x="2.8" y="4.8" width="18.4" height="14.4" rx="2"/><path d="m3.4 6.4 8.6 6 8.6-6"/>',e),globe:e=>D('<circle cx="12" cy="12" r="8.8"/><path d="M3.4 12h17.2"/><path d="M12 3.2a13 13 0 0 1 0 17.6 13 13 0 0 1 0-17.6z"/>',e),users:e=>D('<path d="M16.5 20v-1.8a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.2V20"/><circle cx="9.8" cy="7.6" r="3.6"/><path d="M21 20v-1.8a3.6 3.6 0 0 0-2.7-3.5"/><path d="M15.4 4.2a3.6 3.6 0 0 1 0 7"/>',e),pin:e=>D('<path d="M20 10.4c0 5.5-8 11.2-8 11.2s-8-5.7-8-11.2a8 8 0 0 1 16 0z"/><circle cx="12" cy="10.2" r="2.8"/>',e),doc:e=>D('<path d="M14 2.8H7.2a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2V7.8z"/><path d="M14 2.8v5h4.8"/><path d="M8.8 13h6.4M8.8 16.6h4.4"/>',e),calendar:e=>D('<rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M16 3v4M8 3v4M3.4 10.2h17.2"/>',e),note:e=>D('<path d="M4.4 4.6h15.2v10.2l-4.8 4.6H4.4z"/><path d="M19.6 14.8h-4.8v4.6"/>',e),arrowRight:e=>D('<path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5"/>',e),chevron:e=>D('<path d="m9 5.5 6.5 6.5L9 18.5"/>',e),plus:e=>D('<path d="M12 5.5v13M5.5 12h13"/>',e),refresh:e=>D('<path d="M20.5 11a8.5 8.5 0 1 0-.6 5"/><path d="M20.5 4.8V11h-6.2"/>',e),menu:e=>D('<path d="M4 7h16M4 12h16M4 17h16"/>',e),move:e=>D('<path d="M9 6.5 12 3.5l3 3M15 17.5 12 20.5l-3-3M6.5 9 3.5 12l3 3M17.5 9l3 3-3 3"/>',e),briefcase:e=>D('<rect x="2.8" y="7" width="18.4" height="13.5" rx="2"/><path d="M8.5 7V5.2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7"/><path d="M2.8 12.5h18.4"/>',e),file:e=>D('<path d="M14 2.8H7.2a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2V7.8z"/><path d="M14 2.8v5h4.8"/>',e),upload:e=>D('<path d="M21 15.5v3.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.2"/><path d="M7.5 8.5 12 4l4.5 4.5"/><path d="M12 4v12"/>',e),download:e=>D('<path d="M21 15.5v3.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.2"/><path d="M7.5 11.5 12 16l4.5-4.5"/><path d="M12 16V4"/>',e),search:e=>D('<circle cx="10.8" cy="10.8" r="7"/><path d="m20.5 20.5-4.7-4.7"/>',e),logout:e=>D('<path d="M9.5 20.5H5.4a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2h4.1"/><path d="m15.5 16.5 4.5-4.5-4.5-4.5"/><path d="M20 12H9.5"/>',e),shield:e=>D('<path d="M12 21.3s7.5-3.6 7.5-9.3V5.6L12 2.8 4.5 5.6v6.4c0 5.7 7.5 9.3 7.5 9.3z"/><path d="m9 12 2.2 2.2L15.4 10"/>',e),edit:e=>D('<path d="M16.5 3.9a2.1 2.1 0 0 1 3 3L8.2 18.2l-4 1 1-4z"/>',e),filter:e=>D('<path d="M3.5 5.5h17l-6.6 7.8v5.4l-3.8 2v-7.4z"/>',e),building:e=>D('<path d="M4 20.5V5.2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v15.3"/><path d="M15 10.5h3a2 2 0 0 1 2 2v8"/><path d="M2.6 20.5h18.8"/><path d="M7.5 7.5h4M7.5 11h4M7.5 14.5h4"/>',e),task:e=>D('<rect x="3.4" y="4.5" width="17.2" height="16" rx="2"/><path d="M8 3v3M16 3v3"/><path d="m8.6 13.2 2.2 2.2 4.6-4.6"/>',e),trend:e=>D('<path d="M3.5 16.5 9 11l4 4 7.5-7.5"/><path d="M14.5 7.5h6v6"/>',e)},Lr={Phone:c.phone,WhatsApp:c.whatsapp,Email:c.mail,Website:c.globe,Referral:c.users},Nr={enquiry:c.bell,call:c.phone,whatsapp:c.whatsapp,email:c.mail,visit:c.pin,quote:c.doc,stage:c.move,note:c.note,task:c.clock}});function Ke(e){let t=xe(e);if(t.level==="closed")return Oo(e.stage);if(t.level==="clear")return`<span class="pill pill-quiet">${o(t.label)}</span>`;let n={overdue:c.alert(13),unbooked:c.alert(13),today:c.clock(13),soon:c.clock(13),held:c.clock(13)}[t.level];return`<span class="pill pill-${o(t.level)}">${n}${o(t.label)}</span>`}function Te(e,{text:t="",size:n="sm"}={}){if(!e)return"";let a=[];e.phone&&a.push(`<a class="btn-ghost btn-${n}" href="${o(Ee(e.phone))}">${c.phone(14)}<span>Call</span></a>`);let s=es(e.whatsapp||e.phone,t);return s&&a.push(`<a class="btn-ghost btn-${n}" href="${o(s)}" target="_blank" rel="noopener">${c.whatsapp(14)}<span>WhatsApp</span></a>`),e.email&&a.push(`<a class="btn-ghost btn-${n}" href="${o(Ie(e.email))}">${c.mail(14)}<span>Email</span></a>`),a.join("")}function cs(e,{showStage:t=!0}={}){return`
    <li class="att">
      <a class="att-link" href="#/opportunity/${o(e.id)}">
        <span class="att-head">
          <span class="att-title">${o(e.title)}</span>
          ${Ke(e)}
          ${Je(e.priority)}
        </span>
        <span class="att-meta">
          ${o(e.company_name||e.contact_name||"No company")} \xB7 ${o(e.ref)}
          ${(()=>{let n=pe(e);return n.amount==null?' \xB7 <span class="dim">not quoted yet</span>':` \xB7 <span class="num">${o(I(n.amount,n.currency))}</span>`})()}
          ${t?` \xB7 ${o(re[e.stage]?.name||e.stage)}`:""}
        </span>
        <span class="att-action">
          ${e.next_action?`${c.arrowRight(14)}<span>${o(e.next_action)}</span>${e.next_action_due?`<span class="att-when">${o(W(e.next_action_due))}</span>`:""}`:`${c.alert(14)}<span>Nobody has booked a next action</span>`}
        </span>
      </a>
      <span class="att-owner">${U(e.owner_name?{full_name:e.owner_name,initials:e.owner_initials}:null,28)}</span>
    </li>`}var b,Ot,k,ls,zn,we,Oo,ze,Mo,ht,ft,Je,U,ds,us,yt,un,se=O(()=>{H();K();Z();b=(e,t,{note:n="",action:a="",tight:s=!1,id:i=""}={})=>`
  <section class="card${s?" card-tight":""}"${i?` id="${o(i)}"`:""}>
    ${e?`<header class="card-head">
      <h2 class="card-title">${o(e)}</h2>
      ${n?`<p class="card-note">${o(n)}</p>`:""}
      ${a}
    </header>`:""}
    ${t}
  </section>`,Ot=({label:e,value:t,unit:n="",foot:a="",tone:s="",href:i=""})=>{let r=`
    <p class="stat-label">${o(e)}</p>
    <p class="stat-value num">${o(t)}${n?`<span class="stat-unit">${o(n)}</span>`:""}</p>
    ${a?`<p class="stat-foot">${a}</p>`:""}`;return i?`<a class="stat${s?" stat-"+s:""}" href="${o(i)}">${r}
         <span class="stat-go" aria-hidden="true">${c.arrowRight(15)}</span></a>`:`<div class="stat${s?" stat-"+s:""}">${r}</div>`},k=(e,t="",{tone:n="ok"}={})=>`
  <div class="empty">
    <span class="empty-mark empty-${o(n)}" aria-hidden="true">${n==="ok"?c.check(20):c.note(20)}</span>
    <p class="empty-text">${o(e)}</p>
    ${t?`<p class="empty-sub">${o(t)}</p>`:""}
  </div>`,ls=(e=3)=>`
  <div class="skel" role="status" aria-live="polite">
    <span class="sr-only">Loading\u2026</span>
    ${Array.from({length:e},()=>'<span class="skel-row"></span>').join("")}
  </div>`,zn=(e,{retry:t=!0}={})=>`
  <div class="err" role="alert">
    <span class="err-mark" aria-hidden="true">${c.alert(20)}</span>
    <p class="err-text">${o(e)}</p>
    ${t?'<button type="button" class="btn-ghost btn-sm" data-retry>Try again</button>':""}
  </div>`,we=e=>`<div class="tbl-wrap">${e}</div>`;Oo=e=>e==="won"?`<span class="pill pill-won">${c.check(13)}Won</span>`:e==="lost"?`<span class="pill pill-lost">${c.cross(13)}Lost</span>`:`<span class="pill pill-quiet">${o(re[e]?.name||e)}</span>`,ze=e=>`<span class="src">${(c[Mo[e]]||c.globe)(13)}${o(Re[e]||e)}</span>`,Mo={website:"globe",whatsapp:"whatsapp",phone:"phone",email:"mail",referral:"users",walk_in:"pin",other:"note"},ht=e=>{let t=e==="accepted"?"won":e==="rejected"||e==="expired"||e==="superseded"?"lost":e==="draft"?"today":"quiet",n=e==="accepted"?c.check(13):e==="rejected"||e==="expired"||e==="superseded"?c.cross(13):c.doc(13);return`<span class="pill pill-${t}">${n}${o(Xt[e]||e)}</span>`},ft=e=>`<span class="pill pill-${e==="complete"?"won":e==="cancelled"?"lost":e==="on_hold"?"today":"quiet"}">${o(lt[e]||e)}</span>`,Je=e=>e==="urgent"?`<span class="pill pill-overdue">${c.alert(13)}Urgent</span>`:e==="high"?'<span class="pill pill-today">High</span>':e==="low"?'<span class="pill pill-quiet">Low</span>':"",U=(e,t=26)=>e?`<span class="avatar" role="img" style="--s:${t}px" title="${o(e.full_name||"")}" aria-label="${o(e.full_name||"Assigned")}">${o(e.initials||Xa(e.full_name))}</span>`:`<span class="avatar avatar-none" role="img" style="--s:${t}px" title="Unassigned" aria-label="Unassigned">?</span>`;ds=e=>`
  <li class="feed-row">
    <span class="feed-ic">${(c[us[e.kind]]||c.note)(14)}</span>
    <span class="feed-body">
      ${e.opportunities?`<a class="feed-link" href="#/opportunity/${o(e.opportunities.id)}">${o(e.opportunities.title)}</a>`:""}
      <span class="feed-text">${o(e.body)}</span>
    </span>
    <span class="feed-when">${o(e.profiles?.initials||"\u2014")} \xB7 ${o(B(e.occurred_at))}</span>
  </li>`,us={enquiry:"bell",note:"note",call:"phone",whatsapp:"whatsapp",email:"mail",meeting:"users",site_visit:"pin",quote:"doc",stage_change:"move",task:"clock",file:"file",won:"check",lost:"cross",system:"refresh",reply:"mail",on_hold:"clock"},yt=e=>e.length?`
  <ol class="timeline">
    ${e.map(t=>`
      <li class="tl">
        <span class="tl-ic tl-${o(t.kind)}">${(c[us[t.kind]]||c.note)(14)}</span>
        <span class="tl-body">
          <span class="tl-kind">${o(tn[t.kind]||t.kind)}</span>
          <span class="tl-text">${o(t.body)}</span>
          ${t.opportunities?`<a class="tl-ref" href="#/opportunity/${o(t.opportunities.id)}">${o(t.opportunities.ref)} \xB7 ${o(t.opportunities.title)}</a>`:""}
        </span>
        <span class="tl-when">
          <span class="tl-date num">${o(W(t.occurred_at))}</span>
          <span class="tl-rel">${o(B(t.occurred_at))}${t.profiles?.initials?" \xB7 "+o(t.profiles.initials):""}</span>
        </span>
      </li>`).join("")}
  </ol>`:k("Nothing logged yet.","Calls, visits and quotations appear here as they happen.",{tone:"quiet"}),un=e=>{if(!e)return'<span class="fu-date fu-none">\u2014</span><span class="fu-rel is-late">not booked</span>';let t=ln(e);return`<span class="fu-date num">${o(W(e))}</span>
          <span class="fu-rel${t?" is-late":""}">${o(t||B(e))}</span>`}});function Ro(e){let t={};for(let n of e.querySelectorAll("input, select, textarea"))n.name&&(t[n.name]=n.type==="checkbox"?n.checked:n.value.trim());return t}function Ze(e,t,n){let a=e.querySelector(`[data-err-for="${t}"]`),s=e.querySelector("#"+CSS.escape(t));a&&(a.textContent=n||"",a.hidden=!n),s&&(s.classList.toggle("is-bad",!!n),n?s.setAttribute("aria-invalid","true"):s.removeAttribute("aria-invalid"))}function Jn(e){e.querySelectorAll("[data-err-for]").forEach(t=>{t.textContent="",t.hidden=!0}),e.querySelectorAll(".is-bad").forEach(t=>{t.classList.remove("is-bad"),t.removeAttribute("aria-invalid")})}function w(e,t="ok"){gt||(gt=document.createElement("div"),gt.className="toasts",gt.setAttribute("aria-live","polite"),document.body.appendChild(gt));let n=document.createElement("p");n.className=`toast toast-${t}`,n.innerHTML=`${t==="bad"?c.alert(15):c.check(15)}<span>${o(e)}</span>`,gt.appendChild(n),setTimeout(()=>{n.classList.add("is-out"),setTimeout(()=>n.remove(),260)},t==="bad"?5200:2800)}function J({title:e,sub:t="",body:n,submitLabel:a="Save",onSubmit:s,width:i=520}){pn&&pn();let r=document.activeElement,l=document.createElement("div");l.className="modal",l.innerHTML=`
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="dlg-h" style="--w:${i}px">
      <form novalidate>
        <h2 class="modal-title display" id="dlg-h">${o(e)}</h2>
        ${t?`<p class="modal-sub">${o(t)}</p>`:""}
        <div class="modal-body">${n}</div>
        <p class="modal-err" role="alert" hidden></p>
        <div class="modal-foot">
          <button type="button" class="btn-ghost btn-sm" data-cancel>Cancel</button>
          <button type="submit" class="btn btn-sm" data-save>${o(a)}</button>
        </div>
      </form>
    </div>`,document.body.appendChild(l),document.body.classList.add("is-modal");let p=l.querySelector("form"),d=l.querySelector(".modal-err"),f=l.querySelector("[data-save]");(l.querySelector("input:not([type=hidden]), select, textarea")||f).focus();let T=A=>{if(A.key==="Escape"){A.preventDefault(),q();return}if(A.key!=="Tab")return;let Q=[...l.querySelectorAll("input, select, textarea, button, [href]")].filter(E=>!E.disabled&&E.offsetParent!==null);if(!Q.length)return;let[g,X]=[Q[0],Q[Q.length-1]];A.shiftKey&&document.activeElement===g?(A.preventDefault(),X.focus()):!A.shiftKey&&document.activeElement===X&&(A.preventDefault(),g.focus())};function q(){document.removeEventListener("keydown",T,!0),l.remove(),document.body.classList.remove("is-modal"),pn=null,r&&document.contains(r)&&r.focus()}return document.addEventListener("keydown",T,!0),l.querySelector("[data-cancel]").addEventListener("click",q),l.addEventListener("mousedown",A=>{A.target===l&&q()}),p.addEventListener("submit",async A=>{A.preventDefault(),Jn(l),d.hidden=!0,f.disabled=!0;let Q=f.textContent;f.textContent="Saving\u2026";try{await s(Ro(p),l),q()}catch(g){g?.field?(Ze(l,g.field,g.message),l.querySelector("#"+CSS.escape(g.field))?.focus()):(d.textContent=g?.message||"That could not be saved.",d.hidden=!1),f.disabled=!1,f.textContent=Q}}),pn=q,q}function V(e,...t){typeof e=="function"&&setTimeout(()=>{Promise.resolve(e(...t)).catch(n=>console.error("[kingson] refresh after save failed",n))},0)}var m,P,z,wt,ne,Ye,R,v,bt,gt,pn,j,de=O(()=>{H();Z();m=(e,t,n,{hint:a="",wide:s=!1}={})=>`
  <div class="field${s?" field-wide":""}">
    <label for="${o(e)}">${o(t)}</label>
    ${n}
    ${a?`<p class="field-hint">${o(a)}</p>`:""}
    <p class="field-err" data-err-for="${o(e)}" hidden></p>
  </div>`,P=(e,t="",n="")=>`<input class="inp" id="${o(e)}" name="${o(e)}" type="text" value="${o(t)}" ${n}>`,z=(e,t="",n=3,a="")=>`<textarea class="inp" id="${o(e)}" name="${o(e)}" rows="${n}" ${a}>${o(t)}</textarea>`,wt=(e,t="",n="")=>`<input class="inp" id="${o(e)}" name="${o(e)}" type="number" inputmode="decimal" value="${t??""}" ${n}>`,ne=(e,t="",n="")=>`<input class="inp" id="${o(e)}" name="${o(e)}" type="date" value="${o(t)}" ${n}>`,Ye=(e,t="",n="")=>`<input class="inp" id="${o(e)}" name="${o(e)}" type="datetime-local" value="${o(t)}" ${n}>`,R=(e,t,n="",a="")=>`
  <select class="sel" id="${o(e)}" name="${o(e)}" ${a}>
    ${t.map(s=>{let[i,r]=Array.isArray(s)?s:[s,s];return`<option value="${o(i)}"${String(i)===String(n??"")?" selected":""}>${o(r)}</option>`}).join("")}
  </select>`;v=e=>e===""||e===void 0?null:e,bt=e=>e===""||e===null||e===void 0?null:Number(e);gt=null;pn=null;j=(e,t)=>Object.assign(new Error(t),{field:e})});var hs={};ee(hs,{mount:()=>Wo,render:()=>Po,sub:()=>Ho,title:()=>Uo});async function Po(){let{metrics:e,open:t,liveQuotes:n,tasks:a,visits:s,recent:i}=await u.dashboard(),r=t.filter(ve),l=t.filter(an),p=t.filter(dt),d=t.filter($=>$.stage==="new"),f=t.filter(sn),_=e.won_count+e.lost_count,T=_?Math.round(e.won_count/_*100):null,q=a.filter($=>$.due_date&&M($.due_date)<=0),A=s.filter($=>{let G=M($.scheduled_at);return G!==null&&G>=0&&G<=7}),Q=`
    <div class="stats">
      ${Ot({label:"Open enquiries",value:String(e.open_count),foot:e.quoted_pipeline_count?`<span class="num">${o(ce(e.quoted_pipeline))}</span> quoted and awaiting a decision`:'<span class="dim">No quotation out</span>',href:"#/pipeline"})}
      ${Ot({label:"Not quoted yet",value:String(e.unquoted_count),tone:e.unquoted_count?"warn":"",foot:e.unquoted_count?"Open, with no quotation recorded":e.open_count?"Every open job has a quotation":"No open jobs",href:"#/pipeline"})}
      ${Ot({label:"Follow-ups due",value:String(e.follow_ups_due_count),tone:e.overdue_count?"danger":"",foot:e.overdue_count?`${o(C(e.overdue_count,"overdue"))}${e.overdue_quoted_count?` \xB7 <span class="num">${o(ce(e.overdue_quoted_value))}</span> quoted value overdue`:""}`:e.follow_ups_due_count?"Due today, none overdue":"Nothing past its date",href:"#/followups"})}
      ${Ot({label:"Quotes awaiting a decision",value:String(e.awaiting_decision_count),foot:e.quoted_pipeline_count?`<span class="num">${o(ce(e.quoted_pipeline))}</span> out`:"None out at the moment",href:"#/quotes"})}
    </div>`,g=[...r,...p,...l,...d].filter(($,G,Ge)=>Ge.findIndex(Tn=>Tn.id===$.id)===G).sort(($,G)=>xe(G).sort-xe($).sort).slice(0,12),X=b("Needs attention",g.length?`<ul class="att-list">${g.map($=>cs($)).join("")}</ul>`:k("Nothing is overdue and nothing is unbooked.","Every open enquiry has a next action with a date on it."),{note:"Overdue, unbooked, due today or unanswered \u2014 in any stage",tight:!0}),E=b("Today and the week ahead",`
    <div class="two-up">
      <div>
        <p class="sub-h">${c.pin(14)} Site visits</p>
        ${A.length?`<ul class="mini">${A.slice(0,5).map($=>`
          <li><a href="#/opportunity/${o($.opportunities?.id||"")}">
            <span class="mini-main">${o($.opportunities?.title||"Visit")}</span>
            <span class="mini-sub">${o(ae($.scheduled_at))}${$.location?" \xB7 "+o($.location):""}</span>
          </a><span class="mini-side">${U($.profiles,24)}</span></li>`).join("")}</ul>`:'<p class="mini-none">No visits booked in the next seven days.</p>'}
      </div>
      <div>
        <p class="sub-h">${c.clock(14)} Calls and follow-ups due</p>
        ${q.length?`<ul class="mini">${q.slice(0,5).map($=>`
          <li><a href="${$.opportunities?"#/opportunity/"+o($.opportunities.id):"#/tasks"}">
            <span class="mini-main">${o($.title)}</span>
            <span class="mini-sub${M($.due_date)<0?" is-late":""}">${o(B($.due_date))}${$.channel?" \xB7 "+o($.channel):""}</span>
          </a><span class="mini-side">${U($.profiles,24)}</span></li>`).join("")}</ul>`:'<p class="mini-none">Nothing due today.</p>'}
      </div>
    </div>`,{note:`${C(A.length,"visit")} \xB7 ${C(q.length,"task")}`}),_e=qe.filter($=>$.open).map($=>{let G=t.filter(Tn=>Tn.stage===$.id),Ge=Qe(G);return{s:$,n:G.length,value:Ge.by.USD||0,label:rn(Ge.by)}}),He=Math.max(1,..._e.map($=>$.value)),Wt=b("Open enquiries by stage",`
    <ul class="funnel">
      ${_e.map($=>`
        <li class="funnel-row${$.n?"":" is-empty"}">
          <a class="funnel-label" href="#/pipeline">${o($.s.name)}</a>
          <span class="funnel-track"><span class="funnel-bar" style="--w:${($.value/He*100).toFixed(1)}%"></span></span>
          <span class="funnel-n num">${$.n||"\u2014"}</span>
          <span class="funnel-v num">${$.label?o($.label):"\u2014"}</span>
        </li>`).join("")}
    </ul>
    <p class="funnel-key">Bar length is quoted value (USD). The number beside it is the count, quoted or not.</p>`,{note:"Open stages only"}),qn=b("Decided",`
    <div class="won-lost">
      <div><p class="wl-n num">${e.won_count}</p><p class="wl-l">${c.check(13)} Won</p>
        <p class="wl-v num">${o(ce(e.won_value))}</p></div>
      <div><p class="wl-n num">${e.lost_count}</p><p class="wl-l">${c.cross(13)} Lost</p>
        <p class="wl-v">&nbsp;</p></div>
      <div><p class="wl-n num">${T===null?"\u2014":T+"%"}</p><p class="wl-l">Win rate</p>
        <p class="wl-v">of ${_} decided</p></div>
    </div>
    <p class="funnel-key">Won this month: <span class="num">${o(ce(e.won_value_this_month,{empty:"nothing yet"}))}</span>${e.on_hold_count?` \xB7 ${o(C(e.on_hold_count,"job"))} on hold`:""}</p>`,{note:"Accepted values, as recorded when each job was won"}),En=b("Quotations awaiting a decision",n.length?we(`
    <table class="tbl">
      <thead><tr>
        <th scope="col">Quotation</th><th scope="col">Enquiry</th>
        <th scope="col" class="ta-r">Amount</th><th scope="col">Sent</th><th scope="col">Chase</th>
      </tr></thead>
      <tbody>
        ${n.map($=>{let G=$.opportunities,Ge=G&&!G.next_action_due;return`<tr${Ge?' class="tr-risk"':""}>
            <td><a class="lnk" href="#/opportunity/${o(G?.id||"")}">${o($.reference)}${$.version>1?` <span class="rev">rev ${$.version}</span>`:""}</a></td>
            <td><span class="td-main">${o(G?.title||"\u2014")}</span><span class="td-sub">${o(G?.companies?.name||"")}</span></td>
            <td class="ta-r num">${o(I($.amount,$.currency))}</td>
            <td><span class="td-main num">${o(W($.sent_on))}</span><span class="td-sub">${o(B($.sent_on))}</span></td>
            <td>${Ge?`<span class="pill pill-overdue">${c.alert(13)}No chase booked</span>`:M(G?.next_action_due)<0?`<span class="pill pill-overdue">${c.alert(13)}${o(W(G?.next_action_due))}</span>`:`<span class="pill pill-quiet">${o(W(G?.next_action_due))}</span>`}</td>
          </tr>`}).join("")}
      </tbody>
    </table>`):k("No quotations are out."),{note:f.length?`${C(f.length,"quotation")} overdue for a follow-up`:"Every one has a follow-up booked"}),nt={};for(let $ of t)nt[$.source]=(nt[$.source]||0)+1;let x=b("Where enquiries arrive",Object.keys(nt).length?`
    <ul class="srcs">
      ${Object.entries(nt).sort(($,G)=>G[1]-$[1]).map(([$,G])=>`<li class="srcs-row">${ze($)}<span class="srcs-n num">${G}</span></li>`).join("")}
    </ul>
    <p class="funnel-key">Open enquiries only. Website enquiries arrive here by themselves.</p>`:k("No open enquiries yet.","",{tone:"quiet"})),$o=b("Recent activity",i.length?`<ul class="feed">${i.map(ds).join("")}</ul>`:k("Nothing logged yet.","",{tone:"quiet"}),{tight:!0});return`
    ${Q}
    <div class="grid grid-main">
      <div class="col-wide">${X}${E}${En}${Bo()}</div>
      <div class="col-side">${Wt}${qn}${x}${$o}</div>
    </div>`}function Fo(e){let t=e.avg_hours_to_first_response,n=(a,s)=>`<div class="mgmt-fig"><b class="num">${a}</b><span>${s}</span></div>`;return`
    <div class="mgmt-grid" style="margin-top:12px">
      ${n(e.enquiries,"enquiries received")}
      ${n(e.quotes_sent,`quotations sent \xB7 <span class="num">${o(ce(e.quoted_value,{empty:"\u2014"}))}</span>`)}
      ${n(e.won,`won \xB7 <span class="num">${o(ce(e.won_value,{empty:"\u2014"}))}</span>`)}
      ${n(e.lost,"lost")}
      ${n(e.win_rate_quoted==null?"\u2014":e.win_rate_quoted+"%","win rate of quoted jobs decided")}
      ${n(t==null?"\u2014":t<48?t+" h":(t/24).toFixed(1)+" days","average time to first response")}
      ${n(e.avg_days_to_quote==null?"\u2014":e.avg_days_to_quote+" days","average time to a quotation")}
    </div>
    <div class="mgmt-cols">
      <div><p class="mgmt-h">Where they came from</p>${Yn(e.by_source,a=>Re[a]||a)}</div>
      <div><p class="mgmt-h">What they asked for</p>${Yn(e.by_service)}</div>
      <div><p class="mgmt-h">Why jobs were lost</p>${Yn(e.lost_reasons,a=>Io[a]||a)}</div>
    </div>`}async function ps(e){let t=e.querySelector("[data-mgmt]");if(!t)return;let n=$t;try{let a=await u.managementSummary(ms[$t].from(),te());n===$t&&(t.innerHTML=Fo(a))}catch{t.innerHTML='<p class="mini-none">The summary is not available yet. It needs the 2026-09-25 database update.</p>'}}function Wo(e){ps(e),e.addEventListener("click",t=>{let n=t.target.closest("[data-period]");!n||n.dataset.period===$t||($t=n.dataset.period,e.querySelectorAll("[data-period]").forEach(a=>a.setAttribute("aria-pressed",String(a===n))),ps(e))})}function Ho(){return`<span class="sub-quiet">${o(W(te()))}</span>`}var Uo,Io,ms,$t,Bo,Yn,fs=O(()=>{Y();K();H();se();Z();Uo="Dashboard";Io=Object.fromEntries(en),ms={week:{label:"Last 7 days",from:()=>ct(te(),-6)},month:{label:"This month",from:()=>te().slice(0,8)+"01"},q:{label:"Last 90 days",from:()=>ct(te(),-89)}},$t="month",Bo=()=>b("How the business is doing",`
    <div class="period-tabs" role="group" aria-label="Period">
      ${Object.entries(ms).map(([e,t])=>`<button type="button" data-period="${e}" aria-pressed="${e===$t}">${o(t.label)}</button>`).join("")}
    </div>
    <div data-mgmt aria-live="polite"><p class="mini-none">Counting\u2026</p></div>`,{note:"Demonstration records are left out"}),Yn=(e,t=n=>n)=>{let n=Object.entries(e||{}).sort((a,s)=>s[1]-a[1]);return n.length?`<ul class="mgmt-list">${n.map(([a,s])=>`<li><span>${o(t(a))}</span><span class="num">${s}</span></li>`).join("")}</ul>`:'<p class="mini-none">None</p>'}});var ws={};ee(ws,{filesCard:()=>Xe,mountFiles:()=>et,saveFile:()=>gs});function et(e,t,n,a){e.addEventListener("change",async s=>{let i=s.target.closest("[data-upload]");if(!i||!i.files?.length)return;let r=i.files[0];if(i.value="",r.size>Go){w(`${r.name} is ${ys(r.size)}. The limit is 25 MB \u2014 send larger drawing sets by transfer link.`,"bad");return}let l=e.querySelector(".file-pick span"),p=l?.textContent;l&&(l.textContent="Uploading\u2026");try{let d=await u.uploadFile(r,t,n?.id);await u.logActivity({opportunity_id:t.opportunity_id||null,project_id:t.project_id||null,contact_id:t.contact_id||null,kind:"file",body:`File added: ${r.name}`,actor_id:n?.id||null}),w("Uploaded. The file stays private until its security scan completes."),V(a)}catch(d){w(d.message||"That file could not be uploaded.","bad"),l&&(l.textContent=p)}}),e.addEventListener("click",async s=>{let i=s.target.closest("[data-file]");if(!i)return;let r=i.dataset.name||"file",l=i.parentElement?.querySelector(".mini-side"),p=l?.innerHTML;l&&(l.textContent="\u2026");try{await gs(i.dataset.file,r)}catch(d){w(d.message||"That file could not be opened.","bad")}finally{l&&p!==void 0&&(l.innerHTML=p)}})}async function gs(e,t="file"){let n=await u.downloadUrl(e),a=await fetch(n);if(!a.ok)throw new Error(`That file could not be fetched (${a.status}).`);let s=await a.blob(),i=URL.createObjectURL(s),r=document.createElement("a");r.href=i,r.download=t,r.rel="noopener",document.body.appendChild(r),r.click(),r.remove(),setTimeout(()=>URL.revokeObjectURL(i),3e4)}var Go,ys,Xe,Mt=O(()=>{Y();H();se();Z();de();Go=25*1024*1024,ys=e=>!e&&e!==0?"":e>=1048576?(e/1048576).toFixed(1)+" MB":e>=1024?Math.round(e/1024)+" KB":e+" B",Xe=e=>b("Files",e.length?`
  <ul class="mini files">
    ${e.map(t=>`<li>
      <button type="button" class="mini-btn" data-file="${o(t.path)}" data-name="${o(t.name)}"${t.scan_status!=="clean"?" disabled":""}>
        <span class="mini-main">${c.file(13)}${o(t.name)}</span>
        <span class="mini-sub">${o(ys(t.size_bytes))} \xB7 ${o(W(t.created_at))}${t.profiles?.initials?" \xB7 "+o(t.profiles.initials):""} \xB7 ${t.scan_status==="clean"?"Scanned":t.scan_status==="blocked"?"Blocked by antivirus":t.scan_status==="error"?"Scan unavailable \u2014 contact the administrator":"Awaiting security scan"}</span>
      </button>
      <span class="mini-side">${c.download(15)}</span>
    </li>`).join("")}
  </ul>`:k("No files yet.","Drawings, BOQs and quotation PDFs go here.",{tone:"quiet"}),{tight:!0,action:`<label class="btn-ghost btn-xs file-pick">
      ${c.upload(13)}<span>Upload</span>
      <input type="file" data-upload hidden
             accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.dwg,.dxf,.xlsx,.xls,.docx,.doc,.zip,.csv,.txt">
    </label>`})});async function bs(e=te()){try{let t=await u.settings();return await u.addWorkingDays(e,t?.quote_followup_working_days??3)}catch{return""}}function $s({opp:e,quotes:t=[],onDone:n}){let a=(t.reduce((i,r)=>Math.max(i,r.version||0),0)||0)+1,s=t.find(i=>i.version===a-1);J({title:a>1?`Record revision ${a}`:"Record the quotation",sub:`${e.ref} \u2014 ${e.title}`,width:580,submitLabel:"Record quotation",body:`
      <div class="field-row">
        ${m("amount","Quoted amount",wt("amount",s?.amount??"",'required min="0" step="0.01"'),{hint:"The figure on the quotation you are sending \u2014 not an estimate."})}
        ${m("currency","Currency",R("currency",Vo,s?.currency||e.currency||"USD"))}
      </div>
      <div class="field-row">
        ${m("reference","Quotation number",P("reference","",`placeholder="Leave blank for Q-${o(String(e.ref).replace(/\D/g,""))}-${a}"`),{hint:"Only if your quotation already carries its own number."})}
        ${m("prepared_on","Date on the quotation",ne("prepared_on",te()))}
      </div>
      <div class="field-row">
        ${m("valid_until","Valid until",ne("valid_until",""))}
        ${m("document_ref","Document / where it is filed",P("document_ref","",'placeholder="Q-2445-1.pdf in Quotes 2026"'))}
      </div>
      ${m("notes",a>1?"What changed in this revision":"Notes",z("notes","",2,a>1?'placeholder="Roof sheeting changed to IBR 0.47"':""),{wide:!0})}
      <p class="modal-message">Recorded as a draft. Use <strong>Mark as sent</strong> once it has
        actually gone to the customer \u2014 that is what starts the follow-up clock.</p>`,onSubmit:async i=>{let r=bt(i.amount);if(r===null||Number.isNaN(r))throw j("amount","Enter the quoted amount.");if(r<0)throw j("amount","That cannot be negative.");let l=await u.recordQuote(e.id,{amount:r,currency:i.currency,preparedOn:v(i.prepared_on),validUntil:v(i.valid_until),notes:v(i.notes),reference:v(i.reference),documentRef:v(i.document_ref)});w(`Quotation ${l?.reference||""} recorded.`),V(n,l)}})}async function mn({opp:e,quote:t,onDone:n}){let a=await bs(),s=Pe(new Date);J({title:`Mark ${t.reference} as sent`,sub:`${I(t.amount,t.currency)} \xB7 ${e.title}`,width:540,submitLabel:"Mark as sent",body:`
      <div class="field-row">
        ${m("sent_at","Sent",Ye("sent_at",s,"required"))}
        ${m("channel","How",R("channel",[["email","Email"],["whatsapp","WhatsApp"],["hand","By hand"],["meeting","At a meeting"],["other","Other"]],"email"))}
      </div>
      ${m("follow_up_on","Follow up on",ne("follow_up_on",a,"required"),{hint:"Worked out from the working-day rule in Settings. Change it if the customer gave you a date."})}
      ${m("notes","Notes",z("notes","",2,'placeholder="Sent to Tendai and copied to accounts"'),{wide:!0})}
      ${Qo}`,onSubmit:async i=>{if(!i.sent_at)throw j("sent_at","When did it go?");let r=Zn(i.sent_at,s);if(r&&Date.parse(r)>Date.now()+5*6e4)throw j("sent_at","That is in the future.");await u.markQuoteSent(t.id,{sentAt:r,followUpOn:v(i.follow_up_on),channel:i.channel,notes:v(i.notes)}),w(`${t.reference} marked sent. Follow-up booked.`),V(n)}})}async function hn({opp:e,quote:t,onDone:n}){let a=t.status==="draft",s=await u.filesFor("opportunity_id",t.opportunity_id).catch(()=>[]),i=s.filter(p=>p.quote_id===t.id),r=s.filter(p=>!p.quote_id),l=J({title:`Quotation ${t.reference}`,sub:`${e?.title||""}${t.version>1?` \xB7 revision ${t.version}`:""}`,width:540,submitLabel:"Save",body:`
      <dl class="kv">
        <div><dt>Amount</dt><dd class="num">${o(I(t.amount,t.currency))}</dd></div>
        <div><dt>Prepared</dt><dd>${o(mt(t.prepared_on))}</dd></div>
        <div><dt>Sent</dt><dd>${t.sent_at?o(new Date(t.sent_at).toLocaleString("en-GB",{timeZone:"Africa/Harare",dateStyle:"medium",timeStyle:"short"}))+(t.profiles?.full_name?" \xB7 "+o(t.profiles.full_name):""):"Not sent"}</dd></div>
        <div><dt>Follow up</dt><dd>${o(mt(t.follow_up_on))}</dd></div>
      </dl>
      ${a?m("amount","Correct the amount",wt("amount",t.amount,'min="0" step="0.01"'),{hint:"Only while it is a draft. Once sent, a change is a new revision."}):""}
      <div class="field-row">
        ${m("valid_until","Valid until",ne("valid_until",t.valid_until||""))}
        ${m("document_ref","Document / where it is filed",P("document_ref",t.document_ref||""))}
      </div>
      ${m("notes","Notes",z("notes",t.notes||"",3),{wide:!0})}
      <div class="field field-wide">
        <span class="field-label">The document sent</span>
        ${i.length?`<ul class="mini">${i.map(p=>`<li><button type="button" class="lnk" data-open-file="${o(p.path)}">${o(p.name)}</button></li>`).join("")}</ul>`:'<p class="field-hint">Nothing attached to this version yet.</p>'}
      </div>
      <div class="field-row">
        ${m("attach","Attach a file",'<input class="inp" id="attach" name="attach" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.docx,.doc">',{hint:"The quotation PDF as sent. 25 MB at most."})}
        ${r.length?m("link_file","Or use a file already on the enquiry",R("link_file",[["","None"],...r.map(p=>[p.id,p.name])],"")):""}
      </div>`,onSubmit:async p=>{let d=document.getElementById("attach")?.files?.[0]||null;if(d&&d.size>Ko)throw j("attach","That file is over 25 MB.");let f={valid_until:v(p.valid_until),document_ref:v(p.document_ref),notes:v(p.notes)};if(a){let _=bt(p.amount);if(_===null||Number.isNaN(_)||_<0)throw j("amount","Enter a valid amount.");f.amount=_}if(await u.updateQuote(t.id,f),d){let _=ut();await u.uploadFile(d,{opportunity_id:t.opportunity_id,quote_id:t.id},_?.id),await u.logActivity({opportunity_id:t.opportunity_id,kind:"file",body:`File added to ${t.reference}: ${d.name}`,actor_id:_?.id||null})}p.link_file&&await u.linkFileToQuote(p.link_file,t.id),w("Quotation saved."),V(n)}});return[...document.querySelectorAll(".modal")].pop()?.addEventListener("click",async p=>{let d=p.target.closest("[data-open-file]");if(!d)return;let{saveFile:f}=await Promise.resolve().then(()=>(Mt(),ws));try{await f(d.dataset.openFile,d.textContent.trim())}catch(_){w(_.message||"That file could not be opened.","bad")}}),l}async function fn({opp:e,onDone:t}){let n=await bs(),a=Pe(new Date);J({title:"Log a follow-up",sub:`${e.ref} \u2014 ${e.title}`,width:560,submitLabel:"Log follow-up",body:`
      <div class="field-row">
        ${m("channel","How",R("channel",Bn,"phone"))}
        ${m("at","When",Ye("at",a))}
      </div>
      ${m("notes","What happened",z("notes","",3,'required placeholder="Spoke to Tendai. Board meets Thursday."'),{wide:!0})}
      <div class="field-row">
        ${m("next_action","Next action",P("next_action",e.next_action||"",'placeholder="Follow up quotation"'))}
        ${m("next_due","Next follow-up",ne("next_due",n,"required"))}
      </div>
      <p class="modal-message">If the customer answered, use <strong>Customer replied</strong>
        instead \u2014 that stops the chase and puts the next move on us.</p>`,onSubmit:async s=>{if(!s.notes)throw j("notes","Say what happened.");if(!s.next_due)throw j("next_due","Give the next date.");await u.logFollowUp(e.id,{channel:s.channel,notes:s.notes,at:Zn(s.at,a),nextAction:v(s.next_action),nextDue:s.next_due}),w("Follow-up logged."),V(t)}})}function _s({opp:e,onDone:t}){let n=Pe(new Date);J({title:"Customer replied",sub:`${e.ref} \u2014 ${e.title}`,width:520,submitLabel:"Record reply",body:`
      <div class="field-row">
        ${m("channel","How",R("channel",Bn,"whatsapp"))}
        ${m("at","When",Ye("at",n))}
      </div>
      ${m("notes","What they said",z("notes","",3,'placeholder="Happy with the scope, asking about payment terms"'),{wide:!0})}
      <p class="modal-message">Recorded by hand \u2014 the CRM cannot see Kingson's inbox. The
        chase stops and the next action becomes "Respond to customer reply", due today.</p>`,onSubmit:async a=>{await u.customerReplied(e.id,{channel:a.channel,notes:v(a.notes),at:Zn(a.at,n)}),w("Reply recorded."),V(t)}})}function Xn({opp:e,onDone:t,onCancel:n}){let a=pe(e);J({title:"Mark as won",sub:`${e.ref} \u2014 ${e.title}`,width:500,submitLabel:"Mark won",body:`
      <div class="field-row">
        ${m("value",`Accepted value (${o(a.currency)})`,wt("value",a.amount??"",'required min="0" step="0.01"'),{hint:a.amount!=null?"Prefilled from the latest quotation. Change it if the customer accepted a different figure.":"No quotation is recorded. Enter the value the customer accepted."})}
        ${m("on","Decided on",ne("on",te()))}
      </div>
      ${m("notes","Notes",z("notes","",2,'placeholder="Order number, deposit terms"'),{wide:!0})}
      <p class="modal-message">Follow-ups stop. The latest quotation is marked accepted.</p>`,onSubmit:async s=>{let i=bt(s.value);if(i===null||Number.isNaN(i))throw j("value","Enter the accepted value.");if(i<0)throw j("value","That cannot be negative.");await u.decide(e.id,"won",{value:i,on:v(s.on),notes:v(s.notes)}),w("Marked won."),V(t)}}),na(n)}function ea({opp:e,onDone:t,onCancel:n}){J({title:"Mark as lost",sub:`${e.ref} \u2014 ${e.title}`,width:500,submitLabel:"Mark lost",body:`
      <div class="field-row">
        ${m("reason","Why",R("reason",[["","Choose\u2026"],...en],""))}
        ${m("on","Decided on",ne("on",te()))}
      </div>
      ${m("notes","Notes",z("notes","",3,'placeholder="Competitor came in 14% lower"'),{wide:!0,hint:'Required for "Other". This is what somebody reads back in six months.'})}
      <p class="modal-message">Follow-ups stop and open tasks on this job are cancelled.</p>`,onSubmit:async a=>{if(!a.reason)throw j("reason","Choose a reason.");if(a.reason==="other"&&!a.notes)throw j("notes","Say why.");await u.decide(e.id,"lost",{reason:a.reason,on:v(a.on),notes:v(a.notes)}),w("Marked lost."),V(t)}}),na(n)}function ta({opp:e,onDone:t,onCancel:n}){J({title:"Put on hold",sub:`${e.ref} \u2014 ${e.title}`,width:500,submitLabel:"Put on hold",body:`
      ${m("reason","Why",P("reason","",'required placeholder="Waiting for funding approval"'),{wide:!0})}
      ${m("review_on","Review on",ne("review_on","","required"),{hint:"It comes back onto the follow-up list on this date."})}
      ${m("notes","Notes",z("notes","",2),{wide:!0})}
      <p class="modal-message">Everything on the record is kept. Nothing is chased until the review date.</p>`,onSubmit:async a=>{if(!a.reason)throw j("reason","Give a reason.");if(!a.review_on)throw j("review_on","Choose a review date.");if(a.review_on<te())throw j("review_on","That date has passed.");await u.decide(e.id,"on_hold",{reason:a.reason,reviewOn:a.review_on,notes:v(a.notes)}),w("On hold."),V(t)}}),na(n)}function yn(e,{opp:t,onDone:n,onCancel:a}){return e==="won"?(Xn({opp:t,onDone:n,onCancel:a}),!0):e==="lost"?(ea({opp:t,onDone:n,onCancel:a}),!0):e==="on_hold"?(ta({opp:t,onDone:n,onCancel:a}),!0):!1}function na(e){if(typeof e!="function")return;let t=document.querySelector(".modal");if(!t)return;let n=new MutationObserver(()=>{document.body.contains(t)||(n.disconnect(),e())});n.observe(document.body,{childList:!0})}var Vo,Zn,Qo,Ko,Rt=O(()=>{Y();on();K();H();de();Vo=["USD","ZWG","ZAR"];Zn=(e,t)=>e===t?null:jt(e),Qo=`
  <p class="modal-message">The CRM does not send email. Send the quotation from your own
    mailbox or WhatsApp as usual, then record it here. The time, the value and your name are
    stamped on the record.</p>`;Ko=25*1024*1024});var qs={};ee(qs,{mount:()=>Zo,render:()=>Jo,sub:()=>Xo,title:()=>zo});async function ks(e){let t=await u.closedPage(e,gn+1);return xs=t.length>gn,vs=e+Math.min(t.length,gn),t.slice(0,gn)}async function Jo(){let[e,t]=await Promise.all([u.openOpportunities(),ks(0)]);return Be=[...e,...t],Ss()}function Ss(){let e=Be;return e.length?`
  <div class="board" role="list">
    ${qe.map(t=>{let n=e.filter(i=>i.stage===t.id),a=rn(Qe(n).by),s=n.filter(ve).length;return`
      <section class="col" data-group="${o(t.group)}" data-stage="${o(t.id)}" role="listitem">
        <header class="col-head">
          <span class="col-name">${o(t.name)}</span>
          <span class="col-n num">${n.length}</span>
          <span class="col-v num">${o(a)}</span>
          ${s?`<span class="col-alarm" title="${o(C(s,"overdue follow-up"))}">${c.alert(12)}${s}</span>`:""}
        </header>
        <div class="col-body" data-drop="${o(t.id)}">
          ${n.length?n.sort((i,r)=>xe(r).sort-xe(i).sort).map(Yo).join(""):'<p class="col-empty">Nothing here</p>'}
          ${xs&&(t.id==="won"||t.id==="lost")?'<button type="button" class="btn-ghost btn-xs col-more" data-more-closed>Show older decisions</button>':""}
        </div>
      </section>`}).join("")}
  </div>`:k("No enquiries yet.","An enquiry from the website appears here automatically. Add one by hand with New enquiry.",{tone:"quiet"})}function Yo(e){let t=xe(e);return`
  <article class="deal${t.level==="overdue"||t.level==="unbooked"?" deal-alarm":""}" draggable="true" data-deal="${o(e.id)}">
    <a class="deal-hit" href="#/opportunity/${o(e.id)}">
      <span class="deal-co">${o(e.company_name||e.contact_name||"No company")}</span>
      <span class="deal-title">${o(e.title)}</span>
    </a>
    <div class="deal-meta">
      <span class="deal-value num">${(()=>{let a=pe(e);return a.amount==null?'<span class="dim">Not quoted yet</span>':o(I(a.amount,a.currency))+(a.kind==="draft"?' <span class="dim">draft</span>':"")})()}</span>
      ${ze(e.source)}
    </div>
    ${Number(e.live_quotes)?`<p class="deal-quote">${c.doc(12)}${o(C(Number(e.live_quotes),"quotation"))} out${e.last_quote_sent?" \xB7 "+o(B(e.last_quote_sent)):""}</p>`:""}
    <div class="deal-foot">
      ${Ke(e)}
      ${Je(e.priority)}
      <span class="deal-right">
        ${U(e.owner_name?{full_name:e.owner_name,initials:e.owner_initials}:null,22)}
        <span class="deal-move">
          <label class="sr-only" for="mv-${o(e.id)}">Move ${o(e.title)} to another stage</label>
          <select class="deal-select" id="mv-${o(e.id)}" data-move="${o(e.id)}">
            ${qe.map(a=>`<option value="${o(a.id)}"${a.id===e.stage?" selected":""}>${o(a.short)}</option>`).join("")}
          </select>
          <span class="deal-move-ic" aria-hidden="true">${c.chevron(12)}</span>
        </span>
      </span>
    </div>
  </article>`}function Zo(e,t){async function n(s,i,r){let l=Be.find(d=>d.id===s)||{id:s,title:"this enquiry",stage:r};if(l.stage===i)return;let p=e.querySelector(`[data-move="${CSS.escape(s)}"]`);if(!yn(i,{opp:l,onDone:t,onCancel:()=>{p&&document.contains(p)&&r&&(p.value=r)}}))try{await u.setStage(s,i),w(`Moved to ${re[i].name}.`),await t()}catch(d){w(d.message||"That move could not be saved.","bad");let f=e.querySelector(`[data-move="${CSS.escape(s)}"]`);f&&r&&(f.value=r)}}e.addEventListener("click",async s=>{let i=s.target.closest("[data-more-closed]");if(i){i.disabled=!0;try{Be=Be.concat(await ks(vs));let r=e.querySelector(".board")?.scrollLeft||0;e.innerHTML=Ss();let l=e.querySelector(".board");l&&(l.scrollLeft=r)}catch(r){i.disabled=!1,w(r.message||"Could not load more.","bad")}}}),e.addEventListener("change",s=>{let i=s.target.closest("[data-move]");if(!i)return;let r=i.dataset.move,l=Be.find(p=>p.id===r)?.stage;n(r,i.value,l)});let a=null;e.addEventListener("dragstart",s=>{let i=s.target.closest("[data-deal]");if(i){a=i.dataset.deal,i.classList.add("is-dragging"),s.dataTransfer.effectAllowed="move";try{s.dataTransfer.setData("text/plain",a)}catch{}}}),e.addEventListener("dragend",s=>{s.target.closest("[data-deal]")?.classList.remove("is-dragging"),e.querySelectorAll(".is-over").forEach(i=>i.classList.remove("is-over")),a=null}),e.addEventListener("dragover",s=>{let i=s.target.closest("[data-drop]");!i||!a||(s.preventDefault(),s.dataTransfer.dropEffect="move",i.classList.contains("is-over")||(e.querySelectorAll(".is-over").forEach(r=>r.classList.remove("is-over")),i.classList.add("is-over")))}),e.addEventListener("drop",s=>{let i=s.target.closest("[data-drop]");if(!i||!a)return;s.preventDefault();let r=a;a=null,n(r,i.dataset.drop,Be.find(l=>l.id===r)?.stage)})}function Xo(){let e=Be.filter(n=>re[n.stage]?.open),t=Qe(e);return`${o(C(e.length,"open enquiry","open enquiries"))} \xB7 <span class="num">${o(ce(t.by,{empty:"nothing quoted"}))}</span>${t.unvalued?` \xB7 ${t.unvalued} not quoted yet`:""}`}var zo,gn,Be,vs,xs,Es=O(()=>{Y();K();H();se();Z();de();Rt();zo="Enquiries",gn=40,Be=[],vs=0,xs=!1});var Ts={};ee(Ts,{mount:()=>ni,render:()=>ti,sub:()=>ai,title:()=>ei});function wn(e){let t=Qe(e);return t.valued?ce(t.by)+" quoted"+(t.unvalued?` \xB7 ${t.unvalued} unquoted`:""):e.length?"not quoted yet":""}async function ti(e,{me:t}){Fe=await u.openOpportunities();let n=Fe.filter(ve).sort((l,p)=>M(l.next_action_due)-M(p.next_action_due)),a=Fe.filter(dt).sort((l,p)=>new Date(l.created_at)-new Date(p.created_at)),s=Fe.filter(an),i=Fe.filter(l=>{let p=M(l.next_action_due);return p!==null&&p>0&&p<=14}).sort((l,p)=>M(l.next_action_due)-M(p.next_action_due));return`
    ${`
    <div class="fu-summary">
      <span class="fu-sum fu-sum-danger">
        ${c.alert(16)}<b class="num">${n.length}</b><span>overdue</span>
        <em class="num">${o(wn(n))}</em>
      </span>
      <span class="fu-sum${a.length?" fu-sum-danger":""}">
        ${c.alert(16)}<b class="num">${a.length}</b><span>nothing booked</span>
        <em class="num">${o(wn(a))}</em>
      </span>
      <span class="fu-sum">
        ${c.clock(16)}<b class="num">${s.length}</b><span>due today</span>
        <em class="num">${o(wn(s))}</em>
      </span>
      <span class="fu-sum">
        ${c.calendar(16)}<b class="num">${i.length}</b><span>next 14 days</span>
        <em class="num">${o(wn(i))}</em>
      </span>
    </div>`}
    ${bn("Overdue",n,"Past the date somebody committed to. Every one of these is a customer waiting.")}
    ${bn("Open, with nothing booked",a,"These appear on no list and are on nobody\u2019s day. This is where enquiries are lost.")}
    ${bn("Due today",s,"Booked for today.")}
    ${bn("Next fourteen days",i,"Booked and not yet due.")}`}function bn(e,t,n){return t.length?b(e,`
    <ul class="fu-list">
      ${t.map(a=>`
        <li class="fu">
          <span class="fu-when">${un(a.next_action_due)}</span>
          <a class="fu-main" href="#/opportunity/${o(a.id)}">
            <span class="fu-title">${o(a.title)}</span>
            <span class="fu-sub">${o(a.company_name||a.contact_name||"\u2014")} \xB7 ${o(a.ref)}${(()=>{let s=pe(a);return s.amount==null?" \xB7 not quoted yet":` \xB7 <span class="num">${o(I(s.amount,s.currency))}</span>`})()}</span>
            <span class="fu-action">${a.next_action?`${c.arrowRight(13)}${o(a.next_action)}`:`${c.alert(13)}No next action recorded`}</span>
            ${Number(a.live_quotes)?`<span class="fu-quote">${c.doc(12)}${o(C(Number(a.live_quotes),"quotation"))} out${a.last_quote_sent?" \xB7 "+o(B(a.last_quote_sent)):""}</span>`:""}
          </a>
          <span class="fu-stage">${Ke(a)}</span>
          <span class="fu-owner">${U(a.owner_name?{full_name:a.owner_name,initials:a.owner_initials}:null,26)}</span>
          <span class="fu-do">
            ${Te({phone:a.contact_phone,whatsapp:a.contact_whatsapp,email:a.contact_email},{text:`Good day, Kingson Engineering here regarding ${a.title}.`,size:"xs"})}
            <button type="button" class="btn-ghost btn-xs" data-chase="${o(a.id)}">${c.check(13)}<span>Log follow-up</span></button>
          </span>
        </li>`).join("")}
    </ul>`,{note:n,tight:!0}):b(e,k(e==="Overdue"||e.startsWith("Open,")?"Nothing in this group. Good.":"Nothing booked in this window."),{note:n,tight:!0})}function ni(e,t){e.addEventListener("click",n=>{let a=n.target.closest("[data-chase]");if(!a)return;let s=Fe.find(i=>i.id===a.dataset.chase);s&&fn({opp:s,onDone:t})})}function ai(){let e=Fe.filter(ve).length,t=Fe.filter(dt).length,n=[];return e&&n.push(`${e} overdue`),t&&n.push(`${t} with nothing booked`),n.length?`<span class="sub-alarm">${c.alert(14)}${o(n.join(" \xB7 "))}</span>`:"Nothing is late"}var ei,Fe,Cs=O(()=>{Y();K();H();se();Z();de();Rt();ei="Follow-ups";Fe=[]});var $n={};ee($n,{bookFollowUp:()=>oa,contactDialog:()=>ia,convertDialog:()=>ra,logActivity:()=>sa,newOpportunity:()=>aa,projectDialog:()=>la,taskDialog:()=>Pt,visitDialog:()=>_t});async function aa({me:e,contact:t=null,onDone:n}){let a=await u.profiles(),s=0,i=0,r=[],l=J({title:"New enquiry",sub:t?`For ${t.full_name}`:"Name, a phone number or email, and what they need. The rest can wait.",width:640,submitLabel:"Create enquiry",body:`
      <input type="hidden" name="contact_id" value="${o(t?.id||"")}">
      <input type="hidden" name="force_new" value="">
      <div class="qe-who"${t?" hidden":""}>
        <div class="field-row">
          ${m("full_name","Who is it?",P("full_name","",'autocomplete="off" placeholder="Tendai Moyo"'))}
          ${m("phone","Phone / WhatsApp",P("phone","",'type="tel" inputmode="tel" autocomplete="off" placeholder="077 123 4567"'))}
        </div>
        <div class="field-row">
          ${m("email","Email",P("email","",'type="email" inputmode="email" autocomplete="off" placeholder="name@company.co.zw"'),{hint:"Optional if you have a phone number."})}
          ${m("company","Company",P("company","",'autocomplete="off" placeholder="Optional"'))}
        </div>
      </div>
      <div class="qe-match" data-match aria-live="polite">${t?As(t):""}</div>
      ${m("description","What do they need?",z("description","",2,'placeholder="Structural steel for a warehouse in Msasa. Has drawings, wants a price."'),{wide:!0})}
      <div class="field-row">
        ${m("source","How did it come in?",R("source",Zt.map(g=>[g,Re[g]]),"phone"))}
        ${m("service","Service",R("service",[["","Not sure yet"],...Nt]))}
      </div>
      <details class="qe-more">
        <summary>More detail (optional)</summary>
        <div class="field-row">
          ${m("location","Site / location",P("location","",'placeholder="Msasa, Harare"'))}
          ${m("drawings","Drawings?",R("drawings",Pa,"unknown"))}
        </div>
        <div class="field-row">
          ${m("preferred","Best way to reach them",R("preferred",Ia,""))}
          ${m("owner_id","Who deals with it",R("owner_id",Ut(a),e?.id||""))}
        </div>
        <div class="field-row">
          ${m("next_action","Next action",P("next_action","Call and qualify the enquiry"))}
          ${m("next_action_due","Due",ne("next_action_due",nn()))}
        </div>
        ${m("title","Job name",P("title","",'placeholder="Left blank, it is made from the service and site"'),{wide:!0})}
      </details>`,onSubmit:async g=>{let X=g.contact_id||null;if(!X){if(!g.full_name)throw j("full_name","Who is asking?");if(!g.phone&&!g.email)throw j("phone","A phone number or an email address is needed.");if(g.email&&!In(g.email))throw j("email","That email address does not look right.");if(r.length&&g.force_new!=="1")throw new Error("This customer may already be on file. Choose \u201CUse this customer\u201D, or \u201Ccreate a new customer\u201D if it is somebody else.")}if(!g.description)throw j("description","Write a line about what they need.");let E=await u.createEnquiry({fullName:g.full_name,phone:g.phone,email:g.email,company:g.company,contactId:X,forceNew:g.force_new==="1",description:g.description,title:g.title,service:g.service,location:g.location,source:g.source,preferredChannel:g.preferred,drawings:g.drawings,ownerId:v(g.owner_id),nextAction:g.next_action,nextDue:v(g.next_action_due)});w(`${E.ref} created${E.contact_reused?" for an existing customer":""}.`),n?V(n,{id:E.opportunity_id,ref:E.ref}):location.hash=`#/opportunity/${E.opportunity_id}`}}),p=[...document.querySelectorAll(".modal")].pop();if(!p||t)return l;let d=p.querySelector("[data-match]"),f=p.querySelector('[name="contact_id"]'),_=p.querySelector('[name="force_new"]'),T=p.querySelector(".qe-who"),q=g=>p.querySelector(`[name="${g}"]`).value.trim();async function A(){if(f.value)return;let g={phone:Fa(q("phone"))?q("phone"):"",email:In(q("email")),name:q("full_name"),company:q("company")};if(!g.phone&&!g.email&&g.name.length<3&&g.company.length<3){r=[],d.innerHTML="";return}let X=++i,E=[];try{E=await u.findMatches(g)}catch{return}if(X!==i||f.value)return;r=E.filter(He=>He.strength==="strong");let _e=E.filter(He=>He.strength!=="strong");if(!E.length){d.innerHTML="",_.value="";return}d.innerHTML=(r.length?`
        <div class="qe-found qe-strong">
          <p class="qe-found-h">${c.alert(15)}<span>Existing customer found \u2014 same ${o(r[0].match==="email"?"email address":"phone number")}</span></p>
          ${r.map(Ds).join("")}
          <button type="button" class="btn-ghost btn-xs" data-force-new aria-pressed="${_.value?"true":"false"}">
            ${_.value?"Creating a new customer \u2014 undo":"It is somebody else \u2014 create a new customer"}</button>
        </div>`:"")+(_e.length?`
        <details class="qe-found qe-soft"${r.length?"":" open"}>
          <summary>${_e.length} similar name${_e.length===1?"":"s"} on file \u2014 is it one of them?</summary>
          ${_e.map(Ds).join("")}
        </details>`:"")}let Q=()=>{clearTimeout(s),_.value="",s=setTimeout(A,250)};return["full_name","phone","email","company"].forEach(g=>p.querySelector(`[name="${g}"]`).addEventListener("input",Q)),d.addEventListener("click",g=>{let X=g.target.closest("[data-use]");if(X){let E=JSON.parse(X.dataset.use);f.value=E.contact_id,_.value="",r=[],T.hidden=!0,d.innerHTML=As({full_name:E.full_name,companies:{name:E.company_name},phone:E.phone,email:E.email},!0),p.querySelector('[name="description"]').focus();return}if(g.target.closest("[data-change]")){f.value="",T.hidden=!1,d.innerHTML="",A();return}if(g.target.closest("[data-force-new]")){_.value=_.value?"":"1";let E=g.target.closest("[data-force-new]");E.setAttribute("aria-pressed",_.value?"true":"false"),E.textContent=_.value?"Creating a new customer \u2014 undo":"It is somebody else \u2014 create a new customer"}}),l}function Ds(e){let t=o(JSON.stringify({contact_id:e.contact_id,full_name:e.full_name,company_name:e.company_name,phone:e.phone,email:e.email}));return`<div class="qe-hit">
      <span class="qe-hit-main">
        <strong>${o(e.full_name)}</strong>${e.company_name?` \xB7 ${o(e.company_name)}`:""}
        <span class="qe-hit-sub">${o([e.phone,e.email].filter(Boolean).join(" \xB7 "))}${e.open_enquiries?` \xB7 ${e.open_enquiries} open enquir${e.open_enquiries===1?"y":"ies"}`:""}${e.last_ref?` \xB7 last ${o(e.last_ref)}`:""}</span>
      </span>
      <button type="button" class="btn btn-xs" data-use="${t}">Use this customer</button>
    </div>`}function As(e,t=!1){return`<div class="qe-chosen">
      ${c.check(15)}
      <span><strong>${o(e.full_name)}</strong>${e.companies?.name?` \xB7 ${o(e.companies.name)}`:""}
        <span class="qe-hit-sub">${o([e.phone,e.email].filter(Boolean).join(" \xB7 "))}</span></span>
      ${t?'<button type="button" class="btn-ghost btn-xs" data-change>Change</button>':""}
    </div>`}function sa({opportunityId:e,contactId:t,me:n,onDone:a}){J({title:"Log an interaction",sub:"Goes on the timeline exactly as written",width:520,submitLabel:"Log it",body:`
      ${m("kind","What happened?",R("kind",Ga.map(s=>[s,tn[s]]),"call"))}
      ${m("body","Notes",z("body","",4,'required placeholder="Spoke to Tendai. Wants the quotation by Friday."'),{wide:!0})}
      ${m("occurred_at","When",Ye("occurred_at",Pe(new Date)),{hint:"Change this if you are catching up on something from earlier."})}`,onSubmit:async s=>{if(!s.body)throw j("body","Write what happened.");await u.logActivity({opportunity_id:e||null,contact_id:t||null,kind:s.kind,body:s.body,actor_id:n?.id||null,occurred_at:jt(s.occurred_at)||new Date().toISOString()}),w("Logged."),V(a)}})}async function oa({opp:e,me:t,onDone:n}){let a=await u.profiles();J({title:e.next_action_due?"Change the next action":"Book the next action",sub:"Every open enquiry should have one. This is what puts it on the follow-up list.",width:540,submitLabel:"Save",body:`
      ${m("next_action","What needs to happen",P("next_action",e.next_action||"",'required placeholder="Chase the quotation"'),{wide:!0})}
      <div class="field-row">
        ${m("next_action_due","When",ne("next_action_due",Ue(e.next_action_due)||nn(),"required"))}
        ${m("owner_id","Owner",R("owner_id",Ut(a),e.owner_id||t?.id||""))}
      </div>
      ${m("channel","How",R("channel",["Phone","WhatsApp","Email","Site visit","In person"],"Phone"))}
      ${m("also_task","Also add it to the task list",'<label class="check"><input type="checkbox" id="also_task" name="also_task" checked> <span>Create a task as well</span></label>',{wide:!0})}`,onSubmit:async s=>{if(!s.next_action)throw j("next_action","Say what needs to happen.");if(!s.next_action_due)throw j("next_action_due","Give it a date.");await u.updateOpportunity(e.id,{next_action:s.next_action,next_action_due:s.next_action_due,owner_id:v(s.owner_id)}),s.also_task&&await u.createTask({title:s.next_action,opportunity_id:e.id,contact_id:e.contact_id,owner_id:v(s.owner_id),due_date:s.next_action_due,channel:s.channel,priority:e.priority,task_type:Number(e.live_quotes||0)?"quote_followup":"enquiry_response"}),await u.logActivity({opportunity_id:e.id,contact_id:e.contact_id,kind:"task",body:`Next action booked for ${s.next_action_due}: ${s.next_action} (${s.channel})`,actor_id:t?.id||null}),w("Booked."),V(n)}})}async function _t({opp:e,visit:t=null,me:n,onDone:a}){let s=await u.profiles(),i=!!t;J({title:i?"Site visit":"Book a site visit",sub:e?.title||"",width:560,submitLabel:i?"Save":"Book",body:`
      <div class="field-row">
        ${m("scheduled_at","When",Ye("scheduled_at",Pe(t?.scheduled_at)||Pe(new Date(Date.now()+864e5)),"required"))}
        ${m("owner_id","Who is going",R("owner_id",Ut(s),t?.owner_id||n?.id||""))}
      </div>
      ${m("location","Where",P("location",t?.location||e?.location||"",'placeholder="Msasa, Harare"'),{wide:!0})}
      ${m("purpose","Purpose",P("purpose",t?.purpose||"Measure up and assess access",""),{wide:!0})}
      ${i?`
        ${m("status","Status",R("status",["scheduled","completed","cancelled"].map(r=>[r,Ls(r)]),t.status))}
        ${m("outcome","Outcome",z("outcome",t.outcome||"",3,'placeholder="Existing purlins sound. Access good from the north gate."'),{wide:!0})}`:""}
      ${m("notes","Notes",z("notes",t?.notes||"",2),{wide:!0})}`,onSubmit:async r=>{if(!r.scheduled_at)throw j("scheduled_at","Give a date and time.");let l={scheduled_at:jt(r.scheduled_at),owner_id:v(r.owner_id),location:v(r.location),purpose:v(r.purpose),notes:v(r.notes)};if(i)l.status=r.status,l.outcome=v(r.outcome),await u.updateVisit(t.id,l);else if(await u.createVisit({...l,opportunity_id:e.id,status:"scheduled"}),["new","contacted"].includes(e.stage))try{await u.updateOpportunity(e.id,{stage:"requirements"})}catch(p){w(`Visit booked. The stage was not moved: ${p.message}`,"bad"),V(a);return}w(i?"Visit saved.":"Visit booked."),V(a)}})}async function Pt({task:e=null,opp:t=null,me:n,onDone:a}){let s=await u.profiles(),i=!!e;J({title:i?"Task":"New task",sub:t?.title||e?.opportunities?.title||"",width:520,submitLabel:i?"Save":"Create",body:`
      ${m("title","What needs doing",P("title",e?.title||"","required"),{wide:!0})}
      <div class="field-row">
        ${m("due_date","Due",ne("due_date",Ue(e?.due_date)||nn()))}
        ${m("owner_id","Owner",R("owner_id",Ut(s),e?.owner_id||n?.id||""))}
      </div>
      <div class="field-row">
        ${m("priority","Priority",R("priority",Yt.map(r=>[r,Ls(r)]),e?.priority||"normal"))}
        ${m("channel","How",R("channel",["","Phone","WhatsApp","Email","Site visit","In person"],e?.channel||""))}
      </div>
      ${t||e?.opportunity_id?m("task_type","Kind of task",R("task_type",Ba,e?.task_type||"general"),{wide:!0,hint:"Sales follow-ups close by themselves when the enquiry is won or lost. General tasks stay open."}):""}
      ${m("notes","Notes",z("notes",e?.notes||"",2),{wide:!0})}`,onSubmit:async r=>{if(!r.title)throw j("title","Say what needs doing.");let l={title:r.title,due_date:v(r.due_date),owner_id:v(r.owner_id),priority:r.priority,channel:v(r.channel),notes:v(r.notes),...r.task_type?{task_type:r.task_type}:{}};i?await u.updateTask(e.id,l):await u.createTask({...l,opportunity_id:t?.id||null,contact_id:t?.contact_id||null}),w(i?"Task saved.":"Task created."),V(a)}})}function ia({contact:e=null,onDone:t}){let n=!!e;J({title:n?"Edit contact":"New contact",width:560,submitLabel:n?"Save":"Create",body:`
      <div class="field-row">
        ${m("full_name","Name",P("full_name",e?.full_name||"","required"))}
        ${m("job_title","Role",P("job_title",e?.job_title||"",'placeholder="Operations Manager"'))}
      </div>
      ${m("company","Company",P("company",e?.companies?.name||"",'placeholder="Msasa Park Logistics"'),{wide:!0})}
      <div class="field-row">
        ${m("phone","Phone",P("phone",e?.phone||"",'placeholder="+263 77 000 0000"'))}
        ${m("whatsapp","WhatsApp",P("whatsapp",e?.whatsapp||"",'placeholder="+263 77 000 0000"'),{hint:"Often not the same as the office line."})}
      </div>
      ${m("email","Email",P("email",e?.email||"",'type="email"'),{wide:!0})}
      ${m("preferred_channel","Prefers",R("preferred_channel",["","Phone","WhatsApp","Email"],e?.preferred_channel||""))}
      ${m("notes","Notes",z("notes",e?.notes||"",2),{wide:!0})}`,onSubmit:async a=>{if(!a.full_name)throw j("full_name","A name is needed.");if(!a.phone&&!a.whatsapp&&!a.email)throw j("phone","A phone number, a WhatsApp number or an email address is needed.");let s=a.company&&(await u.findOrCreateCompany(a.company))?.id||null,i={full_name:a.full_name,job_title:v(a.job_title),phone:v(a.phone),whatsapp:v(a.whatsapp),email:v(a.email)&&a.email.toLowerCase(),preferred_channel:v(a.preferred_channel),notes:v(a.notes)};s&&(i.company_id=s);let r=n?await u.updateContact(e.id,i):await u.createContact(i);w(n?"Contact saved.":"Contact created."),V(t,r)}})}function ra({opp:e,onDone:t}){J({title:"Open a project",sub:`${e.ref} \u2014 ${e.title}`,width:520,submitLabel:"Open project",body:`
      ${m("name","Project name",P("name",e.title,"required"),{wide:!0})}
      <div class="field-row">
        ${m("start_date","Start",ne("start_date",te()))}
        ${m("target_date","Target completion",ne("target_date",ct(te(),56)))}
      </div>
      <p class="modal-message">The client, contact, value and description come across from the
        enquiry. The enquiry stays on record and links to the project.</p>`,onSubmit:async n=>{let a=await u.convertToProject(e.id,{name:n.name,startDate:v(n.start_date),targetDate:v(n.target_date)});w("Project opened."),t?V(t,a):location.hash=`#/project/${a}`}})}async function la({project:e,me:t,onDone:n}){let a=await u.profiles();J({title:"Edit project",sub:e.name,width:560,submitLabel:"Save",body:`
      ${m("name","Name",P("name",e.name,"required"),{wide:!0})}
      <div class="field-row">
        ${m("status","Status",R("status",Ha.map(s=>[s,lt[s]]),e.status))}
        ${m("owner_id","Responsible",R("owner_id",Ut(a),e.owner_id||""))}
      </div>
      <div class="field-row">
        ${m("start_date","Start",ne("start_date",Ue(e.start_date)))}
        ${m("target_date","Target",ne("target_date",Ue(e.target_date)))}
      </div>
      <div class="field-row">
        ${m("value","Value (USD)",wt("value",e.value??"",'min="0" step="100"'))}
        ${m("completed_on","Completed",ne("completed_on",Ue(e.completed_on)))}
      </div>
      ${m("description","Description",z("description",e.description||"",3),{wide:!0})}
      ${m("notes","Notes",z("notes",e.notes||"",2),{wide:!0})}`,onSubmit:async s=>{if(!s.name)throw j("name","A project needs a name.");await u.updateProject(e.id,{name:s.name,status:s.status,owner_id:v(s.owner_id),start_date:v(s.start_date),target_date:v(s.target_date),completed_on:v(s.completed_on),value:bt(s.value),description:v(s.description),notes:v(s.notes)}),w("Project saved."),V(n)}})}var Ls,Ut,Ce=O(()=>{Y();K();Z();H();de();Ls=e=>e.charAt(0).toUpperCase()+e.slice(1),Ut=(e,t=!0)=>(t?[["","Unassigned"]]:[]).concat(e.map(n=>[n.id,n.full_name]))});var Os={};ee(Os,{actions:()=>ci,mount:()=>ri,render:()=>oi,sub:()=>li,title:()=>si});async function oi(e,{me:t}){return[_n,Ns]=await Promise.all([u.tasks(),u.profiles()]),js(t)}function js(e){let t=_n.filter(s=>(be.status==="all"||s.status===be.status)&&(be.owner==="all"||(be.owner==="mine"?s.owner_id===e?.id:s.owner_id===be.owner))),n=`
    <div class="filters">
      <label class="sr-only" for="f-status">Status</label>
      <select class="sel sel-inline" id="f-status" data-f="status">
        ${[["open","Open"],["done","Completed"],["all","All"]].map(([s,i])=>`<option value="${s}"${be.status===s?" selected":""}>${i}</option>`).join("")}
      </select>
      <label class="sr-only" for="f-owner">Owner</label>
      <select class="sel sel-inline" id="f-owner" data-f="owner">
        <option value="all"${be.owner==="all"?" selected":""}>Everyone</option>
        <option value="mine"${be.owner==="mine"?" selected":""}>Mine</option>
        ${Ns.map(s=>`<option value="${o(s.id)}"${be.owner===s.id?" selected":""}>${o(s.full_name)}</option>`).join("")}
      </select>
      <span class="filters-n">${o(C(t.length,"task"))}</span>
    </div>`,a=t.length?`
    <ul class="fu-list">
      ${t.sort(ii).map(s=>`
        <li class="fu${s.status==="done"?" is-done":""}">
          <span class="fu-when">${un(s.due_date)}</span>
          <div class="fu-main">
            <span class="fu-title">${o(s.title)}</span>
            <span class="fu-sub">
              ${s.opportunities?`<a class="lnk" href="#/opportunity/${o(s.opportunities.id)}">${o(s.opportunities.ref)} \xB7 ${o(s.opportunities.title)}</a>`:'<span class="dim">Not linked to an opportunity</span>'}
              ${s.channel?" \xB7 "+o(s.channel):""}
            </span>
            ${s.notes?`<span class="fu-action">${o(s.notes)}</span>`:""}
          </div>
          <span class="fu-stage">${Je(s.priority)}</span>
          <span class="fu-owner">${U(s.profiles,26)}</span>
          <span class="fu-do">
            <button type="button" class="btn-ghost btn-xs" data-edit="${o(s.id)}">${c.edit(13)}<span>Edit</span></button>
            ${s.status==="open"?`<button type="button" class="btn-ghost btn-xs" data-done="${o(s.id)}">${c.check(13)}<span>Done</span></button>`:`<button type="button" class="btn-ghost btn-xs" data-reopen="${o(s.id)}">${c.refresh(13)}<span>Reopen</span></button>`}
          </span>
        </li>`).join("")}
    </ul>`:k(be.status==="open"?"Nothing outstanding.":"No tasks match that filter.",be.status==="open"?"Every task on this filter is done.":"",{tone:"ok"});return n+b("",a,{tight:!0})}function ri(e,t,{me:n}){e.addEventListener("change",a=>{let s=a.target.closest("[data-f]");if(!s)return;be[s.dataset.f]=s.value;let i=document.getElementById("view");i.innerHTML=js(n)}),e.addEventListener("click",async a=>{let s=a.target.closest("[data-done]"),i=a.target.closest("[data-reopen]"),r=a.target.closest("[data-edit]");try{if(s)return await u.completeTask(s.dataset.done),w("Completed."),t();if(i)return await u.updateTask(i.dataset.reopen,{status:"open"}),w("Reopened."),t();if(r){let l=_n.find(p=>p.id===r.dataset.edit);if(l)return Pt({task:l,me:n,onDone:t})}}catch(l){w(l.message||"That could not be saved.","bad")}})}function li(){let e=_n.filter(n=>n.status==="open"),t=e.filter(n=>n.due_date&&M(n.due_date)<0).length;return t?`<span class="sub-alarm">${c.alert(14)}${o(C(t,"task"))} overdue</span>`:`${o(C(e.length,"open task"))}`}var si,_n,be,Ns,ii,ci,Ms=O(()=>{Y();K();H();se();Z();de();Ce();si="Tasks",_n=[],be={status:"open",owner:"all"},Ns=[];ii=(e,t)=>e.due_date?t.due_date?e.due_date<t.due_date?-1:e.due_date>t.due_date?1:0:-1:1;ci=()=>`<button type="button" class="btn btn-sm" data-new-task-global>${c.plus(14)}<span>New task</span></button>`});var Ps={};ee(Ps,{actions:()=>hi,mount:()=>pi,render:()=>ui,sub:()=>mi,title:()=>di});async function da(e){let t=await u.contacts(ua,{offset:e,limit:ca+1});return pa=t.length>ca,t.slice(0,ca)}async function ui(){return Ne=await da(0),`
    <div class="filters">
      <div class="search">
        ${c.search(15)}
        <label class="sr-only" for="c-search">Search contacts</label>
        <input class="inp" id="c-search" type="search" placeholder="Name, phone or email"
               value="${o(ua)}" autocomplete="off">
      </div>
      <span class="filters-n" data-count>${o(ma())}</span>
    </div>
    <div data-list>${Us(Ne)}${Rs()}</div>`}function Us(e){return e.length?b("",we(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Name</th><th scope="col">Company</th>
        <th scope="col">Phone</th><th scope="col">Email</th><th scope="col"></th>
      </tr></thead>
      <tbody>
        ${e.map(t=>`<tr>
          <td><a class="lnk lnk-strong" href="#/contact/${o(t.id)}">
            ${U({full_name:t.full_name},24)}<span>${o(t.full_name)}</span></a>
            ${t.job_title?`<span class="td-sub">${o(t.job_title)}</span>`:""}</td>
          <td>${o(t.companies?.name||"\u2014")}</td>
          <td class="num">${t.phone?`<a class="lnk" href="${o(Ee(t.phone))}">${o(t.phone)}</a>`:"\u2014"}</td>
          <td>${o(t.email||"\u2014")}</td>
          <td class="ta-r">${Te(t,{size:"xs"})}</td>
        </tr>`).join("")}
      </tbody>
    </table>`),{tight:!0}):b("",k("No contacts match that.","Try part of a name, a company or a number.",{tone:"quiet"}),{tight:!0})}function pi(e){let t=e.querySelector("#c-search"),n=e.querySelector("[data-list]"),a=e.querySelector("[data-count]"),s=null,i=0,r=()=>{n.innerHTML=Us(Ne)+Rs(),a.textContent=ma()};t?.addEventListener("input",()=>{clearTimeout(s),s=setTimeout(async()=>{ua=t.value.trim();let l=++i;try{let p=await da(0);if(l!==i)return;Ne=p,r()}catch(p){w(p.message||"Search failed.","bad")}},200)}),n.addEventListener("click",async l=>{let p=l.target.closest("[data-more]");if(!p)return;p.disabled=!0;let d=i;try{let f=await da(Ne.length);if(d!==i)return;Ne=Ne.concat(f),r()}catch(f){p.disabled=!1,w(f.message||"Could not load more.","bad")}})}var di,ca,Ne,ua,pa,ma,Rs,mi,hi,Is=O(()=>{Y();H();se();Z();Ce();de();di="Contacts",ca=50,Ne=[],ua="",pa=!1,ma=()=>pa?`${Ne.length}+ contacts`:C(Ne.length,"contact"),Rs=()=>pa?'<div class="more-row"><button type="button" class="btn-ghost btn-sm" data-more>Show more contacts</button></div>':"";mi=()=>ma(),hi=()=>`<button type="button" class="btn btn-sm" data-new-contact>${c.plus(14)}<span>New contact</span></button>`});var Bs={};ee(Bs,{mount:()=>gi,render:()=>yi,sub:()=>wi,title:()=>fi});async function yi(e,{me:t}){if(N=await u.contact(e),!N)return k("That contact no longer exists.","",{tone:"quiet"});let[n,a,s]=await Promise.all([u.opportunities(`contact_id=eq.${e}`),u.activityForContact(e),u.filesFor("contact_id",e)]),i=n.length?await u.quotes(`opportunity_id=in.(${n.map(d=>d.id).join(",")})`):[],r=b("Details",`
    <div class="contact">
      ${U({full_name:N.full_name},40)}
      <div class="contact-body">
        <p class="contact-name">${o(N.full_name)}</p>
        ${N.job_title?`<p class="contact-role">${o(N.job_title)}</p>`:""}
        ${N.companies?`<p class="contact-role">${o(N.companies.name)}${N.companies.town?" \xB7 "+o(N.companies.town):""}</p>`:""}
        <div class="contact-lines">
          ${N.phone?`<a class="lnk" href="${o(Ee(N.phone))}">${c.phone(13)}${o(N.phone)}</a>`:""}
          ${N.whatsapp&&N.whatsapp!==N.phone?`<span class="lnk-plain">${c.whatsapp(13)}${o(N.whatsapp)}</span>`:""}
          ${N.email?`<a class="lnk" href="${o(Ie(N.email))}">${c.mail(13)}${o(N.email)}</a>`:""}
        </div>
        ${N.preferred_channel?`<p class="contact-pref">Prefers ${o(N.preferred_channel)}</p>`:""}
      </div>
    </div>
    <div class="contact-acts">${Te(N,{text:`Good day ${N.full_name.split(" ")[0]}, Kingson Engineering here.`})}</div>
    ${N.notes?`<p class="scope">${o(N.notes)}</p>`:""}`,{action:`<button type="button" class="btn-ghost btn-xs" data-edit-contact>${c.edit(13)}<span>Edit</span></button>`}),l=b("Enquiries",n.length?`
    <ul class="mini">
      ${n.map(d=>`<li>
        <a href="#/opportunity/${o(d.id)}">
          <span class="mini-main">${o(d.title)} ${Ke(d)}</span>
          <span class="mini-sub">${o(d.ref)} \xB7 ${o(d.stage_name)}${(()=>{let f=pe(d);return f.amount==null?" \xB7 not quoted yet":" \xB7 "+o(I(f.amount,f.currency))})()}</span>
        </a>
        <span class="mini-side">${U(d.owner_name?{full_name:d.owner_name,initials:d.owner_initials}:null,24)}</span>
      </li>`).join("")}
    </ul>`:k("No enquiries recorded.","",{tone:"quiet"}),{tight:!0,note:C(n.length,"enquiry","enquiries"),action:`<button type="button" class="btn-ghost btn-xs" data-new-opp-for>${c.plus(13)}<span>New</span></button>`}),p=b("Quotations",i.length?`
    <ul class="quotes">
      ${i.map(d=>`<li class="quote">
        <a class="quote-btn" href="#/opportunity/${o(d.opportunities?.id||"")}">
          <span class="quote-ref">${o(d.reference)}</span>
          <span class="quote-val num">${o(I(d.amount,d.currency))}</span>
          <span class="quote-status">${ht(d.status)}</span>
          <span class="quote-when">${d.sent_on?"sent "+o(W(d.sent_on)):"not issued"}</span>
        </a>
      </li>`).join("")}
    </ul>`:k("No quotations yet.","",{tone:"quiet"}),{tight:!0});return`
    <a class="back lnk" href="#/contacts">${c.chevron(13)}<span>Back to contacts</span></a>
    <div class="grid grid-opp">
      <div class="col-wide">${b("History",yt(a),{tight:!0,note:C(a.length,"entry","entries")})}</div>
      <div class="col-side">${r}${l}${p}${Xe(s)}</div>
    </div>`}function gi(e,t,{me:n}){e.addEventListener("click",a=>{if(a.target.closest("[data-edit-contact]"))return ia({contact:N,onDone:t});if(a.target.closest("[data-new-opp-for]"))return aa({me:n,contact:N,onDone:t})}),et(e,{contact_id:N.id},n,t)}function wi(){return N?[N.companies?.name,N.job_title].filter(Boolean).map(o).join(" \xB7 "):""}var fi,N,Fs=O(()=>{Y();K();H();se();Z();Ce();Mt();fi=()=>N?.full_name||"Contact",N=null});var Ws={};ee(Ws,{editOpportunity:()=>$i});async function $i({opp:e,me:t,onDone:n}){let a=await u.profiles();J({title:"Edit enquiry",sub:e.ref,width:620,submitLabel:"Save",body:`
      ${m("title","What is the job?",P("title",e.title,"required"),{wide:!0})}
      <div class="field-row">
        ${m("service","Service",R("service",["",...Nt,...e.service&&!Nt.includes(e.service)?[e.service]:[]],e.service||""))}
        ${m("source","Source",R("source",Zt.map(s=>[s,Re[s]]),e.source))}
      </div>
      ${m("location","Site",P("location",e.location||""),{wide:!0})}
      <div class="field-row">
        ${m("owner_id","Owner",R("owner_id",[["","Unassigned"]].concat(a.map(s=>[s.id,s.full_name])),e.owner_id||""))}
        ${m("priority","Priority",R("priority",Yt.map(s=>[s,bi(s)]),e.priority))}
      </div>
      ${m("site_visit_required","Site visit",`<label class="check"><input type="checkbox" id="site_visit_required" name="site_visit_required"
           ${e.site_visit_required?"checked":""}> <span>A site visit is needed before this can be priced</span></label>`,{wide:!0})}
      ${m("description","What do they want?",z("description",e.description||"",4),{wide:!0})}`,onSubmit:async s=>{if(!s.title)throw j("title","Give the job a name.");await u.updateOpportunity(e.id,{title:s.title,service:v(s.service),source:s.source,location:v(s.location),owner_id:v(s.owner_id),priority:s.priority,site_visit_required:!!s.site_visit_required,description:v(s.description)}),w("Saved."),V(n)}})}var bi,Hs=O(()=>{Y();K();H();de();bi=e=>e.charAt(0).toUpperCase()+e.slice(1)});var Gs={};ee(Gs,{mount:()=>xi,render:()=>vi,sub:()=>ki,title:()=>_i});async function vi(e,{me:t}){if(h=await u.opportunity(e),!h)return k("That enquiry no longer exists.","It may have been deleted.",{tone:"quiet"});let[n,a,s,i,r,l]=await Promise.all([u.activityFor(e),u.quotesFor(e),u.visitsFor(e),u.tasksFor(e),u.filesFor("opportunity_id",e),u.projectForOpportunity(e)]);vt={activity:n,quotes:a,visits:s,tasks:i,files:r,project:l,me:t};let p=xe(h),d=pe(h),f=a.find(x=>x.status==="draft"),_=a.some(x=>x.sent_on),T=Ae(h),q=p.level==="overdue"||p.level==="unbooked",A={full_name:h.contact_name,phone:h.contact_phone,whatsapp:h.contact_whatsapp,email:h.contact_email},Q=`
  <section class="opp-head${q?" opp-head-alarm":""}">
    <div class="opp-head-top">
      <div class="opp-stage-set">
        <span class="opp-ref num">${o(h.ref)}</span>
        <label class="sr-only" for="opp-stage">Stage</label>
        <select class="sel sel-inline" id="opp-stage" data-stage>
          ${qe.map(x=>`<option value="${o(x.id)}"${x.id===h.stage?" selected":""}>${o(x.name)}</option>`).join("")}
        </select>
        ${Je(h.priority)}
        ${ze(h.source)}
      </div>
      <dl class="opp-figs">
        <div><dt>${d.kind==="won"?"Won value":d.kind==="draft"?"Draft quotation":"Quoted"}</dt>
          <dd class="num">${d.amount==null?'<span class="dim">Not quoted yet</span>':o(I(d.amount,d.currency))}</dd></div>
        <div><dt>Enquiry</dt><dd>${o(W(h.created_at))} <span class="dim">(${o(B(h.created_at))})</span></dd></div>
        <div><dt>Last contact</dt><dd>${o(B(h.last_activity_at))}</dd></div>
        <div><dt>Owner</dt><dd class="opp-owner">
          ${U(h.owner_name?{full_name:h.owner_name,initials:h.owner_initials}:null,24)}
          ${o(h.owner_name||"Unassigned")}</dd></div>
      </dl>
    </div>

    <div class="opp-next${q?" is-alarm":""}">
      <span class="opp-next-ic">${q?c.alert(18):c.arrowRight(18)}</span>
      <div class="opp-next-body">
        <p class="opp-next-label">Next action</p>
        ${h.next_action||h.next_action_due?`
          <p class="opp-next-text">${o(h.next_action||"Follow up")}</p>
          <p class="opp-next-meta">
            ${o(h.owner_name||"Unassigned")} \xB7
            ${o(mt(h.next_action_due))} \xB7
            <strong>${o(p.level==="held"?"on hold":ve(h)?ln(h.next_action_due):B(h.next_action_due))}</strong>
          </p>
          ${h.stage==="on_hold"&&h.hold_reason?`<p class="opp-next-meta">On hold: ${o(h.hold_reason)}</p>`:""}
          ${h.customer_replied_at?`<p class="opp-next-meta">Customer replied ${o(B(h.customer_replied_at))} \xB7 ${o(ae(h.customer_replied_at))}</p>`:""}`:Ae(h)?`
          <p class="opp-next-text">Nobody has booked a next action on this enquiry.</p>
          <p class="opp-next-meta">It is open and it is on nobody's list.</p>`:`<p class="opp-next-text">${o(re[h.stage].name)}${h.decided_at?" on "+o(mt(h.decided_at)):""}.</p>
           ${h.lost_reason?`<p class="opp-next-meta">${o(h.lost_reason)}</p>`:""}
           ${h.stage==="won"&&h.won_value!=null?`<p class="opp-next-meta">Accepted value ${o(I(h.won_value,h.currency))}</p>`:""}`}
      </div>
      ${Ae(h)?`<button type="button" class="btn btn-sm" data-followup>
        ${c.calendar(14)}<span>${h.next_action_due?"Change":"Book a follow-up"}</span></button>`:""}
    </div>

    ${T?`<div class="opp-acts" role="group" aria-label="Move this job on">
      ${f?`<button type="button" class="btn btn-sm" data-mark-sent="${o(f.id)}">${c.doc(14)}<span>Mark ${o(f.reference)} as sent</span></button>`:`<button type="button" class="btn btn-sm" data-record-quote>${c.doc(14)}<span>${a.length?"Record a revision":"Record quotation"}</span></button>`}
      <button type="button" class="btn-ghost btn-sm" data-log-followup>${c.phone(14)}<span>Log follow-up</span></button>
      ${_?`<button type="button" class="btn-ghost btn-sm" data-replied>${c.note(14)}<span>Customer replied</span></button>`:""}
      <span class="opp-acts-gap" aria-hidden="true"></span>
      <button type="button" class="btn-ghost btn-sm" data-won>${c.check(14)}<span>Won</span></button>
      <button type="button" class="btn-ghost btn-sm" data-lost>${c.cross(14)}<span>Lost</span></button>
      ${h.stage!=="on_hold"?`<button type="button" class="btn-ghost btn-sm" data-hold>${c.clock(14)}<span>On hold</span></button>`:""}
    </div>`:""}
  </section>`,g=h.is_demo?`<p class="demo-strip" role="note">${c.alert(14)}
    <span><strong>Demonstration record.</strong> Not counted in any total or report.</span></p>`:"",X=b("The job",`
    ${h.description?`<p class="scope">${o(h.description)}</p>`:'<p class="scope dim">No description recorded.</p>'}
    <dl class="kv">
      <div><dt>Service</dt><dd>${o(h.service||"\u2014")}</dd></div>
      <div><dt>Location</dt><dd>${h.location?c.pin(13)+o(h.location):"\u2014"}</dd></div>
      <div><dt>Site visit</dt><dd>${h.site_visit_required?`<span class="warn-inline">${c.alert(13)}Needed</span>`:"Not required"}</dd></div>
      <div><dt>Came in by</dt><dd>${ze(h.source)}</dd></div>
      ${h.lost_reason?`<div class="kv-wide"><dt>Reason lost</dt><dd>${o(h.lost_reason)}</dd></div>`:""}
    </dl>`,{action:`<button type="button" class="btn-ghost btn-xs" data-edit-opp>${c.edit(13)}<span>Edit</span></button>`}),E=b("Customer",h.contact_name?`
    <p class="co-name">${o(h.company_name||"\u2014")}</p>
    <div class="contact">
      ${U({full_name:h.contact_name},34)}
      <div class="contact-body">
        <p class="contact-name">${o(h.contact_name)}</p>
        <div class="contact-lines">
          ${h.contact_phone?`<a class="lnk" href="${o(Ee(h.contact_phone))}">${c.phone(13)}${o(h.contact_phone)}</a>`:""}
          ${h.contact_email?`<a class="lnk" href="${o(Ie(h.contact_email))}">${c.mail(13)}${o(h.contact_email)}</a>`:""}
        </div>
      </div>
    </div>
    <div class="contact-acts">${Te(A,{text:`Good day ${h.contact_name.split(" ")[0]}, Kingson Engineering here regarding ${h.title}.`})}</div>
    ${h.contact_id?`<p class="co-also"><a class="lnk" href="#/contact/${o(h.contact_id)}">
      ${c.users(13)}Full history for this contact</a></p>`:""}`:k("No contact on this enquiry.","",{tone:"quiet"}),{tight:!1}),_e=b("Site visits",s.length?`
    <ul class="mini">
      ${s.map(x=>`<li>
        <button type="button" class="mini-btn" data-visit="${o(x.id)}">
          <span class="mini-main">${o(ae(x.scheduled_at))}
            <span class="pill pill-${x.status==="completed"?"won":x.status==="cancelled"?"lost":"quiet"}">${o(x.status)}</span></span>
          <span class="mini-sub">${o(x.purpose||"Site visit")}${x.location?" \xB7 "+o(x.location):""}</span>
          ${x.outcome?`<span class="mini-sub">${o(x.outcome)}</span>`:""}
        </button>
        <span class="mini-side">${U(x.profiles,24)}</span>
      </li>`).join("")}
    </ul>`:k("No site visit booked.",h.site_visit_required?"This job cannot be priced properly until somebody has been out.":"",{tone:h.site_visit_required?"quiet":"ok"}),{tight:!0,action:`<button type="button" class="btn-ghost btn-xs" data-new-visit>${c.plus(13)}<span>Book</span></button>`}),He=b("Quotations",a.length?`
    <ul class="quotes">
      ${a.map(x=>`<li class="quote">
        <button type="button" class="quote-btn" data-quote="${o(x.id)}">
          <span class="quote-ref">${o(x.reference)}${x.version>1?` <span class="rev">rev ${x.version}</span>`:""}</span>
          <span class="quote-val num">${o(I(x.amount,x.currency))}</span>
          <span class="quote-status">${ht(x.status)}</span>
          <span class="quote-when">${x.sent_at?"sent "+o(ae(x.sent_at))+" \xB7 "+o(B(x.sent_at)):x.sent_on?"sent "+o(W(x.sent_on))+" \xB7 "+o(B(x.sent_on)):"not sent yet"}</span>
        </button>
      </li>`).join("")}
    </ul>
    ${sn(h)?`<p class="risk">${c.alert(14)}
      <span><strong>A quotation is out with no chase booked.</strong>
      A quotation nobody is following up is the most expensive thing in this CRM.</span></p>`:""}`:k("Not quoted yet.","The value of this job is the quotation. Record it when it is ready.",{tone:"quiet"}),{tight:!0,action:T?`<button type="button" class="btn-ghost btn-xs" data-record-quote>${c.plus(13)}<span>${a.length?"Revision":"Record"}</span></button>`:""}),Wt=i.filter(x=>x.status==="open"),qn=b("Tasks",Wt.length?`
    <ul class="mini">
      ${Wt.map(x=>`<li>
        <span class="mini-main">${o(x.title)}</span>
        <span class="mini-sub${x.due_date&&new Date(x.due_date)<new Date?" is-late":""}">
          ${o(W(x.due_date))} \xB7 ${o(B(x.due_date))}${x.channel?" \xB7 "+o(x.channel):""}</span>
        <span class="mini-side">
          ${U(x.profiles,24)}
          <button type="button" class="btn-ghost btn-xs" data-done="${o(x.id)}">${c.check(13)}<span>Done</span></button>
        </span>
      </li>`).join("")}
    </ul>`:k("No open tasks.","",{tone:"ok"}),{tight:!0,action:`<button type="button" class="btn-ghost btn-xs" data-new-task>${c.plus(13)}<span>Add</span></button>`}),En=h.stage!=="won"?"":b("Project",l?`<p class="co-name"><a class="lnk" href="#/project/${o(l.id)}">${o(l.name)}</a></p>
       <p class="co-kind">${ft(l.status)}</p>`:`<p class="modal-message">This enquiry is won and has no project yet.</p>
       <button type="button" class="btn btn-sm" data-convert>${c.briefcase(14)}<span>Open a project</span></button>`),nt=b("Activity",`
    <div class="log-add">
      <button type="button" class="btn-ghost btn-sm" data-log>${c.note(14)}<span>Log a call, message or note</span></button>
    </div>
    ${yt(n)}`,{note:C(n.length,"entry","entries"),tight:!0});return`
    <a class="back lnk" href="#/pipeline">${c.chevron(13)}<span>Back to the pipeline</span></a>
    ${g}
    ${Q}
    <div class="grid grid-opp">
      <div class="col-wide">${X}${nt}</div>
      <div class="col-side">${E}${En}${_e}${He}${qn}${Xe(vt.files)}</div>
    </div>`}function xi(e,t,{me:n}){let a=()=>t();e.addEventListener("change",async s=>{let i=s.target.closest("[data-stage]");if(!i)return;let r=i.value;if(r!==h.stage&&!yn(r,{opp:h,onDone:a,onCancel:()=>{i.value=h.stage}}))try{await u.setStage(h.id,r),w(`Moved to ${re[r].name}.`),await a()}catch(l){w(l.message||"That could not be saved.","bad"),i.value=h.stage}}),e.addEventListener("click",async s=>{let i=f=>s.target.closest(f);if(i("[data-followup]"))return oa({opp:h,me:n,onDone:a});if(i("[data-log]"))return sa({opportunityId:h.id,contactId:h.contact_id,me:n,onDone:a});if(i("[data-record-quote]"))return $s({opp:h,quotes:vt.quotes,onDone:a});if(i("[data-log-followup]"))return fn({opp:h,onDone:a});if(i("[data-replied]"))return _s({opp:h,onDone:a});if(i("[data-won]"))return Xn({opp:h,onDone:a});if(i("[data-lost]"))return ea({opp:h,onDone:a});if(i("[data-hold]"))return ta({opp:h,onDone:a});let r=i("[data-mark-sent]");if(r)return mn({opp:h,quote:vt.quotes.find(f=>f.id===r.dataset.markSent),onDone:a});if(i("[data-new-visit]"))return _t({opp:h,me:n,onDone:a});if(i("[data-new-task]"))return Pt({opp:h,me:n,onDone:a});if(i("[data-convert]"))return ra({opp:h});let l=i("[data-quote]");if(l)return hn({opp:h,quote:vt.quotes.find(f=>f.id===l.dataset.quote),onDone:a});let p=i("[data-visit]");if(p)return _t({opp:h,visit:vt.visits.find(f=>f.id===p.dataset.visit),me:n,onDone:a});let d=i("[data-done]");if(d){try{await u.completeTask(d.dataset.done),w("Task completed."),await a()}catch(f){w(f.message,"bad")}return}if(i("[data-edit-opp]")){let{editOpportunity:f}=await Promise.resolve().then(()=>(Hs(),Ws));return f({opp:h,me:n,onDone:a})}}),et(e,{opportunity_id:h.id},n,a)}function ki(){return h?`${o(h.company_name||h.contact_name||"")} \xB7 ${o(h.service||re[h.stage].name)}`:""}var h,vt,_i,Vs=O(()=>{Y();K();H();se();Z();de();Ce();Rt();Mt();h=null,vt={},_i=()=>h?.title||"Enquiry"});var Ks={};ee(Ks,{mount:()=>Ti,render:()=>Ei,sub:()=>Ci,title:()=>Si});async function fa(e){let t=await u.quotes(qi(Se),{offset:e,limit:ha+1});return xt=t.length>ha,t.slice(0,ha)}async function Ei(e,{me:t}){return It=await u.liveQuotes(),tt=Se==="live"?It:await fa(0),Se==="live"&&(xt=!1),ya()}function ya(){let e=tt,t=`
    <div class="filters">
      <label class="sr-only" for="q-filter">Show</label>
      <select class="sel sel-inline" id="q-filter" data-f>
        <option value="live"${Se==="live"?" selected":""}>Awaiting a decision</option>
        <option value="all"${Se==="all"?" selected":""}>All quotations</option>
        ${Wa.map(s=>`<option value="${s}"${Se===s?" selected":""}>${o(Xt[s])}</option>`).join("")}
      </select>
      <span class="filters-n">${xt?`${e.length}+ quotations`:o(C(e.length,"quotation"))}${xt?"":` \xB7 <span class="num">${o(Qs(e))}</span>`}</span>
    </div>`,n=e.length?we(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Reference</th><th scope="col">Enquiry</th>
        <th scope="col" class="ta-r">Amount</th><th scope="col">Status</th>
        <th scope="col">Sent</th><th scope="col">Chase</th><th scope="col"></th>
      </tr></thead>
      <tbody>
        ${e.map(s=>{let i=s.opportunities,r=s.status==="sent"||s.status==="discussed",l=r&&i&&!i.next_action_due;return`<tr${l?' class="tr-risk"':""}>
            <td><span class="td-main num">${o(s.reference)}</span>${s.version>1?`<span class="td-sub">revision ${s.version}</span>`:""}</td>
            <td><a class="lnk" href="#/opportunity/${o(i?.id||"")}">${o(i?.title||"\u2014")}</a>
                <span class="td-sub">${o(i?.companies?.name||"")}</span></td>
            <td class="ta-r num">${o(I(s.amount,s.currency))}</td>
            <td>${ht(s.status)}</td>
            <td><span class="td-main num">${o(s.sent_at?ae(s.sent_at):W(s.sent_on))}</span><span class="td-sub">${s.sent_on?o(B(s.sent_on))+(s.profiles?.initials?" \xB7 "+o(s.profiles.initials):""):""}</span></td>
            <td>${l?`<span class="pill pill-overdue">${c.alert(13)}No chase booked</span>`:r?`<span class="pill pill-quiet">${o(W(i?.next_action_due))}</span>`:'<span class="dim">\u2014</span>'}</td>
            <td class="ta-r">${s.status==="draft"?`<button type="button" class="btn-ghost btn-xs" data-send="${o(s.id)}">${c.doc(13)}<span>Mark sent</span></button>`:""}
              <button type="button" class="btn-ghost btn-xs" data-edit="${o(s.id)}">${c.edit(13)}<span>Details</span></button></td>
          </tr>`}).join("")}
      </tbody>
    </table>`):k(Se==="live"?"No quotations are out.":"Nothing matches that filter.",Se==="live"?"Everything issued has been decided.":"",{tone:"ok"});return t+b("",n+(xt?'<div class="more-row"><button type="button" class="btn-ghost btn-sm" data-more>Show more quotations</button></div>':""),{tight:!0})}function Ti(e,t,{me:n}){e.addEventListener("change",async a=>{if(a.target.closest("[data-f]")){Se=a.target.value;try{tt=Se==="live"?It:await fa(0),Se==="live"&&(xt=!1),e.innerHTML=ya(),e.querySelector("[data-f]")?.focus()}catch(s){w(s.message||"Those quotations could not be loaded.","bad")}}}),e.addEventListener("click",async a=>{let s=a.target.closest("[data-more]");if(s){s.disabled=!0;try{tt=tt.concat(await fa(tt.length)),e.innerHTML=ya()}catch(p){s.disabled=!1,w(p.message||"Could not load more.","bad")}return}let i=a.target.closest("[data-edit], [data-send]");if(!i)return;let r=tt.find(p=>p.id===(i.dataset.edit||i.dataset.send));if(!r)return;let l=await u.opportunity(r.opportunity_id);i.dataset.send?mn({opp:l,quote:r,onDone:t}):hn({opp:l,quote:r,onDone:t})})}function Ci(){return`${o(C(It.length,"quotation"))} awaiting a decision \xB7 <span class="num">${o(Qs(It))}</span>`}var Qs,Si,ha,tt,It,Se,xt,qi,zs=O(()=>{Y();K();H();se();Z();Rt();de();Qs=e=>{let t={};for(let n of e)t[n.currency]=(t[n.currency]||0)+Number(n.amount||0);return ce(t,{empty:"\u2014"})},Si="Quotations",ha=100,tt=[],It=[],Se="live",xt=!1,qi=e=>e==="all"?"":e==="live"?"status=in.(sent,discussed)":`status=eq.${e}`});var Js={};ee(Js,{mount:()=>Li,render:()=>Ai,sub:()=>Ni,title:()=>Di});async function Ai(e,{me:t}){kt=await u.visits();let n=kt.filter(i=>i.status==="scheduled"&&M(i.scheduled_at)>=0).sort((i,r)=>new Date(i.scheduled_at)-new Date(r.scheduled_at)),a=kt.filter(i=>i.status==="scheduled"&&M(i.scheduled_at)<0).sort((i,r)=>new Date(r.scheduled_at)-new Date(i.scheduled_at)),s=kt.filter(i=>i.status!=="scheduled").sort((i,r)=>new Date(r.scheduled_at)-new Date(i.scheduled_at)).slice(0,30);return`
    ${ga("Booked",n,"Scheduled and still to happen.")}
    ${a.length?ga("Past their date and still open",a,"These were booked and never closed off. Either it happened and needs writing up, or it did not.",!0):""}
    ${ga("Completed and cancelled",s,"The last thirty.")}`}function ga(e,t,n,a=!1){return t.length?b(e,`
    <ul class="fu-list">
      ${t.map(s=>{let i=s.status==="scheduled"&&M(s.scheduled_at)<0;return`
        <li class="fu">
          <span class="fu-when">
            <span class="fu-date num">${o(ae(s.scheduled_at))}</span>
            <span class="fu-rel${i?" is-late":""}">${o(B(s.scheduled_at))}</span>
          </span>
          <div class="fu-main">
            <span class="fu-title">${o(s.opportunities?.title||"Site visit")}</span>
            <span class="fu-sub">${o(s.opportunities?.companies?.name||"")}${s.location?" \xB7 "+c.pin(12)+o(s.location):""}</span>
            <span class="fu-action">${o(s.purpose||"")}</span>
            ${s.outcome?`<span class="fu-action">${c.check(12)}${o(s.outcome)}</span>`:""}
          </div>
          <span class="fu-stage"><span class="pill pill-${s.status==="completed"?"won":s.status==="cancelled"?"lost":i?"overdue":"quiet"}">${o(s.status)}</span></span>
          <span class="fu-owner">${U(s.profiles,26)}</span>
          <span class="fu-do">
            ${s.opportunities?`<a class="btn-ghost btn-xs" href="#/opportunity/${o(s.opportunities.id)}">${c.arrowRight(13)}<span>Open</span></a>`:""}
            <button type="button" class="btn-ghost btn-xs" data-visit="${o(s.id)}">${c.edit(13)}<span>Edit</span></button>
          </span>
        </li>`}).join("")}
    </ul>`,{note:n,tight:!0}):b(e,k("Nothing here.","",{tone:"ok"}),{note:n,tight:!0})}function Li(e,t,{me:n}){e.addEventListener("click",async a=>{let s=a.target.closest("[data-visit]");if(!s)return;let i=kt.find(l=>l.id===s.dataset.visit);if(!i)return;let r=await u.opportunity(i.opportunity_id);_t({opp:r,visit:i,me:n,onDone:t})})}function Ni(){let e=kt.filter(t=>t.status==="scheduled"&&M(t.scheduled_at)>=0).length;return`${o(C(e,"visit"))} booked`}var Di,kt,Ys=O(()=>{Y();K();H();se();Z();Ce();Di="Site visits",kt=[]});var Xs={};ee(Xs,{render:()=>Oi,sub:()=>Mi,title:()=>ji});async function Oi(){if(Bt=await u.projects(),!Bt.length)return b("",k("No projects yet.","When an enquiry is marked won, open a project from it and it appears here.",{tone:"quiet"}),{tight:!0});let e=Bt.filter(n=>["planning","in_progress","on_hold"].includes(n.status)),t=Bt.filter(n=>!["planning","in_progress","on_hold"].includes(n.status));return Zs("Active",e)+Zs("Finished",t)}function Zs(e,t){return t.length?b(e,we(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Project</th><th scope="col">Client</th>
        <th scope="col" class="ta-r">Value</th><th scope="col">Status</th>
        <th scope="col">Target</th><th scope="col">Responsible</th>
      </tr></thead>
      <tbody>
        ${t.map(n=>{let a=n.target_date&&M(n.target_date)<0&&n.status!=="complete";return`<tr${a?' class="tr-risk"':""}>
            <td><a class="lnk lnk-strong" href="#/project/${o(n.id)}">${o(n.name)}</a>
                ${n.opportunities?`<span class="td-sub">from ${o(n.opportunities.ref)}</span>`:""}</td>
            <td>${o(n.companies?.name||n.contacts?.full_name||"\u2014")}</td>
            <td class="ta-r num">${o(I(n.value,n.currency))}</td>
            <td>${ft(n.status)}</td>
            <td><span class="td-main num">${o(W(n.target_date))}</span>
                <span class="td-sub${a?" is-late":""}">${n.target_date?o(B(n.target_date)):""}</span></td>
            <td>${U(n.profiles,24)}</td>
          </tr>`}).join("")}
      </tbody>
    </table>`),{tight:!0,note:`${C(t.length,"project")} \xB7 ${I(Fn(t,n=>n.value))}`}):b(e,k("Nothing here.","",{tone:"quiet"}),{tight:!0})}function Mi(){let e=Bt.filter(t=>["planning","in_progress","on_hold"].includes(t.status));return`${o(C(e.length,"active project"))} \xB7 <span class="num">${o(I(Fn(e,t=>t.value)))}</span>`}var ji,Bt,eo=O(()=>{Y();K();H();se();Z();ji="Projects",Bt=[]});var to={};ee(to,{mount:()=>Pi,render:()=>Ui,sub:()=>Ii,title:()=>Ri});async function Ui(e,{me:t}){if(S=await u.project(e),!S)return k("That project no longer exists.","",{tone:"quiet"});let[n,a]=await Promise.all([u.activityForProject(e),u.filesFor("project_id",e)]),i=`
    <section class="opp-head${S.target_date&&M(S.target_date)<0&&S.status!=="complete"?" opp-head-alarm":""}">
      <div class="opp-head-top">
        <div class="opp-stage-set">
          ${ft(S.status)}
          ${S.opportunities?`<a class="lnk" href="#/opportunity/${o(S.opportunities.id)}">from ${o(S.opportunities.ref)}</a>`:""}
        </div>
        <dl class="opp-figs">
          <div><dt>Value</dt><dd class="num">${o(I(S.value,S.currency))}</dd></div>
          <div><dt>Start</dt><dd>${o(W(S.start_date))}</dd></div>
          <div><dt>Target</dt><dd>${o(W(S.target_date))}
            ${S.target_date?`<span class="dim">(${o(B(S.target_date))})</span>`:""}</dd></div>
          <div><dt>Responsible</dt><dd class="opp-owner">${U(S.profiles,24)}${o(S.profiles?.full_name||"Unassigned")}</dd></div>
        </dl>
      </div>
    </section>`,r=b("The job",`
    ${S.description?`<p class="scope">${o(S.description)}</p>`:'<p class="scope dim">No description.</p>'}
    ${S.notes?`<dl class="kv"><div class="kv-wide"><dt>Notes</dt><dd>${o(S.notes)}</dd></div></dl>`:""}`,{action:`<button type="button" class="btn-ghost btn-xs" data-edit-project>${c.edit(13)}<span>Edit</span></button>`}),l=b("Client",`
    <p class="co-name">${o(S.companies?.name||"\u2014")}</p>
    ${S.contacts?`
      <div class="contact">
        ${U({full_name:S.contacts.full_name},34)}
        <div class="contact-body">
          <p class="contact-name"><a class="lnk" href="#/contact/${o(S.contacts.id)}">${o(S.contacts.full_name)}</a></p>
          <div class="contact-lines">
            ${S.contacts.phone?`<a class="lnk" href="${o(Ee(S.contacts.phone))}">${c.phone(13)}${o(S.contacts.phone)}</a>`:""}
            ${S.contacts.email?`<a class="lnk" href="${o(Ie(S.contacts.email))}">${c.mail(13)}${o(S.contacts.email)}</a>`:""}
          </div>
        </div>
      </div>
      <div class="contact-acts">${Te(S.contacts,{text:`Good day, Kingson Engineering here regarding ${S.name}.`})}</div>`:'<p class="dim">No contact linked.</p>'}`);return`
    <a class="back lnk" href="#/projects">${c.chevron(13)}<span>Back to projects</span></a>
    ${i}
    <div class="grid grid-opp">
      <div class="col-wide">${r}${b("Activity",yt(n),{tight:!0,note:C(n.length,"entry","entries")})}</div>
      <div class="col-side">${l}${Xe(a)}</div>
    </div>`}function Pi(e,t,{me:n}){e.addEventListener("click",a=>{if(a.target.closest("[data-edit-project]"))return la({project:S,me:n,onDone:t})}),et(e,{project_id:S.id},n,t)}function Ii(){return S?[S.companies?.name,lt[S.status]].filter(Boolean).map(o).join(" \xB7 "):""}var Ri,S,no=O(()=>{Y();K();H();se();Z();Ce();Mt();Ri=()=>S?.name||"Project",S=null});async function oo(e,t){let n=await crypto.subtle.importKey("raw",ao.encode(e),"PBKDF2",!1,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:t,iterations:31e4,hash:"SHA-256"},n,{name:"AES-GCM",length:256},!1,["encrypt","decrypt"])}async function io(e,t){if(t.length<16)throw new Error("Use a unique backup passphrase of at least 16 characters.");let n=crypto.getRandomValues(new Uint8Array(16)),a=crypto.getRandomValues(new Uint8Array(12)),s=await crypto.subtle.encrypt({name:"AES-GCM",iv:a},await oo(t,n),ao.encode(JSON.stringify(e)));return{format:"kingson-crm-backup",version:1,kdf:"PBKDF2-SHA256",iterations:31e4,salt:xn(n),iv:xn(a),ciphertext:xn(new Uint8Array(s))}}async function ro(e,t){if(e.format!=="kingson-crm-backup"||e.version!==1||e.iterations!==31e4)throw new Error("Unsupported backup format.");let n=await crypto.subtle.decrypt({name:"AES-GCM",iv:vn(e.iv)},await oo(t,vn(e.salt)),vn(e.ciphertext)),a=JSON.parse(new TextDecoder().decode(n));if(a.format!=="kingson-crm-application-export"||!a.tables||!Array.isArray(a.files))throw new Error("Invalid backup contents.");for(let s of a.files)if(await so(vn(s.bytes))!==s.sha256)throw new Error("File integrity check failed.");return a}async function lo(){let e={},t=["profiles","crm_settings","enquiries","companies","contacts","opportunities","activities","tasks","site_visits","quotes","projects","files","notification_outbox"];for(let s of t){let i=[];for(let r=0;;r+=500){let l=await y.select(s,`select=*&order=id&limit=500&offset=${r}`);if(i.push(...l),l.length<500)break}e[s]=i}let n=[],a=0;for(let s of e.files){if(a+=Number(s.size_bytes||0),a>100*1024*1024)throw new Error("This export exceeds 100 MB. Use the documented operator backup procedure.");let i=await fetch(await Lt.signedUrl(Ht,s.path,120));if(!i.ok)throw new Error("A file could not be backed up. No incomplete export was saved.");let r=new Uint8Array(await i.arrayBuffer());n.push({path:s.path,bytes:xn(r),sha256:await so(r)})}return{format:"kingson-crm-application-export",version:1,created_at:new Date().toISOString(),schema:"20261025083326_crm_security_hardening",tables:e,files:n,scope:"CRM application rows and indexed file bytes. Excludes Auth credentials, secrets, private security tables and unindexed storage objects. Reads are sequential, not a database transaction snapshot."}}var ao,xn,vn,so,co=O(()=>{De();st();ao=new TextEncoder,xn=e=>{let t="";for(let n=0;n<e.length;n+=8192)t+=String.fromCharCode(...e.subarray(n,n+8192));return btoa(t)},vn=e=>Uint8Array.from(atob(e),t=>t.charCodeAt(0)),so=async e=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",e)),t=>t.toString(16).padStart(2,"0")).join("")});var mo={};ee(mo,{mount:()=>Zi,render:()=>Qi,sub:()=>Xi,title:()=>Vi});function Gi(e){let t=e.mail_checked_at?` Checked ${ae(e.mail_checked_at)}.`:"";return e.mail_status?.startsWith("configured:")?{ok:!0,tone:"status-ok",text:`Email provider set up (${e.mail_status.slice(11)}).${t}`}:e.mail_status==="not_configured"?{ok:!1,tone:"status-off",text:`No email provider is set up, so the CRM cannot send email.${t}`}:{ok:!1,tone:"status-bad",text:"Not checked yet. The notification service has not run."}}async function Qi(e,{me:t}){me=await u.settings().catch(()=>null);let n=Ki(t)+zi(t);if(t?.role!=="admin")return`${po()}${n}`;let a;[wa,kn,a]=await Promise.all([u.profiles(),u.enquiries(60),u.outbox(20).catch(()=>null)]);let s=b("People",we(`
    <table class="tbl tbl-rows">
      <thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col"></th></tr></thead>
      <tbody>
        ${wa.map(d=>`<tr>
          <td><span class="lnk-strong">${U(d,24)}<span>${o(d.full_name)}</span></span></td>
          <td>
            <label class="sr-only" for="r-${o(d.id)}">Role for ${o(d.full_name)}</label>
            <select class="sel sel-inline" id="r-${o(d.id)}" data-role="${o(d.id)}"${d.id===t.id?' disabled title="You cannot change your own role"':""}>
              <option value="staff"${d.role==="staff"?" selected":""}>Staff</option>
              <option value="admin"${d.role==="admin"?" selected":""}>Administrator</option>
            </select>
          </td>
          <td>${d.active?'<span class="pill pill-won">Active</span>':'<span class="pill pill-lost">Deactivated</span>'}</td>
          <td class="ta-r">${d.id===t.id?'<span class="dim">you</span>':`<button type="button" class="btn-ghost btn-xs" data-active="${o(d.id)}" data-to="${d.active?"false":"true"}">
                 ${d.active?"Deactivate":"Reactivate"}</button>`}</td>
        </tr>`).join("")}
      </tbody>
    </table>`),{tight:!0,note:"Staff handle the enquiries. Administrators can also change roles, deactivate people and set how email is sent."}),i=b("Adding somebody",`
    <p class="scope">New accounts are created in the Supabase dashboard under
      <strong>Authentication \u2192 Users</strong>. A profile row appears here automatically the
      moment the account is created, as inactive Staff. Verify the person, then activate their account here.
      Change the role above only if they need administrator access.</p>
    <p class="scope">Deactivating somebody keeps everything they did \u2014 their calls, their
      quotations, their site visits \u2014 and stops them signing in. Deleting the account would
      take the history with it, which is why this screen does not offer it.</p>`),r=b("Website enquiry log",kn.length?we(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Received</th><th scope="col">From</th><th scope="col">Contact</th>
        <th scope="col">Needs</th><th scope="col">Became</th>
      </tr></thead>
      <tbody>
        ${kn.map(d=>`<tr${d.spam?' class="is-done"':""}>
          <td><span class="td-main num">${o(ae(d.created_at))}</span></td>
          <td><span class="td-main">${o(d.name)}</span><span class="td-sub">${o(d.company||"")}</span></td>
          <td><span class="td-sub">${o(d.contact)}</span></td>
          <td><span class="td-sub">${o(d.service||"\u2014")}${d.location?" \xB7 "+o(d.location):""}</span></td>
          <td>${d.spam?'<span class="pill pill-lost">Blocked as spam</span>':d.opportunity_id?`<a class="lnk" href="#/opportunity/${o(d.opportunity_id)}">enquiry</a>`:'<span class="pill pill-overdue">not converted</span>'}</td>
        </tr>`).join("")}
      </tbody>
    </table>`):k("No website enquiries yet.","Everything submitted on the website form lands here and in Enquiries.",{tone:"quiet"}),{tight:!0,note:`${C(kn.length,"submission")} \xB7 the last sixty`}),l=await y.rpc("crm_security_health").catch(()=>null),p=b("Security and continuity",`
    <p class="scope">${l?`Two-step sign-in enforcement: <strong>${l.mfa_enforced?"On":"Awaiting coordinated release"}</strong>.
      Active accounts without an authenticator: ${Number(l.accounts_without_mfa)}.
      Enquiries without a CRM record: ${Number(l.unconverted_enquiries)}.`:"Security status could not be verified. Ask the account owner to check the backend."}</p>
    ${l?`<p class="field-hint">Files awaiting a successful scan: ${Number(l.files_pending||0)}. Blocked files: ${Number(l.files_blocked||0)}.<br>
      Latest scanner check: ${l.latest_scan?`${o(ae(l.latest_scan.at))} \u2014 ${l.latest_scan.status==="verified"?"passed":"attention required"}`:"not recorded"}.<br>
      Latest operator backup: ${l.latest_backup?`${o(ae(l.latest_backup.at))} \u2014 ${l.latest_backup.status==="verified"?"encrypted and restore-tested":"attention required"}`:"not recorded"}.<br>
      Scanning and daily operator backups require the owner\u2019s computer to be on and signed in. OneDrive cloud sync must also be working.</p>`:""}
    <p class="field-hint">Review staff access monthly. Deactivate leavers immediately. Automatic email delivery is handled separately.</p>
    <form data-backup-form class="settings-grid">
      <div class="field"><label for="backup-password">Unique backup passphrase</label>
        <input class="inp" id="backup-password" type="password" autocomplete="off" minlength="16" required>
        <p class="field-hint">At least 16 characters. Keep it securely: a lost passphrase cannot be recovered.</p></div>
      <div class="field"><button class="btn" type="submit">Download encrypted application backup</button></div>
    </form>
    <p class="field-hint">Includes CRM records and indexed files, verified before download. Excludes authentication credentials and secrets. Keep an off-device copy. This export is sequential; use an operator database backup for a transactional disaster-recovery snapshot.</p>`);return`${po()}${n}${p}${Ji(a)}${s}${i}${r}`}function Ki(e){if(!me)return b("Working rules",k("The settings could not be read.","",{tone:"quiet"}));let t=e?.role==="admin",n=(me.working_weekdays||[]).map(a=>Bi[a]).join(", ");return b("Working rules",`
    <div class="settings-grid">
      <div class="field">
        <label for="fu-days">Follow up a sent quotation after</label>
        <select class="sel" id="fu-days" data-fu-days ${t?"":"disabled"}>
          ${[1,2,3,4,5,7,10].map(a=>`<option value="${a}"${a===me.quote_followup_working_days?" selected":""}>${a} working day${a===1?"":"s"}</option>`).join("")}
        </select>
        <p class="field-hint">Working days: ${o(n)}. Applied when a quotation is marked sent.</p>
      </div>
    </div>
    <p class="field-hint">Customer replies are recorded by hand with \u201CCustomer replied\u201D. The CRM cannot
      see any inbox, and does not claim to.</p>`,{note:t?"Administrators can change these":"Set by an administrator"})}function zi(e){if(!me)return"";if(!("mail_status"in me))return b("Email notifications",k("Waiting for the database update.","Notifications need the 2026-09-25 migrations. Until then nothing is sent.",{tone:"quiet"}));let t=e?.role==="admin",n=t?"":"disabled",a=Gi(me),s=me.email_mode,i=(l,p)=>`<label class="check"><input type="checkbox" data-set="${l}" data-type="bool"
      ${me[l]?"checked":""} ${n}><span>${o(p)}</span></label>`,r=(l,p,d)=>`<div class="field">
      <label for="${p}">${o(d)}</label>
      <input class="inp" id="${p}" type="text" inputmode="email" data-set="${l}" data-type="emails"
        value="${o((me[l]||[]).join(", "))}" placeholder="Every active administrator" ${n}>
      <p class="field-hint">Separate addresses with commas. Left blank, it goes to every active administrator.</p>
    </div>`;return b("Email notifications",`
    <p class="status-line ${a.tone}"><span class="status-dot" aria-hidden="true"></span><span>${o(a.text)}</span></p>
    <div class="settings-grid">
      <div class="field">
        <label for="mail-mode">Sending</label>
        <select class="sel" id="mail-mode" data-set="email_mode" ${n}>
          <option value="manual"${s==="manual"?" selected":""}>Off</option>
          <option value="test"${s==="test"?" selected":""}>Test mailbox only</option>
          <option value="live"${s==="live"?" selected":""}${a.ok||s==="live"?"":" disabled"}>Live${a.ok?"":" (needs an email provider)"}</option>
        </select>
        <p class="field-hint">${o(Fi[s]||"")}</p>
      </div>
      <div class="field">
        <label for="test-box">Test mailbox</label>
        <input class="inp" id="test-box" type="email" data-set="test_mailbox" data-type="email"
          value="${o(me.test_mailbox||"")}" placeholder="A mailbox you control" ${n}>
        <p class="field-hint">Used only in test mode. Never a customer.</p>
      </div>
      ${r("alert_recipients","alert-to","New enquiry alerts go to")}
      ${r("digest_recipients","digest-to","The full morning digest goes to")}
      <div class="field">
        <label for="digest-hour">Morning digest at</label>
        <select class="sel" id="digest-hour" data-set="digest_hour" data-type="int" ${n}>
          ${[5,6,7,8,9,10,11].map(l=>`<option value="${l}"${l===me.digest_hour?" selected":""}>${String(l).padStart(2,"0")}:00 Harare time</option>`).join("")}
        </select>
        <p class="field-hint">Working days only. Each owner also gets their own items.</p>
      </div>
      <div class="field">
        <label for="crm-url">CRM address in emails</label>
        <input class="inp" id="crm-url" type="url" data-set="crm_url" data-type="url"
          value="${o(me.crm_url||"")}" placeholder="https://www.kingsonengineering.co.zw/crm/" ${n}>
        <p class="field-hint">Links in alerts and the digest open this address.</p>
      </div>
    </div>
    <div class="check-list">
      ${i("notify_new_enquiry","Email the office when a website enquiry arrives")}
      ${i("send_acknowledgement","Send the customer one acknowledgement with their reference (website enquiries with an email address)")}
      ${i("digest_enabled","Send the morning digest of overdue and due-today follow-ups")}
    </div>
    <p class="field-hint">The CRM never chases a customer by itself. Follow-ups to customers are written and sent by a person.</p>`,{note:t?"Administrators can change these":"Set by an administrator"})}function Ji(e){return e?b("Sent and waiting email",e.length?we(`
    <table class="tbl tbl-rows">
      <thead><tr><th scope="col">Queued</th><th scope="col">What</th><th scope="col">To</th><th scope="col">Status</th></tr></thead>
      <tbody>
        ${e.map(t=>`<tr>
          <td><span class="td-main num">${o(ae(t.created_at))}</span></td>
          <td><span class="td-main">${o(Wi[t.kind]||t.kind)}</span>${t.opportunity_id?`<a class="td-sub lnk" href="#/opportunity/${o(t.opportunity_id)}">open the enquiry</a>`:""}</td>
          <td><span class="td-sub">${o(t.recipient||"\u2014")}</span></td>
          <td><span class="pill ${Hi[t.status]||""}">${o(t.status)}</span>${t.last_error?`<span class="td-sub">${o(t.last_error)}</span>`:""}</td>
        </tr>`).join("")}
      </tbody>
    </table>`):k("Nothing queued yet.","Office alerts, acknowledgements and digests appear here.",{tone:"quiet"}),{tight:!0,note:"The last twenty"}):""}function Yi(e){if(e.closest("[data-fu-days]"))return{quote_followup_working_days:Number(e.value)};let t=e.dataset?.set;if(!t)return null;let n=e.value.trim();switch(e.dataset.type){case"bool":return{[t]:e.checked};case"int":return{[t]:Number(n)};case"email":if(n&&!uo.test(n))throw new Error("That email address does not look right.");return{[t]:n||null};case"emails":{let a=n.split(/[\s,;]+/).filter(Boolean).map(i=>i.toLowerCase()),s=a.find(i=>!uo.test(i));if(s)throw new Error(`\u201C${s}\u201D is not an email address.`);return{[t]:[...new Set(a)]}}case"url":if(n&&!/^https:\/\/\S+$/.test(n))throw new Error("Use the full https:// address.");return{[t]:n||null};default:return{[t]:n}}}function Zi(e,t,{me:n}){e.querySelector("[data-backup-form]")?.addEventListener("submit",async a=>{if(a.preventDefault(),n?.role!=="admin")return;let s=a.currentTarget,i=s.querySelector("input"),r=s.querySelector("button"),l=i.value;i.value="",r.disabled=!0,r.textContent="Collecting and verifying\u2026";try{let p=await io(await lo(),l);await ro(p,l);let d=URL.createObjectURL(new Blob([JSON.stringify(p)],{type:"application/json"})),f=document.createElement("a");f.href=d,f.download=`kingson-crm-${new Date().toISOString().slice(0,10)}.encrypted.json`,document.body.append(f),f.click(),f.remove(),setTimeout(()=>URL.revokeObjectURL(d),3e4),w("Encrypted application backup downloaded. Keep it and the passphrase separately.")}catch(p){w(p.message||"Backup failed. No incomplete export was saved.","bad")}finally{r.disabled=!1,r.textContent="Download encrypted application backup"}}),e.addEventListener("change",async a=>{if(a.target.closest("[data-demo]")){ns(a.target.checked),location.reload();return}let s;try{s=Yi(a.target)}catch(i){w(i.message,"bad");return}if(s)try{await u.updateSettings({...s,updated_by:n?.id||null,updated_at:new Date().toISOString()}),w("Saved."),await t()}catch(i){w(i.message||"That could not be saved.","bad"),await t()}}),e.addEventListener("change",async a=>{let s=a.target.closest("[data-role]");if(s)try{await y.update("profiles",F("id",s.dataset.role),{role:s.value}),w("Role updated."),await t()}catch(i){w(i.message||"That could not be changed.","bad"),await t()}}),e.addEventListener("click",async a=>{let s=a.target.closest("[data-active]");if(s)try{await y.update("profiles",F("id",s.dataset.active),{active:s.dataset.to==="true"}),w(s.dataset.to==="true"?"Reactivated.":"Deactivated."),await t()}catch(i){w(i.message||"That could not be changed.","bad")}})}function Xi(){return`${o(C(wa.length,"person","people"))}`}var Bi,Fi,Wi,Hi,uo,Vi,wa,kn,me,po,ho=O(()=>{Y();H();se();Z();de();cn();co();Bi=["","Mon","Tue","Wed","Thu","Fri","Sat","Sun"],Fi={manual:"Off. The CRM sends no email. Alerts and acknowledgements are recorded in the outbox as not sent.",test:"Test. Every email the CRM would send goes to the test mailbox below, and nowhere else.",live:"Live. Office alerts, the morning digest and website acknowledgements go to their real recipients."},Wi={new_enquiry:"Office alert",acknowledgement:"Acknowledgement",digest:"Morning digest"},Hi={sent:"pill-won",failed:"pill-lost",skipped:"pill-overdue",pending:"",sending:""},uo=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;Vi="Settings",wa=[],kn=[],me=null,po=()=>b("Demonstration records",`
  <p class="scope">Sample jobs and test submissions are flagged as demonstration data. They are
    left out of every list, count and total unless you switch them on here \u2014 and then only in
    this browser, with a warning strip across the top of every screen.</p>
  <label class="check"><input type="checkbox" data-demo ${Le()?"checked":""}>
    <span>Show demonstration records in this browser</span></label>`)});var fo={};ee(fo,{mount:()=>nr,render:()=>tr,title:()=>er});async function tr(e,{me:t}){return b("Signed in as",`
      <p class="scope"><strong>${o(t?.full_name||"")}</strong> \xB7 ${o(Hn())}
        \xB7 ${t?.role==="admin"?"Administrator":"Staff"}</p>
      <p class="field-hint">To change the email you sign in with, ask an administrator.</p>`)+b("Change password",`
      <form class="settings-grid" data-pw-form novalidate>
        ${m("pw-current","Current password",ba("pw-current","current-password"))}
        ${m("pw-new","New password",ba("pw-new","new-password"),{hint:"At least 14 characters. Use a unique passphrase."})}
        ${m("pw-again","New password again",ba("pw-again","new-password"))}
        <div class="field"><button type="submit" class="btn">Change password</button></div>
      </form>`,{note:"Changing your password signs out other devices. Two-step sign-in is required. Sessions end after 30 minutes idle or eight hours."})}function nr(e){let t=e.querySelector("[data-pw-form]");t.addEventListener("submit",async n=>{n.preventDefault(),Jn(t);let a=Object.fromEntries(new FormData(t));if(!a["pw-current"])return Ze(t,"pw-current","Enter your current password.");if(a["pw-new"].length<14)return Ze(t,"pw-new","Use at least 14 characters.");if(a["pw-new"]!==a["pw-again"])return Ze(t,"pw-again","The two new passwords do not match.");if(a["pw-new"]===a["pw-current"])return Ze(t,"pw-new","Choose a password you have not used here.");let s=t.querySelector('[type="submit"]');s.disabled=!0;try{await Ja(a["pw-current"],a["pw-new"]),t.reset(),w("Password changed. Use the new one next time you sign in.")}catch(i){i.field?Ze(t,i.field,i.message):w(i.message||"The password could not be changed.","bad")}finally{s.disabled=!1}})}var er,ba,yo=O(()=>{on();se();de();H();er="My account",ba=(e,t)=>`<input class="inp" id="${e}" name="${e}" type="password" autocomplete="${t}" required>`});var _a={};ee(_a,{openSearch:()=>sr});function sr(e=""){if(he){he.querySelector("input").focus();return}let t=document.activeElement;he=document.createElement("div"),he.className="modal search-modal",he.innerHTML=`
    <div class="modal-card search-card" role="dialog" aria-modal="true" aria-label="Search">
      <div class="search-bar">
        ${c.search(17)}
        <label class="sr-only" for="gs-q">Search</label>
        <input class="search-input" id="gs-q" type="search" autocomplete="off" spellcheck="false"
               placeholder="Name, company, phone, email, ENQ-\u2026 or Q-\u2026" value="${o(e)}"
               role="combobox" aria-expanded="false" aria-controls="gs-results" aria-autocomplete="list">
        <button type="button" class="btn-ghost btn-xs" data-close>Close</button>
      </div>
      <div class="search-results" id="gs-results" role="listbox" aria-label="Results">
        <p class="search-hint">Type at least two characters. Phone numbers match however they are written.</p>
      </div>
    </div>`,document.body.appendChild(he),document.body.classList.add("is-modal");let n=he.querySelector("input"),a=he.querySelector("#gs-results"),s=0,i=0,r=-1,l=()=>{he.remove(),he=null,document.body.classList.remove("is-modal"),document.removeEventListener("keydown",_,!0),t&&document.contains(t)&&t.focus()},p=()=>[...a.querySelectorAll(".search-hit")],d=T=>{let q=p();q.length&&(r=(T+q.length)%q.length,q.forEach((A,Q)=>A.setAttribute("aria-selected",String(Q===r))),q[r].scrollIntoView({block:"nearest"}),n.setAttribute("aria-activedescendant",q[r].id))};async function f(){let T=n.value.trim(),q=++i;if(r=-1,T.length<2){a.innerHTML='<p class="search-hint">Type at least two characters. Phone numbers match however they are written.</p>',n.setAttribute("aria-expanded","false");return}a.innerHTML='<p class="search-hint">Searching\u2026</p>';try{let A=await u.search(T,8);if(q!==i)return;if(!A.length){a.innerHTML=`<p class="search-hint">Nothing matches \u201C${o(T)}\u201D.
          Check the spelling, or search by phone number or reference.</p>`;return}let Q=0;a.innerHTML=ar.map(g=>{let X=A.filter(E=>E.kind===g).sort((E,_e)=>E.rank-_e.rank);return X.length?`<p class="search-group">${o($a[g].label)}${X.length>1?"s":""}</p>`+X.map(E=>`
            <a class="search-hit" id="gs-${Q++}" role="option" aria-selected="false" href="${o($a[g].href(E))}">
              <span class="search-kind search-kind-${o(g)}">${o($a[g].label)}</span>
              <span class="search-main">
                <span class="search-title">${E.ref&&g==="enquiry"?`<span class="num">${o(E.ref)}</span> \xB7 `:""}${o(E.title||"")}</span>
                <span class="search-sub">${o(E.subtitle||"")}${E.stage&&re[E.stage]?` \xB7 ${o(re[E.stage].short)}`:""}</span>
              </span>
            </a>`).join(""):""}).join(""),n.setAttribute("aria-expanded","true"),d(0)}catch(A){if(q!==i)return;a.innerHTML=`<p class="search-hint search-bad">${o(A?.message||"Search failed.")}</p>`}}function _(T){if(T.key==="Escape"){T.preventDefault(),l();return}if(T.key==="ArrowDown"){T.preventDefault(),d(r+1);return}if(T.key==="ArrowUp"){T.preventDefault(),d(r-1);return}if(T.key==="Enter"&&document.activeElement===n){let q=p()[r];q&&(T.preventDefault(),location.hash=q.getAttribute("href"),l())}}n.addEventListener("input",()=>{clearTimeout(s),s=setTimeout(f,180)}),a.addEventListener("click",T=>{T.target.closest(".search-hit")&&l()}),he.querySelector("[data-close]").addEventListener("click",l),he.addEventListener("mousedown",T=>{T.target===he&&l()}),document.addEventListener("keydown",_,!0),n.focus(),e&&f()}var $a,ar,he,va=O(()=>{Y();K();H();Z();$a={contact:{label:"Contact",href:e=>`#/contact/${e.id}`},enquiry:{label:"Enquiry",href:e=>`#/opportunity/${e.id}`},quote:{label:"Quote",href:e=>`#/opportunity/${e.id}`},project:{label:"Project",href:e=>`#/project/${e.id}`}},ar=["enquiry","quote","contact","project"],he=null});on();De();De();H();async function ts(e,t,n){let a=await Ln(),s=(a.factors||[]).filter(f=>f.factor_type==="totp"&&f.status==="verified"),{getSession:i}=await Promise.resolve().then(()=>(De(),Pn)),r;try{r=JSON.parse(atob(i().access_token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")))}catch{throw new Error("The sign-in session could not be read. Sign in again.")}if(r.aal==="aal2"&&s.length)return t();let l=s[0],p=null;if(!l){for(let f of a.factors||[])f.factor_type==="totp"&&f.status==="unverified"&&await jn(f.id);p=await Nn(),l=p}if(e.innerHTML=`<div class="signin"><form class="signin-card" data-mfa-form novalidate>
    <p class="signin-mark display">KINGSON</p><p class="signin-sub">Enquiries &amp; Projects</p>
    <h1 class="signin-title">${p?"Set up two-step sign-in":"Authenticator code"}</h1>
    ${p?`<p class="signin-note">Add this key to your authenticator app. Keep a secure copy in your password manager so you can recover access if your phone is lost.</p>
      <div data-qr></div><p class="field-hint">Setup key</p><code class="mfa-secret">${o(p.totp.secret)}</code>`:'<p class="signin-note">Enter the current six-digit code from your authenticator app. If you have lost your device, ask the account owner to follow the documented recovery procedure.</p>'}
    ${s.length>1?`<div class="field"><label for="mfa-device">Authenticator</label><select class="sel" id="mfa-device">${s.map(f=>`<option value="${o(f.id)}">${o(f.friendly_name||"Authenticator")}</option>`).join("")}</select></div>`:""}
    <div class="field"><label for="mfa-code">Six-digit code</label>
      <input class="inp" id="mfa-code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></div>
    <p class="signin-err" role="alert" hidden></p>
    <button class="btn" type="submit">Verify and continue</button>
    <button class="signin-link" type="button" data-cancel>Sign out</button></form></div>`,p?.totp?.qr_code){let f=document.createElement("img");f.alt="Scan with your authenticator app to secure your Kingson CRM account",f.width=200,f.height=200,f.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(p.totp.qr_code)}`,e.querySelector("[data-qr]").append(f)}e.querySelector("[data-cancel]").addEventListener("click",n);let d=e.querySelector("form");d.querySelector("input").focus(),d.addEventListener("submit",async f=>{f.preventDefault();let _=d.querySelector('[role="alert"]'),T=d.querySelector("input").value.trim();if(_.hidden=!0,!/^\d{6}$/.test(T)){_.textContent="Enter the six digits from your authenticator.",_.hidden=!1;return}let q=d.querySelector('[type="submit"]');q.disabled=!0;try{await On(d.querySelector("select")?.value||l.id,T),e.replaceChildren(),await t()}catch(A){if(!e.contains(_))throw A;_.textContent=A.message||"The code could not be verified. Try the next code.",_.hidden=!1,q.disabled=!1}})}Y();K();cn();H();Z();var jo=[{key:"dashboard",href:"#/",label:"Dashboard",ic:"dashboard"},{key:"pipeline",href:"#/pipeline",label:"Enquiries",ic:"pipeline"},{key:"followups",href:"#/followups",label:"Follow-ups",ic:"bell",badge:!0},{key:"tasks",href:"#/tasks",label:"Tasks",ic:"task"},{key:"contacts",href:"#/contacts",label:"Contacts",ic:"users"},{key:"quotes",href:"#/quotes",label:"Quotations",ic:"doc"},{key:"visits",href:"#/visits",label:"Site visits",ic:"pin"},{key:"projects",href:"#/projects",label:"Projects",ic:"briefcase"},{key:"settings",href:"#/settings",label:"Settings",ic:"shield"}];function Qn(e,t,{overdue:n=0}={}){return`
  <div class="rail-top">
    <a class="mark" href="#/">
      <span class="mark-name display">KINGSON</span>
      <span class="mark-sub">Enquiries &amp; Projects</span>
    </a>
  </div>

  <nav class="rail-nav" aria-label="Sections">${jo.filter(s=>!s.admin||t?.role==="admin").map(s=>`
      <a class="rail-link${e===s.key?" is-active":""}" href="${s.href}"
         ${e===s.key?'aria-current="page"':""}>
        ${c[s.ic](17)}<span>${o(s.label)}</span>
        ${s.badge&&n?`<span class="rail-count" title="${o(n)} overdue">${o(n)}</span>`:""}
      </a>`).join("")}</nav>

  <div class="rail-foot">
    <div class="rail-me">
      <span class="avatar" style="--s:30px">${o(t?.initials||"?")}</span>
      <span class="rail-me-body">
        <span class="rail-me-name">${o(t?.full_name||"")}</span>
        <span class="rail-me-role">${o(t?.role==="admin"?"Administrator":"Staff")}</span>
      </span>
    </div>
    <a class="rail-signout" href="#/account">${c.shield(14)}<span>My account</span></a>
    <button type="button" class="rail-signout" data-signout>${c.logout(14)}<span>Sign out</span></button>
  </div>`}var dn=(e,t="",n="")=>`
  <div class="topbar-in">
    <button type="button" class="topbar-menu" data-rail-open aria-expanded="false" aria-controls="rail">
      ${c.menu(18)}<span class="sr-only">Open navigation</span>
    </button>
    <div class="topbar-titles">
      <h1 class="topbar-title display">${o(e)}</h1>
      ${t?`<p class="topbar-sub">${t}</p>`:""}
    </div>
    <div class="topbar-actions">
      <button type="button" class="topbar-search" data-search-open aria-haspopup="dialog">
        ${c.search(15)}<span class="topbar-search-label">Search name, phone, ENQ or quote no.</span>
        <kbd class="topbar-kbd" aria-hidden="true">/</kbd>
      </button>
      ${n}
      <button type="button" class="btn btn-sm topbar-new" data-new-opp>${c.plus(14)}<span>New enquiry</span></button>
    </div>
  </div>`,is=(e="")=>`
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

      <p class="signin-err" role="alert" ${e?"":"hidden"}>${o(e)}</p>
      <button type="submit" class="btn" data-signin>Sign in</button>
      <button type="button" class="signin-link" data-forgot>Forgot your password?</button>
      <p class="signin-foot">Kingson Engineering internal system. Access is by account only.</p>
    </form>
  </div>`,rs=(e="")=>`
  <div class="signin">
    <form class="signin-card" id="forgot-form" novalidate>
      <p class="signin-mark display">KINGSON</p>
      <p class="signin-sub">Enquiries &amp; Projects</p>
      <h1 class="signin-title">Reset your password</h1>
      <p class="signin-note">Enter the email address you sign in with. If it has an account, a link to
        choose a new password will arrive in a few minutes. The link works once, for one hour.</p>
      <div class="field">
        <label for="fp-email">Email</label>
        <input class="inp" id="fp-email" name="email" type="email" autocomplete="username"
               inputmode="email" autocapitalize="none" spellcheck="false" value="${o(e)}" required>
      </div>
      <p class="signin-err" role="alert" hidden></p>
      <p class="signin-ok" role="status" hidden></p>
      <button type="submit" class="btn" data-send>Send the link</button>
      <button type="button" class="signin-link" data-back>Back to sign in</button>
    </form>
  </div>`,Kn=({error:e=""}={})=>`
  <div class="signin">
    <form class="signin-card" id="reset-form" novalidate>
      <p class="signin-mark display">KINGSON</p>
      <p class="signin-sub">Enquiries &amp; Projects</p>
      <h1 class="signin-title">${e?"That link has not worked":"Choose a new password"}</h1>
      ${e?`<p class="signin-note">${o(e)}</p>
        <button type="button" class="btn" data-forgot>Send a new link</button>
        <button type="button" class="signin-link" data-back>Back to sign in</button>`:`
      <div class="field">
        <label for="np-1">New password</label>
        <input class="inp" id="np-1" type="password" autocomplete="new-password" minlength="14" required>
        <p class="field-hint">At least 14 characters. A short sentence is easier to remember than a code.</p>
      </div>
      <div class="field">
        <label for="np-2">The same again</label>
        <input class="inp" id="np-2" type="password" autocomplete="new-password" required>
      </div>
      <p class="signin-err" role="alert" hidden></p>
      <button type="submit" class="btn" data-save>Save and sign in</button>`}
    </form>
  </div>`;se();de();H();var je=document.getElementById("app"),Ft=document.getElementById("rail"),We=document.getElementById("topbar"),$e=document.getElementById("view"),Ta=document.getElementById("scrim"),oe=document.getElementById("gate");if(Le()){let e=document.createElement("p");e.className="demo-banner",e.setAttribute("role","note"),e.innerHTML="<strong>Demonstration records are showing.</strong>&nbsp;Totals include sample data. Switch off in Settings.",We.before(e)}var ka={dashboard:()=>Promise.resolve().then(()=>(fs(),hs)),pipeline:()=>Promise.resolve().then(()=>(Es(),qs)),followups:()=>Promise.resolve().then(()=>(Cs(),Ts)),tasks:()=>Promise.resolve().then(()=>(Ms(),Os)),contacts:()=>Promise.resolve().then(()=>(Is(),Ps)),contact:()=>Promise.resolve().then(()=>(Fs(),Bs)),opportunity:()=>Promise.resolve().then(()=>(Vs(),Gs)),quotes:()=>Promise.resolve().then(()=>(zs(),Ks)),visits:()=>Promise.resolve().then(()=>(Ys(),Js)),projects:()=>Promise.resolve().then(()=>(eo(),Xs)),project:()=>Promise.resolve().then(()=>(no(),to)),settings:()=>Promise.resolve().then(()=>(ho(),mo)),account:()=>Promise.resolve().then(()=>(yo(),fo))},or={opportunity:"pipeline",contact:"contacts",project:"projects"},fe=Ca(),Sa=0;function Ca(){let e=(location.hash||"#/").replace(/^#\/?/,""),[t,n]=e.split("/");return t?ka[t]?{key:t,arg:n||null}:{key:"dashboard",arg:null}:{key:"dashboard",arg:null}}async function go(){try{Sa=(await u.openOpportunities()).filter(ve).length}catch{}}var St=0;function ir(){let e=$e.cloneNode(!1);return delete e.dataset.view,$e.replaceWith(e),$e=e,e}async function Sn(){if(!Wn())return Oe();let e=++St,t=ut(),n=or[fe.key]||fe.key;Ft.innerHTML=Qn(n,t,{overdue:Sa}),Aa();let a;try{a=await(ka[fe.key]||ka.dashboard)()}catch{We.innerHTML=dn("Kingson"),$e.innerHTML=zn("That screen could not be loaded. Check the connection and try again.");return}if(e===St){We.innerHTML=dn(typeof a.title=="function"?a.title(fe.arg):a.title,""),ir(),$e.innerHTML=ls(4),$e.dataset.view=fe.key;try{let s=await a.render(fe.arg,{me:t,rerender:qa});if(e!==St)return;$e.innerHTML=s,We.innerHTML=dn(typeof a.title=="function"?a.title(fe.arg):a.title,typeof a.sub=="function"?await a.sub(fe.arg):a.sub||"",typeof a.actions=="function"?a.actions(fe.arg,t):""),a.mount?.($e,qa,{me:t,arg:fe.arg})}catch(s){if(e!==St)return;console.error("[kingson] view failed",fe.key,s),$e.innerHTML=zn(s?.message||"That screen could not be loaded.")}go().then(()=>{e===St&&(Ft.innerHTML=Qn(n,ut(),{overdue:Sa}))})}}async function qa(){let e=window.scrollY;await Sn(),window.scrollTo(0,e)}function Oe(e=""){St++,$e.replaceChildren(),Ft.replaceChildren(),We.replaceChildren(),document.querySelectorAll(".modal").forEach(s=>s.remove()),document.body.classList.remove("is-modal"),je.hidden=!0,oe.hidden=!1,oe.innerHTML=is(e);let t=oe.querySelector("#signin-form"),n=t.querySelector("[data-signin]"),a=t.querySelector(".signin-err");t.querySelector("#si-email").focus(),t.querySelector("[data-forgot]").addEventListener("click",()=>wo(t.querySelector("#si-email").value.trim())),t.addEventListener("submit",async s=>{s.preventDefault();let i=t.querySelector("#si-email").value.trim(),r=t.querySelector("#si-password").value;if(a.hidden=!0,!i||!r){a.textContent="Enter your email address and password.",a.hidden=!1;return}n.disabled=!0,n.textContent="Signing in\u2026";try{await Ka(i,r),await Da()}catch(l){a.textContent=l?.status===400?"That email address and password do not match an account.":l?.message||"Sign-in failed.",a.hidden=!1,n.disabled=!1,n.textContent="Sign in",t.querySelector("#si-password").select()}})}async function Da(){return je.hidden=!0,oe.hidden=!1,ts(oe,async()=>{try{await za(),oe.hidden=!0,oe.replaceChildren(),je.hidden=!1,await go(),await Sn()}catch(e){await pt(),Oe(e.message||"Access could not be verified. Sign in again.")}},async()=>{await pt(),Oe()})}var rr=()=>{je.classList.add("rail-open"),Ta.hidden=!1,Ft.querySelector(".rail-link")?.focus(),We.querySelector("[data-rail-open]")?.setAttribute("aria-expanded","true")},Aa=()=>{je.classList.remove("rail-open"),Ta.hidden=!0,We.querySelector("[data-rail-open]")?.setAttribute("aria-expanded","false")};document.addEventListener("click",async e=>{if(e.target.closest("[data-rail-open]"))return rr();if(e.target===Ta||e.target.closest(".rail-link"))return Aa();if(e.target.closest("[data-signout]")){await pt(),location.hash="#/",Oe();return}if(e.target.closest("[data-retry]"))return Sn();let t=ut();if(e.target.closest("[data-search-open]")){let{openSearch:n}=await Promise.resolve().then(()=>(va(),_a));return n()}if(e.target.closest("[data-new-opp]")){let{newOpportunity:n}=await Promise.resolve().then(()=>(Ce(),$n));return n({me:t})}if(e.target.closest("[data-new-contact]")){let{contactDialog:n}=await Promise.resolve().then(()=>(Ce(),$n));return n({onDone:a=>{location.hash=`#/contact/${a.id}`}})}if(e.target.closest("[data-new-task-global]")){let{taskDialog:n}=await Promise.resolve().then(()=>(Ce(),$n));return n({me:t,onDone:qa})}});document.addEventListener("keydown",async e=>{if(e.key==="Escape"&&je.classList.contains("rail-open")&&Aa(),e.key==="/"&&!je.hidden&&!document.body.classList.contains("is-modal")&&!e.target.closest?.("input, textarea, select, [contenteditable]")){e.preventDefault();let{openSearch:t}=await Promise.resolve().then(()=>(va(),_a));t()}});function wo(e=""){je.hidden=!0,oe.hidden=!1,oe.innerHTML=rs(e);let t=oe.querySelector("#forgot-form"),n=t.querySelector(".signin-err"),a=t.querySelector(".signin-ok"),s=t.querySelector("[data-send]");t.querySelector("#fp-email").focus(),t.querySelector("[data-back]").addEventListener("click",()=>Oe()),t.addEventListener("submit",async i=>{i.preventDefault();let r=t.querySelector("#fp-email").value.trim();if(n.hidden=!0,a.hidden=!0,!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r)){n.textContent="Enter the email address you sign in with.",n.hidden=!1;return}s.disabled=!0,s.textContent="Sending\u2026";try{await Jt(r),a.textContent="If that address has an account, the link is on its way. Check the inbox, and the spam folder.",a.hidden=!1,s.textContent="Send again"}catch(l){n.textContent=l?.message||"The link could not be sent. Try again in a few minutes.",n.hidden=!1,s.textContent="Send the link"}s.disabled=!1})}var lr={otp_expired:"The link has expired or has already been used. Links last one hour and work once.",access_denied:"The link could not be accepted. It may have expired or already been used."};function bo(e){if(je.hidden=!0,oe.hidden=!1,e.error){oe.innerHTML=Kn({error:lr[e.error]||e.description||"The link could not be accepted."}),oe.querySelector("[data-forgot]").addEventListener("click",()=>wo()),oe.querySelector("[data-back]").addEventListener("click",()=>Oe());return}oe.innerHTML=Kn();let t=oe.querySelector("#reset-form"),n=t.querySelector(".signin-err"),a=t.querySelector("[data-save]");t.querySelector("#np-1").focus(),t.addEventListener("submit",async s=>{s.preventDefault();let i=t.querySelector("#np-1").value,r=t.querySelector("#np-2").value;if(n.hidden=!0,i.length<14){n.textContent="Use at least 14 characters.",n.hidden=!1;return}if(i!==r){n.textContent="The two passwords are not the same.",n.hidden=!1;return}a.disabled=!0,a.textContent="Saving\u2026";try{await At(i),history.replaceState(null,"",location.pathname+"#/"),fe=Ca(),await Da()}catch(l){n.textContent=l?.status===401?"The link has expired. Ask for a new one.":l?.message||"The password could not be saved.",n.hidden=!1,a.disabled=!1,a.textContent="Save and sign in"}})}addEventListener("hashchange",()=>{let e=Dt();if(e)return bo(e);fe=Ca(),Sn().then(()=>{$e.focus({preventScroll:!0}),scrollTo(0,0)})});addEventListener("crm-session-ended",()=>{$e.replaceChildren(),Ft.replaceChildren(),We.replaceChildren(),Oe("Session ended. Sign in again.")});var Ea=!1;for(let e of["pointerdown","keydown","touchstart","scroll"])addEventListener(e,t=>{t.isTrusted&&!document.hidden&&(Qt(),Ea=!0)},{passive:!0});var xa=!1;setInterval(async()=>{if(!(!Wn()||xa)){xa=!0;try{Tt()?(await pt(),dispatchEvent(new Event("crm-session-ended"))):Ea&&!document.hidden&&(Ea=!1,await y.rpc("touch_crm_session"))}catch(e){(e.status===401||e.status===403)&&(await pt(),dispatchEvent(new Event("crm-session-ended")))}finally{xa=!1}}},6e4);(async function(){document.getElementById("boot")?.remove();let t=Dt();if(t)return bo(t);let{loadSession:n}=await Promise.resolve().then(()=>(De(),Pn));if(n(),!Ve())return Oe();await Da()})().catch(e=>{console.error("[kingson] boot failed",e),Oe("Something went wrong starting the application. Reload the page.")});export{o as esc,qa as softRender,w as toast};
