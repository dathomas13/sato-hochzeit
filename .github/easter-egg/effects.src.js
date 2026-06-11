// ============================================================
// Easter Egg · LESBARE QUELLE  (wird NICHT ausgeliefert)
// ------------------------------------------------------------
// Dieser Ordner (.github/…) ist im Deploy-Workflow von rsync
// ausgeschlossen und landet daher nie auf der Live-/Dev-Seite.
//
// Ausgeliefert wird nur die verschleierte Variante js/effects.js
// (ein Base64-Blob, der zur Laufzeit ausgeführt wird). Wer im
// Browser den Sources-Tab öffnet, sieht dort nur Buchstabensalat.
//
// Rätsel-Aufbau (von leicht nach schwer):
//   Stufe 0  Konsole zeigt einen kryptischen Hinweis (Base64).
//            Entschlüsselt: "Konami" → Hinweis auf den Konami-Code.
//   Stufe 1  Konami-Code auf der Tastatur (↑ ↑ ↓ ↓ ← → ← → B A).
//            Wird NICHT im Klartext geprüft, sondern über einen
//            SHA-256-Hash – die Lösung steht also nirgends im Code.
//   Stufe 2  Schaltet eine versteckte, passwortgeschützte Funktion
//            window.jawort("…") frei. Das Losungswort ("aurora",
//            der Ort der Feier) wird ebenfalls nur als Hash geprüft.
//
// ⚙️  NEU GENERIEREN nach Änderungen an dieser Datei:
//     node .github/easter-egg/build.js
//   Das minimiert nichts, verpackt den Code aber als Base64-Blob
//   und schreibt js/effects.js neu.
//
// ⚙️  HASHES ändern (z. B. anderes Passwort): mit
//     node -e 'const c=require("crypto");const s="sato2026";
//       console.log(c.createHash("sha256").update(s+":"+"DEINWORT").digest("hex"))'
//   den neuen Hash berechnen und unten bei PW_HASH eintragen.
// ============================================================
"use strict";

var GOLD = "#6B8BA4", GOLD_LIGHT = "#A4C0D2", NAVY = "#2C3840", CREAM = "#F7F4EF";

// Salt + Hashes. Aus einem Hash lässt sich die Lösung nicht
// zurückrechnen – selbst wer diesen Code liest, muss die Rätsel lösen.
var SALT = "sato2026";
var KONAMI_HASH = "748f7e27a70d9f321c8aa86e3439e58e3124f5afa9ee4a66bcb2d3f3b6073444";
var PW_HASH     = "a298730d029af353e5f046553bb78dd693f1d37a8f5afadaf77e8780dcb66cc4";

async function sha(value) {
  var data = new TextEncoder().encode(SALT + ":" + value);
  var buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map(function (b) { return b.toString(16).padStart(2, "0"); })
    .join("");
}

// ------------------------------------------------------------
// Fortschritts-Meldung (anonym, datensparsam)
// ------------------------------------------------------------
// Das Easter Egg darf KEIN Firebase importieren (es ist als Blob
// verpackt). Stattdessen meldet es den erreichten Level nur über
// ein window-Event + localStorage. js/tracker.js (hat Firebase)
// hört darauf und schreibt es in die Collection "easteregg".
//
// Levels:  1 = Konami gelöst · 2 = jawort() aufgerufen · 3 = Rätsel gelöst
function report(patch) {
  try {
    var prev = Number(localStorage.getItem("sato:eggLevel") || 0);
    var maxLevel = Math.max(prev, patch.level || 0);
    if (maxLevel !== prev) localStorage.setItem("sato:eggLevel", String(maxLevel));
    var consoleOpen =
      !!patch.consoleOpen || localStorage.getItem("sato:consoleOpen") === "1";
    if (consoleOpen) localStorage.setItem("sato:consoleOpen", "1");
    var detail = { level: maxLevel, consoleOpen: consoleOpen, event: patch.event || "" };
    (window.__satoEggQueue = window.__satoEggQueue || []).push(detail);
    window.dispatchEvent(new CustomEvent("sato-egg", { detail: detail }));
  } catch (e) {}
}

