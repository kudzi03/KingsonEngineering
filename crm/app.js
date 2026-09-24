var Qs=Object.defineProperty;var R=(e,t)=>()=>(e&&(t=e(e=0)),t);var te=(e,t)=>{for(var n in t)Qs(e,n,{get:t[n],enumerable:!0})};var $t,Nt,wt,Ae,bt=R(()=>{$t="https://fgzwcxwmaohowryzdgui.supabase.co",Nt="sb_publishable_QYbHrEJ06GpGDMlIqf5tzw_ijJpdtTV",wt="kingson-files",Ae="Africa/Harare"});function fa(){try{let e=localStorage.getItem(gn);K=e?JSON.parse(e):null}catch{K=null}return K}function Rt(){return K}function Ne(e){K=e;try{e?localStorage.setItem(gn,JSON.stringify(e)):localStorage.removeItem(gn)}catch{}return e}function _t(e,t){let n=String(t?.error_code||t?.code||""),a=t?.message||t?.error_description||t?.msg||"";return n==="weak_password"||/password should be|weak password/i.test(a)?"That password is too weak. Use at least 8 characters, mixing letters and numbers.":n==="same_password"?"That is the password you already have. Choose a different one.":n==="over_email_send_rate_limit"||e===429?"Too many attempts. Wait a few minutes and try again.":n==="23505"&&a&&!/_key"?$/.test(a)&&!/duplicate key/i.test(a)||n==="23514"&&a&&!/violates check constraint/i.test(a)?a:n==="23505"?/contacts_email_key/.test(a)?"A contact with that email address already exists.":/companies_name_key/.test(a)?"A company with that name already exists.":"That record already exists.":n==="23514"?/lost_has_reason/.test(a)?"A lost enquiry needs a reason.":/quotes_sent_has_date/.test(a)?"A quotation marked sent needs the date it went out.":/contacts_reachable/.test(a)?"A contact needs a phone number, a WhatsApp number or an email address.":/amount_sane|value_sane/.test(a)?"That amount cannot be negative.":"That value is not allowed here.":n==="23503"?"That record is still attached to something else.":e===401?"Your session has expired. Sign in again.":e===403||n==="42501"?"You do not have permission to do that.":e===404?"That record no longer exists.":e===0?"No connection. Check the network and try again.":a||`Request failed (${e}).`}async function vt(e,{method:t="POST",body:n,token:a}={}){let o;try{o=await fetch(`${$t}/auth/v1${e}`,{method:t,headers:{apikey:Nt,"Content-Type":"application/json",...a?{Authorization:`Bearer ${a}`}:{}},body:n?JSON.stringify(n):void 0})}catch{throw new ve(_t(0),{status:0})}let i=await o.text(),r=i?JSON.parse(i):null;if(!o.ok)throw new ve(_t(o.status,r),{status:o.status,code:r?.code||""});return r}async function _n(e,t){let n=await vt("/token?grant_type=password",{body:{email:e.trim(),password:t}});return Ne(wn(n))}async function ya(){let e=K;if(Ne(null),e?.access_token)try{await vt("/logout",{token:e.access_token})}catch{}}async function vn(e){return vt(`/recover?redirect_to=${encodeURIComponent(Gs())}`,{body:{email:e.trim()}})}function Pt(){let e=new URLSearchParams((location.hash||"").replace(/^#/,""));if(!e.get("type")&&!e.get("error")&&!e.get("error_code"))return null;let t=()=>history.replaceState(null,"",location.pathname);return e.get("error")||e.get("error_code")?(t(),{error:e.get("error_code")||e.get("error"),description:e.get("error_description")||""}):e.get("type")!=="recovery"||!e.get("access_token")?null:(Ne(wn({access_token:e.get("access_token"),refresh_token:e.get("refresh_token"),expires_in:Number(e.get("expires_in"))||3600,user:null})),t(),{recovery:!0})}async function Ut(e){if(K&&bn())try{await Mt()}catch{}return vt("/user",{method:"PUT",token:K?.access_token,body:{password:e}})}async function Mt(){if(!K?.refresh_token)throw new ve("Your session has expired. Sign in again.",{status:401});return Ot||(Ot=vt("/token?grant_type=refresh_token",{body:{refresh_token:K.refresh_token}}).then(e=>Ne(wn(e))).catch(e=>{throw Ne(null),e}).finally(()=>{Ot=null})),Ot}function zs(e,t){return jt.set(e,{at:Date.now(),promise:t}),t.catch(()=>jt.delete(e)),t}async function et(e,{method:t="GET",body:n,headers:a={},retry:o=!0}={}){if(ha(t,a)){let i=jt.get(e);if(i&&Date.now()-i.at<Vs)return i.promise}else jt.clear();return ha(t,a)?zs(e,$n(e,{method:t,headers:a,retry:o})):$n(e,{method:t,body:n,headers:a,retry:o})}async function $n(e,{method:t="GET",body:n,headers:a={},retry:o=!0}={}){if(K&&bn())try{await Mt()}catch{}let i;try{i=await fetch(`${$t}${e}`,{method:t,headers:{apikey:Nt,"Content-Type":"application/json",...K?.access_token?{Authorization:`Bearer ${K.access_token}`}:{},...a},body:n===void 0?void 0:JSON.stringify(n)})}catch{throw new ve(_t(0),{status:0})}if(i.status===401&&o&&K?.refresh_token)try{return await Mt(),$n(e,{method:t,body:n,headers:a,retry:!1})}catch{}let r=await i.text(),l=null;try{l=r?JSON.parse(r):null}catch{l=r}if(!i.ok)throw new ve(_t(i.status,l),{status:i.status,code:l?.code||"",details:l?.details||"",hint:l?.hint||""});return l}var gn,K,Ot,wn,bn,ve,Gs,Vs,jt,ha,y,It,ga,F,ie,xn=R(()=>{bt();gn="kingson-crm/session/v1",K=null,Ot=null;wn=e=>({access_token:e.access_token,refresh_token:e.refresh_token,expires_at:Date.now()+((e.expires_in||3600)-60)*1e3,user:e.user||null}),bn=()=>!K||!K.expires_at||Date.now()>=K.expires_at,ve=class extends Error{constructor(t,{status:n=0,code:a="",details:o="",hint:i=""}={}){super(t),this.name="ApiError",this.status=n,this.code=a,this.details=o,this.hint=i}};Gs=()=>`${location.origin}${location.pathname.replace(/[^/]*$/,"")}?reset=1`;Vs=2e3,jt=new Map,ha=(e,t)=>e==="GET"&&!t.Prefer;y={select:(e,t="")=>et(`/rest/v1/${e}${t?"?"+t:""}`),insert:(e,t,n="")=>et(`/rest/v1/${e}${n?"?"+n:""}`,{method:"POST",body:t,headers:{Prefer:"return=representation"}}),update:async(e,t,n)=>{let a=await et(`/rest/v1/${e}?${t}`,{method:"PATCH",body:n,headers:{Prefer:"return=representation"}});if(Array.isArray(a)&&!a.length)throw new ve("Not saved \u2014 you may not have permission to change this, or it no longer exists.",{status:403});return a},rpc:(e,t={})=>et(`/rest/v1/rpc/${e}`,{method:"POST",body:t})},It={async upload(e,t,n){if(K&&bn())try{await Mt()}catch{}let a;try{a=await fetch(`${$t}/storage/v1/object/${e}/${encodeURI(t)}`,{method:"POST",headers:{apikey:Nt,Authorization:`Bearer ${K?.access_token||""}`,"x-upsert":"false",...n.type?{"Content-Type":n.type}:{}},body:n})}catch{throw new ve(_t(0),{status:0})}if(!a.ok){let o=null;try{o=await a.json()}catch{}throw new ve(a.status===413?"That file is larger than the 25 MB limit.":o?.message||`Upload failed (${a.status}).`,{status:a.status})}return t},async signedUrl(e,t,n=120){let a=await et(`/storage/v1/object/sign/${e}/${encodeURI(t)}`,{method:"POST",body:{expiresIn:n}});return`${$t}/storage/v1${a.signedURL||a.signedUrl}`},async remove(e,t){return et(`/storage/v1/object/${e}`,{method:"DELETE",body:{prefixes:t}})}},ga=e=>{let t=String(e??"");return/[,.()"\\\s]/.test(t)?`"${t.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`:t},F=(e,t)=>`${e}=eq.${encodeURIComponent(t)}`,ie=(e,t="asc",n=!0)=>`order=${e}.${t}${n?".nullslast":""}`});function va(e){let t=String(e||"").replace(/\D+/g,"");return t?(t.startsWith("00")&&(t=t.slice(2)),t.length===10&&t.startsWith("0")?t="263"+t.slice(1):t.length===9&&/^[1-9]/.test(t)&&(t="263"+t),t.length>=7?t:""):""}function X(){return new Intl.DateTimeFormat("en-CA",{timeZone:Ae}).format(new Date)}function A(e){if(!e)return null;let t=Date.parse(X()+"T00:00:00Z"),n=Date.parse(String(e).slice(0,10)+"T00:00:00Z");return Number.isNaN(n)?null:Math.round((n-t)/864e5)}function Be(e,t){let n=new Date(Date.parse(String(e).slice(0,10)+"T00:00:00Z"));return n.setUTCDate(n.getUTCDate()+t),n.toISOString().slice(0,10)}function Gt(e=X(),t=1){let n=Be(e,t);return new Date(n+"T00:00:00Z").getUTCDay()===0&&(n=Be(n,1)),n}function we(e){return!Le(e)||!e.next_action_due?!1:A(e.next_action_due)<0}function Vt(e){return!Le(e)||!e.next_action_due?!1:A(e.next_action_due)===0}function be(e){if(!Le(e))return{level:"closed",label:oe[e.stage]?.name||"\u2014",sort:0};if(e.stage==="on_hold"&&e.hold_review_on&&A(e.hold_review_on)>0)return{level:"held",label:`On hold \xB7 review ${Ks(e.hold_review_on)}`,sort:50};if(nt(e))return{level:"unbooked",label:"No next action",sort:900};let t=A(e.next_action_due);if(t<0){let n=Math.abs(t);return{level:"overdue",label:n===1?"1 day overdue":`${n} days overdue`,sort:1e3+n}}return t===0?{level:"today",label:"Due today",sort:800}:t<=7?{level:"soon",label:t===1?"Due tomorrow":`Due in ${t} days`,sort:700-t}:{level:"clear",label:`Due in ${t} days`,sort:100-Math.min(t,99)}}function zt(e){return!Le(e)||!Number(e.live_quotes||0)?!1:!e.next_action_due||A(e.next_action_due)<0}function de(e){return e?e.stage==="won"&&e.won_value!=null?{amount:Number(e.won_value),currency:e.currency||"USD",kind:"won"}:e.quoted_value!=null?{amount:Number(e.quoted_value),currency:e.quote_currency||e.currency||"USD",kind:e.quote_status==="draft"?"draft":"quoted"}:{amount:null,currency:e.currency||"USD",kind:"none"}:{amount:null,currency:"USD",kind:"none"}}function We(e,t=de){let n={},a=0;for(let o of e){let i=t(o);i.amount!=null&&(n[i.currency]=(n[i.currency]||0)+i.amount,a++)}return{by:n,valued:a,unvalued:e.length-a}}async function qa(e){let t;try{t=await e.rpc("enum_values",{enum_name:"opp_stage"})}catch{return{ok:!0,skipped:!0}}let n=new Set((t||[]).map(r=>typeof r=="string"?r:r.value)),a=new Set(xe.map(r=>r.id)),o=[...n].filter(r=>!a.has(r)),i=[...a].filter(r=>!n.has(r));return(o.length||i.length)&&console.error("[kingson] pipeline stages disagree with the database",{missingFromApp:o,notInDatabase:i}),{ok:!o.length&&!i.length,missing:o,extra:i}}var xe,oe,$a,Ft,Bt,Oe,wa,ba,_a,kn,xa,Wt,Ht,Sn,ka,tt,Qt,Sa,Le,nt,Ks,qn,G=R(()=>{bt();xe=[{id:"new",name:"New enquiry",short:"New",open:!0,group:"intake"},{id:"contacted",name:"Contacted",short:"Contacted",open:!0,group:"intake"},{id:"requirements",name:"Requirements / site visit",short:"Requirements",open:!0,group:"survey"},{id:"quoting",name:"Quote / BOQ preparing",short:"Quoting",open:!0,group:"quote"},{id:"quote_sent",name:"Quote sent",short:"Quote sent",open:!0,group:"quote"},{id:"followup",name:"Follow-up / awaiting decision",short:"Follow-up",open:!0,group:"chase"},{id:"on_hold",name:"On hold",short:"On hold",open:!0,group:"hold"},{id:"won",name:"Won",short:"Won",open:!1,group:"won"},{id:"lost",name:"Lost",short:"Lost",open:!1,group:"lost"}],oe=Object.fromEntries(xe.map(e=>[e.id,e])),$a=xe.filter(e=>e.open).map(e=>e.id),Ft=["low","normal","high","urgent"],Bt=["phone","whatsapp","email","walk_in","referral","existing_customer","social_media","website","other"],Oe={website:"Website",whatsapp:"WhatsApp",phone:"Phone",email:"Email",referral:"Referral",walk_in:"Walk-in",existing_customer:"Existing customer",social_media:"Social media",other:"Other"},wa=[["unknown","Not asked yet"],["yes","Yes"],["no","No"]],ba=[["","No preference"],["Phone","Phone"],["WhatsApp","WhatsApp"],["Email","Email"]],_a=[["general","General"],["enquiry_response","Respond to enquiry"],["quote_followup","Quotation follow-up"],["customer_reply","Respond to customer"],["site_visit","Site visit"]];kn=e=>{let t=String(e||"").trim().toLowerCase();return/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)?t:""},xa=["draft","sent","discussed","accepted","rejected","superseded","expired"],Wt={draft:"Draft",sent:"Sent",discussed:"Customer responded",accepted:"Accepted",rejected:"Not accepted",superseded:"Superseded",expired:"Expired"},Ht=[["price","Price"],["competitor","Went with a competitor"],["timing","Timing"],["project_cancelled","Project cancelled"],["scope_changed","Scope changed"],["no_response","No response"],["other","Other"]],Sn=[["email","Email"],["whatsapp","WhatsApp"],["phone","Phone"],["meeting","Meeting"],["other","Other"]],ka=["planning","in_progress","on_hold","complete","cancelled"],tt={planning:"Planning",in_progress:"In progress",on_hold:"On hold",complete:"Complete",cancelled:"Cancelled"},Qt={enquiry:"Enquiry",note:"Note",call:"Call",whatsapp:"WhatsApp",email:"Email",meeting:"Meeting",site_visit:"Site visit",quote:"Quotation",stage_change:"Stage change",task:"Task",file:"File",won:"Won",lost:"Lost",reply:"Customer reply",on_hold:"On hold",system:"System"},Sa=["call","whatsapp","email","meeting","note"];Le=e=>!!(e&&oe[e.stage]?.open);nt=e=>Le(e)&&!e.next_action_due;Ks=e=>new Date(String(e).slice(0,10)+"T12:00:00Z").toLocaleDateString("en-GB",{day:"numeric",month:"short",timeZone:"UTC"});qn=(e,t)=>e.reduce((n,a)=>n+(Number(t(a))||0),0)});function Js(e){try{let t=e.split(".")[1],n=atob(t.replace(/-/g,"+").replace(/_/g,"/"));return JSON.parse(n).sub||null}catch{return null}}async function Ea(){let e=Rt(),t=e?.access_token?Js(e.access_token):null;if(!t)return ue=null,null;let a=(await y.select("profiles",`select=*&id=eq.${t}`))[0]||null;if(!a)throw ue=null,Ne(null),new Error("This account has no profile in the CRM. Ask an administrator to set one up.");if(!a.active)throw ue=null,Ne(null),new Error("This account has been deactivated.");return ue=a,ue}async function En(){if(!fa())return ue=null,null;try{await Ea()}catch{ue=null}return Tn(),ue}async function La(e,t){return await _n(e,t),await Ea(),Tn(),qa(y).catch(()=>{}),ue}async function Da(){await ya(),ue=null,Tn()}async function Ca(e,t){let n=Ln();if(!n)throw new Error("Sign out and back in, then try again.");try{await _n(n,e)}catch(a){throw a?.status===400?Object.assign(new Error("Your current password is not right."),{field:"pw-current"}):a}await Ut(t)}var ue,Ys,at,Ta,Tn,Ln,Kt=R(()=>{xn();G();ue=null,Ys=new Set,at=()=>ue,Ta=()=>!!(Rt()?.access_token&&ue),Tn=()=>Ys.forEach(e=>e(ue));Ln=()=>Rt()?.user?.email||""});function De(){try{return localStorage.getItem(Dn)==="1"}catch{return!1}}function Aa(e){try{e?localStorage.setItem(Dn,"1"):localStorage.removeItem(Dn)}catch{}}var Dn,Zs,he,Yt=R(()=>{Dn="kingson.showDemo";Zs=()=>De()?"":"is_demo=eq.false",he=e=>{let t=Zs();return t?e?`${e}&${t}`:t:e}});var Cn,Na,Xs,d,Y=R(()=>{xn();bt();G();Yt();Cn="*",Na=ie("next_action_due","asc"),Xs=`stage=in.(${$a.join(",")})`,d={profiles:()=>y.select("profiles",`select=*&${ie("full_name")}`),me:e=>y.select("profiles",`select=*&${F("id",e)}`).then(t=>t[0]||null),opportunities:(e="")=>y.select("v_opportunity_state",he(`select=${Cn}${/(^|&)order=/.test(e)?"":"&"+Na}${e?"&"+e:""}`)),openOpportunities:()=>y.select("v_opportunity_state",he(`select=${Cn}&${Xs}&${Na}`)),opportunity:e=>y.select("v_opportunity_state",`select=${Cn}&${F("id",e)}`).then(t=>t[0]||null),createOpportunity:e=>y.insert("opportunities",e).then(t=>t[0]),findMatches:({phone:e,email:t,name:n,company:a})=>y.rpc("find_contact_matches",{p_phone:e||null,p_email:t||null,p_name:n||null,p_company:a||null}),createEnquiry:e=>y.rpc("create_enquiry",{p_full_name:e.fullName||null,p_phone:e.phone||null,p_email:e.email||null,p_description:e.description||null,p_title:e.title||null,p_company:e.company||null,p_contact_id:e.contactId||null,p_service:e.service||null,p_location:e.location||null,p_source:e.source||"phone",p_preferred_channel:e.preferredChannel||null,p_drawings:e.drawings||"unknown",p_owner_id:e.ownerId||null,p_next_action:e.nextAction||null,p_next_due:e.nextDue||null,p_force_new:!!e.forceNew}).then(t=>Array.isArray(t)?t[0]:t),search:(e,t=8)=>y.rpc("global_search",{p_q:e,p_include_demo:De(),p_limit:t}),managementSummary:(e,t)=>y.rpc("management_summary",{p_from:e,p_to:t,p_include_demo:De()}),closedPage:(e=0,t=40)=>y.select("v_opportunity_state",he(`select=*&stage=in.(won,lost)&order=decided_at.desc.nullslast&limit=${t}&offset=${e}`)),outbox:(e=20)=>y.select("notification_outbox",`select=*&order=created_at.desc&limit=${e}`),updateOpportunity:(e,t)=>y.update("opportunities",F("id",e),t).then(n=>n[0]),setStage:(e,t)=>d.updateOpportunity(e,{stage:t}),recordQuote:(e,{amount:t,currency:n,preparedOn:a,validUntil:o,notes:i,reference:r,documentRef:l})=>y.rpc("record_quote",{p_opportunity_id:e,p_amount:t,p_currency:n||"USD",p_prepared_on:a||null,p_valid_until:o||null,p_notes:i||null,p_reference:r||null,p_document_ref:l||null}),markQuoteSent:(e,{sentAt:t,followUpOn:n,channel:a,notes:o})=>y.rpc("mark_quote_sent",{p_quote_id:e,p_sent_at:t||null,p_follow_up_on:n||null,p_channel:a||"email",p_notes:o||null}),logFollowUp:(e,{channel:t,notes:n,at:a,nextAction:o,nextDue:i})=>y.rpc("log_follow_up",{p_opportunity_id:e,p_channel:t,p_notes:n,p_at:a||null,p_next_action:o||null,p_next_due:i||null}),customerReplied:(e,{channel:t,notes:n,at:a})=>y.rpc("mark_customer_replied",{p_opportunity_id:e,p_channel:t,p_notes:n||null,p_at:a||null}),decide:(e,t,{on:n,value:a,reason:o,notes:i,reviewOn:r}={})=>y.rpc("decide_opportunity",{p_opportunity_id:e,p_outcome:t,p_on:n||null,p_value:a??null,p_reason:o||null,p_notes:i||null,p_review_on:r||null}),addWorkingDays:(e,t)=>y.rpc("add_working_days",{d:e,n:t}),settings:()=>y.select("crm_settings","select=*&limit=1").then(e=>e[0]||null),updateSettings:e=>y.update("crm_settings","id=eq.true",e).then(t=>t[0]),contacts:(e="",{offset:t=0,limit:n=50}={})=>{let a=he(`select=*,companies(id,name)&${ie("full_name")}&limit=${n}&offset=${t}`);if(e){let o=encodeURIComponent(ga(`%${e}%`)),i=e.replace(/\D+/g,"").replace(/^(00)?263/,"").replace(/^0+/,""),r=i.length>=5?`,phone_norm.like.${encodeURIComponent(`*${i}*`)},whatsapp_norm.like.${encodeURIComponent(`*${i}*`)}`:"";a+=`&or=(full_name.ilike.${o},email.ilike.${o},phone.ilike.${o},whatsapp.ilike.${o},job_title.ilike.${o}${r})`}return y.select("contacts",a)},contact:e=>y.select("contacts",`select=*,companies(id,name,kind,town)&${F("id",e)}`).then(t=>t[0]||null),createContact:e=>y.insert("contacts",e).then(t=>t[0]),updateContact:(e,t)=>y.update("contacts",F("id",e),t).then(n=>n[0]),companies:()=>y.select("companies",he(`select=*&${ie("name")}`)),company:e=>y.select("companies",`select=*&${F("id",e)}`).then(t=>t[0]||null),createCompany:e=>y.insert("companies",e).then(t=>t[0]),updateCompany:(e,t)=>y.update("companies",F("id",e),t).then(n=>n[0]),async findOrCreateCompany(e){let t=(e||"").trim();if(!t)return null;let n=await y.select("companies",`select=id,name&name=ilike.${encodeURIComponent(t)}&limit=1`);return n[0]?n[0]:d.createCompany({name:t})},activityFor:e=>y.select("activities",`select=*,profiles(full_name,initials)&${F("opportunity_id",e)}&${ie("occurred_at","desc")}`),activityForContact:e=>y.select("activities",`select=*,profiles(full_name,initials),opportunities(id,ref,title)&${F("contact_id",e)}&${ie("occurred_at","desc")}`),activityForProject:e=>y.select("activities",`select=*,profiles(full_name,initials)&${F("project_id",e)}&${ie("occurred_at","desc")}`),recentActivity:(e=12)=>y.select("activities",he(`select=*,profiles(full_name,initials),opportunities(id,ref,title)&${ie("occurred_at","desc")}&limit=${e}`)),logActivity:e=>y.insert("activities",e).then(t=>t[0]),tasks:(e="")=>y.select("tasks",he(`select=*,profiles!tasks_owner_id_fkey(full_name,initials),opportunities(id,ref,title,stage),contacts(id,full_name,phone,whatsapp,email)&${ie("due_date")}${e?"&"+e:""}`)),openTasks:()=>d.tasks("status=eq.open"),tasksFor:e=>d.tasks(F("opportunity_id",e)),createTask:e=>y.insert("tasks",e).then(t=>t[0]),updateTask:(e,t)=>y.update("tasks",F("id",e),t).then(n=>n[0]),completeTask:e=>d.updateTask(e,{status:"done"}),visits:(e="")=>y.select("site_visits",he(`select=*,profiles(full_name,initials),opportunities(id,ref,title,company_id,companies(name))&${ie("scheduled_at")}${e?"&"+e:""}`)),upcomingVisits:()=>d.visits(`status=eq.scheduled&scheduled_at=gte.${new Date(Date.now()-864e5).toISOString()}`),visitsFor:e=>d.visits(F("opportunity_id",e)),createVisit:e=>y.insert("site_visits",e).then(t=>t[0]),updateVisit:(e,t)=>y.update("site_visits",F("id",e),t).then(n=>n[0]),quotes:(e="",{offset:t=0,limit:n=200}={})=>y.select("quotes",he(`select=*,profiles:sent_by(full_name,initials),opportunities(id,ref,title,stage,next_action_due,company_id,companies(name))&order=prepared_on.desc,version.desc&limit=${n}&offset=${t}${e?"&"+e:""}`)),liveQuotes:()=>d.quotes("status=in.(sent,discussed)"),quotesFor:e=>d.quotes(F("opportunity_id",e)),createQuote:e=>y.insert("quotes",e).then(t=>t[0]),updateQuote:(e,t)=>y.update("quotes",F("id",e),t).then(n=>n[0]),projects:(e="")=>y.select("projects",he(`select=*,companies(id,name),contacts(id,full_name,phone,email),profiles(full_name,initials),opportunities(id,ref)&${ie("created_at","desc")}${e?"&"+e:""}`)),project:e=>y.select("projects",`select=*,companies(id,name),contacts(id,full_name,phone,email,whatsapp),profiles(full_name,initials),opportunities(id,ref,title)&${F("id",e)}`).then(t=>t[0]||null),updateProject:(e,t)=>y.update("projects",F("id",e),t).then(n=>n[0]),convertToProject:(e,{name:t,startDate:n,targetDate:a}={})=>y.rpc("convert_to_project",{p_opportunity_id:e,p_name:t||null,p_start_date:n||null,p_target_date:a||null}),projectForOpportunity:e=>y.select("projects",`select=id,name,status&${F("opportunity_id",e)}`).then(t=>t[0]||null),enquiries:(e=50)=>y.select("enquiries",he(`select=*&${ie("created_at","desc")}&limit=${e}`)),filesFor:(e,t)=>y.select("files",`select=*,profiles(full_name,initials)&${F(e,t)}&${ie("created_at","desc")}`),linkFileToQuote:(e,t)=>y.update("files",F("id",e),{quote_id:t}).then(n=>n[0]),async uploadFile(e,t,n){let a=e.name.replace(/[^\w.\-]+/g,"_").slice(-80),o=`${Object.keys(t)[0].replace("_id","")}/${Object.values(t)[0]}/${Date.now()}-${a}`;await It.upload(wt,o,e);try{return await y.insert("files",{bucket:wt,path:o,name:e.name,mime:e.type||null,size_bytes:e.size,uploaded_by:n||null,...t}).then(i=>i[0])}catch(i){try{await It.remove(wt,[o])}catch{}throw i}},downloadUrl:e=>It.signedUrl(wt,e,120),metrics:()=>y.rpc("dashboard_metrics",{p_include_demo:De()}),async dashboard(){let[e,t,n,a,o,i]=await Promise.all([d.metrics(),d.openOpportunities(),d.liveQuotes(),d.openTasks(),d.upcomingVisits(),d.recentActivity(10)]);return{metrics:e,open:t,liveQuotes:n,tasks:a,visits:o,recent:i}}}});function re(e,{empty:t="\u2014"}={}){let n=Object.entries(e||{}).filter(([,a])=>a!=null);return n.length?n.map(([a,o])=>U(o,a)).join(" \xB7 "):t}function Oa(e){let t=Number(e);if(!Number.isFinite(t)||t===0)return e===0?"$0":"\u2014";let n=Math.abs(t);return n>=1e6?"$"+(t/1e6).toFixed(n%1e6?1:0)+"m":n>=1e3?"$"+(t/1e3).toFixed(n%1e3&&n<1e4?1:0)+"k":"$"+Math.round(t)}function Jt(e){let t=Object.entries(e||{}).filter(([,n])=>n!=null);return t.length?t.map(([n,a])=>n==="USD"?Oa(a):`${n} ${Oa(a).slice(1)}`).join(" \xB7 "):""}function je(e){if(!e)return"";let t=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:Ae,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:!1}).formatToParts(new Date(e)).map(n=>[n.type,n.value]));return`${t.year}-${t.month}-${t.day}T${t.hour}:${t.minute}`}function xt(e){return e?new Date(e+":00+02:00").toISOString():null}function I(e){if(!e)return"\u2014";let t=A(Me(e));return t===null?"\u2014":t===0?"today":t===1?"tomorrow":t===-1?"yesterday":t>0?`in ${t} days`:`${-t} days ago`}function Zt(e){let t=A(Me(e));if(t===null||t>=0)return"";let n=Math.abs(t);return n===1?"1 day overdue":`${n} days overdue`}function Ra(e,t=""){let n=String(e||"").replace(/\D/g,"");return n.length<9?"":`https://wa.me/${n}${t?"?text="+encodeURIComponent(t):""}`}var eo,U,to,no,ao,Ma,B,st,le,Me,ja,q,s,ke,Re,H=R(()=>{bt();G();eo=new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}),U=(e,t="USD")=>{if(e==null||e==="")return"\u2014";let n=Number(e);return Number.isFinite(n)?t==="USD"?eo.format(n):`${t} ${n.toLocaleString("en-US",{maximumFractionDigits:0})}`:"\u2014"};to=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",timeZone:Ae}),no=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",year:"numeric",timeZone:Ae}),ao=new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",hour12:!1,timeZone:Ae}),Ma=e=>typeof e=="string"&&e.length===10?new Date(e+"T12:00:00Z"):new Date(e),B=e=>e?to.format(Ma(e)):"\u2014",st=e=>e?no.format(Ma(e)):"\u2014",le=e=>e?ao.format(new Date(e)):"\u2014",Me=e=>e?typeof e=="string"&&e.length===10?e:new Intl.DateTimeFormat("en-CA",{timeZone:Ae}).format(new Date(e)):"";ja=e=>String(e||"").split(/[\s.]+/).filter(Boolean).map(t=>t[0]).slice(0,2).join("").toUpperCase()||"?",q=(e,t,n)=>`${e} ${e===1?t:n||t+"s"}`,s=e=>String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;"),ke=e=>"tel:"+String(e||"").replace(/[^\d+]/g,"");Re=(e,t="",n="")=>{if(!e)return"";let a=[];return t&&a.push("subject="+encodeURIComponent(t)),n&&a.push("body="+encodeURIComponent(n)),`mailto:${e}${a.length?"?"+a.join("&"):""}`}});var T,c,Zi,Xi,J=R(()=>{T=(e,t=16)=>`<svg width="${t}" height="${t}" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true" focusable="false">${e}</svg>`,c={dashboard:e=>T('<rect x="3" y="3" width="7" height="8" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="11" width="7" height="10" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',e),pipeline:e=>T('<rect x="3" y="4" width="5" height="16" rx="1.5"/><rect x="9.5" y="4" width="5" height="11" rx="1.5"/><rect x="16" y="4" width="5" height="7" rx="1.5"/>',e),bell:e=>T('<path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>',e),alert:e=>T('<path d="M12 3.5 2.6 19.2a1.4 1.4 0 0 0 1.2 2.1h16.4a1.4 1.4 0 0 0 1.2-2.1L12 3.5z"/><path d="M12 9.5v4.2"/><path d="M12 17.4h.01"/>',e),clock:e=>T('<circle cx="12" cy="12" r="8.6"/><path d="M12 7.2V12l3.1 1.9"/>',e),check:e=>T('<path d="M20 6.5 9.4 17.1 4 11.7"/>',e),cross:e=>T('<path d="M18 6 6 18M6 6l12 12"/>',e),phone:e=>T('<path d="M21.5 16.9v2.6a1.8 1.8 0 0 1-2 1.8 17.8 17.8 0 0 1-7.7-2.8 17.5 17.5 0 0 1-5.4-5.4A17.8 17.8 0 0 1 3.6 5.4a1.8 1.8 0 0 1 1.8-2h2.6a1.8 1.8 0 0 1 1.8 1.5c.1.9.3 1.7.5 2.5a1.8 1.8 0 0 1-.4 1.9L8.8 10.4a14 14 0 0 0 5.2 5.2l1.1-1.1a1.8 1.8 0 0 1 1.9-.4c.8.2 1.6.4 2.5.5a1.8 1.8 0 0 1 1.5 1.8z"/>',e),whatsapp:e=>T('<path d="M20.5 11.6a8.4 8.4 0 0 1-12.4 7.4L3.5 20.5l1.6-4.5a8.4 8.4 0 1 1 15.4-4.4z"/><path d="M9 9.3c.3-.5.6-.5.9-.5h.5c.2 0 .4.1.6.5l.6 1.4c.1.2 0 .4-.1.6l-.5.6a7 7 0 0 0 3 3l.6-.5c.2-.2.4-.2.6-.1l1.4.6c.4.2.5.4.5.6v.5c0 .3 0 .6-.5.9a2.5 2.5 0 0 1-2.4.2 11.6 11.6 0 0 1-4.6-4.6A2.5 2.5 0 0 1 9 9.3z"/>',e),mail:e=>T('<rect x="2.8" y="4.8" width="18.4" height="14.4" rx="2"/><path d="m3.4 6.4 8.6 6 8.6-6"/>',e),globe:e=>T('<circle cx="12" cy="12" r="8.8"/><path d="M3.4 12h17.2"/><path d="M12 3.2a13 13 0 0 1 0 17.6 13 13 0 0 1 0-17.6z"/>',e),users:e=>T('<path d="M16.5 20v-1.8a3.6 3.6 0 0 0-3.6-3.6H6.6A3.6 3.6 0 0 0 3 18.2V20"/><circle cx="9.8" cy="7.6" r="3.6"/><path d="M21 20v-1.8a3.6 3.6 0 0 0-2.7-3.5"/><path d="M15.4 4.2a3.6 3.6 0 0 1 0 7"/>',e),pin:e=>T('<path d="M20 10.4c0 5.5-8 11.2-8 11.2s-8-5.7-8-11.2a8 8 0 0 1 16 0z"/><circle cx="12" cy="10.2" r="2.8"/>',e),doc:e=>T('<path d="M14 2.8H7.2a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2V7.8z"/><path d="M14 2.8v5h4.8"/><path d="M8.8 13h6.4M8.8 16.6h4.4"/>',e),calendar:e=>T('<rect x="3.4" y="5" width="17.2" height="16" rx="2"/><path d="M16 3v4M8 3v4M3.4 10.2h17.2"/>',e),note:e=>T('<path d="M4.4 4.6h15.2v10.2l-4.8 4.6H4.4z"/><path d="M19.6 14.8h-4.8v4.6"/>',e),arrowRight:e=>T('<path d="M5 12h13M12.5 5.5 19 12l-6.5 6.5"/>',e),chevron:e=>T('<path d="m9 5.5 6.5 6.5L9 18.5"/>',e),plus:e=>T('<path d="M12 5.5v13M5.5 12h13"/>',e),refresh:e=>T('<path d="M20.5 11a8.5 8.5 0 1 0-.6 5"/><path d="M20.5 4.8V11h-6.2"/>',e),menu:e=>T('<path d="M4 7h16M4 12h16M4 17h16"/>',e),move:e=>T('<path d="M9 6.5 12 3.5l3 3M15 17.5 12 20.5l-3-3M6.5 9 3.5 12l3 3M17.5 9l3 3-3 3"/>',e),briefcase:e=>T('<rect x="2.8" y="7" width="18.4" height="13.5" rx="2"/><path d="M8.5 7V5.2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2V7"/><path d="M2.8 12.5h18.4"/>',e),file:e=>T('<path d="M14 2.8H7.2a2 2 0 0 0-2 2v14.4a2 2 0 0 0 2 2h9.6a2 2 0 0 0 2-2V7.8z"/><path d="M14 2.8v5h4.8"/>',e),upload:e=>T('<path d="M21 15.5v3.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.2"/><path d="M7.5 8.5 12 4l4.5 4.5"/><path d="M12 4v12"/>',e),download:e=>T('<path d="M21 15.5v3.2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.2"/><path d="M7.5 11.5 12 16l4.5-4.5"/><path d="M12 16V4"/>',e),search:e=>T('<circle cx="10.8" cy="10.8" r="7"/><path d="m20.5 20.5-4.7-4.7"/>',e),logout:e=>T('<path d="M9.5 20.5H5.4a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2h4.1"/><path d="m15.5 16.5 4.5-4.5-4.5-4.5"/><path d="M20 12H9.5"/>',e),shield:e=>T('<path d="M12 21.3s7.5-3.6 7.5-9.3V5.6L12 2.8 4.5 5.6v6.4c0 5.7 7.5 9.3 7.5 9.3z"/><path d="m9 12 2.2 2.2L15.4 10"/>',e),edit:e=>T('<path d="M16.5 3.9a2.1 2.1 0 0 1 3 3L8.2 18.2l-4 1 1-4z"/>',e),filter:e=>T('<path d="M3.5 5.5h17l-6.6 7.8v5.4l-3.8 2v-7.4z"/>',e),building:e=>T('<path d="M4 20.5V5.2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v15.3"/><path d="M15 10.5h3a2 2 0 0 1 2 2v8"/><path d="M2.6 20.5h18.8"/><path d="M7.5 7.5h4M7.5 11h4M7.5 14.5h4"/>',e),task:e=>T('<rect x="3.4" y="4.5" width="17.2" height="16" rx="2"/><path d="M8 3v3M16 3v3"/><path d="m8.6 13.2 2.2 2.2 4.6-4.6"/>',e),trend:e=>T('<path d="M3.5 16.5 9 11l4 4 7.5-7.5"/><path d="M14.5 7.5h6v6"/>',e)},Zi={Phone:c.phone,WhatsApp:c.whatsapp,Email:c.mail,Website:c.globe,Referral:c.users},Xi={enquiry:c.bell,call:c.phone,whatsapp:c.whatsapp,email:c.mail,visit:c.pin,quote:c.doc,stage:c.move,note:c.note,task:c.clock}});function He(e){let t=be(e);if(t.level==="closed")return oo(e.stage);if(t.level==="clear")return`<span class="pill pill-quiet">${s(t.label)}</span>`;let n={overdue:c.alert(13),unbooked:c.alert(13),today:c.clock(13),soon:c.clock(13),held:c.clock(13)}[t.level];return`<span class="pill pill-${s(t.level)}">${n}${s(t.label)}</span>`}function Se(e,{text:t="",size:n="sm"}={}){if(!e)return"";let a=[];e.phone&&a.push(`<a class="btn-ghost btn-${n}" href="${s(ke(e.phone))}">${c.phone(14)}<span>Call</span></a>`);let o=Ra(e.whatsapp||e.phone,t);return o&&a.push(`<a class="btn-ghost btn-${n}" href="${s(o)}" target="_blank" rel="noopener">${c.whatsapp(14)}<span>WhatsApp</span></a>`),e.email&&a.push(`<a class="btn-ghost btn-${n}" href="${s(Re(e.email))}">${c.mail(14)}<span>Email</span></a>`),a.join("")}function Fa(e,{showStage:t=!0}={}){return`
    <li class="att">
      <a class="att-link" href="#/opportunity/${s(e.id)}">
        <span class="att-head">
          <span class="att-title">${s(e.title)}</span>
          ${He(e)}
          ${Ge(e.priority)}
        </span>
        <span class="att-meta">
          ${s(e.company_name||e.contact_name||"No company")} \xB7 ${s(e.ref)}
          ${(()=>{let n=de(e);return n.amount==null?' \xB7 <span class="dim">not quoted yet</span>':` \xB7 <span class="num">${s(U(n.amount,n.currency))}</span>`})()}
          ${t?` \xB7 ${s(oe[e.stage]?.name||e.stage)}`:""}
        </span>
        <span class="att-action">
          ${e.next_action?`${c.arrowRight(14)}<span>${s(e.next_action)}</span>${e.next_action_due?`<span class="att-when">${s(B(e.next_action_due))}</span>`:""}`:`${c.alert(14)}<span>Nobody has booked a next action</span>`}
        </span>
      </a>
      <span class="att-owner">${M(e.owner_name?{full_name:e.owner_name,initials:e.owner_initials}:null,28)}</span>
    </li>`}var w,kt,x,Ia,On,fe,oo,Qe,io,ot,it,Ge,M,Ba,Wa,rt,en,se=R(()=>{H();G();J();w=(e,t,{note:n="",action:a="",tight:o=!1,id:i=""}={})=>`
  <section class="card${o?" card-tight":""}"${i?` id="${s(i)}"`:""}>
    ${e?`<header class="card-head">
      <h2 class="card-title">${s(e)}</h2>
      ${n?`<p class="card-note">${s(n)}</p>`:""}
      ${a}
    </header>`:""}
    ${t}
  </section>`,kt=({label:e,value:t,unit:n="",foot:a="",tone:o="",href:i=""})=>{let r=`
    <p class="stat-label">${s(e)}</p>
    <p class="stat-value num">${s(t)}${n?`<span class="stat-unit">${s(n)}</span>`:""}</p>
    ${a?`<p class="stat-foot">${a}</p>`:""}`;return i?`<a class="stat${o?" stat-"+o:""}" href="${s(i)}">${r}
         <span class="stat-go" aria-hidden="true">${c.arrowRight(15)}</span></a>`:`<div class="stat${o?" stat-"+o:""}">${r}</div>`},x=(e,t="",{tone:n="ok"}={})=>`
  <div class="empty">
    <span class="empty-mark empty-${s(n)}" aria-hidden="true">${n==="ok"?c.check(20):c.note(20)}</span>
    <p class="empty-text">${s(e)}</p>
    ${t?`<p class="empty-sub">${s(t)}</p>`:""}
  </div>`,Ia=(e=3)=>`
  <div class="skel" role="status" aria-live="polite">
    <span class="sr-only">Loading\u2026</span>
    ${Array.from({length:e},()=>'<span class="skel-row"></span>').join("")}
  </div>`,On=(e,{retry:t=!0}={})=>`
  <div class="err" role="alert">
    <span class="err-mark" aria-hidden="true">${c.alert(20)}</span>
    <p class="err-text">${s(e)}</p>
    ${t?'<button type="button" class="btn-ghost btn-sm" data-retry>Try again</button>':""}
  </div>`,fe=e=>`<div class="tbl-wrap">${e}</div>`;oo=e=>e==="won"?`<span class="pill pill-won">${c.check(13)}Won</span>`:e==="lost"?`<span class="pill pill-lost">${c.cross(13)}Lost</span>`:`<span class="pill pill-quiet">${s(oe[e]?.name||e)}</span>`,Qe=e=>`<span class="src">${(c[io[e]]||c.globe)(13)}${s(Oe[e]||e)}</span>`,io={website:"globe",whatsapp:"whatsapp",phone:"phone",email:"mail",referral:"users",walk_in:"pin",other:"note"},ot=e=>{let t=e==="accepted"?"won":e==="rejected"||e==="expired"||e==="superseded"?"lost":e==="draft"?"today":"quiet",n=e==="accepted"?c.check(13):e==="rejected"||e==="expired"||e==="superseded"?c.cross(13):c.doc(13);return`<span class="pill pill-${t}">${n}${s(Wt[e]||e)}</span>`},it=e=>`<span class="pill pill-${e==="complete"?"won":e==="cancelled"?"lost":e==="on_hold"?"today":"quiet"}">${s(tt[e]||e)}</span>`,Ge=e=>e==="urgent"?`<span class="pill pill-overdue">${c.alert(13)}Urgent</span>`:e==="high"?'<span class="pill pill-today">High</span>':e==="low"?'<span class="pill pill-quiet">Low</span>':"",M=(e,t=26)=>e?`<span class="avatar" role="img" style="--s:${t}px" title="${s(e.full_name||"")}" aria-label="${s(e.full_name||"Assigned")}">${s(e.initials||ja(e.full_name))}</span>`:`<span class="avatar avatar-none" role="img" style="--s:${t}px" title="Unassigned" aria-label="Unassigned">?</span>`;Ba=e=>`
  <li class="feed-row">
    <span class="feed-ic">${(c[Wa[e.kind]]||c.note)(14)}</span>
    <span class="feed-body">
      ${e.opportunities?`<a class="feed-link" href="#/opportunity/${s(e.opportunities.id)}">${s(e.opportunities.title)}</a>`:""}
      <span class="feed-text">${s(e.body)}</span>
    </span>
    <span class="feed-when">${s(e.profiles?.initials||"\u2014")} \xB7 ${s(I(e.occurred_at))}</span>
  </li>`,Wa={enquiry:"bell",note:"note",call:"phone",whatsapp:"whatsapp",email:"mail",meeting:"users",site_visit:"pin",quote:"doc",stage_change:"move",task:"clock",file:"file",won:"check",lost:"cross",system:"refresh",reply:"mail",on_hold:"clock"},rt=e=>e.length?`
  <ol class="timeline">
    ${e.map(t=>`
      <li class="tl">
        <span class="tl-ic tl-${s(t.kind)}">${(c[Wa[t.kind]]||c.note)(14)}</span>
        <span class="tl-body">
          <span class="tl-kind">${s(Qt[t.kind]||t.kind)}</span>
          <span class="tl-text">${s(t.body)}</span>
          ${t.opportunities?`<a class="tl-ref" href="#/opportunity/${s(t.opportunities.id)}">${s(t.opportunities.ref)} \xB7 ${s(t.opportunities.title)}</a>`:""}
        </span>
        <span class="tl-when">
          <span class="tl-date num">${s(B(t.occurred_at))}</span>
          <span class="tl-rel">${s(I(t.occurred_at))}${t.profiles?.initials?" \xB7 "+s(t.profiles.initials):""}</span>
        </span>
      </li>`).join("")}
  </ol>`:x("Nothing logged yet.","Calls, visits and quotations appear here as they happen.",{tone:"quiet"}),en=e=>{if(!e)return'<span class="fu-date fu-none">\u2014</span><span class="fu-rel is-late">not booked</span>';let t=Zt(e);return`<span class="fu-date num">${s(B(e))}</span>
          <span class="fu-rel${t?" is-late":""}">${s(t||I(e))}</span>`}});function ro(e){let t={};for(let n of e.querySelectorAll("input, select, textarea"))n.name&&(t[n.name]=n.type==="checkbox"?n.checked:n.value.trim());return t}function ze(e,t,n){let a=e.querySelector(`[data-err-for="${t}"]`),o=e.querySelector("#"+CSS.escape(t));a&&(a.textContent=n||"",a.hidden=!n),o&&(o.classList.toggle("is-bad",!!n),n?o.setAttribute("aria-invalid","true"):o.removeAttribute("aria-invalid"))}function Mn(e){e.querySelectorAll("[data-err-for]").forEach(t=>{t.textContent="",t.hidden=!0}),e.querySelectorAll(".is-bad").forEach(t=>{t.classList.remove("is-bad"),t.removeAttribute("aria-invalid")})}function g(e,t="ok"){lt||(lt=document.createElement("div"),lt.className="toasts",lt.setAttribute("aria-live","polite"),document.body.appendChild(lt));let n=document.createElement("p");n.className=`toast toast-${t}`,n.innerHTML=`${t==="bad"?c.alert(15):c.check(15)}<span>${s(e)}</span>`,lt.appendChild(n),setTimeout(()=>{n.classList.add("is-out"),setTimeout(()=>n.remove(),260)},t==="bad"?5200:2800)}function z({title:e,sub:t="",body:n,submitLabel:a="Save",onSubmit:o,width:i=520}){tn&&tn();let r=document.activeElement,l=document.createElement("div");l.className="modal",l.innerHTML=`
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="dlg-h" style="--w:${i}px">
      <form novalidate>
        <h2 class="modal-title display" id="dlg-h">${s(e)}</h2>
        ${t?`<p class="modal-sub">${s(t)}</p>`:""}
        <div class="modal-body">${n}</div>
        <p class="modal-err" role="alert" hidden></p>
        <div class="modal-foot">
          <button type="button" class="btn-ghost btn-sm" data-cancel>Cancel</button>
          <button type="submit" class="btn btn-sm" data-save>${s(a)}</button>
        </div>
      </form>
    </div>`,document.body.appendChild(l),document.body.classList.add("is-modal");let m=l.querySelector("form"),h=l.querySelector(".modal-err"),_=l.querySelector("[data-save]");(l.querySelector("input:not([type=hidden]), select, textarea")||_).focus();let C=P=>{if(P.key==="Escape"){P.preventDefault(),E();return}if(P.key!=="Tab")return;let ae=[...l.querySelectorAll("input, select, textarea, button, [href]")].filter(S=>!S.disabled&&S.offsetParent!==null);if(!ae.length)return;let[f,Z]=[ae[0],ae[ae.length-1]];P.shiftKey&&document.activeElement===f?(P.preventDefault(),Z.focus()):!P.shiftKey&&document.activeElement===Z&&(P.preventDefault(),f.focus())};function E(){document.removeEventListener("keydown",C,!0),l.remove(),document.body.classList.remove("is-modal"),tn=null,r&&document.contains(r)&&r.focus()}return document.addEventListener("keydown",C,!0),l.querySelector("[data-cancel]").addEventListener("click",E),l.addEventListener("mousedown",P=>{P.target===l&&E()}),m.addEventListener("submit",async P=>{P.preventDefault(),Mn(l),h.hidden=!0,_.disabled=!0;let ae=_.textContent;_.textContent="Saving\u2026";try{await o(ro(m),l),E()}catch(f){f?.field?(ze(l,f.field,f.message),l.querySelector("#"+CSS.escape(f.field))?.focus()):(h.textContent=f?.message||"That could not be saved.",h.hidden=!1),_.disabled=!1,_.textContent=ae}}),tn=E,E}function Q(e,...t){typeof e=="function"&&setTimeout(()=>{Promise.resolve(e(...t)).catch(n=>console.error("[kingson] refresh after save failed",n))},0)}var u,j,V,ct,ee,Ve,N,b,dt,lt,tn,D,ce=R(()=>{H();J();u=(e,t,n,{hint:a="",wide:o=!1}={})=>`
  <div class="field${o?" field-wide":""}">
    <label for="${s(e)}">${s(t)}</label>
    ${n}
    ${a?`<p class="field-hint">${s(a)}</p>`:""}
    <p class="field-err" data-err-for="${s(e)}" hidden></p>
  </div>`,j=(e,t="",n="")=>`<input class="inp" id="${s(e)}" name="${s(e)}" type="text" value="${s(t)}" ${n}>`,V=(e,t="",n=3,a="")=>`<textarea class="inp" id="${s(e)}" name="${s(e)}" rows="${n}" ${a}>${s(t)}</textarea>`,ct=(e,t="",n="")=>`<input class="inp" id="${s(e)}" name="${s(e)}" type="number" inputmode="decimal" value="${t??""}" ${n}>`,ee=(e,t="",n="")=>`<input class="inp" id="${s(e)}" name="${s(e)}" type="date" value="${s(t)}" ${n}>`,Ve=(e,t="",n="")=>`<input class="inp" id="${s(e)}" name="${s(e)}" type="datetime-local" value="${s(t)}" ${n}>`,N=(e,t,n="",a="")=>`
  <select class="sel" id="${s(e)}" name="${s(e)}" ${a}>
    ${t.map(o=>{let[i,r]=Array.isArray(o)?o:[o,o];return`<option value="${s(i)}"${String(i)===String(n??"")?" selected":""}>${s(r)}</option>`}).join("")}
  </select>`;b=e=>e===""||e===void 0?null:e,dt=e=>e===""||e===null||e===void 0?null:Number(e);lt=null;tn=null;D=(e,t)=>Object.assign(new Error(t),{field:e})});var Ga={};te(Ga,{mount:()=>ho,render:()=>co,sub:()=>fo,title:()=>lo});async function co(){let{metrics:e,open:t,liveQuotes:n,tasks:a,visits:o,recent:i}=await d.dashboard(),r=t.filter(we),l=t.filter(Vt),m=t.filter(nt),h=t.filter($=>$.stage==="new"),_=t.filter(zt),O=e.won_count+e.lost_count,C=O?Math.round(e.won_count/O*100):null,E=a.filter($=>$.due_date&&A($.due_date)<=0),P=o.filter($=>{let W=A($.scheduled_at);return W!==null&&W>=0&&W<=7}),ae=`
    <div class="stats">
      ${kt({label:"Open enquiries",value:String(e.open_count),foot:e.quoted_pipeline_count?`<span class="num">${s(re(e.quoted_pipeline))}</span> quoted and awaiting a decision`:'<span class="dim">No quotation out</span>',href:"#/pipeline"})}
      ${kt({label:"Not quoted yet",value:String(e.unquoted_count),tone:e.unquoted_count?"warn":"",foot:e.unquoted_count?"Open, with no quotation recorded":e.open_count?"Every open job has a quotation":"No open jobs",href:"#/pipeline"})}
      ${kt({label:"Follow-ups due",value:String(e.follow_ups_due_count),tone:e.overdue_count?"danger":"",foot:e.overdue_count?`${s(q(e.overdue_count,"overdue"))}${e.overdue_quoted_count?` \xB7 <span class="num">${s(re(e.overdue_quoted_value))}</span> quoted value overdue`:""}`:e.follow_ups_due_count?"Due today, none overdue":"Nothing past its date",href:"#/followups"})}
      ${kt({label:"Quotes awaiting a decision",value:String(e.awaiting_decision_count),foot:e.quoted_pipeline_count?`<span class="num">${s(re(e.quoted_pipeline))}</span> out`:"None out at the moment",href:"#/quotes"})}
    </div>`,f=[...r,...m,...l,...h].filter(($,W,Fe)=>Fe.findIndex(yn=>yn.id===$.id)===W).sort(($,W)=>be(W).sort-be($).sort).slice(0,12),Z=w("Needs attention",f.length?`<ul class="att-list">${f.map($=>Fa($)).join("")}</ul>`:x("Nothing is overdue and nothing is unbooked.","Every open enquiry has a next action with a date on it."),{note:"Overdue, unbooked, due today or unanswered \u2014 in any stage",tight:!0}),S=w("Today and the week ahead",`
    <div class="two-up">
      <div>
        <p class="sub-h">${c.pin(14)} Site visits</p>
        ${P.length?`<ul class="mini">${P.slice(0,5).map($=>`
          <li><a href="#/opportunity/${s($.opportunities?.id||"")}">
            <span class="mini-main">${s($.opportunities?.title||"Visit")}</span>
            <span class="mini-sub">${s(le($.scheduled_at))}${$.location?" \xB7 "+s($.location):""}</span>
          </a><span class="mini-side">${M($.profiles,24)}</span></li>`).join("")}</ul>`:'<p class="mini-none">No visits booked in the next seven days.</p>'}
      </div>
      <div>
        <p class="sub-h">${c.clock(14)} Calls and follow-ups due</p>
        ${E.length?`<ul class="mini">${E.slice(0,5).map($=>`
          <li><a href="${$.opportunities?"#/opportunity/"+s($.opportunities.id):"#/tasks"}">
            <span class="mini-main">${s($.title)}</span>
            <span class="mini-sub${A($.due_date)<0?" is-late":""}">${s(I($.due_date))}${$.channel?" \xB7 "+s($.channel):""}</span>
          </a><span class="mini-side">${M($.profiles,24)}</span></li>`).join("")}</ul>`:'<p class="mini-none">Nothing due today.</p>'}
      </div>
    </div>`,{note:`${q(P.length,"visit")} \xB7 ${q(E.length,"task")}`}),$e=xe.filter($=>$.open).map($=>{let W=t.filter(yn=>yn.stage===$.id),Fe=We(W);return{s:$,n:W.length,value:Fe.by.USD||0,label:Jt(Fe.by)}}),Ie=Math.max(1,...$e.map($=>$.value)),At=w("Open enquiries by stage",`
    <ul class="funnel">
      ${$e.map($=>`
        <li class="funnel-row${$.n?"":" is-empty"}">
          <a class="funnel-label" href="#/pipeline">${s($.s.name)}</a>
          <span class="funnel-track"><span class="funnel-bar" style="--w:${($.value/Ie*100).toFixed(1)}%"></span></span>
          <span class="funnel-n num">${$.n||"\u2014"}</span>
          <span class="funnel-v num">${$.label?s($.label):"\u2014"}</span>
        </li>`).join("")}
    </ul>
    <p class="funnel-key">Bar length is quoted value (USD). The number beside it is the count, quoted or not.</p>`,{note:"Open stages only"}),hn=w("Decided",`
    <div class="won-lost">
      <div><p class="wl-n num">${e.won_count}</p><p class="wl-l">${c.check(13)} Won</p>
        <p class="wl-v num">${s(re(e.won_value))}</p></div>
      <div><p class="wl-n num">${e.lost_count}</p><p class="wl-l">${c.cross(13)} Lost</p>
        <p class="wl-v">&nbsp;</p></div>
      <div><p class="wl-n num">${C===null?"\u2014":C+"%"}</p><p class="wl-l">Win rate</p>
        <p class="wl-v">of ${O} decided</p></div>
    </div>
    <p class="funnel-key">Won this month: <span class="num">${s(re(e.won_value_this_month,{empty:"nothing yet"}))}</span>${e.on_hold_count?` \xB7 ${s(q(e.on_hold_count,"job"))} on hold`:""}</p>`,{note:"Accepted values, as recorded when each job was won"}),fn=w("Quotations awaiting a decision",n.length?fe(`
    <table class="tbl">
      <thead><tr>
        <th scope="col">Quotation</th><th scope="col">Enquiry</th>
        <th scope="col" class="ta-r">Amount</th><th scope="col">Sent</th><th scope="col">Chase</th>
      </tr></thead>
      <tbody>
        ${n.map($=>{let W=$.opportunities,Fe=W&&!W.next_action_due;return`<tr${Fe?' class="tr-risk"':""}>
            <td><a class="lnk" href="#/opportunity/${s(W?.id||"")}">${s($.reference)}${$.version>1?` <span class="rev">rev ${$.version}</span>`:""}</a></td>
            <td><span class="td-main">${s(W?.title||"\u2014")}</span><span class="td-sub">${s(W?.companies?.name||"")}</span></td>
            <td class="ta-r num">${s(U($.amount,$.currency))}</td>
            <td><span class="td-main num">${s(B($.sent_on))}</span><span class="td-sub">${s(I($.sent_on))}</span></td>
            <td>${Fe?`<span class="pill pill-overdue">${c.alert(13)}No chase booked</span>`:A(W?.next_action_due)<0?`<span class="pill pill-overdue">${c.alert(13)}${s(B(W?.next_action_due))}</span>`:`<span class="pill pill-quiet">${s(B(W?.next_action_due))}</span>`}</td>
          </tr>`}).join("")}
      </tbody>
    </table>`):x("No quotations are out."),{note:_.length?`${q(_.length,"quotation")} overdue for a follow-up`:"Every one has a follow-up booked"}),Xe={};for(let $ of t)Xe[$.source]=(Xe[$.source]||0)+1;let v=w("Where enquiries arrive",Object.keys(Xe).length?`
    <ul class="srcs">
      ${Object.entries(Xe).sort(($,W)=>W[1]-$[1]).map(([$,W])=>`<li class="srcs-row">${Qe($)}<span class="srcs-n num">${W}</span></li>`).join("")}
    </ul>
    <p class="funnel-key">Open enquiries only. Website enquiries arrive here by themselves.</p>`:x("No open enquiries yet.","",{tone:"quiet"})),Hs=w("Recent activity",i.length?`<ul class="feed">${i.map(Ba).join("")}</ul>`:x("Nothing logged yet.","",{tone:"quiet"}),{tight:!0});return`
    ${ae}
    <div class="grid grid-main">
      <div class="col-wide">${Z}${S}${fn}${po()}</div>
      <div class="col-side">${At}${hn}${v}${Hs}</div>
    </div>`}function mo(e){let t=e.avg_hours_to_first_response,n=(a,o)=>`<div class="mgmt-fig"><b class="num">${a}</b><span>${o}</span></div>`;return`
    <div class="mgmt-grid" style="margin-top:12px">
      ${n(e.enquiries,"enquiries received")}
      ${n(e.quotes_sent,`quotations sent \xB7 <span class="num">${s(re(e.quoted_value,{empty:"\u2014"}))}</span>`)}
      ${n(e.won,`won \xB7 <span class="num">${s(re(e.won_value,{empty:"\u2014"}))}</span>`)}
      ${n(e.lost,"lost")}
      ${n(e.win_rate_quoted==null?"\u2014":e.win_rate_quoted+"%","win rate of quoted jobs decided")}
      ${n(t==null?"\u2014":t<48?t+" h":(t/24).toFixed(1)+" days","average time to first response")}
      ${n(e.avg_days_to_quote==null?"\u2014":e.avg_days_to_quote+" days","average time to a quotation")}
    </div>
    <div class="mgmt-cols">
      <div><p class="mgmt-h">Where they came from</p>${jn(e.by_source,a=>Oe[a]||a)}</div>
      <div><p class="mgmt-h">What they asked for</p>${jn(e.by_service)}</div>
      <div><p class="mgmt-h">Why jobs were lost</p>${jn(e.lost_reasons,a=>uo[a]||a)}</div>
    </div>`}async function Ha(e){let t=e.querySelector("[data-mgmt]");if(!t)return;let n=ut;try{let a=await d.managementSummary(Qa[ut].from(),X());n===ut&&(t.innerHTML=mo(a))}catch{t.innerHTML='<p class="mini-none">The summary is not available yet. It needs the 2026-09-25 database update.</p>'}}function ho(e){Ha(e),e.addEventListener("click",t=>{let n=t.target.closest("[data-period]");!n||n.dataset.period===ut||(ut=n.dataset.period,e.querySelectorAll("[data-period]").forEach(a=>a.setAttribute("aria-pressed",String(a===n))),Ha(e))})}function fo(){return`<span class="sub-quiet">${s(B(X()))}</span>`}var lo,uo,Qa,ut,po,jn,Va=R(()=>{Y();G();H();se();J();lo="Dashboard";uo=Object.fromEntries(Ht),Qa={week:{label:"Last 7 days",from:()=>Be(X(),-6)},month:{label:"This month",from:()=>X().slice(0,8)+"01"},q:{label:"Last 90 days",from:()=>Be(X(),-89)}},ut="month",po=()=>w("How the business is doing",`
    <div class="period-tabs" role="group" aria-label="Period">
      ${Object.entries(Qa).map(([e,t])=>`<button type="button" data-period="${e}" aria-pressed="${e===ut}">${s(t.label)}</button>`).join("")}
    </div>
    <div data-mgmt aria-live="polite"><p class="mini-none">Counting\u2026</p></div>`,{note:"Demonstration records are left out"}),jn=(e,t=n=>n)=>{let n=Object.entries(e||{}).sort((a,o)=>o[1]-a[1]);return n.length?`<ul class="mgmt-list">${n.map(([a,o])=>`<li><span>${s(t(a))}</span><span class="num">${o}</span></li>`).join("")}</ul>`:'<p class="mini-none">None</p>'}});var Ya={};te(Ya,{filesCard:()=>Ke,mountFiles:()=>Ye,saveFile:()=>Ka});function Ye(e,t,n,a){e.addEventListener("change",async o=>{let i=o.target.closest("[data-upload]");if(!i||!i.files?.length)return;let r=i.files[0];if(i.value="",r.size>yo){g(`${r.name} is ${za(r.size)}. The limit is 25 MB \u2014 send larger drawing sets by transfer link.`,"bad");return}let l=e.querySelector(".file-pick span"),m=l?.textContent;l&&(l.textContent="Uploading\u2026");try{let h=await d.uploadFile(r,t,n?.id);await d.logActivity({opportunity_id:t.opportunity_id||null,project_id:t.project_id||null,contact_id:t.contact_id||null,kind:"file",body:`File added: ${r.name}`,actor_id:n?.id||null}),g("Uploaded."),Q(a)}catch(h){g(h.message||"That file could not be uploaded.","bad"),l&&(l.textContent=m)}}),e.addEventListener("click",async o=>{let i=o.target.closest("[data-file]");if(!i)return;let r=i.dataset.name||"file",l=i.parentElement?.querySelector(".mini-side"),m=l?.innerHTML;l&&(l.textContent="\u2026");try{await Ka(i.dataset.file,r)}catch(h){g(h.message||"That file could not be opened.","bad")}finally{l&&m!==void 0&&(l.innerHTML=m)}})}async function Ka(e,t="file"){let n=await d.downloadUrl(e),a=await fetch(n);if(!a.ok)throw new Error(`That file could not be fetched (${a.status}).`);let o=await a.blob(),i=URL.createObjectURL(o),r=document.createElement("a");r.href=i,r.download=t,r.rel="noopener",document.body.appendChild(r),r.click(),r.remove(),setTimeout(()=>URL.revokeObjectURL(i),3e4)}var yo,za,Ke,St=R(()=>{Y();H();se();J();ce();yo=25*1024*1024,za=e=>!e&&e!==0?"":e>=1048576?(e/1048576).toFixed(1)+" MB":e>=1024?Math.round(e/1024)+" KB":e+" B",Ke=e=>w("Files",e.length?`
  <ul class="mini files">
    ${e.map(t=>`<li>
      <button type="button" class="mini-btn" data-file="${s(t.path)}" data-name="${s(t.name)}">
        <span class="mini-main">${c.file(13)}${s(t.name)}</span>
        <span class="mini-sub">${s(za(t.size_bytes))} \xB7 ${s(B(t.created_at))}${t.profiles?.initials?" \xB7 "+s(t.profiles.initials):""}</span>
      </button>
      <span class="mini-side">${c.download(15)}</span>
    </li>`).join("")}
  </ul>`:x("No files yet.","Drawings, BOQs and quotation PDFs go here.",{tone:"quiet"}),{tight:!0,action:`<label class="btn-ghost btn-xs file-pick">
      ${c.upload(13)}<span>Upload</span>
      <input type="file" data-upload hidden
             accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.dwg,.dxf,.xlsx,.xls,.docx,.doc,.zip,.csv,.txt">
    </label>`})});async function Ja(e=X()){try{let t=await d.settings();return await d.addWorkingDays(e,t?.quote_followup_working_days??3)}catch{return""}}function Za({opp:e,quotes:t=[],onDone:n}){let a=(t.reduce((i,r)=>Math.max(i,r.version||0),0)||0)+1,o=t.find(i=>i.version===a-1);z({title:a>1?`Record revision ${a}`:"Record the quotation",sub:`${e.ref} \u2014 ${e.title}`,width:580,submitLabel:"Record quotation",body:`
      <div class="field-row">
        ${u("amount","Quoted amount",ct("amount",o?.amount??"",'required min="0" step="0.01"'),{hint:"The figure on the quotation you are sending \u2014 not an estimate."})}
        ${u("currency","Currency",N("currency",go,o?.currency||e.currency||"USD"))}
      </div>
      <div class="field-row">
        ${u("reference","Quotation number",j("reference","",`placeholder="Leave blank for Q-${s(String(e.ref).replace(/\D/g,""))}-${a}"`),{hint:"Only if your quotation already carries its own number."})}
        ${u("prepared_on","Date on the quotation",ee("prepared_on",X()))}
      </div>
      <div class="field-row">
        ${u("valid_until","Valid until",ee("valid_until",""))}
        ${u("document_ref","Document / where it is filed",j("document_ref","",'placeholder="Q-2445-1.pdf in Quotes 2026"'))}
      </div>
      ${u("notes",a>1?"What changed in this revision":"Notes",V("notes","",2,a>1?'placeholder="Roof sheeting changed to IBR 0.47"':""),{wide:!0})}
      <p class="modal-message">Recorded as a draft. Use <strong>Mark as sent</strong> once it has
        actually gone to the customer \u2014 that is what starts the follow-up clock.</p>`,onSubmit:async i=>{let r=dt(i.amount);if(r===null||Number.isNaN(r))throw D("amount","Enter the quoted amount.");if(r<0)throw D("amount","That cannot be negative.");let l=await d.recordQuote(e.id,{amount:r,currency:i.currency,preparedOn:b(i.prepared_on),validUntil:b(i.valid_until),notes:b(i.notes),reference:b(i.reference),documentRef:b(i.document_ref)});g(`Quotation ${l?.reference||""} recorded.`),Q(n,l)}})}async function nn({opp:e,quote:t,onDone:n}){let a=await Ja(),o=je(new Date);z({title:`Mark ${t.reference} as sent`,sub:`${U(t.amount,t.currency)} \xB7 ${e.title}`,width:540,submitLabel:"Mark as sent",body:`
      <div class="field-row">
        ${u("sent_at","Sent",Ve("sent_at",o,"required"))}
        ${u("channel","How",N("channel",[["email","Email"],["whatsapp","WhatsApp"],["hand","By hand"],["meeting","At a meeting"],["other","Other"]],"email"))}
      </div>
      ${u("follow_up_on","Follow up on",ee("follow_up_on",a,"required"),{hint:"Worked out from the working-day rule in Settings. Change it if the customer gave you a date."})}
      ${u("notes","Notes",V("notes","",2,'placeholder="Sent to Tendai and copied to accounts"'),{wide:!0})}
      ${$o}`,onSubmit:async i=>{if(!i.sent_at)throw D("sent_at","When did it go?");let r=Rn(i.sent_at,o);if(r&&Date.parse(r)>Date.now()+5*6e4)throw D("sent_at","That is in the future.");await d.markQuoteSent(t.id,{sentAt:r,followUpOn:b(i.follow_up_on),channel:i.channel,notes:b(i.notes)}),g(`${t.reference} marked sent. Follow-up booked.`),Q(n)}})}async function an({opp:e,quote:t,onDone:n}){let a=t.status==="draft",o=await d.filesFor("opportunity_id",t.opportunity_id).catch(()=>[]),i=o.filter(m=>m.quote_id===t.id),r=o.filter(m=>!m.quote_id),l=z({title:`Quotation ${t.reference}`,sub:`${e?.title||""}${t.version>1?` \xB7 revision ${t.version}`:""}`,width:540,submitLabel:"Save",body:`
      <dl class="kv">
        <div><dt>Amount</dt><dd class="num">${s(U(t.amount,t.currency))}</dd></div>
        <div><dt>Prepared</dt><dd>${s(st(t.prepared_on))}</dd></div>
        <div><dt>Sent</dt><dd>${t.sent_at?s(new Date(t.sent_at).toLocaleString("en-GB",{timeZone:"Africa/Harare",dateStyle:"medium",timeStyle:"short"}))+(t.profiles?.full_name?" \xB7 "+s(t.profiles.full_name):""):"Not sent"}</dd></div>
        <div><dt>Follow up</dt><dd>${s(st(t.follow_up_on))}</dd></div>
      </dl>
      ${a?u("amount","Correct the amount",ct("amount",t.amount,'min="0" step="0.01"'),{hint:"Only while it is a draft. Once sent, a change is a new revision."}):""}
      <div class="field-row">
        ${u("valid_until","Valid until",ee("valid_until",t.valid_until||""))}
        ${u("document_ref","Document / where it is filed",j("document_ref",t.document_ref||""))}
      </div>
      ${u("notes","Notes",V("notes",t.notes||"",3),{wide:!0})}
      <div class="field field-wide">
        <span class="field-label">The document sent</span>
        ${i.length?`<ul class="mini">${i.map(m=>`<li><button type="button" class="lnk" data-open-file="${s(m.path)}">${s(m.name)}</button></li>`).join("")}</ul>`:'<p class="field-hint">Nothing attached to this version yet.</p>'}
      </div>
      <div class="field-row">
        ${u("attach","Attach a file",'<input class="inp" id="attach" name="attach" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.docx,.doc">',{hint:"The quotation PDF as sent. 25 MB at most."})}
        ${r.length?u("link_file","Or use a file already on the enquiry",N("link_file",[["","None"],...r.map(m=>[m.id,m.name])],"")):""}
      </div>`,onSubmit:async m=>{let h=document.getElementById("attach")?.files?.[0]||null;if(h&&h.size>wo)throw D("attach","That file is over 25 MB.");let _={valid_until:b(m.valid_until),document_ref:b(m.document_ref),notes:b(m.notes)};if(a){let O=dt(m.amount);if(O===null||Number.isNaN(O)||O<0)throw D("amount","Enter a valid amount.");_.amount=O}if(await d.updateQuote(t.id,_),h){let O=at();await d.uploadFile(h,{opportunity_id:t.opportunity_id,quote_id:t.id},O?.id),await d.logActivity({opportunity_id:t.opportunity_id,kind:"file",body:`File added to ${t.reference}: ${h.name}`,actor_id:O?.id||null})}m.link_file&&await d.linkFileToQuote(m.link_file,t.id),g("Quotation saved."),Q(n)}});return[...document.querySelectorAll(".modal")].pop()?.addEventListener("click",async m=>{let h=m.target.closest("[data-open-file]");if(!h)return;let{saveFile:_}=await Promise.resolve().then(()=>(St(),Ya));try{await _(h.dataset.openFile,h.textContent.trim())}catch(O){g(O.message||"That file could not be opened.","bad")}}),l}async function sn({opp:e,onDone:t}){let n=await Ja(),a=je(new Date);z({title:"Log a follow-up",sub:`${e.ref} \u2014 ${e.title}`,width:560,submitLabel:"Log follow-up",body:`
      <div class="field-row">
        ${u("channel","How",N("channel",Sn,"phone"))}
        ${u("at","When",Ve("at",a))}
      </div>
      ${u("notes","What happened",V("notes","",3,'required placeholder="Spoke to Tendai. Board meets Thursday."'),{wide:!0})}
      <div class="field-row">
        ${u("next_action","Next action",j("next_action",e.next_action||"",'placeholder="Follow up quotation"'))}
        ${u("next_due","Next follow-up",ee("next_due",n,"required"))}
      </div>
      <p class="modal-message">If the customer answered, use <strong>Customer replied</strong>
        instead \u2014 that stops the chase and puts the next move on us.</p>`,onSubmit:async o=>{if(!o.notes)throw D("notes","Say what happened.");if(!o.next_due)throw D("next_due","Give the next date.");await d.logFollowUp(e.id,{channel:o.channel,notes:o.notes,at:Rn(o.at,a),nextAction:b(o.next_action),nextDue:o.next_due}),g("Follow-up logged."),Q(t)}})}function Xa({opp:e,onDone:t}){let n=je(new Date);z({title:"Customer replied",sub:`${e.ref} \u2014 ${e.title}`,width:520,submitLabel:"Record reply",body:`
      <div class="field-row">
        ${u("channel","How",N("channel",Sn,"whatsapp"))}
        ${u("at","When",Ve("at",n))}
      </div>
      ${u("notes","What they said",V("notes","",3,'placeholder="Happy with the scope, asking about payment terms"'),{wide:!0})}
      <p class="modal-message">Recorded by hand \u2014 the CRM cannot see Kingson's inbox. The
        chase stops and the next action becomes "Respond to customer reply", due today.</p>`,onSubmit:async a=>{await d.customerReplied(e.id,{channel:a.channel,notes:b(a.notes),at:Rn(a.at,n)}),g("Reply recorded."),Q(t)}})}function Pn({opp:e,onDone:t,onCancel:n}){let a=de(e);z({title:"Mark as won",sub:`${e.ref} \u2014 ${e.title}`,width:500,submitLabel:"Mark won",body:`
      <div class="field-row">
        ${u("value",`Accepted value (${s(a.currency)})`,ct("value",a.amount??"",'required min="0" step="0.01"'),{hint:a.amount!=null?"Prefilled from the latest quotation. Change it if the customer accepted a different figure.":"No quotation is recorded. Enter the value the customer accepted."})}
        ${u("on","Decided on",ee("on",X()))}
      </div>
      ${u("notes","Notes",V("notes","",2,'placeholder="Order number, deposit terms"'),{wide:!0})}
      <p class="modal-message">Follow-ups stop. The latest quotation is marked accepted.</p>`,onSubmit:async o=>{let i=dt(o.value);if(i===null||Number.isNaN(i))throw D("value","Enter the accepted value.");if(i<0)throw D("value","That cannot be negative.");await d.decide(e.id,"won",{value:i,on:b(o.on),notes:b(o.notes)}),g("Marked won."),Q(t)}}),Fn(n)}function Un({opp:e,onDone:t,onCancel:n}){z({title:"Mark as lost",sub:`${e.ref} \u2014 ${e.title}`,width:500,submitLabel:"Mark lost",body:`
      <div class="field-row">
        ${u("reason","Why",N("reason",[["","Choose\u2026"],...Ht],""))}
        ${u("on","Decided on",ee("on",X()))}
      </div>
      ${u("notes","Notes",V("notes","",3,'placeholder="Competitor came in 14% lower"'),{wide:!0,hint:'Required for "Other". This is what somebody reads back in six months.'})}
      <p class="modal-message">Follow-ups stop and open tasks on this job are cancelled.</p>`,onSubmit:async a=>{if(!a.reason)throw D("reason","Choose a reason.");if(a.reason==="other"&&!a.notes)throw D("notes","Say why.");await d.decide(e.id,"lost",{reason:a.reason,on:b(a.on),notes:b(a.notes)}),g("Marked lost."),Q(t)}}),Fn(n)}function In({opp:e,onDone:t,onCancel:n}){z({title:"Put on hold",sub:`${e.ref} \u2014 ${e.title}`,width:500,submitLabel:"Put on hold",body:`
      ${u("reason","Why",j("reason","",'required placeholder="Waiting for funding approval"'),{wide:!0})}
      ${u("review_on","Review on",ee("review_on","","required"),{hint:"It comes back onto the follow-up list on this date."})}
      ${u("notes","Notes",V("notes","",2),{wide:!0})}
      <p class="modal-message">Everything on the record is kept. Nothing is chased until the review date.</p>`,onSubmit:async a=>{if(!a.reason)throw D("reason","Give a reason.");if(!a.review_on)throw D("review_on","Choose a review date.");if(a.review_on<X())throw D("review_on","That date has passed.");await d.decide(e.id,"on_hold",{reason:a.reason,reviewOn:a.review_on,notes:b(a.notes)}),g("On hold."),Q(t)}}),Fn(n)}function on(e,{opp:t,onDone:n,onCancel:a}){return e==="won"?(Pn({opp:t,onDone:n,onCancel:a}),!0):e==="lost"?(Un({opp:t,onDone:n,onCancel:a}),!0):e==="on_hold"?(In({opp:t,onDone:n,onCancel:a}),!0):!1}function Fn(e){if(typeof e!="function")return;let t=document.querySelector(".modal");if(!t)return;let n=new MutationObserver(()=>{document.body.contains(t)||(n.disconnect(),e())});n.observe(document.body,{childList:!0})}var go,Rn,$o,wo,qt=R(()=>{Y();Kt();G();H();ce();go=["USD","ZWG","ZAR"];Rn=(e,t)=>e===t?null:xt(e),$o=`
  <p class="modal-message">The CRM does not send email. Send the quotation from your own
    mailbox or WhatsApp as usual, then record it here. The time, the value and your name are
    stamped on the record.</p>`;wo=25*1024*1024});var ss={};te(ss,{mount:()=>xo,render:()=>_o,sub:()=>ko,title:()=>bo});async function ns(e){let t=await d.closedPage(e,rn+1);return ts=t.length>rn,es=e+Math.min(t.length,rn),t.slice(0,rn)}async function _o(){let[e,t]=await Promise.all([d.openOpportunities(),ns(0)]);return Pe=[...e,...t],as()}function as(){let e=Pe;return e.length?`
  <div class="board" role="list">
    ${xe.map(t=>{let n=e.filter(i=>i.stage===t.id),a=Jt(We(n).by),o=n.filter(we).length;return`
      <section class="col" data-group="${s(t.group)}" data-stage="${s(t.id)}" role="listitem">
        <header class="col-head">
          <span class="col-name">${s(t.name)}</span>
          <span class="col-n num">${n.length}</span>
          <span class="col-v num">${s(a)}</span>
          ${o?`<span class="col-alarm" title="${s(q(o,"overdue follow-up"))}">${c.alert(12)}${o}</span>`:""}
        </header>
        <div class="col-body" data-drop="${s(t.id)}">
          ${n.length?n.sort((i,r)=>be(r).sort-be(i).sort).map(vo).join(""):'<p class="col-empty">Nothing here</p>'}
          ${ts&&(t.id==="won"||t.id==="lost")?'<button type="button" class="btn-ghost btn-xs col-more" data-more-closed>Show older decisions</button>':""}
        </div>
      </section>`}).join("")}
  </div>`:x("No enquiries yet.","An enquiry from the website appears here automatically. Add one by hand with New enquiry.",{tone:"quiet"})}function vo(e){let t=be(e);return`
  <article class="deal${t.level==="overdue"||t.level==="unbooked"?" deal-alarm":""}" draggable="true" data-deal="${s(e.id)}">
    <a class="deal-hit" href="#/opportunity/${s(e.id)}">
      <span class="deal-co">${s(e.company_name||e.contact_name||"No company")}</span>
      <span class="deal-title">${s(e.title)}</span>
    </a>
    <div class="deal-meta">
      <span class="deal-value num">${(()=>{let a=de(e);return a.amount==null?'<span class="dim">Not quoted yet</span>':s(U(a.amount,a.currency))+(a.kind==="draft"?' <span class="dim">draft</span>':"")})()}</span>
      ${Qe(e.source)}
    </div>
    ${Number(e.live_quotes)?`<p class="deal-quote">${c.doc(12)}${s(q(Number(e.live_quotes),"quotation"))} out${e.last_quote_sent?" \xB7 "+s(I(e.last_quote_sent)):""}</p>`:""}
    <div class="deal-foot">
      ${He(e)}
      ${Ge(e.priority)}
      <span class="deal-right">
        ${M(e.owner_name?{full_name:e.owner_name,initials:e.owner_initials}:null,22)}
        <span class="deal-move">
          <label class="sr-only" for="mv-${s(e.id)}">Move ${s(e.title)} to another stage</label>
          <select class="deal-select" id="mv-${s(e.id)}" data-move="${s(e.id)}">
            ${xe.map(a=>`<option value="${s(a.id)}"${a.id===e.stage?" selected":""}>${s(a.short)}</option>`).join("")}
          </select>
          <span class="deal-move-ic" aria-hidden="true">${c.chevron(12)}</span>
        </span>
      </span>
    </div>
  </article>`}function xo(e,t){async function n(o,i,r){let l=Pe.find(h=>h.id===o)||{id:o,title:"this enquiry",stage:r};if(l.stage===i)return;let m=e.querySelector(`[data-move="${CSS.escape(o)}"]`);if(!on(i,{opp:l,onDone:t,onCancel:()=>{m&&document.contains(m)&&r&&(m.value=r)}}))try{await d.setStage(o,i),g(`Moved to ${oe[i].name}.`),await t()}catch(h){g(h.message||"That move could not be saved.","bad");let _=e.querySelector(`[data-move="${CSS.escape(o)}"]`);_&&r&&(_.value=r)}}e.addEventListener("click",async o=>{let i=o.target.closest("[data-more-closed]");if(i){i.disabled=!0;try{Pe=Pe.concat(await ns(es));let r=e.querySelector(".board")?.scrollLeft||0;e.innerHTML=as();let l=e.querySelector(".board");l&&(l.scrollLeft=r)}catch(r){i.disabled=!1,g(r.message||"Could not load more.","bad")}}}),e.addEventListener("change",o=>{let i=o.target.closest("[data-move]");if(!i)return;let r=i.dataset.move,l=Pe.find(m=>m.id===r)?.stage;n(r,i.value,l)});let a=null;e.addEventListener("dragstart",o=>{let i=o.target.closest("[data-deal]");if(i){a=i.dataset.deal,i.classList.add("is-dragging"),o.dataTransfer.effectAllowed="move";try{o.dataTransfer.setData("text/plain",a)}catch{}}}),e.addEventListener("dragend",o=>{o.target.closest("[data-deal]")?.classList.remove("is-dragging"),e.querySelectorAll(".is-over").forEach(i=>i.classList.remove("is-over")),a=null}),e.addEventListener("dragover",o=>{let i=o.target.closest("[data-drop]");!i||!a||(o.preventDefault(),o.dataTransfer.dropEffect="move",i.classList.contains("is-over")||(e.querySelectorAll(".is-over").forEach(r=>r.classList.remove("is-over")),i.classList.add("is-over")))}),e.addEventListener("drop",o=>{let i=o.target.closest("[data-drop]");if(!i||!a)return;o.preventDefault();let r=a;a=null,n(r,i.dataset.drop,Pe.find(l=>l.id===r)?.stage)})}function ko(){let e=Pe.filter(n=>oe[n.stage]?.open),t=We(e);return`${s(q(e.length,"open enquiry","open enquiries"))} \xB7 <span class="num">${s(re(t.by,{empty:"nothing quoted"}))}</span>${t.unvalued?` \xB7 ${t.unvalued} not quoted yet`:""}`}var bo,rn,Pe,es,ts,os=R(()=>{Y();G();H();se();J();ce();qt();bo="Enquiries",rn=40,Pe=[],es=0,ts=!1});var is={};te(is,{mount:()=>To,render:()=>qo,sub:()=>Eo,title:()=>So});function ln(e){let t=We(e);return t.valued?re(t.by)+" quoted"+(t.unvalued?` \xB7 ${t.unvalued} unquoted`:""):e.length?"not quoted yet":""}async function qo(e,{me:t}){Ue=await d.openOpportunities();let n=Ue.filter(we).sort((l,m)=>A(l.next_action_due)-A(m.next_action_due)),a=Ue.filter(nt).sort((l,m)=>new Date(l.created_at)-new Date(m.created_at)),o=Ue.filter(Vt),i=Ue.filter(l=>{let m=A(l.next_action_due);return m!==null&&m>0&&m<=14}).sort((l,m)=>A(l.next_action_due)-A(m.next_action_due));return`
    ${`
    <div class="fu-summary">
      <span class="fu-sum fu-sum-danger">
        ${c.alert(16)}<b class="num">${n.length}</b><span>overdue</span>
        <em class="num">${s(ln(n))}</em>
      </span>
      <span class="fu-sum${a.length?" fu-sum-danger":""}">
        ${c.alert(16)}<b class="num">${a.length}</b><span>nothing booked</span>
        <em class="num">${s(ln(a))}</em>
      </span>
      <span class="fu-sum">
        ${c.clock(16)}<b class="num">${o.length}</b><span>due today</span>
        <em class="num">${s(ln(o))}</em>
      </span>
      <span class="fu-sum">
        ${c.calendar(16)}<b class="num">${i.length}</b><span>next 14 days</span>
        <em class="num">${s(ln(i))}</em>
      </span>
    </div>`}
    ${cn("Overdue",n,"Past the date somebody committed to. Every one of these is a customer waiting.")}
    ${cn("Open, with nothing booked",a,"These appear on no list and are on nobody\u2019s day. This is where enquiries are lost.")}
    ${cn("Due today",o,"Booked for today.")}
    ${cn("Next fourteen days",i,"Booked and not yet due.")}`}function cn(e,t,n){return t.length?w(e,`
    <ul class="fu-list">
      ${t.map(a=>`
        <li class="fu">
          <span class="fu-when">${en(a.next_action_due)}</span>
          <a class="fu-main" href="#/opportunity/${s(a.id)}">
            <span class="fu-title">${s(a.title)}</span>
            <span class="fu-sub">${s(a.company_name||a.contact_name||"\u2014")} \xB7 ${s(a.ref)}${(()=>{let o=de(a);return o.amount==null?" \xB7 not quoted yet":` \xB7 <span class="num">${s(U(o.amount,o.currency))}</span>`})()}</span>
            <span class="fu-action">${a.next_action?`${c.arrowRight(13)}${s(a.next_action)}`:`${c.alert(13)}No next action recorded`}</span>
            ${Number(a.live_quotes)?`<span class="fu-quote">${c.doc(12)}${s(q(Number(a.live_quotes),"quotation"))} out${a.last_quote_sent?" \xB7 "+s(I(a.last_quote_sent)):""}</span>`:""}
          </a>
          <span class="fu-stage">${He(a)}</span>
          <span class="fu-owner">${M(a.owner_name?{full_name:a.owner_name,initials:a.owner_initials}:null,26)}</span>
          <span class="fu-do">
            ${Se({phone:a.contact_phone,whatsapp:a.contact_whatsapp,email:a.contact_email},{text:`Good day, Kingson Engineering here regarding ${a.title}.`,size:"xs"})}
            <button type="button" class="btn-ghost btn-xs" data-chase="${s(a.id)}">${c.check(13)}<span>Log follow-up</span></button>
          </span>
        </li>`).join("")}
    </ul>`,{note:n,tight:!0}):w(e,x(e==="Overdue"||e.startsWith("Open,")?"Nothing in this group. Good.":"Nothing booked in this window."),{note:n,tight:!0})}function To(e,t){e.addEventListener("click",n=>{let a=n.target.closest("[data-chase]");if(!a)return;let o=Ue.find(i=>i.id===a.dataset.chase);o&&sn({opp:o,onDone:t})})}function Eo(){let e=Ue.filter(we).length,t=Ue.filter(nt).length,n=[];return e&&n.push(`${e} overdue`),t&&n.push(`${t} with nothing booked`),n.length?`<span class="sub-alarm">${c.alert(14)}${s(n.join(" \xB7 "))}</span>`:"Nothing is late"}var So,Ue,rs=R(()=>{Y();G();H();se();J();ce();qt();So="Follow-ups";Ue=[]});var dn={};te(dn,{bookFollowUp:()=>Hn,contactDialog:()=>Qn,convertDialog:()=>Gn,logActivity:()=>Wn,newOpportunity:()=>Bn,projectDialog:()=>Vn,taskDialog:()=>Et,visitDialog:()=>pt});async function Bn({me:e,contact:t=null,onDone:n}){let a=await d.profiles(),o=0,i=0,r=[],l=z({title:"New enquiry",sub:t?`For ${t.full_name}`:"Name, a phone number or email, and what they need. The rest can wait.",width:640,submitLabel:"Create enquiry",body:`
      <input type="hidden" name="contact_id" value="${s(t?.id||"")}">
      <input type="hidden" name="force_new" value="">
      <div class="qe-who"${t?" hidden":""}>
        <div class="field-row">
          ${u("full_name","Who is it?",j("full_name","",'autocomplete="off" placeholder="Tendai Moyo"'))}
          ${u("phone","Phone / WhatsApp",j("phone","",'type="tel" inputmode="tel" autocomplete="off" placeholder="077 123 4567"'))}
        </div>
        <div class="field-row">
          ${u("email","Email",j("email","",'type="email" inputmode="email" autocomplete="off" placeholder="name@company.co.zw"'),{hint:"Optional if you have a phone number."})}
          ${u("company","Company",j("company","",'autocomplete="off" placeholder="Optional"'))}
        </div>
      </div>
      <div class="qe-match" data-match aria-live="polite">${t?cs(t):""}</div>
      ${u("description","What do they need?",V("description","",2,'placeholder="Structural steel for a warehouse in Msasa. Has drawings, wants a price."'),{wide:!0})}
      <div class="field-row">
        ${u("source","How did it come in?",N("source",Bt.map(f=>[f,Oe[f]]),"phone"))}
        ${u("service","Service",N("service",[["","Not sure yet"],"Structural steelwork","Roof steelwork and trusses","Fiber laser cutting","Balustrades and gates","Stainless fabrication","Mobile cranage","Other"]))}
      </div>
      <details class="qe-more">
        <summary>More detail (optional)</summary>
        <div class="field-row">
          ${u("location","Site / location",j("location","",'placeholder="Msasa, Harare"'))}
          ${u("drawings","Drawings?",N("drawings",wa,"unknown"))}
        </div>
        <div class="field-row">
          ${u("preferred","Best way to reach them",N("preferred",ba,""))}
          ${u("owner_id","Who deals with it",N("owner_id",Tt(a),e?.id||""))}
        </div>
        <div class="field-row">
          ${u("next_action","Next action",j("next_action","Call and qualify the enquiry"))}
          ${u("next_action_due","Due",ee("next_action_due",Gt()))}
        </div>
        ${u("title","Job name",j("title","",'placeholder="Left blank, it is made from the service and site"'),{wide:!0})}
      </details>`,onSubmit:async f=>{let Z=f.contact_id||null;if(!Z){if(!f.full_name)throw D("full_name","Who is asking?");if(!f.phone&&!f.email)throw D("phone","A phone number or an email address is needed.");if(f.email&&!kn(f.email))throw D("email","That email address does not look right.");if(r.length&&f.force_new!=="1")throw new Error("This customer may already be on file. Choose \u201CUse this customer\u201D, or \u201Ccreate a new customer\u201D if it is somebody else.")}if(!f.description)throw D("description","Write a line about what they need.");let S=await d.createEnquiry({fullName:f.full_name,phone:f.phone,email:f.email,company:f.company,contactId:Z,forceNew:f.force_new==="1",description:f.description,title:f.title,service:f.service,location:f.location,source:f.source,preferredChannel:f.preferred,drawings:f.drawings,ownerId:b(f.owner_id),nextAction:f.next_action,nextDue:b(f.next_action_due)});g(`${S.ref} created${S.contact_reused?" for an existing customer":""}.`),n?Q(n,{id:S.opportunity_id,ref:S.ref}):location.hash=`#/opportunity/${S.opportunity_id}`}}),m=[...document.querySelectorAll(".modal")].pop();if(!m||t)return l;let h=m.querySelector("[data-match]"),_=m.querySelector('[name="contact_id"]'),O=m.querySelector('[name="force_new"]'),C=m.querySelector(".qe-who"),E=f=>m.querySelector(`[name="${f}"]`).value.trim();async function P(){if(_.value)return;let f={phone:va(E("phone"))?E("phone"):"",email:kn(E("email")),name:E("full_name"),company:E("company")};if(!f.phone&&!f.email&&f.name.length<3&&f.company.length<3){r=[],h.innerHTML="";return}let Z=++i,S=[];try{S=await d.findMatches(f)}catch{return}if(Z!==i||_.value)return;r=S.filter(Ie=>Ie.strength==="strong");let $e=S.filter(Ie=>Ie.strength!=="strong");if(!S.length){h.innerHTML="",O.value="";return}h.innerHTML=(r.length?`
        <div class="qe-found qe-strong">
          <p class="qe-found-h">${c.alert(15)}<span>Existing customer found \u2014 same ${s(r[0].match==="email"?"email address":"phone number")}</span></p>
          ${r.map(ls).join("")}
          <button type="button" class="btn-ghost btn-xs" data-force-new aria-pressed="${O.value?"true":"false"}">
            ${O.value?"Creating a new customer \u2014 undo":"It is somebody else \u2014 create a new customer"}</button>
        </div>`:"")+($e.length?`
        <details class="qe-found qe-soft"${r.length?"":" open"}>
          <summary>${$e.length} similar name${$e.length===1?"":"s"} on file \u2014 is it one of them?</summary>
          ${$e.map(ls).join("")}
        </details>`:"")}let ae=()=>{clearTimeout(o),O.value="",o=setTimeout(P,250)};return["full_name","phone","email","company"].forEach(f=>m.querySelector(`[name="${f}"]`).addEventListener("input",ae)),h.addEventListener("click",f=>{let Z=f.target.closest("[data-use]");if(Z){let S=JSON.parse(Z.dataset.use);_.value=S.contact_id,O.value="",r=[],C.hidden=!0,h.innerHTML=cs({full_name:S.full_name,companies:{name:S.company_name},phone:S.phone,email:S.email},!0),m.querySelector('[name="description"]').focus();return}if(f.target.closest("[data-change]")){_.value="",C.hidden=!1,h.innerHTML="",P();return}if(f.target.closest("[data-force-new]")){O.value=O.value?"":"1";let S=f.target.closest("[data-force-new]");S.setAttribute("aria-pressed",O.value?"true":"false"),S.textContent=O.value?"Creating a new customer \u2014 undo":"It is somebody else \u2014 create a new customer"}}),l}function ls(e){let t=s(JSON.stringify({contact_id:e.contact_id,full_name:e.full_name,company_name:e.company_name,phone:e.phone,email:e.email}));return`<div class="qe-hit">
      <span class="qe-hit-main">
        <strong>${s(e.full_name)}</strong>${e.company_name?` \xB7 ${s(e.company_name)}`:""}
        <span class="qe-hit-sub">${s([e.phone,e.email].filter(Boolean).join(" \xB7 "))}${e.open_enquiries?` \xB7 ${e.open_enquiries} open enquir${e.open_enquiries===1?"y":"ies"}`:""}${e.last_ref?` \xB7 last ${s(e.last_ref)}`:""}</span>
      </span>
      <button type="button" class="btn btn-xs" data-use="${t}">Use this customer</button>
    </div>`}function cs(e,t=!1){return`<div class="qe-chosen">
      ${c.check(15)}
      <span><strong>${s(e.full_name)}</strong>${e.companies?.name?` \xB7 ${s(e.companies.name)}`:""}
        <span class="qe-hit-sub">${s([e.phone,e.email].filter(Boolean).join(" \xB7 "))}</span></span>
      ${t?'<button type="button" class="btn-ghost btn-xs" data-change>Change</button>':""}
    </div>`}function Wn({opportunityId:e,contactId:t,me:n,onDone:a}){z({title:"Log an interaction",sub:"Goes on the timeline exactly as written",width:520,submitLabel:"Log it",body:`
      ${u("kind","What happened?",N("kind",Sa.map(o=>[o,Qt[o]]),"call"))}
      ${u("body","Notes",V("body","",4,'required placeholder="Spoke to Tendai. Wants the quotation by Friday."'),{wide:!0})}
      ${u("occurred_at","When",Ve("occurred_at",je(new Date)),{hint:"Change this if you are catching up on something from earlier."})}`,onSubmit:async o=>{if(!o.body)throw D("body","Write what happened.");await d.logActivity({opportunity_id:e||null,contact_id:t||null,kind:o.kind,body:o.body,actor_id:n?.id||null,occurred_at:xt(o.occurred_at)||new Date().toISOString()}),g("Logged."),Q(a)}})}async function Hn({opp:e,me:t,onDone:n}){let a=await d.profiles();z({title:e.next_action_due?"Change the next action":"Book the next action",sub:"Every open enquiry should have one. This is what puts it on the follow-up list.",width:540,submitLabel:"Save",body:`
      ${u("next_action","What needs to happen",j("next_action",e.next_action||"",'required placeholder="Chase the quotation"'),{wide:!0})}
      <div class="field-row">
        ${u("next_action_due","When",ee("next_action_due",Me(e.next_action_due)||Gt(),"required"))}
        ${u("owner_id","Owner",N("owner_id",Tt(a),e.owner_id||t?.id||""))}
      </div>
      ${u("channel","How",N("channel",["Phone","WhatsApp","Email","Site visit","In person"],"Phone"))}
      ${u("also_task","Also add it to the task list",'<label class="check"><input type="checkbox" id="also_task" name="also_task" checked> <span>Create a task as well</span></label>',{wide:!0})}`,onSubmit:async o=>{if(!o.next_action)throw D("next_action","Say what needs to happen.");if(!o.next_action_due)throw D("next_action_due","Give it a date.");await d.updateOpportunity(e.id,{next_action:o.next_action,next_action_due:o.next_action_due,owner_id:b(o.owner_id)}),o.also_task&&await d.createTask({title:o.next_action,opportunity_id:e.id,contact_id:e.contact_id,owner_id:b(o.owner_id),due_date:o.next_action_due,channel:o.channel,priority:e.priority,task_type:Number(e.live_quotes||0)?"quote_followup":"enquiry_response"}),await d.logActivity({opportunity_id:e.id,contact_id:e.contact_id,kind:"task",body:`Next action booked for ${o.next_action_due}: ${o.next_action} (${o.channel})`,actor_id:t?.id||null}),g("Booked."),Q(n)}})}async function pt({opp:e,visit:t=null,me:n,onDone:a}){let o=await d.profiles(),i=!!t;z({title:i?"Site visit":"Book a site visit",sub:e?.title||"",width:560,submitLabel:i?"Save":"Book",body:`
      <div class="field-row">
        ${u("scheduled_at","When",Ve("scheduled_at",je(t?.scheduled_at)||je(new Date(Date.now()+864e5)),"required"))}
        ${u("owner_id","Who is going",N("owner_id",Tt(o),t?.owner_id||n?.id||""))}
      </div>
      ${u("location","Where",j("location",t?.location||e?.location||"",'placeholder="Msasa, Harare"'),{wide:!0})}
      ${u("purpose","Purpose",j("purpose",t?.purpose||"Measure up and assess access",""),{wide:!0})}
      ${i?`
        ${u("status","Status",N("status",["scheduled","completed","cancelled"].map(r=>[r,ds(r)]),t.status))}
        ${u("outcome","Outcome",V("outcome",t.outcome||"",3,'placeholder="Existing purlins sound. Access good from the north gate."'),{wide:!0})}`:""}
      ${u("notes","Notes",V("notes",t?.notes||"",2),{wide:!0})}`,onSubmit:async r=>{if(!r.scheduled_at)throw D("scheduled_at","Give a date and time.");let l={scheduled_at:xt(r.scheduled_at),owner_id:b(r.owner_id),location:b(r.location),purpose:b(r.purpose),notes:b(r.notes)};if(i)l.status=r.status,l.outcome=b(r.outcome),await d.updateVisit(t.id,l);else if(await d.createVisit({...l,opportunity_id:e.id,status:"scheduled"}),["new","contacted"].includes(e.stage))try{await d.updateOpportunity(e.id,{stage:"requirements"})}catch(m){g(`Visit booked. The stage was not moved: ${m.message}`,"bad"),Q(a);return}g(i?"Visit saved.":"Visit booked."),Q(a)}})}async function Et({task:e=null,opp:t=null,me:n,onDone:a}){let o=await d.profiles(),i=!!e;z({title:i?"Task":"New task",sub:t?.title||e?.opportunities?.title||"",width:520,submitLabel:i?"Save":"Create",body:`
      ${u("title","What needs doing",j("title",e?.title||"","required"),{wide:!0})}
      <div class="field-row">
        ${u("due_date","Due",ee("due_date",Me(e?.due_date)||Gt()))}
        ${u("owner_id","Owner",N("owner_id",Tt(o),e?.owner_id||n?.id||""))}
      </div>
      <div class="field-row">
        ${u("priority","Priority",N("priority",Ft.map(r=>[r,ds(r)]),e?.priority||"normal"))}
        ${u("channel","How",N("channel",["","Phone","WhatsApp","Email","Site visit","In person"],e?.channel||""))}
      </div>
      ${t||e?.opportunity_id?u("task_type","Kind of task",N("task_type",_a,e?.task_type||"general"),{wide:!0,hint:"Sales follow-ups close by themselves when the enquiry is won or lost. General tasks stay open."}):""}
      ${u("notes","Notes",V("notes",e?.notes||"",2),{wide:!0})}`,onSubmit:async r=>{if(!r.title)throw D("title","Say what needs doing.");let l={title:r.title,due_date:b(r.due_date),owner_id:b(r.owner_id),priority:r.priority,channel:b(r.channel),notes:b(r.notes),...r.task_type?{task_type:r.task_type}:{}};i?await d.updateTask(e.id,l):await d.createTask({...l,opportunity_id:t?.id||null,contact_id:t?.contact_id||null}),g(i?"Task saved.":"Task created."),Q(a)}})}function Qn({contact:e=null,onDone:t}){let n=!!e;z({title:n?"Edit contact":"New contact",width:560,submitLabel:n?"Save":"Create",body:`
      <div class="field-row">
        ${u("full_name","Name",j("full_name",e?.full_name||"","required"))}
        ${u("job_title","Role",j("job_title",e?.job_title||"",'placeholder="Operations Manager"'))}
      </div>
      ${u("company","Company",j("company",e?.companies?.name||"",'placeholder="Msasa Park Logistics"'),{wide:!0})}
      <div class="field-row">
        ${u("phone","Phone",j("phone",e?.phone||"",'placeholder="+263 77 000 0000"'))}
        ${u("whatsapp","WhatsApp",j("whatsapp",e?.whatsapp||"",'placeholder="+263 77 000 0000"'),{hint:"Often not the same as the office line."})}
      </div>
      ${u("email","Email",j("email",e?.email||"",'type="email"'),{wide:!0})}
      ${u("preferred_channel","Prefers",N("preferred_channel",["","Phone","WhatsApp","Email"],e?.preferred_channel||""))}
      ${u("notes","Notes",V("notes",e?.notes||"",2),{wide:!0})}`,onSubmit:async a=>{if(!a.full_name)throw D("full_name","A name is needed.");if(!a.phone&&!a.whatsapp&&!a.email)throw D("phone","A phone number, a WhatsApp number or an email address is needed.");let o=a.company&&(await d.findOrCreateCompany(a.company))?.id||null,i={full_name:a.full_name,job_title:b(a.job_title),phone:b(a.phone),whatsapp:b(a.whatsapp),email:b(a.email)&&a.email.toLowerCase(),preferred_channel:b(a.preferred_channel),notes:b(a.notes)};o&&(i.company_id=o);let r=n?await d.updateContact(e.id,i):await d.createContact(i);g(n?"Contact saved.":"Contact created."),Q(t,r)}})}function Gn({opp:e,onDone:t}){z({title:"Open a project",sub:`${e.ref} \u2014 ${e.title}`,width:520,submitLabel:"Open project",body:`
      ${u("name","Project name",j("name",e.title,"required"),{wide:!0})}
      <div class="field-row">
        ${u("start_date","Start",ee("start_date",X()))}
        ${u("target_date","Target completion",ee("target_date",Be(X(),56)))}
      </div>
      <p class="modal-message">The client, contact, value and description come across from the
        enquiry. The enquiry stays on record and links to the project.</p>`,onSubmit:async n=>{let a=await d.convertToProject(e.id,{name:n.name,startDate:b(n.start_date),targetDate:b(n.target_date)});g("Project opened."),t?Q(t,a):location.hash=`#/project/${a}`}})}async function Vn({project:e,me:t,onDone:n}){let a=await d.profiles();z({title:"Edit project",sub:e.name,width:560,submitLabel:"Save",body:`
      ${u("name","Name",j("name",e.name,"required"),{wide:!0})}
      <div class="field-row">
        ${u("status","Status",N("status",ka.map(o=>[o,tt[o]]),e.status))}
        ${u("owner_id","Responsible",N("owner_id",Tt(a),e.owner_id||""))}
      </div>
      <div class="field-row">
        ${u("start_date","Start",ee("start_date",Me(e.start_date)))}
        ${u("target_date","Target",ee("target_date",Me(e.target_date)))}
      </div>
      <div class="field-row">
        ${u("value","Value (USD)",ct("value",e.value??"",'min="0" step="100"'))}
        ${u("completed_on","Completed",ee("completed_on",Me(e.completed_on)))}
      </div>
      ${u("description","Description",V("description",e.description||"",3),{wide:!0})}
      ${u("notes","Notes",V("notes",e.notes||"",2),{wide:!0})}`,onSubmit:async o=>{if(!o.name)throw D("name","A project needs a name.");await d.updateProject(e.id,{name:o.name,status:o.status,owner_id:b(o.owner_id),start_date:b(o.start_date),target_date:b(o.target_date),completed_on:b(o.completed_on),value:dt(o.value),description:b(o.description),notes:b(o.notes)}),g("Project saved."),Q(n)}})}var ds,Tt,qe=R(()=>{Y();G();J();H();ce();ds=e=>e.charAt(0).toUpperCase()+e.slice(1),Tt=(e,t=!0)=>(t?[["","Unassigned"]]:[]).concat(e.map(n=>[n.id,n.full_name]))});var ms={};te(ms,{actions:()=>Oo,mount:()=>Ao,render:()=>Do,sub:()=>No,title:()=>Lo});async function Do(e,{me:t}){return[un,us]=await Promise.all([d.tasks(),d.profiles()]),ps(t)}function ps(e){let t=un.filter(o=>(ye.status==="all"||o.status===ye.status)&&(ye.owner==="all"||(ye.owner==="mine"?o.owner_id===e?.id:o.owner_id===ye.owner))),n=`
    <div class="filters">
      <label class="sr-only" for="f-status">Status</label>
      <select class="sel sel-inline" id="f-status" data-f="status">
        ${[["open","Open"],["done","Completed"],["all","All"]].map(([o,i])=>`<option value="${o}"${ye.status===o?" selected":""}>${i}</option>`).join("")}
      </select>
      <label class="sr-only" for="f-owner">Owner</label>
      <select class="sel sel-inline" id="f-owner" data-f="owner">
        <option value="all"${ye.owner==="all"?" selected":""}>Everyone</option>
        <option value="mine"${ye.owner==="mine"?" selected":""}>Mine</option>
        ${us.map(o=>`<option value="${s(o.id)}"${ye.owner===o.id?" selected":""}>${s(o.full_name)}</option>`).join("")}
      </select>
      <span class="filters-n">${s(q(t.length,"task"))}</span>
    </div>`,a=t.length?`
    <ul class="fu-list">
      ${t.sort(Co).map(o=>`
        <li class="fu${o.status==="done"?" is-done":""}">
          <span class="fu-when">${en(o.due_date)}</span>
          <div class="fu-main">
            <span class="fu-title">${s(o.title)}</span>
            <span class="fu-sub">
              ${o.opportunities?`<a class="lnk" href="#/opportunity/${s(o.opportunities.id)}">${s(o.opportunities.ref)} \xB7 ${s(o.opportunities.title)}</a>`:'<span class="dim">Not linked to an opportunity</span>'}
              ${o.channel?" \xB7 "+s(o.channel):""}
            </span>
            ${o.notes?`<span class="fu-action">${s(o.notes)}</span>`:""}
          </div>
          <span class="fu-stage">${Ge(o.priority)}</span>
          <span class="fu-owner">${M(o.profiles,26)}</span>
          <span class="fu-do">
            <button type="button" class="btn-ghost btn-xs" data-edit="${s(o.id)}">${c.edit(13)}<span>Edit</span></button>
            ${o.status==="open"?`<button type="button" class="btn-ghost btn-xs" data-done="${s(o.id)}">${c.check(13)}<span>Done</span></button>`:`<button type="button" class="btn-ghost btn-xs" data-reopen="${s(o.id)}">${c.refresh(13)}<span>Reopen</span></button>`}
          </span>
        </li>`).join("")}
    </ul>`:x(ye.status==="open"?"Nothing outstanding.":"No tasks match that filter.",ye.status==="open"?"Every task on this filter is done.":"",{tone:"ok"});return n+w("",a,{tight:!0})}function Ao(e,t,{me:n}){e.addEventListener("change",a=>{let o=a.target.closest("[data-f]");if(!o)return;ye[o.dataset.f]=o.value;let i=document.getElementById("view");i.innerHTML=ps(n)}),e.addEventListener("click",async a=>{let o=a.target.closest("[data-done]"),i=a.target.closest("[data-reopen]"),r=a.target.closest("[data-edit]");try{if(o)return await d.completeTask(o.dataset.done),g("Completed."),t();if(i)return await d.updateTask(i.dataset.reopen,{status:"open"}),g("Reopened."),t();if(r){let l=un.find(m=>m.id===r.dataset.edit);if(l)return Et({task:l,me:n,onDone:t})}}catch(l){g(l.message||"That could not be saved.","bad")}})}function No(){let e=un.filter(n=>n.status==="open"),t=e.filter(n=>n.due_date&&A(n.due_date)<0).length;return t?`<span class="sub-alarm">${c.alert(14)}${s(q(t,"task"))} overdue</span>`:`${s(q(e.length,"open task"))}`}var Lo,un,ye,us,Co,Oo,hs=R(()=>{Y();G();H();se();J();ce();qe();Lo="Tasks",un=[],ye={status:"open",owner:"all"},us=[];Co=(e,t)=>e.due_date?t.due_date?e.due_date<t.due_date?-1:e.due_date>t.due_date?1:0:-1:1;Oo=()=>`<button type="button" class="btn btn-sm" data-new-task-global>${c.plus(14)}<span>New task</span></button>`});var gs={};te(gs,{actions:()=>Uo,mount:()=>Ro,render:()=>jo,sub:()=>Po,title:()=>Mo});async function Kn(e){let t=await d.contacts(Yn,{offset:e,limit:zn+1});return Jn=t.length>zn,t.slice(0,zn)}async function jo(){return Ce=await Kn(0),`
    <div class="filters">
      <div class="search">
        ${c.search(15)}
        <label class="sr-only" for="c-search">Search contacts</label>
        <input class="inp" id="c-search" type="search" placeholder="Name, phone or email"
               value="${s(Yn)}" autocomplete="off">
      </div>
      <span class="filters-n" data-count>${s(Zn())}</span>
    </div>
    <div data-list>${ys(Ce)}${fs()}</div>`}function ys(e){return e.length?w("",fe(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Name</th><th scope="col">Company</th>
        <th scope="col">Phone</th><th scope="col">Email</th><th scope="col"></th>
      </tr></thead>
      <tbody>
        ${e.map(t=>`<tr>
          <td><a class="lnk lnk-strong" href="#/contact/${s(t.id)}">
            ${M({full_name:t.full_name},24)}<span>${s(t.full_name)}</span></a>
            ${t.job_title?`<span class="td-sub">${s(t.job_title)}</span>`:""}</td>
          <td>${s(t.companies?.name||"\u2014")}</td>
          <td class="num">${t.phone?`<a class="lnk" href="${s(ke(t.phone))}">${s(t.phone)}</a>`:"\u2014"}</td>
          <td>${s(t.email||"\u2014")}</td>
          <td class="ta-r">${Se(t,{size:"xs"})}</td>
        </tr>`).join("")}
      </tbody>
    </table>`),{tight:!0}):w("",x("No contacts match that.","Try part of a name, a company or a number.",{tone:"quiet"}),{tight:!0})}function Ro(e){let t=e.querySelector("#c-search"),n=e.querySelector("[data-list]"),a=e.querySelector("[data-count]"),o=null,i=0,r=()=>{n.innerHTML=ys(Ce)+fs(),a.textContent=Zn()};t?.addEventListener("input",()=>{clearTimeout(o),o=setTimeout(async()=>{Yn=t.value.trim();let l=++i;try{let m=await Kn(0);if(l!==i)return;Ce=m,r()}catch(m){g(m.message||"Search failed.","bad")}},200)}),n.addEventListener("click",async l=>{let m=l.target.closest("[data-more]");if(!m)return;m.disabled=!0;let h=i;try{let _=await Kn(Ce.length);if(h!==i)return;Ce=Ce.concat(_),r()}catch(_){m.disabled=!1,g(_.message||"Could not load more.","bad")}})}var Mo,zn,Ce,Yn,Jn,Zn,fs,Po,Uo,$s=R(()=>{Y();H();se();J();qe();ce();Mo="Contacts",zn=50,Ce=[],Yn="",Jn=!1,Zn=()=>Jn?`${Ce.length}+ contacts`:q(Ce.length,"contact"),fs=()=>Jn?'<div class="more-row"><button type="button" class="btn-ghost btn-sm" data-more>Show more contacts</button></div>':"";Po=()=>Zn(),Uo=()=>`<button type="button" class="btn btn-sm" data-new-contact>${c.plus(14)}<span>New contact</span></button>`});var ws={};te(ws,{mount:()=>Bo,render:()=>Fo,sub:()=>Wo,title:()=>Io});async function Fo(e,{me:t}){if(L=await d.contact(e),!L)return x("That contact no longer exists.","",{tone:"quiet"});let[n,a,o]=await Promise.all([d.opportunities(`contact_id=eq.${e}`),d.activityForContact(e),d.filesFor("contact_id",e)]),i=n.length?await d.quotes(`opportunity_id=in.(${n.map(h=>h.id).join(",")})`):[],r=w("Details",`
    <div class="contact">
      ${M({full_name:L.full_name},40)}
      <div class="contact-body">
        <p class="contact-name">${s(L.full_name)}</p>
        ${L.job_title?`<p class="contact-role">${s(L.job_title)}</p>`:""}
        ${L.companies?`<p class="contact-role">${s(L.companies.name)}${L.companies.town?" \xB7 "+s(L.companies.town):""}</p>`:""}
        <div class="contact-lines">
          ${L.phone?`<a class="lnk" href="${s(ke(L.phone))}">${c.phone(13)}${s(L.phone)}</a>`:""}
          ${L.whatsapp&&L.whatsapp!==L.phone?`<span class="lnk-plain">${c.whatsapp(13)}${s(L.whatsapp)}</span>`:""}
          ${L.email?`<a class="lnk" href="${s(Re(L.email))}">${c.mail(13)}${s(L.email)}</a>`:""}
        </div>
        ${L.preferred_channel?`<p class="contact-pref">Prefers ${s(L.preferred_channel)}</p>`:""}
      </div>
    </div>
    <div class="contact-acts">${Se(L,{text:`Good day ${L.full_name.split(" ")[0]}, Kingson Engineering here.`})}</div>
    ${L.notes?`<p class="scope">${s(L.notes)}</p>`:""}`,{action:`<button type="button" class="btn-ghost btn-xs" data-edit-contact>${c.edit(13)}<span>Edit</span></button>`}),l=w("Enquiries",n.length?`
    <ul class="mini">
      ${n.map(h=>`<li>
        <a href="#/opportunity/${s(h.id)}">
          <span class="mini-main">${s(h.title)} ${He(h)}</span>
          <span class="mini-sub">${s(h.ref)} \xB7 ${s(h.stage_name)}${(()=>{let _=de(h);return _.amount==null?" \xB7 not quoted yet":" \xB7 "+s(U(_.amount,_.currency))})()}</span>
        </a>
        <span class="mini-side">${M(h.owner_name?{full_name:h.owner_name,initials:h.owner_initials}:null,24)}</span>
      </li>`).join("")}
    </ul>`:x("No enquiries recorded.","",{tone:"quiet"}),{tight:!0,note:q(n.length,"enquiry","enquiries"),action:`<button type="button" class="btn-ghost btn-xs" data-new-opp-for>${c.plus(13)}<span>New</span></button>`}),m=w("Quotations",i.length?`
    <ul class="quotes">
      ${i.map(h=>`<li class="quote">
        <a class="quote-btn" href="#/opportunity/${s(h.opportunities?.id||"")}">
          <span class="quote-ref">${s(h.reference)}</span>
          <span class="quote-val num">${s(U(h.amount,h.currency))}</span>
          <span class="quote-status">${ot(h.status)}</span>
          <span class="quote-when">${h.sent_on?"sent "+s(B(h.sent_on)):"not issued"}</span>
        </a>
      </li>`).join("")}
    </ul>`:x("No quotations yet.","",{tone:"quiet"}),{tight:!0});return`
    <a class="back lnk" href="#/contacts">${c.chevron(13)}<span>Back to contacts</span></a>
    <div class="grid grid-opp">
      <div class="col-wide">${w("History",rt(a),{tight:!0,note:q(a.length,"entry","entries")})}</div>
      <div class="col-side">${r}${l}${m}${Ke(o)}</div>
    </div>`}function Bo(e,t,{me:n}){e.addEventListener("click",a=>{if(a.target.closest("[data-edit-contact]"))return Qn({contact:L,onDone:t});if(a.target.closest("[data-new-opp-for]"))return Bn({me:n,contact:L,onDone:t})}),Ye(e,{contact_id:L.id},n,t)}function Wo(){return L?[L.companies?.name,L.job_title].filter(Boolean).map(s).join(" \xB7 "):""}var Io,L,bs=R(()=>{Y();G();H();se();J();qe();St();Io=()=>L?.full_name||"Contact",L=null});var _s={};te(_s,{editOpportunity:()=>Qo});async function Qo({opp:e,me:t,onDone:n}){let a=await d.profiles();z({title:"Edit enquiry",sub:e.ref,width:620,submitLabel:"Save",body:`
      ${u("title","What is the job?",j("title",e.title,"required"),{wide:!0})}
      <div class="field-row">
        ${u("service","Service",N("service",["","Structural steelwork","Roof steelwork and trusses","Fiber laser cutting","Balustrades and gates","Stainless fabrication","Mobile cranage","Other"],e.service||""))}
        ${u("source","Source",N("source",Bt.map(o=>[o,Oe[o]]),e.source))}
      </div>
      ${u("location","Site",j("location",e.location||""),{wide:!0})}
      <div class="field-row">
        ${u("owner_id","Owner",N("owner_id",[["","Unassigned"]].concat(a.map(o=>[o.id,o.full_name])),e.owner_id||""))}
        ${u("priority","Priority",N("priority",Ft.map(o=>[o,Ho(o)]),e.priority))}
      </div>
      ${u("site_visit_required","Site visit",`<label class="check"><input type="checkbox" id="site_visit_required" name="site_visit_required"
           ${e.site_visit_required?"checked":""}> <span>A site visit is needed before this can be priced</span></label>`,{wide:!0})}
      ${u("description","What do they want?",V("description",e.description||"",4),{wide:!0})}`,onSubmit:async o=>{if(!o.title)throw D("title","Give the job a name.");await d.updateOpportunity(e.id,{title:o.title,service:b(o.service),source:o.source,location:b(o.location),owner_id:b(o.owner_id),priority:o.priority,site_visit_required:!!o.site_visit_required,description:b(o.description)}),g("Saved."),Q(n)}})}var Ho,vs=R(()=>{Y();G();H();ce();Ho=e=>e.charAt(0).toUpperCase()+e.slice(1)});var xs={};te(xs,{mount:()=>zo,render:()=>Vo,sub:()=>Ko,title:()=>Go});async function Vo(e,{me:t}){if(p=await d.opportunity(e),!p)return x("That enquiry no longer exists.","It may have been deleted.",{tone:"quiet"});let[n,a,o,i,r,l]=await Promise.all([d.activityFor(e),d.quotesFor(e),d.visitsFor(e),d.tasksFor(e),d.filesFor("opportunity_id",e),d.projectForOpportunity(e)]);mt={activity:n,quotes:a,visits:o,tasks:i,files:r,project:l,me:t};let m=be(p),h=de(p),_=a.find(v=>v.status==="draft"),O=a.some(v=>v.sent_on),C=Le(p),E=m.level==="overdue"||m.level==="unbooked",P={full_name:p.contact_name,phone:p.contact_phone,whatsapp:p.contact_whatsapp,email:p.contact_email},ae=`
  <section class="opp-head${E?" opp-head-alarm":""}">
    <div class="opp-head-top">
      <div class="opp-stage-set">
        <span class="opp-ref num">${s(p.ref)}</span>
        <label class="sr-only" for="opp-stage">Stage</label>
        <select class="sel sel-inline" id="opp-stage" data-stage>
          ${xe.map(v=>`<option value="${s(v.id)}"${v.id===p.stage?" selected":""}>${s(v.name)}</option>`).join("")}
        </select>
        ${Ge(p.priority)}
        ${Qe(p.source)}
      </div>
      <dl class="opp-figs">
        <div><dt>${h.kind==="won"?"Won value":h.kind==="draft"?"Draft quotation":"Quoted"}</dt>
          <dd class="num">${h.amount==null?'<span class="dim">Not quoted yet</span>':s(U(h.amount,h.currency))}</dd></div>
        <div><dt>Enquiry</dt><dd>${s(B(p.created_at))} <span class="dim">(${s(I(p.created_at))})</span></dd></div>
        <div><dt>Last contact</dt><dd>${s(I(p.last_activity_at))}</dd></div>
        <div><dt>Owner</dt><dd class="opp-owner">
          ${M(p.owner_name?{full_name:p.owner_name,initials:p.owner_initials}:null,24)}
          ${s(p.owner_name||"Unassigned")}</dd></div>
      </dl>
    </div>

    <div class="opp-next${E?" is-alarm":""}">
      <span class="opp-next-ic">${E?c.alert(18):c.arrowRight(18)}</span>
      <div class="opp-next-body">
        <p class="opp-next-label">Next action</p>
        ${p.next_action||p.next_action_due?`
          <p class="opp-next-text">${s(p.next_action||"Follow up")}</p>
          <p class="opp-next-meta">
            ${s(p.owner_name||"Unassigned")} \xB7
            ${s(st(p.next_action_due))} \xB7
            <strong>${s(m.level==="held"?"on hold":we(p)?Zt(p.next_action_due):I(p.next_action_due))}</strong>
          </p>
          ${p.stage==="on_hold"&&p.hold_reason?`<p class="opp-next-meta">On hold: ${s(p.hold_reason)}</p>`:""}
          ${p.customer_replied_at?`<p class="opp-next-meta">Customer replied ${s(I(p.customer_replied_at))} \xB7 ${s(le(p.customer_replied_at))}</p>`:""}`:Le(p)?`
          <p class="opp-next-text">Nobody has booked a next action on this enquiry.</p>
          <p class="opp-next-meta">It is open and it is on nobody's list.</p>`:`<p class="opp-next-text">${s(oe[p.stage].name)}${p.decided_at?" on "+s(st(p.decided_at)):""}.</p>
           ${p.lost_reason?`<p class="opp-next-meta">${s(p.lost_reason)}</p>`:""}
           ${p.stage==="won"&&p.won_value!=null?`<p class="opp-next-meta">Accepted value ${s(U(p.won_value,p.currency))}</p>`:""}`}
      </div>
      ${Le(p)?`<button type="button" class="btn btn-sm" data-followup>
        ${c.calendar(14)}<span>${p.next_action_due?"Change":"Book a follow-up"}</span></button>`:""}
    </div>

    ${C?`<div class="opp-acts" role="group" aria-label="Move this job on">
      ${_?`<button type="button" class="btn btn-sm" data-mark-sent="${s(_.id)}">${c.doc(14)}<span>Mark ${s(_.reference)} as sent</span></button>`:`<button type="button" class="btn btn-sm" data-record-quote>${c.doc(14)}<span>${a.length?"Record a revision":"Record quotation"}</span></button>`}
      <button type="button" class="btn-ghost btn-sm" data-log-followup>${c.phone(14)}<span>Log follow-up</span></button>
      ${O?`<button type="button" class="btn-ghost btn-sm" data-replied>${c.note(14)}<span>Customer replied</span></button>`:""}
      <span class="opp-acts-gap" aria-hidden="true"></span>
      <button type="button" class="btn-ghost btn-sm" data-won>${c.check(14)}<span>Won</span></button>
      <button type="button" class="btn-ghost btn-sm" data-lost>${c.cross(14)}<span>Lost</span></button>
      ${p.stage!=="on_hold"?`<button type="button" class="btn-ghost btn-sm" data-hold>${c.clock(14)}<span>On hold</span></button>`:""}
    </div>`:""}
  </section>`,f=p.is_demo?`<p class="demo-strip" role="note">${c.alert(14)}
    <span><strong>Demonstration record.</strong> Not counted in any total or report.</span></p>`:"",Z=w("The job",`
    ${p.description?`<p class="scope">${s(p.description)}</p>`:'<p class="scope dim">No description recorded.</p>'}
    <dl class="kv">
      <div><dt>Service</dt><dd>${s(p.service||"\u2014")}</dd></div>
      <div><dt>Location</dt><dd>${p.location?c.pin(13)+s(p.location):"\u2014"}</dd></div>
      <div><dt>Site visit</dt><dd>${p.site_visit_required?`<span class="warn-inline">${c.alert(13)}Needed</span>`:"Not required"}</dd></div>
      <div><dt>Came in by</dt><dd>${Qe(p.source)}</dd></div>
      ${p.lost_reason?`<div class="kv-wide"><dt>Reason lost</dt><dd>${s(p.lost_reason)}</dd></div>`:""}
    </dl>`,{action:`<button type="button" class="btn-ghost btn-xs" data-edit-opp>${c.edit(13)}<span>Edit</span></button>`}),S=w("Customer",p.contact_name?`
    <p class="co-name">${s(p.company_name||"\u2014")}</p>
    <div class="contact">
      ${M({full_name:p.contact_name},34)}
      <div class="contact-body">
        <p class="contact-name">${s(p.contact_name)}</p>
        <div class="contact-lines">
          ${p.contact_phone?`<a class="lnk" href="${s(ke(p.contact_phone))}">${c.phone(13)}${s(p.contact_phone)}</a>`:""}
          ${p.contact_email?`<a class="lnk" href="${s(Re(p.contact_email))}">${c.mail(13)}${s(p.contact_email)}</a>`:""}
        </div>
      </div>
    </div>
    <div class="contact-acts">${Se(P,{text:`Good day ${p.contact_name.split(" ")[0]}, Kingson Engineering here regarding ${p.title}.`})}</div>
    ${p.contact_id?`<p class="co-also"><a class="lnk" href="#/contact/${s(p.contact_id)}">
      ${c.users(13)}Full history for this contact</a></p>`:""}`:x("No contact on this enquiry.","",{tone:"quiet"}),{tight:!1}),$e=w("Site visits",o.length?`
    <ul class="mini">
      ${o.map(v=>`<li>
        <button type="button" class="mini-btn" data-visit="${s(v.id)}">
          <span class="mini-main">${s(le(v.scheduled_at))}
            <span class="pill pill-${v.status==="completed"?"won":v.status==="cancelled"?"lost":"quiet"}">${s(v.status)}</span></span>
          <span class="mini-sub">${s(v.purpose||"Site visit")}${v.location?" \xB7 "+s(v.location):""}</span>
          ${v.outcome?`<span class="mini-sub">${s(v.outcome)}</span>`:""}
        </button>
        <span class="mini-side">${M(v.profiles,24)}</span>
      </li>`).join("")}
    </ul>`:x("No site visit booked.",p.site_visit_required?"This job cannot be priced properly until somebody has been out.":"",{tone:p.site_visit_required?"quiet":"ok"}),{tight:!0,action:`<button type="button" class="btn-ghost btn-xs" data-new-visit>${c.plus(13)}<span>Book</span></button>`}),Ie=w("Quotations",a.length?`
    <ul class="quotes">
      ${a.map(v=>`<li class="quote">
        <button type="button" class="quote-btn" data-quote="${s(v.id)}">
          <span class="quote-ref">${s(v.reference)}${v.version>1?` <span class="rev">rev ${v.version}</span>`:""}</span>
          <span class="quote-val num">${s(U(v.amount,v.currency))}</span>
          <span class="quote-status">${ot(v.status)}</span>
          <span class="quote-when">${v.sent_at?"sent "+s(le(v.sent_at))+" \xB7 "+s(I(v.sent_at)):v.sent_on?"sent "+s(B(v.sent_on))+" \xB7 "+s(I(v.sent_on)):"not sent yet"}</span>
        </button>
      </li>`).join("")}
    </ul>
    ${zt(p)?`<p class="risk">${c.alert(14)}
      <span><strong>A quotation is out with no chase booked.</strong>
      A quotation nobody is following up is the most expensive thing in this CRM.</span></p>`:""}`:x("Not quoted yet.","The value of this job is the quotation. Record it when it is ready.",{tone:"quiet"}),{tight:!0,action:C?`<button type="button" class="btn-ghost btn-xs" data-record-quote>${c.plus(13)}<span>${a.length?"Revision":"Record"}</span></button>`:""}),At=i.filter(v=>v.status==="open"),hn=w("Tasks",At.length?`
    <ul class="mini">
      ${At.map(v=>`<li>
        <span class="mini-main">${s(v.title)}</span>
        <span class="mini-sub${v.due_date&&new Date(v.due_date)<new Date?" is-late":""}">
          ${s(B(v.due_date))} \xB7 ${s(I(v.due_date))}${v.channel?" \xB7 "+s(v.channel):""}</span>
        <span class="mini-side">
          ${M(v.profiles,24)}
          <button type="button" class="btn-ghost btn-xs" data-done="${s(v.id)}">${c.check(13)}<span>Done</span></button>
        </span>
      </li>`).join("")}
    </ul>`:x("No open tasks.","",{tone:"ok"}),{tight:!0,action:`<button type="button" class="btn-ghost btn-xs" data-new-task>${c.plus(13)}<span>Add</span></button>`}),fn=p.stage!=="won"?"":w("Project",l?`<p class="co-name"><a class="lnk" href="#/project/${s(l.id)}">${s(l.name)}</a></p>
       <p class="co-kind">${it(l.status)}</p>`:`<p class="modal-message">This enquiry is won and has no project yet.</p>
       <button type="button" class="btn btn-sm" data-convert>${c.briefcase(14)}<span>Open a project</span></button>`),Xe=w("Activity",`
    <div class="log-add">
      <button type="button" class="btn-ghost btn-sm" data-log>${c.note(14)}<span>Log a call, message or note</span></button>
    </div>
    ${rt(n)}`,{note:q(n.length,"entry","entries"),tight:!0});return`
    <a class="back lnk" href="#/pipeline">${c.chevron(13)}<span>Back to the pipeline</span></a>
    ${f}
    ${ae}
    <div class="grid grid-opp">
      <div class="col-wide">${Z}${Xe}</div>
      <div class="col-side">${S}${fn}${$e}${Ie}${hn}${Ke(mt.files)}</div>
    </div>`}function zo(e,t,{me:n}){let a=()=>t();e.addEventListener("change",async o=>{let i=o.target.closest("[data-stage]");if(!i)return;let r=i.value;if(r!==p.stage&&!on(r,{opp:p,onDone:a,onCancel:()=>{i.value=p.stage}}))try{await d.setStage(p.id,r),g(`Moved to ${oe[r].name}.`),await a()}catch(l){g(l.message||"That could not be saved.","bad"),i.value=p.stage}}),e.addEventListener("click",async o=>{let i=_=>o.target.closest(_);if(i("[data-followup]"))return Hn({opp:p,me:n,onDone:a});if(i("[data-log]"))return Wn({opportunityId:p.id,contactId:p.contact_id,me:n,onDone:a});if(i("[data-record-quote]"))return Za({opp:p,quotes:mt.quotes,onDone:a});if(i("[data-log-followup]"))return sn({opp:p,onDone:a});if(i("[data-replied]"))return Xa({opp:p,onDone:a});if(i("[data-won]"))return Pn({opp:p,onDone:a});if(i("[data-lost]"))return Un({opp:p,onDone:a});if(i("[data-hold]"))return In({opp:p,onDone:a});let r=i("[data-mark-sent]");if(r)return nn({opp:p,quote:mt.quotes.find(_=>_.id===r.dataset.markSent),onDone:a});if(i("[data-new-visit]"))return pt({opp:p,me:n,onDone:a});if(i("[data-new-task]"))return Et({opp:p,me:n,onDone:a});if(i("[data-convert]"))return Gn({opp:p});let l=i("[data-quote]");if(l)return an({opp:p,quote:mt.quotes.find(_=>_.id===l.dataset.quote),onDone:a});let m=i("[data-visit]");if(m)return pt({opp:p,visit:mt.visits.find(_=>_.id===m.dataset.visit),me:n,onDone:a});let h=i("[data-done]");if(h){try{await d.completeTask(h.dataset.done),g("Task completed."),await a()}catch(_){g(_.message,"bad")}return}if(i("[data-edit-opp]")){let{editOpportunity:_}=await Promise.resolve().then(()=>(vs(),_s));return _({opp:p,me:n,onDone:a})}}),Ye(e,{opportunity_id:p.id},n,a)}function Ko(){return p?`${s(p.company_name||p.contact_name||"")} \xB7 ${s(p.service||oe[p.stage].name)}`:""}var p,mt,Go,ks=R(()=>{Y();G();H();se();J();ce();qe();qt();St();p=null,mt={},Go=()=>p?.title||"Enquiry"});var qs={};te(qs,{mount:()=>Xo,render:()=>Zo,sub:()=>ei,title:()=>Yo});async function ea(e){let t=await d.quotes(Jo(_e),{offset:e,limit:Xn+1});return ht=t.length>Xn,t.slice(0,Xn)}async function Zo(e,{me:t}){return Lt=await d.liveQuotes(),Je=_e==="live"?Lt:await ea(0),_e==="live"&&(ht=!1),ta()}function ta(){let e=Je,t=`
    <div class="filters">
      <label class="sr-only" for="q-filter">Show</label>
      <select class="sel sel-inline" id="q-filter" data-f>
        <option value="live"${_e==="live"?" selected":""}>Awaiting a decision</option>
        <option value="all"${_e==="all"?" selected":""}>All quotations</option>
        ${xa.map(o=>`<option value="${o}"${_e===o?" selected":""}>${s(Wt[o])}</option>`).join("")}
      </select>
      <span class="filters-n">${ht?`${e.length}+ quotations`:s(q(e.length,"quotation"))}${ht?"":` \xB7 <span class="num">${s(Ss(e))}</span>`}</span>
    </div>`,n=e.length?fe(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Reference</th><th scope="col">Enquiry</th>
        <th scope="col" class="ta-r">Amount</th><th scope="col">Status</th>
        <th scope="col">Sent</th><th scope="col">Chase</th><th scope="col"></th>
      </tr></thead>
      <tbody>
        ${e.map(o=>{let i=o.opportunities,r=o.status==="sent"||o.status==="discussed",l=r&&i&&!i.next_action_due;return`<tr${l?' class="tr-risk"':""}>
            <td><span class="td-main num">${s(o.reference)}</span>${o.version>1?`<span class="td-sub">revision ${o.version}</span>`:""}</td>
            <td><a class="lnk" href="#/opportunity/${s(i?.id||"")}">${s(i?.title||"\u2014")}</a>
                <span class="td-sub">${s(i?.companies?.name||"")}</span></td>
            <td class="ta-r num">${s(U(o.amount,o.currency))}</td>
            <td>${ot(o.status)}</td>
            <td><span class="td-main num">${s(o.sent_at?le(o.sent_at):B(o.sent_on))}</span><span class="td-sub">${o.sent_on?s(I(o.sent_on))+(o.profiles?.initials?" \xB7 "+s(o.profiles.initials):""):""}</span></td>
            <td>${l?`<span class="pill pill-overdue">${c.alert(13)}No chase booked</span>`:r?`<span class="pill pill-quiet">${s(B(i?.next_action_due))}</span>`:'<span class="dim">\u2014</span>'}</td>
            <td class="ta-r">${o.status==="draft"?`<button type="button" class="btn-ghost btn-xs" data-send="${s(o.id)}">${c.doc(13)}<span>Mark sent</span></button>`:""}
              <button type="button" class="btn-ghost btn-xs" data-edit="${s(o.id)}">${c.edit(13)}<span>Details</span></button></td>
          </tr>`}).join("")}
      </tbody>
    </table>`):x(_e==="live"?"No quotations are out.":"Nothing matches that filter.",_e==="live"?"Everything issued has been decided.":"",{tone:"ok"});return t+w("",n+(ht?'<div class="more-row"><button type="button" class="btn-ghost btn-sm" data-more>Show more quotations</button></div>':""),{tight:!0})}function Xo(e,t,{me:n}){e.addEventListener("change",async a=>{if(a.target.closest("[data-f]")){_e=a.target.value;try{Je=_e==="live"?Lt:await ea(0),_e==="live"&&(ht=!1),e.innerHTML=ta(),e.querySelector("[data-f]")?.focus()}catch(o){g(o.message||"Those quotations could not be loaded.","bad")}}}),e.addEventListener("click",async a=>{let o=a.target.closest("[data-more]");if(o){o.disabled=!0;try{Je=Je.concat(await ea(Je.length)),e.innerHTML=ta()}catch(m){o.disabled=!1,g(m.message||"Could not load more.","bad")}return}let i=a.target.closest("[data-edit], [data-send]");if(!i)return;let r=Je.find(m=>m.id===(i.dataset.edit||i.dataset.send));if(!r)return;let l=await d.opportunity(r.opportunity_id);i.dataset.send?nn({opp:l,quote:r,onDone:t}):an({opp:l,quote:r,onDone:t})})}function ei(){return`${s(q(Lt.length,"quotation"))} awaiting a decision \xB7 <span class="num">${s(Ss(Lt))}</span>`}var Ss,Yo,Xn,Je,Lt,_e,ht,Jo,Ts=R(()=>{Y();G();H();se();J();qt();ce();Ss=e=>{let t={};for(let n of e)t[n.currency]=(t[n.currency]||0)+Number(n.amount||0);return re(t,{empty:"\u2014"})},Yo="Quotations",Xn=100,Je=[],Lt=[],_e="live",ht=!1,Jo=e=>e==="all"?"":e==="live"?"status=in.(sent,discussed)":`status=eq.${e}`});var Es={};te(Es,{mount:()=>ai,render:()=>ni,sub:()=>si,title:()=>ti});async function ni(e,{me:t}){ft=await d.visits();let n=ft.filter(i=>i.status==="scheduled"&&A(i.scheduled_at)>=0).sort((i,r)=>new Date(i.scheduled_at)-new Date(r.scheduled_at)),a=ft.filter(i=>i.status==="scheduled"&&A(i.scheduled_at)<0).sort((i,r)=>new Date(r.scheduled_at)-new Date(i.scheduled_at)),o=ft.filter(i=>i.status!=="scheduled").sort((i,r)=>new Date(r.scheduled_at)-new Date(i.scheduled_at)).slice(0,30);return`
    ${na("Booked",n,"Scheduled and still to happen.")}
    ${a.length?na("Past their date and still open",a,"These were booked and never closed off. Either it happened and needs writing up, or it did not.",!0):""}
    ${na("Completed and cancelled",o,"The last thirty.")}`}function na(e,t,n,a=!1){return t.length?w(e,`
    <ul class="fu-list">
      ${t.map(o=>{let i=o.status==="scheduled"&&A(o.scheduled_at)<0;return`
        <li class="fu">
          <span class="fu-when">
            <span class="fu-date num">${s(le(o.scheduled_at))}</span>
            <span class="fu-rel${i?" is-late":""}">${s(I(o.scheduled_at))}</span>
          </span>
          <div class="fu-main">
            <span class="fu-title">${s(o.opportunities?.title||"Site visit")}</span>
            <span class="fu-sub">${s(o.opportunities?.companies?.name||"")}${o.location?" \xB7 "+c.pin(12)+s(o.location):""}</span>
            <span class="fu-action">${s(o.purpose||"")}</span>
            ${o.outcome?`<span class="fu-action">${c.check(12)}${s(o.outcome)}</span>`:""}
          </div>
          <span class="fu-stage"><span class="pill pill-${o.status==="completed"?"won":o.status==="cancelled"?"lost":i?"overdue":"quiet"}">${s(o.status)}</span></span>
          <span class="fu-owner">${M(o.profiles,26)}</span>
          <span class="fu-do">
            ${o.opportunities?`<a class="btn-ghost btn-xs" href="#/opportunity/${s(o.opportunities.id)}">${c.arrowRight(13)}<span>Open</span></a>`:""}
            <button type="button" class="btn-ghost btn-xs" data-visit="${s(o.id)}">${c.edit(13)}<span>Edit</span></button>
          </span>
        </li>`}).join("")}
    </ul>`,{note:n,tight:!0}):w(e,x("Nothing here.","",{tone:"ok"}),{note:n,tight:!0})}function ai(e,t,{me:n}){e.addEventListener("click",async a=>{let o=a.target.closest("[data-visit]");if(!o)return;let i=ft.find(l=>l.id===o.dataset.visit);if(!i)return;let r=await d.opportunity(i.opportunity_id);pt({opp:r,visit:i,me:n,onDone:t})})}function si(){let e=ft.filter(t=>t.status==="scheduled"&&A(t.scheduled_at)>=0).length;return`${s(q(e,"visit"))} booked`}var ti,ft,Ls=R(()=>{Y();G();H();se();J();qe();ti="Site visits",ft=[]});var Cs={};te(Cs,{render:()=>ii,sub:()=>ri,title:()=>oi});async function ii(){if(Dt=await d.projects(),!Dt.length)return w("",x("No projects yet.","When an enquiry is marked won, open a project from it and it appears here.",{tone:"quiet"}),{tight:!0});let e=Dt.filter(n=>["planning","in_progress","on_hold"].includes(n.status)),t=Dt.filter(n=>!["planning","in_progress","on_hold"].includes(n.status));return Ds("Active",e)+Ds("Finished",t)}function Ds(e,t){return t.length?w(e,fe(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Project</th><th scope="col">Client</th>
        <th scope="col" class="ta-r">Value</th><th scope="col">Status</th>
        <th scope="col">Target</th><th scope="col">Responsible</th>
      </tr></thead>
      <tbody>
        ${t.map(n=>{let a=n.target_date&&A(n.target_date)<0&&n.status!=="complete";return`<tr${a?' class="tr-risk"':""}>
            <td><a class="lnk lnk-strong" href="#/project/${s(n.id)}">${s(n.name)}</a>
                ${n.opportunities?`<span class="td-sub">from ${s(n.opportunities.ref)}</span>`:""}</td>
            <td>${s(n.companies?.name||n.contacts?.full_name||"\u2014")}</td>
            <td class="ta-r num">${s(U(n.value,n.currency))}</td>
            <td>${it(n.status)}</td>
            <td><span class="td-main num">${s(B(n.target_date))}</span>
                <span class="td-sub${a?" is-late":""}">${n.target_date?s(I(n.target_date)):""}</span></td>
            <td>${M(n.profiles,24)}</td>
          </tr>`}).join("")}
      </tbody>
    </table>`),{tight:!0,note:`${q(t.length,"project")} \xB7 ${U(qn(t,n=>n.value))}`}):w(e,x("Nothing here.","",{tone:"quiet"}),{tight:!0})}function ri(){let e=Dt.filter(t=>["planning","in_progress","on_hold"].includes(t.status));return`${s(q(e.length,"active project"))} \xB7 <span class="num">${s(U(qn(e,t=>t.value)))}</span>`}var oi,Dt,As=R(()=>{Y();G();H();se();J();oi="Projects",Dt=[]});var Ns={};te(Ns,{mount:()=>di,render:()=>ci,sub:()=>ui,title:()=>li});async function ci(e,{me:t}){if(k=await d.project(e),!k)return x("That project no longer exists.","",{tone:"quiet"});let[n,a]=await Promise.all([d.activityForProject(e),d.filesFor("project_id",e)]),i=`
    <section class="opp-head${k.target_date&&A(k.target_date)<0&&k.status!=="complete"?" opp-head-alarm":""}">
      <div class="opp-head-top">
        <div class="opp-stage-set">
          ${it(k.status)}
          ${k.opportunities?`<a class="lnk" href="#/opportunity/${s(k.opportunities.id)}">from ${s(k.opportunities.ref)}</a>`:""}
        </div>
        <dl class="opp-figs">
          <div><dt>Value</dt><dd class="num">${s(U(k.value,k.currency))}</dd></div>
          <div><dt>Start</dt><dd>${s(B(k.start_date))}</dd></div>
          <div><dt>Target</dt><dd>${s(B(k.target_date))}
            ${k.target_date?`<span class="dim">(${s(I(k.target_date))})</span>`:""}</dd></div>
          <div><dt>Responsible</dt><dd class="opp-owner">${M(k.profiles,24)}${s(k.profiles?.full_name||"Unassigned")}</dd></div>
        </dl>
      </div>
    </section>`,r=w("The job",`
    ${k.description?`<p class="scope">${s(k.description)}</p>`:'<p class="scope dim">No description.</p>'}
    ${k.notes?`<dl class="kv"><div class="kv-wide"><dt>Notes</dt><dd>${s(k.notes)}</dd></div></dl>`:""}`,{action:`<button type="button" class="btn-ghost btn-xs" data-edit-project>${c.edit(13)}<span>Edit</span></button>`}),l=w("Client",`
    <p class="co-name">${s(k.companies?.name||"\u2014")}</p>
    ${k.contacts?`
      <div class="contact">
        ${M({full_name:k.contacts.full_name},34)}
        <div class="contact-body">
          <p class="contact-name"><a class="lnk" href="#/contact/${s(k.contacts.id)}">${s(k.contacts.full_name)}</a></p>
          <div class="contact-lines">
            ${k.contacts.phone?`<a class="lnk" href="${s(ke(k.contacts.phone))}">${c.phone(13)}${s(k.contacts.phone)}</a>`:""}
            ${k.contacts.email?`<a class="lnk" href="${s(Re(k.contacts.email))}">${c.mail(13)}${s(k.contacts.email)}</a>`:""}
          </div>
        </div>
      </div>
      <div class="contact-acts">${Se(k.contacts,{text:`Good day, Kingson Engineering here regarding ${k.name}.`})}</div>`:'<p class="dim">No contact linked.</p>'}`);return`
    <a class="back lnk" href="#/projects">${c.chevron(13)}<span>Back to projects</span></a>
    ${i}
    <div class="grid grid-opp">
      <div class="col-wide">${r}${w("Activity",rt(n),{tight:!0,note:q(n.length,"entry","entries")})}</div>
      <div class="col-side">${l}${Ke(a)}</div>
    </div>`}function di(e,t,{me:n}){e.addEventListener("click",a=>{if(a.target.closest("[data-edit-project]"))return Vn({project:k,me:n,onDone:t})}),Ye(e,{project_id:k.id},n,t)}function ui(){return k?[k.companies?.name,tt[k.status]].filter(Boolean).map(s).join(" \xB7 "):""}var li,k,Os=R(()=>{Y();G();H();se();J();qe();St();li=()=>k?.name||"Project",k=null});var Rs={};te(Rs,{mount:()=>xi,render:()=>$i,sub:()=>ki,title:()=>gi});function yi(e){let t=e.mail_checked_at?` Checked ${le(e.mail_checked_at)}.`:"";return e.mail_status?.startsWith("configured:")?{ok:!0,tone:"status-ok",text:`Email provider set up (${e.mail_status.slice(11)}).${t}`}:e.mail_status==="not_configured"?{ok:!1,tone:"status-off",text:`No email provider is set up, so the CRM cannot send email.${t}`}:{ok:!1,tone:"status-bad",text:"Not checked yet. The notification service has not run."}}async function $i(e,{me:t}){pe=await d.settings().catch(()=>null);let n=wi(t)+bi(t);if(t?.role!=="admin")return`${js()}${n}`;let a;[aa,pn,a]=await Promise.all([d.profiles(),d.enquiries(60),d.outbox(20).catch(()=>null)]);let o=w("People",fe(`
    <table class="tbl tbl-rows">
      <thead><tr><th scope="col">Name</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col"></th></tr></thead>
      <tbody>
        ${aa.map(l=>`<tr>
          <td><span class="lnk-strong">${M(l,24)}<span>${s(l.full_name)}</span></span></td>
          <td>
            <label class="sr-only" for="r-${s(l.id)}">Role for ${s(l.full_name)}</label>
            <select class="sel sel-inline" id="r-${s(l.id)}" data-role="${s(l.id)}"${l.id===t.id?' disabled title="You cannot change your own role"':""}>
              <option value="staff"${l.role==="staff"?" selected":""}>Staff</option>
              <option value="admin"${l.role==="admin"?" selected":""}>Administrator</option>
            </select>
          </td>
          <td>${l.active?'<span class="pill pill-won">Active</span>':'<span class="pill pill-lost">Deactivated</span>'}</td>
          <td class="ta-r">${l.id===t.id?'<span class="dim">you</span>':`<button type="button" class="btn-ghost btn-xs" data-active="${s(l.id)}" data-to="${l.active?"false":"true"}">
                 ${l.active?"Deactivate":"Reactivate"}</button>`}</td>
        </tr>`).join("")}
      </tbody>
    </table>`),{tight:!0,note:"Staff handle the enquiries. Administrators can also change roles, deactivate people and set how email is sent."}),i=w("Adding somebody",`
    <p class="scope">New accounts are created in the Supabase dashboard under
      <strong>Authentication \u2192 Users</strong>. A profile row appears here automatically the
      moment the account is created, as Staff. Change the role above if they need it.</p>
    <p class="scope">Deactivating somebody keeps everything they did \u2014 their calls, their
      quotations, their site visits \u2014 and stops them signing in. Deleting the account would
      take the history with it, which is why this screen does not offer it.</p>`),r=w("Website enquiry log",pn.length?fe(`
    <table class="tbl tbl-rows">
      <thead><tr>
        <th scope="col">Received</th><th scope="col">From</th><th scope="col">Contact</th>
        <th scope="col">Needs</th><th scope="col">Became</th>
      </tr></thead>
      <tbody>
        ${pn.map(l=>`<tr${l.spam?' class="is-done"':""}>
          <td><span class="td-main num">${s(le(l.created_at))}</span></td>
          <td><span class="td-main">${s(l.name)}</span><span class="td-sub">${s(l.company||"")}</span></td>
          <td><span class="td-sub">${s(l.contact)}</span></td>
          <td><span class="td-sub">${s(l.service||"\u2014")}${l.location?" \xB7 "+s(l.location):""}</span></td>
          <td>${l.spam?'<span class="pill pill-lost">Blocked as spam</span>':l.opportunity_id?`<a class="lnk" href="#/opportunity/${s(l.opportunity_id)}">enquiry</a>`:'<span class="pill pill-overdue">not converted</span>'}</td>
        </tr>`).join("")}
      </tbody>
    </table>`):x("No website enquiries yet.","Everything submitted on the website form lands here and in Enquiries.",{tone:"quiet"}),{tight:!0,note:`${q(pn.length,"submission")} \xB7 the last sixty`});return`${js()}${n}${_i(a)}${o}${i}${r}`}function wi(e){if(!pe)return w("Working rules",x("The settings could not be read.","",{tone:"quiet"}));let t=e?.role==="admin",n=(pe.working_weekdays||[]).map(a=>pi[a]).join(", ");return w("Working rules",`
    <div class="settings-grid">
      <div class="field">
        <label for="fu-days">Follow up a sent quotation after</label>
        <select class="sel" id="fu-days" data-fu-days ${t?"":"disabled"}>
          ${[1,2,3,4,5,7,10].map(a=>`<option value="${a}"${a===pe.quote_followup_working_days?" selected":""}>${a} working day${a===1?"":"s"}</option>`).join("")}
        </select>
        <p class="field-hint">Working days: ${s(n)}. Applied when a quotation is marked sent.</p>
      </div>
    </div>
    <p class="field-hint">Customer replies are recorded by hand with \u201CCustomer replied\u201D. The CRM cannot
      see any inbox, and does not claim to.</p>`,{note:t?"Administrators can change these":"Set by an administrator"})}function bi(e){if(!pe)return"";if(!("mail_status"in pe))return w("Email notifications",x("Waiting for the database update.","Notifications need the 2026-09-25 migrations. Until then nothing is sent.",{tone:"quiet"}));let t=e?.role==="admin",n=t?"":"disabled",a=yi(pe),o=pe.email_mode,i=(l,m)=>`<label class="check"><input type="checkbox" data-set="${l}" data-type="bool"
      ${pe[l]?"checked":""} ${n}><span>${s(m)}</span></label>`,r=(l,m,h)=>`<div class="field">
      <label for="${m}">${s(h)}</label>
      <input class="inp" id="${m}" type="text" inputmode="email" data-set="${l}" data-type="emails"
        value="${s((pe[l]||[]).join(", "))}" placeholder="Every active administrator" ${n}>
      <p class="field-hint">Separate addresses with commas. Left blank, it goes to every active administrator.</p>
    </div>`;return w("Email notifications",`
    <p class="status-line ${a.tone}"><span class="status-dot" aria-hidden="true"></span><span>${s(a.text)}</span></p>
    <div class="settings-grid">
      <div class="field">
        <label for="mail-mode">Sending</label>
        <select class="sel" id="mail-mode" data-set="email_mode" ${n}>
          <option value="manual"${o==="manual"?" selected":""}>Off</option>
          <option value="test"${o==="test"?" selected":""}>Test mailbox only</option>
          <option value="live"${o==="live"?" selected":""}${a.ok||o==="live"?"":" disabled"}>Live${a.ok?"":" (needs an email provider)"}</option>
        </select>
        <p class="field-hint">${s(mi[o]||"")}</p>
      </div>
      <div class="field">
        <label for="test-box">Test mailbox</label>
        <input class="inp" id="test-box" type="email" data-set="test_mailbox" data-type="email"
          value="${s(pe.test_mailbox||"")}" placeholder="A mailbox you control" ${n}>
        <p class="field-hint">Used only in test mode. Never a customer.</p>
      </div>
      ${r("alert_recipients","alert-to","New enquiry alerts go to")}
      ${r("digest_recipients","digest-to","The full morning digest goes to")}
      <div class="field">
        <label for="digest-hour">Morning digest at</label>
        <select class="sel" id="digest-hour" data-set="digest_hour" data-type="int" ${n}>
          ${[5,6,7,8,9,10,11].map(l=>`<option value="${l}"${l===pe.digest_hour?" selected":""}>${String(l).padStart(2,"0")}:00 Harare time</option>`).join("")}
        </select>
        <p class="field-hint">Working days only. Each owner also gets their own items.</p>
      </div>
      <div class="field">
        <label for="crm-url">CRM address in emails</label>
        <input class="inp" id="crm-url" type="url" data-set="crm_url" data-type="url"
          value="${s(pe.crm_url||"")}" placeholder="https://kingson-engineering.vercel.app/crm/" ${n}>
        <p class="field-hint">Links in alerts and the digest open this address.</p>
      </div>
    </div>
    <div class="check-list">
      ${i("notify_new_enquiry","Email the office when a website enquiry arrives")}
      ${i("send_acknowledgement","Send the customer one acknowledgement with their reference (website enquiries with an email address)")}
      ${i("digest_enabled","Send the morning digest of overdue and due-today follow-ups")}
    </div>
    <p class="field-hint">The CRM never chases a customer by itself. Follow-ups to customers are written and sent by a person.</p>`,{note:t?"Administrators can change these":"Set by an administrator"})}function _i(e){return e?w("Sent and waiting email",e.length?fe(`
    <table class="tbl tbl-rows">
      <thead><tr><th scope="col">Queued</th><th scope="col">What</th><th scope="col">To</th><th scope="col">Status</th></tr></thead>
      <tbody>
        ${e.map(t=>`<tr>
          <td><span class="td-main num">${s(le(t.created_at))}</span></td>
          <td><span class="td-main">${s(hi[t.kind]||t.kind)}</span>${t.opportunity_id?`<a class="td-sub lnk" href="#/opportunity/${s(t.opportunity_id)}">open the enquiry</a>`:""}</td>
          <td><span class="td-sub">${s(t.recipient||"\u2014")}</span></td>
          <td><span class="pill ${fi[t.status]||""}">${s(t.status)}</span>${t.last_error?`<span class="td-sub">${s(t.last_error)}</span>`:""}</td>
        </tr>`).join("")}
      </tbody>
    </table>`):x("Nothing queued yet.","Office alerts, acknowledgements and digests appear here.",{tone:"quiet"}),{tight:!0,note:"The last twenty"}):""}function vi(e){if(e.closest("[data-fu-days]"))return{quote_followup_working_days:Number(e.value)};let t=e.dataset?.set;if(!t)return null;let n=e.value.trim();switch(e.dataset.type){case"bool":return{[t]:e.checked};case"int":return{[t]:Number(n)};case"email":if(n&&!Ms.test(n))throw new Error("That email address does not look right.");return{[t]:n||null};case"emails":{let a=n.split(/[\s,;]+/).filter(Boolean).map(i=>i.toLowerCase()),o=a.find(i=>!Ms.test(i));if(o)throw new Error(`\u201C${o}\u201D is not an email address.`);return{[t]:[...new Set(a)]}}case"url":if(n&&!/^https:\/\/\S+$/.test(n))throw new Error("Use the full https:// address.");return{[t]:n||null};default:return{[t]:n}}}function xi(e,t,{me:n}){e.addEventListener("change",async a=>{if(a.target.closest("[data-demo]")){Aa(a.target.checked),location.reload();return}let o;try{o=vi(a.target)}catch(i){g(i.message,"bad");return}if(o)try{await d.updateSettings({...o,updated_by:n?.id||null,updated_at:new Date().toISOString()}),g("Saved."),await t()}catch(i){g(i.message||"That could not be saved.","bad"),await t()}}),e.addEventListener("change",async a=>{let o=a.target.closest("[data-role]");if(o)try{await y.update("profiles",F("id",o.dataset.role),{role:o.value}),g("Role updated."),await t()}catch(i){g(i.message||"That could not be changed.","bad"),await t()}}),e.addEventListener("click",async a=>{let o=a.target.closest("[data-active]");if(o)try{await y.update("profiles",F("id",o.dataset.active),{active:o.dataset.to==="true"}),g(o.dataset.to==="true"?"Reactivated.":"Deactivated."),await t()}catch(i){g(i.message||"That could not be changed.","bad")}})}function ki(){return`${s(q(aa.length,"person","people"))}`}var pi,mi,hi,fi,Ms,gi,aa,pn,pe,js,Ps=R(()=>{Y();H();se();J();ce();Yt();pi=["","Mon","Tue","Wed","Thu","Fri","Sat","Sun"],mi={manual:"Off. The CRM sends no email. Alerts and acknowledgements are recorded in the outbox as not sent.",test:"Test. Every email the CRM would send goes to the test mailbox below, and nowhere else.",live:"Live. Office alerts, the morning digest and website acknowledgements go to their real recipients."},hi={new_enquiry:"Office alert",acknowledgement:"Acknowledgement",digest:"Morning digest"},fi={sent:"pill-won",failed:"pill-lost",skipped:"pill-overdue",pending:"",sending:""},Ms=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;gi="Settings",aa=[],pn=[],pe=null,js=()=>w("Demonstration records",`
  <p class="scope">Sample jobs and test submissions are flagged as demonstration data. They are
    left out of every list, count and total unless you switch them on here \u2014 and then only in
    this browser, with a warning strip across the top of every screen.</p>
  <label class="check"><input type="checkbox" data-demo ${De()?"checked":""}>
    <span>Show demonstration records in this browser</span></label>`)});var Us={};te(Us,{mount:()=>Ti,render:()=>qi,title:()=>Si});async function qi(e,{me:t}){return w("Signed in as",`
      <p class="scope"><strong>${s(t?.full_name||"")}</strong> \xB7 ${s(Ln())}
        \xB7 ${t?.role==="admin"?"Administrator":"Staff"}</p>
      <p class="field-hint">To change the email you sign in with, ask an administrator.</p>`)+w("Change password",`
      <form class="settings-grid" data-pw-form novalidate>
        ${u("pw-current","Current password",sa("pw-current","current-password"))}
        ${u("pw-new","New password",sa("pw-new","new-password"),{hint:"At least 8 characters."})}
        ${u("pw-again","New password again",sa("pw-again","new-password"))}
        <div class="field"><button type="submit" class="btn">Change password</button></div>
      </form>`,{note:"Other devices stay signed in until their session ends"})}function Ti(e){let t=e.querySelector("[data-pw-form]");t.addEventListener("submit",async n=>{n.preventDefault(),Mn(t);let a=Object.fromEntries(new FormData(t));if(!a["pw-current"])return ze(t,"pw-current","Enter your current password.");if(a["pw-new"].length<8)return ze(t,"pw-new","Use at least 8 characters.");if(a["pw-new"]!==a["pw-again"])return ze(t,"pw-again","The two new passwords do not match.");if(a["pw-new"]===a["pw-current"])return ze(t,"pw-new","Choose a password you have not used here.");let o=t.querySelector('[type="submit"]');o.disabled=!0;try{await Ca(a["pw-current"],a["pw-new"]),t.reset(),g("Password changed. Use the new one next time you sign in.")}catch(i){i.field?ze(t,i.field,i.message):g(i.message||"The password could not be changed.","bad")}finally{o.disabled=!1}})}var Si,sa,Is=R(()=>{Kt();se();ce();H();Si="My account",sa=(e,t)=>`<input class="inp" id="${e}" name="${e}" type="password" autocomplete="${t}" required>`});var ia={};te(ia,{openSearch:()=>Li});function Li(e=""){if(me){me.querySelector("input").focus();return}let t=document.activeElement;me=document.createElement("div"),me.className="modal search-modal",me.innerHTML=`
    <div class="modal-card search-card" role="dialog" aria-modal="true" aria-label="Search">
      <div class="search-bar">
        ${c.search(17)}
        <label class="sr-only" for="gs-q">Search</label>
        <input class="search-input" id="gs-q" type="search" autocomplete="off" spellcheck="false"
               placeholder="Name, company, phone, email, ENQ-\u2026 or Q-\u2026" value="${s(e)}"
               role="combobox" aria-expanded="false" aria-controls="gs-results" aria-autocomplete="list">
        <button type="button" class="btn-ghost btn-xs" data-close>Close</button>
      </div>
      <div class="search-results" id="gs-results" role="listbox" aria-label="Results">
        <p class="search-hint">Type at least two characters. Phone numbers match however they are written.</p>
      </div>
    </div>`,document.body.appendChild(me),document.body.classList.add("is-modal");let n=me.querySelector("input"),a=me.querySelector("#gs-results"),o=0,i=0,r=-1,l=()=>{me.remove(),me=null,document.body.classList.remove("is-modal"),document.removeEventListener("keydown",O,!0),t&&document.contains(t)&&t.focus()},m=()=>[...a.querySelectorAll(".search-hit")],h=C=>{let E=m();E.length&&(r=(C+E.length)%E.length,E.forEach((P,ae)=>P.setAttribute("aria-selected",String(ae===r))),E[r].scrollIntoView({block:"nearest"}),n.setAttribute("aria-activedescendant",E[r].id))};async function _(){let C=n.value.trim(),E=++i;if(r=-1,C.length<2){a.innerHTML='<p class="search-hint">Type at least two characters. Phone numbers match however they are written.</p>',n.setAttribute("aria-expanded","false");return}a.innerHTML='<p class="search-hint">Searching\u2026</p>';try{let P=await d.search(C,8);if(E!==i)return;if(!P.length){a.innerHTML=`<p class="search-hint">Nothing matches \u201C${s(C)}\u201D.
          Check the spelling, or search by phone number or reference.</p>`;return}let ae=0;a.innerHTML=Ei.map(f=>{let Z=P.filter(S=>S.kind===f).sort((S,$e)=>S.rank-$e.rank);return Z.length?`<p class="search-group">${s(oa[f].label)}${Z.length>1?"s":""}</p>`+Z.map(S=>`
            <a class="search-hit" id="gs-${ae++}" role="option" aria-selected="false" href="${s(oa[f].href(S))}">
              <span class="search-kind search-kind-${s(f)}">${s(oa[f].label)}</span>
              <span class="search-main">
                <span class="search-title">${S.ref&&f==="enquiry"?`<span class="num">${s(S.ref)}</span> \xB7 `:""}${s(S.title||"")}</span>
                <span class="search-sub">${s(S.subtitle||"")}${S.stage&&oe[S.stage]?` \xB7 ${s(oe[S.stage].short)}`:""}</span>
              </span>
            </a>`).join(""):""}).join(""),n.setAttribute("aria-expanded","true"),h(0)}catch(P){if(E!==i)return;a.innerHTML=`<p class="search-hint search-bad">${s(P?.message||"Search failed.")}</p>`}}function O(C){if(C.key==="Escape"){C.preventDefault(),l();return}if(C.key==="ArrowDown"){C.preventDefault(),h(r+1);return}if(C.key==="ArrowUp"){C.preventDefault(),h(r-1);return}if(C.key==="Enter"&&document.activeElement===n){let E=m()[r];E&&(C.preventDefault(),location.hash=E.getAttribute("href"),l())}}n.addEventListener("input",()=>{clearTimeout(o),o=setTimeout(_,180)}),a.addEventListener("click",C=>{C.target.closest(".search-hit")&&l()}),me.querySelector("[data-close]").addEventListener("click",l),me.addEventListener("mousedown",C=>{C.target===me&&l()}),document.addEventListener("keydown",O,!0),n.focus(),e&&_()}var oa,Ei,me,ra=R(()=>{Y();G();H();J();oa={contact:{label:"Contact",href:e=>`#/contact/${e.id}`},enquiry:{label:"Enquiry",href:e=>`#/opportunity/${e.id}`},quote:{label:"Quote",href:e=>`#/opportunity/${e.id}`},project:{label:"Project",href:e=>`#/project/${e.id}`}},Ei=["enquiry","quote","contact","project"],me=null});Kt();Y();G();Yt();H();J();var so=[{key:"dashboard",href:"#/",label:"Dashboard",ic:"dashboard"},{key:"pipeline",href:"#/pipeline",label:"Enquiries",ic:"pipeline"},{key:"followups",href:"#/followups",label:"Follow-ups",ic:"bell",badge:!0},{key:"tasks",href:"#/tasks",label:"Tasks",ic:"task"},{key:"contacts",href:"#/contacts",label:"Contacts",ic:"users"},{key:"quotes",href:"#/quotes",label:"Quotations",ic:"doc"},{key:"visits",href:"#/visits",label:"Site visits",ic:"pin"},{key:"projects",href:"#/projects",label:"Projects",ic:"briefcase"},{key:"settings",href:"#/settings",label:"Settings",ic:"shield"}];function An(e,t,{overdue:n=0}={}){return`
  <div class="rail-top">
    <a class="mark" href="#/">
      <span class="mark-name display">KINGSON</span>
      <span class="mark-sub">Enquiries &amp; Projects</span>
    </a>
  </div>

  <nav class="rail-nav" aria-label="Sections">${so.filter(o=>!o.admin||t?.role==="admin").map(o=>`
      <a class="rail-link${e===o.key?" is-active":""}" href="${o.href}"
         ${e===o.key?'aria-current="page"':""}>
        ${c[o.ic](17)}<span>${s(o.label)}</span>
        ${o.badge&&n?`<span class="rail-count" title="${s(n)} overdue">${s(n)}</span>`:""}
      </a>`).join("")}</nav>

  <div class="rail-foot">
    <div class="rail-me">
      <span class="avatar" style="--s:30px">${s(t?.initials||"?")}</span>
      <span class="rail-me-body">
        <span class="rail-me-name">${s(t?.full_name||"")}</span>
        <span class="rail-me-role">${s(t?.role==="admin"?"Administrator":"Staff")}</span>
      </span>
    </div>
    <a class="rail-signout" href="#/account">${c.shield(14)}<span>My account</span></a>
    <button type="button" class="rail-signout" data-signout>${c.logout(14)}<span>Sign out</span></button>
  </div>`}var Xt=(e,t="",n="")=>`
  <div class="topbar-in">
    <button type="button" class="topbar-menu" data-rail-open aria-expanded="false" aria-controls="rail">
      ${c.menu(18)}<span class="sr-only">Open navigation</span>
    </button>
    <div class="topbar-titles">
      <h1 class="topbar-title display">${s(e)}</h1>
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
  </div>`,Pa=(e="")=>`
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

      <p class="signin-err" role="alert" ${e?"":"hidden"}>${s(e)}</p>
      <button type="submit" class="btn" data-signin>Sign in</button>
      <button type="button" class="signin-link" data-forgot>Forgot your password?</button>
      <p class="signin-foot">Kingson Engineering internal system. Access is by account only.</p>
    </form>
  </div>`,Ua=(e="")=>`
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
               inputmode="email" autocapitalize="none" spellcheck="false" value="${s(e)}" required>
      </div>
      <p class="signin-err" role="alert" hidden></p>
      <p class="signin-ok" role="status" hidden></p>
      <button type="submit" class="btn" data-send>Send the link</button>
      <button type="button" class="signin-link" data-back>Back to sign in</button>
    </form>
  </div>`,Nn=({error:e=""}={})=>`
  <div class="signin">
    <form class="signin-card" id="reset-form" novalidate>
      <p class="signin-mark display">KINGSON</p>
      <p class="signin-sub">Enquiries &amp; Projects</p>
      <h1 class="signin-title">${e?"That link has not worked":"Choose a new password"}</h1>
      ${e?`<p class="signin-note">${s(e)}</p>
        <button type="button" class="btn" data-forgot>Send a new link</button>
        <button type="button" class="signin-link" data-back>Back to sign in</button>`:`
      <div class="field">
        <label for="np-1">New password</label>
        <input class="inp" id="np-1" type="password" autocomplete="new-password" minlength="8" required>
        <p class="field-hint">At least 8 characters. A short sentence is easier to remember than a code.</p>
      </div>
      <div class="field">
        <label for="np-2">The same again</label>
        <input class="inp" id="np-2" type="password" autocomplete="new-password" required>
      </div>
      <p class="signin-err" role="alert" hidden></p>
      <button type="submit" class="btn" data-save>Save and sign in</button>`}
    </form>
  </div>`;se();ce();H();var Ee=document.getElementById("app"),la=document.getElementById("rail"),yt=document.getElementById("topbar"),Te=document.getElementById("view"),pa=document.getElementById("scrim"),ne=document.getElementById("gate");if(De()){let e=document.createElement("p");e.className="demo-banner",e.setAttribute("role","note"),e.innerHTML="<strong>Demonstration records are showing.</strong>&nbsp;Totals include sample data. Switch off in Settings.",yt.before(e)}var ca={dashboard:()=>Promise.resolve().then(()=>(Va(),Ga)),pipeline:()=>Promise.resolve().then(()=>(os(),ss)),followups:()=>Promise.resolve().then(()=>(rs(),is)),tasks:()=>Promise.resolve().then(()=>(hs(),ms)),contacts:()=>Promise.resolve().then(()=>($s(),gs)),contact:()=>Promise.resolve().then(()=>(bs(),ws)),opportunity:()=>Promise.resolve().then(()=>(ks(),xs)),quotes:()=>Promise.resolve().then(()=>(Ts(),qs)),visits:()=>Promise.resolve().then(()=>(Ls(),Es)),projects:()=>Promise.resolve().then(()=>(As(),Cs)),project:()=>Promise.resolve().then(()=>(Os(),Ns)),settings:()=>Promise.resolve().then(()=>(Ps(),Rs)),account:()=>Promise.resolve().then(()=>(Is(),Us))},Di={opportunity:"pipeline",contact:"contacts",project:"projects"},ge=Fs(),da=0;function Fs(){let e=(location.hash||"#/").replace(/^#\/?/,""),[t,n]=e.split("/");return t?ca[t]?{key:t,arg:n||null}:{key:"dashboard",arg:null}:{key:"dashboard",arg:null}}async function mn(){try{da=(await d.openOpportunities()).filter(we).length}catch{}}var Ct=0;function Ci(){let e=Te.cloneNode(!1);return delete e.dataset.view,Te.replaceWith(e),Te=e,e}async function gt(){if(!Ta())return Ze();let e=++Ct,t=at(),n=Di[ge.key]||ge.key;la.innerHTML=An(n,t,{overdue:da}),ma();let a;try{a=await(ca[ge.key]||ca.dashboard)()}catch{yt.innerHTML=Xt("Kingson"),Te.innerHTML=On("That screen could not be loaded. Check the connection and try again.");return}if(e===Ct){yt.innerHTML=Xt(typeof a.title=="function"?a.title(ge.arg):a.title,""),Ci(),Te.innerHTML=Ia(4),Te.dataset.view=ge.key;try{let o=await a.render(ge.arg,{me:t,rerender:ua});if(e!==Ct)return;Te.innerHTML=o,yt.innerHTML=Xt(typeof a.title=="function"?a.title(ge.arg):a.title,typeof a.sub=="function"?await a.sub(ge.arg):a.sub||"",typeof a.actions=="function"?a.actions(ge.arg,t):""),a.mount?.(Te,ua,{me:t,arg:ge.arg})}catch(o){if(e!==Ct)return;console.error("[kingson] view failed",ge.key,o),Te.innerHTML=On(o?.message||"That screen could not be loaded.")}mn().then(()=>{e===Ct&&(la.innerHTML=An(n,at(),{overdue:da}))})}}async function ua(){let e=window.scrollY;await gt(),window.scrollTo(0,e)}function Ze(e=""){Ee.hidden=!0,ne.hidden=!1,ne.innerHTML=Pa(e);let t=ne.querySelector("#signin-form"),n=t.querySelector("[data-signin]"),a=t.querySelector(".signin-err");t.querySelector("#si-email").focus(),t.querySelector("[data-forgot]").addEventListener("click",()=>Bs(t.querySelector("#si-email").value.trim())),t.addEventListener("submit",async o=>{o.preventDefault();let i=t.querySelector("#si-email").value.trim(),r=t.querySelector("#si-password").value;if(a.hidden=!0,!i||!r){a.textContent="Enter your email address and password.",a.hidden=!1;return}n.disabled=!0,n.textContent="Signing in\u2026";try{await La(i,r),ne.hidden=!0,ne.innerHTML="",Ee.hidden=!1,await mn(),await gt()}catch(l){a.textContent=l?.status===400?"That email address and password do not match an account.":l?.message||"Sign-in failed.",a.hidden=!1,n.disabled=!1,n.textContent="Sign in",t.querySelector("#si-password").select()}})}var Ai=()=>{Ee.classList.add("rail-open"),pa.hidden=!1,la.querySelector(".rail-link")?.focus(),yt.querySelector("[data-rail-open]")?.setAttribute("aria-expanded","true")},ma=()=>{Ee.classList.remove("rail-open"),pa.hidden=!0,yt.querySelector("[data-rail-open]")?.setAttribute("aria-expanded","false")};document.addEventListener("click",async e=>{if(e.target.closest("[data-rail-open]"))return Ai();if(e.target===pa||e.target.closest(".rail-link"))return ma();if(e.target.closest("[data-signout]")){await Da(),location.hash="#/",Ze();return}if(e.target.closest("[data-retry]"))return gt();let t=at();if(e.target.closest("[data-search-open]")){let{openSearch:n}=await Promise.resolve().then(()=>(ra(),ia));return n()}if(e.target.closest("[data-new-opp]")){let{newOpportunity:n}=await Promise.resolve().then(()=>(qe(),dn));return n({me:t})}if(e.target.closest("[data-new-contact]")){let{contactDialog:n}=await Promise.resolve().then(()=>(qe(),dn));return n({onDone:a=>{location.hash=`#/contact/${a.id}`}})}if(e.target.closest("[data-new-task-global]")){let{taskDialog:n}=await Promise.resolve().then(()=>(qe(),dn));return n({me:t,onDone:ua})}});document.addEventListener("keydown",async e=>{if(e.key==="Escape"&&Ee.classList.contains("rail-open")&&ma(),e.key==="/"&&!Ee.hidden&&!document.body.classList.contains("is-modal")&&!e.target.closest?.("input, textarea, select, [contenteditable]")){e.preventDefault();let{openSearch:t}=await Promise.resolve().then(()=>(ra(),ia));t()}});function Bs(e=""){Ee.hidden=!0,ne.hidden=!1,ne.innerHTML=Ua(e);let t=ne.querySelector("#forgot-form"),n=t.querySelector(".signin-err"),a=t.querySelector(".signin-ok"),o=t.querySelector("[data-send]");t.querySelector("#fp-email").focus(),t.querySelector("[data-back]").addEventListener("click",()=>Ze()),t.addEventListener("submit",async i=>{i.preventDefault();let r=t.querySelector("#fp-email").value.trim();if(n.hidden=!0,a.hidden=!0,!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r)){n.textContent="Enter the email address you sign in with.",n.hidden=!1;return}o.disabled=!0,o.textContent="Sending\u2026";try{await vn(r),a.textContent="If that address has an account, the link is on its way. Check the inbox, and the spam folder.",a.hidden=!1,o.textContent="Send again"}catch(l){n.textContent=l?.message||"The link could not be sent. Try again in a few minutes.",n.hidden=!1,o.textContent="Send the link"}o.disabled=!1})}var Ni={otp_expired:"The link has expired or has already been used. Links last one hour and work once.",access_denied:"The link could not be accepted. It may have expired or already been used."};function Ws(e){if(Ee.hidden=!0,ne.hidden=!1,e.error){ne.innerHTML=Nn({error:Ni[e.error]||e.description||"The link could not be accepted."}),ne.querySelector("[data-forgot]").addEventListener("click",()=>Bs()),ne.querySelector("[data-back]").addEventListener("click",()=>Ze());return}ne.innerHTML=Nn();let t=ne.querySelector("#reset-form"),n=t.querySelector(".signin-err"),a=t.querySelector("[data-save]");t.querySelector("#np-1").focus(),t.addEventListener("submit",async o=>{o.preventDefault();let i=t.querySelector("#np-1").value,r=t.querySelector("#np-2").value;if(n.hidden=!0,i.length<8){n.textContent="Use at least 8 characters.",n.hidden=!1;return}if(i!==r){n.textContent="The two passwords are not the same.",n.hidden=!1;return}a.disabled=!0,a.textContent="Saving\u2026";try{if(await Ut(i),!await En())throw new Error("Your password was changed, but this account cannot use the CRM. Ask an administrator.");ne.hidden=!0,ne.innerHTML="",Ee.hidden=!1,location.hash="#/",await mn(),await gt(),g("Password changed. You are signed in.")}catch(l){n.textContent=l?.status===401?"The link has expired. Ask for a new one.":l?.message||"The password could not be saved.",n.hidden=!1,a.disabled=!1,a.textContent="Save and sign in"}})}addEventListener("hashchange",()=>{let e=Pt();if(e)return Ws(e);ge=Fs(),gt().then(()=>{Te.focus({preventScroll:!0}),scrollTo(0,0)})});addEventListener("storage",e=>{e.key==="kingson-crm/session/v1"&&!e.newValue&&Ze("Signed out in another tab.")});(async function(){document.getElementById("boot")?.remove();let t=Pt();if(t)return Ws(t);if(!await En())return Ze();ne.hidden=!0,Ee.hidden=!1,await mn(),await gt()})().catch(e=>{console.error("[kingson] boot failed",e),Ze("Something went wrong starting the application. Reload the page.")});export{s as esc,ua as softRender,g as toast};
