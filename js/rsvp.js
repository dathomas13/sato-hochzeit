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
    "hero-venue": `${weddingConfig.venueShort || weddingConfig.venue} · ${weddingConfig.city}`,
    "info-ceremony-time": weddingConfig.ceremonyTime,
    "info-venue": weddingConfig.venue,
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

  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Menü schließen" : "Menü öffnen");
    document.body.style.overflow = isOpen ? "hidden" : "";
  });

  links.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Menü öffnen");
      document.body.style.overflow = "";
    });
  });
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
  const guests = document.getElementById("field-guests");
  const shuttle = document.getElementById("field-shuttle");
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
      const showGuests = val === "yes" || val === "maybe";
      const showShuttle = val === "yes";
      allergies?.classList.toggle("show", showAllergies);
      music?.classList.toggle("show", showMusic);
      guests?.classList.toggle("show", showGuests);
      shuttle?.classList.toggle("show", showShuttle);
      if (!showShuttle) {
        document.querySelectorAll('input[name="shuttle"]').forEach((r) => { r.checked = false; });
        document.querySelectorAll('#shuttle-group .radio').forEach((r) => r.classList.remove("selected"));
      }
    });
  });

  // highlight selected shuttle option
  const shuttleGroup = document.getElementById("shuttle-group");
  if (shuttleGroup) {
    shuttleGroup.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        shuttleGroup.querySelectorAll(".radio").forEach((r) =>
          r.classList.toggle("selected", r.contains(radio) && radio.checked)
        );
      });
    });
  }
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

function nameToDocId(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .slice(0, 120);
}

async function checkExisting(name) {
  if (!firebaseReady || !db) return null;
  try {
    const snap = await getDoc(doc(db, "rsvp", nameToDocId(name)));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.warn("Konnte bestehenden Eintrag nicht lesen:", err);
    return null;
  }
}

function showConfirmModal() {
  return new Promise((resolve) => {
    const overlay = document.getElementById("confirm-overlay");
    const okBtn = document.getElementById("confirm-ok");
    const cancelBtn = document.getElementById("confirm-cancel");
    overlay.hidden = false;

    function done(result) {
      overlay.hidden = true;
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      overlay.removeEventListener("click", onOverlay);
      resolve(result);
    }
    function onOk() { done(true); }
    function onCancel() { done(false); }
    function onOverlay(e) { if (e.target === overlay) done(false); }

    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
    overlay.addEventListener("click", onOverlay);
  });
}

