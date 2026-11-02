from pathlib import Path
import re

files = ("index.html", "winkel.html", "contact.html", "kersthangers.html")
if not all(Path(n).exists() for n in files):
    raise SystemExit("Open eerst de projectmap makers-3d-labs.")
if not Path("kleine-cadeaus-kerstsfeer.webp").exists():
    raise SystemExit("Haal eerst de afbeelding binnen met git pull --rebase origin main.")
docs = {n: Path(n).read_text(encoding="utf-8") for n in files}
page = docs["kersthangers.html"]
page = page.replace("kersthangers-personalisatie.webp", "kleine-cadeaus-kerstsfeer.webp")
page = page.replace("Kersthangers met naam |", "Kleine cadeaus op maat |")
page = page.replace("Jouw naam in de kerstboom.", "Een klein cadeau. Persoonlijk gemaakt.")
page = re.sub(r'<meta name="description"[^>]*>', '<meta name="description" content="Persoonlijke sleutelhangers en gegraveerde cadeaulabels. Kies jouw uitvoering, kleur, naam of tekst en aantal.">', page, count=1)
page = re.sub(r'<img class="photo"[^>]*>', '<img class="photo" src="kleine-cadeaus-kerstsfeer.webp" alt="Witte naamsleutelhangers en houten cadeaulabels met tekst in warme kerstsfeer" width="1254" height="1254">', page, count=1)
page = re.sub(r'<figcaption>.*?</figcaption>', '<figcaption>Voorbeeld van personalisatie. Sleutelhangers en cadeaulabels worden op aanvraag gemaakt. De kerstdecoratie op de foto is niet inbegrepen. Uitvoering, materiaal en kleur bevestigen we vooraf.</figcaption>', page, count=1, flags=re.S)
page = page.replace("Kies een model, grootte en gewenste kleur. Eén naam of korte tekst is inbegrepen. Een afwijkend ontwerp bespreken we op aanvraag.", "Een naam, een korte boodschap of een persoonlijk bedankje. Kies jouw cadeau en vertel ons wat je erop wilt laten zetten.")
form = r'''<form id="kh-form">
<fieldset><legend>1. Kies jouw cadeau</legend><div class="models">
<label class="choice"><input type="radio" name="model" value="Naamsleutelhanger" checked required><span>Naamsleutelhanger<br>Sierlijke naamvorm</span></label>
<label class="choice"><input type="radio" name="model" value="Rechthoekige sleutelhanger"><span>Sleutelhanger<br>Rechthoekig label</span></label>
<label class="choice"><input type="radio" name="model" value="Stervormig cadeaulabel"><span>Cadeaulabel<br>Houten ster</span></label>
<label class="choice"><input type="radio" name="model" value="Rechthoekig cadeaulabel"><span>Cadeaulabel<br>Houten rechthoek</span></label>
</div></fieldset>
<label class="field" for="kg-color">2. Gewenste kleur of afwerking<input id="kg-color" name="color" type="text" maxlength="60" required placeholder="Bijvoorbeeld wit, bordeauxrood of naturel hout"></label>
<p class="hint">Alle kleuren zijn aan te vragen voor de geprinte sleutelhangers. De cadeaulabels op de foto zijn naturel hout met gravure; andere afwerkingen bespreken we vooraf.</p>
<label class="field" for="kg-text">3. Naam of tekst<input id="kg-text" name="text" type="text" maxlength="60" required placeholder="Bijvoorbeeld Emma, Voor jou of Fijne kerst"></label>
<p class="hint">Maximaal 60 tekens. Controleer de spelling. De beschikbare tekstruimte hangt af van het model; de opmaak bevestigen we vooraf.</p>
<label class="field" for="kg-qty">4. Aantal met deze tekst en uitvoering<input id="kg-qty" name="qty" type="number" min="1" max="100" step="1" value="1" required></label>
<label class="field" for="kg-notes">5. Extra wensen (optioneel)<textarea id="kg-notes" name="notes" maxlength="500" rows="3" placeholder="Bijvoorbeeld de gewenste afmeting of meerdere verschillende namen."></textarea></label>
<div class="price" aria-live="polite" aria-atomic="true"><strong id="kh-total">Prijs op aanvraag</strong><p class="summary" id="kh-summary"></p><p class="hint">Je ontvangt vooraf een prijs voor jouw uitvoering, inclusief eventuele verzendkosten. Dit is een aanvraag, nog geen bestelling.</p></div>
<p id="kh-error" role="alert"></p><button type="submit"><span aria-hidden="true">🎄</span> Vraag jouw persoonlijke cadeau aan →</button>
<p class="hint">Je keuzes gaan mee naar het aanvraagformulier. Daar voeg je contactgegevens toe en verstuur je de aanvraag.</p>
</form>'''
page, count = re.subn(r'<form id="kh-form">.*?</form>', lambda _: form, page, count=1, flags=re.S)
if count != 1:
    raise SystemExit("Productformulier niet gevonden. Er is niets gewijzigd.")
