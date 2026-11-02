from pathlib import Path
from html import escape
from html.parser import HTMLParser
import json
import re

p = Path("winkel.html")
if not p.exists():
    raise SystemExit("Open eerst de projectmap makers-3d-labs.")
html = p.read_text(encoding="utf-8")
gallery_match = re.search(r'<section id="shop-category-gallery".*?</section>', html, re.S)
if not gallery_match:
    raise SystemExit("Categoriekaarten niet gevonden. Er is niets gewijzigd.")
categories = [
 ("kerst","Kerst"),("zakelijk","Zakelijk"),("voetbal","Voetbal"),
 ("resin","Resin"),("laser","Lasergravure"),("bloemenvazen","Bloemenvazen"),
 ("persoonlijk","Gepersonaliseerd"),("maskers","Maskers")
]
filenames = {key:"categorie-"+key+".html" for key,_ in categories}
meta = {
 "kersthangers.html":(["kerst","persoonlijk"],["Op aanvraag"],"Kersthangers",True),
 "kersthangers-bedrijfslogo.html":(["kerst","zakelijk","persoonlijk"],["Op aanvraag"],"Kersthangers",True),
 "persoonlijke-kersttafel.html":(["kerst","persoonlijk"],["Op aanvraag"],"Tafeldecoratie",True),
 "kleine-cadeaus.html":(["kerst","persoonlijk","laser"],["Op aanvraag"],"Cadeaus",True),
 "voetbalstadion-deluxe.html":(["voetbal","persoonlijk"],["Meerkleurig","Op aanvraag"],"Stadionmodellen",True),
 "samurai-oni-deluxe.html":(["resin"],["Meerkleurig","Op aanvraag"],"Beelden",True),
 "horus-antiekgouden-buste.html":(["resin"],["Antiekgoud"],"Beelden",False),
 "anubis-antiekgouden-buste.html":(["resin"],["Antiekgoud"],"Beelden",False),
 "bastet-antiekgouden-buste.html":(["resin"],["Antiekgoud"],"Beelden",False),
 "business-collection-bedrijfsdisplays.html":(["zakelijk","persoonlijk"],["Op aanvraag"],"Bedrijfsdisplays",True),
 "clipper-duo-set.html":(["persoonlijk"],["Zwart/wit","Op aanvraag"],"Accessoires",True),
 "metalen-supporterskaart-premium.html":(["laser","voetbal","persoonlijk"],["Op aanvraag"],"Metalen kaarten",True)
}
class CardReader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.href=None;self.image=None;self.alt="";self.name="";self.price=""
        self.level=0;self.capture=None;self.capture_level=0
    def handle_starttag(self,tag,attrs):
        self.level+=1
        a=dict(attrs)
        if tag=="a" and self.href is None:self.href=a.get("href")
        if tag=="img" and self.image is None:self.image=a.get("src");self.alt=a.get("alt","")
        if tag=="h3":self.capture="name";self.capture_level=self.level
        if "mk-price" in a.get("class","").split():self.capture="price";self.capture_level=self.level
        if tag in ("img","br","input","hr","meta","link"):self.level-=1
    def handle_endtag(self,tag):
        if self.capture and self.level==self.capture_level:self.capture=None
        self.level-=1
    def handle_data(self,data):
        if self.capture:setattr(self,self.capture,getattr(self,self.capture)+data)

products=[]
for raw in re.findall(r'<article class="mk-product"[^>]*>.*?</article>',html,re.S):
    reader=CardReader();reader.feed(raw)
    href=(reader.href or "").split("?")[0]
    if href not in meta:
        raise SystemExit("Onbekend product: "+href+". Er is niets gewijzigd.")
    groups,colors,kind,personal=meta[href]
    price_text=" ".join(reader.price.split())
    match=re.search(r"(\d+(?:\.\d{3})*),(\d{2})",price_text)
    price=int(match.group(1).replace(".",""))*100+int(match.group(2)) if match else None
    products.append(dict(href=href,image=reader.image,alt=reader.alt,name=" ".join(reader.name.split()),price=price,priceText=price_text,categories=groups,colors=colors,kind=kind,personal=personal))
if not products:
    raise SystemExit("Geen productkaarten gevonden. Er is niets gewijzigd.")
if len({item["href"] for item in products})!=len(products):
    raise SystemExit("Dubbele productkaarten gevonden. Er is niets gewijzigd.")

