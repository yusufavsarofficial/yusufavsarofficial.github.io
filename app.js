/* =========================
   DROPDOWN (ATATÜRK MENÜSÜ)
   ========================= */

document.addEventListener("DOMContentLoaded", () => {

  const dropdown = document.querySelector(".dropdown");
  const dropdownBtn = document.querySelector("[data-dropdown-btn]");

  if (dropdown && dropdownBtn) {

    dropdownBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropdown.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
      }
    });
  }

  /* =========================
     AKTİF MENÜ BELİRLEME
     ========================= */

  const current = window.location.pathname.replace(/\/+$/, "");

  document.querySelectorAll(".nav a").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;

    const linkPath = new URL(href, window.location.origin)
      .pathname.replace(/\/+$/, "");

    if (linkPath === current) {
      a.classList.add("active");
    }
  });

  /* =========================
     TTS (OKU BUTONU)
     ========================= */

  let utterance;
  let speaking = false;

  function getReadableText() {
    const main = document.querySelector("main") || document.body;
    return main.innerText.replace(/\s+/g, " ").trim();
  }

  function toggleRead() {
    if (speaking) {
      speechSynthesis.cancel();
      speaking = false;
      btn.innerText = "🔊 Oku";
      return;
    }

    utterance = new SpeechSynthesisUtterance(getReadableText());
    utterance.lang = "tr-TR";
    utterance.rate = 1.15;

    utterance.onend = () => {
      speaking = false;
      btn.innerText = "🔊 Oku";
    };

    speechSynthesis.speak(utterance);
    speaking = true;
    btn.innerText = "⏹ Durdur";
  }

  const btn = document.createElement("button");
  btn.id = "tts-btn";
  btn.innerText = "🔊 Oku";
  btn.onclick = toggleRead;

  Object.assign(btn.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 9999,
    padding: "10px 14px",
    borderRadius: "8px",
    border: "none",
    background: "#cfa24a",
    color: "#000",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
  });

  document.body.appendChild(btn);

});
