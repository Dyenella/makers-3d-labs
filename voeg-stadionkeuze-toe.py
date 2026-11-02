from pathlib import Path
from html import escape
import re

p = Path("voetbalstadion-deluxe.html")
contact = Path("contact.html")
if not p.exists() or not contact.exists():
    raise SystemExit("Open eerst de projectmap makers-3d-labs.")
html = p.read_text(encoding="utf-8")
contact_html = contact.read_text(encoding="utf-8")
if 'id="stadion-keuze"' in html:
    raise SystemExit("De stadionkeuze is al toegevoegd. Er is niets gewijzigd.")
if '<form id="product-form">' not in html or 'const form = document.getElementById("product-form");' not in html:
    raise SystemExit("De productpagina is veranderd. Er is niets gewijzigd.")

nl = [
("ADO Den Haag", "WerkTalent Stadion", "Den Haag"),
("Ajax", "Johan Cruijff ArenA", "Amsterdam"),
("Almere City FC", "Yanmar Stadion", "Almere"),
("AZ", "AFAS Stadion", "Alkmaar"),
("De Graafschap", "De Vijverberg", "Doetinchem"),
("Excelsior", "Woudestein", "Rotterdam"),
("FC Den Bosch", "De Vliert", "'s-Hertogenbosch"),
("FC Dordrecht", "De Krommedijk", "Dordrecht"),
("FC Eindhoven", "Jan Louwers Stadion", "Eindhoven"),
("FC Emmen", "De Oude Meerdijk", "Emmen"),
("FC Groningen", "Euroborg", "Groningen"),
("FC Twente", "De Grolsch Veste", "Enschede"),
("FC Utrecht", "Stadion Galgenwaard", "Utrecht"),
("FC Volendam", "Kras Stadion", "Volendam"),
("Feyenoord", "De Kuip", "Rotterdam"),
("Fortuna Sittard", "Fortuna Sittard Stadion", "Sittard"),
("Go Ahead Eagles", "De Adelaarshorst", "Deventer"),
("Helmond Sport", "MySteel Stadion", "Helmond"),
("Heracles Almelo", "Asito Stadion", "Almelo"),
("MVV Maastricht", "De Geusselt", "Maastricht"),
("NAC Breda", "Rat Verlegh Stadion", "Breda"),
("N.E.C.", "De Goffert", "Nijmegen"),
("PEC Zwolle", "MAC3PARK Stadion", "Zwolle"),
("PSV", "Philips Stadion", "Eindhoven"),
("RKC Waalwijk", "Mandemakers Stadion", "Waalwijk"),
("Roda JC", "Parkstad Limburg Stadion", "Kerkrade"),
("SC Cambuur", "Kooi Stadion", "Leeuwarden"),
("sc Heerenveen", "Abe Lenstra Stadion", "Heerenveen"),
("Sparta Rotterdam", "Het Kasteel", "Rotterdam"),
("Telstar", "Schoonenberg", "Velsen-Zuid"),
("TOP Oss", "Frans Heesen Stadion", "Oss"),
("Vitesse", "GelreDome", "Arnhem"),
("VVV-Venlo", "De Koel", "Venlo"),
("Willem II", "Koning Willem II Stadion", "Tilburg"),
]
jong = [
("Jong Ajax", "De Toekomst", "Amsterdam-Duivendrecht"),
("Jong AZ", "AFAS Trainingscomplex", "Wijdewormer"),
("Jong PSV", "De Herdgang", "Eindhoven"),
("Jong FC Utrecht", "Sportcomplex Zoudenbalch", "Utrecht"),
]
world = [
"Camp Nou — FC Barcelona — Barcelona, Spanje",
"Santiago Bernabéu — Real Madrid — Madrid, Spanje",
"Wembley Stadium — Londen, Engeland",
"San Siro / Giuseppe Meazza — Milaan, Italië",
"Maracanã — Rio de Janeiro, Brazilië",
]
def option(text):
    return '<option value="' + escape(text, quote=True) + '">' + escape(text) + '</option>'
def club_option(row):
    club, stadium, city = row
    return option(club + " — " + stadium + " — " + city)