css = r'''
*{box-sizing:border-box}body{margin:0;background:#303d4c;color:#f4f7fa;font:15px/1.6 Arial,sans-serif}a{color:inherit}button,input,select{font:inherit}
.category-header{background:#1d2936;border-bottom:1px solid #00afb860;padding:0 24px}
.category-header .head-inner{max-width:1200px;min-height:88px;margin:auto;display:flex;align-items:center;gap:22px}
.category-header img{width:225px;max-width:100%;height:auto;display:block}.category-nav{display:flex;gap:22px;margin-left:auto}.category-nav a{text-decoration:none;color:#fff;font-size:14px;font-weight:700}
.category-header .ms-utilities{margin-left:0}.category-main{max-width:1250px;margin:auto;padding:28px 25px 60px}
.category-crumb{font-size:13px;color:#8cdae0;text-decoration:none}.category-title{margin:16px 0 8px;font-size:clamp(30px,4vw,44px);line-height:1.15;letter-spacing:-.035em}
.category-intro{max-width:780px;color:#c4d3df;margin:0 0 26px}
.category-layout{display:grid;grid-template-columns:235px minmax(0,1fr);gap:25px;align-items:start}
.category-sidebar{background:#213345;border:1px solid #61798d;border-radius:14px;overflow:hidden}
.category-filters>summary{padding:16px;cursor:pointer;font-weight:700;background:#263f52}
.category-filters-body{padding:18px}.category-filter-title{font-size:18px;margin:0 0 15px}
.filter-group{border:0;border-top:1px solid #ffffff25;padding:15px 0 0;margin:16px 0 0;min-width:0}
.filter-group legend{font-weight:750;padding:0 0 6px;color:#fff}
.filter-check{display:flex;align-items:center;gap:8px;color:#d3e0e9;font-size:13px;margin:8px 0;cursor:pointer}
.filter-check input{width:16px;height:16px;flex-shrink:0;accent-color:#00afb8}
.category-search-label{display:block;font-size:13px;font-weight:700;margin-bottom:6px}
.category-sidebar input[type=search],.category-sidebar input[type=number],.category-sort{width:100%;padding:10px;border:1px solid #7891a4;border-radius:8px;background:#172a38;color:#fff;font-size:13px}
.category-sidebar input::placeholder{color:#aebfcd;opacity:1}.filter-price-row{display:grid;grid-template-columns:1fr 1fr;gap:9px}.filter-price-row label{font-size:12px;color:#c4d3df}.filter-price-row input{margin-top:5px}
.filter-help{font-size:11px;line-height:1.5;color:#b6c9d6;margin:10px 0}
.filter-reset{width:100%;background:#00afb8;border:1px solid #00afb8;color:#092b35;border-radius:9px;padding:10px;font-weight:750;cursor:pointer;margin-top:18px}
.category-links{padding:0 18px 18px}.category-links a{display:block;color:#bed5e1;font-size:13px;margin:7px 0;text-decoration:none}.category-links a[aria-current=page]{color:#8ce1e4;font-weight:750}
.category-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:18px;flex-wrap:wrap}
.category-count{margin:0;color:#c4d3df;font-size:13px}.category-sort-wrap{display:flex;align-items:center;gap:8px;font-size:13px}.category-sort{width:auto;max-width:100%}
.category-products{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.category-product{display:flex;flex-direction:column;min-width:0;background:#243649;border:1px solid #60788b;border-radius:14px;overflow:hidden}
.category-product-photo{display:block;background:#101c25;aspect-ratio:1;overflow:hidden}
.category-product-photo img{display:block;width:100%;height:100%;object-fit:contain}
.category-product-body{display:flex;flex-direction:column;flex:1;padding:17px}
.category-product-type{font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:750;color:#8cdce0}
.category-product h2{font-size:17px;line-height:1.4;margin:9px 0 16px;color:#fff}
.category-price{color:#8cdce0;font-size:17px;margin-top:auto}
.category-product-link{display:block;margin-top:15px;background:#00afb8;color:#082d34;font-size:13px;font-weight:750;padding:11px 12px;border-radius:8px;text-decoration:none}
.category-product-link:hover{background:#77dce1}
.category-product.is-christmas{background:#18382d;border-color:#bda263}
.category-product.is-christmas h2{color:#fff3d6}.category-product.is-christmas .category-product-type,.category-product.is-christmas .category-price{color:#e5c887}
.category-product.is-christmas .category-product-link{background:#963747;color:#fff3d6;border:1px solid #cc7c88}
.category-product[hidden],.category-empty[hidden]{display:none!important}
.category-empty{padding:30px;background:#213345;border:1px solid #61798d;border-radius:14px;color:#c4d3df}
.category-empty h2{font-size:22px;color:#fff;margin:0 0 10px}.category-empty p{margin:0 0 12px}
.category-empty a{display:inline-block;background:#00afb8;color:#082d34;padding:10px 16px;text-decoration:none;border-radius:8px;font-weight:750}
.category-price-note{font-size:12px;color:#bfced9;margin-top:20px}.category-error{color:#ffcfb8;font-size:12px}
:focus-visible{outline:3px solid #8ce1e4;outline-offset:3px}
@media(min-width:851px){.category-filters>summary{display:none}}
@media(max-width:1050px){.category-products{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:850px){.category-layout{grid-template-columns:1fr;gap:18px}.category-filter-title{display:none}.category-links{display:none}.category-header .head-inner{flex-wrap:wrap;padding:12px 0;gap:12px;min-height:76px}.category-header img{width:185px}.category-nav{gap:14px}.category-header .ms-utilities{margin-left:auto}}
@media(max-width:450px){.category-main{padding:22px 15px 45px}.category-products{gap:10px}.category-product-body{padding:12px}.category-product h2{font-size:14px}.category-price{font-size:15px}.category-product-link{font-size:12px}.category-sort-wrap{width:100%;justify-content:space-between}.category-sort{width:65%}}
'''
js = r'''
(function(){
const form=document.getElementById('category-filter-form'),grid=document.getElementById('category-products');
if(!form||!grid)return;
const cards=Array.from(grid.querySelectorAll('.category-product')).map((el,index)=>({el,index,name:el.dataset.name.toLocaleLowerCase('nl-NL'),colors:JSON.parse(el.dataset.colors),kind:el.dataset.kind,price:el.dataset.price===''?null:Number(el.dataset.price),personal:el.dataset.personal==='true'}));
const search=document.getElementById('category-search'),min=document.getElementById('price-min'),max=document.getElementById('price-max'),sort=document.getElementById('category-sort'),onlyPersonal=document.getElementById('only-personal'),onRequest=document.getElementById('include-request');
const checked=name=>Array.from(form.querySelectorAll('input[name="'+name+'"]:checked')).map(input=>input.value);
function update(){
 const colors=checked('color'),types=checked('kind'),q=search.value.trim().toLocaleLowerCase('nl-NL');
 const low=min.value===''?null:Number(min.value),high=max.value===''?null:Number(max.value);
 const invalid=(low!==null&&(!Number.isFinite(low)||low<0))||(high!==null&&(!Number.isFinite(high)||high<0))||(low!==null&&high!==null&&low>high);
 document.getElementById('price-error').textContent=invalid?'Vul geldige bedragen in; minimum mag niet hoger zijn dan maximum.':'';
 let visible=0;
 cards.forEach(item=>{
  let show=!invalid&&(!q||item.name.includes(q))&&(!colors.length||colors.some(c=>item.colors.includes(c)))&&(!types.length||types.includes(item.kind))&&(!onlyPersonal.checked||item.personal);
  if(item.price===null){show=show&&onRequest.checked;}
  else{show=show&&(low===null||item.price>=Math.round(low*100))&&(high===null||item.price<=Math.round(high*100));}
  item.el.hidden=!show;if(show)visible++;
 });
 const ordered=cards.slice().sort((a,b)=>{
  if(sort.value==='default')return a.index-b.index;
  if(a.price===null&&b.price===null)return a.index-b.index;
  if(a.price===null)return 1;if(b.price===null)return -1;
  return (sort.value==='asc'?a.price-b.price:b.price-a.price)||a.index-b.index;
 });
 ordered.forEach(item=>grid.append(item.el));
 document.getElementById('category-count').textContent=visible+' van '+cards.length+' producten';
 document.getElementById('category-empty').hidden=visible>0;
}
form.addEventListener('submit',event=>event.preventDefault());
form.addEventListener('input',update);form.addEventListener('change',update);sort.addEventListener('change',update);
document.getElementById('filters-reset').addEventListener('click',()=>{form.reset();sort.value='default';update();});
const mobile=window.matchMedia('(max-width:850px)');
function setFilterPanel(){document.getElementById('category-filters').open=!mobile.matches;}
setFilterPanel();mobile.addEventListener('change',setFilterPanel);
update();
})();
'''
def esc(value):return escape(str(value),quote=True)
def checkbox(name,value,label):
    return '<label class="filter-check"><input type="checkbox" name="'+name+'" value="'+esc(value)+'"><span>'+esc(label)+'</span></label>'
