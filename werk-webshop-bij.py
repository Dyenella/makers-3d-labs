from pathlib import Path
import re

p = Path("winkel.html")
if not p.exists():
    raise SystemExit("Open eerst de map makers-3d-labs.")
html = p.read_text(encoding="utf-8")
if '<div class="mk-grid">' not in html:
    raise SystemExit("Productraster niet gevonden. Er is niets gewijzigd.")
header = '''<header class="ms-simple-head shop-brand-header">
<div class="head-inner">
<a href="index.html" aria-label="Makers 3D Labs — Home"><img src="makers3dlabs-logo.webp" alt="Makers 3D Labs — Your idea. Made possible." width="1600" height="500"></a>
<nav class="shop-head-links" aria-label="Hoofdnavigatie"><a href="index.html">Home</a><a href="winkel.html" aria-current="page">Webshop</a></nav>
</div></header>'''
html, count = re.subn(r'<header\b[^>]*>.*?</header>', lambda _: header, html, count=1, flags=re.S)
if count != 1:
    raise SystemExit("Navigatie niet gevonden. Er is niets gewijzigd.")
filters = '''<section class="shop-filter-panel" aria-label="Producten zoeken en filteren">
<div class="shop-search"><label for="shop-search">Zoek een product</label><input id="shop-search" type="search" placeholder="Bijvoorbeeld kersthanger, stadion of Anubis" autocomplete="off"></div>
<div class="shop-filter-buttons" role="group" aria-label="Productcategorie">
<button type="button" data-category="alles" aria-pressed="true">Alles</button>
<button type="button" data-category="kerst" aria-pressed="false">Kerst</button>
<button type="button" data-category="voetbal" aria-pressed="false">Voetbal</button>
<button type="button" data-category="resin" aria-pressed="false">Resin</button>
<button type="button" data-category="zakelijk" aria-pressed="false">Zakelijk</button>
<button type="button" data-category="laser" aria-pressed="false">Lasergravure</button>
<button type="button" data-category="persoonlijk" aria-pressed="false">Gepersonaliseerd</button>
</div><p id="shop-filter-count" role="status" aria-live="polite"></p>
<p id="shop-filter-empty" hidden>Geen producten gevonden. Kies een andere categorie of pas je zoekterm aan.</p>
</section>'''
if 'id="shop-search"' not in html:
    html = html.replace('<div class="mk-grid">', filters + '\n<div class="mk-grid">', 1)
css = '''<style id="makers-webshop-kleuren">
body.ms-site-shell{background:#303d4c;color:#f3f7fa}
.shop-brand-header{background:#1d2936;padding:0 24px;border-bottom:1px solid #00afb860}
.shop-brand-header .head-inner{max-width:1192px;min-height:88px;margin:auto;display:flex;align-items:center;gap:24px}
.shop-brand-header img{display:block;width:230px;max-width:100%;height:auto}
.shop-head-links{display:flex;gap:24px;margin-left:auto}
.shop-head-links a{color:#fff;font-size:14px}
.shop-head-links a[aria-current]{color:#6dd6d9}
.shop-brand-header .ms-utilities{margin-left:0}
.mk-shop-page{padding-top:32px}
.mk-shop-page h1{color:#fff;font-size:clamp(32px,4vw,48px);margin:10px 0 15px}
.mk-shop-page>p{color:#c4d3df;max-width:820px}
.mk-shop-page>.mk-category{color:#6dd6d9}
.shop-filter-panel{margin:25px 0 20px;padding:20px;background:#223244;border:1px solid #61798d;border-radius:16px}
.shop-search label{display:block;color:#e2ecf4;font-size:13px;font-weight:700;margin-bottom:7px}
.shop-search input{box-sizing:border-box;display:block;width:100%;max-width:560px;padding:12px 14px;background:#182735;color:#fff;border:1px solid #7891a4;border-radius:9px;font:inherit;font-size:14px}
.shop-search input::placeholder{color:#afc0ce;opacity:1}
.shop-filter-buttons{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px}
.shop-filter-buttons button{border:1px solid #7891a4;border-radius:999px;background:#2a4053;color:#fff;padding:9px 16px;font:700 13px Arial,sans-serif;cursor:pointer;min-height:40px}
.shop-filter-buttons button:hover{background:#35556a}
.shop-filter-buttons button[aria-pressed="true"]{background:#00afb8;border-color:#00afb8;color:#082d34}
#shop-filter-count{color:#bdcfdd;font-size:13px;margin:14px 0 0}
#shop-filter-empty{color:#f2e3be;font-size:14px;margin:12px 0 0}
.mk-shop-page .mk-grid{margin-top:0}
.mk-product{background:#243649;border-color:#60788b}
.mk-product-info{background:transparent}
.mk-product-info h3{color:#f3f7fa}
.mk-product-info .mk-category,.mk-product-info .mk-price{color:#7dd9dc}
.mk-product-info .mk-view{color:#7dd9dc}
.mk-product[hidden],#shop-filter-empty[hidden]{display:none!important}
.mk-photo{background:#101c25}
.mk-shop-page>section:not(.shop-filter-panel) h2{color:#fff}
.mk-shop-page>section:not(.shop-filter-panel)>p{color:#c4d3df}
.mk-cat{background:#233649;border-color:#60788b}
.mk-cat summary{color:#f3f7fa}
.mk-cat summary span,.mk-cat summary::before,.mk-cat-body a{color:#7dd9dc}
.mk-cat-body,.mk-cat-body p{color:#c4d3df}
.shop-filter-panel :focus-visible,.shop-brand-header a:focus-visible{outline:3px solid #7dd9dc;outline-offset:3px}
@media(max-width:650px){.shop-brand-header{padding:0 16px}.shop-brand-header .head-inner{min-height:76px;gap:12px;flex-wrap:wrap;padding:10px 0}.shop-brand-header img{width:185px}.shop-head-links{gap:14px}.shop-brand-header .ms-utilities{margin-left:auto}.shop-filter-panel{padding:15px}.shop-filter-buttons button{padding:8px 12px}}
</style>'''
# De bestaande kerstkaartstijlen moeten na de algemene kleuren blijven staan.
html = re.sub(r'<style id="makers-webshop-kleuren">.*?</style>', '', html, flags=re.S)
marker = '<style id="kh-webshop-kerstkaart">'
if marker in html:
    html = html.replace(marker, css + '\n' + marker, 1)
