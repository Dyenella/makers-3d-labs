from pathlib import Path

root = Path(__file__).resolve().parent
assets = root / 'assets'
assets.mkdir(exist_ok=True)

(assets / 'shop-data.js').write_text('''// Productprijzen worden pas toegevoegd na goedkeuring. Geen fictieve artikelen of bedragen.
window.MAKERS_SHOP_PRODUCTS = [];
''', encoding='utf-8')

(assets / 'shop.css').write_text(r'''/* Makers 3D Labs — Webshop basis, v2 */
.ms-utilities{display:flex;align-items:center;gap:7px;white-space:nowrap;font-family:'DM Sans',Arial,sans-serif}
.ms-utility{display:inline-flex!important;align-items:center;justify-content:center;gap:7px;padding:9px 11px!important;border-radius:999px!important;background:#e9f5f1!important;color:#123338!important;font-size:12px!important;font-weight:800!important;text-decoration:none!important;line-height:1.25!important;min-height:40px}
.ms-utility:hover{background:#ccefe7!important}.ms-utility svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ms-badge{background:#0d776e;color:white;border-radius:50%;min-width:19px;height:19px;padding:0 4px;display:inline-grid;place-items:center;font-size:10px}
.ms-top-strip{display:flex;gap:8px;flex-wrap:wrap;align-items:center;justify-content:flex-end;background:#ecf5f1;padding:8px max(22px,calc((100vw - 1200px)/2));position:relative;z-index:22}
.ms-top-strip .ms-utilities{margin-left:auto}
.ms-extra-mobile{padding:11px 14px!important;background:#eff8f4!important;border-radius:10px!important;color:#123338!important;text-decoration:none!important;display:block!important;margin:7px 0!important;font-weight:700!important}
@media(max-width:1180px){.ms-utilities .ms-utility-label{display:none}.ms-utility{padding:9px!important}.ms-badge{font-size:10px}}
@media(max-width:600px){.ms-top-strip{justify-content:center;padding:8px}.ms-utilities{gap:5px}.ms-utilities .ms-utility-label{display:inline}.ms-top-strip .ms-utilities .ms-utility-label{display:inline}}
.ms-footer{background:#12242a;color:#d5e6e4;padding:54px 0 22px;font:14px/1.65 'DM Sans',Arial,sans-serif;margin-top:0}
.ms-footer-inner{max-width:1250px;margin:auto;padding:0 32px}.ms-footer-grid{display:grid;grid-template-columns:1.4fr repeat(4,1fr);gap:28px}.ms-footer h3{font-size:13px;color:#fff;margin:0 0 15px}.ms-footer-brand{font-size:22px;font-weight:800;color:#fff;letter-spacing:-.04em}.ms-footer-tagline{color:#99cfc7}.ms-footer a{display:block;color:#c4d5d3;text-decoration:none;margin:8px 0}.ms-footer a:hover{color:#8ee3d4;text-decoration:underline}.ms-footer-bottom{border-top:1px solid #ffffff29;margin-top:32px;padding-top:20px;color:#acc5c2;font-size:12px}.ms-footer-note{color:#b6cfcb;font-size:12px;margin-top:10px}
@media(max-width:900px){.ms-footer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ms-footer-grid>div:first-child{grid-column:1/-1}}
@media(max-width:520px){.ms-footer-inner{padding:0 22px}.ms-footer-grid{gap:20px}}
.ms-site-shell{background:#f5f6f2;color:#102027;margin:0;font:16px/1.65 'DM Sans',Arial,sans-serif}.ms-site-shell *{box-sizing:border-box}.ms-simple-head{background:#fff;padding:24px max(24px,calc((100vw - 1180px)/2));border-bottom:1px solid #dfebe6}.ms-simple-head a{color:#14373a;text-decoration:none;font-weight:800}.ms-page{width:min(1160px,calc(100% - 44px));margin:58px auto 90px;min-height:48vh}.ms-page h1{font-size:clamp(38px,5vw,66px);line-height:1.1;letter-spacing:-.05em;margin:12px 0 20px}.ms-eyebrow{color:#087f75;letter-spacing:.14em;text-transform:uppercase;font-weight:800;font-size:12px}.ms-lead{color:#65777b;max-width:750px;font-size:17px}.ms-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:20px;margin-top:32px}.ms-card,.ms-empty,.ms-callout{background:#fff;border:1px solid #dce6e2;border-radius:18px;padding:24px}.ms-card-body h2,.ms-empty h2{margin-top:0;font-size:21px}.ms-card p,.ms-empty p{color:#62767a}.ms-btn{border:0;background:#122e35;color:#fff;display:inline-flex;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:700;cursor:pointer}.ms-btn:disabled{opacity:.55;cursor:not-allowed}.ms-btn-outline{background:#dff6f0;color:#122e35}.ms-empty,.ms-callout{margin-top:30px}.ms-empty a,.ms-callout a{margin-top:12px}
''', encoding='utf-8')