script = r'''<script>
const f=document.getElementById('kh-form');
const models=['Naamsleutelhanger','Rechthoekige sleutelhanger','Stervormig cadeaulabel','Rechthoekig cadeaulabel'];
function selection(){
 const d=new FormData(f);
 return {model:d.get('model'),color:String(d.get('color')||'').trim(),text:String(d.get('text')||'').trim(),qty:Number(d.get('qty')),notes:String(d.get('notes')||'').trim()};
}
function update(){
 const s=selection();
 document.getElementById('kh-summary').textContent=s.model+(s.color?' · '+s.color:'')+(s.text?'\nTekst: '+s.text:'')+'\nAantal: '+s.qty;
}
f.addEventListener('input',update);f.addEventListener('change',update);update();
f.addEventListener('submit',e=>{
 e.preventDefault();const s=selection(),err=document.getElementById('kh-error');
 if(!models.includes(s.model)||!s.color||!s.text||!Number.isInteger(s.qty)||s.qty<1||s.qty>100){
  err.textContent='Kies een model, vul een kleur of afwerking en tekst in, en kies een aantal van 1 tot 100.';return;
 }
 const description=['Kleine cadeaus op maat','Uitvoering: '+s.model,'Gewenste kleur/afwerking: '+s.color,'Naam/tekst: '+s.text,'Aantal met deze uitvoering: '+s.qty,'Extra wensen: '+(s.notes||'Geen'),'Graag een prijsopgave en bevestiging van afmetingen, materiaal, kleur en levertijd.'].join('\n');
 try{sessionStorage.setItem('makers-kleine-cadeaus-aanvraag',JSON.stringify({description,qty:s.qty}));}
 catch(error){err.textContent='Je browser kan de keuzes niet bewaren. Sta sessieopslag toe en probeer opnieuw.';return;}
 location.href='contact.html?product=Kleine%20cadeaus%20op%20maat#quoteForm';
});
</script>'''
page, count = re.subn(r'<script>\s*const f=document.getElementById\(\x27kh-form\x27\);.*?</script>', lambda _: script, page, count=1, flags=re.S)
if count != 1:
    raise SystemExit("Productscript niet gevonden. Er is niets gewijzigd.")
