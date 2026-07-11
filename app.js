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

// ---------- Scroll des CTA vers le formulaire ----------
function irAlFormulario() {
  document.getElementById("registro").scrollIntoView({ behavior: "smooth" });
  document.getElementById("nombre").focus({ preventScroll: true });
}
document.querySelector(".cta-hero").addEventListener("click", irAlFormulario);
document.querySelector(".cta-sticky").addEventListener("click", irAlFormulario);

// ---------- Sticky CTA : visible après le hero, masqué sur le formulaire ----------
const sticky = document.getElementById("sticky-cta");
const hero = document.querySelector(".hero");
const registro = document.getElementById("registro");
let heroVisible = true;
let formVisible = false;

function refreshSticky() {
  sticky.hidden = heroVisible || formVisible;
}
new IntersectionObserver((entries) => {
  heroVisible = entries[0].isIntersecting;
  refreshSticky();
}, { threshold: 0.05 }).observe(hero);
new IntersectionObserver((entries) => {
  formVisible = entries[0].isIntersecting;
  refreshSticky();
}, { threshold: 0.15 }).observe(registro);

// ---------- Vote premios ----------
const votoMsg = document.getElementById("voto-msg");

function enviarVoto(payload) {
  if (!CONFIG.WEBHOOK_URL) return Promise.reject(new Error("no webhook"));
  return fetch(CONFIG.WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(Object.assign({
      tipo: "voto",
      source: new URLSearchParams(location.search).get("utm_source") || "",
      ua: navigator.userAgent.slice(0, 120),
    }, payload)),
  });
}

document.querySelectorAll(".opcion").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (localStorage.getItem("ganaya_voto")) {
      votoMsg.textContent = "Ya registramos tu voto. ¡Gracias!";
      return;
    }
    document.querySelectorAll(".opcion").forEach((b) => { b.disabled = true; });
    btn.classList.add("elegida");
    enviarVoto({ premio: btn.dataset.premio })
      .then(() => {
        localStorage.setItem("ganaya_voto", btn.dataset.premio);
        votoMsg.textContent = "¡Voto registrado! Regístrate abajo para no perderte el concurso del premio más votado 👇";
      })
      .catch(() => {
        document.querySelectorAll(".opcion").forEach((b) => { b.disabled = false; });
        btn.classList.remove("elegida");
        votoMsg.textContent = "Ups, algo falló. Inténtalo de nuevo.";
        votoMsg.style.color = "#C0392B";
      });
  });
});

document.getElementById("btn-idea").addEventListener("click", () => {
  const idea = document.getElementById("otra-idea").value.trim();
  if (!idea) return;
  enviarVoto({ premio: "(otra idea)", otra_idea: idea })
    .then(() => {
      document.getElementById("otra-idea").value = "";
      votoMsg.textContent = "¡Gracias por tu idea! Nuestro equipo la revisará.";
    })
    .catch(() => {
      votoMsg.textContent = "Ups, algo falló. Inténtalo de nuevo.";
      votoMsg.style.color = "#C0392B";
    });
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
      '<p class="exito">¡Listo! Tu lugar está reservado.<br>Te avisaremos antes que nadie. 🏆</p>';
  } catch (e) {
    console.error("GanaYa submit:", e);
    msg.textContent = "Ups, algo falló. Inténtalo de nuevo.";
    msg.className = "err";
    btn.disabled = false;
    btn.textContent = "Reservar mi lugar";
  }
});
