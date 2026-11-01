from pathlib import Path
import re

root = Path(".")
paths = {name: root / name for name in ("index.html", "winkel.html", "contact.html")}
if not all(p.exists() for p in paths.values()):
    raise SystemExit("Open eerst de projectmap makers-3d-labs.")
if not (root / "kersthangers-personalisatie.webp").exists():
    raise SystemExit("Haal eerst de geüploade afbeelding binnen met git pull --rebase origin main.")
docs = {name: p.read_text(encoding="utf-8") for name, p in paths.items()}
if '<div class="mk-grid">' not in docs["winkel.html"]:
    raise SystemExit("De webshopindeling is veranderd. Er is niets aangepast.")
if 'id="kerst"' not in docs["index.html"] or 'id="quoteForm"' not in docs["contact.html"]:
    raise SystemExit("Kerstsectie of aanvraagformulier ontbreekt. Er is niets aangepast.")

page = r'''<!doctype html>
<html lang="nl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kersthangers met naam | Makers 3D Labs</title>
<meta name="description" content="Stel jouw persoonlijke kersthanger samen. Kies sneeuwvlok, ster, kerstboom of kerstbal, formaat, gewenste kleur en eigen naam of tekst.">
<link rel="stylesheet" href="assets/shop.css">
<style>
*{box-sizing:border-box}body{margin:0;background:#102d24;color:#fff3d6;font:16px/1.6 system-ui,sans-serif}
a{color:inherit}header{padding:18px 24px;background:#1d2936}header a{display:inline-block}
header img{width:240px;max-width:100%;display:block}main{max-width:1200px;margin:auto;padding:35px 24px 70px}
.crumb{color:#f1d18c;font-size:14px}.layout{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:25px;align-items:start}
figure{margin:0}.photo{display:block;width:100%;border-radius:20px;background:#000}figcaption,.hint{font-size:13px;color:#cfddd4}
h1{font-size:clamp(30px,4vw,48px);line-height:1.15;margin:8px 0 20px}
.tag{color:#f1d18c;font-weight:750;font-size:12px;letter-spacing:.12em}
form{background:#1c3b2e;border:1px solid #c8a95880;border-radius:20px;padding:25px}
fieldset{border:0;padding:0;margin:0 0 23px}legend,label.field{font-weight:750;margin-bottom:9px}
.models,.sizes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.choice{position:relative;display:block;cursor:pointer}.choice input{position:absolute;top:10px;left:10px;accent-color:#a92337}
.choice span{display:block;border:1px solid #9baf9e;border-radius:12px;padding:12px 12px 12px 34px;height:100%;background:#153226}
.choice input:checked+span{border:2px solid #f1d18c;padding:11px 11px 11px 33px;background:#31523e}
.choice input:focus-visible+span{outline:3px solid #fff;outline-offset:3px}
.thumb{height:95px;background-image:url('kersthangers-personalisatie.webp');background-size:200% 200%;border-radius:8px;margin:0 0 9px -21px;background-color:black}
.snow{background-position:left top}.star{background-position:right top}.tree{background-position:left bottom}.ball{background-position:right bottom}
.sizes{grid-template-columns:repeat(3,minmax(0,1fr))}.sizes .choice span{font-size:14px}
label.field{display:block}input[type=text],input[type=number]{display:block;width:100%;padding:12px;border:1px solid #b8cbbb;border-radius:9px;font:inherit;background:#fff;color:#142b23;margin-top:6px}
.hint{margin:6px 0 19px}.price{border-top:1px solid #ffffff30;padding-top:18px;margin-top:20px}
.price strong{font-size:30px;color:#f1d18c}.summary{white-space:pre-line;color:#e5ede6;font-size:14px}
button{width:100%;padding:15px;background:#a92337;color:#fff8e9;border:1px solid #d77b86;border-radius:10px;font:750 16px system-ui;cursor:pointer}button:hover{background:#c12d43}
button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #f1d18c;outline-offset:3px}
@media(max-width:800px){.layout{grid-template-columns:1fr;gap:25px}.photo{max-width:550px;margin:auto}}
@media(max-width:420px){main{padding:25px 15px}form{padding:18px}.sizes{grid-template-columns:1fr}}
</style></head><body>
<header><a href="index.html" aria-label="Makers 3D Labs — Home"><img src="makers3dlabs-logo.webp" alt="Makers 3D Labs"></a></header>
<main><a class="crumb" href="winkel.html">← Terug naar de webshop</a>
<div class="layout"><figure><img class="photo" src="kersthangers-personalisatie.webp" alt="Voorbeeldontwerpen: witte sneeuwvlok met Emma, ster met Noah, kerstboom met Familie de Vries en kerstbal met 2026" width="1254" height="1254">
<figcaption>Voorbeeld van personalisatie. De afbeelding toont witte ontwerpen; jouw gekozen kleur wordt bij de aanvraag besproken. De definitieve uitvoering wordt bevestigd.</figcaption></figure>
<section aria-labelledby="title"><span class="tag">KERST · PERSOONLIJK GEMAAKT</span><h1 id="title">Jouw naam in de kerstboom.</h1>
<p>Kies een model, grootte en gewenste kleur. Eén naam of korte tekst is inbegrepen. Een afwijkend ontwerp bespreken we op aanvraag.</p>
<form id="kh-form">
<fieldset><legend>1. Kies jouw hanger</legend><div class="models">
<label class="choice"><input type="radio" name="model" value="Sneeuwvlok" checked required><span><div class="thumb snow" aria-hidden="true"></div>Sneeuwvlok</span></label>
<label class="choice"><input type="radio" name="model" value="Ster"><span><div class="thumb star" aria-hidden="true"></div>Ster</span></label>
<label class="choice"><input type="radio" name="model" value="Kerstboom"><span><div class="thumb tree" aria-hidden="true"></div>Kerstboom</span></label>
<label class="choice"><input type="radio" name="model" value="Kerstbal"><span><div class="thumb ball" aria-hidden="true"></div>Kerstbal</span></label>
</div></fieldset>
<fieldset><legend>2. Kies de grootte</legend><div class="sizes">
<label class="choice"><input type="radio" name="size" value="8" checked required><span>8 cm<br>€ 8,95</span></label>
<label class="choice"><input type="radio" name="size" value="10"><span>10 cm<br>€ 10,95</span></label>
<label class="choice"><input type="radio" name="size" value="12"><span>12 cm<br>€ 13,95</span></label>
</div><p class="hint">Hoogte van de hanger, zonder ophangkoord. Breedte verschilt per model.</p></fieldset>
<label class="field" for="kh-color">3. Gewenste kleur<input id="kh-color" name="color" type="text" list="kh-colors" maxlength="60" required placeholder="Bijvoorbeeld wit, rood of champagnegoud"></label>
<datalist id="kh-colors"><option value="Wit"><option value="Zwart"><option value="Rood"><option value="Groen"><option value="Goud"><option value="Zilver"></datalist>
<p class="hint">Iedere kleur kan aangevraagd worden. Beschikbaarheid en eventuele meerprijs van speciale kleuren bevestigen we vooraf.</p>
<label class="field" for="kh-text">4. Naam of tekst op de hanger<input id="kh-text" name="text" type="text" required maxlength="40" placeholder="Bijvoorbeeld Emma, Familie de Vries of 2026"></label>
<p class="hint">Maximaal 40 tekens. Controleer de spelling. De opmaak stemmen we af op het gekozen model.</p>
<label class="field" for="kh-qty">5. Aantal met deze tekst en uitvoering<input id="kh-qty" name="qty" type="number" min="1" max="100" step="1" value="1" required></label>
<div class="price" aria-live="polite" aria-atomic="true"><strong id="kh-total">€ 8,95</strong><div id="kh-unit">€ 8,95 per stuk</div><p class="hint">Exclusief verzending. Dit is een aanvraag; prijs, kleur en levertijd worden vóór de bestelling bevestigd.</p><p class="summary" id="kh-summary"></p></div>
<p id="kh-error" role="alert"></p><button type="submit">Vraag deze uitvoering aan →</button>
<p class="hint">Je keuzes gaan mee naar het aanvraagformulier. Daar vul je jouw contactgegevens in en verstuur je de aanvraag. Je betaalt hier nog niet.</p>
</form></section></div></main>
<script>
const f=document.getElementById('kh-form');
const prices={'8':895,'10':1095,'12':1395};
const euro=c=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(c/100);
function selection(){
 const d=new FormData(f),size=d.get('size'),qty=Number(d.get('qty'));
 return {model:d.get('model'),size,color:String(d.get('color')||'').trim(),text:String(d.get('text')||'').trim(),qty,unit:prices[size]};
}
function update(){
 const s=selection(),q=Number.isInteger(s.qty)&&s.qty>=1&&s.qty<=100?s.qty:0;
 document.getElementById('kh-total').textContent=q?euro(s.unit*q):'Kies een geldig aantal';
 document.getElementById('kh-unit').textContent=euro(s.unit)+' per stuk';
 document.getElementById('kh-summary').textContent=s.model+' · '+s.size+' cm'+(s.color?' · '+s.color:'')+(s.text?'\nTekst: '+s.text:'');
}
f.addEventListener('input',update);f.addEventListener('change',update);update();
f.addEventListener('submit',e=>{
 e.preventDefault();const s=selection(),err=document.getElementById('kh-error');
 if(!s.color||!s.text){err.textContent='Vul een kleur en de gewenste naam of tekst in.';return;}
 if(!Object.hasOwn(prices,s.size)||!Number.isInteger(s.qty)||s.qty<1||s.qty>100){err.textContent='Controleer de grootte en het aantal.';return;}
 const description=['Gepersonaliseerde kersthanger','Model: '+s.model,'Hoogte: '+s.size+' cm','Gewenste kleur: '+s.color,'Naam/tekst: '+s.text,'Aantal met deze uitvoering: '+s.qty,'Prijs per stuk: '+euro(s.unit),'Producttotaal exclusief verzending: '+euro(s.unit*s.qty),'Kleur, uitvoering en levertijd graag bevestigen.'].join('\n');
 try{sessionStorage.setItem('makers-kersthanger-aanvraag',JSON.stringify({description,qty:s.qty}));}
 catch(error){err.textContent='Je browser kan de keuzes niet bewaren. Sta sessieopslag toe en probeer opnieuw.';return;}
 location.href='contact.html?product=Kersthanger%20met%20naam#quoteForm';
});
</script><script src="assets/shop-data.js"></script><script src="assets/shop.js"></script>
</body></html>'''