def render_card(item):
    price="" if item["price"] is None else str(item["price"])
    attrs=' data-name="'+esc(item["name"])+'" data-colors="'+esc(json.dumps(item["colors"],ensure_ascii=False))+'" data-kind="'+esc(item["kind"])+'" data-price="'+price+'" data-personal="'+str(item["personal"]).lower()+'"'
    cl='category-product is-christmas' if "kerst" in item["categories"] else 'category-product'
    icon='🎄 ' if "kerst" in item["categories"] else ''
    return '<article class="'+cl+'"'+attrs+'><a class="category-product-photo" href="'+esc(item["href"])+'"><img src="'+esc(item["image"])+'" alt="'+esc(item["alt"] or item["name"])+'" loading="lazy"></a><div class="category-product-body"><span class="category-product-type">'+esc(item["kind"])+'</span><h2>'+esc(item["name"])+'</h2><strong class="category-price">'+esc(item["priceText"])+'</strong><a class="category-product-link" href="'+esc(item["href"])+'">'+icon+'Bekijk product →</a></div></article>'

pages={}
for key,title in categories:
    items=[item for item in products if key in item["categories"]]
    colors=sorted({c for item in items for c in item["colors"]})
    types=sorted({item["kind"] for item in items})
    color_filters=''.join(checkbox("color",c,"Kleurkeuze op aanvraag" if c=="Op aanvraag" else c) for c in colors) or '<p class="filter-help">Kleurfilters verschijnen zodra producten zijn toegevoegd.</p>'
    type_filters=''.join(checkbox("kind",t,t) for t in types) or '<p class="filter-help">Productsoorten verschijnen zodra producten zijn toegevoegd.</p>'
    links=''.join('<a href="'+filenames[k]+'"'+(' aria-current="page"' if k==key else '')+'>'+esc(t)+'</a>' for k,t in categories)
    intro='Ontdek onze '+title.lower()+'collectie. Filter op uitvoering, kleurkeuze en prijs, en bekijk de mogelijkheden per product.'
    if key in ("bloemenvazen","maskers"):
        intro='Hier vind je straks onze '+title.lower()+'. Nieuwe producten en foto’s worden toegevoegd.'
    if items:
        empty='<h2>Geen producten gevonden</h2><p>Pas je filters of zoekterm aan, of gebruik ‘Filters wissen’.</p>'
    else:
        empty='<h2>De collectie wordt aangevuld</h2><p>Er staan nog geen producten in deze categorie. Kom binnenkort terug voor de nieuwe modellen en foto’s.</p><a href="winkel.html">Bekijk andere categorieën →</a>'
    page='''<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'''+esc(title)+''' | Makers 3D Labs</title><meta name="description" content="'''+esc(intro)+'''"><link rel="stylesheet" href="assets/shop.css"><link rel="stylesheet" href="assets/categorie-paginas.css"></head><body>
<header class="category-header"><div class="head-inner"><a href="index.html" aria-label="Makers 3D Labs — Home"><img src="makers3dlabs-logo.webp" alt="Makers 3D Labs" width="1600" height="500"></a><nav class="category-nav" aria-label="Hoofdnavigatie"><a href="index.html">Home</a><a href="winkel.html">Webshop</a></nav></div></header>
<main class="category-main"><a class="category-crumb" href="winkel.html">← Alle categorieën</a><h1 class="category-title">'''+esc(title)+'''</h1><p class="category-intro">'''+esc(intro)+'''</p>
<div class="category-layout"><aside class="category-sidebar" aria-label="Productfilters">
<details class="category-filters" id="category-filters" open><summary>Filters</summary><div class="category-filters-body"><h2 class="category-filter-title">Filters</h2>
<form id="category-filter-form">
<label class="category-search-label" for="category-search">Zoeken in deze categorie</label><input id="category-search" type="search" placeholder="Productnaam" autocomplete="off">
<fieldset class="filter-group"><legend>Kleur</legend>'''+color_filters+'''<p class="filter-help">‘Kleurkeuze op aanvraag’ betekent dat de gewenste kleur eerst bevestigd wordt.</p></fieldset>
<fieldset class="filter-group"><legend>Prijs (€)</legend><div class="filter-price-row"><label for="price-min">Vanaf<input id="price-min" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0"></label><label for="price-max">Tot<input id="price-max" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Geen limiet"></label></div><p id="price-error" class="category-error" role="alert"></p><label class="filter-check"><input id="include-request" type="checkbox" checked><span>Toon ook prijs op aanvraag</span></label></fieldset>
<fieldset class="filter-group"><legend>Productsoort</legend>'''+type_filters+'''</fieldset>
<fieldset class="filter-group"><legend>Personalisatie</legend><label class="filter-check"><input id="only-personal" type="checkbox"><span>Personalisatie mogelijk</span></label></fieldset>
<button class="filter-reset" id="filters-reset" type="button">Filters wissen</button></form></div></details>
<nav class="category-links" aria-label="Andere categorieën">'''+links+'''</nav></aside>
<section aria-label="Productoverzicht"><div class="category-toolbar"><p id="category-count" class="category-count" role="status" aria-live="polite">'''+str(len(items))+''' producten</p><label class="category-sort-wrap" for="category-sort">Sorteren<select class="category-sort" id="category-sort"><option value="default">Standaard</option><option value="asc">Prijs: laag naar hoog</option><option value="desc">Prijs: hoog naar laag</option></select></label></div>
<div class="category-products" id="category-products">'''+''.join(render_card(item) for item in items)+'''</div>
<div class="category-empty" id="category-empty"'''+(' hidden' if items else '')+'''>'''+empty+'''</div>
<p class="category-price-note">Prijsfilters gebruiken de getoonde basis- of vanafprijs. Extra opties en verzending kunnen de totaalprijs veranderen. Producten met ‘Prijs op aanvraag’ hebben nog geen vaste verkoopprijs.</p>
</section></div></main><script src="assets/shop-data.js"></script><script src="assets/shop.js"></script><script src="assets/categorie-paginas.js"></script></body></html>'''
    pages[filenames[key]]=page

