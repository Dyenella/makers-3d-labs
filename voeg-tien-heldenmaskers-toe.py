from pathlib import Path
import re, html, json, datetime

MODELS = [
    ('aurora', 'Aurora', 'masker-aurora-voorbeeld.webp', 'masker-aurora-wit-voorbeeld.webp', 6995, 9995, 17995),
    ('vulkaan', 'Vulkaan', 'masker-vulkaan-voorbeeld.webp', 'masker-vulkaan-wit-voorbeeld.webp', 6995, 9995, 15995),
    ('oceaan', 'Oceaan', 'masker-oceaan-voorbeeld.webp', 'masker-oceaan-wit-voorbeeld.webp', 6495, 9495, 15995),
    ('valk', 'Valk', 'masker-valk-voorbeeld.webp', 'masker-valk-wit-voorbeeld.webp', 4995, 7495, 12995),
    ('poollicht', 'Poollicht', 'masker-poollicht-voorbeeld.webp', 'masker-poollicht-wit-voorbeeld.webp', 7495, 10495, 17995),
    ('eclips', 'Eclips', 'masker-eclips-voorbeeld.webp', 'masker-eclips-wit-voorbeeld.webp', 6495, 9495, 15995),
    ('titaan', 'Titaan', 'masker-titaan-voorbeeld.webp', 'masker-titaan-wit-voorbeeld.webp', 7495, 10495, 16995),
    ('feniks', 'Feniks', 'masker-feniks-voorbeeld.webp', 'masker-feniks-wit-voorbeeld.webp', 7995, 10995, 19995),
    ('prisma', 'Prisma', 'masker-prisma-voorbeeld.webp', 'masker-prisma-wit-voorbeeld.webp', 6495, 9495, 15995),
    ('zandstorm', 'Zandstorm', 'masker-zandstorm-voorbeeld.webp', 'masker-zandstorm-wit-voorbeeld.webp', 6495, 9495, 15995),
]
root=Path.cwd()
required=['categorie-maskers.html','masker-oni-ornament.html','contact.html','assets/maskers.css']
required += [image for m in MODELS for image in m[2:4]]
missing=[n for n in required if not (root/n).is_file()]
if missing: raise SystemExit('Bestanden ontbreken. Voer eerst git pull uit:\n'+'\n'.join(missing))
cat=(root/'categorie-maskers.html').read_text(encoding='utf-8')
template=(root/'masker-oni-ornament.html').read_text(encoding='utf-8')
if 'id="masker-aurora-product"' in cat:
    raise SystemExit('De tien nieuwe modellen zijn al toegevoegd; niets gewijzigd.')
if 'id="mask-order"' not in template or "finish.value==='5495'" not in template:
    raise SystemExit('De bestaande maskerpagina is veranderd. Niets gewijzigd.')
if '<div class="category-products" id="category-products">' not in cat:
    raise SystemExit('Productoverzicht niet gevonden. Niets gewijzigd.')
if 'id="masker-aanvraag"' not in (root/'contact.html').read_text(encoding='utf-8'):
    raise SystemExit('Het masker-aanvraagformulier ontbreekt. Niets gewijzigd.')