else:
    html = html.replace("</head>", css + '\n</head>', 1)
script = r'''<script id="makers-webshop-categorieen">
(function(){
 const search=document.getElementById('shop-search');
 const panel=document.querySelector('.shop-filter-buttons');
 const grid=document.querySelector('.mk-shop-page .mk-grid');
 if(!search||!panel||!grid)return;
 const mapping={
  'kersthangers.html':['kerst','persoonlijk'],
  'kersthangers-bedrijfslogo.html':['kerst','zakelijk','persoonlijk'],
  'persoonlijke-kersttafel.html':['kerst','persoonlijk'],
  'kleine-cadeaus.html':['kerst','persoonlijk','laser'],
  'voetbalstadion-deluxe.html':['voetbal','persoonlijk'],
  'samurai-oni-deluxe.html':['resin'],
  'horus-antiekgouden-buste.html':['resin'],
  'anubis-antiekgouden-buste.html':['resin'],
  'bastet-antiekgouden-buste.html':['resin'],
  'business-collection-bedrijfsdisplays.html':['zakelijk','persoonlijk'],
  'clipper-duo-set.html':['persoonlijk'],
  'metalen-supporterskaart-premium.html':['laser','voetbal','persoonlijk']
 };
 const cards=Array.from(grid.querySelectorAll('.mk-product')).map(card=>{
  const link=card.querySelector('a[href]'),href=link?link.getAttribute('href').split(/[?#]/)[0]:'';
  return {card,categories:mapping[href]||[],text:card.textContent.toLocaleLowerCase('nl-NL')};
 });
 let active='alles';
 function update(){
  const q=search.value.trim().toLocaleLowerCase('nl-NL');
  let count=0;
  cards.forEach(item=>{
   const show=(active==='alles'||item.categories.includes(active))&&(!q||item.text.includes(q));
   item.card.hidden=!show;if(show)count++;
  });
  document.getElementById('shop-filter-count').textContent=count+' van '+cards.length+' producten';
  document.getElementById('shop-filter-empty').hidden=count>0;
 }
 panel.querySelectorAll('button[data-category]').forEach(button=>button.addEventListener('click',()=>{
  active=button.dataset.category;
  panel.querySelectorAll('button[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  update();
 }));
 search.addEventListener('input',update);
 update();
})();
</script>'''
html = re.sub(r'<script id="makers-webshop-categorieen">.*?</script>', '', html, flags=re.S)
html = html.replace("</body>", script + '\n</body>', 1)
backup = Path("winkel.html.before-categorieen.bak")
if not backup.exists():
    backup.write_text(p.read_text(encoding="utf-8"),encoding="utf-8")
p.write_text(html,encoding="utf-8")
print("Klaar: webshop in merkkleuren met categorieknoppen en zoekveld.")
print("Alle bestaande producten, afbeeldingen, prijzen en links behouden. Nog niet gepubliceerd.")