(assets / 'shop.js').write_text(r'''(()=>{
 'use strict';
 const iconCart='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.2 12.5a2 2 0 0 0 2 1.7H20a2 2 0 0 0 2-1.7L23 6H6"/></svg>';
 const iconUser='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 22v-2a8 8 0 0 1 16 0v2"/></svg>';
 const items=()=>{try{const v=JSON.parse(localStorage.getItem('makers3d_cart')||'[]');return Array.isArray(v)?v:[]}catch{return []}};
 const count=()=>items().reduce((n,p)=>n+(Number(p.quantity)||0),0);
 const actions=()=>`<nav class="ms-utilities" aria-label="Webshop snelkoppelingen"><a class="ms-utility" href="winkel.html" aria-label="Winkel">Winkel</a><a class="ms-utility" href="account.html" aria-label="Mijn account">${iconUser}<span class="ms-utility-label">Mijn account</span></a><a class="ms-utility" href="winkelwagen.html" aria-label="Winkelwagen">${iconCart}<span class="ms-utility-label">Winkelwagen</span><span class="ms-badge" data-ms-cart-count>${count()}</span></a></nav>`;
 function addNavigation(){
  if(document.querySelector('.ms-utilities'))return;
  const homepage=document.querySelector('.head-inner');
  if(homepage){const div=document.createElement('div');div.innerHTML=actions();const el=div.firstElementChild;const desktop=homepage.querySelector('.desktop');desktop?desktop.after(el):homepage.append(el);
    const mobile=document.getElementById('mobile-nav')||document.querySelector('.mobile-panel');if(mobile){const links=document.createElement('div');links.innerHTML='<a class="ms-extra-mobile" href="winkel.html">Winkel</a><a class="ms-extra-mobile" href="account.html">Mijn account</a><a class="ms-extra-mobile" href="bestellingen.html">Mijn bestellingen</a><a class="ms-extra-mobile" href="winkelwagen.html">Winkelwagen</a>';mobile.append(links)}
  } else {const bar=document.createElement('div');bar.className='ms-top-strip';bar.innerHTML=actions();const header=document.querySelector('header');header?header.after(bar):document.body.prepend(bar)}
 }
 function addFooter(){
  const current=document.querySelector('footer:not(.ms-footer)');if(current)current.remove();
  if(document.querySelector('.ms-footer'))return;
  const f=document.createElement('footer');f.className='ms-footer';f.innerHTML=`<div class="ms-footer-inner"><div class="ms-footer-grid"><div><div class="ms-footer-brand">MAKERS 3D LABS</div><p class="ms-footer-tagline">Your idea. Made possible.</p><p>3D-printen · Resin · Lasergraveren<br>Ridderkerk, Nederland</p></div><div><h3>Shop</h3><a href="winkel.html">Winkel</a><a href="producten.html">Productcatalogus</a><a href="diensten.html">Diensten</a><a href="contact.html">Maatwerk aanvragen</a></div><div><h3>Mijn account</h3><a href="account.html">Inloggen / registreren</a><a href="bestellingen.html">Mijn bestellingen</a><a href="account.html#adressen">Mijn adressen</a><a href="winkelwagen.html">Winkelwagen</a></div><div><h3>Klantenservice</h3><a href="contact.html">Contact</a><a href="informatie.html">Veelgestelde vragen</a><a href="informatie.html">Verzending en levering</a><a href="informatie.html">Retourneren</a></div><div><h3>Informatie</h3><a href="over-ons.html">Over ons</a><a href="informatie.html">Algemene voorwaarden</a><a href="informatie.html">Privacy en cookies</a><a href="informatie.html">Herroepingsrecht</a></div></div><div class="ms-footer-bottom">© ${new Date().getFullYear()} Makers 3D Labs · Ridderkerk <div class="ms-footer-note">Bestellen, betalen en inloggen zijn nog niet actief. De informatieve pagina's zijn in voorbereiding.</div></div></div>`;
  document.body.append(f);
 }
 function showShop(){const el=document.getElementById('ms-shop-grid');if(!el)return;const products=window.MAKERS_SHOP_PRODUCTS||[];el.innerHTML=products.length?products.map(p=>`<article class="ms-card"><div class="ms-card-body"><h2>${String(p.name||'Product').replace(/[&<>"']/g,'')}</h2><p>Productinformatie volgt.</p><a class="ms-btn" href="contact.html">Offerte aanvragen</a></div></article>`).join(''):`<article class="ms-card"><div class="ms-card-body"><h2>Standaardproducten</h2><p>We voegen vaste producten en gecontroleerde prijzen toe voordat bestellen wordt ingeschakeld.</p><a class="ms-btn" href="producten.html">Bekijk de catalogus</a></div></article><article class="ms-card"><div class="ms-card-body"><h2>Gepersonaliseerd maatwerk</h2><p>Vertel ons jouw wensen en ontvang een offerte.</p><a class="ms-btn" href="contact.html">Vraag een offerte aan</a></div></article>`}
 function showCart(){const el=document.getElementById('ms-cart');if(!el)return;el.innerHTML='<div class="ms-empty"><h2>Je winkelwagen is momenteel leeg</h2><p>Er zijn nog geen vaste producten met goedgekeurde prijzen beschikbaar. Het afrekenen is nog niet actief.</p><a class="ms-btn" href="winkel.html">Naar de winkel</a></div>'}
 function init(){addNavigation();addFooter();showShop();showCart();window.addEventListener('storage',()=>document.querySelectorAll('[data-ms-cart-count]').forEach(e=>e.textContent=count()))}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
''', encoding='utf-8')

print('Herstel uitgevoerd: assets/shop.css, assets/shop.js en assets/shop-data.js zijn aangemaakt.')
print('Open de homepage opnieuw met Ctrl+Shift+R.')
print('Daarna: git add assets && git commit -m "Herstel webshop navigatie en footer" && git push origin main')
