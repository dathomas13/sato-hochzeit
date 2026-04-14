// ============================================================
// Admin · Login & Gästeliste
// ============================================================

import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ------------------------------------------------------------
// DOM
// ------------------------------------------------------------
const loginView = document.getElementById("login-view");
const dashboardView = document.getElementById("dashboard-view");
const loginForm = document.getElementById("login-form");
const loginStatus = document.getElementById("login-status");
const adminUser = document.getElementById("admin-user");
const adminStatus = document.getElementById("admin-status");

const statYes = document.getElementById("stat-yes");
const statMaybe = document.getElementById("stat-maybe");
const statNo = document.getElementById("stat-no");
const statTotal = document.getElementById("stat-total");

const filterAttendance = document.getElementById("filter-attendance");
const filterSearch = document.getElementById("filter-search");
const tbody = document.getElementById("guest-tbody");
const tableHead = document.querySelectorAll("#guest-table th[data-sort]");

const exportCsvBtn = document.getElementById("export-csv");
const exportPdfBtn = document.getElementById("export-pdf");
const logoutBtn = document.getElementById("logout-btn");

// ------------------------------------------------------------
// State
// ------------------------------------------------------------
let allGuests = []; // gesamter Bestand
let sortKey = "timestamp";
let sortDir = "desc";
let unsubscribe = null;

const ATTENDANCE_LABEL = {
  yes: "Zusage",
  maybe: "Vielleicht",
  no: "Absage"
};

// ------------------------------------------------------------
// Firebase Init
// ------------------------------------------------------------
let auth = null;
let db = null;
let firebaseReady = false;

function setLoginStatus(msg, kind = "") {
  if (!loginStatus) return;
  loginStatus.textContent = msg;
  loginStatus.className = "form__status" + (kind ? ` form__status--${kind}` : "");
}
function setAdminStatus(msg, kind = "") {
  if (!adminStatus) return;
  adminStatus.textContent = msg;
  adminStatus.className = "form__status" + (kind ? ` form__status--${kind}` : "");
}

try {
  if (isFirebaseConfigured()) {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    firebaseReady = true;
  } else {
    setLoginStatus(
      "Firebase ist noch nicht konfiguriert. Bitte js/firebase-config.js ausfüllen.",
      "error"
    );
    if (loginForm)
      loginForm.querySelector('button[type="submit"]').disabled = true;
  }
} catch (err) {
  console.error("Firebase-Init fehlgeschlagen:", err);
  setLoginStatus(
    "Verbindung zu Firebase fehlgeschlagen. Bitte Konfiguration prüfen.",
    "error"
  );
}

// ------------------------------------------------------------
// Auth-Flow
// ------------------------------------------------------------
if (firebaseReady) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      showDashboard(user);
      startGuestListener();
    } else {
      showLogin();
      stopGuestListener();
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (evt) => {
    evt.preventDefault();
    if (!firebaseReady) return;

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
      setLoginStatus("Bitte Email und Passwort eingeben.", "error");
      return;
    }

    setLoginStatus("Wird eingeloggt…");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoginStatus("");
    } catch (err) {
      console.error(err);
      const code = err.code || "";
      let msg = "Login fehlgeschlagen.";
      if (code.includes("invalid-credential") || code.includes("wrong-password")) {
        msg = "Email oder Passwort ist falsch.";
      } else if (code.includes("user-not-found")) {
        msg = "Kein Account mit dieser Email gefunden.";
      } else if (code.includes("too-many-requests")) {
        msg = "Zu viele Versuche. Bitte später erneut versuchen.";
      } else if (code.includes("network")) {
        msg = "Netzwerkfehler – bitte Verbindung prüfen.";
      }
      setLoginStatus(msg, "error");
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    if (!firebaseReady) return;
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  });
}

function showLogin() {
  loginView.hidden = false;
  dashboardView.hidden = true;
}
function showDashboard(user) {
  loginView.hidden = true;
  dashboardView.hidden = false;
  if (adminUser) adminUser.textContent = `Eingeloggt als ${user.email}`;
}

// ------------------------------------------------------------
// Realtime-Gästeliste
// ------------------------------------------------------------
function startGuestListener() {
  if (!db) return;
  const q = query(collection(db, "rsvp"), orderBy("timestamp", "desc"));
  setAdminStatus("Lade Daten…");
  unsubscribe = onSnapshot(
    q,
    (snap) => {
      allGuests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAdminStatus("");
      renderStats();
      renderTable();
    },
    (err) => {
      console.error(err);
      setAdminStatus(
        "Fehler beim Laden der Gästeliste. Ggf. fehlen die Firestore-Rechte.",
        "error"
      );
    }
  );
}

