// Verpackt die lesbare Quelle (effects.src.js) als Base64-Blob und
// schreibt die ausgelieferte, verschleierte Datei js/effects.js.
//   Aufruf:  node .github/easter-egg/build.js
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "..");
const src = fs.readFileSync(path.join(__dirname, "effects.src.js"), "utf8");
const blob = Buffer.from(src, "utf8").toString("base64");

// Lade-Stub: dekodiert den Blob (UTF-8-sicher) und führt ihn aus.
// Im Browser-Sources-Tab ist hier nur der Base64-String sichtbar.
const out =
  "(function(){var _b=\"" + blob + "\";" +
  "try{var _s=new TextDecoder().decode(Uint8Array.from(atob(_b)," +
  "function(c){return c.charCodeAt(0);}));(new Function(_s))();}" +
  "catch(_){}})();\n";

fs.writeFileSync(path.join(root, "js", "effects.js"), out);
console.log("js/effects.js neu erzeugt (" + out.length + " Bytes).");
