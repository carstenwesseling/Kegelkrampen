// Firebase-Projekt "kegelkrampen-67e7f". Diese Werte sind nicht geheim; die Sicherheit
// regeln firestore.rules und storage.rules, nicht der Schlüssel.
const firebaseConfig = {
  apiKey: "AIzaSyBqORR5P0pknkkYEyU87aKBDF3dM3xr03U",
  authDomain: "kegelkrampen-67e7f.firebaseapp.com",
  projectId: "kegelkrampen-67e7f",
  storageBucket: "kegelkrampen-67e7f.firebasestorage.app",
  messagingSenderId: "904854848235",
  appId: "1:904854848235:web:a812a3073f65e6e824b4ae"
};

// Nur dieses Google-Konto darf schreiben (Speichern, Mitglieder, Fotos).
const KK_OWNER_EMAIL = "carsten.wesseling@gmail.com";

// Google-Kalender für die Startseite („Nächster Abend“). Der Kalender muss öffentlich sein.
// GCAL_ID: Kalender-ID aus den Kalendereinstellungen.
// GCAL_KEY: API-Schlüssel mit der Google Calendar API, im Google-Cloud-Projekt auf die Domain
// (HTTP-Referrer) und auf die Calendar API beschränkt. Der Schlüssel ist nicht geheim.
const GCAL_ID = "q2justmkeusf773sf4cvcsnkhc@group.calendar.google.com";
const GCAL_KEY = "AIzaSyABMzBRARH71uYDYKPVjKMaiVJFfWg4S-s";
