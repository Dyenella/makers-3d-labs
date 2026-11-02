from pathlib import Path
import re

files = ("index.html", "winkel.html", "contact.html", "kersthangers.html")
if not all(Path(n).exists() for n in files):
    raise SystemExit("Open eerst de projectmap makers-3d-labs.")
if not Path("persoonlijke-kersttafel.webp").exists():
    raise SystemExit("Haal eerst de afbeelding binnen met git pull --rebase origin main.")
docs = {n: Path(n).read_text(encoding="utf-8") for n in files}
page = docs["kersthangers.html"]
page = page.replace("kersthangers-personalisatie.webp", "persoonlijke-kersttafel.webp")
page = page.replace("Kersthangers met naam |", "Persoonlijke kersttafel |")
page = page.replace("Jouw naam in de kerstboom.", "Jouw naam aan de kersttafel.")
page = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Gepersonaliseerde naamkaartjes en servetringen voor de kersttafel. Kies jouw uitvoering, gewenste kleur en de namen van je gasten.">', page, count=1)
page = re.sub(r'<img class="photo"[^>]*>', '<img class="photo" src="persoonlijke-kersttafel.webp" alt="Voorbeeld van een feesttafel met wit naamkaartje Emma en witte servetring met naam Noah" width="1254" height="1254">', page, count=1)
page = re.sub(r'<figcaption>.*?</figcaption>', '<figcaption>Voorbeeld van personalisatie. De producten zijn het naamkaartje en de servetring; servies, servetten en overige tafeldecoratie zijn niet inbegrepen. Kleur en uitvoering bevestigen we vooraf.</figcaption>', page, count=1, flags=re.S)
page = page.replace("Kies een model, grootte en gewenste kleur. Eén naam of korte tekst is inbegrepen. Een afwijkend ontwerp bespreken we op aanvraag.", "Maak iedere plek aan tafel persoonlijk. Kies naamkaartjes, servetringen met naam of een combinatie per gast. Vul de namen in en vraag jouw uitvoering aan.")
form = r'''<form id="kh-form">
<fieldset><legend>1. Kies jouw uitvoering</legend><div class="models">
<label class="choice"><input type="radio" name="model" value="naamkaartje" checked required><span>Naamkaartje<br>€ 3,95 per gast</span></label>
<label class="choice"><input type="radio" name="model" value="servetring"><span>Servetring met naam<br>€ 4,95 per gast</span></label>
<label class="choice"><input type="radio" name="model" value="combinatie"><span>Naamkaartje + servetring<br>€ 7,95 per gast</span></label>
</div></fieldset>
<label class="field" for="kt-color">2. Gewenste kleur<input id="kt-color" name="color" type="text" list="kt-colors" maxlength="60" required placeholder="Bijvoorbeeld wit, champagnegoud of bordeauxrood"></label>
<datalist id="kt-colors"><option value="Wit"><option value="Goud"><option value="Rood"><option value="Groen"><option value="Zilver"></datalist>
<p class="hint">Iedere kleur is aan te vragen. Typ jouw kleur of kies een suggestie. Beschikbaarheid en eventuele meerprijs voor speciale kleuren bevestigen we vooraf.</p>
<label class="field" for="kt-names">3. Namen van jouw gasten<textarea id="kt-names" name="names" rows="5" maxlength="3100" required placeholder="Emma&#10;Noah&#10;Sophie"></textarea></label>
<p class="hint">Eén naam per regel. Elke regel is één gast; het aantal en de prijs worden automatisch berekend. Maximaal 100 gasten en 30 tekens per naam. Herhaal een naam als je die vaker nodig hebt.</p>
<label class="field" for="kt-notes">4. Extra wensen (optioneel)<textarea id="kt-notes" name="notes" rows="2" maxlength="500" placeholder="Bijvoorbeeld een ster, een andere maat of een kleur per gast."></textarea></label>
<p class="hint">De prijzen gelden voor de standaarduitvoering. Formaat en opmaak worden vooraf afgestemd; afwijkend maatwerk kan een andere prijs hebben.</p>
<div class="price" aria-live="polite" aria-atomic="true"><strong id="kh-total">Vul namen in</strong><div id="kh-unit">€ 3,95 per gast</div><p class="hint">Exclusief verzending. Dit is een aanvraag; uitvoering, definitieve prijs en levertijd worden vóór de bestelling bevestigd.</p><p class="summary" id="kh-summary"></p></div>
<p id="kh-error" role="alert"></p><button type="submit"><span aria-hidden="true">🎄</span> Vraag deze kersttafel aan →</button>
<p class="hint">Je keuzes en gastenlijst gaan mee naar het aanvraagformulier. Daar voeg je contactgegevens toe en verstuur je de aanvraag. Je betaalt hier nog niet.</p>
</form>'''
page, count = re.subn(r'<form id="kh-form">.*?</form>', lambda _: form, page, count=1, flags=re.S)
if count != 1:
    raise SystemExit("Productformulier niet gevonden. Niets gewijzigd.")
