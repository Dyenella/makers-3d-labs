from pathlib import Path
import re,datetime

root=Path.cwd()
p=root/'categorie-voetbal.html'
image=root/'eigen-stadion-ontwerp.webp'
if not p.is_file() or not image.is_file():
    raise SystemExit('Upload eerst dit script en eigen-stadion-ontwerp.webp naar GitHub, en voer git pull uit.')
s=p.read_text(encoding='utf-8')
pattern=r'(<article id="custom-stadium-product"[^>]*>)\s*<a class="category-product-photo".*?</a>'
replacement=r'\1<a class="category-product-photo" href="ontwerp-eigen-stadion.html"><img src="eigen-stadion-ontwerp.webp" alt="Zelfbedacht stadionmodel met ontwerpschetsen — AI-voorbeeld" width="1254" height="1254" loading="lazy"></a>'
updated,n=re.subn(pattern,replacement,s,count=1,flags=re.S)
if n!=1:raise SystemExit('De kaart voor jouw eigen stadion is niet gevonden; niets gewijzigd.')
if updated==s:raise SystemExit('De foto is al gekoppeld; niets gewijzigd.')
backup=root/'backups'/('eigen-stadionfoto-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S'))
backup.mkdir(parents=True,exist_ok=True)
(backup/p.name).write_bytes(p.read_bytes())
p.write_text(updated,encoding='utf-8')
print('Klaar: de kaart Kies of ontwerp jouw stadion toont nu de nieuwe foto. Nog niet gepubliceerd.')
