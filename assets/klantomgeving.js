(()=>{'use strict';
const root=document.querySelector('[data-customer-view]');if(!root)return;
const view=root.dataset.customerView;
const el=id=>document.getElementById(id);
const state={client:null,user:null,revision:0,records:[]};
const money=cents=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(Number(cents||0)/100);
const date=value=>{const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('nl-NL');};
function node(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n;}
function message(text){el('customer-message').textContent=text;}
function clearPrivate(){state.revision++;state.records=[];el('customer-records')?.replaceChildren();el('customer-content').hidden=true;el('customer-session').hidden=true;const f=el('customer-profile');if(f)f.reset();}
function setOut(out){const m=document.querySelector('main.customer');if(!m)return;m.classList.toggle('is-out',out);const h=m.querySelector('h1');if(h){h.dataset.t=h.dataset.t||h.textContent;h.textContent=out?'Inloggen':h.dataset.t;}if(!document.getElementById('m3d-out-css')){const st=document.createElement('style');st.id='m3d-out-css';st.textContent='main.customer.is-out .customer-nav,main.customer.is-out>p,main.customer.is-out #customer-message,main.customer.is-out #customer-content{display:none!important}main.customer.is-out .customer-layout{display:block;max-width:560px}';document.head.append(st);}}
function loginState(){clearPrivate();setOut(true);el('customer-login').hidden=false;el('customer-content').hidden=true;message('');}
const statusNames={received:'Ontvangen',confirmed:'Bevestigd',in_production:'In productie',shipped:'Verzonden',completed:'Afgerond',cancelled:'Geannuleerd',open:'Openstaand',paid:'Betaald',sent:'Verstuurd',accepted:'Geaccepteerd',declined:'Afgewezen',expired:'Verlopen',draft:'In voorbereiding',issued:'Uitgegeven',credited:'Gecrediteerd'};
async function download(record,button){
 if(!state.client||!state.user)return;
 const userId=state.user.id,revision=state.revision,path=record.file_path;
 if(typeof path!=='string'||!path.startsWith(userId+'/')||path.includes('..')||!path.toLowerCase().endsWith('.pdf')){message('Dit document is nog niet beschikbaar. Neem contact op als je het nodig hebt.');return;}
 button.disabled=true;button.textContent='Downloaden…';
 try{const {data,error}=await state.client.storage.from('customer-documents').download(path);if(error)throw error;
  if(revision!==state.revision||state.user?.id!==userId)return;
  const url=URL.createObjectURL(data),a=document.createElement('a');a.href=url;a.download=(record.number||'document').replace(/[^a-zA-Z0-9_-]/g,'-')+'.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }catch{message('Downloaden is niet gelukt. Probeer opnieuw of neem contact met ons op.');}
 finally{button.disabled=false;button.textContent='Download PDF';}
}
function render(records){const list=el('customer-records');if(!list)return;list.replaceChildren();
 if(!records.length){const text=view==='invoices'?'Er zijn nog geen facturen voor jouw account beschikbaar.':view==='quotes'?'Er zijn nog geen offertes aan jouw account gekoppeld.':'Er zijn nog geen bestellingen aan jouw account gekoppeld.';list.append(node('p',text,'customer-empty'));return;}
 for(const record of records){const card=node('article',undefined,'customer-record'),head=node('div',undefined,'customer-record-head');head.append(node('h3',record.number||'Zonder nummer'),node('span',statusNames[record.status]||'In behandeling','customer-status'));card.append(head,node('p',record.title||'Jouw opdracht'),node('p','Datum: '+date(record.created_at)),node('p',money(record.total_cents)+' incl. btw','customer-amount'));
  if(record.order_number)card.append(node('p','Bestelling: '+record.order_number));
  if(view==='orders'){if(record.payment_status)card.append(node('p','Betaling: '+(statusNames[record.payment_status]||'In behandeling')));if(record.carrier)card.append(node('p','Verzending: '+record.carrier+(record.tracking_code?' · track & trace '+record.tracking_code:'')));if(record.tracking_code){const code=encodeURIComponent(String(record.tracking_code).replace(/\s/g,'')),url=record.carrier==='DHL'?'https://www.dhl.com/nl-nl/home/tracking/tracking-ecommerce.html?submit=1&tracking-id='+code:'https://jouw.postnl.nl/track-and-trace/'+code+'-NL-'+encodeURIComponent(record.ship_postcode||''),a=node('a','Volg je pakket →');a.href=url;a.target='_blank';a.rel='noopener';card.append(a);}if(Array.isArray(record.items)&&record.items.length){const details=node('details'),ul=node('ul');details.append(node('summary','Bekijk orderdetails'));for(const item of record.items){ul.append(node('li',String(item.quantity||1)+' × '+String(item.name||'Artikel')+(item.options?' · '+String(item.options):'')));}details.append(ul);card.append(details);}}
  if((view==='invoices'&&record.status==='issued')||(view==='quotes'&&record.status==='sent')){const pb=node('button',view==='invoices'?'Betaal nu':'Akkoord en betalen','customer-download');pb.type='button';pb.style.marginRight='8px';pb.addEventListener('click',()=>payDoc(record,pb));card.append(pb);}
  if(record.file_path){const b=node('button','Download PDF','customer-download');b.type='button';b.addEventListener('click',()=>download(record,b));card.append(b);}else if(view!=='orders')card.append(node('p','Het PDF-document is nog niet toegevoegd.','customer-small'));
  list.append(card);
 }
}
async function payDoc(record,button){if(!state.client||!state.user)return;button.disabled=true;const t=button.textContent;button.textContent='Even geduld…';try{const {data:s}=await state.client.auth.getSession();const cfg=window.MAKERS_CUSTOMER_CONFIG;const r=await fetch(cfg.url+'/functions/v1/betaal-document',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+s.session.access_token,apikey:cfg.publishableKey},body:JSON.stringify({kind:view==='invoices'?'invoice':'quote',id:record.id})});const j=await r.json().catch(()=>({}));if(!r.ok||!j.url)throw new Error(j.error||'Betalen kon niet worden gestart.');location.href=j.url;}catch(e){message(e.message);button.disabled=false;button.textContent=t;}}
async function load(){if(!state.client||!state.user)return;const revision=++state.revision,userId=state.user.id;message('');
 if(view==='overview')return;
 if(view==='addresses'){
  const {data,error}=await state.client.from('customer_profiles').select('full_name,company,phone,street,house_number,postal_code,city,country,billing_street,billing_house_number,billing_postal_code,billing_city,billing_country').eq('user_id',userId).maybeSingle();
  if(revision!==state.revision)return;if(error){message('Je adresgegevens konden niet worden geladen. Probeer opnieuw.');return;}if(data){for(const [name,value]of Object.entries(data)){const input=el('customer-profile').elements.namedItem(name);if(input)input.value=value||'';}}return;
 }
 const table={orders:'customer_orders',quotes:'customer_quotes',invoices:'customer_invoices'}[view];if(!table)return;
 const list=el('customer-records');list.replaceChildren(node('p','Gegevens laden…','customer-empty'));
 const fields=view==='orders'?'id,number,title,status,payment_status,total_cents,items,created_at,carrier,tracking_code,ship_postcode':view==='quotes'?'id,number,title,status,total_cents,file_path,created_at':'id,number,title,status,total_cents,file_path,order_number,created_at';
 const {data,error}=await state.client.from(table).select(fields).eq('user_id',userId).order('created_at',{ascending:false}).limit(200);
 if(revision!==state.revision||state.user?.id!==userId)return;
 if(error){list.replaceChildren();message('Je gegevens konden niet worden geladen. Gebruik Vernieuwen of neem contact op.');return;}
 state.records=data||[];render(state.records);
}
async function updateUser(user){clearPrivate();state.user=user;if(!user){loginState();return;}if(state.auth&&state.auth.isRecovery()){setOut(true);el('customer-login').hidden=false;return;}setOut(false);el('customer-login').hidden=true;el('customer-session').hidden=false;el('customer-content').hidden=false;el('customer-email').textContent=user.email||'Ingelogd';await load();}
async function start(){
 const config=window.MAKERS_CUSTOMER_CONFIG;
 if(!config?.url||!config?.publishableKey){message('De vernieuwde klantomgeving wordt ingericht. Inloggen en persoonlijke documenten zijn nog niet beschikbaar. Neem voor jouw bestelling, offerte of factuur contact met ons op.');el('customer-login-submit').disabled=true;if(view==='overview')el('customer-content').hidden=false;return;}
 try{const u=new URL(config.url);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||!config.publishableKey.startsWith('sb_publishable_'))throw Error('Invalid configuration');
  const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.81.1');
  state.client=createClient(config.url,config.publishableKey,{auth:{persistSession:true,storage:window.localStorage,autoRefreshToken:true,detectSessionInUrl:true}});
  state.auth=window.M3DAuth?window.M3DAuth.mount(el('customer-login-form'),state.client,{redirect:location.origin+'/account.html',submitId:'customer-login-submit',onRecovery:()=>{el('customer-login').hidden=false;},onPasswordSet:async()=>{const {data}=await state.client.auth.getUser();await updateUser(data.user||null);}}):null;
  state.client.auth.onAuthStateChange((event,session)=>{setTimeout(()=>updateUser(session?.user||null).catch(()=>message('De klantomgeving kon niet worden geladen.')),0);});
  const {data,error}=await state.client.auth.getUser();if(error&&!data.user){loginState();}else await updateUser(data.user);
  el('customer-login-submit').disabled=false;
 }catch{clearPrivate();message('Inloggen is momenteel niet bereikbaar. Probeer later opnieuw of neem contact op.');el('customer-login-submit').disabled=true;}
}
el('customer-signout').addEventListener('click',async()=>{clearPrivate();state.user=null;loginState();if(state.client){const {error}=await state.client.auth.signOut();if(error)message('Uitloggen kon niet worden bevestigd. Sluit dit tabblad en probeer het opnieuw.');}});
el('customer-refresh')?.addEventListener('click',()=>load().catch(()=>message('Vernieuwen is niet gelukt.')));
el('customer-profile')?.addEventListener('submit',async e=>{e.preventDefault();if(!state.client||!state.user)return;const button=e.target.querySelector('button');button.disabled=true;const payload={user_id:state.user.id};for(const [key,value]of new FormData(e.target))payload[key]=String(value).trim();try{const {error}=await state.client.from('customer_profiles').upsert(payload,{onConflict:'user_id'});if(error)throw error;message('Je gegevens zijn opgeslagen. Een adreswijziging past een al bevestigde bestelling niet automatisch aan.');}catch{message('Opslaan is niet gelukt. Probeer opnieuw.');}finally{button.disabled=false;}});
window.addEventListener('pagehide',clearPrivate);
window.addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
if(new URLSearchParams(location.search).get('betaald')==='1')setTimeout(()=>message('Bedankt! Je betaling is gelukt. De status wordt binnen enkele ogenblikken bijgewerkt.'),800);
start();
})();
