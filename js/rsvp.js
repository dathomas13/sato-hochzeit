// ============================================================
// RSVP · Gäste-Formular Logik
// ============================================================

import {
  firebaseConfig,
  isFirebaseConfigured,
  weddingConfig
} from "./firebase-config.js";

// Firebase SDK (via CDN, ESM).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ------------------------------------------------------------
// Dynamische Content-Injektion aus weddingConfig
// ------------------------------------------------------------
function hydrateContent() {
  const map = {
    "hero-names": weddingConfig.brideAndGroom,
    "hero-date": weddingConfig.date,
    "hero-venue": `${weddingConfig.venue} · ${weddingConfig.address.split(",").pop().trim()}`,
    "info-ceremony-time": `${weddingConfig.ceremonyTime} Uhr`,
    "info-reception-time": `${weddingConfig.receptionTime} Uhr`,
    "info-venue": weddingConfig.venue,
    "info-address": weddingConfig.address,
    "rsvp-deadline": weddingConfig.rsvpDeadline
  };
  for (const [id, val] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  const contact = document.getElementById("footer-contact");
  if (contact) {
    contact.href = `mailto:${weddingConfig.contactEmail}`;
    contact.textContent = weddingConfig.contactEmail;
  }

  document.title = `${weddingConfig.brideAndGroom} · RSVP`;
}

// ------------------------------------------------------------
// QR-Code
// ------------------------------------------------------------
function renderQRCode() {
  const container = document.getElementById("qr-code");
  const urlLabel = document.getElementById("qr-url");
  if (!container) return;

  const url = window.location.origin + window.location.pathname;
  if (urlLabel) urlLabel.textContent = url;

  if (typeof QRCode === "undefined") {
    container.textContent = "QR-Code konnte nicht geladen werden.";
    return;
  }
  // eslint-disable-next-line no-new, no-undef
  new QRCode(container, {
    text: url,
    width: 200,
    height: 200,
    colorDark: "#26215c",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}

// ------------------------------------------------------------
// Firebase Initialisierung (defensiv)
// ------------------------------------------------------------
let db = null;
let firebaseReady = false;
try {
  if (isFirebaseConfigured()) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    firebaseReady = true;
  } else {
    console.warn("Firebase noch nicht konfiguriert – RSVP-Speicherung deaktiviert.");
  }
} catch (err) {
  console.error("Firebase-Initialisierung fehlgeschlagen:", err);
}

// ------------------------------------------------------------
// Formular-Handling
// ------------------------------------------------------------
const form = document.getElementById("rsvp-form");
const status = document.getElementById("rsvp-status");
const submitBtn = document.getElementById("rsvp-submit");

function setStatus(msg, kind = "") {
  if (!status) return;
  status.textContent = msg;
  status.className = "form__status" + (kind ? ` form__status--${kind}` : "");
}

// Email → deterministische, URL-sichere Doc-ID (für Upsert).
function emailToDocId(email) {
  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .slice(0, 120);
}

async function submitRSVP(data) {
  if (!firebaseReady || !db) {
    throw new Error(
      "Die Verbindung zur Datenbank ist noch nicht eingerichtet. " +
        "Bitte versuche es später erneut oder schreib uns direkt."
    );
  }

  const docId = emailToDocId(data.email);
  const ref = doc(db, "rsvp", docId);

  // Prüfen, ob schon ein Eintrag existiert (für "Aktualisierung").
  let existing = null;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) existing = snap.data();
  } catch (err) {
    // Kein Abbruch – Lesen kann per Rules blockiert sein, wir dürfen
    // trotzdem schreiben.
    console.warn("Konnte bestehenden Eintrag nicht lesen:", err);
  }

  await setDoc(
    ref,
    {
      name: data.name,
      email: data.email.trim().toLowerCase(),
      attendance: data.attendance,
      allergies: data.allergies,
      wishes: data.wishes,
      timestamp: serverTimestamp(),
      ...(existing ? { updated: true } : {})
    },
    { merge: true }
  );

  return { updated: !!existing };
}

if (form) {
  form.addEventListener("submit", async (evt) => {
    evt.preventDefault();

    const fd = new FormData(form);
    const data = {
      name: (fd.get("name") || "").toString().trim(),
      email: (fd.get("email") || "").toString().trim(),
      attendance: fd.get("attendance"),
      allergies: (fd.get("allergies") || "").toString().trim(),
      wishes: (fd.get("wishes") || "").toString().trim()
    };

    // Client-seitige Validierung
    if (data.name.length < 2) {
      setStatus("Bitte gib deinen Namen ein.", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setStatus("Bitte gib eine gültige Email-Adresse ein.", "error");
      return;
    }
    if (!data.attendance) {
      setStatus("Bitte wähle aus, ob du kommst.", "error");
      return;
    }

    submitBtn.disabled = true;
    setStatus("Wird gesendet…");

    try {
      const { updated } = await submitRSVP(data);
      setStatus(
        updated
          ? "Danke! Deine Antwort wurde aktualisiert. 💛"
          : "Danke für deine Rückmeldung! 💛",
        "success"
      );
      if (!updated) form.reset();
    } catch (err) {
      console.error(err);
      setStatus(
        err.message || "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.",
        "error"
      );
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// ------------------------------------------------------------
// Boot
// ------------------------------------------------------------
hydrateContent();
renderQRCode();
