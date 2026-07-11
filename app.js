// ============================================================
// CONFIG — les 2 seules valeurs à remplir avant la mise en ligne
// (voir GUIDE-GOOGLE-SHEET.md et GUIDE-DEPLOIEMENT.md)
// ============================================================
const CONFIG = {
  WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbw5A2Q9Q-ErMxAg7B-0aeqeRat_uGgXQkLNxZSRQQPJkv3dSA1fAtoxKQNgXKN3MrMI/exec",
  PIXEL_ID: "",      // Pixel Meta (vide = désactivé)
};

// ---------- Pixel Meta ----------
if (CONFIG.PIXEL_ID) {
  !function (f, b, e, v, n, t, s) {
    if (f.fbq) return; n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0";
    n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", CONFIG.PIXEL_ID);
  fbq("track", "PageView");
}

// ---------- Scroll du CTA hero vers le formulaire ----------
document.querySelector(".cta-hero").addEventListener("click", () => {
  document.getElementById("registro").scrollIntoView({ behavior: "smooth" });
  document.getElementById("nombre").focus({ preventScroll: true });
});

// ---------- Formulaire ----------
const form = document.getElementById("form-fundador");
const msg = document.getElementById("form-msg");

function showErr(id, on) {
  document.getElementById(`err-${id}`).hidden = !on;
}

function utm(name) {
  return new URLSearchParams(location.search).get(name) || "";
}

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  msg.textContent = "";
  msg.className = "";

  // honeypot : les bots remplissent le champ caché → on fait semblant
  if (document.getElementById("hp").value) {
    form.outerHTML = '<p class="exito">¡Listo! 🏆</p>';
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const telRaw = document.getElementById("whatsapp").value.replace(/[\s\-().]/g, "");
  const consent = document.getElementById("consent").checked;

  const emailOk = /.+@.+\..+/.test(email);
  const telOk = /^\d{8,9}$/.test(telRaw);
  showErr("email", !emailOk);
  showErr("whatsapp", !telOk);
  showErr("consent", !consent);
  if (!emailOk || !telOk || !consent) return;

  if (!CONFIG.WEBHOOK_URL) {
    console.warn("GanaYa: WEBHOOK_URL no configurada (ver GUIDE-GOOGLE-SHEET.md)");
    msg.textContent = "Ups, algo falló. Inténtalo de nuevo más tarde.";
    msg.className = "err";
    return;
  }

  const payload = {
    nombre,
    email,
    whatsapp: "+56" + telRaw,
    source: utm("utm_source"),
    campaign: utm("utm_campaign"),
    ua: navigator.userAgent.slice(0, 120),
  };

  const btn = form.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Enviando…";

  try {
    // Content-Type text/plain : évite le préflight CORS refusé par Apps Script
    const res = await fetch(CONFIG.WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    if (CONFIG.PIXEL_ID) fbq("track", "Lead");
    form.outerHTML =
      '<p class="exito">¡Listo! Eres parte de los fundadores.<br>Te avisaremos primero. 🏆</p>';
  } catch (e) {
    console.error("GanaYa submit:", e);
    msg.textContent = "Ups, algo falló. Inténtalo de nuevo.";
    msg.className = "err";
    btn.disabled = false;
    btn.textContent = "Reservar mi lugar";
  }
});
