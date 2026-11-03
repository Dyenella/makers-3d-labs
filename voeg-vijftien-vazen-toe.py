from pathlib import Path
import re,json,html,datetime

# Klein 15 cm / middel 20 cm / groot 25 cm totale hoogte, exclusief bloemen.
MODELS=[
('vaas-dior-tas','Cannage tasvaas','Dior-geïnspireerd','Tasvazen','Crème','Goud',4495,6495,8995),
('vaas-chanel-tas','Quilt tasvaas','Chanel-geïnspireerd','Tasvazen','Zwart','Goud',4495,6495,8995),
('vaas-louis-vuitton-tas','Monogram tasvaas','Louis Vuitton-geïnspireerd','Tasvazen','Bruin','Beige',4495,6495,8995),
('vaas-gucci-tas','Bamboe tasvaas','Gucci-geïnspireerd','Tasvazen','Groen','Goud',4995,6995,9495),
('vaas-prada-tas','Triangle tasvaas','Prada-geïnspireerd','Tasvazen','Roze','Goud',3995,5995,7995),
('vaas-hermes-tas','Lock tasvaas','Hermès-geïnspireerd','Tasvazen','Oranje','Goud',4995,6995,9495),
('vaas-fendi-tas','Baguette tasvaas','Fendi-geïnspireerd','Tasvazen','Lila','Goud',3995,5995,7995),
('vaas-saint-laurent-tas','Chevron tasvaas','Saint Laurent-geïnspireerd','Tasvazen','Beige','Goud',4495,6495,8995),
('vaas-jacquemus-tas','Mini-handle tasvaas','Jacquemus-geïnspireerd','Tasvazen','Terracotta','Goud',3495,4995,6995),
('vaas-balenciaga-tas','Hourglass tasvaas','Balenciaga-geïnspireerd','Tasvazen','Zwart','Zilver',4495,6495,8995),
('vaas-chanel-parfum','No. 5 parfumvaas','Chanel-geïnspireerd','Parfumvazen','Crème','Zwart',3495,4995,6995),
('vaas-dior-parfum','Amfora parfumvaas','Dior-geïnspireerd','Parfumvazen','Goud','Goud',3995,5995,7995),
('vaas-ysl-parfum','Libre parfumvaas','YSL-geïnspireerd','Parfumvazen','Crème','Goud',3995,5995,7995),
('vaas-gucci-parfum','Bloom parfumvaas','Gucci-geïnspireerd','Parfumvazen','Roze','Zwart',3495,4995,6995),
('vaas-prada-parfum','Triangle parfumvaas','Prada-geïnspireerd','Parfumvazen','Perzik','Zwart',3495,4995,6995),
]
root=Path.cwd()
required=['handtas-bloemenvaas.html','categorie-bloemenvazen.html','contact.html']+[m[0]+'-voorbeeld.webp' for m in MODELS]
missing=[n for n in required if not (root/n).is_file()]
if missing:raise SystemExit('Voer eerst git pull uit. Deze bestanden ontbreken:\n'+'\n'.join(missing))
template=(root/'handtas-bloemenvaas.html').read_text(encoding='utf-8')
category=(root/'categorie-bloemenvazen.html').read_text(encoding='utf-8')
contact=(root/'contact.html').read_text(encoding='utf-8')
if 'id="vaas-dior-tas-product"' in category:raise SystemExit('De vijftien modellen zijn al toegevoegd; niets gewijzigd.')
if "vp={'15':4495,'20':6495,'25':8995}" not in template:raise SystemExit('Vaas-template is gewijzigd. Niets aangepast.')
if '<div class="category-products" id="category-products">' not in category:raise SystemExit('Categorie niet herkend.')
def euro(n):return '€ '+f'{n/100:.2f}'.replace('.',',')
files={};cards=[]
for slug,name,inspiration,kind,color,detail,small,medium,large in MODELS:
    page=template
    subs={'4495':str(small),'6495':str(medium),'8995':str(large),'€ 44,95':euro(small),'€ 64,95':euro(medium),'€ 89,95':euro(large)}
    page=re.sub(r'€ 44,95|€ 64,95|€ 89,95|4495|6495|8995',lambda m:subs[m.group()],page)
    page=re.sub(r'<title>.*?</title>',lambda m:'<title>'+name+' | Makers 3D Labs</title>',page,count=1)
    page=re.sub(r'<meta name="description"[^>]*>',lambda m:'<meta name="description" content="'+name+': kant-en-klaar afgewerkte 3D-vaas in klein, middel en groot. Kies formaat en gewenste kleur.">',page,count=1)
    page=page.replace('bloemenvaas-handtas-dior.webp',slug+'-voorbeeld.webp')
    page=re.sub(r'(<figure class="vase-image"><img[^>]*alt=")[^"]*',lambda m:m[1]+name+' — AI-voorbeeldontwerp met bloemen',page,count=1)
    caption='AI-voorbeeldontwerp, '+inspiration+'. Geen officieel merkproduct. Kant-en-klaar afgewerkte vaas; bloemen en waterdichte binnenvaas niet inbegrepen. Definitieve uitvoering en beschikbaarheid bevestigen we vooraf.'
    page=re.sub(r'<figcaption>.*?</figcaption>',lambda m:'<figcaption>'+caption+'</figcaption>',page,count=1,flags=re.S)
    page=page.replace('BLOEMENVAZEN · HANDTASSTIJL',kind.upper()+' · KANT-EN-KLAAR')
    page=re.sub(r'(<h1 id="vase-title">).*?(</h1>)',lambda m:m[1]+name+m[2],page,count=1,flags=re.S)
    intro='Een decoratieve 3D-geprinte vaas, '+inspiration+'. Alleen kant-en-klaar afgewerkt verkrijgbaar. Kies klein, middel of groot en geef je gewenste kleuren door.'
    page=re.sub(r'<p class="vase-intro">.*?</p>',lambda m:'<p class="vase-intro">'+intro+'</p>',page,count=1,flags=re.S)
    page=page.replace('Totale hoogte inclusief handvat.','Totale hoogte van de vaas, zonder bloemen; inclusief handvat bij tasmodellen.')
    page=page.replace(' cm inclusief handvat',' cm totale hoogte').replace(' cm totale hoogte inclusief handvat',' cm totale hoogte')
    page=page.replace('Gewenste kleur van de letters','Gewenste kleur van de details').replace('Letterkleur:','Detailkleur:').replace('Kleur letters:','Kleur details:')
    page=page.replace('id="vase-color" name="color" type="text"','id="vase-color" name="color" value="'+color+'" type="text"')
    page=page.replace('value="Goud"></label>','value="'+detail+'"></label>')
    page=page.replace("['Handtas-bloemenvaas',","['"+name+" — "+inspiration+"','Uitvoering: kant-en-klaar afgewerkt',")
    page=page.replace('makers-handtasvaas-aanvraag','makers-collectievaas-aanvraag').replace('product=Handtas-bloemenvaas','product=Collectievaas')
    files[slug+'.html']=page
    colors=html.escape(json.dumps([color,'Op aanvraag']),quote=True)
    cards.append(f'<article id="{slug}-product" class="category-product" data-name="{name} {inspiration}" data-colors="{colors}" data-kind="{kind}" data-price="{small}" data-personal="false"><a class="category-product-photo" href="{slug}.html"><img src="{slug}-voorbeeld.webp" alt="{name} — voorbeeldontwerp" loading="lazy"></a><div class="category-product-body"><span class="category-product-type">{kind} · kant-en-klaar</span><h2>{name}</h2><p>{inspiration}</p><strong class="category-price">Vanaf {euro(small)}</strong><a class="category-product-link" href="{slug}.html">Kies klein, middel of groot →</a></div></article>')
