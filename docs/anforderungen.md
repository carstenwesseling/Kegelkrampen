# Anforderungen – Kegelclub „Kegelkrampen“

Stand: aus den bisherigen Absprachen übernommen. Die Liste ist der fachliche Bezugspunkt für Änderungen an der App.

## Ausgangspunkt

- Die App entstand aus dem Google Sheet „Kegeln_zahlen_2026“ (Eingabemaske, Formeln, historische Daten als Datenbank).
- Erstes Tabellenblatt = Eingabemaske, deren Formeln übernommen wurden. Das zweite Tabellenblatt wird ignoriert.
- Weitere Tabellenblätter sind historische Spieltage. Der Tabellenname ist das Datum des Abends.
- Ältere Blätter (2013) werden in die neue Logik übernommen; fehlende Daten bleiben leer.

## Navigation und Startseite

- Navigation: Am Handy und Tablet (bis 1023 px) eine feste Tab-Leiste unten mit Icon und Text: Eingabe, Historie, Auswertung, Dortmunder, Mehr. „Mehr“ öffnet ein Bottom-Sheet mit Startseite, Mitglieder, Kegeltouren und dem Bereich „Konto“ (Anmeldestatus, Mit Google anmelden, Per Link anmelden, Abmelden). Am Desktop stehen alle Seiten in der Leiste oben; der Konto-Knopf oben rechts öffnet dasselbe Menü.
- Oben eine schmale App-Leiste mit „KK“ (führt zur Startseite), Seitentitel und Konto-Knopf. Darunter die Sprungmarken der Seite; der gerade sichtbare Abschnitt ist markiert.
- Jede Ansicht hat eine eigene Adresse (`#/start`, `#/eingabe/<schritt>`, `#/historie/<datum>`, `#/auswertung`, `#/dortmunder`, `#/mitglieder`, `#/touren`). Zurück-Knopf, Neu laden und Links führen zur selben Ansicht.
- Startseite: Bild „Willingen 2026“ (`img/willingen-2026.jpg`, immer ganz und unverzerrt) und darunter (am Desktop daneben) eine Übersicht: nächster Abend mit Umfrage-Stand und Knopf „Abend erfassen“, Kontostand, offene Beträge des letzten Abends, Könige des letzten Abends, Schnellzugriff.
- Rückmeldungen (gespeichert, Fehler) erscheinen als kurze Meldung unten (Toast). Aktionen, die Daten löschen oder zurücksetzen (Gast entfernen, Umfrage zurücksetzen, Paare neu auslosen), fragen vorher nach.

## Eingabe

