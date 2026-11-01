from pathlib import Path
import re

names = ("index.html", "winkel.html", "contact.html", "kersthangers.html")
if not all(Path(n).exists() for n in names):
    raise SystemExit("Voer dit uit in de projectmap makers-3d-labs.")
if not Path("kersthangers-bedrijfslogo.webp").exists():
    raise SystemExit("Haal eerst de afbeelding binnen met git pull --rebase origin main.")
docs = {n: Path(n).read_text(encoding="utf-8") for n in names}
page = docs["kersthangers.html"]
page = page.replace("kersthangers-personalisatie.webp", "kersthangers-bedrijfslogo.webp")
page = page.replace("Kersthangers met naam |", "Kersthangers met bedrijfslogo |")
page = page.replace("Jouw naam in de kerstboom.", "Jouw bedrijfslogo in de kerstboom.")
page = page.replace("Sneeuwvlok, ster, kerstboom of kerstbal", "ronde kerstbal, ster of kerstboom")
page = page.replace("Kies sneeuwvlok, ster, kerstboom of kerstbal", "Kies ronde kerstbal, ster of kerstboom")
page = page.replace('alt="Voorbeeldontwerpen: witte sneeuwvlok met Emma, ster met Noah, kerstboom met Familie de Vries en kerstbal met 2026"', 'alt="Voorbeeld: witte ronde kerstbal, ster en kerstboom met JOUW LOGO als voorbeeldopdruk"')
page = page.replace("Voorbeeld van personalisatie. De afbeelding toont witte ontwerpen; jouw gekozen kleur wordt bij de aanvraag besproken. De definitieve uitvoering wordt bevestigd.", "Voorbeeldontwerpen met een logo als opdruk. Upload jouw bedrijfslogo bij de aanvraag; kleur en definitieve uitvoering bevestigen we vooraf.")
page = page.replace("Eén naam of korte tekst is inbegrepen. Een afwijkend ontwerp bespreken we op aanvraag.", "Personalisatie met jouw bedrijfslogo is inbegrepen. Upload je logo in de volgende stap; de uitvoering wordt vooraf bevestigd.")
page = re.sub(r'<div class="models">.*?</div></fieldset>', '''<div class="models">
<label class="choice"><input type="radio" name="model" value="Ronde kerstbal" checked required><span>Ronde kerstbal</span></label>
<label class="choice"><input type="radio" name="model" value="Ster"><span>Ster</span></label>
<label class="choice"><input type="radio" name="model" value="Kerstboom"><span>Kerstboom</span></label>
</div></fieldset>''', page, count=1, flags=re.S)
page = page.replace("4. Naam of tekst op de hanger", "4. Bedrijfsnaam bij jouw logo")
page = page.replace('maxlength="40" placeholder="Bijvoorbeeld Emma, Familie de Vries of 2026"', 'maxlength="40" placeholder="Vul jouw bedrijfsnaam in"')
page = page.replace("Maximaal 40 tekens. Controleer de spelling. De opmaak stemmen we af op het gekozen model.", "Je uploadt het logo in de volgende stap als PNG, JPG of WebP. De bedrijfsnaam helpt ons de aanvraag te herkennen.")
page = page.replace("5. Aantal met deze tekst en uitvoering", "5. Aantal met dit logo en deze uitvoering")
page = page.replace("makers-kersthanger-aanvraag", "makers-bedrijfskerst-aanvraag")
page = page.replace("Kersthanger%20met%20naam", "Kersthanger%20met%20bedrijfslogo")
page = page.replace("'Gepersonaliseerde kersthanger'", "'Kersthanger met bedrijfslogo'")
page = page.replace("Naam/tekst: ", "Bedrijfsnaam: ")
page = page.replace("\\nTekst: ", "\\nBedrijf: ")
page = page.replace("Vul een kleur en de gewenste naam of tekst in.", "Vul een gewenste kleur en jouw bedrijfsnaam in.")
extra = '''<style id="bedrijfskerst-modellen">
#kh-form .models{grid-template-columns:repeat(3,minmax(0,1fr))}
#kh-form .models .choice > span{display:flex;align-items:center;justify-content:center;min-height:72px;padding:25px 8px 10px;font-size:13px;text-align:center}
#kh-form .models .choice input:checked + span{padding:24px 7px 9px}
@media(max-width:420px){#kh-form .models{grid-template-columns:1fr}#kh-form .models .choice > span{min-height:48px;justify-content:flex-start;padding:12px 12px 12px 35px}#kh-form .models .choice input:checked + span{padding:11px 11px 11px 34px}}
</style>'''
page = page.replace("</head>", extra + "\n</head>", 1)

