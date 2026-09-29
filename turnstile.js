// Cloudflare Turnstile pour la liste d'attente (28/09/2026). Le webhook Apps Script vérifie le
// jeton chez Cloudflare avant toute écriture (landing/webhook-code.gs) ; doc :
// docs/securite/2026-09-28-anti-robots.md dans le dépôt gana-ya.
//
// Un widget invisible par formulaire (action lista, voto ou comuna) : il n'apparaît que si
// Cloudflare veut un clic. Un jeton ne sert qu'à UN envoi : jeton() le remet à un seul appelant,
// renovar() en demande un neuf après l'envoi. Cette page ne bloque jamais d'elle-même : widget
// en panne, API injoignable ou attente de plus de 15 s, jeton() rend null et le formulaire
// envoie sans jeton ; le webhook décide selon son mode (observar ou exigir).
//
// Rendu différé (29/09/2026) : sur iPhone, un défi lancé dans une boîte hors de l'écran ou dans
// une section encore transparente (effet d'apparition) ne donnait pas de jeton avant plusieurs
// dizaines de secondes, alors que l'app, qui rend son widget visible, l'obtient en 3 s. Le script
// Cloudflare se charge dès l'ouverture, mais chaque widget n'est rendu que quand sa boîte est à
// l'écran et opaque, ou au premier jeton() si la personne envoie avant.
(function () {
  // Clé de site publique du widget « GanaYa app », déclaré aussi pour gana-ya.com.
  var SITEKEY = "0x4AAAAAAFGwEIUTazXsWliG";
  var SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  // Attente maximale d'un jeton, sauf pendant un défi visible que la personne résout.
  var ESPERA_MS = 15000;
  var carga = null;

  function cargar() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (!carga) {
      carga = new Promise(function (resolve, reject) {
        var s = document.querySelector('script[src="' + SCRIPT + '"]');
        var reloj = setTimeout(function () { reject(new Error("turnstile")); }, ESPERA_MS);
        function listo() { clearTimeout(reloj); window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile")); }
        function error() { clearTimeout(reloj); reject(new Error("turnstile")); }
        if (!s) {
          s = document.createElement("script");
          s.src = SCRIPT;
          s.async = true;
          document.head.appendChild(s);
        }
        s.addEventListener("load", listo);
        s.addEventListener("error", error);
      }).catch(function (e) {
        // Un échec ou un délai de chargement (réseau, bloqueur) ne condamne pas les essais suivants.
        carga = null;
        throw e;
      });
    }
    return carga;
  }

  // Aucun parent transparent : la section est apparue (effet d'apparition fini).
  function opaca(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (parseFloat(getComputedStyle(n).opacity) < 1) return false;
    }
    return true;
  }

  function crear(caja, accion) {
    var token = null, id = null, fallo = false, interactivo = false, esperas = [];
    // Rendu différé : demandé ou fait, boîte à l'écran, vérification en attente, temps transparent, observateur.
    var pedido = false, enPantalla = false, reloj = null, transparente = 0, io = null;

    // Un jeton neuf va au premier envoi qui attend, sinon il est gardé pour le suivant.
    function recibir(t) {
      fallo = false;
      var espera = esperas.shift();
      if (espera) espera(t);
      else token = t;
    }
    // Panne : tous les envois en attente partent sans jeton.
    function fallar() {
      token = null;
      fallo = true;
      interactivo = false;
      esperas.slice().forEach(function (resolver) { resolver(null); });
    }
    function montar() {
      fallo = false;
      cargar().then(function (api) {
        id = api.render(caja, {
          sitekey: SITEKEY,
          action: accion,
          language: "es",
          theme: "light",
          size: "flexible",
          appearance: "interaction-only",
          callback: recibir,
          "expired-callback": function () { token = null; },
          "error-callback": fallar,
          "unsupported-callback": fallar,
          "before-interactive-callback": function () { interactivo = true; },
          "after-interactive-callback": function () { interactivo = false; },
        });
      }).catch(fallar);
    }
    // Un seul rendu, maintenant : boîte prête, ou jeton() demandé avant (où que soit la boîte).
    function iniciar() {
      if (pedido) return;
      pedido = true;
      clearTimeout(reloj);
      if (io) io.disconnect();
      montar();
    }
    // Boîte à l'écran : rendu quand elle est opaque (effet d'apparition fini, ou plus de 3 s) et
    // l'API chargée. L'écran est revérifié à chaque étape : l'API peut arriver après que la
    // personne a fait défiler la page, et la boîte ne doit pas être rendue hors de l'écran.
    function intentar() {
      reloj = null;
      if (pedido || !enPantalla) return;
      if (!window.turnstile) {
        // Chargement en échec ou trop long : nouvel essai tant que la boîte reste à l'écran,
        // sinon à la prochaine entrée à l'écran ; jeton() reste seul à forcer le rendu.
        cargar().then(intentar, function () {
          if (enPantalla && !pedido && !reloj) reloj = setTimeout(intentar, 150);
        });
        return;
      }
      transparente += 150;
      if (opaca(caja) || transparente > 3000) iniciar();
      else reloj = setTimeout(intentar, 150);
    }

    if (!caja) {
      return { jeton: function () { return Promise.resolve(null); }, pendiente: function () { return false; }, renovar: function () {} };
    }
    // Le script Cloudflare se charge tout de suite, sans rendre de widget ; un échec sera retenté au rendu.
    cargar().catch(function () {});
    if (typeof IntersectionObserver !== "function") {
      iniciar();
    } else {
      io = new IntersectionObserver(function (entradas) {
        enPantalla = entradas.some(function (e) { return e.isIntersecting; });
        if (enPantalla && !reloj && !pedido) reloj = setTimeout(intentar, 150);
      });
      io.observe(caja);
    }
    return {
      // Le jeton, remis à ce seul appelant ; null si le widget est en panne ou trop lent.
      jeton: function () {
        // Envoi avant que la boîte soit apparue : le widget se rend maintenant.
        iniciar();
        if (token) {
          var t = token;
          token = null;
          return Promise.resolve(t);
        }
        if (fallo) {
          // Nouvel essai pour le prochain envoi, sans faire attendre celui-ci.
          if (id === null) montar();
          else if (window.turnstile) { fallo = false; window.turnstile.reset(id); }
          return Promise.resolve(null);
        }
        return new Promise(function (resolve) {
          var reloj = null, hecho = false;
          function resolver(valor) {
            if (hecho) return;
            hecho = true;
            clearTimeout(reloj);
            var i = esperas.indexOf(resolver);
            if (i >= 0) esperas.splice(i, 1);
            resolve(valor);
          }
          function vigilar() {
            reloj = setTimeout(function () {
              // Défi visible : la personne est en train de le résoudre, on attend encore.
              if (interactivo) vigilar();
              else resolver(null);
            }, ESPERA_MS);
          }
          esperas.push(resolver);
          vigilar();
        });
      },
      // Vrai si jeton() va attendre Cloudflare : le formulaire peut le dire à la personne.
      pendiente: function () { return !token && !fallo; },
      // Après chaque envoi : le jeton est consommé, succès ou refus. Jamais pendant un défi
      // visible : la personne le résout et il donnera lui-même le jeton neuf.
      renovar: function () {
        if (interactivo) return;
        token = null;
        if (id !== null && window.turnstile) window.turnstile.reset(id);
      },
    };
  }

  window.GanaYaTurnstile = { crear: crear };
})();