- Die Eingabe ist in fünf Schritte gegliedert (Leiste oben, „Weiter“/„Zurück“ am Ende jedes Schritts): 1 Vorbereitung (Umfrage, Anwesenheit, Gäste), 2 Spiel (Zählwerte), 3 Dortmunder, 4 Berg & Tal, 5 Abschluss (Zahlungen, Kasse, Könige, Rekorde). Unten steht eine feste Leiste mit Spieltag-Datum, PDF und „Abend speichern“; der Stand des Entwurfs steht in der Kopfzeile.
- Spiel: Tabelle im selben Aufbau wie Berg und Tal und Dortmunder: je anwesender Person eine Zeile, links der Name, dann 7 Eingabefelder (verl. Spiele, Pumpen, Klingel, Kugel Tisch, Alle Neune, Kranz Hand, Lotterie) und am Ende die Spalte „Summe“. Die Summe ist der Betrag der Person für diese 7 Felder in € (Summe aus der Berechnung ohne Beitrag und ohne „Runde bezahlt“) und rechnet beim Eintippen live mit. Gäste haben nur Alle Neune, Kranz Hand und Lotterie und keine Summe (sie zahlen nicht). Die Zählwerte (verl. Spiele bis Kranz Hand) haben Knöpfe − und + (nicht unter 0) und lassen sich auch eintippen; Enter springt zum nächsten Feld (Zeile für Zeile). Am Handy und Tablet (bis 1023 px) steht jede Person als Block mit beschrifteten Feldern. Die Preise stehen zugeklappt darüber (ändern nur der Besitzer).
- Zahlungen: je Mitglied eine Karte mit „Noch zu zahlen“ groß, Eingabe von „Runde bezahlt“ und „Hat gezahlt“ und den übrigen Werten; darunter die Summe.
- Anwesenheit wird pro Abend ausgewählt; in die Eingabetabelle kommen nur die Anwesenden.
- Die Eingabe ist eine reine Eingabemaske (inkl. Spalte Lotterie). Die übrigen Spalten aller Mitglieder stehen unter „Statistik“.
- Lotterie, „Runde bezahlt“ und „Hat gezahlt“ werden in Euro eingegeben.
- Spieltag-Datum ist frei wählbar, muss aber nach dem letzten gespeicherten Termin liegen.
- Speichern (neuer Abend, inkl. Dortmunder, Berg und Tal, Kasse) dürfen der Besitzer und freigegebene Mitglieder. Freigabe: Der Besitzer trägt E-Mail-Adressen (Google oder andere, z. B. aol.com) im Tab „Mitglieder“ unter „Freigabe“ ein (Firestore `editors/<mail>`). Anmeldung ohne Google-Konto per E-Mail-Link (Knopf „Mit E-Mail-Link anmelden“); in der Firebase-Konsole muss dafür Authentication → Anmeldemethode → „E-Mail/Passwort“ mit aktivierter „E-Mail-Link-Anmeldung“ eingeschaltet sein. Im Tab „Mitglieder“ zeigt „Angemeldete Adressen“ alle, die sich angemeldet haben (Firestore `logins/<mail>`, wird beim Anmelden automatisch geschrieben); „Übernehmen“ gibt eine Adresse zum Speichern frei. Freigegebene dürfen nur neue Abende speichern; Bearbeiten gespeicherter Abende, Rekorde, Mitgliederliste, Preise und Fotos bleiben beim Besitzer. Die Eingabe bleibt als Entwurf erhalten, bis gespeichert wird.
- PDF-Download (Eingabe, Knopf „PDF herunterladen“, für alle sichtbar): Eingabe und Statistik zusammen in einer einfachen schwarz-weißen Tabelle, DIN A4 quer, eine Seite, Aufbau nach „Vorlage Notizen“ (Spalten da, Pumpen, verl. Spiele, Alle Neune, Kranz Hand, Kugel Tisch, Klingel, Lotterie Extra-Spiel, Runde, Restzahlung, gezahlt; Summe der Restzahlung; darunter die Könige). Werte aus dem aktuellen Entwurf.
- Umfrage (Eingabe, über „Anwesenheit“): Liste aller Mitglieder; je Mitglied ein Umschalter „Dabei“ / „Schmeisse einen rein“ / „Kann leider nicht“ (am Handy kurz: Dabei / Rein / Nein; nochmal tippen entfernt die Antwort), darüber die Anzahl je Antwort. Der Knopf „Alle ‚Dabei‘ als anwesend markieren“ setzt diese Mitglieder in der Anwesenheit. Gespeichert in `state/umfrage` (Änderungen live bei allen sichtbar); nach „Abend speichern“ wird sie zurückgesetzt. Ändern dürfen Besitzer und Freigegebene.
- Werte vom gespeicherten Vorabend werden immer übernommen („Rest letztes Kegeln“, „Alter Konto“).
- „Noch zu zahlen“ des letzten Spieltags wird immer in „Rest letztes Kegeln“ übernommen.
- Gäste werden namentlich in Tabelle, Mitgliederliste und Statistik geführt, nicht in der Auswahl für neue Abende. Neue Gäste werden manuell angelegt und nach dem Speichern in die Mitgliederliste übernommen.
- Kasse: hinter „Sonderausgabe“ und „Abgang Konto“ je ein Textfeld. Der Text wird mit dem Wert ausgegeben (auch in der Historie) und mit dem Abend gespeichert.
- Rekorde sind in der Eingabe änderbar und speicherbar und erscheinen zusätzlich als erster Bereich unter Historie.

## Dortmunder

- Eigener Tab. Teilnehmer aus der Eingabe, als Tabelle wie bei Berg und Tal: 7 Eingabespalten plus Summenspalte. Tab und Enter springen spaltenweise zum nächsten Feld.
- Jeder Wert wird mit Multiplikator 1 bis 7 (links nach rechts) multipliziert und zur Summe addiert.
- Werte und Summe werden mit dem Abend gespeichert und in der Historie angezeigt.
- Der Teilnehmer mit der höchsten Summe wird automatisch als Dortmunder-König eingetragen.
- Historie → Spieltage zeigt den Bereich „Dortmunder“ nur für Abende, deren Dortmunder über die Eingabe gespeichert wurde. Dortmunder aus dem Excel-Import (2013–2025, Abend 12.12.2025) stehen nur in der Auswertung; ändert man sie über „Bearbeiten“, erscheint der Bereich ebenfalls.
- Abend 12.12.2025 (fehlte in der Datenbank) steht in `js/abend-import-data.js` (aus „Kegeln_zahlen_2025.xls.xlsx“, Blatt „12.12.2026“ = 12.12.2025) und wird mit demselben Knopf angelegt. Die Reste passen zum 09.01.2026.
- Historische Dortmunder 2013–2025: Werte aus „Dortmunder_2000-2025.xlsx“ (Spalte Q = Jahr, Spalten B–N = Abende des Jahres) stehen in `js/dortmunder-import-data.js` und kommen je Abend als Wert in Spalte 1 (×1) ins Dortmunder-Blatt (Summe = Wert). Die Zuordnung Spalte → Datum erfolgt über die Anwesenheit der Abende in der Datenbank. Nur Abende, die es in der Datenbank gibt; nur Personen, die an dem Abend anwesend waren; „x“ = kein Wert. Import per Knopf in der Historie (nur Besitzer, wiederholbar, überschreibt nichts). Der Dortmunder-König richtet sich nach den Excel-Werten: leer oder abweichend (13.09.2013, 25.03.2016, 14.06.2024) wird angepasst.

