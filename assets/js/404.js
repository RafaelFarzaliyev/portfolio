/* 404 page — theme + language (same localStorage keys as the main site), requested-URL
   display and "go back" button. No external dependencies; CSP-safe (no inline handlers). */
(function () {
  "use strict";

  var body = document.body;
  var THEME_KEY = "rf-portfolio-theme";
  var LANG_KEY = "rf-portfolio-lang";

  var I18N = {
    az: {
      title: "404 — Səhifə tapılmadı | Rəfael Fərzəliyev",
      description: "Axtardığınız səhifə tapılmadı. Rəfael Fərzəliyevin portfoliosunun əsas səhifəsinə qayıdın.",
      skip: "Məzmuna keç",
      homeLabel: "Rəfael Fərzəliyev — ana səhifə",
      themeToggleLabel: "Tünd rejimi aç/bağla",
      docket: "Xəta kodu 404 — Sənəd tapılmadı",
      clause: "Maddə 404 — Tapılmadı",
      h1a: "Səhifə",
      h1b: "tapılmadı",
      lede: "Axtardığınız səhifə mövcud deyil, başqa ünvana köçürülüb və ya ünvan səhv yazılıb. Əsas səhifəyə qayıdaraq portfoliomu davam etdirə bilərsiniz.",
      pathLabel: "Sorğu olunan ünvan",
      home: "Əsas səhifəyə qayıt",
      back: "Geri qayıt",
      footer: "Bakı, Azərbaycan. Legal Tech üçün diqqətlə hazırlanıb."
    },
    en: {
      title: "404 — Page not found | Rafael Farzaliyev",
      description: "The page you are looking for was not found. Return to Rafael Farzaliyev's portfolio home page.",
      skip: "Skip to content",
      homeLabel: "Rafael Farzaliyev — home page",
      themeToggleLabel: "Toggle dark mode",
      docket: "Error code 404 — Document not found",
      clause: "Article 404 — Not found",
      h1a: "Page",
      h1b: "not found",
      lede: "The page you are looking for does not exist, has moved to another address, or the URL was mistyped. Head back to the home page to continue exploring my portfolio.",
      pathLabel: "Requested address",
      home: "Back to home page",
      back: "Go back",
      footer: "Baku, Azerbaijan. Carefully built for Legal Tech."
    }
  };

  /* ---------------- Theme ---------------- */
  var themeToggle = document.getElementById("theme-toggle");

  function applyTheme(theme) {
    body.setAttribute("data-theme", theme);
    if (themeToggle) themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  }

  function getPreferredTheme() {
    try {
      var stored = localStorage.getItem(THEME_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch (e) { /* ignore */ }
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  applyTheme(getPreferredTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = body.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
    });
  }

  /* ---------------- Language ---------------- */
  var langButtons = document.querySelectorAll(".lang-btn");

  function applyLanguage(lang) {
    var t = I18N[lang];
    if (!t) return;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = t[el.getAttribute("data-i18n")];
      if (typeof v === "string") el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var v = t[el.getAttribute("data-i18n-aria")];
      if (typeof v === "string") el.setAttribute("aria-label", v);
    });

    document.documentElement.setAttribute("lang", lang);
    document.title = t.title;
    var meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", t.description);

    langButtons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-lang") === lang ? "true" : "false");
    });
  }

  function getPreferredLanguage() {
    try {
      var stored = localStorage.getItem(LANG_KEY);
      if (stored === "az" || stored === "en") return stored;
    } catch (e) { /* ignore */ }
    return "az";
  }

  applyLanguage(getPreferredLanguage());

  langButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var lang = btn.getAttribute("data-lang");
      applyLanguage(lang);
      try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* ignore */ }
    });
  });

  /* ---------------- Requested URL (textContent only — never innerHTML) ---------------- */
  var pathEl = document.getElementById("nf-path");
  if (pathEl) {
    var shown = location.pathname + location.search;
    try { shown = decodeURIComponent(shown); } catch (e) { /* keep encoded */ }
    pathEl.textContent = shown.length > 120 ? shown.slice(0, 117) + "…" : shown;
  }

  /* ---------------- Back button: history if there is any, otherwise home ---------------- */
  var backBtn = document.getElementById("nf-back");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      var sameSiteReferrer = document.referrer && document.referrer.indexOf(location.origin) === 0;
      if (window.history.length > 1 && sameSiteReferrer) {
        window.history.back();
      } else {
        window.location.href = "./";
      }
    });
  }

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
