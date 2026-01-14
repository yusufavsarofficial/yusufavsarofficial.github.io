(function(){
  const nav = document.getElementById("siteNav");
  const toggle = document.getElementById("navToggle");

  if (toggle && nav){
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
    });
  }

  // Aktif menü
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll('a[data-nav]').forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.classList.add("active");
  });

  // Dropdown: dış tık + ESC ile kapat
  const dropdowns = Array.from(document.querySelectorAll(".nav details"));
  function closeAll(except){
    dropdowns.forEach(d => { if (d !== except) d.removeAttribute("open"); });
  }
  dropdowns.forEach(d => {
    d.addEventListener("toggle", () => { if (d.open) closeAll(d); });
  });
  document.addEventListener("click", (e) => {
    const inside = e.target.closest(".nav details");
    if (!inside) closeAll(null);
  });

  // Footer yıl
  const y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  // ===== MINI SIMULASYON MODAL =====
  const overlay = document.getElementById("miniModalOverlay");
  const openBtn = document.getElementById("openMiniModal");
  const closeBtn = document.getElementById("closeMiniModal");

  function openModal(){
    if (!overlay) return;
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden","false");
    document.body.style.overflow = "hidden";
  }
  function closeModal(){
    if (!overlay) return;
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden","true");
    document.body.style.overflow = "";
  }

  if (openBtn) openBtn.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  // overlay dışına tıkla kapat
  if (overlay){
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAll(null);
      closeModal();
    }
  });

  // Tabs
  const tabBtns = Array.from(document.querySelectorAll("[data-tab-btn]"));
  const tabPanels = Array.from(document.querySelectorAll("[data-tab-panel]"));
  function setTab(name){
    tabBtns.forEach(b => b.classList.toggle("active", b.dataset.tabBtn === name));
    tabPanels.forEach(p => p.classList.toggle("active", p.dataset.tabPanel === name));
  }
  tabBtns.forEach(b => b.addEventListener("click", () => setTab(b.dataset.tabBtn)));
  if (tabBtns.length) setTab(tabBtns[0].dataset.tabBtn);

  // ===== 1) Phishing Avcısı (Farkındalık) =====
  const phishText = document.getElementById("phishText");
  const phishFeedback = document.getElementById("phishFeedback");
  const phishNext = document.getElementById("phishNext");
  const phishScore = document.getElementById("phishScore");

  const bank = [
    {
      t: "“Hesabınız askıya alınacak. 30 dakika içinde doğrulamazsanız erişiminiz kapatılacak. Link: guvenlik-dogrulama[.]support”",
      a: "phish",
      why: "Acil süre baskısı + şüpheli alan adı + link ile doğrulama istemesi tipik phishing işaretidir."
    },
    {
      t: "“Toplantı 14:30’da. Ajanda ekte. (Kurumsal e-posta imzası ve dahili numara mevcut.)”",
      a: "safe",
      why: "Baskı/ödül tehdidi yok, link yok, tutarlı kurumsal bilgi var. Yine de ekleri doğrulamak iyi pratiktir."
    },
    {
      t: "“Kargonuz dağıtıma çıktı. Teslimat için kimlik doğrulama: kargo-teslimat[.]click”",
      a: "phish",
      why: "Beklenmeyen kargo mesajı + şüpheli uzantı + kimlik doğrulama bahanesi risklidir."
    },
    {
      t: "“Şifre politikası güncellendi: en az 12 karakter ve MFA zorunlu. Detaylar intranet portalında.”",
      a: "safe",
      why: "Kurumsal politika duyurusu; link yerine resmi intranet/portal referansı verilmiş."
    },
    {
      t: "“Maaş bordronuz hazır. Hemen giriş yapın: bordro-giris[.]online”",
      a: "phish",
      why: "Bordro gibi hassas konu + belirsiz alan adı. Resmi İK portalı dışında linke girilmemeli."
    }
  ];

  let idx = 0, score = 0, total = 0;

  function render(){
    if (!phishText) return;
    const q = bank[idx];
    phishText.textContent = q.t;
    if (phishFeedback){
      phishFeedback.className = "feedback";
      phishFeedback.innerHTML = "<strong>Seçimini yap:</strong> ‘Phishing’ mi ‘Güvenli’ mi?";
    }
  }

  function setScore(){
    if (phishScore) phishScore.textContent = `${score}/${total}`;
  }

  function answer(type){
    const q = bank[idx];
    total++;
    const ok = (type === q.a);
    if (ok) score++;
    setScore();

    if (phishFeedback){
      phishFeedback.className = "feedback " + (ok ? "ok" : "bad");
      phishFeedback.innerHTML =
        (ok ? "<strong>Doğru.</strong> " : "<strong>Yanlış.</strong> ") +
        q.why;
    }
  }

  const btnPhish = document.getElementById("btnPhish");
  const btnSafe  = document.getElementById("btnSafe");

  if (btnPhish) btnPhish.addEventListener("click", () => answer("phish"));
  if (btnSafe)  btnSafe.addEventListener("click", () => answer("safe"));

  if (phishNext){
    phishNext.addEventListener("click", () => {
      idx = (idx + 1) % bank.length;
      render();
    });
  }

  // İlk skor ve soru
  setScore();
  render();

  // ===== 2) Şifre Gücü Laboratuvarı =====
  const pwInput = document.getElementById("pwInput");
  const pwBar   = document.getElementById("pwBar");
  const pwLabel = document.getElementById("pwLabel");
  const pwList  = document.getElementById("pwTipsList");

  function strength(pw){
    let s = 0;
    if (!pw) return {pct:0, label:"Boş", tips:["En az 12 karakter kullan."]};

    const tips = [];
    if (pw.length >= 12) s += 30; else tips.push("En az 12 karaktere çıkar.");
    if (pw.length >= 16) s += 10;

    if (/[a-z]/.test(pw)) s += 15; else tips.push("Küçük harf ekle.");
    if (/[A-Z]/.test(pw)) s += 15; else tips.push("Büyük harf ekle.");
    if (/[0-9]/.test(pw)) s += 15; else tips.push("Rakam ekle.");
    if (/[^A-Za-z0-9]/.test(pw)) s += 15; else tips.push("Sembol ekle (örn. ! ? * -).");

    // Basit tekrar / desen kırpma
    if (/(\w)\1\1/.test(pw)) { s -= 10; tips.push("Aynı karakteri ardışık tekrarlama."); }
    if (/1234|abcd|qwer|password|sifre/i.test(pw)) { s -= 20; tips.push("Tahmin edilebilir desen/kelime kullanma."); }

    s = Math.max(0, Math.min(100, s));
    let label = "Zayıf";
    if (s >= 70) label = "Güçlü";
    else if (s >= 45) label = "Orta";

    if (tips.length === 0) tips.push("Gayet iyi. MFA kullanmayı da unutma.");
    return {pct:s, label, tips};
  }

  function renderPw(){
    if (!pwInput) return;
    const v = pwInput.value;
    const r = strength(v);

    if (pwBar) pwBar.style.width = r.pct + "%";
    if (pwLabel) pwLabel.textContent = `${r.label} (${r.pct}%)`;

    if (pwList){
      pwList.innerHTML = r.tips.map(t => `<li>${t}</li>`).join("");
    }
  }

  if (pwInput){
    pwInput.addEventListener("input", renderPw);
    renderPw();
  }
})();
