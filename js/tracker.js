// ============================================================
// Besucher-Tracker (anonym & datensparsam)
// ------------------------------------------------------------
// Zählt Seitenaufrufe der Gäste-Seite und legt pro Aufruf ein
// kleines, anonymes Dokument in der Firestore-Collection
// "analytics" ab. Es werden KEINE personenbezogenen Daten
// gespeichert (keine IP, kein Name) – nur:
//   - timestamp  (Zeitpunkt des Aufrufs)
//   - day        (Datum als YYYY-MM-DD, für Tages-Auswertung)
//   - path       (welche Seite)
//   - referrer   (Hostname der Herkunft, z.B. "google.com")
//   - device     ("mobile" / "desktop")
//   - visitorId  (zufällige ID aus localStorage, um eindeutige
//                 Besucher grob zu zählen – nicht rückführbar)
//
// Das Tracking darf die Seite niemals blockieren oder Fehler
// werfen – deshalb ist alles defensiv in try/catch gekapselt.
// ============================================================

import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

(async function trackVisit() {
  try {
    if (!isFirebaseConfigured()) return;

    // Bots / Crawler nicht mitzählen.
    const ua = navigator.userAgent || "";
    if (/bot|crawl|spider|slurp|bingpreview|facebookexternalhit/i.test(ua)) {
      return;
    }

    // Mehrfachzählung bei schnellem Neuladen vermeiden:
    // pro Seite max. ein Aufruf alle 30 Minuten pro Browser-Sitzung.
    const throttleKey = "lastView:" + location.pathname;
    const last = Number(sessionStorage.getItem(throttleKey) || 0);
    if (Date.now() - last < 30 * 60 * 1000) return;
    sessionStorage.setItem(throttleKey, String(Date.now()));

    // Eindeutige (aber anonyme) Besucher-ID – nur lokal im Browser.
    let visitorId = localStorage.getItem("visitorId");
    if (!visitorId) {
      visitorId =
        crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("visitorId", visitorId);
    }

    // Vorhandene Firebase-App wiederverwenden (rsvp.js initialisiert
    // bereits die Default-App), sonst neu anlegen.
    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const device = /Mobi|Android|iPhone|iPad|iPod/i.test(ua)
      ? "mobile"
      : "desktop";

    let referrer = "direkt";
    try {
      if (document.referrer) {
        const refHost = new URL(document.referrer).hostname;
        referrer = refHost === location.hostname ? "intern" : refHost;
      }
    } catch {
      referrer = "direkt";
    }

    await addDoc(collection(db, "analytics"), {
      path: location.pathname,
      referrer,
      device,
      visitorId,
      day: new Date().toISOString().slice(0, 10),
      timestamp: serverTimestamp()
    });
  } catch (err) {
    // Tracking ist optional – Fehler dürfen die Seite nicht stören.
    console.debug("[Tracker] übersprungen:", err);
  }
})();

// ============================================================
// Easter-Egg-Fortschritt (anonym) nach Firestore spiegeln
// ------------------------------------------------------------
// js/effects.js (das Easter Egg) kann selbst kein Firebase laden
// und meldet seinen Fortschritt nur über window-Events + eine
// Warteschlange. Hier nehmen wir das entgegen und legen pro
// Besucher EIN Dokument in der Collection "easteregg" ab
// (Dok-ID = visitorId), das den höchsten erreichten Level hält.
// Wenn derselbe Besucher ein RSVP abgeschickt hat, wird der Name
// mitgespeichert (vom Gast über die Einladung freigegeben).
// ============================================================
(function trackEasterEgg() {
  try {
    if (!isFirebaseConfigured()) return;

    let visitorId = localStorage.getItem("visitorId");
    if (!visitorId) {
      visitorId =
        crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("visitorId", visitorId);
    }

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    async function writeEgg(detail) {
      try {
        await setDoc(
          doc(db, "easteregg", visitorId),
          {
            visitorId,
            level: detail.level || 0,
            consoleOpen: !!detail.consoleOpen,
            lastEvent: detail.event || "",
            rsvpName: localStorage.getItem("sato:rsvpName") || null,
            day: new Date().toISOString().slice(0, 10),
            updatedAt: serverTimestamp()
          },
          { merge: true }
        );
      } catch (err) {
        console.debug("[EasterEgg] Speichern übersprungen:", err);
      }
    }

    // Erst zuhören (für künftige Events), dann die Warteschlange leeren.
    window.addEventListener("sato-egg", (e) => writeEgg(e.detail || {}));
    const queue = window.__satoEggQueue || [];
    queue.forEach(writeEgg);
  } catch (err) {
    console.debug("[EasterEgg] Tracker übersprungen:", err);
  }
})();