card = '''
    <article class="mk-product" id="kersthanger-product">
      <a class="mk-photo" href="kersthangers.html"><img src="kersthangers-personalisatie.webp" alt="Witte kersthangers met persoonlijke namen en jaartal" loading="lazy"></a>
      <div class="mk-product-info"><span class="mk-category">Kerst · Gepersonaliseerd</span>
        <h3>Kersthanger met naam</h3><strong class="mk-price">Vanaf € 8,95</strong>
        <a class="mk-view" href="kersthangers.html">Kies model, kleur en grootte →</a>
      </div>
    </article>
'''
for name in ("index.html", "winkel.html"):
    if 'id="kersthanger-product"' not in docs[name]:
        docs[name] = docs[name].replace('<div class="mk-grid">', '<div class="mk-grid">' + card, 1)
docs["index.html"] = docs["index.html"].replace(
    'href="contact.html?product=Kersthangers%20met%20naam"',
    'href="kersthangers.html"'
)

prefill = r'''
<script id="kersthanger-aanvraag">
if(new URLSearchParams(location.search).get('product')==='Kersthanger met naam'){
 const pick=document.getElementById('product'),details=document.getElementById('omschrijving'),count=document.getElementById('aantal');
 if(pick&&details&&count){
  if(!Array.from(pick.options).some(o=>o.value==='Kersthanger met naam')){
   const option=document.createElement('option');option.value='Kersthanger met naam';option.textContent='Kersthanger met naam';pick.append(option);
  }
  pick.value='Kersthanger met naam';
  try{
   const raw=sessionStorage.getItem('makers-kersthanger-aanvraag'),data=raw?JSON.parse(raw):null;
   if(data&&typeof data.description==='string'&&data.description.length<=1500&&Number.isInteger(data.qty)&&data.qty>=1&&data.qty<=100){
    details.value=data.description;count.value=String(data.qty);
   }
  }catch(error){details.placeholder='Beschrijf het model, de grootte, gewenste kleur, naam of tekst en het aantal.';}
 }
}
</script>
'''
docs["contact.html"] = re.sub(r'<script id="kersthanger-aanvraag">.*?</script>', '', docs["contact.html"], flags=re.S)
docs["contact.html"] = docs["contact.html"].replace("</body>", prefill + "\n</body>", 1)
for name, content in docs.items():
    backup = root / (name + ".before-kersthangers.bak")
    if not backup.exists():
        backup.write_text(paths[name].read_text(encoding="utf-8"), encoding="utf-8")
    paths[name].write_text(content, encoding="utf-8")
(root / "kersthangers.html").write_text(page, encoding="utf-8")
print("Klaar: kersthangers.html aangemaakt; homepage, webshop en aanvraagformulier gekoppeld.")
print("8 cm: € 8,95 | 10 cm: € 10,95 | 12 cm: € 13,95. Nog niet gepubliceerd.")
