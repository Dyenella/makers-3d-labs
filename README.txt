MAKERS 3D LABS – WEBSHOP BASIS
================================
Dit pakket is een eerlijke eerste webshopfase, GEEN live verkoopplatform.

INSTALLATIE IN GITHUB CODESPACES
1. Maak zo nodig eerst een backup/commit van de huidige site.
2. Upload alle bestanden en de map assets/ naar de hoofdmap /workspaces/makers-3d-labs.
3. Open een terminal in die map en voer uit: python3 install.py
4. Laat je server draaien: python3 -m http.server 8000
5. Open winkel.html via de Codespaces Ports-preview.
6. Controleer de nieuwe commerce-balk en de uitgebreide footer op alle pagina's.
7. Controleer git status, en commit pas wanneer de pagina's goed werken.

BESTANDEN
assets/shop.css – styling voor nieuwe onderdelen en footer
assets/shop.js – winkelwagen (browser-localStorage), menu-links, footer, catalogus
assets/shop-data.js – producten, nog zonder definitieve prijzen
winkel.html – winkel
winkelwagen.html – winkelwagen
account.html – accountweergave, nog geen login
bestellingen.html – besteloverzicht, nog geen orderdata
informatie.html – placeholders voor beleidsinformatie
install.py – voegt CSS/JS verwijzingen toe aan bestaande zes pagina's

BELANGRIJK
- Geen betaling, geen echte accountregistratie en geen daadwerkelijke bestelling.
- Prijzen worden niet verzonnen. priceCents=null moet later worden ingevuld.
- Voor echte klantaccounts en orders: Supabase Auth + tabellen + Row Level Security (RLS).
- Voor veilige betalingen: een server-side checkout en webhooks via een betaalprovider.
- Gebruik nooit service-role sleutels of betaalprovider-secret keys in client-JavaScript.
- Bij plaatsing van vaste verkoopprijzen moet eerst btw, levering en retourbeleid zijn geregeld.
- De bestaande offertepagina blijft intact.