gallery=gallery_match.group(0)
def category_link(match):
    key=match.group(1)
    if key not in filenames:raise ValueError("Onbekende categorie: "+key)
    content=match.group(2).replace("<small>Op aanvraag</small>","<small>Bekijk categorie →</small>")
    return '<a class="shop-category-card" href="'+filenames[key]+'">'+content+'</a>'
gallery,count=re.subn(r'<button class="shop-category-card"[^>]*data-shop-category="([^"]+)"[^>]*>(.*?)</button>',category_link,gallery,flags=re.S)
if count!=8:
    raise SystemExit("Er zijn geen 8 categoriekaarten gevonden. Er is niets gewijzigd.")
gallery=gallery.replace("Kies een categorie en ontdek de producten.", "Open een categorie en gebruik de filters om jouw product te vinden.")
main='<main class="mk-shop-page"><span class="mk-category">Makers 3D Labs / Webshop</span><h1>Onze webshop</h1><p>Kies een categorie en ontdek onze collectie 3D-geprinte en lasergegraveerde producten.</p>'+gallery+'</main>'
html,count=re.subn(r'<main\b[^>]*>.*?</main>',lambda _:main,html,count=1,flags=re.S)
if count!=1:raise SystemExit("Webshopinhoud niet gevonden. Er is niets gewijzigd.")
html=re.sub(r'<script id="makers-webshop-categorieen">.*?</script>','',html,flags=re.S)
link_css='''<style id="shop-categorie-links">a.shop-category-card{text-decoration:none}a.shop-category-card:hover{border-color:#79d6db}a.shop-category-card:focus-visible{outline:3px solid #8ce1e4;outline-offset:4px}</style>'''
html=html.replace("</head>",link_css+"\n</head>",1)
backup=Path("winkel.html.before-eigen-categoriepaginas.bak")
if not backup.exists():backup.write_text(p.read_text(encoding="utf-8"),encoding="utf-8")
Path("assets").mkdir(exist_ok=True)
Path("assets/categorie-paginas.css").write_text(css,encoding="utf-8")
Path("assets/categorie-paginas.js").write_text(js,encoding="utf-8")
for filename,content in pages.items():Path(filename).write_text(content,encoding="utf-8")
p.write_text(html,encoding="utf-8")
print("Klaar: 8 eigen categoriepagina's met filters en sortering aangemaakt.")
print(str(len(products))+" bestaande producten ingedeeld; Maskers en Bloemenvazen klaar voor nieuwe artikelen.")
print("Nog niet gepubliceerd.")
