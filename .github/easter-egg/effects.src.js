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

var GOLD = "#6B8BA4", NAVY = "#2C3840", CREAM = "#F7F4EF";

// Salt + Hashes. Aus einem Hash lässt sich die Lösung nicht
// zurückrechnen – selbst wer diesen Code liest, muss die Rätsel lösen.
var SALT = "sato2026";
var KONAMI_HASH = "748f7e27a70d9f321c8aa86e3439e58e3124f5afa9ee4a66bcb2d3f3b6073444";
var PW_HASH     = "52613cc6b13fb8854654fd83f98c0405be5b626a0967d453a1d03a67d802adc9";

async function sha(value) {
  var data = new TextEncoder().encode(SALT + ":" + value);
  var buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map(function (b) { return b.toString(16).padStart(2, "0"); })
    .join("");
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
//   "S29uYW1p"  --(Base64)-->  "Konami"
// ------------------------------------------------------------
function greet() {
  console.log(
    "%c❦ Für die, die hinter die Kulissen blicken\n" +
      "%cS29uYW1p\n" +
      "%c(manche Codes sind unsterblich)",
    "font-family:Georgia,serif;font-size:16px;font-weight:bold;color:" + NAVY,
    "font-family:monospace;font-size:14px;letter-spacing:2px;color:" + GOLD,
    "font-family:sans-serif;font-size:12px;color:#728492"
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
    if (typeof losung !== "string") {
      console.log("%cjawort(\"…\") erwartet ein Wort.", "color:#728492");
      return "❦";
    }
    var ok = (await sha(losung.toLowerCase().trim())) === PW_HASH;
    if (ok) {
      celebrate("Du hast es geknackt. 💍");
      console.log(
        "%c🏆 Ihr habt es bis zum Schluss geschafft.\n" +
          "%cGenau für Köpfe wie euch haben wir das hier versteckt.\n" +
          "Danke, dass ihr Teil unseres Tages seid. – Thomas & Sarah ❤",
        "color:" + GOLD + ";font-size:15px;font-weight:bold;font-family:sans-serif",
        "color:" + NAVY + ";font-size:13px;font-family:Georgia,serif"
      );
      return "❤";
    }
    console.log("%cNicht ganz … denk an den Ort, an dem wir uns das Ja-Wort geben.", "color:#728492");
    return "…";
  };
  console.log(
    "%cStufe 2 freigeschaltet:%c ruf  jawort(\"losung\")  auf.\n" +
      "%cDie Losung? Der Ort, an dem wir uns das Ja-Wort geben – ein Wort, klein.",
    "color:" + GOLD + ";font-weight:bold;font-family:sans-serif;font-size:14px",
    "font-family:monospace;font-size:13px;color:" + NAVY,
    "font-family:sans-serif;font-size:12px;color:#728492"
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
