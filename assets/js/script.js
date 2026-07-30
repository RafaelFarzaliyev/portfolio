/* Rəfael Fərzəliyev — Portfolio interactions
   - Theme toggle (persisted in localStorage)
   - Language toggle AZ/EN, driven by assets/js/content.js (persisted in localStorage)
   - Mobile navigation
   - Scroll-reveal for sections
   - Active nav-link highlighting via IntersectionObserver
   No backend, no external runtime dependencies — safe for static hosting. */

(function () {
  "use strict";

  var body = document.body;
  var THEME_KEY = "rf-portfolio-theme";
  var LANG_KEY = "rf-portfolio-lang";

  /* ---------------- Small path-lookup helper for content.js ----------------
     Resolves strings like "experience.items[0].bullets[1]" against an object. */
  function resolvePath(obj, path) {
    var parts = path.replace(/\[(\d+)\]/g, ".$1").split(".").filter(Boolean);
    var current = obj;
    for (var i = 0; i < parts.length; i++) {
      if (current == null) return undefined;
      current = current[parts[i]];
    }
    return current;
  }

  /* ---------------- Theme toggle ---------------- */
  var themeToggle = document.getElementById("theme-toggle");

  function applyTheme(theme) {
    body.setAttribute("data-theme", theme);
    if (themeToggle) {
      themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    }
  }

  function getPreferredTheme() {
    try {
      var stored = localStorage.getItem(THEME_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch (e) { /* localStorage unavailable, fall through */ }
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  }

  applyTheme(getPreferredTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var current = body.getAttribute("data-theme");
      var next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
    });
  }

  /* ---------------- Language toggle ---------------- */
  var langButtons = document.querySelectorAll(".lang-btn");
  var i18nEls = document.querySelectorAll("[data-i18n]");
  var i18nAriaEls = document.querySelectorAll("[data-i18n-aria]");
  var metaDescription = document.getElementById("meta-description");
  var ogTitle = document.getElementById("og-title");
  var ogDescription = document.getElementById("og-description");

  /* ---------------- Dynamic list rendering (certifications & languages) ----------------
     These two sections come from arrays in content.js whose length can change (e.g. a new
     certificate or a new language added via the admin tool), so they're built with DOM APIs
     instead of fixed data-i18n indices, then re-built whenever the language is switched. */
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderCertifications(content) {
    var list = document.getElementById("cert-list");
    if (!list || !content.certifications) return;
    var items = content.certifications.items || [];
    list.innerHTML = items.map(function (item) {
      return (
        '<div class="cert-card">' +
          '<div class="cert-seal" aria-hidden="true">' + escapeHtml(item.seal) + '</div>' +
          '<div>' +
            '<h3>' + escapeHtml(item.title) + '</h3>' +
            '<span class="issuer">' + escapeHtml(item.issuer) + '</span>' +
            '<p>' + escapeHtml(item.description) + '</p>' +
          '</div>' +
        '</div>'
      );
    }).join("");
  }

  function renderLanguages(content) {
    var list = document.getElementById("lang-list");
    if (!list || !content.skills) return;
    var langs = content.skills.languages || [];
    list.innerHTML = langs.map(function (lang) {
      return (
        '<li class="lang-bar-row">' +
          '<span>' + escapeHtml(lang.name) + '</span>' +
          '<span class="lang-level">' + escapeHtml(lang.level) + '</span>' +
        '</li>'
      );
    }).join("");
  }

  function applyLanguage(lang) {
    var content = window.SITE_CONTENT && window.SITE_CONTENT[lang];
    if (!content) return; // content.js failed to load — leave the pre-rendered markup as-is

    i18nEls.forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var value = resolvePath(content, key);
      if (typeof value === "string") el.textContent = value;
    });

    renderCertifications(content);
    renderLanguages(content);

    i18nAriaEls.forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      var value = resolvePath(content, key);
      if (typeof value === "string") el.setAttribute("aria-label", value);
    });

    document.documentElement.setAttribute("lang", lang);
    if (content.meta) {
      document.title = content.meta.title;
      if (metaDescription) metaDescription.setAttribute("content", content.meta.description);
      if (ogTitle) ogTitle.setAttribute("content", content.meta.title);
      if (ogDescription) ogDescription.setAttribute("content", content.meta.description);
    }

    langButtons.forEach(function (btn) {
      var isActive = btn.getAttribute("data-lang") === lang;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
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

  /* ---------------- Mobile navigation ---------------- */
  var menuToggle = document.getElementById("menu-toggle");
  var mobileNav = document.getElementById("mobile-nav");

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", function () {
      var isOpen = mobileNav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileNav.classList.contains("open")) {
        mobileNav.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.focus();
      }
    });
  }

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------- Active nav-link highlighting ---------------- */
  var sections = document.querySelectorAll("main section[id]");
  var navLinks = document.querySelectorAll(".nav-links a, .mobile-nav a");

  function setActiveLink(id) {
    navLinks.forEach(function (link) {
      var match = link.getAttribute("href") === "#" + id;
      link.classList.toggle("active", match);
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActiveLink(entry.target.id);
          }
        });
      },
      { threshold: 0.4, rootMargin: "-72px 0px -40% 0px" }
    );
    sections.forEach(function (section) { navObserver.observe(section); });
  }

  /* ---------------- Footer year ---------------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