script = r'''<script>
const f=document.getElementById('kh-form');
const prices={naamkaartje:395,servetring:495,combinatie:795};
const labels={naamkaartje:'Naamkaartje',servetring:'Servetring met naam',combinatie:'Naamkaartje + servetring'};
const euro=c=>new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR'}).format(c/100);
function selection(){
 const d=new FormData(f),model=d.get('model');
 return {model,color:String(d.get('color')||'').trim(),names:String(d.get('names')||'').split(/\r?\n/).map(n=>n.trim()).filter(Boolean),notes:String(d.get('notes')||'').trim(),unit:prices[model]};
}
function update(){
 const s=selection(),valid=s.names.length>0&&s.names.length<=100&&s.names.every(n=>n.length<=30);
 document.getElementById('kh-total').textContent=valid?euro(s.unit*s.names.length):'Vul geldige namen in';
 document.getElementById('kh-unit').textContent=euro(s.unit)+' per gast';
 document.getElementById('kh-summary').textContent=labels[s.model]+' · '+s.names.length+' gasten'+(s.color?' · '+s.color:'');
}
f.addEventListener('input',update);f.addEventListener('change',update);update();
f.addEventListener('submit',e=>{
 e.preventDefault();const s=selection(),err=document.getElementById('kh-error');
 if(!s.color||!Object.hasOwn(prices,s.model)||s.names.length<1||s.names.length>100||s.names.some(n=>n.length>30)){
  err.textContent='Vul een kleur en 1 tot 100 namen in, maximaal 30 tekens per naam.';return;
 }
 const description=['Persoonlijke kersttafel','Uitvoering: '+labels[s.model],'Gewenste kleur: '+s.color,'Aantal gasten: '+s.names.length,'Prijs per gast: '+euro(s.unit),'Producttotaal exclusief verzending: '+euro(s.unit*s.names.length),'Namen:',...s.names,'Extra wensen: '+(s.notes||'Geen'),'Formaat, opmaak, kleur en levertijd graag bevestigen.'].join('\n');
 if(description.length>3000){err.textContent='De gastenlijst is te lang voor het formulier. Kort de tekst in of splits de aanvraag.';return;}
 try{sessionStorage.setItem('makers-kersttafel-aanvraag',JSON.stringify({description,qty:s.names.length}));}
 catch(error){err.textContent='Je browser kan de keuzes niet bewaren. Sta sessieopslag toe en probeer opnieuw.';return;}
 location.href='contact.html?product=Persoonlijke%20kersttafel#quoteForm';
});
</script>'''
page, count = re.subn(r'<script>\s*const f=document.getElementById\(\x27kh-form\x27\);.*?</script>', lambda _: script, page, count=1, flags=re.S)
if count != 1:
    raise SystemExit("Productscript niet gevonden. Niets gewijzigd.")
extra = '''<style id="kersttafel-formulier">
#kh-form .models{grid-template-columns:repeat(3,minmax(0,1fr))}
#kh-form .models .choice>span{display:block;min-height:90px;padding:28px 8px 10px;font-size:13px;text-align:center}
#kh-form .models .choice input:checked+span{padding:27px 7px 9px}
#kh-form textarea{box-sizing:border-box;display:block;width:100%;margin-top:6px;padding:12px;background:#203e33;color:#fff3d6;border:1px solid #809483;border-radius:9px;font:inherit;resize:vertical}
#kh-form textarea::placeholder{color:#b8c8be;opacity:1}
#kh-form textarea:focus-visible{outline:3px solid #e5c887;outline-offset:3px}
@media(max-width:540px){#kh-form .models{grid-template-columns:1fr}#kh-form .models .choice>span{min-height:48px;padding:12px 12px 12px 35px;text-align:left}#kh-form .models .choice input:checked+span{padding:11px 11px 11px 34px}}
</style>'''
page = page.replace("</head>", extra + "\n</head>", 1)