## Berg und Tal

- Anwesende werden zufällig zu Paaren gelost; bei ungerader Zahl spielt einer allein.
- Spalten Tal und Berg mit Werten, Summe über alle sieben Werte.
- Das Paar mit der höchsten Summe wird automatisch als König „TBTBBTB“ eingetragen.

## Historie und Bearbeitung

- Gespeicherte Abende sind nicht mehr änderbar, außer über „Bearbeiten“ durch den Besitzer.
- Anzeige: Ergebnisse (verl. Spiele bis Kranz Hand) als ganze Zahlen; nur Preis, Summe und Lotterie in Euro; übrige Geldspalten mit Cent.
- Eingabe und Statistik: Die Preise (Preiszeile, auch „Beitrag“ in der Statistik) kann nur der Besitzer ändern; für alle anderen wird sie nur angezeigt.

## Auswertung

- Könige-Rangliste und Einzelergebnisse pro Spalte, wahlweise als Balken- oder Tortendiagramm.
- Verlaufsdiagramm über alle historischen Spieltage pro Spalte.
- Anwesenheiten, Jahresübersicht, Dortmunder-Auswertung.
- Kein CSV-Export mehr (die Schaltflächen „CSV Teilnahmen“ und „CSV Könige“ wurden entfernt).
- Auswertung: Alle Tabellenspalten lassen sich per Klick auf die Überschrift absteigend (groß nach klein, Text Z–A) sortieren; die Sortierung bleibt beim Neuaufbau der Seite erhalten. Summenzeilen (z. B. „Alle Beteiligten“ in der Dortmunder-Auswertung) werden nie mitsortiert und bleiben fest am Tabellenende; neue Summenzeilen bekommen die Klasse `sum`.

## Dortmunder (Hauptseite)

- Eigene Hauptseite „Dortmunder“ in der Navigation. Datenbasis: Excel „Dortmunder_2000-2025.xlsx“ (Blatt „Kegeln 2000-2025“; `js/dortmunder-historie-data.js`) für 2000–2025, ab 2026 die über die Eingabe gespeicherten Abende. „x“ = nicht dabei; Einträge mit 0 Punkten zählen nicht. „André“ = „Trunsen“.
- Tabelle je Jahr mit den Abenden 1–13, Summe und Schnitt je Kegler und der Zeile „Schnitt Club“; Jahr wählbar.
- Alle Tabellen der Seite lassen sich per Klick auf die Spaltenüberschrift sortieren (bester/größter Wert oben, Rang: 1 oben; Summenzeilen bleiben unten). Die Gesamtübersicht „Schnitt gesamt pro Kegler“ wertet wahlweise alle Jahre („Alle“) oder einzeln angehakte Jahre (mehrere möglich).
- Auswertungen: Schnitt pro Jahr pro Kegler, Schnitt gesamt pro Kegler, Maximum und Minimum pro Kegler, Schnitt des Clubs pro Jahr (Durchschnitt aller Einzelergebnisse), Rekorde (Top 10 Einzelwerte, Gleichstände zählen mit), Minusrekorde (niedrigste 10 Einzelwerte).

## Mitglieder

- Mitgliederliste entsteht aus allen jemals Anwesenden.
- Reihenfolge der Liste bestimmt die Reihenfolge der Anwesenheits-Knöpfe in der Eingabe.
- Buggy: Burkhard und Buggy sind dieselbe Person; überall „Buggy“. Buggy hat als einzige Ausnahme keinen Anwesenheits-Knopf.
- Trunsen: „André“/„Andre“ wird überall durch „Trunsen“ ersetzt.
- Pätzi: „Petzi“ und „Pätzi“ sind dieselbe Person; überall „Pätzi“.

## Kegeltouren

- Fotos getrennt nach Jahren: Es wird immer nur ein Jahr angezeigt, im Standard das neueste. Miniaturen in der Übersicht, Originale in voller Auflösung.
- Einzelansicht und Diashow im Vollbild.
- Upload, Verschieben und Löschen nur für den Besitzer.

## Offene Punkte

- Weitere ältere Tabellen (vor 2013) sollen später geliefert werden.
- Testabend 13.11.2026 soll gelöscht werden.