// Best-effort-Erkennung offener DevTools: angedockte DevTools, die NACH
// dem Laden geöffnet werden, vergrößern die Lücke zwischen outer/inner
// gegenüber dem beim Laden gemessenen Grundwert (Browser-Chrome). Erkennt
// keine abgedockten Fenster und keine schon beim Laden offenen DevTools –
// die definitiven Signale (Konami / jawort) decken engagierte Besucher ab.
function watchConsole() {
  try {
    var reported = false;
    var baseW = window.outerWidth - window.innerWidth;
    var baseH = window.outerHeight - window.innerHeight;
    var timer = setInterval(function () {
      if (reported) { clearInterval(timer); return; }
      var dW = window.outerWidth - window.innerWidth - baseW;
      var dH = window.outerHeight - window.innerHeight - baseH;
      if (dW > 120 || dH > 120) {
        reported = true;
        report({ consoleOpen: true, event: "console-open" });
      }
    }, 1500);
  } catch (e) {}
}

// ------------------------------------------------------------
// Stil + Konfetti (CSS wird einmalig injiziert)
// ------------------------------------------------------------
var stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  var style = document.createElement("style");
  style.textContent =
    "@keyframes sato-fall{0%{transform:translateY(-10vh) rotate(0);opacity:1}" +
    "100%{transform:translateY(110vh) rotate(360deg);opacity:0}}" +
    ".sato-confetti{position:fixed;top:0;z-index:99999;pointer-events:none;" +
    "user-select:none;will-change:transform,opacity;animation:sato-fall linear forwards}" +
    ".sato-toast{position:fixed;left:50%;bottom:2rem;" +
    "transform:translateX(-50%) translateY(150%);z-index:100000;padding:.85rem 1.6rem;" +
    "background:" + NAVY + ";color:" + CREAM + ";font-family:Georgia,serif;font-size:1rem;" +
    "letter-spacing:.5px;border-radius:2px;box-shadow:0 8px 30px rgba(44,56,64,.25);" +
    "transition:transform .5s cubic-bezier(.22,1,.36,1);pointer-events:none}" +
    ".sato-toast--show{transform:translateX(-50%) translateY(0)}" +
    "@media (prefers-reduced-motion:reduce){.sato-confetti{animation-duration:.01ms !important}}";
  document.head.appendChild(style);
}

function rainHearts(count) {
  injectStyles();
  var symbols = ["❤", "❦", "❧", "♥", "✦", "♡"];
  for (var i = 0; i < (count || 60); i++) {
    var el = document.createElement("div");
    el.className = "sato-confetti";
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.left = Math.random() * 100 + "vw";
    el.style.fontSize = 12 + Math.random() * 26 + "px";
    el.style.color = Math.random() > 0.5 ? GOLD : NAVY;
    el.style.animationDuration = 3 + Math.random() * 3 + "s";
    el.style.animationDelay = Math.random() * 0.8 + "s";
    document.body.appendChild(el);
    el.addEventListener("animationend", function () { this.remove(); });
  }
}

function toast(message) {
  injectStyles();
  var el = document.createElement("div");
  el.className = "sato-toast";
  el.textContent = message;
  document.body.appendChild(el);
  requestAnimationFrame(function () { el.classList.add("sato-toast--show"); });
  setTimeout(function () {
    el.classList.remove("sato-toast--show");
    setTimeout(function () { el.remove(); }, 600);
  }, 3500);
}

function celebrate(message) {
  rainHearts();
  toast(message);
}

