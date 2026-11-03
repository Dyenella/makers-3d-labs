from pathlib import Path
import re,json,html,datetime

COLORS=['Wit','Crème','Beige','Zwart','Grijs','Bruin','Rood','Bordeauxrood','Roze','Zachtroze','Oranje','Perzik','Geel','Groen','Donkergroen','Blauw','Donkerblauw','Turquoise','Paars','Lila','Goud','Zilver','Terracotta']
root=Path.cwd()
category=root/'categorie-bloemenvazen.html'
pages=[p for p in root.glob('vaas-*.html') if re.fullmatch(r'vaas-.+-(tas|parfum)\.html',p.name)]
if not category.exists() or len(pages)<15:raise SystemExit('Voer eerst git pull uit in makers-3d-labs. De 15 vaaspagina’s moeten aanwezig zijn.')
js=r'''(()=>{const form=document.getElementById('vase-form');if(!form)return;const colors=__COLORS__;function enhance(id,title){const input=document.getElementById(id);if(!input||document.getElementById(id+'-keuze'))return;const label=input.closest('label');const select=document.createElement('select');select.id=id+'-keuze';select.className='vase-color-select';select.setAttribute('aria-label',title);select.required=true;const options=id==='vase-letters'?['Dezelfde kleur als de vaas',...colors]:colors;options.forEach(c=>select.add(new Option(c,c)));select.add(new Option('Andere kleur — zelf invullen','__custom__'));const previous=input.value.trim();select.value=options.includes(previous)?previous:'__custom__';input.removeAttribute('list');input.placeholder='Typ jouw kleur, tint of RAL-code';input.setAttribute('aria-label',title+' zelf invullen');label.insertBefore(select,input);const help=document.createElement('small');help.className='vase-all-colors-help';help.textContent='Alle kleuren mogelijk op aanvraag. De foto blijft een voorbeeld; de gekozen tint bevestigen we vooraf.';label.append(help);function sync(){const custom=select.value==='__custom__';input.hidden=!custom;if(!custom)input.value=select.value;else input.value=select.dataset.custom||'';input.required=custom;input.dispatchEvent(new Event('input',{bubbles:true}));}if(select.value==='__custom__')select.dataset.custom=previous;input.addEventListener('input',()=>{if(select.value==='__custom__')select.dataset.custom=input.value;});select.addEventListener('change',sync);sync();}enhance('vase-color','Kleur van de vaas');enhance('vase-letters','Kleur van de details');})();'''.replace('__COLORS__',json.dumps(COLORS,ensure_ascii=False))
css='''.vase-form .vase-color-select{display:block;width:100%;padding:12px;margin-top:8px;background:#172a38;color:#fff;border:1px solid #7891a4;border-radius:9px;font:inherit}.vase-form input[hidden]{display:none!important}.vase-all-colors-help{display:block;margin-top:7px;font-size:12px;font-weight:400;color:#c4d3df;line-height:1.6}.vase-color-select:focus-visible{outline:3px solid #8ce1e4;outline-offset:3px}'''
files={}
for p in pages:
    s=p.read_text(encoding='utf-8')
    if 'id="vase-color"' not in s:raise SystemExit('Kleurveld niet gevonden in '+p.name+'. Niets gewijzigd.')
    if 'src="assets/vaas-kleuren.js"' not in s:s=s.replace('</body>','<script src="assets/vaas-kleuren.js"></script></body>')
    if 'href="assets/vaas-kleuren.css"' not in s:s=s.replace('</head>','<link rel="stylesheet" href="assets/vaas-kleuren.css"></head>')
    files[p.name]=s
cat=category.read_text(encoding='utf-8')
def all_colors(match):
    card=match.group()
    return re.sub(r'data-colors="[^"]*"',lambda m:'data-colors="'+html.escape(json.dumps(COLORS+['Andere kleur']),quote=True)+'"',card,count=1)
cat=re.sub(r'<article\b[^>]*class="category-product".*?</article>',all_colors,cat,flags=re.S)
fields='<fieldset class="filter-group"><legend>Kleur</legend>'+''.join('<label class="filter-check"><input type="checkbox" name="color" value="'+c+'"><span>'+c+'</span></label>' for c in COLORS+['Andere kleur'])+'<p class="filter-help">Alle modellen zijn in alle kleuren aan te vragen. Kies de gewenste kleur op de productpagina; de foto toont één voorbeeld.</p></fieldset>'
cat=re.sub(r'<fieldset class="filter-group"><legend>Kleur</legend>.*?</fieldset>',lambda m:fields,cat,count=1,flags=re.S)
files[category.name]=cat
files['assets/vaas-kleuren.js']=js
files['assets/vaas-kleuren.css']=css
stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
for name,s in files.items():
    target=root/name
    if target.exists():
        backup=root/'backups'/('vaaskleuren-'+stamp)/name;backup.parent.mkdir(parents=True,exist_ok=True);backup.write_bytes(target.read_bytes())
    target.parent.mkdir(parents=True,exist_ok=True);target.write_text(s,encoding='utf-8')
print('Klaar: alle 15 tas- en parfumvazen hebben een kleurenlijst en vrije kleurinvoer. Prijzen behouden. Nog niet gepubliceerd.')
