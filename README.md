# DigiDay – GitHub Pages
Samostatná aplikace bez serveru a bez přihlášení. Zakázky i PDF ukládá do IndexedDB v prohlížeči. Žádná obchodní data nejsou součástí tohoto projektu.

## Nejjednodušší nahrání na GitHub
1. Vytvoř nový repozitář (například digiday-evidence).
2. Nahraj obsah této složky, nikoliv nadřazenou složku DigiDay evidence. V kořenu repozitáře mají být package.json, index.html a složka docs.
3. V repozitáři otevři Settings → Pages.
4. Vyber Source: GitHub Actions. V sekci Actions otevři Publish DigiDay to GitHub Pages a případně klikni na Run workflow.
5. Po dokončení workflow GitHub zobrazí odkaz na web; publikování může chvíli trvat.

Složka docs obsahuje hotovou sestavenou aplikaci. Funguje i pod adresou /nazev-repozitare/ a s vlastní doménou. Pokud kopíruješ soubory přes webové rozhraní, nezapomeň na obsah docs/assets.

### Automatické sestavení po změnách
Přiložený .github/workflows/pages.yml po změně na větvi main aplikaci otestuje, sestaví a publikuje. Alternativně lze použít Settings → Pages → Source: Deploy from a branch, větev main a složku /docs. Pro tuto ruční variantu vynech soubor workflow a při úpravách aktualizuj docs pomocí npm run build.

## První použití
Klikni na Import a export → Vybrat Excel. Podporovaný je původní měsíční Excel s rokem v názvu i export z této aplikace. Import prochází jednotlivé řádky, mezisoučty nepřebírá. Přílohy připoj ručně. Data z původní online aplikace Sites se sem nepřenášejí automaticky; použij její Excel export a PDF stáhni a přilož znovu.

## Ukládání a zálohy
- Evidence zůstává v konkrétním prohlížeči, profilu a webové adrese. Stejný počítač v jiném prohlížeči ji nesdílí.
- Bez přihlášení: kdokoliv s přístupem k tvému profilu prohlížeče může vidět uloženou evidenci. GitHub hostuje jen kód aplikace, záznamy se na GitHub neposílají.
- Na stránce Import a export používej Stáhnout úplnou zálohu. JSON záloha obsahuje všechny záznamy i PDF. Export Excelu PDF neobsahuje.
- Obnovit ze zálohy nahradí současná data až po potvrzení. Před obnovou vytvoř aktuální zálohu a zavři ostatní karty aplikace.
- Změna názvu repozitáře/domény, vymazání dat webu či prohlížeče a anonymní režim mohou způsobit nedostupnost nebo odstranění evidence. Zálohuj předem.
- PDF do 10 MB. Obnova záloh do 200 MB. Dostupná kapacita IndexedDB závisí na prohlížeči a volném místě.
- Automatické čtení údajů z PDF není součástí této verze.
- Zálohy, PDF ani vlastní Excel nikdy nenahrávej do repozitáře. .gitignore není ochranou při ručním uploadu přes web.

## Výpočty
Tržby tvoří základní částky pronájmu, prodeje a softwaru. Doprava a instalace jsou zvlášť. Barter, náhradní plnění, ostatní vyrovnání a storna nejsou v tržbách. Částka po provizi není čistý zisk; částky nepřepočítávají DPH. Pevná provize má přednost před procentní sazbou včetně hodnoty 0.
Původní záznamy z náhradního plnění importujeme jako pevnou provizi. Nejasné datum a barter vyžadují kontrolu. Importní ID vychází z roku, listu a řádku, opakovaný import stejné struktury nepřepisuje existující položky.

## Spuštění na počítači a úpravy
Vyžaduje Node.js 24.
- npm ci
- npm run dev
- Otevři adresu vypsanou terminálem.
- npm run build aktualizuje složku docs.
- npm run preview otevře náhled sestavené aplikace.
Index.html se neotevírá dvojklikem přes file://; použij lokální server nebo GitHub Pages.

Původní projekt Sites zůstává v nadřazené složce. Pro GitHub používej pouze tento samostatný projekt.
