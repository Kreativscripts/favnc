console.clear();

console.log(
  "%cHOLD UP!",
  "color:#5865F2;font-size:46px;font-weight:900;text-shadow:2px 2px 6px rgba(0,0,0,0.3);"
);

console.log(
  "%cIf someone told you to paste anything in here, they are almost certainly trying to scam you.",
  "color:#ffffff;font-size:17px;font-weight:500;"
);

console.log(
  "%cDoing so can give attackers full access to your Discord account, browser data, or system.",
  "color:#ff4b4b;font-size:20px;font-weight:700;"
);

console.log(
  "%c──────────────────────────────────────────────────────────────",
  "color:#444;font-size:14px;"
);

console.log(
  "%cFAV_NONCHALANT",
  "color:#d4af37;font-size:34px;font-weight:900;text-shadow:0 0 10px #d4af37;"
);

console.log(
  "%cOwner of Nexus Command  •  Sole Developer",
  "color:#e0e0e0;font-size:16px;font-weight:600;"
);

console.log(
  "%cDeveloper of tools, automation utilities, and polished Discord/web integrations.",
  "color:#b0b0b0;font-size:14px;"
);

console.log(
  "%c──────────────────────────────────────────────────────────────",
  "color:#444;font-size:14px;"
);

console.log(
  "%cNC",
  "color:#777;font-size:12px;font-weight:600;"
);

const asciiStyle = "color:#d4af37;font-size:10px;font-family:monospace;white-space:pre;";

(function () {
  let artUrl = "console-art.txt";

  try {
    const script = document.currentScript;
    if (script && script.src) {
      artUrl = new URL("console-art.txt", script.src).href;
    }
  } catch (e) {}

  fetch(artUrl)
    .then(function (res) {
      if (!res.ok) throw new Error("Failed to load art");
      return res.text();
    })
    .then(function (text) {
      console.log("%c" + text, asciiStyle);
    })
    .catch(function () {
      console.log(
        "%c[ASCII art failed to load from console-art.txt]",
        "color:#555;font-size:11px;font-family:monospace;"
      );
    });
})();