card = '''<article class="mk-product" id="bedrijfskerst-product">
<a class="mk-photo" href="kersthangers-bedrijfslogo.html"><img src="kersthangers-bedrijfslogo.webp" alt="Witte kersthangers met JOUW LOGO als voorbeeldopdruk" loading="lazy"></a>
<div class="mk-product-info"><span class="mk-category">Kerst · Zakelijk</span><h3>Kersthanger met bedrijfslogo</h3><strong class="mk-price">Vanaf € 8,95</strong><a class="mk-view" href="kersthangers-bedrijfslogo.html">Kies model, kleur en grootte →</a></div>
</article>'''
for name in ("index.html", "winkel.html"):
    if 'id="bedrijfskerst-product"' not in docs[name]:
        if '<div class="mk-grid">' not in docs[name]:
            raise SystemExit("Productraster ontbreekt. Er is niets opgeslagen.")
        docs[name] = docs[name].replace('<div class="mk-grid">', '<div class="mk-grid">' + card, 1)
    styles = re.search(r'<style id="kh-webshop-kerstkaart">.*?</style>', docs[name], re.S)
    if styles and 'id="bedrijfskerst-kaartstijl"' not in docs[name]:
        duplicate = styles.group(0).replace('id="kh-webshop-kerstkaart"', 'id="bedrijfskerst-kaartstijl"').replace("#kersthanger-product", "#bedrijfskerst-product")
        docs[name] = docs[name].replace("</head>", duplicate + "\n</head>", 1)
docs["index.html"] = docs["index.html"].replace('href="contact.html?product=Kerstdecoratie%20met%20bedrijfslogo"', 'href="kersthangers-bedrijfslogo.html"')
prefill = r'''<script id="bedrijfskerst-aanvraag">
if(new URLSearchParams(location.search).get('product')==='Kersthanger met bedrijfslogo'){
 const pick=document.getElementById('product'),details=document.getElementById('omschrijving'),count=document.getElementById('aantal'),upload=document.getElementById('fotos');
 if(pick&&details&&count&&upload){
  if(!Array.from(pick.options).some(o=>o.value==='Kersthanger met bedrijfslogo')){
   const option=document.createElement('option');option.value='Kersthanger met bedrijfslogo';option.textContent=option.value;pick.append(option);
  }
  pick.value='Kersthanger met bedrijfslogo';upload.required=true;
  const label=document.querySelector('label[for="fotos"]');
  if(label)label.textContent='Upload jouw bedrijfslogo (verplicht: PNG, JPG of WebP)';
  const hint=document.getElementById('fotoHint');
  if(hint)hint.textContent='Voeg je logo toe als PNG, JPG of WebP. Maximaal 5 bestanden, samen 9 MB. Een scherpe PNG met transparante achtergrond heeft de voorkeur.';
  try{
   const data=JSON.parse(sessionStorage.getItem('makers-bedrijfskerst-aanvraag')||'null');
   if(data&&typeof data.description==='string'&&data.description.length<=1500&&Number.isInteger(data.qty)&&data.qty>=1&&data.qty<=100){details.value=data.description;count.value=String(data.qty);}
  }catch(error){details.placeholder='Beschrijf model, grootte, kleur, bedrijfsnaam en aantal.';}
 }
}
</script>'''
docs["contact.html"] = re.sub(r'<script id="bedrijfskerst-aanvraag">.*?</script>', '', docs["contact.html"], flags=re.S)
docs["contact.html"] = docs["contact.html"].replace("</body>", prefill + "\n</body>", 1)
for name in ("index.html", "winkel.html", "contact.html"):
    backup = Path(name + ".before-bedrijfskerst.bak")
    if not backup.exists():
        backup.write_text(Path(name).read_text(encoding="utf-8"), encoding="utf-8")
    Path(name).write_text(docs[name], encoding="utf-8")
Path("kersthangers-bedrijfslogo.html").write_text(page, encoding="utf-8")
print("Klaar: bedrijfskersthangers toegevoegd aan homepage en webshop.")
print("8 cm €8,95 | 10 cm €10,95 | 12 cm €13,95. Logo uploaden bij aanvraag. Nog niet gepubliceerd.")
