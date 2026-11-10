# Anforderungen – Kegelclub „Kegelkrampen“

Stand: aus den bisherigen Absprachen übernommen. Die Liste ist der fachliche Bezugspunkt für Änderungen an der App.

## Ausgangspunkt

- Die App entstand aus dem Google Sheet „Kegeln_zahlen_2026“ (Eingabemaske, Formeln, historische Daten als Datenbank).
- Erstes Tabellenblatt = Eingabemaske, deren Formeln übernommen wurden. Das zweite Tabellenblatt wird ignoriert.
- Weitere Tabellenblätter sind historische Spieltage. Der Tabellenname ist das Datum des Abends.
- Ältere Blätter (2013) werden in die neue Logik übernommen; fehlende Daten bleiben leer.

## Eingabe

- Anwesenheit wird pro Abend ausgewählt; in die Eingabetabelle kommen nur die Anwesenden.
- Die Eingabe ist eine reine Eingabemaske (inkl. Spalte Lotterie). Die übrigen Spalten aller Mitglieder stehen unter „Statistik“.
- Lotterie, „Runde bezahlt“ und „Hat gezahlt“ werden in Euro eingegeben.
- Spieltag-Datum ist frei wählbar, muss aber nach dem letzten gespeicherten Termin liegen.
- Speichern nur durch den Besitzer. Die Eingabe bleibt als Entwurf erhalten, bis gespeichert wird.
- Werte vom gespeicherten Vorabend werden immer übernommen („Rest letztes Kegeln“, „Alter Konto“).
- „Noch zu zahlen“ des letzten Spieltags wird immer in „Rest letztes Kegeln“ übernommen.
- Gäste werden namentlich in Tabelle, Mitgliederliste und Statistik geführt, nicht in der Auswahl für neue Abende. Neue Gäste werden manuell angelegt und nach dem Speichern in die Mitgliederliste übernommen.
- Kasse: hinter „Sonderausgabe“ und „Abgang Konto“ je ein Textfeld. Der Text wird mit dem Wert ausgegeben (auch in der Historie) und mit dem Abend gespeichert.
- Rekorde sind in der Eingabe änderbar und speicherbar und erscheinen zusätzlich als erster Bereich unter Historie.

## Dortmunder

- Eigener Tab. Teilnehmer aus der Eingabe, 7 Eingabespalten plus Summenspalte.
- Jeder Wert wird mit Multiplikator 1 bis 7 (links nach rechts) multipliziert und zur Summe addiert.
- Werte und Summe werden mit dem Abend gespeichert und in der Historie angezeigt.
- Der Teilnehmer mit der höchsten Summe wird automatisch als Dortmunder-König eingetragen.

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

## Mitglieder

- Mitgliederliste entsteht aus allen jemals Anwesenden.
- Reihenfolge der Liste bestimmt die Reihenfolge der Anwesenheits-Knöpfe in der Eingabe.
- Buggy: Burkhard und Buggy sind dieselbe Person; überall „Buggy“. Buggy hat als einzige Ausnahme keinen Anwesenheits-Knopf.
- Trunsen: „André“/„Andre“ wird überall durch „Trunsen“ ersetzt.

## Kegeltouren

- Fotos getrennt nach Jahren, Miniaturen in der Übersicht, Originale in voller Auflösung.
- Einzelansicht und Diashow im Vollbild.
- Upload, Verschieben und Löschen nur für den Besitzer.

## Offene Punkte

- Weitere ältere Tabellen (vor 2013) sollen später geliefert werden.
- Testabend 13.11.2026 soll gelöscht werden.