choices = '<option value="">Kies jouw stadion</option>'
choices += '<optgroup label="Nederlandse profclubs">' + "".join(club_option(row) for row in sorted(nl)) + '</optgroup>'
choices += '<optgroup label="Jong-teams — thuislocaties">' + "".join(club_option(row) for row in jong) + '</optgroup>'
choices += '<optgroup label="Bekende internationale stadions">' + "".join(option(t) for t in world) + '</optgroup>'
choices += '<option value="ander">Ander stadion — zelf invullen</option>'
block = '''
<section id="stadion-keuze" aria-labelledby="stadion-label">
<h2 id="stadion-label">Kies jouw stadion</h2>
<label for="stadion-select">Club en stadion *</label>
<select id="stadion-select" required>''' + choices + '''</select>
<div id="ander-stadion-velden" hidden>
<label for="ander-stadion">Naam van het stadion *</label>
<input id="ander-stadion" type="text" maxlength="120" disabled placeholder="Vul de stadionnaam in">
<label for="stadion-locatie">Club, stad en land *</label>
<input id="stadion-locatie" type="text" maxlength="160" disabled placeholder="Bijvoorbeeld clubnaam, stad en land">
</div>
<p class="product-info">Stadionnamen staan soms onder hun bekende naam. Kies ‘Ander stadion’ voor een andere of historische uitvoering. Haalbaarheid, definitieve prijs en levertijd worden vooraf bevestigd. De foto toont een voorbeeldmodel.</p>
</section>
'''
html = html.replace('<form id="product-form">', '<form id="product-form">' + block, 1)
css = '''<style id="stadion-keuze-stijl">
#stadion-keuze{padding:17px;background:#edf5f1;border:1px solid #c5dacf;border-radius:12px;margin-bottom:16px}
#stadion-keuze h2{font-size:18px;margin:0 0 10px}
#stadion-keuze label{display:block;font-size:13px;font-weight:700;margin:10px 0 5px}
#stadion-keuze select,#stadion-keuze input{display:block;box-sizing:border-box;width:100%;max-width:100%;padding:12px;border:1px solid #a7c2b5;border-radius:8px;background:#fff;color:#152a2e;font:inherit;font-size:14px}
#stadion-keuze .product-info{font-size:12px;margin:12px 0 0}
#stadion-keuze :focus-visible{outline:3px solid #128c80;outline-offset:3px}
#ander-stadion-velden[hidden]{display:none}
</style>'''
html = html.replace("</head>", css + "\n</head>", 1)
setup = r'''
const stadiumSelect=document.getElementById('stadion-select');
const customStadium=document.getElementById('ander-stadion');
const stadiumLocation=document.getElementById('stadion-locatie');
function toggleCustomStadium(){
 const custom=stadiumSelect.value==='ander';
 document.getElementById('ander-stadion-velden').hidden=!custom;
 [customStadium,stadiumLocation].forEach(field=>{field.disabled=!custom;field.required=custom;});
}
stadiumSelect.addEventListener('change',toggleCustomStadium);toggleCustomStadium();
function selectedStadium(){
 return stadiumSelect.value==='ander' ? customStadium.value.trim()+' — '+stadiumLocation.value.trim() : stadiumSelect.value;
}
'''
html = html.replace('const form = document.getElementById("product-form");', 'const form = document.getElementById("product-form");\n' + setup, 1)
html = html.replace('  event.preventDefault();', '''  event.preventDefault();
  if(!stadiumSelect.value || (stadiumSelect.value==='ander' && (!customStadium.value.trim() || !stadiumLocation.value.trim()))){
    stadiumSelect.setCustomValidity(!stadiumSelect.value?'Kies een stadion.':'');
    if(stadiumSelect.value==='ander'){customStadium.setCustomValidity(customStadium.value.trim()?'':'Vul een stadionnaam in.');stadiumLocation.setCustomValidity(stadiumLocation.value.trim()?'':'Vul club, stad en land in.');}
    form.reportValidity();return;
  }
''', 1)
# Wis eigen validatiemeldingen zodra de klant opnieuw invoert.
html = html.replace("stadiumSelect.addEventListener('change',toggleCustomStadium);", "stadiumSelect.addEventListener('change',()=>{stadiumSelect.setCustomValidity('');toggleCustomStadium();});[customStadium,stadiumLocation].forEach(field=>field.addEventListener('input',()=>field.setCustomValidity('')));", 1)
html = html.replace('    "3D Voetbalstadion – Deluxe Edition",', '    "3D Voetbalstadion – Deluxe Edition",\n    "Stadion: " + selectedStadium(),\n    "Beschikbaarheid en definitieve uitvoering graag bevestigen.",', 1)
old_redirect = '''  window.location.href =
    "contact.html?product=" + encodeURIComponent(details);'''
new_redirect = '''  try{sessionStorage.setItem('makers-stadion-aanvraag',JSON.stringify({description:details}));}
  catch(error){alert('Je browser kan de keuzes niet bewaren. Sta sessieopslag toe en probeer opnieuw.');return;}
  window.location.href = "contact.html?product=3D%20Voetbalstadion%20Deluxe#quoteForm";'''
if old_redirect not in html:
    raise SystemExit("De aanvraagkoppeling is veranderd. Er is niets gewijzigd.")
html = html.replace(old_redirect,new_redirect,1)
html = html.replace("Totaalprijs inclusief btw", "Prijsindicatie inclusief btw, vanaf")
html = html.replace('<div class="price">€ 369,95</div>', '<div class="price">Vanaf € 369,95</div>')
prefill = r'''<script id="stadion-aanvraag">
if(new URLSearchParams(location.search).get('product')==='3D Voetbalstadion Deluxe'){
 const pick=document.getElementById('product'),details=document.getElementById('omschrijving');
 if(pick&&details){
  if(!Array.from(pick.options).some(o=>o.value==='3D Voetbalstadion Deluxe')){const o=document.createElement('option');o.value='3D Voetbalstadion Deluxe';o.textContent=o.value;pick.append(o);}
  pick.value='3D Voetbalstadion Deluxe';
  try{const data=JSON.parse(sessionStorage.getItem('makers-stadion-aanvraag')||'null');if(data&&typeof data.description==='string'&&data.description.length<=3000)details.value=data.description;}catch(error){}
 }
}
</script>'''
contact_html = re.sub(r'<script id="stadion-aanvraag">.*?</script>', '', contact_html, flags=re.S)
contact_html = contact_html.replace("</body>",prefill + "\n</body>",1)
for path in (p,contact):
    backup=Path(str(path)+".before-stadionkeuze.bak")
    if not backup.exists():backup.write_text(path.read_text(encoding="utf-8"),encoding="utf-8")
p.write_text(html,encoding="utf-8")
contact.write_text(contact_html,encoding="utf-8")
print("Klaar: 34 Nederlandse profclubs, 4 Jong-thuislocaties, 5 internationale stadions en vrije invoer toegevoegd.")
print("Bestaande verlichting en personalisatie behouden. Nog niet gepubliceerd.")