extra = '''<style id="kleine-cadeaus-keuzes">
#kh-form .models{grid-template-columns:repeat(2,minmax(0,1fr))}
#kh-form .models .choice>span{display:block;min-height:75px;padding:24px 8px 10px;font-size:13px;text-align:center}
#kh-form .models .choice input:checked+span{padding:23px 7px 9px}
#kh-form textarea{box-sizing:border-box;display:block;width:100%;margin-top:6px;padding:12px;background:#203e33;color:#fff3d6;border:1px solid #809483;border-radius:9px;font:inherit;resize:vertical}
#kh-form textarea::placeholder{color:#b8c8be;opacity:1}
#kh-form textarea:focus-visible{outline:3px solid #e5c887;outline-offset:3px}
@media(max-width:360px){#kh-form .models{grid-template-columns:1fr}}
</style>'''
page = page.replace("</head>", extra + "\n</head>", 1)
card = '''<article class="mk-product" id="kleine-cadeaus-product">
<a class="mk-photo" href="kleine-cadeaus.html"><img src="kleine-cadeaus-kerstsfeer.webp" alt="Persoonlijke sleutelhangers en gegraveerde cadeaulabels" loading="lazy"></a>
<div class="mk-product-info"><span class="mk-category">Kerst · Persoonlijk cadeau</span><h3>Kleine cadeaus op maat</h3><strong class="mk-price">Prijs op aanvraag</strong><a class="mk-view" href="kleine-cadeaus.html">Kies jouw cadeau →</a></div>
</article>'''
for name in ("index.html", "winkel.html"):
    if 'id="kleine-cadeaus-product"' not in docs[name]:
        if '<div class="mk-grid">' not in docs[name]:
            raise SystemExit("Productraster ontbreekt. Niets opgeslagen.")
        docs[name] = docs[name].replace('<div class="mk-grid">', '<div class="mk-grid">' + card, 1)
    style = re.search(r'<style id="kh-webshop-kerstkaart">.*?</style>', docs[name], re.S)
    if style and 'id="kleine-cadeaus-kaartstijl"' not in docs[name]:
        duplicate = style.group(0).replace('id="kh-webshop-kerstkaart"', 'id="kleine-cadeaus-kaartstijl"').replace("#kersthanger-product", "#kleine-cadeaus-product")
        docs[name] = docs[name].replace("</head>", duplicate + "\n</head>", 1)
heading = "<h3>Kleine cadeaus op maat</h3>"
image = '<img class="kerst-voorbeeld" src="kleine-cadeaus-kerstsfeer.webp" alt="Voorbeeld van kleine persoonlijke kerstcadeaus" width="1254" height="1254" loading="lazy">'
if image not in docs["index.html"]:
    docs["index.html"] = docs["index.html"].replace(heading, image + "\n" + heading, 1)
docs["index.html"] = docs["index.html"].replace('href="contact.html?product=Persoonlijk%20kerstcadeau"', 'href="kleine-cadeaus.html"')
prefill = r'''<script id="kleine-cadeaus-aanvraag">
if(new URLSearchParams(location.search).get('product')==='Kleine cadeaus op maat'){
 const pick=document.getElementById('product'),details=document.getElementById('omschrijving'),count=document.getElementById('aantal');
 if(pick&&details&&count){
  if(!Array.from(pick.options).some(o=>o.value==='Kleine cadeaus op maat')){const option=document.createElement('option');option.value='Kleine cadeaus op maat';option.textContent=option.value;pick.append(option);}
  pick.value='Kleine cadeaus op maat';
  try{const data=JSON.parse(sessionStorage.getItem('makers-kleine-cadeaus-aanvraag')||'null');
   if(data&&typeof data.description==='string'&&data.description.length<=1500&&Number.isInteger(data.qty)&&data.qty>=1&&data.qty<=100){details.value=data.description;count.value=String(data.qty);}
  }catch(error){details.placeholder='Beschrijf de uitvoering, kleur, naam of tekst en het aantal.';}
 }
}
</script>'''
docs["contact.html"] = re.sub(r'<script id="kleine-cadeaus-aanvraag">.*?</script>', '', docs["contact.html"], flags=re.S)
docs["contact.html"] = docs["contact.html"].replace("</body>", prefill + "\n</body>", 1)
for name in ("index.html", "winkel.html", "contact.html"):
    backup = Path(name + ".before-kleine-cadeaus.bak")
    if not backup.exists():
        backup.write_text(Path(name).read_text(encoding="utf-8"), encoding="utf-8")
    Path(name).write_text(docs[name], encoding="utf-8")
Path("kleine-cadeaus.html").write_text(page, encoding="utf-8")
print("Klaar: kleine-cadeaus.html gemaakt en gekoppeld aan homepage, webshop en aanvraagformulier.")
print("Voorlopig prijs op aanvraag. Nog niet gepubliceerd.")
