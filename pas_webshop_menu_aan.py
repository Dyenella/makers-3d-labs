from pathlib import Path
js_path=Path('assets/shop.js')
css_path=Path('assets/shop.css')
if not js_path.exists() or not css_path.exists():
    raise SystemExit('De map assets ontbreekt. Open eerst de juiste Codespaces-map.')
js=js_path.read_text(encoding='utf-8')
css=css_path.read_text(encoding='utf-8')
old='const actions=()=>`<nav class="ms-utilities" aria-label="Webshop snelkoppelingen"><a class="ms-utility" href="winkel.html" aria-label="Winkel">Winkel</a><a class="ms-utility" href="account.html" aria-label="Mijn account">${iconUser}<span class="ms-utility-label">Mijn account</span></a><a class="ms-utility" href="winkelwagen.html" aria-label="Winkelwagen">${iconCart}<span class="ms-utility-label">Winkelwagen</span><span class="ms-badge" data-ms-cart-count>${count()}</span></a></nav>`;'
new='const actions=()=>`<nav class="ms-utilities" aria-label="Account en winkelwagen"><a class="ms-utility" href="account.html" aria-label="Mijn account" title="Mijn account">${iconUser}</a><a class="ms-utility" href="winkelwagen.html" aria-label="Winkelwagen" title="Winkelwagen">${iconCart}<span class="ms-badge" data-ms-cart-count>${count()}</span></a></nav>`;'
if old in js:
    js=js.replace(old,new)
elif new not in js:
    raise SystemExit('De menucode is veranderd: voor de veiligheid niets aangepast.')
extra='''function placeShopInProductsMenu(){
  const dropdown=document.getElementById('drop-producten');
  if(dropdown && !dropdown.querySelector('a[href="winkel.html"]')){
    const link=document.createElement('a');link.href='winkel.html';
    link.innerHTML='<strong>Webshop</strong><small>Bekijk de winkel</small>';
    dropdown.prepend(link);
  }
  const mobile=document.querySelector('#mobile-nav details:nth-of-type(2)');
  if(mobile && !mobile.querySelector('a[href="winkel.html"]')){
    const link=document.createElement('a');link.href='winkel.html';link.textContent='Webshop';mobile.prepend(link);
  }
}
 '''
if 'function placeShopInProductsMenu()' not in js:
    js=js.replace('function addNavigation(){',extra+'function addNavigation(){')
js=js.replace('function init(){addNavigation();addFooter();','function init(){addNavigation();placeShopInProductsMenu();addFooter();')
js=js.replace('<a class="ms-extra-mobile" href="winkel.html">Winkel</a><a class="ms-extra-mobile" href="account.html">Mijn account</a>','<a class="ms-extra-mobile" href="account.html">Mijn account</a>')
if '/* Compacte webshop-iconen in navigatie */' not in css:
    css+='''
/* Compacte webshop-iconen in navigatie */
.ms-utilities{gap:7px;flex-shrink:0}
.ms-utilities .ms-utility{min-width:43px;min-height:43px;padding:9px 10px!important;position:relative}
.ms-utilities .ms-utility svg{width:20px;height:20px}
.ms-utilities .ms-utility-label{display:none!important}
.ms-utilities .ms-badge{min-width:18px;height:18px;font-size:10px}
@media(min-width:801px){.head-inner{gap:12px}.desktop{gap:0}.desktop>a,.desktop .drop-trigger{padding-left:9px;padding-right:9px}.desktop .nav-cta{margin-left:5px}}
'''
js_path.write_text(js,encoding='utf-8')
css_path.write_text(css,encoding='utf-8')
print('Klaar: Winkel onder Producten. Rechts alleen accounticoon en winkelmandje.')