def euro(c): return '€'+f'{c/100:.2f}'.replace('.',',')
css='''<style id="mask-model-gallery">.mask-thumbs{display:flex;gap:10px;margin-top:14px}.mask-thumbs button{flex:1;background:#213345;color:#fff;border:1px solid #638194;border-radius:10px;padding:8px;cursor:pointer;font:inherit;font-size:12px}.mask-thumbs img{height:85px;width:100%;object-fit:contain;background:#101b26;border-radius:6px;display:block;margin-bottom:6px}.mask-thumbs button[aria-pressed="true"]{border:2px solid #8ce1e4;background:#2b4857}.mask-thumbs button:focus-visible{outline:3px solid #8ce1e4;outline-offset:3px}.mask-photo>img{aspect-ratio:1;object-fit:contain}.mask-variant-note{font-size:13px;color:#c1d1dc;line-height:1.6}</style>'''
gallery_js='''<script id="mask-model-gallery-js">(()=>{const photo=document.querySelector('.mask-photo>img'),buttons=[...document.querySelectorAll('.mask-thumbs button')],finish=document.getElementById('finish');function select(button){photo.src=button.dataset.photo;photo.alt=button.dataset.alt;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}buttons.forEach(b=>b.addEventListener('click',()=>select(b)));finish.addEventListener('change',()=>select(buttons[finish.selectedIndex===0?0:1]));select(buttons[0]);})();</script>'''
files={}
cards=[]
for slug,name,painted,white,raw,one,hand in MODELS:
    page=template.replace('Oni Ornament',name)
    substitutions={'5495':str(raw),'7995':str(one),'14995':str(hand),'€54,95':euro(raw),'€79,95':euro(one),'€149,95':euro(hand)}
    page=re.sub(r'€149,95|€79,95|€54,95|14995|7995|5495',lambda m:substitutions[m.group()],page)
    page=page.replace('Meerkleurig en gedetailleerd — vanaf','Volledig handbeschilderd — vanaf')
    page=page.replace('Kies wit om zelf te verven, één kleur of een gedetailleerde meerkleurige afwerking.','Kies wit om zelf te verven, één gewenste kleur of een volledig handbeschilderde uitvoering met meerdere kleuren en details.')
    page=page.replace('src="oni-masker-wit.webp"',f'src="{white}"')
    note=f'AI-voorbeeldontwerp van {name}. De witte foto toont de onbeschilderde uitvoering. Verfspullen zijn niet inbegrepen. De definitieve uitvoering, maat en beschikbaarheid bevestigen we bij je aanvraag.'
    page=re.sub(r'<figcaption>.*?</figcaption>',lambda m:'<figcaption>'+note+'</figcaption>',page,count=1,flags=re.S)
    thumbs=f'''<div class="mask-thumbs" aria-label="Voorbeeldfoto’s"><button type="button" data-photo="{white}" data-alt="{name}, wit onbeschilderd om zelf te verven" aria-pressed="true"><img src="{white}" alt="" loading="lazy">Wit / zelf verven</button><button type="button" data-photo="{painted}" data-alt="{name}, voorbeeld van handbeschilderde afwerking" aria-pressed="false"><img src="{painted}" alt="" loading="lazy">Handbeschilderd voorbeeld</button></div>'''
    page=page.replace('</figure>',thumbs+'</figure>',1)
    page=page.replace('<p id="mask-price"', '<p class="mask-variant-note">De gekleurde foto toont een handbeschilderd voorbeeld. Een éénkleurige uitvoering heeft geen meerkleurige details. Naam of korte tekst: + €14,95. Verfspullen zijn apart op aanvraag verkrijgbaar.</p><p id="mask-price"',1)
    page=page.replace('</head>',css+'</head>').replace('</body>',gallery_js+'</body>')
    files[f'masker-{slug}.html']=page
    colors=html.escape(json.dumps(['Wit','Kleurkeuze op aanvraag']),quote=True)
    cards.append(f'''<article id="masker-{slug}-product" class="category-product" data-name="{name}" data-colors="{colors}" data-kind="Masker" data-price="{raw}" data-personal="true"><a class="category-product-photo" href="masker-{slug}.html"><img src="{painted}" alt="{name} — handbeschilderd voorbeeld" loading="lazy"></a><div class="category-product-body"><span class="category-product-type">Masker · 3 uitvoeringen</span><h2>{name}</h2><strong class="category-price">Vanaf {euro(raw)}</strong><a class="category-product-link" href="masker-{slug}.html">Kies uitvoering en kleur →</a></div></article>''')
cat=cat.replace('<div class="category-products" id="category-products">','<div class="category-products" id="category-products">'+''.join(cards),1)
count=len(re.findall(r'<article\b[^>]*class="category-product"',cat))
cat=re.sub(r'(<p id="category-count"[^>]*>).*?(</p>)',lambda m:m[1]+str(count)+' producten'+m[2],cat,count=1,flags=re.S)
files['categorie-maskers.html']=cat
stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
for name,content in files.items():
    target=root/name
    if target.exists():
        backup=root/'backups'/('tien-heldenmaskers-'+stamp)/name
        backup.parent.mkdir(parents=True,exist_ok=True);backup.write_bytes(target.read_bytes())
    target.write_text(content,encoding='utf-8')
print('Klaar: 10 nieuwe modellen met elk 2 foto’s en 3 prijsopties. Nog niet gepubliceerd.')
for m in MODELS: print(m[1]+': '+ ' / '.join(euro(c) for c in m[4:]))
