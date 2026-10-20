// Basic opt-in: no Google tag or measurement request before a grant. No form
// fields, messages, query strings, hashes or destination contact details sent.
export function mountPrivacy() {
  const banner = document.querySelector('[data-privacy]');
  if (!banner) return;
  const id = banner.dataset.analyticsId;
  const configured = /^G-[A-Z0-9]+$/.test(id);
  const production = location.hostname === 'www.kingsonengineering.co.zw';
  const key = 'kingson_privacy_v1', lifetime = 180*86400000;
  let choice = null, loaded = false, returnFocus = null;
  const read = () => {
    try {
      const saved=JSON.parse(localStorage.getItem(key));
      return saved?.version===1 && saved.expires>Date.now() && ['granted','denied'].includes(saved.analytics) ? saved.analytics : null;
    } catch { return null; }
  };
  const status = banner.querySelector('[data-privacy-status]');
  const show = () => {
    returnFocus = document.activeElement;
    banner.hidden = false;
    status.textContent = configured ? 'Analytics is optional. Your enquiry and contact options work with either choice.' : 'Optional analytics is currently disabled.';
  };
  const clearCookies = () => {
    for(const cookie of document.cookie.split(';')) {
      const name=cookie.split('=')[0].trim();
      if(!/^_ga(?:_|$)/.test(name))continue;
      for(const domain of ['',location.hostname,'.'+location.hostname,'.kingsonengineering.co.zw']) {
        document.cookie=`${name}=; Max-Age=0; Path=/; SameSite=Lax${domain?'; Domain='+domain:''}${location.protocol==='https:'?'; Secure':''}`;
      }
    }
  };
  const tag = (...args) => {
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
    window.gtag(...args);
  };
  const start = () => {
    if(!configured||!production||choice!=='granted')return;
    window['ga-disable-'+id]=false;
    if(loaded) {
      tag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      return;
    }
    loaded=true;
    tag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    tag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    tag('js',new Date());
    // The committed canonical is safe even if a visitor opens a URL containing
    // a contact address, a message or another private query/fragment value.
    const canonical=document.querySelector('link[rel="canonical"]')?.href;
    if(!canonical||!canonical.startsWith('https://www.kingsonengineering.co.zw/'))return;
    let referrer='';
    try { const url=new URL(document.referrer);if(/^https?:$/.test(url.protocol))referrer=url.origin+'/'; } catch {}
    tag('config',id,{
      send_page_view:false,page_location:canonical,page_referrer:referrer,
      allow_google_signals:false,allow_ad_personalization_signals:false,
      cookie_expires:90*86400,cookie_update:false,cookie_flags:'SameSite=Lax;Secure'
    });
    tag('event','page_view',{page_location:canonical,page_referrer:referrer,page_title:document.title});
    const script=document.createElement('script');
    script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+id;
    script.dataset.optionalAnalytics='';document.head.appendChild(script);
  };
  const apply = value => {
    choice=value;
    if(value==='granted')start();
    else {
      if(configured)window['ga-disable-'+id]=true;
      if(loaded)tag('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
      clearCookies();
    }
  };
  banner.querySelectorAll('[data-consent-choice]').forEach(button=>button.addEventListener('click',()=>{
    const value=button.dataset.consentChoice;
    try { localStorage.setItem(key,JSON.stringify({version:1,analytics:value,expires:Date.now()+lifetime})); } catch {}
    apply(value);banner.hidden=true;
    if(returnFocus?.isConnected&&returnFocus!==document.body)returnFocus.focus({preventScroll:true});
  }));
  document.querySelectorAll('[data-cookie-settings]').forEach(button=>button.addEventListener('click',()=>{
    show();banner.querySelector('[data-consent-choice]').focus();
  }));
  window.addEventListener('storage',event=>{if(event.key===key){apply(read());if(!choice&&configured)show();}});
  apply(read());
  if(!choice&&configured)show();
  const event = (name,parameters={}) => {
    if(choice==='granted'&&loaded&&production)tag('event',name,parameters);
  };
  document.addEventListener('click',click=>{
    const link=click.target.closest('a[href]');if(!link)return;
    const href=link.getAttribute('href');
    const method=href.startsWith('tel:')?'call':href.startsWith('mailto:')?'email':href.startsWith('https://wa.me/')?'whatsapp':null;
    if(method)event('contact_click',{contact_method:method});
  });
  document.addEventListener('enquiry-saved',()=>event('generate_lead',{method:'website_enquiry'}));
  document.querySelectorAll('[data-load-map]').forEach(button=>button.addEventListener('click',()=>{
    const figure=button.closest('.ct-map'), frame=figure.querySelector('iframe');
    frame.src=frame.dataset.mapSrc;frame.hidden=false;
    figure.querySelector('[data-map-choice]').hidden=true;
  }));
}
