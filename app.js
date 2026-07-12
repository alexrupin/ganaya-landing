// ============================================================
// CONFIG — les 2 seules valeurs à remplir avant la mise en ligne
// (voir GUIDE-GOOGLE-SHEET.md et GUIDE-DEPLOIEMENT.md)
// ============================================================
const CONFIG = {
  WEBHOOK_URL: "https://script.google.com/macros/s/AKfycbw5A2Q9Q-ErMxAg7B-0aeqeRat_uGgXQkLNxZSRQQPJkv3dSA1fAtoxKQNgXKN3MrMI/exec",
  PIXEL_ID: "",      // Pixel Meta (vide = désactivé)
};

// Marque que le JS est chargé : le CSS ne cache les sections à révéler que
// sous html.js, pour ne jamais laisser la page vide sans JavaScript.
document.documentElement.classList.add("js");

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

// ---------- Sélecteur d'indicatif (tous les pays) ----------
// [ISO 3166-1 alpha-2, indicatif]. Nom espagnol via Intl.DisplayNames,
// drapeau dérivé du code ISO. Chili sélectionné par défaut.
const DIAL = [["AF",93],["AL",355],["DZ",213],["AD",376],["AO",244],["AG",1268],["AR",54],["AM",374],["AW",297],["AU",61],["AT",43],["AZ",994],["BS",1242],["BH",973],["BD",880],["BB",1246],["BY",375],["BE",32],["BZ",501],["BJ",229],["BM",1441],["BT",975],["BO",591],["BA",387],["BW",267],["BR",55],["BN",673],["BG",359],["BF",226],["BI",257],["CV",238],["KH",855],["CM",237],["CA",1],["KY",1345],["CF",236],["TD",235],["CL",56],["CN",86],["CO",57],["KM",269],["CG",242],["CD",243],["CK",682],["CR",506],["CI",225],["HR",385],["CU",53],["CW",599],["CY",357],["CZ",420],["DK",45],["DJ",253],["DM",1767],["DO",1809],["EC",593],["EG",20],["SV",503],["GQ",240],["ER",291],["EE",372],["SZ",268],["ET",251],["FJ",679],["FI",358],["FR",33],["GF",594],["PF",689],["GA",241],["GM",220],["GE",995],["DE",49],["GH",233],["GI",350],["GR",30],["GL",299],["GD",1473],["GP",590],["GU",1671],["GT",502],["GN",224],["GW",245],["GY",592],["HT",509],["HN",504],["HK",852],["HU",36],["IS",354],["IN",91],["ID",62],["IR",98],["IQ",964],["IE",353],["IL",972],["IT",39],["JM",1876],["JP",81],["JO",962],["KZ",7],["KE",254],["KI",686],["KP",850],["KR",82],["KW",965],["KG",996],["LA",856],["LV",371],["LB",961],["LS",266],["LR",231],["LY",218],["LI",423],["LT",370],["LU",352],["MO",853],["MG",261],["MW",265],["MY",60],["MV",960],["ML",223],["MT",356],["MH",692],["MQ",596],["MR",222],["MU",230],["MX",52],["FM",691],["MD",373],["MC",377],["MN",976],["ME",382],["MS",1664],["MA",212],["MZ",258],["MM",95],["NA",264],["NR",674],["NP",977],["NL",31],["NC",687],["NZ",64],["NI",505],["NE",227],["NG",234],["NU",683],["MK",389],["NO",47],["OM",968],["PK",92],["PW",680],["PS",970],["PA",507],["PG",675],["PY",595],["PE",51],["PH",63],["PL",48],["PT",351],["PR",1787],["QA",974],["RE",262],["RO",40],["RU",7],["RW",250],["KN",1869],["LC",1758],["VC",1784],["WS",685],["SM",378],["ST",239],["SA",966],["SN",221],["RS",381],["SC",248],["SL",232],["SG",65],["SX",1721],["SK",421],["SI",386],["SB",677],["SO",252],["ZA",27],["SS",211],["ES",34],["LK",94],["SD",249],["SR",597],["SE",46],["CH",41],["SY",963],["TW",886],["TJ",992],["TZ",255],["TH",66],["TL",670],["TG",228],["TO",676],["TT",1868],["TN",216],["TR",90],["TM",993],["TC",1649],["TV",688],["UG",256],["UA",380],["AE",971],["GB",44],["US",1],["UY",598],["UZ",998],["VU",678],["VE",58],["VN",84],["VG",1284],["VI",1340],["YE",967],["ZM",260],["ZW",263],["XK",383]];

const ccSelect = document.getElementById("cc");
(function llenarPaises() {
  const nombres = new Intl.DisplayNames(["es"], { type: "region" });
  const bandera = (iso) =>
    String.fromCodePoint(...[...iso].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
  DIAL.map(([iso, dial]) => ({
    iso, dial,
    nombre: (iso === "XK" ? "Kosovo" : nombres.of(iso)) || iso,
  }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
    .forEach(({ iso, dial, nombre }) => {
      const opt = document.createElement("option");
      opt.value = String(dial);
      opt.dataset.iso = iso;
      opt.textContent = `${bandera(iso)} ${nombre} +${dial}`;
      if (iso === "CL") opt.selected = true;
      ccSelect.appendChild(opt);
    });
})();

// ---------- Reveal au scroll ----------
// Les cartes des grilles se révèlent en cascade (délai croissant).
document.querySelectorAll(".grid-cats .cat, .grid-voto .opcion, .grid-como article")
  .forEach((el) => {
    el.setAttribute("data-reveal", "");
    const i = Array.prototype.indexOf.call(el.parentElement.children, el);
    el.style.transitionDelay = `${Math.min(i * 70, 420)}ms`;
  });

const revelador = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("revelado");
    revelador.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll("[data-reveal]").forEach((el) => revelador.observe(el));

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
        votoMsg.textContent = "¡Voto registrado! Regístrate abajo para no perderte el concurso del premio más votado.";
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
    form.outerHTML = '<p class="exito">¡Listo!</p>';
    return;
  }

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const telRaw = document.getElementById("whatsapp").value.replace(/[\s\-().]/g, "");
  const consent = document.getElementById("consent").checked;

  const emailOk = /.+@.+\..+/.test(email);
  // Longueur générique : l'indicatif est maintenant choisi à part, le numéro
  // local varie de 6 à 12 chiffres selon le pays.
  const telOk = /^\d{6,12}$/.test(telRaw) && (ccSelect.value + telRaw).length <= 15;
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
    whatsapp: `+${ccSelect.value}${telRaw}`,
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
      '<p class="exito">¡Listo! Tu lugar está reservado.<br>Te avisaremos antes que nadie.</p>';
  } catch (e) {
    console.error("GanaYa submit:", e);
    msg.textContent = "Ups, algo falló. Inténtalo de nuevo.";
    msg.className = "err";
    btn.disabled = false;
    btn.textContent = "Reservar mi lugar";
  }
});
