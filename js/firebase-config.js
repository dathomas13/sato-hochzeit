// ============================================================
// Firebase Konfiguration
// ------------------------------------------------------------
// Diese Werte werden morgen hinzugefügt (aus Firebase Console:
// Projekt-Einstellungen → Allgemein → Deine Apps → Web-App).
//
// Hinweis: Diese Config-Werte sind NICHT geheim – sie werden
// ohnehin im Browser ausgeliefert. Die eigentliche Sicherheit
// läuft über Firestore Security Rules und Firebase Auth.
// ============================================================

export const firebaseConfig = {
  apiKey: "DEIN_API_KEY",
  authDomain: "DEIN_PROJEKT.firebaseapp.com",
  projectId: "DEIN_PROJEKT",
  storageBucket: "DEIN_PROJEKT.appspot.com",
  messagingSenderId: "DEINE_SENDER_ID",
  appId: "DEINE_APP_ID"
};

// Prüfung, ob die Config schon gesetzt wurde.
export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.startsWith("DEIN_")
  );
}

// Allgemeine Hochzeits-Konfiguration (zentral, damit nicht
// im HTML rumgepfuscht werden muss).
export const weddingConfig = {
  brideAndGroom: "Thomas & Sarah",
  brideAndGroomHtml: "Thomas<br>&amp;<br>Sarah",
  date: "Samstag, 5. September 2026",
  isoDate: "2026-09-05",
  ceremonyTime: "14:00",
  receptionTime: "15:00",
  venue: "Schloss Rosenhof",
  address: "Rosenhofweg 1, 12345 Musterstadt",
  city: "Musterstadt",
  rsvpDeadline: "1. August 2026",
  contactEmail: "hochzeit@example.com"
};
