# Projekt-Hinweise für Claude

## Branch-Workflow (WICHTIG)

Diese Seite ist **live** und wird von echten Gästen benutzt. Deshalb gilt:

1. **Immer zuerst auf dem `dev`-Branch entwickeln.** Alle Änderungen kommen
   zunächst nach `dev` und werden unter `…/sato-hochzeit/dev/` getestet.
2. **Erst nach erfolgreichem Test** die Änderungen nach `main` portieren
   (mergen) – `main` ist die Live-Seite.
3. Den `dev`-Branch **immer bestehen lassen** (nicht löschen).

Wenn nichts anderes gesagt wird: neue Arbeit standardmäßig auf `dev`, am Ende
nach `main` bringen.

## Deployment (GitHub Pages)

- Quelle: **GitHub Actions** (`.github/workflows/deploy.yml`).
- Jeder Lauf baut die komplette Seite zusammen:
  - `main`  → Live-Seite im Wurzelverzeichnis (`…github.io/sato-hochzeit/`)
  - `dev`   → Vorschau unter `/dev/` (`…github.io/sato-hochzeit/dev/`)
- Auf der `/dev/`-Vorschau wird **automatisch** die RSVP-Speicherung
  deaktiviert (Firebase-apiKey wird beim Build neutralisiert) und ein rotes
  „DEV-VORSCHAU"-Banner eingeblendet. Das passiert nur im Build, der Quellcode
  ist auf `dev` und `main` identisch.
- Beide Branches (`main` und `dev`) dürfen ins `github-pages`-Environment
  deployen (Environment-Regel in den Repo-Settings).

## Technik-Stack

- Statische Seite: reines HTML/CSS/JS, kein Build-Schritt nötig.
- Daten/RSVP über Firebase Firestore (`js/firebase-config.js`,
  Logik in `js/rsvp.js`). **Eine** gemeinsame Live-Datenbank – auf `dev`
  daher bewusst deaktiviert (s. o.), damit keine Test-Eingaben in der echten
  Gästeliste landen.
