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
│   └── init.js         Start: Tabs, Anmeldung, Laden der Daten
├── docs/
│   └── anforderungen.md  Fachliche Anforderungen aus den Absprachen
├── .gitignore
└── README.md
```

Die Reihenfolge der Skripte in `index.html` ist wichtig: `app.js`, `tour.js`, `init.js`.

## Status

Der Code ist eine 1:1-Übernahme der bisherigen Artifact-Version. Die Datenanbindung nutzt dort die Laufzeit von claude.ai (`window.claude.use('db' | 'user' | 'assets' | 'downloads')`). Außerhalb von claude.ai funktioniert das nicht. Die Umstellung auf Firebase (Firestore für Daten, Storage für Fotos, Google-Anmeldung) ist der nächste Schritt.

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
