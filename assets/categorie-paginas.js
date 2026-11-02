
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