category=category.replace('<div class="category-products" id="category-products">','<div class="category-products" id="category-products">'+''.join(cards),1)
kindfields='<fieldset class="filter-group"><legend>Productsoort</legend>'+''.join('<label class="filter-check"><input type="checkbox" name="kind" value="'+k+'"><span>'+k+'</span></label>' for k in ['Tasvazen','Parfumvazen','Vazen'])+'</fieldset>'
category=re.sub(r'<fieldset class="filter-group"><legend>Productsoort</legend>.*?</fieldset>',lambda m:kindfields,category,count=1,flags=re.S)
colorfields='<fieldset class="filter-group"><legend>Kleur</legend>'+''.join('<label class="filter-check"><input type="checkbox" name="color" value="'+c+'"><span>'+c+'</span></label>' for c in dict.fromkeys([m[4] for m in MODELS]+['Op aanvraag']))+'<p class="filter-help">Kleurfilters tonen de voorbeeldkleur. Andere kleuren zijn op aanvraag mogelijk.</p></fieldset>'
category=re.sub(r'<fieldset class="filter-group"><legend>Kleur</legend>.*?</fieldset>',lambda m:colorfields,category,count=1,flags=re.S)
category=category.replace('Ontdek onze decoratieve bloemenvazen. Kies jouw model, formaat en gewenste kleur.','Ontdek onze tasvazen en parfumflesvazen. Kant-en-klaar afgewerkt in klein, middel en groot; kies jouw model en gewenste kleur.')
count=len(re.findall(r'<article\b[^>]*class="category-product"',category))
category=re.sub(r'(<p id="category-count"[^>]*>).*?(</p>)',lambda m:m[1]+str(count)+' producten'+m[2],category,count=1,flags=re.S)
files['categorie-bloemenvazen.html']=category
prefill='''<script id="collectievaas-aanvraag">(()=>{if(new URLSearchParams(location.search).get('product')!=='Collectievaas')return;const pick=document.getElementById('product'),details=document.getElementById('omschrijving'),count=document.getElementById('aantal');if(pick){if(!Array.from(pick.options).some(o=>o.value==='Decoratieve vaas'))pick.add(new Option('Decoratieve vaas','Decoratieve vaas'));pick.value='Decoratieve vaas';}try{const data=JSON.parse(sessionStorage.getItem('makers-collectievaas-aanvraag')||'null');if(data&&typeof data.description==='string'&&data.description.length<3000&&Number.isInteger(data.qty)&&data.qty>=1&&data.qty<=100){if(details)details.value=data.description;if(count)count.value=String(data.qty);}}catch(e){}})();</script>'''
if 'id="collectievaas-aanvraag"' not in contact:contact=contact.replace('</body>',prefill+'</body>')
files['contact.html']=contact
stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
for name,content in files.items():
    p=root/name
    if p.exists():
        b=root/'backups'/('vijftien-vazen-'+stamp)/name;b.parent.mkdir(parents=True,exist_ok=True);b.write_bytes(p.read_bytes())
    p.write_text(content,encoding='utf-8')
print('Klaar: 15 kant-en-klare vazen met 3 maten en prijzen, categorie en aanvraagformulier gekoppeld. Nog niet gepubliceerd.')