function stopGuestListener() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  allGuests = [];
}

// ------------------------------------------------------------
// Rendering
// ------------------------------------------------------------
function renderStats() {
  const counts = { yes: 0, maybe: 0, no: 0 };
  for (const g of allGuests) {
    if (counts[g.attendance] !== undefined) counts[g.attendance]++;
  }
  statYes.textContent = counts.yes;
  statMaybe.textContent = counts.maybe;
  statNo.textContent = counts.no;
  statTotal.textContent = allGuests.length;
}

function getFilteredSortedGuests() {
  const filter = filterAttendance.value;
  const search = filterSearch.value.trim().toLowerCase();

  let list = allGuests.filter((g) => {
    if (filter !== "all" && g.attendance !== filter) return false;
    if (search) {
      const hay = `${g.name || ""} ${g.email || ""}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });

  list.sort((a, b) => {
    let va = a[sortKey];
    let vb = b[sortKey];
    if (sortKey === "timestamp") {
      va = va?.toMillis ? va.toMillis() : 0;
      vb = vb?.toMillis ? vb.toMillis() : 0;
    } else {
      va = (va || "").toString().toLowerCase();
      vb = (vb || "").toString().toLowerCase();
    }
    if (va < vb) return sortDir === "asc" ? -1 : 1;
    if (va > vb) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  return list;
}

function formatShuttle(val) {
  if (val === "bus-1") return "Bus 1:00 Uhr";
  if (val === "bus-3") return "Bus 3:00 Uhr";
  if (val === "none") return "Selbst";
  return "";
}

function escapeHtml(str) {
  return (str ?? "")
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTimestamp(ts) {
  if (!ts?.toDate) return "";
  const d = ts.toDate();
  return d.toLocaleString("de-DE", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function renderTable() {
  const list = getFilteredSortedGuests();

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="guest-table__empty">Keine Einträge.</td></tr>`;
  } else {
    tbody.innerHTML = list
      .map((g) => {
        const badgeClass = `badge--${g.attendance || "no"}`;
        const label = ATTENDANCE_LABEL[g.attendance] || "–";
        return `
          <tr>
            <td>${escapeHtml(g.name)}</td>
            <td>${escapeHtml(g.email)}</td>
            <td><span class="badge ${badgeClass}">${escapeHtml(label)}</span></td>
            <td>${escapeHtml(g.allergies || "–")}</td>
            <td>${escapeHtml(g.wishes || "–")}</td>
            <td>${escapeHtml(formatShuttle(g.shuttle) || "–")}</td>
            <td>${escapeHtml(g.guests || "–")}</td>
            <td>${escapeHtml(formatTimestamp(g.timestamp))}</td>
          </tr>`;
      })
      .join("");
  }

  // Sortier-Indikatoren
  tableHead.forEach((th) => {
    th.classList.remove("is-sorted-asc", "is-sorted-desc");
    if (th.dataset.sort === sortKey) {
      th.classList.add(sortDir === "asc" ? "is-sorted-asc" : "is-sorted-desc");
    }
  });
}

// ------------------------------------------------------------
// Filter / Sort Events
// ------------------------------------------------------------
filterAttendance?.addEventListener("change", renderTable);
filterSearch?.addEventListener("input", renderTable);

tableHead.forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;
    if (sortKey === key) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDir = "asc";
    }
    renderTable();
  });
});

// ------------------------------------------------------------
// Export: CSV
// ------------------------------------------------------------
function csvEscape(val) {
  const s = (val ?? "").toString();
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

exportCsvBtn?.addEventListener("click", () => {
  const list = getFilteredSortedGuests();
  if (list.length === 0) {
    setAdminStatus("Keine Daten zum Exportieren.", "error");
    return;
  }
  const header = ["Name", "Email", "Zusage", "Allergien", "Wünsche", "Fahrservice", "Weitere Gäste", "Zeitpunkt"];
  const rows = list.map((g) => [
    g.name,
    g.email,
    ATTENDANCE_LABEL[g.attendance] || "",
    g.allergies || "",
    g.wishes || "",
    formatShuttle(g.shuttle) || "",
    g.guests || "",
    formatTimestamp(g.timestamp)
  ]);
  const csv =
    "\uFEFF" + // BOM für Excel
    [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const today = new Date().toISOString().slice(0, 10);
  a.download = `gaesteliste_${today}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  setAdminStatus(`Export erstellt (${list.length} Einträge).`, "success");
});

// ------------------------------------------------------------
// Export: PDF via Print
// ------------------------------------------------------------
exportPdfBtn?.addEventListener("click", () => {
  window.print();
});
