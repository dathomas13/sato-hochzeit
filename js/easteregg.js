// ============================================================
// Easter Egg · für die neugierigen Informatiker unter den Gästen 🥚
// ------------------------------------------------------------
// Versteckt, aber findbar – genau dort, wo Entwickler:innen
// zuerst hinschauen: in der Browser-Konsole (DevTools).
//
// Drei Ebenen, von leicht nach schwer:
//   1. Eine stilvolle Konsolen-Begrüßung mit einem Hinweis.
//   2. Ein klassischer Konami-Code (↑ ↑ ↓ ↓ ← → ← → B A),
//      der einen Herz-Konfetti-Regen auslöst.
//   3. Ein kleines window.sato-API zum Herumspielen.
//
// Komplett selbst-enthalten: keine Abhängigkeiten, keine
// Änderungen am Haupt-Stylesheet. Stört die Seite nie und
// lässt sich durch Entfernen dieser Datei rückstandslos lösen.
// ============================================================

(function easterEgg() {
  "use strict";

  // Palette passend zur Seite (siehe css/style.css :root).
  const GOLD = "#6B8BA4";
  const NAVY = "#2C3840";
  const CREAM = "#F7F4EF";

  // ----------------------------------------------------------
  // 1) Konsolen-Begrüßung mit Hinweis
  // ----------------------------------------------------------
  function greet() {
    const banner = [
      "%c❦  Thomas & Sarah  ❦",
      "%c05.09.2026 · Kemnath",
      "",
      "%cHallo, neugieriger Mensch mit offener Konsole. 👋",
      "Du gehörst wohl zu unseren Informatiker-Freunden –",
      "sonst wärst du nicht hier unten.",
      "",
      "%cVersuch mal den Konami-Code:  ↑ ↑ ↓ ↓ ← → ← → B A",
      "Oder tipp:  %csato.help()%c"
    ].join("\n");

    console.log(
      banner,
      `font-family:Georgia,serif;font-size:22px;font-weight:bold;color:${NAVY}`,
      `font-family:Georgia,serif;font-size:13px;letter-spacing:2px;color:${GOLD}`,
      `font-family:sans-serif;font-size:13px;color:${NAVY}`,
      `font-family:sans-serif;font-size:13px;font-weight:bold;color:${GOLD}`,
      `font-family:monospace;font-size:13px;font-weight:bold;color:${NAVY}`,
      "font-family:sans-serif;font-size:13px;color:#728492"
    );
  }

  // ----------------------------------------------------------
  // 2) Herz-Konfetti-Regen (CSS wird einmalig injiziert)
  // ----------------------------------------------------------
  let stylesInjected = false;
  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    const style = document.createElement("style");
    style.textContent = `
      @keyframes sato-fall {
        0%   { transform: translateY(-10vh) rotate(0deg);   opacity: 1; }
        100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
      }
      .sato-confetti {
        position: fixed;
        top: 0;
        z-index: 99999;
        pointer-events: none;
        user-select: none;
        will-change: transform, opacity;
        animation: sato-fall linear forwards;
      }
      .sato-toast {
        position: fixed;
        left: 50%;
        bottom: 2rem;
        transform: translateX(-50%) translateY(150%);
        z-index: 100000;
        padding: 0.85rem 1.6rem;
        background: ${NAVY};
        color: ${CREAM};
        font-family: Georgia, serif;
        font-size: 1rem;
        letter-spacing: 0.5px;
        border-radius: 2px;
        box-shadow: 0 8px 30px rgba(44, 56, 64, 0.25);
        transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        pointer-events: none;
      }
      .sato-toast--show { transform: translateX(-50%) translateY(0); }
      @media (prefers-reduced-motion: reduce) {
        .sato-confetti { animation-duration: 0.01ms !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function rainHearts(count = 60) {
    injectStyles();
    const symbols = ["❤", "❦", "❧", "♥", "✦", "♡"];
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "sato-confetti";
      el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
      el.style.left = Math.random() * 100 + "vw";
      el.style.fontSize = 12 + Math.random() * 26 + "px";
      el.style.color = Math.random() > 0.5 ? GOLD : NAVY;
      el.style.animationDuration = 3 + Math.random() * 3 + "s";
      el.style.animationDelay = Math.random() * 0.8 + "s";
      document.body.appendChild(el);
      // Nach der Animation wieder aufräumen.
      el.addEventListener("animationend", () => el.remove());
    }
  }

  function toast(message) {
    injectStyles();
    const el = document.createElement("div");
    el.className = "sato-toast";
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("sato-toast--show"));
    setTimeout(() => {
      el.classList.remove("sato-toast--show");
      setTimeout(() => el.remove(), 600);
    }, 3500);
  }

  function celebrate(reason) {
    rainHearts();
    toast(reason || "Ihr habt das Easter Egg gefunden! 🎉");
    console.log(
      "%c🎉 Achievement unlocked: Code-Knacker%c\nDanke, dass ihr so genau hinschaut. – Thomas & Sarah",
      `color:${GOLD};font-size:15px;font-weight:bold;font-family:sans-serif`,
      `color:${NAVY};font-size:13px;font-family:sans-serif`
    );
  }

  // ----------------------------------------------------------
  // 3) Konami-Code-Erkennung
  // ----------------------------------------------------------
  const KONAMI = [
    "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
    "b", "a"
  ];
  let progress = 0;
  document.addEventListener("keydown", (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    progress = key === KONAMI[progress] ? progress + 1 : (key === KONAMI[0] ? 1 : 0);
    if (progress === KONAMI.length) {
      progress = 0;
      celebrate("Konami-Code! Ihr Profis. 💍");
    }
  });

  // ----------------------------------------------------------
  // window.sato · kleines Spiel-API für die Konsole
  // ----------------------------------------------------------
  window.sato = {
    help() {
      console.log(
        [
          "%csato · Konsolen-Befehle",
          "%c  sato.confetti()   – Herz-Konfetti-Regen",
          "  sato.story()      – wie alles begann",
          "  sato.daysLeft()   – Tage bis zur Hochzeit",
          "",
          "Tipp: Es gibt auch noch den Konami-Code. 😉"
        ].join("\n"),
        `color:${NAVY};font-size:15px;font-weight:bold;font-family:sans-serif`,
        `color:${GOLD};font-family:monospace;font-size:13px`
      );
      return "❦";
    },
    confetti() {
      celebrate("Konfetti auf Bestellung. 🎊");
      return "❤";
    },
    story() {
      console.log(
        "%cZehn Jahre bis zum Antrag, elf bis zum Ja-Wort.\n" +
          "Manche Dinge brauchen eben ihre Laufzeit – O(Liebe). ❤",
        `color:${NAVY};font-size:13px;font-style:italic;font-family:Georgia,serif`
      );
      return "❤";
    },
    daysLeft() {
      const wedding = new Date("2026-09-05T13:30:00");
      const days = Math.ceil((wedding - Date.now()) / 86400000);
      const msg = days > 0
        ? `Noch ${days} Tage bis zum großen Tag! 💍`
        : "Heute wird gefeiert! 🥂";
      console.log(`%c${msg}`, `color:${GOLD};font-size:14px;font-weight:bold`);
      return days;
    }
  };

  // Begrüßung erst nach dem Laden, damit sie nicht im Lärm untergeht.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", greet);
  } else {
    greet();
  }
})();
