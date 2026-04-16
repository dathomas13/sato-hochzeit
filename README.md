# sato-hochzeit · Hochzeits-Website

Gäste-RSVP-Website für Thomas & Sarah, 05.09.2026, Aurora by Event Passion, Kemnath.  
Deployed auf GitHub Pages: `https://dathomas13.github.io/sato-hochzeit/`

---

## Inhaltsverzeichnis

1. [Technologie-Stack](#technologie-stack)
2. [Dateistruktur](#dateistruktur)
3. [Ersteinrichtung Firebase](#ersteinrichtung-firebase)
4. [Hochzeits-Konfiguration](#hochzeits-konfiguration)
5. [Offene TODOs](#offene-todos)
6. [Lokal testen](#lokal-testen)
7. [Deployment (GitHub Pages)](#deployment-github-pages)
8. [Firestore Datenmodell](#firestore-datenmodell)
9. [Admin-Panel](#admin-panel)
10. [Design-System](#design-system)
11. [Wichtige Implementierungsdetails](#wichtige-implementierungsdetails)

---

## Technologie-Stack

| Bereich | Technologie |
|---------|-------------|
| Frontend | Vanilla HTML / CSS / JS (ES Modules, kein Build-Tool) |
| Datenbank | Firebase Firestore |
| Authentifizierung | Firebase Auth (E-Mail/Passwort) |
| Hosting | GitHub Pages |
| Schriften | Google Fonts: Cormorant Garamond (Serif), Inter (Sans-serif) |
| Karte | Google Maps Embed (kein API-Key erforderlich) |

---

## Dateistruktur

```
sato-hochzeit/
├── index.html              # Gäste-Seite (RSVP)
├── admin.html              # Admin-Dashboard (Login + Gästeliste)
├── css/
│   └── style.css           # Alle Styles (Tokens, Komponenten, Responsive, Print)
├── js/
│   ├── firebase-config.js  # ← HIER alle Konfigurationen eintragen
│   ├── rsvp.js             # Logik der Gäste-Seite
│   └── admin.js            # Logik des Admin-Dashboards
└── img/
    └── uns.jpg             # Foto von Thomas & Sarah (TODO: Datei ablegen)
```

---

## Ersteinrichtung Firebase

### 1. Firebase-Projekt anlegen

1. Unter [console.firebase.google.com](https://console.firebase.google.com) neues Projekt erstellen
2. **Firestore Database** aktivieren (Produktionsmodus)
3. **Authentication** aktivieren → Anmeldemethode **E-Mail/Passwort** einschalten
4. Unter Authentication → Benutzer einen Admin-Account anlegen (E-Mail + Passwort)

### 2. Firebase-Konfiguration eintragen

In `js/firebase-config.js` die Platzhalter durch die echten Werte ersetzen  
(zu finden unter Firebase Console → Projekteinstellungen → Allgemein → Deine Apps):

```js
export const firebaseConfig = {
  apiKey:            "...",
  authDomain:        "PROJEKT.firebaseapp.com",
  projectId:         "PROJEKT",
  storageBucket:     "PROJEKT.appspot.com",
  messagingSenderId: "...",
  appId:             "..."
};
```

`isFirebaseConfigured()` prüft, ob `apiKey` noch mit `"DEIN_"` beginnt — solange das der Fall ist, ist das RSVP-Formular deaktiviert und es erscheint eine Fehlermeldung.

### 3. Firestore-Sicherheitsregeln

In der Firebase Console → Firestore → Regeln:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rsvp/{docId} {
      // Gäste dürfen Einträge anlegen und ihren eigenen lesen/aktualisieren
      allow read, write: if true;
    }
  }
}
```

> **Hinweis:** Für den Admin-Lesezugriff reicht dies, da `admin.js` mit Firebase Auth arbeitet und `onSnapshot` bei nicht authentifizierten Nutzern ohnehin keinen Zugriff erhält, solange Firestore-Regeln dies einschränken. Strengere Regeln (z. B. `allow write: if true; allow read: if request.auth != null;`) sind möglich, aber nicht zwingend nötig bei einer privaten Hochzeits-Website.

---

## Hochzeits-Konfiguration

Alle inhaltlichen Angaben werden zentral in `js/firebase-config.js` gepflegt:

```js
export const weddingConfig = {
  brideAndGroom:     "Thomas & Sarah",
  brideAndGroomHtml: "Thomas<br>&amp;<br>Sarah", // HTML für Hero-Titel
  date:              "Samstag, 5. September 2026",
  isoDate:           "2026-09-05",               // Für Countdown und <title>
  doorsTime:         "13:00",                    // Einlass (nur in Konfig)
  ceremonyTime:      "13:30",                    // Trauung – Countdown-Ziel
  venue:             "Aurora by Event Passion",
  venueShort:        "Aurora",                   // Kurzform im Hero
  address:           "Rohrwiesen 4, 95478 Kemnath",
  city:              "Kemnath",
  rsvpDeadline:      "31. Mai 2026",
  contactEmail:      "info.thomas.sarah@gmail.com"
};
```

`rsvp.js` liest diese Werte beim Laden aus und befüllt folgende DOM-Elemente:

| Element-ID | Inhalt aus `weddingConfig` |
|------------|----------------------------|
| `#hero-names` | `brideAndGroomHtml` |
| `#hero-date` | `date` |
| `#hero-venue` | `venueShort · city` |
| `#info-ceremony-time` | `ceremonyTime` |
| `#info-venue` | `venue` |
| `#rsvp-deadline` | `rsvpDeadline` |
| `#footer-contact` | `contactEmail` (als `mailto:`-Link) |
| `<title>` | `brideAndGroom · DD.MM.YYYY` |

---

## Offene TODOs

### Couple-Foto

Datei `img/uns.jpg` in das Repository legen. Das `<img>`-Tag ist in der Story-Sektion (`#story`) bereits vorhanden und zeigt das Bild automatisch.

### Galerie-Fotos

In `index.html` in der `#gallery`-Sektion die vier `.gallery__placeholder`-Divs durch echte `<img>`-Tags ersetzen:

```html
<!-- Vorher (Platzhalter): -->
<div class="gallery__slide gallery__placeholder">
  <span class="gallery__placeholder-text">Foto folgt</span>
</div>

<!-- Nachher (echtes Foto): -->
<img src="img/galerie1.jpg" alt="Kurzbeschreibung" class="gallery__slide" loading="lazy" />
```

Die Galerie scrollt automatisch horizontal als Karussell. Weitere Slides können als zusätzliche `<img class="gallery__slide">` ergänzt werden — das JS dupliziert sie automatisch für den Endlos-Loop.

### Hotel-Karten

In der `#infos`-Sektion die drei `.hotel-card`-Links befüllen (`href`, Name, Adresse):

```html
<a href="https://www.hotelwebsite.de" class="hotel-card">
  <p class="hotel-card__name">Hotel Musterhaus</p>
  <p class="hotel-card__location">Musterstraße 1 · ca. 3 km</p>
  <span class="hotel-card__link-label">Website →</span>
</a>
```

### Ablauf

Alle Zeiten sind eingetragen. Bei Bedarf weitere Timeline-Einträge in `index.html` im `<div class="timeline">` ergänzen:

```html
<div class="timeline__item">
  <span class="timeline__time">19:00</span>
  <div class="timeline__body">
    <p class="timeline__event">Programmname</p>
    <p class="timeline__note">Optionaler Hinweistext</p>
  </div>
</div>
```

---

## Lokal testen

ES Modules (`type="module"`) erfordern einen HTTP-Server — `index.html` per Doppelklick öffnen funktioniert nicht.

```bash
# Python (meist vorinstalliert)
cd sato-hochzeit
python3 -m http.server 8080
# → http://localhost:8080

# Alternativ mit Node.js
npx serve .
```

---

## Deployment (GitHub Pages)

GitHub Pages liefert den Repository-Inhalt direkt aus. Nach einem Push ist die Seite nach ~1–2 Minuten live.

```bash
git add .
git commit -m "Beschreibung der Änderung"
git push
```

> **Sicherheitshinweis:** `js/firebase-config.js` mit dem echten API-Key ist im öffentlichen Repository sichtbar. Das ist bei Firebase mit korrekt konfigurierten Firestore-Sicherheitsregeln akzeptabel — der API-Key allein erlaubt keinen Missbrauch, solange die Regeln Schreibzugriff sinnvoll einschränken. Wer sicherer gehen will, kann Firebase App Check aktivieren.

---

## Firestore Datenmodell

**Collection:** `rsvp`

**Dokument-ID:** Normalisierter Name (`nameToDocId()` in `rsvp.js`)  
→ Kleinschreibung, Nicht-Alphanumerisches → `_`, max. 120 Zeichen  
→ Beispiel: `"Anna Müller"` → `"anna_m_ller"`

> **Achtung:** Zwei Gäste mit identischem (normalisierten) Namen überschreiben gegenseitig ihren Eintrag. In dem Fall muss ein Datensatz manuell in der Firebase Console kopiert/umbenannt werden.

**Felder pro Dokument:**

| Feld | Typ | Mögliche Werte | Hinweis |
|------|-----|----------------|---------|
| `name` | string | beliebig | Pflichtfeld, min. 2 Zeichen |
| `attendance` | string | `"yes"` / `"maybe"` / `"no"` | Pflichtfeld |
| `allergies` | string | Text oder `""` | Leer wenn `attendance = "no"` |
| `wishes` | string | Text oder `""` | Musikwunsch; leer bei `"maybe"` und `"no"` |
| `guests` | string | Text oder `""` | Weitere Personen; leer bei `"no"` |
| `shuttle` | string | `"bus-1"` / `"bus-3"` / `"none"` / `""` | Bus 1 Uhr / 3 Uhr / selbst; leer bei `"maybe"` und `"no"` |
| `timestamp` | Timestamp | Server-Zeitstempel | Wird bei Erstanlage und Update gesetzt |
| `updated` | boolean | `true` | Nur vorhanden, wenn Eintrag bereits existierte (Wiederholung) |

---

## Admin-Panel

Erreichbar unter `/admin.html`. Zugang nur nach Firebase-Login (E-Mail/Passwort).

### Funktionen

| Funktion | Beschreibung |
|----------|-------------|
| Echtzeit-Updates | Gästeliste aktualisiert sich automatisch via Firestore `onSnapshot()` |
| Statistiken | Anzahl Zusagen / Vielleicht / Absagen / Gesamt |
| Filtern | Nach Zusage-Status (Alle / Zusagen / Vielleicht / Absagen) |
| Suchen | Freitextsuche nach Name |
| Sortieren | Klick auf Spaltenköpfe: Name, Zusage, Fahrservice, Zeitpunkt |
| CSV-Export | Download der aktuell gefilterten Liste als `.csv` (UTF-8 BOM für Excel-Kompatibilität) |
| PDF / Drucken | `window.print()` mit optimiertem Print-Stylesheet |

### Tabellenspalten

Name · Zusage · Allergien · Musikwunsch · Fahrservice · Weitere Gäste · Zeitpunkt

### CSV-Dateiname

`gaesteliste_YYYY-MM-DD.csv` (Datum des Exports)

---

## Design-System

### Farb-Tokens

```css
/* Akzentfarbe */
--gold:        #6B8BA4   /* Dusty Steel Blue – Hauptakzent */
--gold-light:  #A4C0D2
--gold-dark:   #46687E

/* Hintergründe */
--cream:       #F7F4EF   /* Warmes Elfenbein */
--cream-dark:  #E2E7EB

/* Dunkle Töne */
--navy:        #2C3840   /* Charcoal Slate */
--navy-mid:    #3C4F5E
--navy-soft:   #506070

/* Text */
--text:        #28333C
--muted:       #728492

/* UI */
--border:      #CDD4DA
--success:     #2f7d54
--danger:      #b03a2e
--radius:      2px
--max-width:   760px
```

### Sektions-Rhythmus

```
Hero            dunkel  (#2C3840 Gradient)
Ablauf          hell    (--cream)
Geschichte      getönt  (#E6EEF4)
Momente         hell    (--cream)
Details         getönt  (#E6EEF4)
Anreise         hell    (--cream)
RSVP            getönt  (#E6EEF4)
```

### Responsive Breakpoint

Mobile-Hamburger-Menü und angepasstes Layout ab **≤ 680 px**.

---

## Wichtige Implementierungsdetails

### `nav::before` statt `nav` für `backdrop-filter`

`backdrop-filter` auf einem Element macht es zum **Containing Block für `position: fixed`-Kinder**. Das würde die mobile Menü-Overlay-Positionierung brechen (Overlay streckt sich nur über den Nav-Bereich, nicht über den gesamten Viewport).

**Lösung:** Der Blur-Effekt sitzt auf `nav::before`. Pseudo-Elemente erzeugen keinen Containing Block für das Elternelement.

### Hamburger-Menü: z-index-Schichten (Mobile)

```
Viewport
└── nav  (position: fixed, z-index: 100)
    ├── nav::before  (z-index: -1, trägt backdrop-filter)
    ├── .nav__links.open  (position: fixed, inset: 0, z-index: 99)  ← Vollbild-Overlay
    └── .nav__toggle  (position: relative, z-index: 100)             ← bleibt tappbar über dem Overlay
```

Der Toggle hat `position: relative` + `z-index: 100`, weil statische Elemente in einem Stacking-Context immer hinter positionierten Elementen mit explizitem z-index gerendert werden — ohne `position: relative` würde der Schließen-Button hinter dem Overlay verschwinden.

### Galerie: Infinite Scroll

`setupGallery()` in `rsvp.js` **dupliziert alle Slides beim Laden per JS**. Der `requestAnimationFrame`-Loop scrollt mit 0,5 px/Frame nach rechts. Sobald `scrollLeft` die halbe Gesamtbreite (`scrollWidth / 2`) erreicht, springt er auf 0 zurück — da die zweite Hälfte ein identischer Klon der ersten ist, ist der Übergang nahtlos.

### Countdown

Läuft gegen `isoDate + "T" + ceremonyTime + ":00"`. Nach dem Hochzeitsdatum zeigt er `"Heute ist es soweit! 🎉"` an und stoppt den Interval.

### Bedingte RSVP-Felder

Die Felder Allergien, Musikwunsch, Weitere Gäste und Fahrservice sind standardmäßig mit `max-height: 0; opacity: 0` (CSS-Klasse `.conditional`) ausgeblendet. `setupConditionalFields()` in `rsvp.js` setzt beim Auswählen einer Antwort die Klasse `.show` (`max-height: 400px; opacity: 1`). Beim Speichern werden nicht angezeigte Felder explizit auf `""` gesetzt.

| Feld | Sichtbar bei |
|------|-------------|
| Allergien | yes, maybe |
| Musikwunsch | yes |
| Weitere Gäste | yes, maybe |
| Fahrservice | yes |