// ------------------------------------------------------------
// Stufe 0 · kryptischer Hinweis in der Konsole
//   "S29uYW1pIENvZGU="  --(Base64, daher der 64er-Nudge)-->  "Konami Code"
//   Die Zeile "1986 … 30 Leben" ist ein zusätzlicher googlebarer
//   Brotkrumen für alle, die den Konami-Code (noch) nicht kennen.
// ------------------------------------------------------------
function greet() {
  console.log(
    "%c❦ Ein Gruß in 64er-Päckchen – für die, die ihn lesen können:\n" +
      "%c   S29uYW1pIENvZGU=\n" +
      "%c   (1986 schenkte er Spielern 30 Leben)",
    "font-family:Georgia,serif;font-size:16px;font-weight:bold;color:" + GOLD,
    "font-family:monospace;font-size:15px;font-weight:bold;letter-spacing:2px;color:" + GOLD_LIGHT,
    "font-family:sans-serif;font-size:12px;color:#9aa7b1"
  );
}

// ------------------------------------------------------------
// Stufe 2 · versteckte, passwortgeschützte Funktion
//   Wird erst NACH dem Konami-Code definiert – vorher taucht
//   sie nicht in der Autovervollständigung der Konsole auf.
// ------------------------------------------------------------
function unlockStage2() {
  if (window.jawort) return;
  window.jawort = async function (losung) {
    report({ level: 2, consoleOpen: true, event: "jawort" });
    if (typeof losung !== "string") {
      console.log("%cjawort(\"…\") erwartet ein Wort in Anführungszeichen.", "color:#9aa7b1");
      return "❦";
    }
    var ok = (await sha(losung.toLowerCase().trim())) === PW_HASH;
    if (ok) {
      report({ level: 3, consoleOpen: true, event: "solved" });
      celebrate("Zugriff gewährt. 🎶");
      console.log(
        "%c🎶 Eure Belohnung: ein Wunschsong beim DJ.\n" +
          "%cGeht zum DJ und nennt das Zauberwort  »sudo«  –\n" +
          "euer Wunschsong wird ausgeführt. (Einmal pro Person, wir zählen mit.)",
        "color:" + GOLD + ";font-size:15px;font-weight:bold;font-family:sans-serif",
        "color:" + GOLD_LIGHT + ";font-size:13px;font-family:Georgia,serif"
      );
      return "🎶";
    }
    console.log("%cNicht ganz … lies das Rätsel nochmal Zeile für Zeile.", "color:#9aa7b1");
    return "…";
  };
  console.log(
    "%cStufe 2 freigeschaltet:%c  ruf  jawort(\"losung\")  auf.\n\n" +
      "%cDort ist es nebliger als gedacht,\n" +
      "wo Stein auf Stein seit Ewigkeiten wacht.\n" +
      "Hier fand sich: ein Master mit viel Bier und Programm,\n" +
      "und Abende mit Menschen, aus denen man nie ganz entkam.\n\n" +
      "Von dort verstreut man sich in Nord und Süd und West –\n" +
      "und trotzdem bleibt man immer noch, wenn längst gegangen der Rest.\n\n" +
      "Was bin ich?  (Antwort kleingeschrieben)",
    "color:" + GOLD + ";font-weight:bold;font-family:sans-serif;font-size:14px",
    "font-family:monospace;font-size:14px;font-weight:bold;color:" + GOLD_LIGHT,
    "font-family:Georgia,serif;font-size:13px;font-style:italic;color:" + GOLD
  );
}

// ------------------------------------------------------------
// Stufe 1 · Konami-Code (über Hash geprüft, nicht im Klartext)
// ------------------------------------------------------------
var buffer = [];
document.addEventListener("keydown", async function (e) {
  // In Eingabefeldern nicht stören.
  if (e.target && /^(input|textarea|select)$/i.test(e.target.tagName)) return;
  var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  buffer.push(key);
  if (buffer.length > 10) buffer.shift();
  if (buffer.length === 10) {
    var hsh = await sha(buffer.join("|"));
    if (hsh === KONAMI_HASH) {
      buffer = [];
      report({ level: 1, consoleOpen: true, event: "konami" });
      celebrate("Stufe 1 geschafft! 🎉");
      unlockStage2();
    }
  }
});

// Begrüßung erst nach dem Laden.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", greet);
} else {
  greet();
}

// Beobachtet ab Laden, ob die DevTools geöffnet werden.
watchConsole();