async function submitRSVP(data, existing) {
  if (!firebaseReady || !db) {
    throw new Error(
      "Die Verbindung zur Datenbank ist noch nicht eingerichtet. " +
        "Bitte versuche es später erneut oder schreib uns direkt."
    );
  }

  const ref = doc(db, "rsvp", nameToDocId(data.name));
  await setDoc(
    ref,
    {
      name: data.name,
      attendance: data.attendance,
      allergies: data.allergies,
      wishes: data.wishes,
      guests: data.guests,
      shuttle: data.shuttle,
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
  form.classList.add("form--done");
  msg?.scrollIntoView({ behavior: "smooth", block: "center" });
}

if (form) {
  form.addEventListener("submit", async (evt) => {
    evt.preventDefault();

    const fd = new FormData(form);
    const data = {
      name: (fd.get("name") || "").toString().trim(),
      attendance: fd.get("attendance"),
      allergies: (fd.get("allergies") || "").toString().trim(),
      wishes: (fd.get("wishes") || "").toString().trim(),
      guests: (fd.get("guests") || "").toString().trim(),
      shuttle: (fd.get("shuttle") || "").toString().trim()
    };

    // Wenn "no": keine Zusatzfelder (waren verborgen).
    if (data.attendance === "no") {
      data.allergies = "";
      data.wishes = "";
      data.guests = "";
      data.shuttle = "";
    } else if (data.attendance === "maybe") {
      // Musikwunsch und Fahrservice nur für yes
      data.wishes = "";
      data.shuttle = "";
    }

    if (data.name.length < 2) {
      setStatus("Bitte gib deinen Namen ein.", "error");
      return;
    }
    if (!data.attendance) {
      setStatus("Bitte wähle aus, ob du kommst.", "error");
      return;
    }

    submitBtn.disabled = true;
    setStatus("Wird geprüft…", "info");

    const existing = await checkExisting(data.name);

    if (existing) {
      setStatus("");
      submitBtn.disabled = false;
      const confirmed = await showConfirmModal();
      if (!confirmed) return;
      submitBtn.disabled = true;
      setStatus("Wird gesendet…", "info");
    } else {
      setStatus("Wird gesendet…", "info");
    }

    try {
      await submitRSVP(data, existing);
      setStatus("");
      showSuccess(data.attendance);
    } catch (err) {
      console.error(err);
      const isPermissionError =
        err.code === "permission-denied" ||
        (err.message && err.message.toLowerCase().includes("permission"));
      setStatus(
        isPermissionError
          ? "Deine Antwort konnte nicht gespeichert werden (Zugriffsrechte). Bitte schreib uns direkt an " +
              weddingConfig.contactEmail
          : err.message ||
              "Es ist ein Fehler aufgetreten. Bitte versuche es erneut.",
        "error"
      );
      submitBtn.disabled = false;
    }
  });
}

// ------------------------------------------------------------
// Gallery – horizontal auto-scroll carousel
// ------------------------------------------------------------
function setupGallery() {
  const strip = document.getElementById("gallery-strip");
  if (!strip) return;

  // Duplicate slides for seamless infinite loop
  Array.from(strip.children).forEach((el) =>
    strip.appendChild(el.cloneNode(true))
  );

  let pos = 0;
  let paused = false;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;

  const halfWidth = () => strip.scrollWidth / 2;

  // Pause/resume on hover
  strip.addEventListener("mouseenter", () => { paused = true; });
  strip.addEventListener("mouseleave", () => { if (!isDragging) paused = false; });

  // Drag to scroll (mouse)
  strip.addEventListener("mousedown", (e) => {
    isDragging = true;
    paused = true;
    dragStartX = e.pageX;
    dragStartScroll = strip.scrollLeft;
    strip.classList.add("is-grabbing");
  });
  window.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    strip.classList.remove("is-grabbing");
    pos = strip.scrollLeft % halfWidth();
    setTimeout(() => { paused = false; }, 1500);
  });
  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    strip.scrollLeft = dragStartScroll - (e.pageX - dragStartX);
  });

  // Touch support
  strip.addEventListener("touchstart", () => { paused = true; }, { passive: true });
  strip.addEventListener("touchend", () => {
    pos = strip.scrollLeft % halfWidth();
    setTimeout(() => { paused = false; }, 2000);
  });

  function tick() {
    if (!paused && !isDragging) {
      pos += 0.5;
      const hw = halfWidth();
      if (pos >= hw) pos -= hw;
      strip.scrollLeft = pos;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ------------------------------------------------------------
// Floating RSVP pill
// ------------------------------------------------------------
function setupRsvpFloat() {
  const btn = document.getElementById("rsvp-float");
  if (!btn) return;
  const hero = document.querySelector(".hero");
  const rsvp = document.getElementById("rsvp");

  function update() {
    const heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
    const rsvpTop = rsvp ? rsvp.getBoundingClientRect().top : Infinity;
    // Show after hero has scrolled off; hide once RSVP section is visible
    const show = heroBottom < 0 && rsvpTop > window.innerHeight * 0.6;
    btn.classList.toggle("visible", show);
  }

  window.addEventListener("scroll", update, { passive: true });
  update();
}

// ------------------------------------------------------------
// Boot
// ------------------------------------------------------------
hydrateContent();
setupNav();
setupFadeIn();
setupCountdown();
setupConditionalFields();
setupGallery();
setupRsvpFloat();
