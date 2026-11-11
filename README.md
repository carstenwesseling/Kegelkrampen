# Kegelclub „Kegelkrampen“

Webseite zur Verwaltung der Kegelabende: Eingabe der Anwesenden und Ergebnisse, Kasse, Dortmunder, Berg und Tal, Historie, Auswertungen, Mitgliederliste und Fotos der Kegeltouren.

## Struktur

```
.
├── index.html          Einstieg: Markup der Seite, bindet CSS und JS ein
├── css/
│   └── style.css       Layout, Farben, Tabellen, Diagramme, Bildansicht
├── js/
│   ├── app.js          Eingabe, Berechnung, Historie, Auswertung, Mitglieder
│   ├── tour.js         Kegeltouren: Upload, Jahre, Diashow
│   ├── dortmunder-import-data.js  Dortmunder-Werte 2013–2025 aus der Excel-Datei
│   ├── dortmunder-import.js       Import-Knopf in der Historie (nur Besitzer)
│   └── init.js         Start: Tabs, Anmeldung, Laden der Daten
├── docs/
│   └── anforderungen.md  Fachliche Anforderungen aus den Absprachen
├── .gitignore
└── README.md
```

Die Reihenfolge der Skripte in `index.html` ist wichtig: `app.js`, `dortmunder-import-data.js`, `dortmunder-import.js`, `tour.js`, `init.js`.

## Status

Die App läuft mit Firebase (Projekt `kegelkrampen-67e7f`): Firestore für die Daten, Storage für die Fotos, Google-Anmeldung. `js/backend.js` stellt dieselbe Schnittstelle bereit, die die App bisher über claude.ai nutzte (`window.claude.use(...)`), damit die übrige App unverändert bleibt.

- Lesen: für alle. Schreiben (Abende, Mitglieder, Rekorde, Fotos): nur für `carsten.wesseling@gmail.com` nach Google-Anmeldung.
- Der Datenimport aus dem Artifact ist noch offen. Solange er fehlt, ist die Datenbank leer.

### Einrichtung (einmalig)

1. In der Firebase-Konsole unter Authentication → Settings → „Autorisierte Domains“ die Domain eintragen, auf der die Seite läuft (z. B. `localhost` und später `<nutzer>.github.io`).
2. Regeln veröffentlichen: `firebase deploy --only firestore:rules,storage` (Firebase CLI nötig, Login mit `firebase login`).
3. Die Seite über GitHub Pages veröffentlichen (Settings → Pages → Branch `main`, Ordner `/ (root)`).

### Dateien für Firebase

- `js/config.js`: Projektkonfiguration und Besitzer-E-Mail
- `js/backend.js`: Anbindung an Firestore, Auth und Storage
- `firestore.rules`, `storage.rules`, `firebase.json`: Zugriffsregeln

## Datenmodell (bisher)

| Dokument | Inhalt |
| --- | --- |
| `sessions/<YYYY-MM-DD>` | ein gespeicherter Spieltag mit Zeilen, Kasse, Könige, Dortmunder und Berg-und-Tal |
| `state/entwurf` | aktueller Entwurf der Eingabe |
| `state/config` | Rekorde und Einstellungen |
| `state/mitglieder` | Mitgliederliste (Reihenfolge), Gäste, weitere Mitglieder |
| `touren/<id>` | Metadaten eines Kegeltour-Fotos (Jahr, Bild-IDs, Name) |

## Lokal ansehen

Einfach `index.html` im Browser öffnen oder einen statischen Server starten, zum Beispiel `python3 -m http.server`. Ohne Datenbank zeigt die Seite „Keine Datenbank verbunden“ an.

## Regeln für Änderungen

- Fachliche Änderungen zuerst in `docs/anforderungen.md` festhalten.
- Berechnungen liegen im Bereich `//CALC-START` bis `//CALC-END` in `js/app.js`. Dort nichts ändern, ohne die Anforderungen zu prüfen.
- Speichern und Bearbeiten älterer Abende haben eine Kettenlogik (Reste und Konto). Die Bereiche `//EDIT-START` bis `//EDIT-END` nur mit Tests ändern.
