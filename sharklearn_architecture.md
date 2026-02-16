# SHARKLEARN (v60) - Arhitektura Sustava i Dokumentacija
> **Autor:** Karlo & Antigravity AI
> **Zadnje Ažuriranje:** 16. veljače 2026.

## 1. Pregled Sustava (High-Level Overview)
SharkLearn je hibridna **PWA (Progressive Web App)** aplikacija koja kombinira brzinu lokalnog HTML/JS-a s fleksibilnošću Google Sheets "backend-a".

**Ključne Značajke:**
*   **Offline-First:** Radi bez interneta koristeći lokalne fallback podatke (V55 dump).
*   **Live Cloud Sync:** Ako ima interneta, povlači najnovija pitanja iz Google Sheeta.
*   **Anti-Cheat Sustav:** Onemogućuje pauziranje, izlaske i varanje (Strict Mode).
*   **Teacher Dashboard:** Google Sheet služi kao CMS za dodavanje pitanja i praćenje rezultata.

---

## 2. Frontend (Aplikacija)
Smještena u mapi `edukacija-app`. Pokreće se putem GitHub Pages.

### `index.html` (Glavna Ulazna Točka)
*   Sadrži kompletan UI: Welcome Screen, Grade Selection, Subject Selection, Quiz UI, Result Screen.
*   Koristi **Glassmorphism** dizajn (`shark_style.css`).
*   Učitava `quiz_engine.js` i lokalne skripte s pitanjima (`content/*.js`).

### `quiz_engine.js` (Mozak Aplikacije)
*   **Klasa `QuizEngine`:** Upravlja cijelim životnim ciklusom kviza.
*   **Logika Učitavanja:**
    1.  Provjerava internet i pokušava dohvatiti pitanja s Google Apps Script API-ja.
    2.  Ako ne uspije (ili nema neta), koristi *fallback* varijable (npr. `GEO_DATA`) iz lokalnih datoteka.
*   **Logika Igre:**
    *   Miješa pitanja (`shuffleArray`).
    *   Prati živote (5) i bodove (100 po točnom).
    *   Odbrojava vrijeme (`duration` heartbeat).
*   **Sigurnosni Sustav (Anti-Cheat):**
    *   `visibilitychange`: Ako aplikacija ode u pozadinu (minimziacija, novi tab), KVIZ SE PREKIDA (`endGame(false)`) i sprema se kao neuspješan.
    *   `handleEarlyExit`: Ručni izlazak ("X" ili "Nazad") pita za potvrdu i sprema statistiku.

### `shark_style.css` (Dizajn)
*   Definira Neon temu (Cyan/Orange/Purple).
*   Animacije (shake, glow, transition).
*   Responsive dizajn za mobitele.

---

## 3. Backend (Google Sheets & Apps Script)
Sustav ne koristi klasičnu bazu podataka već Google Spreadsheet, što omogućuje besplatno hostanje i jednostavno uređivanje.

### Google Sheet ("Baza")
*   **Tabovi za Pitanja:** `Biologija7`, `Geografija5`, `Fizika7`, itd.
    *   Stupci A-J: ID, Pitanje, A, B, C, D, Točan(0-3), Slika, Objašnjenje, Semestar.
*   **Tab `Stats`:**
    *   Svi rezultati dolaze ovdje.
    *   Stupci A-L: Datum, Učenik, Email, ..., Bodovi, Trajanje, Završeno.

### `backend_sync.gs` (API)
*   Google Apps Script koji glumi REST API.
*   `doGet()`: Vraća JSON s pitanjima iz Sheeta.
*   `doPost()`: Prima rezultate kviza i upisuje ih u `Stats` tab.
*   **Keepalive podrška:** Omogućuje spremanje podataka čak i kad se preglednik zatvara.

---

## 4. Alati za Održavanje (Maintenance Tools)
Skripte koje pomažu u sinkronizaciji lokalnih datoteka s "Cloudom".

### `super_shuffle.ps1` (PowerShell)
*   **Svrha:** Ažuriranje lokalnih `bulk_*.md` i `V55_QUIZ_*.md` datoteka.
*   **Kako radi:**
    1.  Čita sirove podatke iz `brain/` mapa.
    2.  Miješa pitanja.
    3.  Formatira ih u JSON (JS varijable).
    4.  Sprema u `content/` folder aplikacije.
*   **Kada pokrenuti:** Kad dodaš PUNO novih pitanja i želiš da budu dostupna i OFFLINE (bez interneta).

### `backend_sync.gs` (Daily Reports)
*   Sadrži trigger `sendDailySummaries` koji (ako se podesi trigger) može slati email roditeljima svaki dan s izvještajem.

---

## 5. Tijek Podataka (Data Flow)

1.  **Učenik otvara app:**
    *   Odabire Ime (Local Storage pamti).
    *   Odabire Razred -> Predmet.
2.  **Učitavanje:**
    *   App viče "Daj pitanja!" Google Skripti.
    *   Skripta čita Sheet i vraća JSON.
    *   (Ako faila, App učitava lokalni `content/bio_7.js`).
3.  **Kviz:**
    *   Korisnik rješava.
    *   Ako izađe (Home) -> **GAME OVER + SAVE**.
4.  **Kraj:**
    *   App šalje `POST` zahtjev na Google Skriptu.
    *   Skripta upisuje redak u `Stats`.

---

## 6. Često Postavljana Pitanja (FAQ)

**Q: Dodao sam pitanje u Sheet, ali se ne vidi u aplikaciji?**
A: Osvježi aplikaciju (pull-to-refresh). Ponekad treba 2 puta zbog cache-a. Ako i dalje nema, provjeri ima li pitanje oznaku točnog odgovora (0-3).

**Q: Tablica 'Stats' je prazna ili zbrkana?**
A: Provjeri jesu li zaglavlja u redu (A-L). Skripta očekuje točan redoslijed.

**Q: Kako dodati novi predmet?**
1.  Napravi novi Sheet tab (npr. `Kemija8`).
2.  Dodaj karticu u `index.html`.
3.  Dodaj logiku u `quiz_engine.js` (u `catch` blok za lokalni fallback).
