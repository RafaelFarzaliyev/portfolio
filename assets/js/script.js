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

  /* ---------------- Dynamic list rendering ----------------
     Every section below is backed by an array in content.js whose length can change
     (a new job, a new certificate, a new project, a new contact method...), so each is
     built with DOM APIs from that array instead of fixed data-i18n indices, then fully
     rebuilt whenever the language is switched. Only the section WRAPPER carries the
     ".reveal" scroll-fade class (see applyTheme/IntersectionObserver below) — individual
     generated items never do, because the fade-in observer only ever runs once at page
     load; an item created later (e.g. after a language toggle) would never be observed
     and would stay stuck invisible if it relied on its own ".reveal" class. */
  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderInto(containerId, items, templateFn) {
    var el = document.getElementById(containerId);
    if (!el) return;
    items = items || [];
    el.innerHTML = items.map(templateFn).join("");
  }

  function renderAboutStats(content) {
    var stats = content.about && content.about.stats;
    renderInto("about-stats", stats, function (stat) {
      return (
        '<div class="stat-card">' +
          '<span class="label">' + escapeHtml(stat.label) + '</span>' +
          '<span class="value">' + escapeHtml(stat.value) + '</span>' +
        '</div>'
      );
    });
  }

  // Shared by both Experience and Education — identical shape: period, title, org, bullets[].
  function renderTimeline(containerId, items) {
    renderInto(containerId, items, function (item) {
      var bullets = (item.bullets || []).map(function (b) {
        return "<li>" + escapeHtml(b) + "</li>";
      }).join("");
      return (
        '<div class="timeline-item">' +
          '<span class="period">' + escapeHtml(item.period) + '</span>' +
          '<h3>' + escapeHtml(item.title) + '</h3>' +
          '<span class="org">' + escapeHtml(item.org) + '</span>' +
          '<ul>' + bullets + '</ul>' +
        '</div>'
      );
    });
  }

  function renderSkillCategories(content) {
    var categories = content.skills && content.skills.categories;
    renderInto("skills-categories", categories, function (cat) {
      var items = (cat.items || []).map(function (i) {
        return "<li>" + escapeHtml(i) + "</li>";
      }).join("");
      return (
        '<div class="skill-card">' +
          '<h3>' + escapeHtml(cat.title) + '</h3>' +
          '<ul>' + items + '</ul>' +
        '</div>'
      );
    });
  }

  function renderCertifications(content) {
    var items = content.certifications && content.certifications.items;
    renderInto("cert-list", items, function (item) {
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
    });
  }

  function renderLanguages(content) {
    var langs = content.skills && content.skills.languages;
    renderInto("lang-list", langs, function (lang) {
      return (
        '<li class="lang-bar-row">' +
          '<span>' + escapeHtml(lang.name) + '</span>' +
          '<span class="lang-level">' + escapeHtml(lang.level) + '</span>' +
        '</li>'
      );
    });
  }

  function renderProjects(content) {
    var items = content.projects && content.projects.items;
    renderInto("project-list", items, function (proj) {
      var tags = (proj.tags || []).map(function (t) {
        return "<span>" + escapeHtml(t) + "</span>";
      }).join("");
      var bullets = (proj.bullets || []).map(function (b) {
        return "<li>" + escapeHtml(b) + "</li>";
      }).join("");
      return (
        '<div class="project-card">' +
          '<span class="clause">' + escapeHtml(proj.tagline) + '</span>' +
          '<h3>' + escapeHtml(proj.itemTitle) + '</h3>' +
          '<p>' + escapeHtml(proj.description) + '</p>' +
          '<div class="project-tags">' + tags + '</div>' +
          '<ul>' + bullets + '</ul>' +
        '</div>'
      );
    });
  }

  // Minimal stroke-icon set matching the site's line-icon language. "default" covers any
  // icon key the admin tool's dropdown doesn't recognise, so a typo never renders blank.
  var CONTACT_ICONS = {
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L7.9 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2Z"/>',
    linkedin: '<path d="M6.5 8.5v9M6.5 5.5v.01M11 17.5v-5c0-1.7 1-3 3-3s3 1.3 3 3v5M11 12.5v5"/>',
    telegram: '<path d="M21 4 3 11.2l6 2.2M21 4l-3 16-6-4.6M21 4 9.6 15.3M9 13.4V18l2.6-2.6"/>',
    instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="3.4"/><circle cx="16.6" cy="7.4" r="0.6" fill="currentColor" stroke="none"/>',
    whatsapp: '<path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',
    facebook: '<path d="M14 21v-7h2.5l.5-3H14V9c0-1 .3-1.7 1.7-1.7H17V4.6C16.7 4.6 15.7 4.5 14.6 4.5 12.2 4.5 10.5 6 10.5 8.7V11H8v3h2.5v7Z"/>',
    github: '<path d="M12 3a9 9 0 0 0-2.8 17.6c.4.1.6-.2.6-.4v-1.6c-2.5.5-3-1.2-3-1.2-.4-1-1-1.3-1-1.3-.8-.6.1-.6.1-.6.9.1 1.4.9 1.4.9.8 1.4 2.1 1 2.6.7.1-.6.3-1 .6-1.2-2-.2-4.1-1-4.1-4.4 0-1 .3-1.8.9-2.4-.1-.2-.4-1.1.1-2.4 0 0 .8-.2 2.5.9a8.6 8.6 0 0 1 4.5 0c1.7-1.1 2.5-.9 2.5-.9.5 1.3.2 2.2.1 2.4.6.6.9 1.4.9 2.4 0 3.4-2.1 4.2-4.1 4.4.3.3.6.8.6 1.7v2.4c0 .2.2.5.6.4A9 9 0 0 0 12 3Z"/>',
    website: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.2 2.3 3.4 5.2 3.4 8.5s-1.2 6.2-3.4 8.5c-2.2-2.3-3.4-5.2-3.4-8.5S9.8 5.8 12 3.5Z"/>',
    x: '<path d="M5 5l14 14M19 5 5 19"/>',
    "default": '<path d="M9 15l6-6M9.5 6.5h5A3.5 3.5 0 0 1 18 10a3.5 3.5 0 0 1-3.5 3.5H13M14.5 17.5h-5A3.5 3.5 0 0 1 6 14a3.5 3.5 0 0 1 3.5-3.5H11"/>'
  };

  function renderContactMethods(content) {
    var methods = content.contact && content.contact.methods;
    renderInto("contact-methods", methods, function (m) {
      var glyph = CONTACT_ICONS[m.icon] || CONTACT_ICONS["default"];
      var external = /^https?:\/\//i.test(m.href || "");
      var target = external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return (
        '<a href="' + escapeHtml(m.href) + '"' + target + '>' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' + glyph + '</svg>' +
          '<span><span class="clabel">' + escapeHtml(m.label) + '</span><span>' + escapeHtml(m.value) + '</span></span>' +
        '</a>'
      );
    });
  }

  function applyLanguage(lang) {
    var content = window.SITE_CONTENT && window.SITE_CONTENT[lang];
    if (!content) return; // content.js failed to load — leave the pre-rendered markup as-is

    i18nEls.forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      var value = resolvePath(content, key);
      if (typeof value === "string") el.textContent = value;
    });

    renderAboutStats(content);
    renderTimeline("experience-timeline", content.experience && content.experience.items);
    renderTimeline("education-timeline", content.education && content.education.items);
    renderSkillCategories(content);
    renderLanguages(content);
    renderCertifications(content);
    renderProjects(content);
    renderContactMethods(content);

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