card = '''<article class="mk-product" id="kersttafel-product">
<a class="mk-photo" href="persoonlijke-kersttafel.html"><img src="persoonlijke-kersttafel.webp" alt="Gepersonaliseerde naamkaartjes en servetringen op een kersttafel" loading="lazy"></a>
<div class="mk-product-info"><span class="mk-category">Kerst · Aan tafel</span><h3>Een persoonlijke kersttafel</h3><strong class="mk-price">Vanaf € 3,95 per gast</strong><a class="mk-view" href="persoonlijke-kersttafel.html">Kies jouw uitvoering →</a></div>
</article>'''
for name in ("index.html", "winkel.html"):
    if 'id="kersttafel-product"' not in docs[name]:
        if '<div class="mk-grid">' not in docs[name]:
            raise SystemExit("Productraster ontbreekt. Er is niets opgeslagen.")
        docs[name] = docs[name].replace('<div class="mk-grid">', '<div class="mk-grid">' + card, 1)
    style = re.search(r'<style id="kh-webshop-kerstkaart">.*?</style>', docs[name], re.S)
    if style and 'id="kersttafel-kaartstijl"' not in docs[name]:
        duplicate = style.group(0).replace('id="kh-webshop-kerstkaart"', 'id="kersttafel-kaartstijl"').replace("#kersthanger-product", "#kersttafel-product")
        docs[name] = docs[name].replace("</head>", duplicate + "\n</head>", 1)
heading = "<h3>Een persoonlijke kersttafel</h3>"
image = '<img class="kerst-voorbeeld" src="persoonlijke-kersttafel.webp" alt="Voorbeeld van persoonlijke naamkaartjes en servetringen voor de kersttafel" width="1254" height="1254" loading="lazy">'
if image not in docs["index.html"]:
    docs["index.html"] = docs["index.html"].replace(heading, image + "\n" + heading, 1)
docs["index.html"] = docs["index.html"].replace('href="contact.html?product=Gepersonaliseerde%20kersttafel"', 'href="persoonlijke-kersttafel.html"')
prefill = r'''<script id="kersttafel-aanvraag">
if(new URLSearchParams(location.search).get('product')==='Persoonlijke kersttafel'){
 const pick=document.getElementById('product'),details=document.getElementById('omschrijving'),count=document.getElementById('aantal');
 if(pick&&details&&count){
  if(!Array.from(pick.options).some(o=>o.value==='Persoonlijke kersttafel')){const option=document.createElement('option');option.value='Persoonlijke kersttafel';option.textContent=option.value;pick.append(option);}
  pick.value='Persoonlijke kersttafel';
  try{const data=JSON.parse(sessionStorage.getItem('makers-kersttafel-aanvraag')||'null');
   if(data&&typeof data.description==='string'&&data.description.length<=3000&&Number.isInteger(data.qty)&&data.qty>=1&&data.qty<=100){details.value=data.description;count.value=String(data.qty);}
  }catch(error){details.placeholder='Beschrijf de uitvoering, kleur en namen van je gasten.';}
 }
}
</script>'''
docs["contact.html"] = re.sub(r'<script id="kersttafel-aanvraag">.*?</script>', '', docs["contact.html"], flags=re.S)
docs["contact.html"] = docs["contact.html"].replace("</body>", prefill + "\n</body>", 1)
for name in ("index.html", "winkel.html", "contact.html"):
    backup = Path(name + ".before-kersttafel.bak")
    if not backup.exists():
        backup.write_text(Path(name).read_text(encoding="utf-8"), encoding="utf-8")
    Path(name).write_text(docs[name], encoding="utf-8")
Path("persoonlijke-kersttafel.html").write_text(page, encoding="utf-8")
print("Klaar: kersttafelpagina gemaakt en gekoppeld aan homepage, webshop en aanvraagformulier.")
print("Voorstel: naamkaartje €3,95 | servetring met naam €4,95 | combinatie €7,95 per gast. Nog niet gepubliceerd.")
