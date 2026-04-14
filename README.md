# sato-hochzeit

Elegante RSVP-Website für unsere Hochzeit – Vanilla JS + Firebase, bereit für
GitHub Pages.

## Features

- **Gäste-Seite** (`index.html`)
  - Full-screen Hero mit Radial-Gradient, Ornament-Pattern und Live-Countdown
  - Fixed Nav mit Scroll-Blur
  - Ablauf (Dark-Section), Story ("Wir zwei"), RSVP
  - Fade-in Animationen via IntersectionObserver (respektiert `prefers-reduced-motion`)
  - RSVP-Formular mit conditional fields
    (Allergien nur bei Zusage/Vielleicht, Musikwunsch nur bei Zusage)
  - Zwei verschiedene Success-Messages (yes/maybe vs no)
  - Mobile-first, responsive
- **Admin-Panel** (`admin.html`)
  - Firebase Email/Password Login
  - Realtime-Gästeliste (`onSnapshot`)
  - Übersicht mit Zusagen/Vielleicht/Absagen
  - Filter nach Status + Volltextsuche, sortierbare Spalten
  - CSV-Export (Excel-kompatibel, mit BOM)
  - PDF/Print (sauberes Print-Stylesheet, keine externe Lib)

## Struktur

```
.
├── index.html
├── admin.html
├── css/style.css
├── js/
│   ├── firebase-config.js   # Platzhalter + zentrale Hochzeits-Konfig
│   ├── rsvp.js              # Gäste-Formular
│   └── admin.js             # Admin-Dashboard
├── README.md
└── .gitignore
```

## Setup (morgen)

1. **Firebase-Projekt** anlegen: <https://console.firebase.google.com>
2. Werte in `js/firebase-config.js` eintragen (`apiKey`, `projectId`, …).
   Diese Config ist bewusst *public* – Sicherheit läuft über Firestore Rules.
3. **Authentication** → Email/Password aktivieren, Admin-User anlegen.
4. **Firestore Rules** (Minimal-Beispiel):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /rsvp/{id} {
         allow create, update: if
           request.resource.data.keys().hasAll(['name','email','attendance']) &&
           request.resource.data.name is string &&
           request.resource.data.name.size() < 200;
         allow read, delete: if request.auth != null;
       }
       match /config/{id} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```
5. Hochzeitsdatum/Ort in `weddingConfig` (unten in `firebase-config.js`) pflegen.
6. Push → GitHub Pages aktivieren (Branch `main`, `/` root).

## Lokal testen

Wegen ES-Modulen muss ein Mini-Server laufen (einfaches `file://` reicht
nicht):

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

## Datenmodell

Collection `rsvp/`, Doc-ID = normalisierte Email (→ Upsert beim erneuten
Absenden):

| Feld        | Typ       | Beispiel                |
|-------------|-----------|-------------------------|
| name        | string    | "Anna Müller"           |
| email       | string    | "anna@example.com"      |
| attendance  | string    | "yes" / "maybe" / "no"  |
| allergies   | string    | "vegetarisch"           |
| wishes      | string    | "Musikwunsch XY" (nur bei yes) |
| timestamp   | Timestamp | serverTimestamp()       |
| updated     | boolean?  | true bei 2. Abgabe      |

## Design-Tokens

- Gold `#c9a96e` (Light `#e8d5b0`, Dark `#a88850`)
- Creme `#faf8f5`
- Navy `#1a163d` (Mid `#26215c`)
- Serif: Cormorant Garamond (inkl. Italics für Zeiten/Datum)
- Sans: Inter (Body, Labels, Buttons)
