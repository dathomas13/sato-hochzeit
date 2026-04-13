// ============================================================
// RSVP · Gäste-Formular Logik
// ============================================================

import {
  firebaseConfig,
  isFirebaseConfigured,
  weddingConfig
} from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ------------------------------------------------------------
// Content-Hydration aus weddingConfig
// ------------------------------------------------------------
function hydrateContent() {
  const heroNames = document.getElementById("hero-names");
  if (heroNames) heroNames.innerHTML = weddingConfig.brideAndGroomHtml;

  const map = {
    "hero-date": weddingConfig.date,
    "hero-venue": `${weddingConfig.venue} · ${weddingConfig.city}`,
    "info-ceremony-time": weddingConfig.ceremonyTime,
    "info-reception-time": weddingConfig.receptionTime,
    "info-venue": weddingConfig.venue,
    "info-address": weddingConfig.address,
    "story-date": weddingConfig.date.replace(/^Samstag,\s*/, ""),
    "story-venue": weddingConfig.venue,
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

  document.title = `${weddingConfig.brideAndGroom} · ${formatIsoDate(
    weddingConfig.isoDate
  )}`;
}

function formatIsoDate(iso) {
  // 2026-09-05 → 05.09.2026
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

// ------------------------------------------------------------
// Navigation Scroll-Effekt
// ------------------------------------------------------------
function setupNav() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  const onScroll = () => {
    nav.classList.toggle("scrolled", window.scrollY > 80);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// ------------------------------------------------------------
// Fade-in via IntersectionObserver
// ------------------------------------------------------------
function setupFadeIn() {
  const els = document.querySelectorAll(".fade-in");
  if (!("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("visible"));
    return;
  }
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  els.forEach((el) => obs.observe(el));
}

// ------------------------------------------------------------
// Countdown
// ------------------------------------------------------------
function setupCountdown() {
  const container = document.getElementById("countdown");
  if (!container) return;

  const target = new Date(
    `${weddingConfig.isoDate}T${weddingConfig.ceremonyTime}:00`
  );
  const dEl = document.getElementById("cd-d");
  const hEl = document.getElementById("cd-h");
  const mEl = document.getElementById("cd-m");
  const sEl = document.getElementById("cd-s");

  function tick() {
    const diff = target - new Date();
    if (diff <= 0) {
      container.innerHTML =
        '<span class="countdown__done">Heute ist es soweit! 🎉</span>';
      clearInterval(interval);
      return;
    }
    const d = Math.floor(diff / 864e5);
    const h = Math.floor((diff % 864e5) / 36e5);
    const m = Math.floor((diff % 36e5) / 6e4);
    const s = Math.floor((diff % 6e4) / 1e3);
    if (dEl) dEl.textContent = String(d).padStart(2, "0");
    if (hEl) hEl.textContent = String(h).padStart(2, "0");
    if (mEl) mEl.textContent = String(m).padStart(2, "0");
    if (sEl) sEl.textContent = String(s).padStart(2, "0");
  }
  tick();
  const interval = setInterval(tick, 1000);
}

// ------------------------------------------------------------
// Conditional fields + selected-Highlight
// ------------------------------------------------------------
function setupConditionalFields() {
  const group = document.getElementById("attendance-group");
  const allergies = document.getElementById("field-allergies");
  const music = document.getElementById("field-music");
  if (!group) return;

  const radios = group.querySelectorAll('input[type="radio"]');
  radios.forEach((radio) => {
    radio.addEventListener("change", () => {
      group.querySelectorAll(".radio").forEach((r) =>
        r.classList.toggle("selected", r.contains(radio) && radio.checked)
      );
      const val = radio.value;
      const showAllergies = val === "yes" || val === "maybe";
      const showMusic = val === "yes";
      allergies?.classList.toggle("show", showAllergies);
      music?.classList.toggle("show", showMusic);
    });
  });
}

// ------------------------------------------------------------
// Firebase Init (defensiv)
// ------------------------------------------------------------
let db = null;
let firebaseReady = false;
try {
  if (isFirebaseConfigured()) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    firebaseReady = true;
  } else {
    console.warn(
      "Firebase noch nicht konfiguriert – RSVP-Speicherung deaktiviert."
    );
  }
} catch (err) {
  console.error("Firebase-Initialisierung fehlgeschlagen:", err);
}

// ------------------------------------------------------------
// Form Submit
// ------------------------------------------------------------
const form = document.getElementById("rsvp-form");
const status = document.getElementById("rsvp-status");
const submitBtn = document.getElementById("rsvp-submit");
const successYes = document.getElementById("success-yes");
const successNo = document.getElementById("success-no");

function setStatus(msg, kind = "") {
  if (!status) return;
  status.textContent = msg;
  status.className = "form__status" + (kind ? ` form__status--${kind}` : "");
}

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

  let existing = null;
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) existing = snap.data();
  } catch (err) {
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

function showSuccess(attendance) {
  const msg = attendance === "no" ? successNo : successYes;
  [successYes, successNo].forEach((m) => m?.classList.remove("show"));
  msg?.classList.add("show");
  // Form abdimmen
  form.style.opacity = "0.25";
  form.style.pointerEvents = "none";
  submitBtn.style.display = "none";
  msg?.scrollIntoView({ behavior: "smooth", block: "center" });
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

    // Wenn "no": keine Allergien/Wünsche (Felder waren verborgen).
    if (data.attendance === "no") {
      data.allergies = "";
      data.wishes = "";
    } else if (data.attendance === "maybe") {
      // Musikwunsch nur für yes
      data.wishes = "";
    }

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
    setStatus("Wird gesendet…", "info");

    try {
      await submitRSVP(data);
      setStatus("");
      showSuccess(data.attendance);
    } catch (err) {
      console.error(err);
      setStatus(
        err.message ||
          "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.",
        "error"
      );
      submitBtn.disabled = false;
    }
  });
}

// ------------------------------------------------------------
// Boot
// ------------------------------------------------------------
hydrateContent();
setupNav();
setupFadeIn();
setupCountdown();
setupConditionalFields();
